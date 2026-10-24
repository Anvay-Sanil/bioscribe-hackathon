"""Regressions for Sentinel R1: authoritative request-to-compound attribution."""
from copy import deepcopy
import pytest
from bioscribe.compute import compute
from bioscribe.identity import canonical, digest, parse_input
from bioscribe.schemas import RunRequest
from bioscribe.store import StoreError
from bioscribe.worker import execute_one


MISMATCHES = [
    pytest.param(['CCO'], ['c1ccccc1'], id='replacement'),
    pytest.param(['CCO', 'C1OC1'], ['C1OC1', 'CCO'], id='reordering'),
    pytest.param(['CCO'], ['CCO', 'CC'], id='insertion'),
    pytest.param(['CCO', 'CC'], ['CCO'], id='deletion'),
    pytest.param(['CCO'], [], id='all_deleted'),
    pytest.param([], ['CCO'], id='unsolicited_molecule'),
    pytest.param(['CCO', 'CCO'], ['CCO'], id='duplicate_collapsed'),
]


def forged_artifact(run_id, payload, wrong_molecules):
    candidate=compute(run_id,dict(payload,molecules=wrong_molecules))
    # Reproduce the review: retain the authentic request identity/hash while
    # substituting a self-consistent collection of foreign molecular results.
    candidate['input_identity']=parse_input(RunRequest.model_validate(payload)).model_dump()
    return candidate


@pytest.mark.parametrize('submitted,computed',MISMATCHES)
def test_publication_rejects_wrong_molecular_batch(api,headers,request_payload,submitted,computed):
    client,store=api
    payload=dict(request_payload,molecules=submitted)
    run_id=client.post('/v3/runs',json=payload,headers=headers).json()['run_id']
    _,attempt=store.claim()
    candidate=forged_artifact(run_id,payload,computed)
    with pytest.raises(StoreError,match='artifact_molecule_input_mismatch'):
        store.finish(run_id,attempt,artifact=candidate)
    # Rollback leaves no success, artifact, provenance or success audit event.
    with store.connection() as db:
        row=db.execute('SELECT status,artifact,output_hash FROM runs WHERE id=?',(run_id,)).fetchone()
        assert tuple(row)==('running',None,None)
        assert db.execute('SELECT COUNT(*) FROM provenance WHERE run_id=?',(run_id,)).fetchone()[0]==0
        assert db.execute("SELECT COUNT(*) FROM events WHERE json_extract(payload,'$.action')='succeeded'").fetchone()[0]==0
    assert client.get('/v3/runs/'+run_id,headers=headers).json()['artifact'] is None
    assert client.get('/v3/runs/'+run_id+'/export',headers=headers).status_code==409


@pytest.mark.parametrize('submitted,computed',MISMATCHES)
def test_read_export_and_audit_recheck_stored_compounds(api,headers,request_payload,submitted,computed):
    client,store=api
    payload=dict(request_payload,molecules=submitted)
    run_id=store.submit(('tenant_a','alice'),'stored_attack',payload)
    candidate=forged_artifact(run_id,payload,computed)
    encoded=canonical(candidate)
    with store.connection() as db:
        # Simulate a previously published bad artifact, even with its checksum
        # recomputed. Retrieval must use the persisted request as the authority.
        db.execute("UPDATE runs SET status='succeeded',artifact=?,output_hash=? WHERE id=?",(encoded,digest(encoded),run_id))
    for suffix in ['', '/export', '/audit', '/provenance']:
        response=client.get('/v3/runs/'+run_id+suffix,headers=headers)
        assert response.status_code==409
        assert response.json()['error_code']=='artifact_molecule_input_mismatch'
    with store.connection() as db:
        assert db.execute('SELECT artifact FROM runs WHERE id=?',(run_id,)).fetchone()[0]==encoded


