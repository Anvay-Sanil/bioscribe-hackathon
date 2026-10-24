import {canonicalLab,decodeLab,hashLab,type LabJob,type LabPackage,type LabRequest,type LabRow} from './lab';

export const CHALLENGE_METHOD='bioscribe-experiment-challenges/1.0.0';
export const CHALLENGE_IDS=['reorder','canonical','duplicate','invalid','budget','forged'] as const;
export type ChallengeId=typeof CHALLENGE_IDS[number];
export type ChallengePlan={id:ChallengeId;title:string;question:string;expectation:string;mode:'analyze'|'replay';payload:LabRequest|LabPackage|null;skip:string|null};
export type ChallengeJob=LabJob&{request_sha256:string};
export type ChallengeRecord={id:ChallengeId;job:ChallengeJob|null;not_run:string|null};
export type ChallengeBody={format:'bioscribe-challenge-capsule/1.0.0';method:typeof CHALLENGE_METHOD;suite_id:string;created_utc:string;source_run_id:string;source_result_sha256:string;control:LabPackage;trials:ChallengeRecord[];scientific_assessment:'not_assessed';scope:'Recorded software challenge evidence; no authenticated authorship or biological qualification'};
export type ChallengeCapsule=ChallengeBody&{capsule_sha256:string};
export type ChallengeOutcome={id:ChallengeId;title:string;question:string;expectation:string;status:'passed'|'failed'|'not_run';observations:string[];run_id:string|null};
const identical=(a:unknown,b:unknown)=>canonicalLab(a)===canonicalLab(b);
const propertyState=(r:LabRow)=>r.properties;
const graphState=(rows:LabRow[])=>[...rows].map(r=>({identity:r.identity_sha256,properties:propertyState(r)})).sort((a,b)=>(a.identity||'').localeCompare(b.identity||''));
const selectionIdentities=(p:LabPackage,key:'heuristic_selection'|'qed_selection')=>p.result.ranking[key].map(i=>p.result.rows[i].identity_sha256);

export function challengeEligibility(p:LabPackage):string|null{
  if(p.result.ranking.status!=='computed')return 'Use a library with complete scores and unique, accepted graph identities. Resolve rejected or duplicate inputs first.';
  return null;
}

export async function planChallenges(raw:unknown):Promise<ChallengePlan[]>{
  const p=await decodeLab(raw),reason=challengeEligibility(p);if(reason)throw new Error(reason);
  const request=(molecules:string[],budget=p.request.budget):LabRequest=>({...p.request,molecules,budget});
  const canonical=p.result.rows.map(r=>r.canonical_smiles!);
  const forged=structuredClone(p);
  forged.result.rows[0].properties[0].value=Number((Number(forged.result.rows[0].properties[0].value)+1).toFixed(8));
  forged.result_sha256=await hashLab(canonicalLab(forged.result));
  const n=p.request.molecules.length;
  return [
    {id:'reorder',title:'Shuffle the library',question:'Does row order change the scientific result?',expectation:'Same graph identities, descriptors and selected graph identities after reversing row order.',mode:'analyze',payload:n>1?request([...p.request.molecules].reverse()):null,skip:n>1?null:'A one-record library cannot be reordered.'},
    {id:'canonical',title:'Change the spelling',question:'Does equivalent recorded notation preserve the descriptors?',expectation:'Canonical isomeric spellings retain graph identities and property records. Selection is not asserted: raw-input tie-breaks may change.',mode:'analyze',payload:identical(canonical,p.request.molecules)?null:request(canonical),skip:identical(canonical,p.request.molecules)?'All input strings already use the recorded canonical spelling.':null},
    {id:'duplicate',title:'Plant a duplicate',question:'Will a duplicate quietly count as a new candidate?',expectation:'The duplicate is retained with the same graph identity and properties; ranking is withheld.',mode:'analyze',payload:n<16?request([...p.request.molecules,p.request.molecules[0]]):null,skip:n<16?null:'Adding a record would exceed the 16-record limit.'},
    {id:'invalid',title:'Break one input',question:'Will a broken record vanish from the comparison?',expectation:'Replace the first row with an empty record. Preserve every row; reject that row, withhold its descriptors and all selections.',mode:'analyze',payload:request(['',...p.request.molecules.slice(1)]),skip:null},
    {id:'budget',title:'Move the budget',question:'Does changing the budget secretly change the scores?',expectation:'Same molecular rows and full rankings; the new selections are exact prefixes at the new budget.',mode:'analyze',payload:n>1?request([...p.request.molecules],p.request.budget===n?1:p.request.budget+1):null,skip:n>1?null:'There is no second valid budget for one record.'},
    {id:'forged',title:'Forge a number',question:'Can a changed number pass after its checksum is rebuilt?',expectation:'Change molecular weight by +1 and rebuild the result hash. Fresh server replay must fail with replay_result_mismatch.',mode:'replay',payload:forged,skip:null},
  ];
}

