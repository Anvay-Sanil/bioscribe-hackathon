# Move BioScribe to another computer

This archive contains the actual working source snapshot, dependency locks, recorded public examples, verification records, presentation material and an AI handoff brief. It includes current uncommitted and untracked files. It does not depend on Git history to recover those files.

## Transfer

1. Copy the ZIP to a USB drive, your storage account, or the hackathon submission portal. Uploading/sharing is your next action; no destination has been selected or contacted.
2. Extract the entire ZIP to a local directory on the receiving computer. Keep the directory structure intact; do not run scripts inside the ZIP preview.
3. Read `PROJECT_CONTEXT.md` first. The original source README is at `source/README.md`.

## Run on Windows

Install Python 3.11 and Node.js/npm first. The recorded development host used Python 3.11.9, Node 22.20.0 and npm 10.9.3. Internet/package-index access is needed to install dependencies; this is not an offline installer.

From the extracted top-level directory in PowerShell:

```powershell
py -3.11 -B .\VERIFY_TRANSFER.py --strict
powershell -NoProfile -ExecutionPolicy Bypass -File .\SETUP_WINDOWS.ps1 -Start
```

The helper verifies source bytes, creates `source/.phase3-venv`, installs the existing Python lock and runs `npm ci`. `-Start` invokes the existing loopback demo launcher and its fresh analysis/replay preflight. It creates new local credentials rather than transferring the original credentials. Repeated setup preserves any existing credentials. An occupied port is preserved by the launcher; verify the service owner and use the correct workspace's token.

Open `http://localhost:3000/proof` for the judging walkthrough, `http://localhost:3000/evidence` for the Evidence Lab, or `/molecules` for example conformers. For live jobs, choose **Load token file** and select `source/hackathon/.local/demo-token.txt`. Keep it private. Recorded examples need no token.

If you installed dependencies without `-Start`, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\source\hackathon\start-demo.ps1 -Verify
```

`VERIFY_TRANSFER.py --strict` is for the original extracted archive. After installation, omit `--strict` because environments and build files have been added. Hash checking establishes file correspondence, not authenticated origin.

## Continue with another AI or teammate

Upload `AI_HANDOFF.txt` for the project context and presentation content. `PRESENTATION_TERMS.md` is a plain-language glossary for your judging talk and Q&A. Give a coding assistant the `source/` directory too. The handoff text is context; it cannot run BioScribe by itself. Screenshots are in `presentation/03-visuals`, and the full slide-source kit is in `presentation/`.

## Present without a fresh calculation

Recorded examples are preserved for the app once frontend dependencies are installed. An independent teaching fallback is `source/learning/viewer/index.html`: open it directly in a browser and choose a result JSON from `source/learning/exercises/budget-and-unknown/`. That fallback uses invented labels and is not the full Evidence Lab. Static screenshots and the recorded HTML report are also included. Identify recorded examples honestly.

## Important boundaries

This is the public, non-sensitive educational molecular-analysis prototype. Predictions of affinity, toxicity, pharmacokinetics and clinical benefit are unassessed. Student benefit is untested. Scientific release, sensitive-data intake and production deployment remain blocked. The accepted blocked ALDH1A1 design is historical study preparation, not a completed study.

The archive excludes credentials, environment files, local databases, Git history, installed environments, `node_modules`, caches and build outputs. Existing private run history is deliberately not migrated. No external service API key is needed for the supported local demo. First installation still needs package downloads. Platform-specific availability and the receiving computer's startup must be checked there; a second-machine runtime pass is not claimed here.

No finished BioScribe presentation was supplied in the earlier source kit. The PPTX in `presentation/02-official-problem` is the organisers' problem-statement deck. Use the included slide material to produce your final presentation and fill in team/repository details.
