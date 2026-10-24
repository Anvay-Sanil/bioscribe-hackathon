import hashlib
import json
import pytest
from fastapi.testclient import TestClient
from bioscribe.api import create_app
from bioscribe.config import Settings
from bioscribe.schemas import RunRequest

@pytest.fixture
def request_payload():
    return RunRequest(data_classification="public_non_sensitive",polymer_type="protein",content="LLLLLLLLLL",record_count=1).model_dump()

@pytest.fixture
def api(tmp_path):
    auth=tmp_path/"principals.json"
    principals=[("tenant_a","alice","a"*48),("tenant_a","bob","b"*48),("tenant_b","eve","e"*48)]
    auth.write_text(json.dumps([{"tenant":t,"subject":s,"token_sha256":hashlib.sha256(k.encode()).hexdigest(),"enabled":True} for t,s,k in principals]))
    app=create_app(Settings(tmp_path/"runs.sqlite3",auth))
    with TestClient(app,raise_server_exceptions=False) as client:
        yield client,app.state.store

@pytest.fixture
def headers():
    return {"Authorization":"Bearer "+"a"*48,"Idempotency-Key":"idempotency_000001"}
