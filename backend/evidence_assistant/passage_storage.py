"""Owner-scoped durable paper review records with input/quote/snapshot binding."""
import json
import sqlite3
import time
import uuid
from pathlib import Path
from .corpus import canonical, sha
from .passage_review import PaperReview, HistoricalPaperReview, PaperRequest
from .papers import load_by_fingerprint
from .papers import eligibility
from .freeze_sources import publication_status
from datetime import datetime
from contract_fields import require_complete
from .storage import ReviewError

class PaperStore:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS paper_reviews (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, subject TEXT NOT NULL, key TEXT NOT NULL, input TEXT NOT NULL, input_hash TEXT NOT NULL, status TEXT NOT NULL, created REAL NOT NULL, output TEXT, output_hash TEXT, error TEXT, UNIQUE(tenant,subject,key))')
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10); db.row_factory = sqlite3.Row
        return db
    def create(self, actor, key, payload):
        raw = canonical(PaperRequest.model_validate(payload).model_dump())
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute("UPDATE paper_reviews SET status='failed',error='review_interrupted' WHERE status='running' AND created<?", (time.time() - 150,))
            old = db.execute('SELECT * FROM paper_reviews WHERE tenant=? AND subject=? AND key=?', (*actor, key)).fetchone()
            if old:
                if old['input_hash'] != sha(raw): raise ReviewError('idempotency_conflict')
                return old['id'], False
            if db.execute("SELECT COUNT(*) FROM paper_reviews WHERE status='running'").fetchone()[0] >= 1:
                raise ReviewError('paper_review_capacity', 429)
            run_id = uuid.uuid4().hex
            db.execute("INSERT INTO paper_reviews(id,tenant,subject,key,input,input_hash,status,created) VALUES(?,?,?,?,?,?,'running',?)", (run_id, *actor, key, raw, sha(raw), time.time()))
        return run_id, True
    @staticmethod
    def bind(row, output):
        value = (HistoricalPaperReview if output.get('contract_version') == 'paper-review/0.1.0' else PaperReview).model_validate(output)
        require_complete(value)
        request = json.loads(row['input'])
        if sha(row['input']) != row['input_hash'] or value.input_sha256 != row['input_hash'] or value.run_id != row['id'] or value.text != request['text']:
            raise ReviewError('paper_review_binding_failure')
        try: papers, fingerprint = load_by_fingerprint(value.snapshot_sha256)
        except (OSError, ValueError): raise ReviewError('paper_snapshot_unavailable_or_changed')
        if value.snapshot_sha256 != fingerprint: raise ReviewError('paper_snapshot_unavailable_or_changed')
        for statement in value.statements:
            traces = [c for c in statement.citations if c.role == 'assessment_trace']
            if len(traces) != 1 or traces[0].source_id != 'review:' + value.run_id or sha(traces[0].excerpt) != traces[0].source_sha256:
                raise ReviewError('paper_trace_binding_failure')
            for c in statement.citations:
                if c.role == 'assessment_trace': continue
                if c.source_id not in request['paper_ids'] or c.source_id not in papers: raise ReviewError('paper_citation_binding_failure')
                paper = papers[c.source_id]
                if c.kind != 'paper_passage' or c.source_sha256 != paper['raw_sha256'] or c.url != paper['url']:
                    raise ReviewError('paper_citation_binding_failure')
                if c.retraction_status != publication_status(paper['metadata']): raise ReviewError('paper_publication_binding_failure')
                if c.role in ('supports', 'contradicts') and eligibility(paper, now=datetime.fromisoformat(value.created_utc)):
                    raise ReviewError('paper_ineligible_decisive_source')
                if c.locator == '/metadata/title':
                    if c.excerpt != paper['title']: raise ReviewError('paper_title_binding_failure')
                else:
                    prefix = '/normalized_abstract/characters/'
                    if not c.locator.startswith(prefix): raise ReviewError('paper_locator_binding_failure')
                    try: start, end = map(int, c.locator[len(prefix):].split(':'))
                    except ValueError: raise ReviewError('paper_locator_binding_failure')
                    if not 0 <= start < end <= len(paper['abstract']) or paper['abstract'][start:end] != c.excerpt:
                        raise ReviewError('paper_quote_binding_failure')
                    if c.role in ('supports', 'contradicts') and paper['abstract'].count(c.excerpt) != 1:
                        raise ReviewError('paper_quote_ambiguous')
        return value
    def finish(self, actor, run_id, output=None, error=None):
        with self.connect() as db:
            row = db.execute("SELECT * FROM paper_reviews WHERE id=? AND tenant=? AND subject=? AND status='running'", (run_id, *actor)).fetchone()
            if not row: raise ReviewError('review_not_running')
            raw = canonical(self.bind(row, output).model_dump()) if output is not None else None
            if raw and len(raw.encode()) > 150000: raise ReviewError('paper_output_limit')
            db.execute('UPDATE paper_reviews SET status=?,output=?,output_hash=?,error=? WHERE id=?', ('succeeded' if raw else 'failed', raw, sha(raw) if raw else None, error, run_id))
    def get(self, actor, run_id):
        with self.connect() as db:
            db.execute("UPDATE paper_reviews SET status='failed',error='review_interrupted' WHERE id=? AND status='running' AND created<?", (run_id, time.time() - 150))
            row = db.execute('SELECT * FROM paper_reviews WHERE id=? AND tenant=? AND subject=?', (run_id, *actor)).fetchone()
        if not row: raise ReviewError('review_not_found', 404)
        if sha(row['input']) != row['input_hash']: raise ReviewError('paper_input_integrity_failure')
        output = None
        if row['status'] == 'succeeded':
            if not row['output'] or sha(row['output']) != row['output_hash']: raise ReviewError('paper_output_integrity_failure')
            output = self.bind(row, json.loads(row['output'])).model_dump()
        return {'run_id': run_id, 'status': row['status'], 'input_sha256': row['input_hash'], 'output': output, 'error_code': row['error']}
