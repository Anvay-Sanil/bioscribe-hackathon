import Ajv from 'ajv';
import schema from './PaperReview.schema.json';

export type Paper = {source_id:string;title:string;abstract:string;url:string;raw_sha256:string;eligibility:string;retrieved_utc?:string};
type Citation = {source_id:string;kind:string;role:string;locator:string;url:string|null;source_sha256:string;excerpt:string;retraction_status:string};
type Statement = {text:string;start:number;end:number;verdict:'supported'|'contradicted'|'insufficient_evidence'|'out_of_scope';interpretation:'experimental_model_interpretation';confidence:null;confidence_status:'not_calibrated';requires_review:true;reason_code:string;citations:Citation[]};
export type PaperReview = {contract_version:'paper-review/0.2.0';research_aid_label:string;run_id:string;text:string;input_sha256:string;snapshot_sha256:string;method:'bounded_paper_interpretation/0.2.0';implementation_sha256:string;created_utc:string;statements:Statement[];disagreements:{statement_index:number;interpretation:string;source_ids:string[]}[];excluded_sources:{source_id:string;reason:string}[];model:Record<string,unknown>;scientific_assessment:'not_assessed';scope:string};
const validate=new Ajv({allErrors:true}).compile(schema);

export function decodePaperReview(input:unknown,text:string,papers:Paper[],snapshot:string):PaperReview {
  if(!validate(input))throw new Error('Paper review contract rejected.');
  const review=input as PaperReview;
  if(review.text!==text||review.snapshot_sha256!==snapshot||review.research_aid_label!=='Research aid, not a prediction of efficacy or safety.')throw new Error('Paper review attribution mismatch.');
  let end=0;
  for(const statement of review.statements){
    if(statement.start<end||Array.from(text).slice(statement.start,statement.end).join('')!==statement.text)throw new Error('Claim span mismatch.');
    end=statement.end;
    if(statement.confidence!==null||statement.confidence_status!=='not_calibrated'||statement.requires_review!==true)throw new Error('Unsupported scientific qualification.');
    const role=statement.verdict==='supported'?'supports':'contradicts';
    const decisive=statement.verdict==='supported'||statement.verdict==='contradicted';
    if(decisive&&!statement.citations.some(c=>c.role===role))throw new Error('Missing direct passage.');
    const traces=statement.citations.filter(c=>c.role==='assessment_trace');
    if(traces.length!==1||traces[0].source_id!==`review:${review.run_id}`||traces[0].kind!=='run_record'||traces[0].url!==null)throw new Error('Missing paper assessment trace.');
    for(const citation of statement.citations){
      if(citation.role==='assessment_trace')continue;
      const paper=papers.find(p=>p.source_id===citation.source_id);
      if(!paper||citation.kind!=='paper_passage'||citation.source_sha256!==paper.raw_sha256||citation.url!==paper.url)throw new Error('Unbound paper citation.');
      const url=new URL(citation.url);
      if(url.protocol!=='https:'||url.hostname!=='pubmed.ncbi.nlm.nih.gov')throw new Error('Unsupported paper citation destination.');
      if(citation.role==='supports'||citation.role==='contradicts'){
        if(citation.retraction_status!=='not_flagged_in_checked_snapshot'||paper.eligibility!=='eligible_as_of_snapshot')throw new Error('Ineligible paper evidence.');
        if(citation.locator==='/metadata/title')throw new Error('A title cannot substantiate a passage verdict.');
      }
      if(citation.locator==='/metadata/title'){
        if(citation.excerpt!==paper.title)throw new Error('Paper title mismatch.');
      }else{
        const span=/^\/normalized_abstract\/characters\/(\d+):(\d+)$/.exec(citation.locator);
        if(!span||Number(span[2])<=Number(span[1])||Array.from(paper.abstract).slice(Number(span[1]),Number(span[2])).join('')!==citation.excerpt)throw new Error('Paper quotation does not match its source.');
      }
    }
  }
  return review;
}
