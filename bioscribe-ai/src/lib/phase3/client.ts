import Ajv from 'ajv';
import schema from './RunView.schema.json';
import currentMethods from './methods.json';
import historicalMethods from './legacy-methods-v3.json';
import type { RunRequest, RunView } from './contract';

const ajv = new Ajv({ allErrors: true, jsonPointers: true });
function completeSchema(value:unknown):unknown {
  if(Array.isArray(value))return value.map(completeSchema);
  if(value && typeof value==='object'){
    const out:Record<string,unknown>=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,completeSchema(v)]));
    if(out.type==='object'&&out.properties)out.required=Object.keys(out.properties as object);
    return out;
  }
  return value;
}
const validate = ajv.compile(completeSchema(schema) as object);
const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export function decodeRun(data: unknown): RunView {
  if (!validate(data)) throw new Error('Incompatible result contract. No findings displayed.');
  const run = data as RunView;
  const artifact = run.artifact;
  if ((run.status === 'succeeded') !== Boolean(artifact && run.artifact_sha256))
    throw new Error('Result state and artifact disagree.');
  if (artifact) {
    const methods=artifact.contract_version==='3.0.0'?historicalMethods:currentMethods;
    if (artifact.run_id !== run.run_id || artifact.input_identity.request_sha256 !== run.request_sha256)
      throw new Error('Result does not belong to this submission.');
    const ids = new Set<string>();
    const sourceHashes=new Set([artifact.input_identity.content_sha256,...artifact.input_identity.records.map(r=>r.normalized_sha256),...artifact.chemical_identities.map(c=>c.input_sha256)]);
    const categories: Record<string,string>={protein_composition:'computed_descriptor',sequence_length:'computed_descriptor',rdkit_descriptors:'computed_descriptor',ps00107_observation:'structural_rule_observation',structural_alert_scan:'structural_rule_observation',prioritization_heuristic:'unvalidated_heuristic',assessment_policy:'model_prediction',notes_review_policy:'unverified_extraction'};
    for (const field of artifact.outputs) {
      const method = methods[field.method_id as keyof typeof methods];
      if (!method || field.method_version !== method.version || field.implementation_fidelity !== method.fidelity || field.fidelity_record !== method.fixture)
        throw new Error('Unrecognized method evidence.');
      const spec=(method.outputs as Record<string,{units:string|null;shape:string;field_suffix:string}>)[field.quantity];
      if(!spec||field.units!==spec.units)throw new Error('Method quantity or units mismatch.');
      if(field.value!==null){
        const shape=spec.shape,value=field.value;
        if(shape==='null'||(['number','nonnegative','fraction','count'].includes(shape)&&typeof value!=='number'))throw new Error('Method value shape mismatch.');
        if(typeof value==='number'&&(!Number.isFinite(value)||(['nonnegative','fraction','count'].includes(shape)&&value<0)||(shape==='fraction'&&value>1)||(shape==='count'&&!Number.isInteger(value))))throw new Error('Invalid descriptor value.');
        if(['interval','indices'].includes(shape)&&(!Array.isArray(value)||value.length===0||value.some(x=>x<0)||(shape==='interval'&&(value.length!==2||value[0]>=value[1]||value[1]>field.coverage.total))))throw new Error('Invalid coordinates.');
      }
      if (field.run_id !== run.run_id || ids.has(field.field_id) || !sourceHashes.has(field.input_sha256)) throw new Error('Invalid field attribution.');
      const scope=field.field_id.split('.');
      let expectedHash:string;
      let suffix:string;
      if(scope[0]==='record'||scope[0]==='molecule'){
        if(scope.length<3||!/^(0|[1-9][0-9]*)$/.test(scope[1]))throw new Error('Invalid field scope.');
        const index=Number(scope[1]);
        const record=scope[0]==='record'?artifact.input_identity.records[index]:undefined;
        const molecule=scope[0]==='molecule'?artifact.chemical_identities[index]:undefined;
        if(!record&&!molecule)throw new Error('Invalid field scope.');
        expectedHash=record?record.normalized_sha256:molecule!.input_sha256;
        const allowed=record?['assessment_policy','sequence_length','protein_composition','ps00107_observation']:['assessment_policy','rdkit_descriptors','structural_alert_scan','prioritization_heuristic'];
        if(!allowed.includes(field.method_id)||(['protein_composition','ps00107_observation'].includes(field.method_id)&&artifact.input_identity.polymer_type!=='protein'))throw new Error('Method input scope mismatch.');
        suffix=scope.slice(2).join('.');
      }else if(scope[0]==='notes'&&artifact.input_identity.polymer_type==='notes'&&field.method_id==='notes_review_policy'){
        expectedHash=artifact.input_identity.content_sha256;
        suffix=scope.slice(1).join('.');
      }else throw new Error('Invalid field scope.');
      if(field.input_sha256!==expectedHash)throw new Error('Field input mismatch.');
      const suffixPattern=spec.field_suffix.split('{index}').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(0|[1-9][0-9]*)');
      if(!new RegExp(`^${suffixPattern}$`).test(suffix))throw new Error('Field name interpretation mismatch.');
      if(field.evidence_category!==categories[field.method_id])throw new Error('Method and evidence category disagree.');
      if(field.method_id==='prioritization_heuristic'&&field.units!=='dimensionless')throw new Error('Heuristic cannot have physical units.');
      if(['computed_descriptor','structural_rule_observation'].includes(field.evidence_category)&&field.validation_status!=='not_applicable')throw new Error('Descriptor cannot imply predictive validation.');
      ids.add(field.field_id);
      const unassessed = ['not_assessed', 'needs_review'].includes(field.assessment_status) || field.execution_status !== 'succeeded';
      if ((unassessed && field.value !== null) || (!unassessed && field.value === null)) throw new Error('Invalid assessment value.');
      if (['model_prediction', 'unverified_extraction'].includes(field.evidence_category) && (!unassessed || field.value !== null))
        throw new Error('Unsupported predictive assessment.');
      if (field.coverage.analyzed > field.coverage.total || field.coverage.complete !== (field.coverage.analyzed === field.coverage.total))
        throw new Error('Invalid coverage.');
      if (field.value !== null && (field.domain !== 'in_domain' || !field.coverage.complete)) throw new Error('Unsupported domain or coverage.');
    }
  }
  return run;
}

export async function requestRun(path: string, token: string, payload?: RunRequest, idempotencyKey?: string): Promise<RunView> {
  const response = await fetch(`${base}/v3/runs${path}`, {
    method: payload || path.endsWith('/cancel') ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(payload ? {'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey!} : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {401: 'Authentication required.', 404: 'Run not found or access denied.', 409: 'Run unavailable, conflicting, or failed integrity checks.', 413: 'Input exceeds the byte limit.', 422: 'Input rejected. Check the declared type, record count and supported symbols.', 429: 'Queue capacity reached. Retry later.'};
    throw new Error(messages[response.status] || `Request failed (${response.status}). No findings available.`);
  }
  return decodeRun(await response.json());
}
