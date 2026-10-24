# Hackathon source snapshot — 25 October 2026

This repository is an independent snapshot of the current BioScribe hackathon project. Existing project Git history and remotes are unchanged. Local credentials, job databases, downloaded models, dependency installations and runtime logs are excluded.

The accepted molecular workflow uses lab-1.1.0 and molecular contract 3.1.0. Historical replay engines and frozen references are included. Paper-review/0.2.0 adds experimental interpretation of selected frozen PubMed abstracts; every interpretation requires human review and confidence remains uncalibrated.

The original 150 development claims and proposed labels remain unreviewed. The interrupted 0.5B comparison snapshot contains 95/150 attempted claims. Its progress file is a partial receipt, not a complete comparison or benchmark win. Historical 4B timeouts remain preserved. Independent review, calibrated scientific accuracy and broader literature qualification remain deferred.

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
