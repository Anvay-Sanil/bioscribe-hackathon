"""Public-data API rehearsal, optionally including the pinned local 4B model."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from evidence_assistant.corpus import canonical, sha
from evidence_assistant.schemas import Review

TEXT = '''CHEMBL113 in activity 189032 has Ki = 26 uM.
CHEMBL113 in activity 189032 has Ki = 26 nM.
CHEMBL521 in activity 792824 has IC50 = 6300 nM.
CHEMBL25 in activity 189032 has Ki = 26000 nM.
QED proves that caffeine binds every protein.
Caffeine is safe.
CHEMBL113 in activity 189032 has Ki = 26000 nM but this is not true.'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--with-model', action='store_true')
    parser.add_argument('--output', type=Path, default=ROOT / 'docs/evidence-assistant-live-smoke.json')
    args = parser.parse_args()
    token = (ROOT / 'hackathon/.local/demo-token.txt').read_text().strip()
    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json',
               'Idempotency-Key': uuid.uuid4().hex}
    request = urllib.request.Request('http://127.0.0.1:8000/assistant/reviews',
        data=canonical({'text': TEXT, 'use_model': args.with_model, 'data_scope': 'public_non_sensitive',
                        'contract_version': 'evidence-assistant/0.1.0'}).encode(), headers=headers)
    with urllib.request.urlopen(request, timeout=120) as response:
        result = json.load(response)
    assert result['status'] == 'succeeded'
    reviewed = Review.model_validate(result['output'])
    assert reviewed.text == TEXT
    assert [s.verdict for s in reviewed.statements] == ['supported', 'contradicted', 'insufficient_evidence',
                                                       'insufficient_evidence', 'insufficient_evidence', 'out_of_scope', 'insufficient_evidence']
    assert reviewed.statements[2].reason_code == 'publication_status_unknown'
    assert reviewed.statements[3].reason_code == 'identity_or_endpoint_mismatch'
    assert reviewed.statements[6].text.endswith('but this is not true.')
    assert reviewed.statements[6].requires_review is True
    assert any(s['source_id'] == 'chembl-activity:792824' and s['reason'] == 'publication_status_unknown'
               for s in reviewed.excluded_sources)
    assert reviewed.model['used_for_verdict'] is False
    if args.with_model:
        assert reviewed.model['status'] == 'candidate_only', 'Local model unavailable or source-span checks failed.'
        assert reviewed.model['parameters'] == 4_000_000_000
        assert all(s in TEXT for s in reviewed.model['suggestions'])
    args.output.parent.mkdir(parents=True, exist_ok=True)
    receipt = {'recorded_utc': datetime.now(timezone.utc).isoformat(), 'status': 'passed',
               'scope': 'Live public-data software rehearsal; model suggestions unverified; no benchmark or biological qualification',
               'run_id': reviewed.run_id, 'review_sha256': sha(canonical(result['output'])),
               'model_requested': args.with_model, 'model': reviewed.model,
               'checks': ['unit_conversion_support', 'changed_value_contradiction', 'unknown_publication_abstention',
                          'wrong_molecule_abstention', 'descriptors_cannot_establish_activity', 'safety_out_of_scope',
                          'exclusion_reason_visible', 'model_never_decides_verdict', 'qualified_clause_not_severed'], 'review': result['output']}
    args.output.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'passed', 'run_id': reviewed.run_id, 'checks': len(receipt['checks']),
                      'model_status': reviewed.model['status'], 'scientific_assessment': 'not_assessed'}))


if __name__ == '__main__':
    main()
