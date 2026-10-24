"""Bounded local fixture server for interactive browser acceptance; no real data."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from bioscribe.auth import provision

ROOT=Path(__file__).resolve().parents[2]

def main():
    directory=ROOT/'phase3-runtime/browser'
    directory.mkdir(parents=True,exist_ok=True)
    auth=directory/'principals.json';token=directory/'token.txt'
    if not auth.exists():provision(auth,token,'public_fixture','browser_fixture')
    env={**os.environ,'BIOSCRIBE_AUTH_FILE':str(auth),'BIOSCRIBE_DATABASE':str(directory/'runs.sqlite3'),'BIOSCRIBE_ORIGIN':'http://localhost:3000'}
    processes=[]
    log=(directory/'servers.log').open('w')
    try:
        for args in ([sys.executable,'-m','uvicorn','bioscribe.api:app','--host','127.0.0.1','--port','8000','--no-access-log'],[sys.executable,'-m','bioscribe.worker']):
            processes.append(subprocess.Popen(args,cwd=ROOT/'backend',env=env,stdout=log,stderr=log))
        processes.append(subprocess.Popen(['node',str(ROOT/'bioscribe-ai/node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3000'],cwd=ROOT/'bioscribe-ai',env=env,stdout=log,stderr=log))
        (directory/'public-fixture.fasta').write_text('>public_fixture\nLLLLLLLLLL\n',encoding='utf-8')
        print(json.dumps({'fixture':'public synthetic','url':'http://localhost:3000','credential_file':str(token)}),flush=True)
        deadline=time.monotonic()+900
        while time.monotonic()<deadline and not (directory/'stop').exists():
            if any(p.poll() is not None for p in processes):raise RuntimeError('fixture_service_exited')
            time.sleep(0.5)
    finally:
        for p in processes:
            if p.poll() is None:
                p.terminate()
                try:p.wait(timeout=5)
                except subprocess.TimeoutExpired:p.kill();p.wait(timeout=5)
        log.close()

if __name__=='__main__':main()
