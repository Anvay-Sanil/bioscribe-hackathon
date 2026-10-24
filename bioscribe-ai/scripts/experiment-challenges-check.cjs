const writeCheckOutput=require('./check-output.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),Module=require('node:module');
const root=path.resolve(__dirname,'..'),out=path.join(root,'../hackathon/experiment-challenges'),cache=new Map();
function load(name){
 const filename=path.join(root,'src/lib/phase3',name+'.ts');if(cache.has(filename))return cache.get(filename).exports;
 const m=new Module(filename,module);cache.set(filename,m);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));const req=m.require.bind(m);
 m.require=id=>id.startsWith('./lab')?load(id.slice(2)):req(id);
 m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return m.exports;
}
module.exports={load};
if(require.main===module)(async()=>{
 const {CHALLENGE_METHOD,planChallenges,evaluateChallenge,decodeChallenges,sealChallenges,challengeEligibility}=load('lab-challenges');
 const {runChallenges}=load('lab-challenge-runner');
 const {canonicalLab,hashLab}=load('lab');
 const f=JSON.parse(fs.readFileSync(path.join(out,'test-fixtures.json'))),p=f.control,plans=await planChallenges(p),checks=[];
 async function check(name,fn){try{await fn();checks.push({name,status:'passed'});}catch(e){throw new Error(name+': '+e.message,{cause:e});}}
 const body={format:'bioscribe-challenge-capsule/1.0.0',method:CHALLENGE_METHOD,suite_id:'a'.repeat(32),created_utc:'2026-10-24T00:00:00.000Z',source_run_id:p.run_id,source_result_sha256:p.result_sha256,control:p,trials:plans.map(plan=>({id:plan.id,job:f.jobs[plan.id],not_run:null})),scientific_assessment:'not_assessed',scope:'Recorded software challenge evidence; no authenticated authorship or biological qualification'};
 const seal=async value=>{const {capsule_sha256,...b}=value;return sealChallenges(b);};
 const cap=await sealChallenges(body);
 for(const plan of plans)await check(plan.title+' satisfies its relationship using computed fixtures',async()=>assert.equal((await evaluateChallenge(p,plan,{id:plan.id,job:f.jobs[plan.id],not_run:null})).status,'passed'));
 await check('All six dispositions rederived from capsule, not trusted counters',async()=>assert((await decodeChallenges(cap)).outcomes.every(o=>o.status==='passed')));
 await check('Three one-row operations explicitly not run',async()=>assert.deepEqual((await planChallenges(f.single)).filter(x=>x.skip).map(x=>x.id),['reorder','canonical','budget']));
 await check('Sixteen-row input skips duplicate injection instead of exceeding bound',async()=>assert.equal((await planChallenges(f.full)).find(x=>x.id==='duplicate').payload,null));
 await check('Rejected input and duplicate libraries cannot earn a challenge score',()=>{assert(challengeEligibility(f.jobs.invalid.output.package));assert(challengeEligibility(f.jobs.duplicate.output.package));});
 await check('Checksummed forged number still passes structural decoding but differs from control',async()=>{const forge=plans.find(x=>x.id==='forged').payload;const {decodeLab}=load('lab');await decodeLab(forge);assert.notEqual(forge.result_sha256,p.result_sha256);assert.equal(forge.result.rows[0].properties[0].value,p.result.rows[0].properties[0].value+1);});
 for(const [name,edit] of [
  ['trial removed',c=>c.trials.pop()],['trial order changed',c=>c.trials.reverse()],['receipt run reused',c=>c.trials[1].job.run_id=c.trials[0].job.run_id],
  ['extra field',c=>c.confidence=1],['wrong source',c=>c.source_result_sha256='0'.repeat(64)],['method silently upgraded',c=>c.method='v2'],
  ['wrong source molecule',c=>c.control.request.molecules[0]='N'],['false skipped execution',c=>c.trials[0].not_run='Skipped'],
  ['job output removed',c=>c.trials[0].job.output=null],['wrong operation attribution',c=>c.trials[0].job.mode='replay'],
  ['unbound failed replay receipt',c=>c.trials[5].job.request_sha256='0'.repeat(64)]
 ])await check('Reject capsule with '+name,async()=>{const c=structuredClone(cap);edit(c);await assert.rejects(()=>seal(c).then(decodeChallenges));});
 await check('Tamper without rehash is detected',async()=>{const c=structuredClone(cap);c.created_utc='2026-10-25T00:00:00.000Z';await assert.rejects(()=>decodeChallenges(c),/checksum/);});
 await check('Wrong computation cannot masquerade as reordered request',async()=>{const c=structuredClone(cap);c.trials[0].job=f.jobs.canonical;await assert.rejects(()=>seal(c).then(decodeChallenges));});
 await check('Generic failure is not accepted as successful forgery detection',async()=>{const c=structuredClone(cap);c.trials[5].job.error_code='job_timeout_or_worker_exit';const d=await decodeChallenges(await seal(c));assert.equal(d.outcomes[5].status,'failed');});
 await check('Cancellation is not counted as successful detection',async()=>{const c=structuredClone(cap);c.trials[5].job.status='cancelled';const d=await decodeChallenges(await seal(c));assert.equal(d.outcomes[5].status,'failed');});
 await check('Changed descriptor under same graph fails invariant',async()=>{const c=structuredClone(cap),pack=c.trials[0].job.output.package;pack.result.rows[0].properties[0].value+=1;pack.result_sha256=await hashLab(canonicalLab(pack.result));const d=await decodeChallenges(await seal(c));assert.equal(d.outcomes[0].status,'failed');});
 await check('Different engine never becomes an invariant pass',async()=>{const c=structuredClone(cap),pack=c.trials[0].job.output.package;pack.bundle.sources['engine.py']+='\n# another version\n';pack.result.engine_sha256=await hashLab(canonicalLab({sources:pack.bundle.sources,dependency_lock:pack.bundle.dependency_lock}));pack.result_sha256=await hashLab(canonicalLab(pack.result));const d=await decodeChallenges(await seal(c));assert.equal(d.outcomes[0].status,'failed');});
 let calls=[];
 const controlJob={run_id:p.run_id,request_sha256:p.result.request_sha256,mode:'analyze',status:'succeeded',error_code:null,output:{package:p,replay:null}};
 const fake=async(url,token,payload)=>{calls.push(url);if(calls.length===1)return controlJob;const plan=plans.find(x=>canonicalLab(x.payload)===canonicalLab(payload));if(!plan)throw Error('Unexpected request');return f.jobs[plan.id];};
 await check('Runner executes a fresh control followed by exactly six planned jobs',async()=>{calls=[];const r=await runChallenges(p,'unit-token',new AbortController().signal,()=>{},fake,async()=>{});assert.equal(calls.length,7);assert(r.outcomes.every(o=>o.status==='passed'));});
 await check('No token sends no request',async()=>{calls=[];await assert.rejects(()=>runChallenges(p,'',new AbortController().signal,()=>{},fake));assert.equal(calls.length,0);});
 await check('Abort before start sends no request',async()=>{calls=[];const abort=new AbortController();abort.abort();await assert.rejects(()=>runChallenges(p,'unit-token',abort.signal,()=>{},fake));assert.equal(calls.length,0);});
 await check('Active job cancellation is attempted when stopped',async()=>{const abort=new AbortController(),seen=[];const api=async(url)=>{seen.push(url);if(url.endsWith('/cancel'))return {...controlJob,status:'cancelled',output:null};abort.abort();return {...controlJob,status:'queued',output:null};};await assert.rejects(()=>runChallenges(p,'unit-token',abort.signal,()=>{},api,async()=>{}));assert(seen.some(s=>s.endsWith('/cancel')));});
 await check('Unconfirmed cancellation is explicit',async()=>{const abort=new AbortController();const api=async(url)=>{if(url.endsWith('/cancel'))throw Error('unavailable');abort.abort();return {...controlJob,status:'queued',output:null};};await assert.rejects(()=>runChallenges(p,'unit-token',abort.signal,()=>{},api,async()=>{}),/could not be confirmed/);});
 await check('Control mismatch stops the suite before any mutation',async()=>{let n=0;await assert.rejects(()=>runChallenges(p,'unit-token',new AbortController().signal,()=>{},async(url)=>{if(url.endsWith('/cancel'))return {...controlJob,status:'cancelled',output:null};n++;return f.jobs.budget;},async()=>{}),/control differs|request hash differs/);assert.equal(n,1);});
 writeCheckOutput(path.join(out,'software-checks.json'),JSON.stringify({scope:'Unit checks with computed molecular fixtures and labelled synthetic job receipts',passed:checks.length,checks},null,2)+'\n');console.log(`${checks.length} experiment challenge checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
