"""Live-process acceptance check. Uses generated public fixtures and temporary credentials."""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import httpx
from bioscribe.auth import provision

ROOT=Path(__file__).resolve().parents[2]

def free_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1',0))
        return sock.getsockname()[1]

def wait_request(client,path,predicate,timeout=30):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
        try:
            response=client.get(path)
            if predicate(response):return response
        except httpx.TransportError:pass
        time.sleep(0.2)
    raise RuntimeError('startup_or_run_timeout')

def main():
    results=[]
    with tempfile.TemporaryDirectory(prefix='bioscribe-phase3-') as folder:
        directory=Path(folder)
        auth=directory/'principals.json';tokenfile=directory/'token.txt'
        provision(auth,tokenfile,'fixture_tenant','fixture_user')
        env={**os.environ,'BIOSCRIBE_AUTH_FILE':str(auth),'BIOSCRIBE_DATABASE':str(directory/'runs.sqlite3'),'PYTHONUNBUFFERED':'1'}
        port=free_port()
        api_args=[sys.executable,'-m','uvicorn','bioscribe.api:app','--host','127.0.0.1','--port',str(port),'--no-access-log']
        worker_args=[sys.executable,'-m','bioscribe.worker']
        processes=[]
        with (directory/'process.log').open('w') as log:
            def launch(args):
                proc=subprocess.Popen(args,cwd=ROOT/'backend',env=env,stdout=log,stderr=log)
                processes.append(proc);return proc
            try:
                api=launch(api_args)
                with httpx.Client(base_url=f'http://127.0.0.1:{port}',headers={'Authorization':'Bearer '+tokenfile.read_text()},timeout=5) as client:
                    wait_request(client,'/health/live',lambda r:r.status_code==200)
                    # Queue persists while no worker exists.
                    payload={'data_classification':'public_non_sensitive','polymer_type':'protein','content':'>public_fixture\nLLLLLLLLLL','record_count':1,'molecules':['CCO']}
                    response=client.post('/v3/runs',json=payload,headers={'Idempotency-Key':'startup_fixture_0001'})
                    assert response.status_code==202,response.text
                    run_id=response.json()['run_id']
                    assert response.json()['status']=='queued'
                    api.terminate();api.wait(timeout=10)
                    api=launch(api_args)
                    wait_request(client,'/health/live',lambda r:r.status_code==200)
                    assert client.get('/v3/runs/'+run_id).json()['status']=='queued'
                    worker=launch(worker_args)
                    wait_request(client,'/health/ready',lambda r:r.status_code==200)
                    completed=wait_request(client,'/v3/runs/'+run_id,lambda r:r.status_code==200 and r.json()['status'] in ['succeeded','failed']).json()
                    assert completed['status']=='succeeded',completed
                    exported=client.get('/v3/runs/'+run_id+'/export').json()
                    assert exported==completed
                    worker.terminate();worker.wait(timeout=10)
                    api.terminate();api.wait(timeout=10)
                    api=launch(api_args);worker=launch(worker_args)
                    wait_request(client,'/health/ready',lambda r:r.status_code==200)
                    assert client.get('/v3/runs/'+run_id+'/export').json()==exported
                    results=['API startup','worker readiness','queued run survives API kill','real spawned computation','run/export identity','API and worker restart preserve artifact']
                    (ROOT/'docs/phase3-example-run.json').write_text(json.dumps(exported,indent=2)+'\n',encoding='utf-8')
            finally:
                for process in processes:
                    if process.poll() is None:
                        process.terminate()
                        try:process.wait(timeout=10)
                        except subprocess.TimeoutExpired:process.kill();process.wait(timeout=5)
        report={'status':'passed','checks':results,'python':sys.version,'commands':{'api':api_args,'worker':worker_args},'data':'synthetic public software fixture; no scientific performance evidence'}
        (ROOT/'docs/phase3-startup.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
        print(json.dumps(report))

if __name__=='__main__':main()
