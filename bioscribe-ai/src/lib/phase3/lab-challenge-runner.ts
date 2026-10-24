import {canonicalLab,hashLab,labAPI,type LabPackage,type LabRequest} from './lab';
import {CHALLENGE_METHOD,decodeChallenges,planChallenges,sealChallenges,type ChallengeJob,type ChallengeRecord} from './lab-challenges';

type API=typeof labAPI;
export type ChallengeProgress={label:string;completed:number;run_id:string|null};
// Dependency injection permits failure/recovery checks without a running server.
export async function runChallenges(source:LabPackage,token:string,signal:AbortSignal,onProgress:(p:ChallengeProgress)=>void,api:API=labAPI,delay=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms))){
  if(!token.trim())throw new Error('Load a local access token before running challenges.');
  await planChallenges(source);
  let active:string|null=null,completed=0;
  const deadline=Date.now()+240_000;
  const guard=()=>{if(signal.aborted)throw new Error('Challenges stopped. No completed capsule published.');if(Date.now()>deadline)throw new Error('Challenge suite exceeded four minutes. No completed capsule published.');};
  async function job(mode:'analyze'|'replay',payload:LabRequest|LabPackage,label:string){
    guard();let j=await api(mode==='analyze'?'/lab/runs':'/lab/replay',token,payload);active=j.run_id;
    const jobDeadline=Date.now()+45_000;
    while(j.status==='queued'||j.status==='running'){
      guard();if(Date.now()>jobDeadline)throw new Error(`Challenge timed out. Saved run ${j.run_id}.`);
      onProgress({label,completed,run_id:j.run_id});await delay(500);guard();j=await api(`/lab/runs/${j.run_id}`,token);
    }
    guard();if(j.mode!==mode)throw new Error('Unexpected job mode.');
    const requestHash=(j as ChallengeJob).request_sha256;
    if(requestHash!==await hashLab(canonicalLab(payload)))throw new Error('Saved job request hash differs from the planned challenge.');
    active=null;return {run_id:j.run_id,request_sha256:requestHash,mode:j.mode,status:j.status,error_code:j.error_code,output:j.output} as ChallengeJob;
  }
  try{
    onProgress({label:'Recompute the unmodified control',completed,run_id:null});
    const controlJob=await job('analyze',source.request,'Recompute the unmodified control');
    if(controlJob.status!=='succeeded'||!controlJob.output)throw new Error('Control computation failed. Challenges were not evaluated.');
    const control=controlJob.output.package;
    if(controlJob.run_id!==control.run_id||control.result_sha256!==source.result_sha256||canonicalLab(control.request)!==canonicalLab(source.request))throw new Error('Fresh control differs from the displayed source. Investigate before interpreting challenges.');
    const plans=await planChallenges(control),trials:ChallengeRecord[]=[];
    for(const plan of plans){
      guard();onProgress({label:plan.title,completed,run_id:null});
      trials.push({id:plan.id,job:plan.payload?await job(plan.mode,plan.payload,plan.title):null,not_run:plan.skip});completed++;
      onProgress({label:plan.title,completed,run_id:null});
    }
    const capsule=await sealChallenges({format:'bioscribe-challenge-capsule/1.0.0',method:CHALLENGE_METHOD,suite_id:crypto.randomUUID().replaceAll('-',''),created_utc:new Date().toISOString(),source_run_id:source.run_id,source_result_sha256:source.result_sha256,control,trials,scientific_assessment:'not_assessed',scope:'Recorded software challenge evidence; no authenticated authorship or biological qualification'});
    return await decodeChallenges(capsule);
  }catch(e){
    if(active){onProgress({label:'Stopping active job; its saved ID remains available',completed,run_id:active});try{await api(`/lab/runs/${active}/cancel`,token,{});}catch{throw new Error(`Stopped locally; server cancellation could not be confirmed. Retrieve saved run ${active}.`);}}
    throw e;
  }
}