export async function evaluateChallenge(control:LabPackage,plan:ChallengePlan,record:ChallengeRecord):Promise<ChallengeOutcome>{
  const out:ChallengeOutcome={id:plan.id,title:plan.title,question:plan.question,expectation:plan.expectation,status:'failed',observations:[],run_id:record.job?.run_id||null};
  if(record.id!==plan.id)throw new Error('Challenge identifier mismatch.');
  if(plan.skip){if(record.job||record.not_run!==plan.skip)throw new Error('Skipped challenge has contradictory evidence.');return {...out,status:'not_run',observations:[plan.skip]};}
  if(record.not_run!==null)throw new Error('Applicable challenge cannot be labelled skipped.');
  const job=record.job;
  if(!job){out.observations=['No completed job receipt.'];return out;}
  if(job.request_sha256!==await hashLab(canonicalLab(plan.payload)))throw new Error('Challenge job is not bound to its planned request hash.');
  if(!/^[a-f0-9]{32}$/.test(job.run_id)||job.mode!==plan.mode||!['succeeded','failed','cancelled'].includes(job.status))throw new Error('Invalid challenge job receipt.');
  if(plan.id==='forged'){
    out.status=job.status==='failed'&&job.output===null&&job.error_code==='replay_result_mismatch'?'passed':'failed';
    out.observations=[out.status==='passed'?'Fresh replay rejected the changed value despite its internally consistent checksum.':`Expected replay_result_mismatch; observed ${job.status} / ${job.error_code||'no error'}.`];return out;
  }
  if(job.status!=='succeeded'||!job.output){out.observations=[`Computation did not complete: ${job.status} / ${job.error_code||'no error'}.`];return out;}
  const p=await decodeLab(job.output.package);
  if(job.run_id!==p.run_id||job.output.replay!==null||job.error_code!==null||!identical(p.request,plan.payload))throw new Error('Challenge output is not bound to its planned input and run.');
  if(p.result.engine_sha256!==control.result.engine_sha256||p.result.snapshot_sha256!==control.result.snapshot_sha256||p.result.identity_policy!==control.result.identity_policy){out.observations=['Engine, snapshot or identity policy changed. Comparison is withheld.'];return out;}
  let matches=false;
  if(plan.id==='reorder'||plan.id==='canonical'){
    matches=identical(graphState(p.result.rows),graphState(control.result.rows));
    if(plan.id==='reorder')matches=matches&&(['heuristic_selection','qed_selection'] as const).every(k=>identical(selectionIdentities(control,k),selectionIdentities(p,k)));
    out.observations=[matches?'Graph identities and complete property records were preserved.':'Graph identity, property records or required selected identities changed.'];
    if(plan.id==='canonical')out.observations.push('This test makes no claim about canonicalization beyond these specific spellings.');
  }else if(plan.id==='duplicate'){
    const last=p.result.rows[p.result.rows.length-1],first=control.result.rows[0];
    matches=identical(p.result.rows.slice(0,-1),control.result.rows)&&last.identity_sha256===first.identity_sha256&&identical(propertyState(last),propertyState(first))&&p.result.ranking.status==='not_assessed';
    out.observations=[matches?'Duplicate row retained; original records unchanged; both selections withheld.':'The duplicate, unchanged-row or ranking-abstention requirement failed.'];
  }else if(plan.id==='invalid'){
    const first=p.result.rows[0];
    matches=first.status==='rejected'&&first.diagnostics.some(d=>d.code==='empty_input')&&first.properties.every(f=>f.value===null)&&identical(p.result.rows.slice(1),control.result.rows.slice(1))&&p.result.ranking.status==='not_assessed';
    out.observations=[matches?'The empty row stayed in the library; no numeric value or shortlist was published for it. Other rows were preserved.':'The rejection, row-retention or ranking-abstention requirement failed.'];
  }else{
    matches=identical(p.result.rows,control.result.rows)&&(['heuristic_order','qed_order'] as const).every(k=>identical(p.result.ranking[k],control.result.ranking[k]))&&(['heuristic','qed'] as const).every(k=>identical(p.result.ranking[`${k}_selection`],control.result.ranking[`${k}_order`].slice(0,p.request.budget)));
    out.observations=[matches?`Budget ${control.request.budget} → ${p.request.budget}; properties and full rankings unchanged; selections are exact prefixes.`:'Changing the budget altered more than the permitted selection prefixes.'];
  }
  out.status=matches?'passed':'failed';return out;
}

