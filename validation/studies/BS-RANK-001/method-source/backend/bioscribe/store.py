"""SQLite durable queue for a bounded single-host deployment; fenced attempt commits."""
from contextlib import contextmanager
from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3
import time
import uuid
from .config import LIMITS
from .identity import canonical, digest, parse_input
from .schemas import Artifact, RunRequest, RunView
from .provenance import bundle, verify_bundle


class StoreError(Exception):
    def __init__(self, code, status=409):
        self.code, self.status = code, status


def assert_artifact_request_binding(artifact: Artifact, request: RunRequest, stored_request_sha256: str) -> None:
    """Bind worker output to the durable request, not merely to its own manifest."""
    expected_identity = parse_input(request)
    if expected_identity.request_sha256 != stored_request_sha256 or artifact.input_identity != expected_identity:
        raise StoreError("artifact_input_identity_mismatch")
    expected_hashes = [digest(smiles) for smiles in request.molecules]
    actual_hashes = [item.input_sha256 for item in artifact.chemical_identities]
    # Lists deliberately preserve both ordering and repeated molecular inputs.
    if actual_hashes != expected_hashes:
        raise StoreError("artifact_molecule_input_mismatch")


class Store:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection() as db:
            version=db.execute("PRAGMA user_version").fetchone()[0]
            if version not in (0,1):
                raise RuntimeError("unsupported_database_version")
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY, tenant TEXT NOT NULL, subject TEXT NOT NULL,
                    idempotency TEXT NOT NULL, payload TEXT NOT NULL, input_hash TEXT NOT NULL,
                    created TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
                    attempt_id TEXT, lease_until REAL, error TEXT, artifact TEXT, output_hash TEXT,
                    UNIQUE(tenant,subject,idempotency));
                CREATE TABLE IF NOT EXISTS events (
                    seq INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT NOT NULL,
                    payload TEXT NOT NULL, previous TEXT NOT NULL, hash TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS worker_health (id INTEGER PRIMARY KEY CHECK(id=1), last_seen REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS provenance (run_id TEXT PRIMARY KEY, payload TEXT NOT NULL);
                PRAGMA user_version=1;
            """)

    @contextmanager
    def connection(self):
        db=sqlite3.connect(self.path,timeout=5,isolation_level=None)
        db.row_factory=sqlite3.Row
        db.execute("PRAGMA synchronous=FULL")
        try:
            yield db
        finally:
            db.close()

    @contextmanager
    def transaction(self):
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            try:
                yield db
                db.execute("COMMIT")
            except BaseException:
                db.execute("ROLLBACK")
                raise

    @staticmethod
    def event(db,tenant,subject,action,run_id,detail):
        row=db.execute("SELECT hash FROM events ORDER BY seq DESC LIMIT 1").fetchone()
        previous=row[0] if row else "genesis"
        event={"event_id":uuid.uuid4().hex,"tenant":tenant,"subject":subject,"action":action,"run_id":run_id,"detail":detail,"timestamp":datetime.now(timezone.utc).isoformat()}
        payload=canonical(event)
        db.execute("INSERT INTO events(tenant,payload,previous,hash) VALUES(?,?,?,?)",(tenant,payload,previous,digest(previous+":"+payload)))

    def submit(self,principal,key,payload):
        encoded=canonical(payload)
        input_hash=digest(encoded)
        with self.transaction() as db:
            row=db.execute("SELECT * FROM runs WHERE tenant=? AND subject=? AND idempotency=?",(*principal,key)).fetchone()
            if row:
                if row["input_hash"] != input_hash:
                    raise StoreError("idempotency_conflict")
                return row["id"]
            if db.execute("SELECT COUNT(*) FROM runs WHERE status IN ('queued','running')").fetchone()[0] >= LIMITS["queued_jobs"]:
                raise StoreError("queue_capacity",429)
            run_id=uuid.uuid4().hex
            db.execute("INSERT INTO runs(id,tenant,subject,idempotency,payload,input_hash,created,status) VALUES(?,?,?,?,?,?,?,'queued')",(run_id,*principal,key,encoded,input_hash,datetime.now(timezone.utc).isoformat()))
            self.event(db,*principal,"submitted",run_id,{"input_sha256":input_hash})
            return run_id

    def get(self,principal,run_id):
        with self.connection() as db:
            row=db.execute("SELECT * FROM runs WHERE id=? AND tenant=? AND subject=?",(run_id,*principal)).fetchone()
        if not row:
            raise StoreError("run_not_found",404)
        if digest(row["payload"]) != row["input_hash"]:
            raise StoreError("input_integrity_failure",409)
        artifact=None
        if row["status"] == "succeeded":
            if not row["artifact"] or digest(row["artifact"]) != row["output_hash"]:
                raise StoreError("artifact_integrity_failure",409)
            try:
                artifact=Artifact.model_validate_json(row["artifact"])
                request=RunRequest.model_validate_json(row["payload"])
            except ValueError:
                raise StoreError("artifact_contract_failure",409)
            if artifact.run_id != run_id:
                raise StoreError("artifact_run_mismatch")
            assert_artifact_request_binding(artifact,request,row["input_hash"])
        return RunView(run_id=run_id,status=row["status"],request_sha256=row["input_hash"],created_at=row["created"],attempts=row["attempts"],error_code=row["error"],artifact_sha256=row["output_hash"],artifact=artifact)

    def claim(self, now=None):
        now=time.time() if now is None else now
        with self.transaction() as db:
            db.execute("INSERT INTO worker_health VALUES(1,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen",(now,))
            expired=db.execute("SELECT * FROM runs WHERE status='running' AND lease_until<=?",(now,)).fetchall()
            for row in expired:
                status="failed" if row["attempts"] >= LIMITS["attempts"] else "queued"
                db.execute("UPDATE runs SET status=?,error='worker_lease_expired',attempt_id=NULL,lease_until=NULL WHERE id=?",(status,row["id"]))
                self.event(db,row["tenant"],"system:worker","lease_expired",row["id"],{"status":status})
            if db.execute("SELECT COUNT(*) FROM runs WHERE status='running'").fetchone()[0] >= LIMITS["workers"]:
                return None
            row=db.execute("SELECT * FROM runs WHERE status='queued' ORDER BY created,id LIMIT 1").fetchone()
            if not row:
                return None
            token=uuid.uuid4().hex
            db.execute("UPDATE runs SET status='running', attempts=attempts+1,attempt_id=?,lease_until=?,error=NULL WHERE id=?",(token,now+LIMITS["lease_seconds"],row["id"]))
            self.event(db,row["tenant"],"system:worker","started",row["id"],{"attempt":token})
            return dict(row),token

    def renew(self,run_id,attempt):
        with self.transaction() as db:
            db.execute("INSERT INTO worker_health VALUES(1,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen",(time.time(),))
            return db.execute("UPDATE runs SET lease_until=? WHERE id=? AND attempt_id=? AND status='running' AND lease_until>?",(time.time()+LIMITS["lease_seconds"],run_id,attempt,time.time())).rowcount==1

    def finish(self,run_id,attempt,artifact=None,error=None):
        rendered=None
        provenance=None
        if artifact is not None:
            parsed=Artifact.model_validate(artifact)
            if parsed.run_id != run_id:
                raise StoreError("artifact_run_mismatch")
            rendered=canonical(parsed.model_dump())
            if len(rendered.encode()) > LIMITS["output_bytes"]:
                raise StoreError("output_limit")
            provenance=bundle()
            if not verify_bundle(provenance,parsed.manifest):
                rendered=None
                provenance=None
                error="runtime_source_changed"
        with self.transaction() as db:
            row=db.execute("SELECT * FROM runs WHERE id=? AND attempt_id=? AND status='running' AND lease_until>?",(run_id,attempt,time.time())).fetchone()
            if not row:
                return False
            if artifact is not None:
                assert_artifact_request_binding(parsed,RunRequest.model_validate_json(row["payload"]),row["input_hash"])
            status="succeeded" if rendered else "failed"
            db.execute("UPDATE runs SET status=?,artifact=?,output_hash=?,error=?,lease_until=NULL WHERE id=?",(status,rendered,digest(rendered) if rendered else None,error,run_id))
            if provenance is not None:
                db.execute("INSERT INTO provenance VALUES(?,?)",(run_id,canonical(provenance)))
            self.event(db,row["tenant"],"system:worker",status,run_id,{"artifact_sha256":digest(rendered) if rendered else None,"error_code":error})
            return True

    def cancel(self,principal,run_id):
        self.get(principal,run_id)
        with self.transaction() as db:
            changed=db.execute("UPDATE runs SET status='cancelled',attempt_id=NULL,lease_until=NULL WHERE id=? AND tenant=? AND subject=? AND status IN ('queued','running')",(run_id,*principal)).rowcount
            if changed:
                self.event(db,*principal,"cancelled",run_id,{})
        return self.get(principal,run_id)

    def audit(self,principal,run_id):
        self.get(principal,run_id)
        with self.connection() as db:
            events=[json.loads(row[0]) for row in db.execute("SELECT payload FROM events WHERE tenant=? AND json_extract(payload,'$.run_id')=? ORDER BY seq LIMIT 101",(principal[0],run_id))]
        return {"integrity_status":"integrity_unverified","reason":"No independently administered checkpoint has been provisioned","complete":len(events)<=100,"events":events[:100]}

    def provenance(self,principal,run_id):
        run=self.get(principal,run_id)
        if run.status!="succeeded":
            raise StoreError("run_has_no_successful_artifact")
        with self.connection() as db:
            row=db.execute("SELECT payload FROM provenance WHERE run_id=?",(run_id,)).fetchone()
        if not row:
            raise StoreError("provenance_unavailable")
        try:
            data=json.loads(row[0])
            if not verify_bundle(data,run.artifact.manifest):
                raise ValueError()
        except (ValueError,KeyError,TypeError):
            raise StoreError("provenance_integrity_failure")
        return {"run_id":run_id,"artifact_sha256":run.artifact_sha256,"bundle":data}
