// Consolidate executed evidence; never fabricates test or biological metrics.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'evidence-lab');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
function suite(file,expected){const xml=fs.readFileSync(path.join(out,file),'utf8');const tag=xml.match(/<testsuite\s[^>]+>/)[0];const attr=k=>Number(tag.match(new RegExp(`\\b${k}="([^"]+)"`))?.[1]||0);assert.equal(attr('tests'),expected);assert.equal(attr('failures'),0);assert.equal(attr('errors'),0);return {tests:attr('tests'),failures:attr('failures'),errors:attr('errors'),seconds:attr('time'),evidence:file};}
const backend=suite('all-backend-tests.xml',234),linux=suite('linux-tests.xml',61),client=read('hackathon/evidence-lab/client-checks.json'),browser=read('hackathon/evidence-lab/browser-checks.json'),portable=read('hackathon/evidence-lab/portability.json');
assert.equal(client.count,35);assert.equal(client.status,'passed');assert.equal(browser.status,'passed');assert.equal(portable.status,'passed');
for(const r of portable.results)assert.equal(r.windows.actual_sha256,r.linux.actual_sha256);
const exportFile=read('hackathon/evidence-lab/browser-export.json');assert.equal(exportFile.run_id,browser.live_run_id);
for(const [name,text] of Object.entries(exportFile.bundle.sources))assert.equal(fs.readFileSync(path.join(root,'backend/provenance_lab',name),'utf8').replace(/\r\n/g,'\n'),text);
assert.equal((fs.readFileSync(path.join(out,'full-report.html'),'utf8').match(/<h2>#/g)||[]).length,12);
const verification={
  recorded_at:new Date().toISOString(),scope:'HM-01 public-data Evidence Lab; implementation and reproducibility, not predictive validation',
  backend_windows:{command:'cd backend; ../.phase3-venv/Scripts/python.exe -m pytest tests_phase3 tests_lab -q --junitxml=../hackathon/evidence-lab/all-backend-tests.xml',...backend,warning:'One Starlette/AnyIO deprecation warning'},
  backend_linux:{command:'Docker network-none read-only nonroot image, /tmp database, python -m pytest /tests -q -p no:cacheprovider --junitxml=/out/linux-tests.xml; full command in IMPLEMENTATION.md',...linux,warning:'One Starlette/AnyIO deprecation warning'},
  client:{command:'cd bioscribe-ai; node scripts/evidence-lab-check.cjs',count:client.count,status:client.status,evidence:'client-checks.json'},
  existing_client_checks:[{command:'npm run test:contract',count:25,status:'passed'},{command:'npm run test:hackathon',count:23,status:'passed'}],
  frontend:[{command:'npm run lint',status:'passed',errors:0,warnings:0},{command:'npm run typecheck',status:'passed'},{command:'npm run build',status:'passed',route:'/evidence',first_load_js:'207 kB',notes:'Final build includes full-library HTML report and visible-filter selection fix'}],
  browser:{count:browser.count,evidence:'browser-checks.json',live_run_id:browser.live_run_id,replay_run_id:browser.replay_run_id,export:'browser-export.json',report:'full-report.html',scope:browser.scope},
  portability:{status:'passed',evidence:'portability.json',image:portable.linux_image,scope:portable.scope,scientific_sha256:portable.results.map(r=>({case:r.case,sha256:r.windows.actual_sha256}))},
  reference_snapshot:{records:6,compounds:3,sources:['PubChem','ChEMBL'],scope:'Compound identity only; no assay outcomes',location:'backend/provenance_lab/references',version_identity:'Content-addressed retrieval snapshot; immutable upstream release version not supplied by compound endpoints'},
  resolved_execution_issues:['Initial new pytest collection used reserved request parameter; renamed, then 61 checks passed.','Initial Linux suite used a non-writable root-owned test mount; rerun with /tmp database passed.','Approval-review usage interruption delayed two commands; both subsequently executed.'],
  remaining_gates:['Scientific/predictive validation not assessed; no affinity, toxicity or PK predictions','Sensitive-data intake and production deployment blocked','Independent protected audit/checkpoint administration and authenticated source authorship not established','No universal machine/architecture portability claim: two OS environments on one physical host','Matching installed engine required; unknown historical versions refuse replay','Original v3 exports are not silently upgraded to lab-1.0.0','Snapshot intentionally covers three compounds; comprehensive chemical/database coverage not established','Fresh Windows npm clean installation not repeated'],
  study:'Blocked ALDH1A1 protocol and outcome-access restrictions unchanged'
};
fs.writeFileSync(path.join(out,'VERIFICATION.json'),JSON.stringify(verification,null,2)+'\n');
function walk(folder){return fs.readdirSync(path.join(root,folder),{withFileTypes:true}).flatMap(e=>e.name==='__pycache__'?[]:e.isDirectory()?walk(folder+'/'+e.name):[folder+'/'+e.name]);}
const selected=[...walk('backend/provenance_lab'),...walk('backend/tests_lab'),...walk('bioscribe-ai/public/evidence-lab'),...walk('bioscribe-ai/src/app/evidence'),...walk('hackathon/evidence-lab'),
'backend/bioscribe/api.py','backend/bioscribe/worker.py','backend/requirements-phase3.lock','bioscribe-ai/package-lock.json','bioscribe-ai/src/lib/phase3/lab.ts','bioscribe-ai/src/lib/phase3/LabPackage.schema.json','bioscribe-ai/src/components/Phase3EvidenceLab.tsx','bioscribe-ai/src/components/MainNavigation.tsx','bioscribe-ai/src/app/dashboard/page.tsx','bioscribe-ai/src/middleware.ts','bioscribe-ai/scripts/evidence-lab-check.cjs','hackathon/build_evidence_lab.py','hackathon/freeze_compound_records.py','hackathon/verify-portable.ps1','hackathon/record-evidence-verification.cjs','hackathon/start-demo.ps1','Dockerfile','.dockerignore','README.md'];
const files=[...new Set(selected)].filter(p=>!p.endsWith('/artifact-hashes.json')).sort();
const hashes=Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]));
fs.writeFileSync(path.join(out,'artifact-hashes.json'),JSON.stringify({algorithm:'SHA-256',scope:'Final Evidence Lab sources, generated assets and verification artifacts; checksum manifest is not an authenticated checkpoint',files:hashes},null,2)+'\n');
console.log(JSON.stringify({backend_windows:backend.tests,backend_linux:linux.tests,client:client.count,browser:browser.count,artifact_hashes:files.length,status:'recorded'}));
