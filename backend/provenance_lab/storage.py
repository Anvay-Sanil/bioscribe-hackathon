"""Owner-scoped durable educational jobs with leases, retries and fenced publication."""
import json
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from .engine import canonical, sha, verify
from .schemas import LabRequest, ReplayPackage


class LabError(ValueError):
    def __init__(self, code, status=409):
        super().__init__(code)
        self.code, self.status = code, status


class LabStore:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            db.execute("CREATE TABLE IF NOT EXISTS lab_jobs (id TEXT PRIMARY KEY, tenant TEXT NOT NULL, subject TEXT NOT NULL, key TEXT NOT NULL, mode TEXT NOT NULL, payload TEXT NOT NULL, input_hash TEXT NOT NULL, status TEXT NOT NULL, created REAL NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, lease REAL, attempt TEXT, output TEXT, output_hash TEXT, error TEXT, UNIQUE(tenant,subject,key))")

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            db.execute("BEGIN IMMEDIATE")
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def submit(self, owner, key, mode, payload):
        if mode == "analyze":
            payload = LabRequest.model_validate(payload).model_dump()
        elif mode == "replay":
            payload = verify(payload, recompute=False).model_dump()
        else:
            raise LabError("unsupported_job")
        raw = canonical(payload)
        if len(raw.encode()) > 2_000_000:
            raise LabError("package_too_large", 413)
        with self.connection() as db:
            previous = db.execute("SELECT * FROM lab_jobs WHERE tenant=? AND subject=? AND key=?", (*owner, key)).fetchone()
            if previous:
                if previous["input_hash"] != sha(raw) or previous["mode"] != mode:
                    raise LabError("idempotency_conflict")
                return previous["id"]
            if db.execute("SELECT COUNT(*) FROM lab_jobs WHERE status IN ('queued','running')").fetchone()[0] >= 32:
                raise LabError("queue_full", 429)
            run_id = uuid.uuid4().hex
            db.execute("INSERT INTO lab_jobs(id,tenant,subject,key,mode,payload,input_hash,status,created) VALUES(?,?,?,?,?,?,?,'queued',?)", (run_id,*owner,key,mode,raw,sha(raw),time.time()))
            return run_id

    def claim(self):
        with self.connection() as db:
            now = time.time()
            db.execute("UPDATE lab_jobs SET status=CASE WHEN attempts<2 THEN 'queued' ELSE 'failed' END,error=CASE WHEN attempts<2 THEN NULL ELSE 'worker_interrupted' END,attempt=NULL WHERE status='running' AND lease<?", (now,))
            row = db.execute("SELECT * FROM lab_jobs WHERE status='queued' ORDER BY created LIMIT 1").fetchone()
            if row is None:
                return None
            attempt = uuid.uuid4().hex
            db.execute("UPDATE lab_jobs SET status='running',attempt=?,lease=?,attempts=attempts+1 WHERE id=?", (attempt,now+45,row["id"]))
            return dict(row), attempt

    @staticmethod
    def bind(row, output):
        package = verify(output["package"], recompute=False)
        payload = json.loads(row["payload"])
        if row["mode"] == "analyze":
            if package.run_id != row["id"] or canonical(package.request.model_dump()) != canonical(payload) or output["replay"] is not None:
                raise LabError("input_result_binding_failure")
        else:
            if canonical(package.model_dump()) != canonical(payload) or output["replay"] is None or output["replay"].get("status") != "matched" or output["replay"].get("expected_sha256") != package.result_sha256 or output["replay"].get("actual_sha256") != package.result_sha256:
                raise LabError("replay_binding_failure")

    def finish(self, run_id, attempt, output=None, error=None):
        with self.connection() as db:
            row = db.execute("SELECT * FROM lab_jobs WHERE id=? AND attempt=? AND status='running' AND lease>?", (run_id,attempt,time.time())).fetchone()
            if not row:
                return False
            if sha(row["payload"]) != row["input_hash"]:
                output, error = None, "input_integrity_failure"
            if output is not None:
                self.bind(row, output)
            raw = canonical(output) if output is not None else None
            if raw and len(raw.encode()) > 2_000_000:
                raise LabError("output_limit")
            db.execute("UPDATE lab_jobs SET status=?,output=?,output_hash=?,error=?,lease=NULL WHERE id=?", ("succeeded" if raw else "failed", raw,sha(raw) if raw else None,error,run_id))
            return True

    def get(self, owner, run_id):
        with self.connection() as db:
            row = db.execute("SELECT * FROM lab_jobs WHERE id=? AND tenant=? AND subject=?", (run_id,*owner)).fetchone()
        if not row:
            raise LabError("run_not_found",404)
        if sha(row["payload"]) != row["input_hash"]:
            raise LabError("input_integrity_failure")
        output = None
        if row["status"] == "succeeded":
            if not row["output"] or sha(row["output"]) != row["output_hash"]:
                raise LabError("output_integrity_failure")
            output = json.loads(row["output"])
            self.bind(row,output)
        return dict(run_id=run_id,mode=row["mode"],status=row["status"],created_utc=row["created"],attempts=row["attempts"],request_sha256=row["input_hash"],error_code=row["error"],output=output)

    def cancel(self, owner, run_id):
        self.get(owner,run_id)
        with self.connection() as db:
            db.execute("UPDATE lab_jobs SET status='cancelled',attempt=NULL WHERE id=? AND tenant=? AND subject=? AND status IN ('queued','running')",(run_id,*owner))
        return self.get(owner,run_id)
