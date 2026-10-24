"""Descriptive provisional evaluation. A partial/model-missing run never wins."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'backend'))
from evidence_assistant.corpus import canonical,load_corpus,sha
from evidence_assistant.engine import review
from evidence_assistant.model import baseline,CARD,BASELINE_PROMPT

LABELS=('supported','contradicted','insufficient_evidence','out_of_scope')
BINS=((0,.5),(.5,.7),(.7,.85),(.85,.95),(.95,1.0))


def metrics(gold,predictions):
    paired=[(g,predictions[g['claim_id']]) for g in gold if g['claim_id'] in predictions and predictions[g['claim_id']].get('verdict') in LABELS]
    confusion={a:{b:0 for b in LABELS} for a in LABELS}
    for g,p in paired:confusion[g['proposed_verdict']][p['verdict']]+=1
    count=len(paired)
    accuracy=sum(g['proposed_verdict']==p['verdict'] for g,p in paired)/count if count else None
    f1=[]
    per_class={}
    for label in LABELS:
        tp=confusion[label][label];fp=sum(confusion[g][label] for g in LABELS if g!=label);fn=sum(confusion[label][p] for p in LABELS if p!=label)
        precision=tp/(tp+fp) if tp+fp else None;recall=tp/(tp+fn) if tp+fn else None
        score=2*tp/(2*tp+fp+fn) if 2*tp+fp+fn else None
        if score is not None:f1.append(score)
        per_class[label]={'precision':precision,'recall':recall,'f1':score,'gold_count':tp+fn}
    def valid_confidence(value):
        return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value) and 0<=value<=1
    bins=[]
    for low,high in BINS:
        rows=[(g,p) for g,p in paired if valid_confidence(p.get('confidence')) and low<=p['confidence'] and (p['confidence']<high or high==1 and p['confidence']==1)]
        bins.append({'lower_inclusive':low,'upper':high,'upper_inclusive':high==1,'n':len(rows),'accuracy':sum(g['proposed_verdict']==p['verdict'] for g,p in rows)/len(rows) if rows else None})
    decisive=[(g,p) for g,p in paired if p['verdict'] in ('supported','contradicted')]
    return {'expected_count':len(gold),'evaluated':count,'missing_or_invalid':len(gold)-count,'accuracy':accuracy,
            'accuracy_denominator':'Valid returned verdicts only; inspect accuracy_all_expected and missing_or_invalid too.',
            'accuracy_all_expected':sum(g['proposed_verdict']==p['verdict'] for g,p in paired)/len(gold) if gold else None,
            'macro_f1':sum(f1)/len(f1) if len(f1)==len(LABELS) else None,
            'per_class':per_class,'confusion':confusion,'decisive_coverage':len(decisive)/len(gold) if gold else None,
            'decisive_accuracy':sum(g['proposed_verdict']==p['verdict'] for g,p in decisive)/len(decisive) if decisive else None,
            'false_supported_count':sum(p['verdict']=='supported' and g['proposed_verdict']!='supported' for g,p in paired),
            'accuracy_by_confidence':bins,'confidence_unscored_count':sum(not valid_confidence(p.get('confidence')) for _,p in paired),
            'confidence_interpretation':'Model confidence is uncalibrated; no probability claim. Rule verdict confidence remains null.',
            'uncertainty':'No inferential interval: dependent template/source groups and unreviewed labels.'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-baseline',action='store_true')
    parser.add_argument('--limit',type=int,default=150)
    parser.add_argument('--model-timeout-seconds',type=int,choices=(90,180),default=90)
    parser.add_argument('--output',type=Path,default=Path(__file__).parent/'provisional-report.json')
    args=parser.parse_args()
    if not 1<=args.limit<=150:parser.error('limit must be 1..150')
    if args.run_baseline and args.output.exists():parser.error('preserve existing baseline receipt; choose a new output path')
    code_files={str(p.relative_to(ROOT)).replace('\\','/'):sha(p.read_bytes()) for p in
                (Path(__file__),ROOT/'backend/evidence_assistant/engine.py',ROOT/'backend/evidence_assistant/model.py')}
    here=Path(__file__).parent
    claims=[json.loads(line) for line in (here/'claims.jsonl').read_text().splitlines()]
    labels=[json.loads(line) for line in (here/'proposed_labels.jsonl').read_text().splitlines()]
    manifest=json.loads((here/'manifest.json').read_text())
    if sha((here/'claims.jsonl').read_bytes())!=manifest['claims_sha256'] or sha((here/'proposed_labels.jsonl').read_bytes())!=manifest['proposed_labels_sha256']:raise ValueError('draft_manifest_mismatch')
    records,corpus_hash=load_corpus()
    if corpus_hash!=manifest['corpus_sha256']:raise ValueError('corpus_changed')
    ours,base={},{}
    for claim in claims:
        value=review({'text':claim['text']},records,corpus_hash)
        if len(value.statements)!=1:raise ValueError('atomic_claim_split_changed')
        statement=value.statements[0]
        ours[claim['claim_id']]={'verdict':statement.verdict,'confidence':None,'source_ids':[c.source_id for c in statement.citations if c.role in ('supports','contradicts')], 'reason':statement.reason_code}
    if args.run_baseline:
        for index,claim in enumerate(claims[:args.limit]):
            started=time.monotonic()
            try:base[claim['claim_id']]=baseline(claim['text'],records,timeout_seconds=args.model_timeout_seconds)
            except Exception:base[claim['claim_id']]={'status':'failed','error_code':'model_unavailable_or_invalid_output'}
            base[claim['claim_id']]['elapsed_seconds']=round(time.monotonic()-started,3)
            args.output.parent.mkdir(parents=True,exist_ok=True)
            args.output.with_suffix('.progress.json').write_text(json.dumps({'status':'partial_not_qualified',
                'qualification':'not_assessed','baseline_beaten':None,'corpus_sha256':corpus_hash,
                'claims_sha256':manifest['claims_sha256'],'requested_limit':args.limit,'model_timeout_seconds':args.model_timeout_seconds,
                'execution_code_sha256':code_files,'predictions':base},indent=2)+'\n',encoding='utf-8')
            print(json.dumps({'baseline_completed':index+1,'total':args.limit}),flush=True)
    attempted_labels=[label for label in labels if label['claim_id'] in base]
    result={'created_utc':datetime.now(timezone.utc).isoformat(),'dataset_status':'provisional_unreviewed','scientific_assessment':'not_assessed',
            'qualification':'not_assessed','baseline_beaten':None,'qualification_reason':'Independent label review, group split, frozen protocol and complete valid model comparison are required.',
            'corpus_sha256':corpus_hash,'claims_sha256':manifest['claims_sha256'],'label_sha256':manifest['proposed_labels_sha256'],
            'baseline_model':CARD,'baseline_prompt_sha256':sha(BASELINE_PROMPT),'ours_method':'bounded_exact_record_checker/0.1.0',
            'execution_code_sha256':code_files,'baseline_requested_limit':args.limit if args.run_baseline else 0,
            'baseline_attempted_count':len(base),'baseline_model_timeout_seconds':args.model_timeout_seconds,
            'attempted_subset':{'ours':metrics(attempted_labels,ours),'retrieval_plus_llm':metrics(attempted_labels,base)},
            'ours':metrics(labels,ours),'retrieval_plus_llm':metrics(labels,base),'baseline_status':'attempted' if args.run_baseline else 'not_run',
            'predictions':{'ours':ours,'baseline':base},'limitations':manifest['limitations']}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'report':str(args.output),'ours_evaluated':result['ours']['evaluated'],'baseline_evaluated':result['retrieval_plus_llm']['evaluated'],'qualification':'not_assessed'},indent=2))


if __name__=='__main__':main()
