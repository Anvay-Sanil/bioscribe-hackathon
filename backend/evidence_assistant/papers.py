"""Hash-bound PubMed abstract snapshots; publication checks are as-of observations."""
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
from .corpus import canonical, sha
from .freeze_sources import publication_status

ROOT = Path(os.environ.get('BIOSCRIBE_PAPER_SNAPSHOT', str(Path(__file__).with_name('paper_sources') / 'v0.2'))).resolve()

class PlainText(HTMLParser):
    def __init__(self): super().__init__(convert_charrefs=True); self.parts = []
    def handle_data(self, data): self.parts.append(data)
    def handle_starttag(self, tag, attrs):
        if tag in ('p', 'br', 'div'): self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('p', 'div'): self.parts.append('\n')

def plain(value):
    parser = PlainText(); parser.feed(value)
    return '\n'.join(' '.join(line.split()) for line in ''.join(parser.parts).splitlines() if line.strip())

def eligibility(record, now=None):
    metadata = record['metadata']
    status = publication_status(metadata)
    if status != 'not_flagged_in_checked_snapshot': return status
    try: age = ((now or datetime.now(timezone.utc)) - datetime.fromisoformat(record['retrieved_utc'])).total_seconds()
    except (ValueError, TypeError, KeyError): return 'publication_status_unknown'
    if not -300 <= age <= 30 * 86400: return 'publication_status_stale'
    return None

def load(root=ROOT):
    root = Path(root)
    manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    papers = {}
    for name, expected in manifest['files'].items():
        path = root / name
        if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()) or sha(path.read_bytes()) != expected:
            raise ValueError('paper_snapshot_integrity_failure')
        record = json.loads(path.read_text(encoding='utf-8'))
        pmid = record['pmid']; metadata = record['metadata']
        if not pmid.isdecimal() or metadata.get('source') != 'MED' or str(metadata.get('id')) != pmid:
            raise ValueError('paper_identity_mismatch')
        text = plain(metadata.get('abstractText', ''))
        if not text or len(text) > 8000: raise ValueError('paper_abstract_resource_limit')
        key = 'PMID:' + pmid
        if key in papers: raise ValueError('duplicate_paper')
        papers[key] = {**record, 'source_id': key, 'abstract': text, 'raw_sha256': expected,
                       'title': unescape(metadata.get('title', '')), 'url': 'https://pubmed.ncbi.nlm.nih.gov/' + pmid + '/'}
    return papers, sha(canonical(manifest))

def load_by_fingerprint(fingerprint):
    records, actual = load()
    if actual == fingerprint: return records, actual
    for candidate in sorted(ROOT.parent.glob('v*')):
        if candidate == ROOT or not candidate.is_dir() or candidate.is_symlink(): continue
        records, actual = load(candidate)
        if actual == fingerprint: return records, actual
    raise ValueError('paper_snapshot_unavailable_or_changed')
