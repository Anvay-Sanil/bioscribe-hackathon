import ast
from pathlib import Path
import subprocess
import sys
import time
import pytest
from pydantic import ValidationError
from bioscribe.compute import compute, check_dependencies
from bioscribe.config import LIMITS
from bioscribe.schemas import RunRequest
from bioscribe.store import Store

def test_request_molecule_boundaries(request_payload):
    for n in (15,16):
        assert len(RunRequest.model_validate(dict(request_payload,molecules=['CCO']*n)).molecules)==n
    with pytest.raises(ValidationError):RunRequest.model_validate(dict(request_payload,molecules=['CCO']*17))
    for n in (2047,2048):assert RunRequest.model_validate(dict(request_payload,molecules=['C'*n]))
    with pytest.raises(ValidationError):RunRequest.model_validate(dict(request_payload,molecules=['C'*2049]))

def test_output_limit_and_missing_model(request_payload,monkeypatch):
    monkeypatch.setitem(LIMITS,'output_bytes',100)
    with pytest.raises(ValueError,match='output_limit'):compute('a'*32,request_payload)

def test_wrong_dependency_blocks_readiness(monkeypatch):
    import bioscribe.compute as engine
    monkeypatch.setattr(engine,'dependency_versions',lambda:{})
    with pytest.raises(RuntimeError):check_dependencies()

def test_legacy_engines_cannot_import():
    root=Path(__file__).resolve().parents[1]
    for name in ['api_genuine.py','main.py','main_real.py','main_enterprise.py','engines/admet_engine.py','engines/protein_engine.py','engines/docking_engine.py','services/benchmark_service.py','enterprise_compliance.py']:
        tree=ast.parse((root/name).read_text(encoding='utf-8'))
        statements=[node for node in tree.body if not (isinstance(node,ast.Expr) and isinstance(node.value,ast.Constant) and isinstance(node.value.value,str))]
        assert isinstance(statements[0],ast.Raise),name

def test_actual_worker_process_kill_recovery(tmp_path,request_payload):
    store=Store(tmp_path/'jobs.sqlite3')
    run_id=store.submit(('tenant','actor'),'kill_fixture',request_payload)
    claimed_file=tmp_path/'claimed'
    code="from bioscribe.store import Store; from pathlib import Path; import sys,time; s=Store(Path(sys.argv[1])); row,attempt=s.claim(); Path(sys.argv[2]).write_text(attempt); time.sleep(60)"
    worker=subprocess.Popen([sys.executable,'-c',code,str(store.path),str(claimed_file)])
    try:
        deadline=time.monotonic()+10
        while not claimed_file.exists() and time.monotonic()<deadline:time.sleep(0.05)
        assert claimed_file.exists()
        old=claimed_file.read_text()
        worker.kill();worker.wait(timeout=5)
        # Deterministically advance the expired lease; no 45-second sleep in tests.
        row,new=Store(store.path).claim(now=time.time()+LIMITS['lease_seconds']+1)
        assert row['id']==run_id and new!=old
        artifact=compute(run_id,request_payload)
        assert not store.finish(run_id,old,artifact=artifact)
        assert store.finish(run_id,new,artifact=artifact)
    finally:
        if worker.poll() is None:worker.kill();worker.wait(timeout=5)

def test_unsupported_nucleotide_frameshift(request_payload):
    request_payload.update(polymer_type='dna',content='ACGT')
    fields=compute('a'*32,request_payload)['outputs']
    frame=next(f for f in fields if f['quantity']=='frameshift')
    assert frame['value'] is None and frame['assessment_status']=='not_assessed'
    assert frame['execution_status']=='unsupported_input'

def test_api_byte_boundaries(api,headers):
    client,_=api
    for size in [LIMITS['request_bytes']-1,LIMITS['request_bytes']]:
        response=client.post('/v3/runs',content=' '*size,headers={**headers,'Content-Type':'application/json'})
        assert response.status_code==422
    assert client.post('/v3/runs',content=' '*(LIMITS['request_bytes']+1),headers=headers).status_code==413

def test_errors_do_not_expose_input_or_traceback(api,headers,request_payload,monkeypatch,caplog):
    client,store=api
    def failure(*args,**kwargs):raise RuntimeError('SENSITIVE_CANARY_EXCEPTION')
    monkeypatch.setattr(store,'submit',failure)
    response=client.post('/v3/runs',json=request_payload,headers=headers)
    assert response.status_code==500
    assert response.json()=={'error_code':'internal_error'}
    assert 'SENSITIVE_CANARY' not in caplog.text
    assert response.headers['cache-control']=='no-store'

def test_worker_external_connection_denied():
    code="from bioscribe.worker import deny_external_connections; import socket; deny_external_connections(); socket.create_connection(('example.com',443))"
    result=subprocess.run([sys.executable,'-c',code],capture_output=True,text=True,timeout=10)
    assert result.returncode!=0 and 'external_destinations_disabled' in result.stderr
