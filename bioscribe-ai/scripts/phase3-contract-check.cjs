const writeCheckOutput=require('./check-output.cjs');
// Tests runtime decoding and rendering using the exact generated contract.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const Module=require('node:module');
const root=path.resolve(__dirname,'..');
const compile=(relative)=>{
  const filename=path.join(root,relative);
  const source=fs.readFileSync(filename,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const loaded=new Module(filename,module);
  loaded.filename=filename;loaded.paths=Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(code,filename);return loaded.exports;
};
const {decodeRun}=compile('src/lib/phase3/client.ts');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'../docs/phase3-example-run.json'),'utf8'));
assert.equal(decodeRun(fixture).run_id,fixture.run_id);
let checked=1;
const current=JSON.parse(fs.readFileSync(path.join(root,'public/hackathon/current-contract-run.json'),'utf8'));
assert.equal(decodeRun(current).artifact.contract_version,'3.1.0');checked++;
assert.equal(decodeRun(fixture).artifact.contract_version,'3.0.0');checked++;
for(const mutate of [
  x=>x.contract_version='2.0',
  x=>x.artifact.run_id='b'.repeat(32),
  x=>x.artifact.outputs[0].method_version='unknown',
  x=>x.artifact.outputs.find(f=>f.method_id==='rdkit_descriptors').method_version='1.0.0',
  x=>x.artifact.outputs[0].validation_record='approved',
  x=>x.artifact.outputs[0].coverage.analyzed=999999,
  x=>x.artifact.outputs[0].input_sha256='f'.repeat(64),
  x=>x.artifact.outputs[0].input_sha256=x.artifact.chemical_identities[0].input_sha256,
  x=>x.artifact.outputs[0].field_id='record.99.length',
  x=>x.artifact.outputs[0].field_id='record.0.validated_binding_affinity',
  x=>x.artifact.outputs[0].field_id='record.00.length',
  x=>{x.artifact.outputs[0].field_id='molecule.0.length';x.artifact.outputs[0].input_sha256=x.artifact.chemical_identities[0].input_sha256;},
  x=>x.artifact.outputs[0].assessment_status='validated',
  x=>x.artifact.outputs.find(f=>f.evidence_category==='model_prediction').value=1,
  x=>x.artifact.outputs.find(f=>f.evidence_category==='unvalidated_heuristic').units='kcal/mol',
  x=>x.artifact.outputs.push(x.artifact.outputs[0]),
  x=>x.status='failed',
]){
  const candidate=structuredClone(fixture);mutate(candidate);
  assert.throws(()=>decodeRun(candidate));checked++;
}
for(const state of ['queued','running','failed','cancelled']){
  const candidate={...fixture,status:state,artifact:null,artifact_sha256:null};
  assert.equal(decodeRun(candidate).artifact,null);checked++;
}
const fields=fixture.artifact.outputs;
assert(fields.some(f=>f.assessment_status==='computed'));
assert(fields.some(f=>f.assessment_status==='not_assessed'&&f.value===null));
assert(fields.every(f=>f.validation_record===null));
checked+=3;
const report={status:'passed',checks:checked,scope:'Generated JSON Schema plus client semantic decoder; synthetic persisted API/export fixture'};
writeCheckOutput(path.join(root,'../docs/phase3-client-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(report);
