"""Compare a browser-downloaded public review with its authenticated saved API record."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from evidence_assistant.corpus import canonical, load_corpus, sha
from evidence_assistant.schemas import Review


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    downloaded = json.loads(args.input.read_text(encoding='utf-8-sig'))
    assert downloaded['format'] == 'bioscribe-evidence-review-export/0.1.0'
    assert downloaded['recorded_example'] is False
    review = Review.model_validate(downloaded['review'])
    token = (ROOT / 'hackathon/.local/demo-token.txt').read_text().strip()
    request = urllib.request.Request('http://127.0.0.1:8000/assistant/reviews/' + review.run_id,
                                     headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(request, timeout=15) as response:
        saved = json.load(response)
    assert saved['status'] == 'succeeded'
    assert saved['run_id'] == review.run_id
    assert saved['output'] == downloaded['review']
    assert review.corpus_sha256 == load_corpus()[1]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(args.input.read_bytes())
    receipt = {'recorded_utc': datetime.now(timezone.utc).isoformat(), 'status': 'passed',
               'run_id': review.run_id, 'export_sha256': sha(args.output.read_bytes()),
               'review_sha256': sha(canonical(saved['output'])), 'corpus_sha256': review.corpus_sha256,
               'checks': ['fresh_review_not_recorded_example', 'strict_review_contract',
                          'authenticated_saved_record_succeeded', 'run_id_matches',
                          'export_equals_saved_output', 'frozen_corpus_matches'],
               'scope': 'Browser export corresponds to saved public-data review; no biological validation.'}
    receipt_path = args.output.with_suffix('.verification.json')
    receipt_path.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
