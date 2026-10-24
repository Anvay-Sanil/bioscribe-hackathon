// Loopback-only integration probe; never prints the token or uses browser automation.
const fs=require('node:fs'),path=require('node:path');
const {load}=require('./experiment-challenges-check.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'../hackathon/experiment-challenges');
(async()=>{
 const {runChallenges}=load('lab-challenge-runner');
 const {labAPI}=load('lab');
 const source=JSON.parse(fs.readFileSync(path.join(root,'public/evidence-lab/challenge-source-run.json')));
 const token=fs.readFileSync(path.join(root,'../hackathon/.local/demo-token.txt'),'utf8').trim();
 // Fix destination for this probe even when the shell has an unrelated API URL.
 process.env.NEXT_PUBLIC_API_URL='http://127.0.0.1:8000';
 const result=await runChallenges(source,token,new AbortController().signal,()=>{});
 for(const o of result.outcomes){if(o.status!=='passed')throw Error(`Challenge ${o.id}: ${o.status}`);}
 for(const job of result.capsule.trials.map(t=>t.job).filter(Boolean)){
   const saved=await labAPI(`/lab/runs/${job.run_id}`,token);
   if(saved.status!==job.status||saved.error_code!==job.error_code||saved.request_sha256!==job.request_sha256)throw Error('Persisted outcome differs');
 }
 fs.writeFileSync(path.join(dir,'live-capsule.json'),JSON.stringify(result.capsule,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'live-checks.json'),JSON.stringify({status:'passed',scope:'Seven real local jobs; six relationships checked and six saved outcomes retrieved',control_run:result.capsule.control.run_id,outcomes:result.outcomes,scientific_assessment:'not_assessed',user_value:'untested'},null,2)+'\n');
 console.log(JSON.stringify({status:'passed',control_run:result.capsule.control.run_id,outcomes:result.outcomes.map(o=>({id:o.id,status:o.status,run_id:o.run_id}))}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
