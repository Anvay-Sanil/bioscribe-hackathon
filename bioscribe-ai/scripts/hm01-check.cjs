const writeCheckOutput=require('./check-output.cjs');
// Targeted consumer checks for the HM-01 acceptance report. No app code mutation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ts=require('typescript'),Module=require('node:module');
const root=path.resolve(__dirname,'..');
function compile(relative){
  const filename=path.join(root,relative),loaded=new Module(filename,module);
  loaded.filename=filename;loaded.paths=Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
  return loaded.exports;
}
const {decodeRun}=compile('src/lib/phase3/client.ts');
const {moleculeRows,numberValue,shortlist,conformerFor,selectionExport}=compile('src/lib/phase3/explorer.ts');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'../hackathon/hm01/mixed-case-run.json'),'utf8'));
const run=decodeRun(fixture),rows=moleculeRows(run);
const conformers=JSON.parse(fs.readFileSync(path.join(root,'public/hackathon/conformers.json'),'utf8'));
const checks=[];
function check(name,fn){fn();checks.push(name);}
check('Mixed-input export decodes with all four input positions',()=>assert.deepEqual(rows.map(r=>r.status),['identified','unsupported_input','unsupported_input','identified']));
check('Malformed ring produces no visible numeric molecular weight',()=>assert.equal(numberValue(rows[1].mw),null));
check('Dummy graph produces no visible numeric molecular weight',()=>assert.equal(numberValue(rows[2].mw),null));
check('Unsupported rows cannot inherit an example conformer',()=>{assert.equal(conformerFor(rows[1],conformers),undefined);assert.equal(conformerFor(rows[2],conformers),undefined);});
check('Valid ethanol has real computed fields',()=>assert.equal(numberValue(rows[0].mw),46.069));
check('Mixed library blocks the whole shortlist without silently dropping rows',()=>{const result=shortlist(rows,1);assert.equal(result.rows.length,0);assert.match(result.reason,/Incomplete molecular coverage/);});
check('Abstaining shortlist export retains all source evidence',()=>{const result=selectionExport(run,1);assert.equal(result.status,'not_assessed');assert.equal(result.source_run.artifact.chemical_identities.length,4);assert.equal(result.selected.length,0);});
check('Equivalent canonical identities block duplicate selection',()=>{const result=shortlist([rows[0],{...rows[0],index:4,hash:'f'.repeat(64)}],1);assert.equal(result.rows.length,0);assert.match(result.reason,/Repeated canonical identities/);});
const result={status:'passed',count:checks.length,checks,scope:'Existing client contract and explorer guards; does not close HM-01 missing-capability gates'};
writeCheckOutput(path.join(root,'../hackathon/hm01/client-checks.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
