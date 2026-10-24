import Ajv from 'ajv';
import schema from './EvidenceReview.schema.json';

export const RESEARCH_LABEL = 'Research aid, not a prediction of efficacy or safety.';
export type Verdict = 'supported' | 'contradicted' | 'insufficient_evidence' | 'out_of_scope';
export type Citation = {source_id:string;kind:'assay_record'|'paper_passage'|'run_record';role:string;locator:string;url:string|null;source_sha256:string;excerpt:string;retraction_status:string};
export type Statement = {statement_id:string;text:string;start:number;end:number;category:string;verdict:Verdict;reason_code:string;explanation:string;citations:Citation[];confidence:null;confidence_status:'not_calibrated';decision_basis:string;requires_review:boolean};
export type Review = {contract_version:'evidence-assistant/0.1.0';research_aid_label:string;run_id:string;input_sha256:string;corpus_sha256:string;created_utc:string;text:string;statements:Statement[];decomposition:Record<string,unknown>;disagreements:{molecule_id:string;target_id:string;organism:string;endpoint:string;units:string;interpretation:string;observations:{assay_id:string;value:string;assay_description:string;citation:Citation}[]}[];excluded_sources:{source_id:string;reason:string}[];model:{status:string;id?:string;used_for_verdict:boolean;suggestions?:string[]};evidence_scope:string;scientific_assessment:'not_assessed';benchmark_status:'provisional_unreviewed'};
const validate = new Ajv({allErrors:true}).compile(schema);
const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export function decodeReview(data:unknown, expectedText?:string):Review {
  if(!validate(data))throw new Error('Review contract rejected. No verdicts displayed.');
  const review=data as Review;
  if(review.research_aid_label!==RESEARCH_LABEL || (expectedText!==undefined&&review.text!==expectedText))throw new Error('Review attribution mismatch.');
  let end=0;
  for(const statement of review.statements){
    // Backend offsets are Unicode code points; JS strings use UTF-16 code units.
    if(statement.start<end || Array.from(review.text).slice(statement.start,statement.end).join('')!==statement.text)throw new Error('Statement source span mismatch.');
    end=statement.end;
    if(statement.confidence!==null||statement.confidence_status!=='not_calibrated')throw new Error('Unqualified confidence is not allowed.');
    const decisive=statement.verdict==='supported'||statement.verdict==='contradicted';
    const requiredRole=statement.verdict==='supported'?'supports':'contradicts';
    if(decisive){
      const cited=statement.citations.filter(c=>c.role===requiredRole);
      if(!cited.length||!['assay_observation','computed_property'].includes(statement.category))throw new Error('Verdict lacks direct evidence.');
      const expectedKind=statement.category==='assay_observation'?'assay_record':'run_record';
      const expectedStatus=statement.category==='assay_observation'?'not_flagged_in_checked_snapshot':'not_applicable';
      if(cited.some(c=>c.kind!==expectedKind))throw new Error('Evidence kind does not match the statement.');
      if(cited.some(c=>c.retraction_status!==expectedStatus))throw new Error('Excluded or inapplicable publication status used as evidence.');
      if(statement.decision_basis!=='exact_record_comparison')throw new Error('Decision basis does not match the verdict.');
    }
    const traces=statement.citations.filter(c=>c.role==='assessment_trace');
    if(traces.length!==1||traces[0].source_id!==`review:${review.run_id}`)throw new Error('Missing review trace.');
    for(const c of statement.citations){
      if(c.url){const url=new URL(c.url);if(url.protocol!=='https:'||!['www.ebi.ac.uk','pubmed.ncbi.nlm.nih.gov','europepmc.org'].includes(url.hostname))throw new Error('Unsupported citation destination.');}
    }
  }
  return review;
}

export async function assistantRequest(path:string,token:string,body?:unknown):Promise<unknown>{
  const response=await fetch(`${base}/assistant${path}`,{method:body?'POST':'GET',cache:'no-store',signal:AbortSignal.timeout(120000),
    headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()}: {})},body:body?JSON.stringify(body):undefined});
  if(!response.ok)throw new Error(({401:'Load the local access token first.',404:'Review not found or access denied.',409:'The review could not be verified.',422:path.startsWith('/papers')?'Input rejected. Use at most 4,000 characters, three statements and three known papers.':'Input rejected. Use at most 8,000 characters and 16 statements.',429:path.startsWith('/papers')?'A paper review is already running. Try again shortly.':'Two reviews are already running. Try again shortly.'} as Record<number,string>)[response.status]||'Evidence service unavailable. No verdicts displayed.');
  return response.json();
}
