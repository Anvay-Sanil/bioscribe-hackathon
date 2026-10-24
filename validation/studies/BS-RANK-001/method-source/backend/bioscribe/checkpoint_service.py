"""Reference checkpoint service. Deploy under independent administration before trust.

Local tests exercise storage/protocol, not administrator isolation or WORM retention.
Credentials and private key must NEVER be shared with the primary application.
"""
import base64
from contextlib import closing
import hmac
import sqlite3
from fastapi import FastAPI, Header, HTTPException
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from pydantic import Field
from .identity import canonical
from .schemas import Digest, StrictModel


class CheckpointInput(StrictModel):
    log_id: str = Field(pattern=r"^[A-Za-z0-9_-]{1,128}$")
    count: int = Field(ge=1)
    head: Digest
    previous_head: str


def checkpoint_app(database,private_key: bytes,key_id: str,read_token: str,write_token: str):
    if min(len(read_token),len(write_token))<32 or read_token==write_token:
        raise ValueError("independent_credentials_required")
    signing_key=Ed25519PrivateKey.from_private_bytes(private_key)
    app=FastAPI(title="BioScribe checkpoint reference service")
    with closing(sqlite3.connect(database)) as db:
        db.execute("CREATE TABLE IF NOT EXISTS checkpoints(log_id TEXT, count INTEGER, head TEXT, previous_head TEXT, PRIMARY KEY(log_id,count))")
        db.commit()

    def authorized(header,token):
        if not header or not hmac.compare_digest(header,"Bearer "+token):
            raise HTTPException(401,"authentication_required")

    def receipt(row):
        checkpoint={"log_id":row[0],"count":row[1],"head":row[2],"previous_head":row[3],"key_id":key_id}
        return {"checkpoint":checkpoint,"signature":base64.b64encode(signing_key.sign(canonical(checkpoint).encode())).decode()}

    @app.post("/checkpoints")
    def append(item: CheckpointInput,authorization: str | None=Header(default=None)):
        authorized(authorization,write_token)
        with closing(sqlite3.connect(database,isolation_level=None,timeout=5)) as db:
            db.execute("PRAGMA synchronous=FULL")
            db.execute("BEGIN IMMEDIATE")
            try:
                old=db.execute("SELECT * FROM checkpoints WHERE log_id=? ORDER BY count DESC LIMIT 1",(item.log_id,)).fetchone()
                if old and item.count==old[1] and item.head==old[2] and item.previous_head==old[3]:
                    db.commit()
                    return receipt(old)
                if item.count!=(old[1]+1 if old else 1) or item.previous_head!=(old[2] if old else "genesis"):
                    raise HTTPException(409,"checkpoint_conflict")
                row=(item.log_id,item.count,item.head,item.previous_head)
                db.execute("INSERT INTO checkpoints VALUES(?,?,?,?)",row)
                db.commit()
                return receipt(row)
            except BaseException:
                db.rollback()
                raise

    @app.get("/checkpoints/{log_id}")
    def latest(log_id: str,authorization: str | None=Header(default=None)):
        authorized(authorization,read_token)
        with closing(sqlite3.connect(database)) as db:
            row=db.execute("SELECT * FROM checkpoints WHERE log_id=? ORDER BY count DESC LIMIT 1",(log_id,)).fetchone()
        if not row:
            raise HTTPException(404,"checkpoint_not_found")
        return receipt(row)

    return app
