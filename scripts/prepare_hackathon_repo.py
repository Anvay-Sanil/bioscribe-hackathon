"""Prepare a credential-screened standalone source snapshot; never mutate original Git history."""
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]

def main():
    spec = importlib.util.spec_from_file_location('snapshot_transfer', ROOT / 'hackathon/transfer/build_transfer.py')
    transfer = importlib.util.module_from_spec(spec); spec.loader.exec_module(transfer)
    destination = ROOT / 'output' / ('github-bioscribe-hackathon-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    if not destination.resolve().is_relative_to(ROOT): raise ValueError('invalid_snapshot_destination')
    destination.mkdir(parents=True, exist_ok=False)
    selected = []
    for name in transfer.SOURCE_DIRS: selected.extend(transfer.collect(ROOT / name))
    selected.extend(ROOT / name for name in transfer.ROOT_FILES if (ROOT / name).is_file())
    kit = ROOT / 'output/BioScribe-Hackathon-PPT-Kit-2026-10-24'
    if kit.is_dir(): selected.extend(transfer.collect(kit))
    brief = ROOT / 'output/BioScribe-Claude-Presentation-Brief.txt'
    if brief.is_file(): selected.append(brief)
    for pattern in ('LICENSE*', 'NOTICE*', 'COPYING*', 'CITATION*'): selected.extend(ROOT.glob(pattern))
    for source in sorted(set(selected)):
        if not source.is_file() or source.is_symlink(): continue
        target = destination / source.relative_to(ROOT)
        if not target.resolve().is_relative_to(destination.resolve()): raise ValueError('snapshot_path_escape')
        target.parent.mkdir(parents=True, exist_ok=True)
        # JSON must be complete even if a source receipt was being written.
        raw = source.read_bytes()
        if source.suffix == '.json': json.loads(raw.decode('utf-8-sig'))
        target.write_bytes(raw)
    with (destination / '.gitignore').open('a', encoding='utf-8') as file:
        file.write('\n# Standalone hackathon publication exclusions\n/verification-output/\n/backend/verification-output/\n*.gguf\n*.safetensors\n*.sqlite\n*.sqlite3\n*.db\n*.pem\n*.key\n.env*\n/output/*\n!/output/BioScribe-Hackathon-PPT-Kit-2026-10-24/\n!/output/BioScribe-Claude-Presentation-Brief.txt\n')
    progress = destination / 'validation/evidence_assistant/round1-comparison-v03-20261025.progress.json'
    attempted = len(json.loads(progress.read_text())['predictions']) if progress.is_file() else 0
    snapshot_note = f'''# Hackathon source snapshot — 25 October 2026

This repository is an independent snapshot of the current BioScribe hackathon project. Existing project Git history and remotes are unchanged. Local credentials, job databases, downloaded models, dependency installations and runtime logs are excluded.

The accepted molecular workflow uses lab-1.1.0 and molecular contract 3.1.0. Historical replay engines and frozen references are included. Paper-review/0.2.0 adds experimental interpretation of selected frozen PubMed abstracts; every interpretation requires human review and confidence remains uncalibrated.

The original 150 development claims and proposed labels remain unreviewed. The interrupted 0.5B comparison snapshot contains {attempted}/150 attempted claims. Its progress file is a partial receipt, not a complete comparison or benchmark win. Historical 4B timeouts remain preserved. Independent review, calibrated scientific accuracy and broader literature qualification remain deferred.

Scientific release, sensitive-data intake and deployment remain blocked. Earlier verification receipts describe their original iterations; they are not fresh passes for this entire snapshot. The GitHub workflow runs the current verification entry point on Ubuntu.

## Install and verify on Windows

Requirements: Python 3.11, Node.js 22 and Git.

```powershell
py -3.11 -m venv .phase3-venv
& ./.phase3-venv/Scripts/python.exe -B scripts/verify.py --install
powershell -ExecutionPolicy Bypass -File hackathon/start-demo.ps1 -Verify
```

Open http://localhost:3000/evidence or http://localhost:3000/evidence-assistant. Local credentials are provisioned on first demo startup and stay under ignored hackathon/.local. Recorded examples work without credentials. Optional local model setup is explicit: hackathon/prepare_evidence_model.py for the historical 4B model; hackathon/prepare_small_evidence_model.py and start-small-evidence-model.ps1 for the additional experimental 0.5B gateway.

Third-party references, licences and attribution embedded in included dependencies/data remain intact. Commit authorship uses the repository owner's GitHub identity.
'''
    (destination / 'HACKATHON_SNAPSHOT.md').write_text(snapshot_note, encoding='utf-8')
    readme = destination / 'README.md'
    readme.write_text('> Standalone hackathon snapshot. See [setup and current development status](HACKATHON_SNAPSHOT.md).\n\n' + readme.read_text(encoding='utf-8'), encoding='utf-8')
    local_secrets = []
    for name in ('hackathon/.local/demo-token.txt', 'hackathon/.local/evidence-model/api-key.txt', 'hackathon/.local/evidence-small/api-key.txt'):
        file = ROOT / name
        if file.is_file(): local_secrets.append(file.read_text(encoding='utf-8-sig').strip().encode())
    patterns = re.compile(rb'(?:gh[opusr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{25,}|sk-(?:proj-)?[A-Za-z0-9_-]{25,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
    issues, ai_attribution = [], []
    attribution = re.compile(rb'(?i)(?:co-authored-by|authored by|author\s*:|generated by|built by)[^\r\n]{0,100}(?:chatgpt|codex|openai)')
    files = [p for p in destination.rglob('*') if p.is_file()]
    for file in files:
        raw = file.read_bytes(); name = file.relative_to(destination).as_posix()
        if patterns.search(raw) or any(secret and secret in raw for secret in local_secrets): issues.append(name)
        if attribution.search(raw): ai_attribution.append(name)
        if file.stat().st_size > 95_000_000: issues.append(name + ':oversized')
    if issues: raise ValueError('snapshot_sensitive_or_oversized_paths: ' + json.dumps(issues))
    receipt = {'destination': str(destination), 'files': len(files), 'bytes': sum(p.stat().st_size for p in files),
               'credential_pattern_and_known_local_secret_scan': 'passed', 'AI_authorship_text_matches': ai_attribution,
               'scope': 'Curated source snapshot. No Git history imported. No complete security or scientific validation claim.'}
    (ROOT / 'output/github-hackathon-preparation.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(receipt, indent=2))

if __name__ == '__main__': main()
