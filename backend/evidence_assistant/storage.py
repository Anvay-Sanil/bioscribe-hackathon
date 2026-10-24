import json
import sqlite3
import time
import uuid
from pathlib import Path
from .corpus import canonical, sha
from .schemas import Review, ReviewRequest


class ReviewError(ValueError):
    def __init__(self, code, status=409):
        self.code, self.status = code, status
        super().__init__(code)


class ReviewStore:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("CREATE TABLE IF NOT EXISTS evidence_reviews (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, subject TEXT NOT NULL, key TEXT NOT NULL, input TEXT NOT NULL, input_hash TEXT NOT NULL, status TEXT NOT NULL, created REAL NOT NULL, output TEXT, output_hash TEXT, error TEXT, UNIQUE(tenant,subject,key))")

    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        return db

    def create(self, actor, key, payload):
        raw = canonical(ReviewRequest.model_validate(payload).model_dump())
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("UPDATE evidence_reviews SET status='failed', error='review_interrupted' WHERE status='running' AND created<?", (time.time() - 150,))
            old = db.execute("SELECT * FROM evidence_reviews WHERE tenant=? AND subject=? AND key=?", (*actor, key)).fetchone()
            if old:
                if old["input_hash"] != sha(raw): raise ReviewError("idempotency_conflict")
                return old["id"], False
            if db.execute("SELECT COUNT(*) FROM evidence_reviews WHERE status='running'").fetchone()[0] >= 2:
                raise ReviewError("review_capacity", 429)
            run_id = uuid.uuid4().hex
            db.execute("INSERT INTO evidence_reviews(id,tenant,subject,key,input,input_hash,status,created) VALUES(?,?,?,?,?,?,'running',?)", (run_id,*actor,key,raw,sha(raw),time.time()))
        return run_id, True

    @staticmethod
    def bind(row, result):
        review = Review.model_validate(result)
        request = json.loads(row["input"])
        if sha(row["input"]) != row["input_hash"] or review.run_id != row["id"] or review.input_sha256 != row["input_hash"] or review.text != request["text"]:
            raise ReviewError("review_binding_failure")
        for statement in review.statements:
            traces = [c for c in statement.citations if c.role == "assessment_trace"]
            if len(traces) != 1 or traces[0].source_id != "review:" + row["id"] or sha(traces[0].excerpt) != traces[0].source_sha256:
                raise ReviewError("review_trace_binding_failure")
        return review

    def finish(self, actor, run_id, output=None, error=None):
        with self.connect() as db:
            row = db.execute("SELECT * FROM evidence_reviews WHERE id=? AND tenant=? AND subject=? AND status='running'", (run_id,*actor)).fetchone()
            if not row: raise ReviewError("review_not_running")
            raw = None
            if output is not None:
                raw = canonical(self.bind(row, output).model_dump())
                if len(raw.encode()) > 500_000: raise ReviewError("review_output_limit")
            db.execute("UPDATE evidence_reviews SET status=?,output=?,output_hash=?,error=? WHERE id=?", ("succeeded" if raw else "failed",raw,sha(raw) if raw else None,error,run_id))

    def get(self, actor, run_id):
        with self.connect() as db:
            db.execute("UPDATE evidence_reviews SET status='failed',error='review_interrupted' WHERE id=? AND tenant=? AND subject=? AND status='running' AND created<?", (run_id,*actor,time.time()-150))
            row = db.execute("SELECT * FROM evidence_reviews WHERE id=? AND tenant=? AND subject=?", (run_id,*actor)).fetchone()
        if not row: raise ReviewError("review_not_found",404)
        if sha(row["input"]) != row["input_hash"]: raise ReviewError("review_input_integrity_failure")
        output = None
        if row["status"] == "succeeded":
            if not row["output"] or sha(row["output"]) != row["output_hash"]: raise ReviewError("review_output_integrity_failure")
            output = self.bind(row, json.loads(row["output"])).model_dump()
        return {"run_id":run_id,"status":row["status"],"input_sha256":row["input_hash"],"output_sha256":row["output_hash"],"output":output,"error_code":row["error"]}
