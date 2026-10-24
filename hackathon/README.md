# BioScribe hackathon demo

This is a working educational molecular-analysis demo. It supports actual descriptor calculations, a conformer explorer, deterministic shortlists and evidence-bearing JSON reports. It does not establish drug efficacy, safety or biological predictive performance.

## Start on this computer

From the repository root in PowerShell:

```powershell
& .\hackathon\start-demo.ps1
```

Open **http://localhost:3000/molecules**, then select **Load 8 example molecules**. This recorded route requires only the frontend, has no external model/API dependency, and does not need a token. Keep the frontend running during the presentation.

The launcher also starts the authenticated API and worker when port 8000 is free. Credentials, job storage and logs live in ignored `hackathon/.local/`; other local services and existing credentials are preserved. If port 8000 was already occupied, verify its owner/settings and use its existing provisioned token. The launcher does not claim readiness just because processes were started.

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health/ready
```

For a new calculation, click **Analyze your molecules**, then **Use four public molecule examples**. Paste the contents of `hackathon/.local/demo-token.txt` into **Access token**, confirm public inputs, and submit. The token stays in browser memory; re-enter it after a reload. Do not put it in slides, screenshots or source control.

The starter uses the already installed `.phase3-venv` and `bioscribe-ai/node_modules`. It does not install missing dependencies. Existing Python and npm locks remain authoritative; no dependencies were added for this demo.

## Three-minute judging walkthrough

1. **Problem, 20 seconds.** “Early exploration is fragmented: molecule identity, calculations, visualization and reports become disconnected. BioScribe keeps each result tied to its input and makes uncertainty visible.”
2. **Molecules and 3D, 50 seconds.** Load the eight examples. Select caffeine, rotate it, switch from ball-and-stick to space filling, and show molecular weight, calculated logP and TPSA. Say explicitly that this is a calculated conformer, not an experimentally determined or bound structure.
3. **Screening and reports, 45 seconds.** Change the selection budget from three to two. Explain that the distance score is a transparent, unvalidated ordering by MW/TPSA proximity. Search for ethanol to demonstrate that filtering the visible library does not change the shortlist. Export the full run JSON or the shortlist with its source evidence.
4. **Unknown-label handling, 45 seconds.** Open **Compare two screening strategies**. Click **Budget 10**: invented positives are 2/10 and 1/10. Click **Unknown label**: comparisons and selections become unassessed; all 120 molecules remain scored. Emphasize that these labels are invented and demonstrate software behavior only.
5. **Live calculation, optional.** Use the four-molecule preset with the locally provisioned token. Results arrive from the authenticated API and persisted worker job, with a new run ID. Have the recorded example available if local services are not running.

## What works and its limits

| Feature | Current behavior |
| --- | --- |
| Live molecular analysis | Existing bounded Phase 3 parser, RDKit descriptors and per-field evidence; up to 16 molecules per request, 256 atoms each. Requires API, worker and token. |
| Recorded example | Eight real descriptor computations saved through the existing Store and displayed as recorded public examples. No invented descriptor values. |
| 3D | Local 3Dmol asset and eight RDKit ETKDGv3 + UFF conformers, fixed seed 20261023. Canonical identity matching only. Other molecules show “No matching conformer”; arbitrary SMILES-to-3D generation is not implemented. Unspecified stereochemistry is not resolved. |
| Shortlist | Ascending existing descriptor-distance heuristic; hash/index tie-break; exact budget. Unsupported rows, missing scores or duplicate canonical identities withhold selection. No affinity, safety or hit-rate claim. |
| Comparison lab | Existing learning parser/filter code, copied into a separately served presentation directory. Three accepted exports with synthetic labels. Original learning files and scientific-study records were preserved. |
| Reports | Full RunView JSON; shortlist JSON containing selected input hashes, score evidence and the complete source run. Local imports are contract-checked but not origin-authenticated. Maximum import 3 MiB. Browser print/save-PDF control is supplied; PDF output was not independently rendered/verified. |
| Unsupported science | Affinity, calibrated confidence, toxicity, pharmacokinetics, synthesis and experimental structural interpretations remain unassessed. Clinical/enterprise/external-model routes remain disabled. |

Do not claim that the eight examples were screened experimentally, that a shortlist contains confirmed hits, or that the synthetic comparison demonstrates biological accuracy. Scientific release, sensitive-data intake and production deployment gates remain unmet.

## Verification performed on 2026-10-23

Commands run from the repository root unless stated otherwise:

```powershell
.\.phase3-venv\Scripts\python.exe hackathon/build_examples.py
.\.phase3-venv\Scripts\python.exe hackathon/verify_assets.py
cd bioscribe-ai
npm run test:hackathon
npm run test:contract
npm run lint
npm run typecheck
npm run build
```

- Asset generation: eight molecules. Asset verification: **58 assertions passed**, including regenerated field correspondence, conformer connectivity and hashes.
- New software checks: **23 passed** in `software-checks.json`.
- Existing client contract checks: **25 passed**.
- ESLint and TypeScript: passed. Production build: passed. No new dependencies or lock changes were required by this work.
- Browser rehearsal: recorded loading, molecule switching, representations/rotation, search, selection budget, downloaded run identity, invalid import clearing, a fresh authenticated four-molecule run, and all three comparison presets were exercised. See `browser-checks.json`.
- Full backend 173-test suite, full learning suites, clean installation, mobile layout and deployment were **not rerun**. Backend application source was not modified in this work. These checks do not constitute scientific validation.

Recorded example run: `af2cca81e97a4f5889c8392a1a7bd3d5`.
Live browser rehearsal run: `f44509c0ced44eacb241ee1edec24eca`.

## Rebuild recorded assets

`build_examples.py` uses the locked engine and an isolated example database at `hackathon/data/examples.sqlite3`. It does not alter a study protocol or access assay outcomes. It also copies and adds presentation controls to the learning viewer. The source learning viewer remains authoritative for that exercise; regenerate the copy after source changes. `assets-manifest.json` records the served asset hashes.

`invalid-report-fixture.json` is an intentionally invalid test fixture. Opening it in the explorer must reject it and remove earlier results. It is never served as a valid example.
