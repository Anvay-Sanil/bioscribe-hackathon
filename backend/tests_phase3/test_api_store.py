import json
import time
from concurrent.futures import ThreadPoolExecutor
import pytest
from bioscribe.compute import compute
from bioscribe.config import LIMITS
from bioscribe.identity import canonical, digest
from bioscribe.store import Store, StoreError
from bioscribe.worker import execute_one

def submit(api,headers,payload):
    response=api[0].post('/v3/runs',json=payload,headers=headers)
    assert response.status_code==202,response.text
    return response.json()['run_id']

def test_persisted_run_export_auth(api,headers,request_payload):
    client,store=api
    run_id=submit(api,headers,request_payload)
    assert execute_one(store)
    view=client.get('/v3/runs/'+run_id,headers=headers)
    assert view.status_code==200,view.text
    result=view.json()
    assert result['status']=='succeeded',result
    assert result['artifact']['run_id']==run_id
    assert client.get('/v3/runs/'+run_id+'/export',headers=headers).json()==result
    assert Store(store.path).get(('tenant_a','alice'),run_id).model_dump()==result
    for suffix in ['', '/export','/audit','/provenance']:
        assert client.get('/v3/runs/'+run_id+suffix).status_code==401
        for other in ['b','e']:
            assert client.get('/v3/runs/'+run_id+suffix,headers={'Authorization':'Bearer '+other*48}).status_code==404
    audit=client.get('/v3/runs/'+run_id+'/audit',headers=headers).json()
    assert audit['integrity_status']=='integrity_unverified'
    assert audit['events'][0]['subject']=='alice'
    provenance=client.get('/v3/runs/'+run_id+'/provenance',headers=headers).json()
    assert 'compute.py' in provenance['bundle']['sources']
    with store.connection() as db:
        data=provenance['bundle'];data['sources']['compute.py']='changed'
        db.execute('UPDATE provenance SET payload=? WHERE run_id=?',(canonical(data),run_id))
    assert client.get('/v3/runs/'+run_id+'/provenance',headers=headers).status_code==409

def test_idempotency_concurrency_and_distinct_inputs(api,headers,request_payload):
    _,store=api
    with ThreadPoolExecutor(4) as pool:
        ids=list(pool.map(lambda _:store.submit(('tenant_a','alice'),'same_key',request_payload),range(8)))
    assert len(set(ids))==1
    changed=dict(request_payload,content='EEEEEEEEEE')
    with pytest.raises(StoreError):store.submit(('tenant_a','alice'),'same_key',changed)
    second=store.submit(('tenant_a','alice'),'different_key',changed)
    assert second!=ids[0]
    assert execute_one(store) and execute_one(store)
    assert store.get(('tenant_a','alice'),ids[0]).request_sha256!=store.get(('tenant_a','alice'),second).request_sha256

def test_recovery_fences_late_writer(api,headers,request_payload):
    _,store=api
    run_id=submit(api,headers,request_payload)
    row,old_attempt=store.claim()
    assert store.claim() is None
    row,new_attempt=Store(store.path).claim(now=time.time()+LIMITS['lease_seconds']+1)
    assert old_attempt!=new_attempt
    artifact=compute(run_id,request_payload)
    assert store.finish(run_id,old_attempt,artifact=artifact) is False
    assert store.finish(run_id,new_attempt,artifact=artifact)
    assert store.finish(run_id,new_attempt,artifact=artifact) is False

def test_retry_exhaustion(api,headers,request_payload):
    client,store=api
    run_id=submit(api,headers,request_payload)
    store.claim()
    store.claim(now=time.time()+46)
    store.claim(now=time.time()+92)
    assert store.get(('tenant_a','alice'),run_id).status=='failed'
    assert client.get('/v3/runs/'+run_id+'/export',headers=headers).status_code==409

def test_cancellation_and_timeout(api,headers,request_payload):
    client,store=api
    run_id=submit(api,headers,request_payload)
    _,attempt=store.claim()
    assert client.post('/v3/runs/'+run_id+'/cancel',headers={'Authorization':'Bearer '+'b'*48}).status_code==404
    assert client.post('/v3/runs/'+run_id+'/cancel',headers=headers).json()['status']=='cancelled'
    assert not store.finish(run_id,attempt,artifact=compute(run_id,request_payload))
    second=store.submit(('tenant_a','alice'),'timeout',request_payload)
    assert execute_one(store,timeout=0.001)
    assert store.get(('tenant_a','alice'),second).error_code=='job_timeout'

def test_tampering_missing_artifacts_and_sanitized_errors(api,headers,request_payload):
    client,store=api
    run_id=submit(api,headers,request_payload)
    assert execute_one(store)
    with store.connection() as db:
        db.execute("UPDATE runs SET artifact=NULL WHERE id=?",(run_id,))
    response=client.get('/v3/runs/'+run_id,headers=headers)
    assert response.status_code==409 and response.json()['error_code']=='artifact_integrity_failure'
    assert client.get('/v3/runs/'+'f'*32,headers=headers).status_code==404
    canary='PATIENT_CANARY_DO_NOT_ECHO'
    response=client.post('/v3/runs',json=dict(request_payload,unknown=canary),headers=headers)
    assert response.status_code==422 and canary not in response.text and 'traceback' not in response.text

def test_size_compression_capacity_and_sensitive_intake(api,headers,request_payload):
    client,store=api
    assert client.post('/v3/runs',content=b'x'*(LIMITS['request_bytes']+1),headers=headers).status_code==413
    assert client.post('/v3/runs',content=b'x',headers={**headers,'Content-Encoding':'gzip'}).status_code==415
    assert client.post('/v3/runs',json=dict(request_payload,data_classification='patient_linked'),headers=headers).status_code==422
    for index in range(LIMITS['queued_jobs']):store.submit(('tenant_a','alice'),f'key{index}',request_payload)
    with pytest.raises(StoreError,match='queue_capacity'):
        store.submit(('tenant_a','alice'),'overlimit',request_payload)

def test_ready_requires_worker_and_lock(api):
    client,store=api
    assert client.get('/health/ready').status_code==503
    store.claim()
    assert client.get('/health/ready').status_code==200

def test_legacy_routes_disabled(api,headers):
    for route in ['/api/pipeline/complete','/api/admet/predict','/api/affinity/score','/api/benchmark','/api/compliance/sign']:
        assert api[0].post(route,json={},headers=headers).status_code==404
