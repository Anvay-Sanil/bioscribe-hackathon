import Ajv from 'ajv';
import schema from './DraftComparison.schema.json';
type Metrics={expected_count:150;evaluated:number;missing_or_invalid:number;accuracy_all_expected:number|null;false_supported_count:number};
type Bin={lower:number;upper:number;n:number;draft_label_agreement:number|null;mean_self_report:number|null};
export type DraftSummary={status:'available';dataset_status:'provisional_unreviewed';scientific_assessment:'not_assessed';calibration_status:'not_calibrated';baseline_beaten:null;claim_count:150;systems:{name:string;metrics:Metrics}[];confidence_diagnostics:{status:string;n:number;bins:Bin[];correctness_brier:number|null;ece_10_bins:number|null;interpretation:string};limitations:string[];source_report_sha256:string};
const validate=new Ajv({allErrors:true}).compile(schema);
export function decodeDraftComparison(data:unknown):DraftSummary{
  if(!validate(data))throw new Error('Comparison contract rejected. No figures displayed.');
  const value=data as DraftSummary;
  if(new Set(value.systems.map(s=>s.name)).size!==value.systems.length)throw new Error('Duplicate comparison system.');
  for(const {metrics:m} of value.systems){
    if(m.evaluated+m.missing_or_invalid!==150||m.false_supported_count>m.evaluated||(m.accuracy_all_expected!==null&&m.accuracy_all_expected>m.evaluated/150+1e-12))throw new Error('Inconsistent comparison counts.');
  }
  const d=value.confidence_diagnostics;
  if(d.bins.reduce((n,b)=>n+b.n,0)!==d.n)throw new Error('Confidence count mismatch.');
  d.bins.forEach((b,i)=>{
    if(b.lower!==i/10||b.upper!==(i+1)/10||(b.n===0?(b.draft_label_agreement!==null||b.mean_self_report!==null):(b.draft_label_agreement===null||b.mean_self_report===null)))throw new Error('Invalid confidence partition.');
  });
  if((d.n===0)!==(d.correctness_brier===null&&d.ece_10_bins===null))throw new Error('Undefined reliability status mismatch.');
  return value;
}
