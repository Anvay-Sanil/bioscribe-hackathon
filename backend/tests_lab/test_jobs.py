import json
import time
import pytest
from fastapi.testclient import TestClient
from bioscribe.api import create_app
from bioscribe.config import Settings
from bioscribe.auth import provision
from provenance_lab.engine import canonical, make_package, sha
from provenance_lab.storage import LabError, LabStore
from provenance_lab.runner import execute_one

OWNER=("test","owner")


@pytest.fixture
def store(tmp_path):
    return LabStore(tmp_path/"jobs.sqlite3")


def test_persist_publish_retrieve_export_identity(store):
    request={"molecules":["CCO"],"budget":1}
    rid=store.submit(OWNER,"a"*16,"analyze",request)
    row,attempt=store.claim()
    wrong=make_package({"molecules":["c1ccccc1"],"budget":1},rid)
    with pytest.raises(LabError,match="input_result_binding_failure"):
        store.finish(rid,attempt,output={"package":wrong.model_dump(),"replay":None})
    good=make_package(request,rid).model_dump()
    assert store.finish(rid,attempt,output={"package":good,"replay":None})
    assert LabStore(store.path).get(OWNER,rid)["output"]["package"]==good
    with pytest.raises(LabError,match="run_not_found"): store.get(("test","other"),rid)


def test_wrong_compound_read_recheck_even_rehashed(store):
    rid=store.submit(OWNER,"a"*16,"analyze",{"molecules":["CCO"],"budget":1})
    row,attempt=store.claim()
    wrong={"package":make_package({"molecules":["CC"],"budget":1},rid).model_dump(),"replay":None}
    raw=canonical(wrong)
    with store.connection() as db:
        db.execute("UPDATE lab_jobs SET status='succeeded',output=?,output_hash=? WHERE id=?",(raw,sha(raw),rid))
    with pytest.raises(LabError,match="input_result_binding_failure"): store.get(OWNER,rid)


def test_recovery_fences_stale_writer_and_exhausts(store):
    rid=store.submit(OWNER,"a"*16,"analyze",{"molecules":["CCO"],"budget":1})
    _,first=store.claim()
    with store.connection() as db: db.execute("UPDATE lab_jobs SET lease=0")
    _,second=store.claim()
    assert not store.finish(rid,first,error="stale")
    with store.connection() as db: db.execute("UPDATE lab_jobs SET lease=0")
    assert store.claim() is None
    assert store.get(OWNER,rid)["error_code"]=="worker_interrupted"


def test_idempotence_cancel_queue(store):
    req={"molecules":["CCO"],"budget":1}
    rid=store.submit(OWNER,"a"*16,"analyze",req)
    assert store.submit(OWNER,"a"*16,"analyze",req)==rid
    with pytest.raises(LabError,match="idempotency_conflict"):
        store.submit(OWNER,"a"*16,"analyze",{"molecules":["CCC"],"budget":1})
    _,attempt=store.claim()
    assert store.cancel(OWNER,rid)["status"]=="cancelled"
    assert not store.finish(rid,attempt,error="stale")
    for i in range(32): store.submit(OWNER,str(i).zfill(16),"analyze",req)
    with pytest.raises(LabError,match="queue_full"): store.submit(OWNER,"z"*16,"analyze",req)


def test_real_worker_and_replay(store):
    rid=store.submit(OWNER,"a"*16,"analyze",{"molecules":["CCO","C1CC"],"budget":1})
    assert execute_one(store)
    result=store.get(OWNER,rid)
    assert result["status"]=="succeeded"
    replay=store.submit(OWNER,"b"*16,"replay",result["output"]["package"])
    assert execute_one(store)
    assert store.get(OWNER,replay)["output"]["replay"]["status"]=="matched"


def test_timeout_is_explicit(store):
    rid=store.submit(OWNER,"a"*16,"analyze",{"molecules":["CCO"],"budget":1})
    execute_one(store,timeout=0.001)
    assert store.get(OWNER,rid)["status"]=="failed"


def test_api_auth_limits_and_export(tmp_path):
    auth,token=tmp_path/"auth.json",tmp_path/"token"
    provision(auth,token,*OWNER)
    client=TestClient(create_app(Settings(tmp_path/"runs.sqlite3",auth)))
    headers={"Authorization":"Bearer "+token.read_text(),"Idempotency-Key":"a"*16}
    req={"molecules":["CCO"],"budget":1}
    assert client.post("/lab/runs",json=req).status_code==401
    response=client.post("/lab/runs",json=req,headers=headers)
    assert response.status_code==202
    rid=response.json()["run_id"]
    assert client.get(f"/lab/runs/{rid}/export",headers=headers).status_code==409
    assert client.post("/lab/runs",json={**req,"molecules":["C"]*17},headers=headers).status_code==422
    assert client.post("/lab/replay",content="x"*2_000_001,headers=headers).status_code==413
    store=LabStore(tmp_path/"runs.sqlite3")
    assert execute_one(store)
    export=client.get(f"/lab/runs/{rid}/export",headers=headers)
    assert export.status_code==200
    assert export.json()["request"]["molecules"]==["CCO"]
    assert client.get(f"/lab/runs/{rid}").status_code==401
