"""Generate authoritative browser schema and a clearly recorded public example."""
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'backend'))
from evidence_assistant.schemas import Review
from evidence_assistant.engine import review


def required_fields(node):
    if isinstance(node,dict):
        if node.get('type')=='object' and 'properties' in node:node['required']=list(node['properties'])
        for value in node.values():required_fields(value)
    elif isinstance(node,list):
        for value in node:required_fields(value)


schema=Review.model_json_schema()
required_fields(schema)
(ROOT/'bioscribe-ai/src/lib/phase3/EvidenceReview.schema.json').write_text(json.dumps(schema,indent=2)+'\n',encoding='utf-8')
text='CHEMBL113 in activity 189032 has Ki = 26000 nM.\nCHEMBL113 in activity 189032 has Ki = 26 nM.\nCaffeine inhibits every adenosine receptor.\nCaffeine is safe.'
example=review({'text':text}).model_dump()
destination=ROOT/'bioscribe-ai/public/evidence-assistant'
destination.mkdir(exist_ok=True)
(destination/'example.json').write_text(json.dumps(example,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'example_run_id':example['run_id'],'statements':len(example['statements']),'recorded':True}))
