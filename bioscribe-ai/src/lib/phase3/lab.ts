import Ajv from 'ajv';
import schema from './LabPackage.schema.json';
import historicalSchema from './LegacyLabPackage.schema.json';

export type Availability = 'computed' | 'not_computed' | 'not_available' | 'not_applicable';
export type LabProperty = {quantity:string;value:number|null;units:string|null;availability:Availability;assessment_status:string;evidence_category:string;method:string;implementation_fidelity:string;predictive_validation:string;validation_record:null;domain:string;coverage:string;reason:string};
export type LabDiagnostic = {code:string;severity:'error'|'warning';message:string;character_offset:number|null;atom_indices:number[];bond_indices:number[]};
export type LabReference = {source:'PubChem'|'ChEMBL';identifier:string;label:string;raw_sha256:string;retrieved_utc:string;source_version:string;url:string;correspondence:string};
export type LabRow = {index:number;original_smiles:string;input_sha256:string;status:'identified'|'rejected';canonical_smiles:string|null;identity_sha256:string|null;formal_charge:number|null;fragments:number|null;normalization_history:string[];diagnostics:LabDiagnostic[];properties:LabProperty[];references:LabReference[];reference_status:string};
export type LabRequest = {contract_version:'lab-1.0.0'|'lab-1.1.0';data_scope:'public_non_sensitive';molecules:string[];budget:number};
export type LabPackage = {format:'bioscribe-replay/1.0.0';run_id:string;request:LabRequest;result:{contract_version:string;request_sha256:string;engine_sha256:string;snapshot_sha256:string;identity_policy:string;rows:LabRow[];identity_groups:number[][];ranking:{status:'computed'|'not_assessed';reason:string;budget:number;heuristic_order:number[];qed_order:number[];heuristic_selection:number[];qed_selection:number[];tie_break:string;interpretation:string};scientific_assessment:string;sensitive_intake:string};result_sha256:string;bundle:{sources:Record<string,string>;dependency_lock:string;installation_lock?:string;references:Record<string,string>};runtime:Record<string,string>;integrity_scope:string};
export type ReplayReceipt = {status:'matched';expected_sha256:string;actual_sha256:string;scientific_assessment:string;comparison:string;network:string};
export type LabJob = {run_id:string;mode:'analyze'|'replay';status:'queued'|'running'|'succeeded'|'failed'|'cancelled';error_code:string|null;output:{package:LabPackage;replay:ReplayReceipt|null}|null};

// Pydantic input defaults are convenient during construction, but exported
// evidence must state every field. Never infer a missing method or validation
// status while accepting a report. Do not mutate the generated schema artifact.
function completeOutputSchema(value:unknown):unknown {
  if(Array.isArray(value))return value.map(completeOutputSchema);
  if(value&&typeof value==='object'){
    const result:Record<string,unknown>=Object.fromEntries(Object.entries(value).map(([key,item])=>[key,completeOutputSchema(item)]));
    if(result.type==='object'&&result.properties)result.required=Object.keys(result.properties as object);
    return result;
  }
  return value;
}
const validators = [schema,historicalSchema].map(s=>new Ajv({allErrors:true}).compile(completeOutputSchema(s) as object));
export const fieldNames:Record<string,string> = {molecular_weight:'Molecular weight',calculated_logp:'Calculated logP',tpsa:'Polar surface area',aromatic_heavy_atom_fraction:'Aromatic heavy-atom fraction',qed:'QED descriptor',descriptor_distance:'Descriptor distance',binding_affinity:'Binding affinity',toxicity:'Toxicity',half_life:'Half-life'};
export const availabilityNames:Record<Availability,string> = {computed:'Computed',not_computed:'Not computed',not_available:'Not available',not_applicable:'Not applicable'};
const specs:Record<string,[string|null,string]>={molecular_weight:['g/mol','computed_descriptor'],calculated_logp:['dimensionless','computed_descriptor'],tpsa:['angstrom^2','computed_descriptor'],aromatic_heavy_atom_fraction:['dimensionless','computed_descriptor'],qed:['dimensionless','computed_descriptor'],descriptor_distance:['dimensionless','unvalidated_heuristic'],binding_affinity:[null,'model_prediction'],toxicity:[null,'model_prediction'],half_life:[null,'model_prediction']};