@pytest.mark.parametrize('molecules',[[],['CCO'],['CCO','C1OC1'],['CCO','CCO']])
def test_valid_order_and_duplicates_publish_retrieve_export(api,headers,request_payload,molecules):
    client,store=api
    payload=dict(request_payload,molecules=molecules)
    run_id=store.submit(('tenant_a','alice'),'valid_batch',payload)
    _,attempt=store.claim()
    assert store.finish(run_id,attempt,artifact=compute(run_id,payload))
    view=client.get('/v3/runs/'+run_id,headers=headers)
    assert view.status_code==200
    assert view.json()['status']=='succeeded'
    assert [item['input_sha256'] for item in view.json()['artifact']['chemical_identities']]==[digest(s) for s in molecules]
    assert client.get('/v3/runs/'+run_id+'/export',headers=headers).json()==view.json()


def test_exact_molecule_only_counterexample(api,request_payload):
    _,store=api
    payload=dict(request_payload,polymer_type='molecule',content='',record_count=0,molecules=['CCO'])
    run_id=store.submit(('tenant_a','alice'),'ethanol',payload)
    _,attempt=store.claim()
    with pytest.raises(StoreError,match='artifact_molecule_input_mismatch'):
        store.finish(run_id,attempt,artifact=forged_artifact(run_id,payload,['c1ccccc1']))


def test_read_rechecks_full_identity(api,headers,request_payload):
    client,store=api
    run_id=store.submit(('tenant_a','alice'),'source_identity',request_payload)
    candidate=compute(run_id,request_payload)
    candidate['input_identity']['source']['organism_taxon_id']=9606
    encoded=canonical(candidate)
    with store.connection() as db:
        db.execute("UPDATE runs SET status='succeeded',artifact=?,output_hash=? WHERE id=?",(encoded,digest(encoded),run_id))
    assert client.get('/v3/runs/'+run_id,headers=headers).json()['error_code']=='artifact_input_identity_mismatch'


def test_worker_marks_rejected_publication_failed_and_continues(api,headers,request_payload,monkeypatch):
    client,store=api
    payload=dict(request_payload,molecules=['CCO'])
    run_id=store.submit(('tenant_a','alice'),'rejected_worker',payload)
    original_finish=store.finish
    def substitute(worker_run,attempt,artifact=None,error=None):
        if worker_run==run_id and artifact is not None:
            artifact=forged_artifact(run_id,payload,['c1ccccc1'])
        return original_finish(worker_run,attempt,artifact=artifact,error=error)
    monkeypatch.setattr(store,'finish',substitute)
    assert execute_one(store)
    response=client.get('/v3/runs/'+run_id,headers=headers).json()
    assert response['status']=='failed' and response['artifact'] is None
    assert response['error_code']=='artifact_molecule_input_mismatch'
    assert client.get('/v3/runs/'+run_id+'/export',headers=headers).status_code==409
    next_run=store.submit(('tenant_a','alice'),'next_worker',payload)
    assert execute_one(store)
    assert store.get(('tenant_a','alice'),next_run).status=='succeeded'


def test_obsolete_method_artifact_is_not_silently_upgraded(api,headers,request_payload):
    client,store=api
    payload=dict(request_payload,molecules=['CCO'])
    run_id=store.submit(('tenant_a','alice'),'obsolete_method',payload)
    candidate=deepcopy(compute(run_id,payload))
    for field in candidate['outputs']:
        if field['method_id'] in {'rdkit_descriptors','structural_alert_scan','prioritization_heuristic'}:
            field['method_version']='1.0.0'
    encoded=canonical(candidate)
    with store.connection() as db:
        db.execute("UPDATE runs SET status='succeeded',artifact=?,output_hash=? WHERE id=?",(encoded,digest(encoded),run_id))
    assert client.get('/v3/runs/'+run_id+'/export',headers=headers).json()['error_code']=='artifact_contract_failure'
    with store.connection() as db:
        assert db.execute('SELECT artifact FROM runs WHERE id=?',(run_id,)).fetchone()[0]==encoded
