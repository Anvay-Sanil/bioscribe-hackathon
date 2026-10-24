const writeCheckOutput=require('./check-output.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
function compile(relative) {
  const filename = path.join(root, relative), loaded = new Module(filename, module);
  loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText, filename);
  return loaded.exports;
}
const {decodeRun} = compile('src/lib/phase3/client.ts');
const {moleculeRows,shortlist,selectionExport,numberValue,conformerFor} = compile('src/lib/phase3/explorer.ts');
const read = name => JSON.parse(fs.readFileSync(path.join(root,'public/hackathon',name),'utf8'));
const run = decodeRun(read('example-run.json')), conformers = read('conformers.json'), request = read('example-request.json');
const rows = moleculeRows(run);
let checks = [];
function check(name, fn) {fn(); checks.push(name);}
check('Eight computed inputs with ordered request binding', () => {assert.equal(rows.length,8);assert.deepEqual(rows.map(r=>r.hash),request.molecules.map(s=>crypto.createHash('sha256').update(s).digest('hex')));});
check('All disabled predictions remain null', () => assert(run.artifact.outputs.filter(f=>f.evidence_category==='model_prediction').every(f=>f.value===null&&f.assessment_status==='not_assessed')));
check('Every example has its own canonical conformer', () => {for (const row of rows) assert.equal(conformerFor(row,conformers).canonical_isomeric_smiles,row.smiles);});
check('Unknown molecule never gets a substitute conformer', () => assert.equal(conformerFor({...rows[0],smiles:'CC'},conformers),undefined));
check('Unsupported graph never gets a conformer', () => assert.equal(conformerFor({...rows[0],status:'unsupported_input'},conformers),undefined));
check('Conformer text hashes match', () => {for (const c of conformers) assert.equal(crypto.createHash('sha256').update(c.molblock).digest('hex'),c.molblock_sha256);});
check('Budget produces exact cardinality', () => {for(let n=1;n<=8;n++) assert.equal(shortlist(rows,n).rows.length,n);});
check('Smaller budget is a prefix', () => assert.deepEqual(shortlist(rows,2).rows,shortlist(rows,8).rows.slice(0,2)));
check('Scores ascending', () => {const scores=shortlist(rows,8).rows.map(r=>numberValue(r.score));assert(scores.every((s,i)=>i===0||s>=scores[i-1]));});
check('Stable ties use input hashes', () => {const tied=rows.map(r=>({...r,score:{...r.score,value:1}}));assert.deepEqual(shortlist(tied,8).rows.map(r=>r.hash),tied.map(r=>r.hash).sort());});
check('Invalid budgets abstain', () => {for(const n of [0,-1,9,1.5,NaN,Infinity]) assert.equal(shortlist(rows,n).rows.length,0);});
check('Unsupported rows withhold entire selection', () => assert.equal(shortlist([{...rows[0],status:'unsupported_input'},...rows.slice(1)],3).rows.length,0));
check('Missing scores withhold entire selection', () => assert.equal(shortlist([{...rows[0],score:undefined},...rows.slice(1)],3).rows.length,0));
check('Duplicate canonical identities withhold selection', () => assert.equal(shortlist([...rows,rows[0]],3).rows.length,0));
check('Incomplete coverage has no numeric score', () => assert.equal(numberValue({...rows[0].score,coverage:{...rows[0].score.coverage,complete:false}}),null));
check('Export binds selection to exact source run', () => {const exported=selectionExport(run,3);assert.deepEqual(exported.source_run,run);assert.equal(exported.run_id,run.run_id);assert.equal(exported.selected.length,3);assert.equal(exported.scientific_assessment,'not_assessed');assert.deepEqual(exported.selected.map(x=>x.input_sha256),shortlist(rows,3).rows.map(x=>x.hash));});
check('Bad budget cannot produce selected export rows', () => assert.equal(selectionExport(run,99).selected.length,0));
check('Wrong field identity is rejected on import', () => {const bad=structuredClone(run);bad.artifact.outputs[0].input_sha256='0'.repeat(64);assert.throws(()=>decodeRun(bad));});
check('Reassuring prediction is rejected on import', () => {const bad=structuredClone(run);bad.artifact.outputs.find(f=>f.evidence_category==='model_prediction').value=0;assert.throws(()=>decodeRun(bad));});
const learning = require(path.join(root,'public/hackathon-learning/report.js'));
const vm = require('node:vm'), sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(root,'public/hackathon-learning/examples.js'),'utf8'),sandbox);
for(const [key, report] of Object.entries(sandbox.HackathonExamples)) {
  check(`Synthetic ${key} passes the accepted parser`, () => {const decoded=learning.parseReport(JSON.stringify(report));assert.equal(decoded.rows.length,120);if(key==='unknown'){assert.equal(decoded.status,'insufficient_evidence');assert.equal(decoded.selections,null);}});
}
check('Learning parser and filter copies unchanged', () => {for(const name of ['report.js','filters.js']) assert.equal(fs.readFileSync(path.join(root,'public/hackathon-learning',name),'utf8'),fs.readFileSync(path.join(root,'../learning/viewer',name),'utf8'));});
console.log(`${checks.length} hackathon checks passed`);
writeCheckOutput(path.join(root,'../hackathon/software-checks.json'),JSON.stringify({status:'passed',count:checks.length,checks},null,2));
const invalid=structuredClone(run); invalid.artifact.outputs.find(f=>f.evidence_category==='model_prediction').value=0;
writeCheckOutput(path.join(root,'../hackathon/invalid-report-fixture.json'),JSON.stringify(invalid));
