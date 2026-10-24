"""Download the additional official pinned 0.5B model; retain the existing 4B installation."""
import json
from pathlib import Path
import secrets
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from evidence_assistant.compact_model import CARD, LOCAL
from prepare_evidence_model import download, digest

def main():
    LOCAL.mkdir(parents=True, exist_ok=True)
    url = f"https://huggingface.co/{CARD['model_id']}/resolve/{CARD['revision']}/{CARD['file']}"
    download(url, LOCAL / CARD['file'], CARD['bytes'], CARD['sha256'])
    key = LOCAL / 'api-key.txt'
    if not key.exists(): key.write_text(secrets.token_urlsafe(32), encoding='utf-8')
    runtime = ROOT / 'hackathon/.local/evidence-model/runtime.zip'
    (LOCAL / 'installation.json').write_text(json.dumps({'model_sha256': digest(LOCAL / CARD['file']),
        'runtime_archive_sha256': digest(runtime), 'model': CARD}, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'installed', 'model': CARD['model_id'], 'bytes': CARD['bytes']}))

if __name__ == '__main__': main()