export function canonicalLab(value:unknown):string {
  if(Array.isArray(value)) return '['+value.map(canonicalLab).join(',')+']';
  if(value!==null && typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>canonicalLab(k)+':'+canonicalLab(v)).join(',')+'}';
  if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Non-finite value.');
  return JSON.stringify(value).replace(/[\u0080-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
}
export async function hashLab(text:string):Promise<string>{return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}

export async function decodeLab(data:unknown):Promise<LabPackage>{
  if(!validators.some(validate=>validate(data))) throw new Error('Incompatible replay contract. Previous results cleared.');
  const p=data as LabPackage,r=p.result;
  const mismatch=()=>{throw new Error('Evidence, identity or checksum mismatch. Previous results cleared.');};
  if(p.request.budget>p.request.molecules.length||r.rows.length!==p.request.molecules.length||r.request_sha256!==await hashLab(canonicalLab(p.request))||r.engine_sha256!==await hashLab(canonicalLab({sources:p.bundle.sources,dependency_lock:p.bundle.dependency_lock,...(p.request.contract_version==='lab-1.1.0'?{installation_lock:p.bundle.installation_lock}:{})}))||r.snapshot_sha256!==await hashLab(canonicalLab(p.bundle.references))||p.result_sha256!==await hashLab(canonicalLab(r)))mismatch();
  const groups=new Map<string,number[]>();
  for(const [i,row] of r.rows.entries()){
    if(row.index!==i||row.original_smiles!==p.request.molecules[i]||row.input_sha256!==await hashLab(row.original_smiles))mismatch();
    if(row.properties.map(f=>f.quantity).join('|')!==Object.keys(specs).join('|'))mismatch();
    if(row.status==='identified'){
      if(!row.canonical_smiles||row.identity_sha256!==await hashLab(row.canonical_smiles)||row.formal_charge===null||!row.fragments||row.diagnostics.some(d=>d.severity==='error'))mismatch();
      groups.set(row.identity_sha256!,[...(groups.get(row.identity_sha256!)||[]),i]);
    }else if(row.canonical_smiles!==null||row.identity_sha256!==null||row.formal_charge!==null||row.fragments!==null||row.references.length||!row.diagnostics.some(d=>d.severity==='error')||row.properties.some(f=>f.value!==null))mismatch();
    for(const f of row.properties){
      const spec=specs[f.quantity];
      if(!spec||spec[0]!==f.units||spec[1]!==f.evidence_category)mismatch();
      if(f.availability==='computed'){
        if(typeof f.value!=='number'||!Number.isFinite(f.value)||f.assessment_status!=='computed'||f.domain!=='accepted_graph'||f.coverage!=='complete'||f.evidence_category==='model_prediction')mismatch();
      }else if(f.value!==null||f.assessment_status!=='not_assessed'||f.coverage!=='none')mismatch();
      if(f.evidence_category==='model_prediction'&&(f.availability!=='not_available'||f.domain!=='not_established'))mismatch();
      if(f.availability==='not_applicable'&&(f.quantity!=='aromatic_heavy_atom_fraction'||f.domain!=='undefined_quantity'))mismatch();
    }
    for(const ref of row.references){
      const raw=p.bundle.references[`${ref.source.toLowerCase()}-${ref.identifier}.json`];
      if(!raw||ref.raw_sha256!==await hashLab(raw))mismatch();
    }
  }
  if(canonicalLab([...groups.values()])!==canonicalLab(r.identity_groups))mismatch();
  const ranking=r.ranking;
  if(ranking.budget!==p.request.budget)mismatch();
  const eligible=r.rows.every(row=>row.status==='identified'&&['qed','descriptor_distance'].every(q=>row.properties.find(f=>f.quantity===q)?.availability==='computed'))&&groups.size===r.rows.length;
  if((ranking.status==='computed')!==eligible)mismatch();
  const tieHash=(row:LabRow)=>p.request.contract_version==='lab-1.1.0'?row.identity_sha256!:row.input_sha256;
  const order=(q:string,reverse=false)=>[...r.rows].sort((a,b)=>((reverse?-1:1)*(a.properties.find(f=>f.quantity===q)!.value!-b.properties.find(f=>f.quantity===q)!.value!))||(tieHash(a)<tieHash(b)?-1:tieHash(a)>tieHash(b)?1:a.index-b.index)).map(row=>row.index);
  const h=eligible?order('descriptor_distance'):[],q=eligible?order('qed',true):[];
  if(canonicalLab([h,q,h.slice(0,p.request.budget),q.slice(0,p.request.budget)])!==canonicalLab([ranking.heuristic_order,ranking.qed_order,ranking.heuristic_selection,ranking.qed_selection]))mismatch();
  return p;
}

export function filterLab(rows:LabRow[],query:string,filter:string):LabRow[]{
  const needle=query.toLowerCase();
  return rows.filter(r=>(`${r.index+1} ${r.original_smiles} ${r.canonical_smiles||''} ${r.references.map(x=>x.label+' '+x.identifier).join(' ')}`.toLowerCase().includes(needle))&&(filter==='all'||filter==='rejected'&&r.status==='rejected'||filter==='warnings'&&r.diagnostics.some(d=>d.severity==='warning')||filter==='references'&&r.references.length>0));
}

export function labReportHTML(p:LabPackage):string{
  const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const ranking=p.result.ranking;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BioScribe evidence report ${esc(p.run_id)}</title><style>body{font:14px/1.6 system-ui,sans-serif;color:#25324b;max-width:1100px;margin:auto;padding:40px;background:#fcfaff}h1{font-weight:400;color:#6d28d9}h2{font-weight:500}section{background:white;border:1px solid #e9dff8;border-radius:16px;padding:24px;margin:24px 0}table{border-collapse:collapse;width:100%;font-size:12px}th,td{text-align:left;padding:10px;border-bottom:1px solid #eee;vertical-align:top}code{overflow-wrap:anywhere;font-size:11px}.muted{color:#667085}.notice{background:#f2ecff;padding:16px;border-radius:12px}li{margin:6px 0}@media print{body{padding:10px;background:white}section{break-inside:avoid}table{font-size:10px}}</style><h1>BioScribe · Molecular evidence report</h1><p class="notice">Educational public-data workflow. Scientific assessment: <strong>not assessed</strong>. No affinity, safety or pharmacokinetic predictions. Checksums do not authenticate authorship.</p><p>Run: <code>${esc(p.run_id)}</code><br>Scientific result SHA-256: <code>${esc(p.result_sha256)}</code><br>Engine: <code>${esc(p.result.engine_sha256)}</code><br>Frozen snapshot: <code>${esc(p.result.snapshot_sha256)}</code></p><section><h2>Library comparison</h2><p>${p.result.rows.length} input records · budget ${p.request.budget} · ${esc(ranking.status.replaceAll('_',' '))}</p><p>${esc(ranking.reason)}</p>${ranking.status==='computed'?`<p>Descriptor distance, ascending: ${ranking.heuristic_selection.map(i=>`#${i+1}`).join(', ')}<br>QED, descending: ${ranking.qed_selection.map(i=>`#${i+1}`).join(', ')}</p>`:''}<p class="muted">${esc(ranking.interpretation)}. Tie-break: ${esc(ranking.tie_break)}. ${p.request.contract_version==='lab-1.0.0'?'Legacy rule: tied shortlists can depend on SMILES spelling.':''} Filters in the viewer do not affect this full report.</p></section>${p.result.rows.map(r=>`<section><h2>#${r.index+1} · ${esc(r.references[0]?.label||'Molecule')} · ${esc(r.status)}</h2><p>Original: <code>${esc(r.original_smiles||'(empty record)')}</code><br>Canonical: <code>${esc(r.canonical_smiles||'Not computed')}</code><br>Original-input SHA-256: <code>${esc(r.input_sha256)}</code><br>Graph identity SHA-256: <code>${esc(r.identity_sha256||'Not computed')}</code></p>${r.diagnostics.length?`<ul>${r.diagnostics.map(d=>`<li><strong>${esc(d.code)}</strong>: ${esc(d.message)}${d.character_offset!==null?` Character ${d.character_offset+1}.`:''}${d.atom_indices.length?` Atom indices ${esc(d.atom_indices.join(', '))}.`:''}${d.bond_indices.length?` Bond indices ${esc(d.bond_indices.join(', '))}.`:''}</li>`).join('')}</ul>`:''}<table><thead><tr><th>Property</th><th>Value / status</th><th>Evidence</th><th>Reason</th></tr></thead><tbody>${r.properties.map(f=>`<tr><td>${esc(fieldNames[f.quantity])}</td><td>${f.value===null?esc(availabilityNames[f.availability]):esc(f.value)+' '+esc(f.units)}</td><td>${esc(f.evidence_category)}<br>${esc(f.method)}<br>Coverage: ${esc(f.coverage)}<br>Predictive validation: not assessed</td><td>${esc(f.reason)}</td></tr>`).join('')}</tbody></table><h3>Identity policy</h3><ul>${r.normalization_history.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><h3>Frozen compound references</h3>${r.references.length?r.references.map(ref=>`<p>${esc(ref.source)} ${esc(ref.identifier)} · exact graph correspondence<br>Retrieved ${esc(ref.retrieved_utc)} · ${esc(ref.source_version)}<br>Source: <code>${esc(ref.url)}</code><br>Raw SHA-256: <code>${esc(ref.raw_sha256)}</code></p>`).join(''):`<p>${r.status==='rejected'?'Not computed: input rejected.':'Not available: no exact match in this six-record snapshot.'}</p>`}</section>`).join('')}<p class="muted">Quantities are reported at up to eight decimal places. “Not computed” indicates non-execution, “not available” indicates unavailable evidence/model, and “not applicable” indicates an undefined quantity. Replay requires the separately exported JSON package and matching installed engine; this HTML report does not execute code. Original v3 reports retain their original schema and methods.</p></html>`;
}

export function downloadLabReport(p:LabPackage){
  const url=URL.createObjectURL(new Blob([labReportHTML(p)],{type:'text/html;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=`bioscribe-evidence-${p.run_id}.html`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function labAPI(path:string,token:string,payload?:unknown):Promise<LabJob>{
  const response=await fetch((process.env.NEXT_PUBLIC_API_URL||'http://127.0.0.1:8000')+path,{method:payload===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:payload===undefined?undefined:JSON.stringify(payload),signal:AbortSignal.timeout(15000),cache:'no-store'});
  const result=await response.json();
  if(!response.ok)throw new Error(typeof result.error_code==='string'?result.error_code:typeof result.detail==='string'?result.detail:`Request failed (${response.status}).`);
  if(!/^[a-f0-9]{32}$/.test(result.run_id)||!['queued','running','succeeded','failed','cancelled'].includes(result.status))throw new Error('Invalid job response.');
  if((result.status==='succeeded')!==Boolean(result.output))throw new Error('Job and result disagree.');
  if(result.output){
    result.output.package=await decodeLab(result.output.package);
    if(result.mode==='analyze'&&(result.output.package.run_id!==result.run_id||result.output.replay!==null))throw new Error('Run attribution mismatch.');
    if(result.mode==='replay'&&(!result.output.replay||result.output.replay.status!=='matched'||result.output.replay.actual_sha256!==result.output.package.result_sha256||result.output.replay.expected_sha256!==result.output.package.result_sha256))throw new Error('Replay receipt mismatch.');
  }
  return result;
}
