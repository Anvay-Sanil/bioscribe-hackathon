"""Generate strict paper output schema and a clearly synthetic contract-test fixture."""
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'backend'))
from evidence_assistant.passage_review import output_schema, interpret
from evidence_assistant.papers import load
from evidence_assistant.benchmark_report import schema as summary_schema, DraftSummary
from validation.evidence_assistant.round1 import reliability

def required(node):
    if isinstance(node, dict):
        if node.get('type') == 'object' and 'properties' in node: node['required'] = list(node['properties'])
        for child in node.values(): required(child)
    elif isinstance(node, list):
        for child in node: required(child)

schema = output_schema()
(ROOT / 'bioscribe-ai/src/lib/phase3/PaperReview.schema.json').write_text(json.dumps(schema, indent=2) + '\n', encoding='utf-8')
(ROOT / 'bioscribe-ai/src/lib/phase3/DraftComparison.schema.json').write_text(json.dumps(summary_schema(), indent=2) + '\n', encoding='utf-8')
papers, fingerprint = load(); key = next(iter(papers)); paper = papers[key]
def synthetic_model(*args, **kwargs):
    return {'assessments': [{'index': 0, 'paper_id': key, 'verdict': 'supported', 'quote': paper['abstract'][:100]}]}, {'status': 'synthetic_software_fixture', 'response_sha256': 'f' * 64}
review = interpret({'text': 'Synthetic claim for decoder testing only.', 'paper_ids': [key]}, papers=papers, snapshot_hash=fingerprint, infer=synthetic_model)
fixture = {'purpose': 'SYNTHETIC SOFTWARE FIXTURE. Mock interpretation; no scientific verdict or live model inference.',
           'review': review.model_dump(), 'papers': [{'source_id': key, 'abstract': paper['abstract'], 'title': paper['title'],
           'url': paper['url'], 'raw_sha256': paper['raw_sha256'], 'eligibility': 'eligible_as_of_snapshot'}]}
(ROOT / 'hackathon/paper-review').mkdir(exist_ok=True)
(ROOT / 'hackathon/paper-review/synthetic-contract-fixture.json').write_text(json.dumps(fixture, indent=2) + '\n', encoding='utf-8')
metrics = {'expected_count': 150, 'evaluated': 0, 'missing_or_invalid': 150, 'accuracy_all_expected': 0.0, 'false_supported_count': 0}
summary = DraftSummary(source_report_sha256='a' * 64, claims_sha256='b' * 64, labels_sha256='c' * 64,
    model={'purpose': 'synthetic_software_fixture'}, systems=[{'name': name, 'metrics': metrics} for name in ('Record checker', '0.5B baseline: first attempts')],
    confidence_diagnostics=reliability([], {}), limitations=['Synthetic software fixture; no measured performance.'])
(ROOT / 'hackathon/paper-review/synthetic-summary-fixture.json').write_text(json.dumps({'purpose': 'SYNTHETIC SOFTWARE FIXTURE; no study outcomes.', 'summary': summary.model_dump()}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': 'generated', 'fixture_scope': 'synthetic_software_only'}))