export async function sealChallenges(body:ChallengeBody):Promise<ChallengeCapsule>{return {...body,capsule_sha256:await hashLab(canonicalLab(body))};}

function exactKeys(value:unknown,keys:string[]):asserts value is Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value)||!identical(Object.keys(value).sort(),[...keys].sort()))throw new Error('Invalid challenge capsule fields.');
}
export async function decodeChallenges(data:unknown):Promise<{capsule:ChallengeCapsule;outcomes:ChallengeOutcome[]}>{
  exactKeys(data,['format','method','suite_id','created_utc','source_run_id','source_result_sha256','control','trials','scientific_assessment','scope','capsule_sha256']);
  const c=data as unknown as ChallengeCapsule;
  if(c.format!=='bioscribe-challenge-capsule/1.0.0'||c.method!==CHALLENGE_METHOD||c.scientific_assessment!=='not_assessed'||c.scope!=='Recorded software challenge evidence; no authenticated authorship or biological qualification'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(c.created_utc)||!Number.isFinite(Date.parse(c.created_utc))||!/^[a-f0-9]{32}$/.test(c.suite_id)||!/^[a-f0-9]{32}$/.test(c.source_run_id))throw new Error('Unsupported challenge contract.');
  const {capsule_sha256,...body}=c;if(capsule_sha256!==await hashLab(canonicalLab(body)))throw new Error('Challenge capsule checksum mismatch.');
  const control=await decodeLab(c.control);
  if(control.result_sha256!==c.source_result_sha256)throw new Error('Control does not reproduce the source result.');
  const plans=await planChallenges(control);
  if(!Array.isArray(c.trials)||c.trials.length!==6)throw new Error('Exactly six challenge dispositions are required.');
  const seen=new Set([control.run_id]),outcomes:ChallengeOutcome[]=[];
  for(const [i,record] of c.trials.entries()){
    exactKeys(record,['id','job','not_run']);
    if(record.job){
      exactKeys(record.job,['run_id','request_sha256','mode','status','error_code','output']);
      if(record.job.error_code!==null&&(typeof record.job.error_code!=='string'||record.job.error_code.length>120))throw new Error('Invalid job error code.');
      if((record.job.status==='succeeded')!==(record.job.output!==null))throw new Error('Job status and output disagree.');
      if(record.job.output){
        exactKeys(record.job.output,['package','replay']);
        const p=await decodeLab(record.job.output.package);
        if(record.job.mode==='replay'&&(!record.job.output.replay||record.job.output.replay.status!=='matched'||record.job.output.replay.expected_sha256!==p.result_sha256||record.job.output.replay.actual_sha256!==p.result_sha256))throw new Error('Invalid replay receipt.');
      }
      if(seen.has(record.job.run_id))throw new Error('Challenge run reused.');seen.add(record.job.run_id);
    }
    outcomes.push(await evaluateChallenge(control,plans[i],record));
  }
  return {capsule:c,outcomes};
}
