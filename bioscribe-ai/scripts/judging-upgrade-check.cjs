const writeCheckOutput=require('./check-output.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),Module=require('node:module');
const root=path.resolve(__dirname,'..'),results=[];
const modules=new Map();
function load(name){
  const filename=path.join(root,'src/lib/phase3',name+'.ts');if(modules.has(filename))return modules.get(filename).exports;
  const m=new Module(filename,module);modules.set(filename,m);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));
  const original=m.require.bind(m);m.require=id=>id==='./lab'?load('lab'):original(id);
  m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);return m.exports;
}
const {compareLabPackages,parseLocalToken,checkLabConnection}=load('lab-diff'),{hashLab,canonicalLab}=load('lab');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'public/evidence-lab',name+'-run.json'),'utf8'));
async function check(name,fn){try{await fn();results.push({name,status:'passed'});}catch(e){throw new Error(name+': '+e.message,{cause:e});}}
async function rehash(p){p.result.request_sha256=await hashLab(canonicalLab(p.request));p.result.engine_sha256=await hashLab(canonicalLab({sources:p.bundle.sources,dependency_lock:p.bundle.dependency_lock}));p.result.snapshot_sha256=await hashLab(canonicalLab(p.bundle.references));p.result_sha256=await hashLab(canonicalLab(p.result));return p;}
(async()=>{
 const ref=read('reference'),budget=read('budget-one'),bad=read('challenge');
 await check('Identical payload does not become a fresh replay',async()=>{const d=await compareLabPackages(ref,ref);assert(d.sameScientificPayload);assert(d.scope.includes('Recorded'));assert.equal(d.warning,null);});
 await check('Budget change keeps all three unique molecules and descriptors',async()=>{const d=await compareLabPackages(budget,ref);assert(d.budgetOnly);assert.equal(d.matches.length,3);assert(d.matches.every(m=>m.comparable&&!m.changes.length));assert.equal(d.beforeBudget,1);assert.equal(d.afterBudget,2);assert.equal(d.selectionComparison.heuristicBefore.length,1);assert.equal(d.selectionComparison.heuristicAfter.length,2);});
 await check('Challenge duplicates and rejected rows never pair by position',async()=>{const d=await compareLabPackages(bad,bad);assert.equal(d.matches.length,4);assert.equal(d.unmatchedBefore,8);assert(d.matches.every(m=>m.canonical!=='CCO'));});
 await check('Different compounds are not numeric comparisons',async()=>{const d=await compareLabPackages(ref,bad);assert.equal(d.matches.length,1);assert.equal(d.matches[0].canonical,ref.result.rows[0].canonical_smiles);assert.equal(d.selectionComparison,null);});
 await check('Reordered library pairs by graph identity instead of row number',async()=>{const b=structuredClone(ref);b.request.molecules.reverse();b.result.rows.reverse().forEach((r,i)=>r.index=i);b.result.identity_groups=b.result.rows.map(r=>[r.index]);for(const key of ['heuristic_order','qed_order','heuristic_selection','qed_selection'])b.result.ranking[key]=b.result.ranking[key].map(i=>2-i);await rehash(b);const d=await compareLabPackages(ref,b);assert(!d.inputsSame);assert.equal(d.matches.length,3);assert(d.matches.every(m=>m.afterIndex===2-m.beforeIndex&&!m.changes.length));});
 await check('Changed engine with consistent hashes withholds numeric comparison',async()=>{const b=structuredClone(ref);b.bundle.sources['engine.py']+='\n# Different engine identity\n';await rehash(b);const d=await compareLabPackages(ref,b);assert(!d.engineSame);assert(d.matches.every(m=>!m.comparable));});
 await check('Changed snapshot disclosed even when molecular values agree',async()=>{const b=structuredClone(ref);b.bundle.references['new-note.json']='{}';await rehash(b);const d=await compareLabPackages(ref,b);assert(!d.snapshotSame);assert(!d.budgetOnly);});
 await check('Different run identifier alone does not imply changed scientific output',async()=>{const b=structuredClone(ref);b.run_id='1'.repeat(32);const d=await compareLabPackages(ref,b);assert(d.sameScientificPayload);assert.notEqual(d.beforeRun,d.afterRun);});
 await check('Unexplained changed descriptors are flagged even with updated checksum',async()=>{const b=structuredClone(ref);b.result.rows[0].properties[0].value+=1;await rehash(b);const d=await compareLabPackages(ref,b);assert(d.warning);assert.equal(d.matches[0].changes[0].quantity,'molecular_weight');});
 for(const [name,edit] of [
   ['unbound inputs',b=>b.request.molecules[0]='CCO'],['numeric safety claim',b=>b.result.rows[0].properties[7].value=0],
   ['missing method',b=>delete b.result.rows[0].properties[0].method],['wrong molecular identity',b=>b.result.rows[0].identity_sha256='0'.repeat(64)],
   ['missing validation record',b=>delete b.result.rows[0].properties[0].validation_record],['missing predictive status',b=>delete b.result.rows[0].properties[0].predictive_validation],
   ['missing result assessment',b=>delete b.result.scientific_assessment],['missing identity policy',b=>delete b.result.identity_policy],
   ['missing tie-break',b=>delete b.result.ranking.tie_break],['missing reference correspondence',b=>delete b.result.rows[0].references[0].correspondence]
 ])await check('Comparison rejects '+name,async()=>{const b=structuredClone(ref);edit(b);await rehash(b);await assert.rejects(()=>compareLabPackages(ref,b));await assert.rejects(()=>compareLabPackages(b,ref));});
 await check('Local token trimming accepts newline only around a valid token',()=>assert.equal(parseLocalToken(' '+ 'a'.repeat(43)+'\r\n'),'a'.repeat(43)));
 for(const value of ['', 'too-short', 'a'.repeat(257), 'a'.repeat(32)+' secret', '<script>'+ 'a'.repeat(40)])await check('Malformed token file rejected '+results.length,()=>assert.throws(()=>parseLocalToken(value)));
 const original=global.fetch;
 try{
  await check('No credential means no readiness request',async()=>{global.fetch=()=>{throw Error('Unexpected call');};await assert.rejects(()=>checkLabConnection(''),/Load your/);});
  await check('Worker not ready cannot become ready UI',async()=>{global.fetch=async()=>({ok:false,json:async()=>({status:'not_ready'})});await assert.rejects(()=>checkLabConnection('a'.repeat(43)),/not ready/);});
  await check('Rejected token cannot become connected UI',async()=>{let n=0;global.fetch=async()=>++n===1?{ok:true,json:async()=>({status:'ready'})}:{ok:false};await assert.rejects(()=>checkLabConnection('a'.repeat(43)),/not accepted/);});
  await check('Unexpected server contract rejected',async()=>{let n=0;global.fetch=async()=>({ok:true,json:async()=>++n===1?{status:'ready'}:{contract_version:'unknown'}});await assert.rejects(()=>checkLabConnection('a'.repeat(43)),/Unexpected server/);});
  await check('Healthy worker plus authenticated supported API succeeds',async()=>{let n=0;global.fetch=async(url,options)=>{if(n===1)assert.equal(options.headers.Authorization,'Bearer '+'a'.repeat(43));return {ok:true,json:async()=>++n===1?{status:'ready'}:{contract_version:'3.1.0',scientific_release:'blocked',sensitive_intake:'blocked'}};};assert((await checkLabConnection('a'.repeat(43))).includes('token accepted'));});
 }finally{global.fetch=original;}
 const output={scope:'Software checks only; user value untested',passed:results.length,checks:results};
 writeCheckOutput(path.join(root,'../hackathon/judging-upgrade/client-checks.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output));
})().catch(e=>{console.error(e);process.exitCode=1;});
