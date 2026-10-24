"""Create blank independent-review forms without exposing proposed labels or predictions."""
import csv
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).parent
FIELDS = ['claim_id', 'claim_text', 'publication_group', 'record_group', 'reviewer_id',
          'verdict', 'evidence_source_ids', 'exact_evidence_locator', 'molecule_identity_checked',
          'endpoint_and_assay_context_checked', 'publication_status_checked', 'scope_checked',
          'rationale', 'needs_adjudication', 'reviewed_utc']


def main():
    claims = [json.loads(line) for line in (HERE / 'claims.jsonl').read_text().splitlines()]
    manifest = json.loads((HERE / 'manifest.json').read_text())
    assert hashlib.sha256((HERE / 'claims.jsonl').read_bytes()).hexdigest() == manifest['claims_sha256']
    out = HERE / 'review_packet'
    out.mkdir(exist_ok=True)
    hashes = {}
    for reviewer in ('A', 'B'):
        path = out / f'reviewer-{reviewer}-blank.csv'
        if path.exists():
            raise ValueError('Existing review forms preserved. Choose a new version before regenerating.')
        with path.open('w', encoding='utf-8', newline='') as stream:
            writer = csv.DictWriter(stream, fieldnames=FIELDS)
            writer.writeheader()
            for claim in claims:
                writer.writerow({'claim_id': claim['claim_id'], 'claim_text': claim['text'],
                                 'publication_group': claim['source_group'], 'record_group': claim['record_group']})
        hashes[path.name] = hashlib.sha256(path.read_bytes()).hexdigest()
    (out / 'blank-form-receipt.json').write_text(json.dumps({'status': 'unfilled_not_reviewed',
        'claims': len(claims), 'claims_sha256': manifest['claims_sha256'], 'files': hashes,
        'scope': 'Initial blank forms only. Hashes will change when reviewers enter annotations. No appointments or independent review inferred.'}, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'unfilled_not_reviewed', 'claims': len(claims), 'forms': 2}))


if __name__ == '__main__':
    main()
