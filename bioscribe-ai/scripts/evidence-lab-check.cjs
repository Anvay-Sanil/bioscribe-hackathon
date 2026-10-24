const writeCheckOutput=require('./check-output.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),Module=require('node:module');
const root=path.resolve(__dirname,'..');
const filename=path.join(root,'src/lib/phase3/lab.ts'),loaded=new Module(filename,module);
loaded.filename=filename;loaded.paths=Module._nodeModulePaths(path.dirname(filename));
loaded._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const {decodeLab,canonicalLab,hashLab,filterLab,labReportHTML}=loaded.exports;
const read=name=>JSON.parse(fs.readFileSync(path.join(root,'public/evidence-lab',name+'-run.json'),'utf8'));
const checks=[];
async function check(name,fn){await fn();checks.push(name);}
async function rehash(p){p.result_sha256=await hashLab(canonicalLab(p.result));return p;}
(async()=>{
  const ref=read('reference'),challenge=read('challenge');
  const current=JSON.parse(fs.readFileSync(path.join(root,'public/evidence-lab/v1.1-spelling-case.json'),'utf8'));
  await check('Current 1.1 capsule validates alongside archived 1.0',async()=>assert.deepEqual(await decodeLab(current),current));
  await check('Current tied selection uses canonical graph hash',()=>{
    const rows=current.result.rows;
    const expected=[...rows.slice(0,2)].sort((a,b)=>a.identity_sha256.localeCompare(b.identity_sha256))[0].index;
    assert.equal(current.result.ranking.heuristic_selection[0],expected);
  });
  await check('Current report names the graph-based tie rule',()=>assert(labReportHTML(current).includes('identity_sha256_then_index')));
  await check('Current capsule cannot relabel its rule to the historical tie-break',async()=>{const p=structuredClone(current);p.result.ranking.tie_break='input_sha256_then_index';await rehash(p);await assert.rejects(()=>decodeLab(p));});
  for(const [name,p] of [['reference',ref],['challenge',challenge]])await check(name+' contract and all scientific hashes',async()=>assert.deepEqual(await decodeLab(p),p));
  await check('All 12 records survive challenge parsing',()=>assert.equal(challenge.result.rows.length,12));
  await check('Unknown labels are not invented',()=>assert(!('labels' in ref.result)&&ref.result.scientific_assessment==='not_assessed'));
  await check('Six frozen references are bound to sources',()=>assert.equal(ref.result.rows.reduce((n,r)=>n+r.references.length,0),6));
  await check('Whitespace input has its own code',()=>assert.equal(challenge.result.rows[6].diagnostics[0].code,'whitespace_or_control'));
  await check('Three missingness states remain distinct',()=>assert.deepEqual([...new Set(challenge.result.rows.flatMap(r=>r.properties.map(p=>p.availability)))].sort(),['computed','not_applicable','not_available','not_computed']));
  for(const [name,edit] of [
    ['wrong input',p=>p.request.molecules[0]='CCO'],
    ['wrong row',p=>p.result.rows[0].original_smiles='CCO'],
    ['reassuring toxicity',p=>p.result.rows[0].properties[7].value=0],
    ['wrong units',p=>p.result.rows[0].properties[0].units='kcal/mol'],
    ['unsupported method',p=>p.result.rows[0].properties[0].method='old/1.0'],
    ['missing coverage',p=>p.result.rows[0].properties[0].coverage='none'],
    ['null computed value',p=>p.result.rows[0].properties[0].value=null],
    ['missing status',p=>delete p.result.rows[0].properties[0].availability],
    ['unearned validation',p=>p.result.rows[0].properties[0].predictive_validation='validated'],
    ['property removed',p=>p.result.rows[0].properties.pop()],
    ['wrong category',p=>p.result.rows[0].properties[0].evidence_category='unvalidated_heuristic'],
    ['wrong identity',p=>p.result.rows[0].identity_sha256='0'.repeat(64)],
    ['wrong budget',p=>p.result.ranking.budget=1],
    ['wrong rank ordering',p=>p.result.ranking.heuristic_order.reverse()],
    ['wrong shortlist',p=>p.result.ranking.heuristic_selection=[2,0]],
    ['wrong identity groups',p=>p.result.identity_groups=[[0,1,2]]],
    ['raw record altered',p=>p.bundle.references['pubchem-2244.json']+=' '],
    ['source altered',p=>p.bundle.sources['engine.py']+=' '],
    ['contract changed',p=>p.format='bioscribe-replay/0.9'],
  ])await check('Reject '+name+' even with a refreshed result checksum',async()=>{const p=structuredClone(ref);edit(p);await rehash(p);await assert.rejects(()=>decodeLab(p));});
  await check('Rejected input cannot acquire numeric descriptors',async()=>{const p=structuredClone(challenge);p.result.rows[2].properties[0].value=123;await rehash(p);await assert.rejects(()=>decodeLab(p));});
  await check('Library-wide selection cannot be populated on failure',async()=>{const p=structuredClone(challenge);p.result.ranking.heuristic_selection=[0];await rehash(p);await assert.rejects(()=>decodeLab(p));});
  await check('Filter preserves the report',()=>{const before=JSON.stringify(challenge);assert.equal(filterLab(challenge.result.rows,'','rejected').length,6);assert.equal(filterLab(challenge.result.rows,'','all').length,12);assert.equal(JSON.stringify(challenge),before);});
  await check('Search by source identity',()=>assert.equal(filterLab(ref.result.rows,'CHEMBL25','all').length,1));
  await check('Search by input SMILES',()=>assert.equal(filterLab(challenge.result.rows,'C1CC','rejected').length,1));
  await check('Blank result gives no stale rows',()=>assert.deepEqual(filterLab([],'','all'),[]));
  await check('Full report includes all original records and missingness',()=>{const html=labReportHTML(challenge);assert.equal((html.match(/<h2>#/g)||[]).length,12);for(const text of ['Not computed','Not applicable','Not available',challenge.result_sha256])assert(html.includes(text));});
  await check('Full report escapes hostile text instead of executing it',()=>{const p=structuredClone(ref);p.result.rows[0].original_smiles='<script>alert(1)</script>';const html=labReportHTML(p);assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));});
  await check('Full report includes every property and evidence method',()=>{const html=labReportHTML(ref);assert.equal((html.match(/bioscribe-evidence-lab\/1.0.0/g)||[]).length,27);assert(html.includes('PubChem')&&html.includes('ChEMBL'));});
  const out=path.join(root,'../hackathon/evidence-lab');fs.mkdirSync(out,{recursive:true});
  writeCheckOutput(path.join(out,'client-checks.json'),JSON.stringify({status:'passed',count:checks.length,checks},null,2));
  const invalid=structuredClone(ref);invalid.result.rows[0].properties[7].value=0;await rehash(invalid);writeCheckOutput(path.join(out,'invalid-package.json'),JSON.stringify(invalid));
  console.log(`${checks.length} Evidence Lab client checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
