# Create a clean hackathon transfer

From the original BioScribe repository root:

```powershell
& .\.phase3-venv\Scripts\python.exe -B hackathon/transfer/build_transfer.py
```

This snapshots current source files (including untracked files), selected root launch/config files, documentation, educational and blocked study-design records, the prepared presentation kit and handoff documents. It excludes environment files, credentials, local databases, installed dependencies, caches, build output and Git history. It does not upload anything or modify application files.

Output: a newly created dated directory and ZIP under `output/`. Each build uses a timestamped name and refuses to overwrite an existing build. The archive root contains setup, context and verification instructions. The presentation kit and single-file Claude brief must already exist; the builder fails if they are absent.

No second-machine startup, clean dependency installation, scientific evaluation or complete application test rerun is implied by successful packaging. A manifest supports byte correspondence, not authenticated authorship. External dependencies must be downloaded at first installation.
