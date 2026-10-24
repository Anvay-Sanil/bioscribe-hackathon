// Consolidate actual artifacts. Checksums are correspondence records, not trusted signatures.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
function suite(file){
  const xml=fs.readFileSync(path.join(root,file),'utf8');const tag=xml.match(/<testsuite\s[^>]+>/)[0];
  const number=k=>Number(tag.match(new RegExp(`\\b${k}="([^"]+)"`))?.[1]||0);
  assert.equal(number('failures'),0);assert.equal(number('errors'),0);
  return {status:'passed',tests:number('tests'),seconds:number('time'),evidence:file};
}
const full=suite('docs/evidence-assistant-all-backend-tests.xml');
const fullXml=fs.readFileSync(path.join(root,full.evidence),'utf8');
const assistantCases=[...fullXml.matchAll(/<testcase\s[^>]*classname="tests_assistant\.[^"]+"[^>]*>/g)];
const assistant={status:'passed',tests:assistantCases.length,evidence:full.evidence,subset:'tests_assistant.*'};
assert.equal(full.tests,300);assert.equal(assistant.tests,66);
const client=read('docs/evidence-assistant-client-checks.json');assert.equal(client.status,'passed');assert.equal(client.count,18);
const browser=read('docs/evidence-assistant-browser-checks.json');assert.equal(browser.status,'passed');
const exported=read('docs/evidence-assistant-browser-export.verification.json');assert.equal(exported.status,'passed');
assert.equal(digest('docs/evidence-assistant-browser-export.json'),exported.export_sha256);
const build=fs.readFileSync(path.join(root,'docs/evidence-assistant-build.txt'),'utf8');
assert.match(build,/Compiled successfully/);assert.match(build,/Generating static pages \(11\/11\)/);assert.match(build,/evidence-assistant/);
const exploratory=read('validation/evidence_assistant/provisional-report.json');
assert.equal(exploratory.qualification,'not_assessed');assert.equal(exploratory.baseline_beaten,null);
const smokePath='docs/evidence-assistant-baseline-smoke.json';
const smoke=fs.existsSync(path.join(root,smokePath))?read(smokePath):null;
const longSmokePath='docs/evidence-assistant-baseline-long-context-smoke.json';
const longSmoke=fs.existsSync(path.join(root,longSmokePath))?read(longSmokePath):null;
const modelSmokePath='docs/evidence-assistant-model-smoke.json';
const modelSmoke=fs.existsSync(path.join(root,modelSmokePath))?read(modelSmokePath):null;
const live=read('docs/evidence-assistant-live-smoke.json');assert.equal(live.status,'passed');
const modelAuth=read('docs/evidence-assistant-model-auth.json');assert.equal(modelAuth.status,'passed');assert.equal(modelAuth.unauthenticated_status,401);
const verification={recorded_utc:new Date().toISOString(),scope:'Bounded molecular source-record research assistant; public-data workflow only',
  backend:{command:'cd backend; ../.phase3-venv/Scripts/python.exe -B -m pytest tests_phase3 tests_lab tests_assistant -q -p no:cacheprovider --junitxml=../docs/evidence-assistant-all-backend-tests.xml',...full,warning:'One existing Starlette/AnyIO deprecation warning'},
  assistant_regressions:{command:'Same full backend command; subset selected by testcase classname',...assistant,note:'Included in full backend count; do not add counts'},
  client:{command:'cd bioscribe-ai; node scripts/evidence-assistant-check.cjs',count:client.count,status:client.status,evidence:'docs/evidence-assistant-client-checks.json'},
  frontend:{command:'cd bioscribe-ai; npm.cmd run build',status:'passed',includes:['production compilation','lint','TypeScript checking','static generation'],evidence:'docs/evidence-assistant-build.txt'},
  browser:{status:browser.status,checks:browser.checks.length,evidence:'docs/evidence-assistant-browser-checks.json',scope:'Observed local browser interactions, not independent user testing'},
  browser_export:{...exported,evidence:'docs/evidence-assistant-browser-export.json'},
  final_live_api:{status:live.status,checks:live.checks.length,run_id:live.run_id,evidence:'docs/evidence-assistant-live-smoke.json'},
  model_inference:modelSmoke?{status:modelSmoke.status,evidence:modelSmokePath}:{status:'not_verified',reason:'No model inference receipt present'},
  model_gateway:{status:modelAuth.status,unauthenticated_status:modelAuth.unauthenticated_status,evidence:'docs/evidence-assistant-model-auth.json'},
  baseline_smoke:smoke?{status:smoke.baseline_status,attempted:Object.keys(smoke.predictions.baseline).length,valid:smoke.retrieval_plus_llm.evaluated,failed:Object.values(smoke.predictions.baseline).filter(p=>p.status==='failed').length,timeout_seconds:90,evidence:smokePath}:{status:'not_run'},
  longer_budget_baseline_smoke:longSmoke?{status:longSmoke.baseline_status,attempted:longSmoke.baseline_attempted_count,valid:longSmoke.retrieval_plus_llm.evaluated,timeout_seconds:longSmoke.baseline_model_timeout_seconds,evidence:longSmokePath}:{status:'not_run'},
  evaluation:{claims:150,label_status:'provisional_unreviewed',independent_review:'not_done',full_comparison:'not_run',baseline_beaten:null,scientific_assessment:'not_assessed',evidence:'validation/evidence_assistant/provisional-report.json',warning:'Template/draft-label agreement is not biological accuracy or independent model qualification'},
  external_benchmarks:{status:'source_assessed_not_imported',evidence:'validation/evidence_assistant/EXTERNAL_BENCHMARK_REVIEW.md'},
  dependencies:{python_lock:'backend/requirements-phase3.lock',frontend_lock:'bioscribe-ai/package-lock.json',change:'Existing dependency locks unchanged by this extension; optional native model/runtime pinned separately'},
  remaining_gates:['Arbitrary scientific paper-passage entailment not implemented','Semantic decomposition completeness unverified','Provisional claims are template-heavy and developer-exposed; no protected holdout','Independent scientific label, citation, retraction and scope adjudication absent','No independently validated confidence calibration','No complete fair 150-claim model comparison or demonstrated baseline win','Publication-status checks have bounded provider/as-of coverage; genuine retraction challenge evaluation absent','Fresh dependency clean-install, new Docker runtime and second-machine verification not repeated for this extension','Scientific release, sensitive-data intake and production deployment remain blocked'],
  study:'Existing blocked ALDH1A1 study remains separate and unchanged',research_aid_label:'Research aid, not a prediction of efficacy or safety.'};
fs.writeFileSync(path.join(root,'docs/EVIDENCE_ASSISTANT_VERIFICATION.json'),JSON.stringify(verification,null,2)+'\n');
function walk(folder){return fs.readdirSync(path.join(root,folder),{withFileTypes:true}).flatMap(e=>e.name==='__pycache__'?[]:e.isDirectory()?walk(folder+'/'+e.name):[folder+'/'+e.name]);}
const files=[...walk('backend/evidence_assistant'),...walk('backend/tests_assistant'),...walk('validation/evidence_assistant'),
  ...walk('bioscribe-ai/src/app/evidence-assistant'),...walk('bioscribe-ai/public/evidence-assistant'),
  'bioscribe-ai/src/components/Phase3EvidenceAssistant.tsx','bioscribe-ai/src/lib/phase3/assistant.ts','bioscribe-ai/src/lib/phase3/EvidenceReview.schema.json','bioscribe-ai/scripts/evidence-assistant-check.cjs',
  'backend/bioscribe/api.py','bioscribe-ai/src/components/MainNavigation.tsx','bioscribe-ai/src/middleware.ts','Dockerfile','README.md',
  'backend/requirements-phase3.lock','bioscribe-ai/package-lock.json','hackathon/build_evidence_assistant.py','hackathon/prepare_evidence_model.py','hackathon/start-evidence-model.ps1','hackathon/verify_evidence_review_export.py','hackathon/check_evidence_assistant_live.py','hackathon/record-assistant-verification.cjs',
  ...fs.readdirSync(path.join(root,'docs')).filter(n=>n.startsWith('evidence-assistant-')).map(n=>'docs/'+n),
  'docs/EVIDENCE_ASSISTANT_IMPLEMENTATION.md','docs/EVIDENCE_ASSISTANT_DEMO.md','docs/EVIDENCE_ASSISTANT_VERIFICATION.json'];
const selected=[...new Set(files)].filter(p=>!p.endsWith('artifact-hashes.json')).sort();
fs.writeFileSync(path.join(root,'docs/evidence-assistant-artifact-hashes.json'),JSON.stringify({algorithm:'SHA-256',scope:'Current implementation, frozen sources, provisional study and verification; no authenticated checkpoint claim',files:Object.fromEntries(selected.map(p=>[p,digest(p)]))},null,2)+'\n');
console.log(JSON.stringify({backend:full.tests,assistant_included:assistant.tests,client:client.count,browser:browser.checks.length,artifact_hashes:selected.length,scientific_assessment:'not_assessed'}));
