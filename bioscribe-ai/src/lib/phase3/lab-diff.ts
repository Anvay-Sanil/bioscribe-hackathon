import {canonicalLab, decodeLab, type LabRow} from './lab';

// Both inputs cross the same import boundary as the viewer. Equality of recorded
// payloads is not a fresh computation, a provenance signature, or validation.
export async function compareLabPackages(before:unknown, after:unknown) {
  const a=await decodeLab(before), b=await decodeLab(after);
  const engineSame=a.result.engine_sha256===b.result.engine_sha256;
  const snapshotSame=a.result.snapshot_sha256===b.result.snapshot_sha256;
  const policySame=a.result.identity_policy===b.result.identity_policy;
  const inputsSame=canonicalLab(a.request.molecules)===canonicalLab(b.request.molecules);
  const budgetSame=a.request.budget===b.request.budget;
  const unique=(rows:LabRow[])=>{
    const groups=new Map<string,LabRow[]>();
    for(const row of rows)if(row.identity_sha256)groups.set(row.identity_sha256,[...(groups.get(row.identity_sha256)||[]),row]);
    return new Map([...groups].filter(([,rs])=>rs.length===1).map(([key,rs])=>[key,rs[0]]));
  };
  const left=unique(a.result.rows), right=unique(b.result.rows);
  const matches=[...left].flatMap(([identity,old])=>{
    const next=right.get(identity);if(!next)return [];
    const comparable=engineSame&&policySame;
    const changes=old.properties.flatMap(f=>{
      const n=next.properties.find(p=>p.quantity===f.quantity);
      if(!n||!comparable||f.method!==n.method||f.units!==n.units||f.availability!=='computed'||n.availability!=='computed')return [];
      return f.value===n.value?[]:[{quantity:f.quantity,before:f.value,after:n.value}];
    });
    return [{identity,canonical:old.canonical_smiles!,beforeIndex:old.index,afterIndex:next.index,spellingChanged:old.original_smiles!==next.original_smiles,comparable,changes}];
  });
  const unchanged=engineSame&&snapshotSame&&policySame&&inputsSame&&budgetSame;
  const budgetOnly=!budgetSame&&engineSame&&snapshotSame&&policySame&&inputsSame;
  return {
    beforeRun:a.run_id,afterRun:b.run_id,beforeHash:a.result_sha256,afterHash:b.result_sha256,
    sameScientificPayload:a.result_sha256===b.result_sha256,
    engineSame,snapshotSame,policySame,inputsSame,budgetSame,budgetOnly,
    beforeBudget:a.request.budget,afterBudget:b.request.budget,
    beforeCount:a.result.rows.length,afterCount:b.result.rows.length,
    unmatchedBefore:a.result.rows.length-matches.length,unmatchedAfter:b.result.rows.length-matches.length,
    matches,
    warning:unchanged&&a.result_sha256!==b.result_sha256?'Identical declared inputs and dependencies produced different recorded payloads. Recompute to investigate.':null,
    explanation:budgetOnly?'Only the selection budget changed. Compare the selection lists; molecular calculations should remain identical.':unchanged?'Inputs, budget, engine and source snapshot are unchanged.':'The recorded inputs or dependencies differ. This comparison identifies differences; it does not establish what caused them.',
    selectionComparison:budgetOnly&&a.result.ranking.status==='computed'&&b.result.ranking.status==='computed'?{
      heuristicBefore:a.result.ranking.heuristic_selection,heuristicAfter:b.result.ranking.heuristic_selection,
      qedBefore:a.result.ranking.qed_selection,qedAfter:b.result.ranking.qed_selection,
    }:null,
    scope:'Recorded package comparison only. Checksums do not authenticate authorship. Scientific assessment remains not_assessed.'
  };
}
export type LabDiff=Awaited<ReturnType<typeof compareLabPackages>>;

export function parseLocalToken(text:string):string {
  const token=text.trim();
  if(!/^[A-Za-z0-9_-]{32,256}$/.test(token))throw new Error('Choose the local demo-token.txt file. Its contents are not a supported token.');
  return token;
}

export async function checkLabConnection(token:string):Promise<string>{
  if(!token.trim())throw new Error('Load your local access token first.');
  const base=process.env.NEXT_PUBLIC_API_URL||'http://127.0.0.1:8000';
  const health=await fetch(base+'/health/ready',{cache:'no-store',signal:AbortSignal.timeout(5000)});
  const ready=await health.json();
  if(!health.ok||ready.status!=='ready')throw new Error('API or worker is not ready. Run the local demo launcher, then check again.');
  const auth=await fetch(base+'/v3/capabilities',{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(!auth.ok)throw new Error('Connection is available, but this access token was not accepted.');
  const caps=await auth.json();
  if(caps.contract_version!=='3.1.0'||caps.scientific_release!=='blocked'||caps.sensitive_intake!=='blocked')throw new Error('Unexpected server contract. Connection not confirmed.');
  return 'API and worker ready · token accepted. Checked now; a later run can still fail.';
}
