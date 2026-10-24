# Evidence Lab — HM-01 implementation and verification

Date: 2026-10-23. Scope: educational public, non-sensitive molecule analysis. No assay outcomes or study labels were accessed. The prior HM-01 assessment remains preserved in `hackathon/hm01/` as the pre-change baseline.

## Implemented workflow

`SMILES rows → strict request → owner-scoped persisted job → bounded offline worker → typed molecule/field evidence → stored replay package → schema + semantic + checksum verification → UI/report → fresh recomputation`

The new `/lab` workflow has its own authoritative `lab-1.0.0` contract in `backend/provenance_lab/schemas.py`. The original `/v3` workflow remains supported with its original `3.0.0` contract and method versions. Old v3 exports are not silently promoted to Lab packages or given the new replay guarantees.

| Requirement | Implementation / acceptance evidence |
| --- | --- |
| Precise invalid-input handling | Typed diagnostics distinguish empty input, annotations, non-ASCII/control/whitespace, graph limits, ring/branch/general syntax, valence, aromaticity, dummy/query graphs, unsupported bond/stereo and atom maps. Source character offsets are reported only when known; atom/bond coordinates are explicitly separate. Negative regression cases have no numeric output. |
| Identity | Original strings and hashes retained; canonical graph and separate graph hash; charge, fragments, isotopes, tautomer/protonation and stereo policy visible. Equivalent graph groups and ambiguous tetrahedral/double-bond stereo are reported. Nine original identity-pair scenarios plus E/Z distinction are checked. |
| Missing evidence | All nine requested fields are present, including rejected inputs. `not_computed`, `not_available` and `not_applicable` are separate enums, preserved in JSON, UI and full HTML report. Null and evidence contradictions reject the report and clear prior state. |
| Comparisons | MW, calculated logP, TPSA, aromatic fraction, QED and descriptor distance. Ordering requires complete scores and unique graph identities. Budget is fixed in the saved request; tie-break is input hash then index. Filtering changes only the visible list. No activity labels or performance metrics. |
| Frozen references | Six actual compound-identity responses: aspirin, caffeine and acetaminophen, each from PubChem and ChEMBL. Exact IDs, raw response bytes, URLs, retrieved UTC, available headers, raw hashes and source-to-graph mapping preserved. Source endpoints did not supply an immutable compound release version; the snapshot explicitly says this. All analysis uses local files. |
| Portable replay | Original request, complete scientific result, source text, dependency lock and raw reference texts in a strict package. Recompute against the matching installed trusted engine. Never execute uploaded source. Verify input count/order, input and identity hashes, methods, field semantics, snapshot identity, engine identity and result digest. |
| Persistence and recovery | SQLite jobs, UUID4 IDs, owner isolation, idempotency, 32-job queue, 45-second leases, maximum two attempts, stale-writer fencing, cancellation and publication/retrieval input binding. Interrupted attempts recover after lease expiry; exhausted attempts fail explicitly. |
| Portability | Both recorded packages replayed to identical scientific SHA-256 values on Windows and network-disabled Linux x86-64, with Python 3.11.9 and locked dependencies. Two OS environments on one physical host; no universal portability claim. |
| Demo experience | Original light purple styling, responsive Evidence Lab, real 3D conformers for matching example identities, source inspection, missingness explanations, comparison, replay and full-library HTML/JSON exports. |

## Methods and precision

Method identity: **bioscribe-evidence-lab/1.0.0**. The complete implementation and schema are part of the engine fingerprint. Semantic changes require a new release and requalification, not relabeling old exports.

| Output | Implementation / parameters | Interpretation and fixtures |
| --- | --- | --- |
| Molecular weight | RDKit `Descriptors.MolWt`, RDKit 2025.3.3 | Calculated average molecular weight in g/mol; graph-equivalence and fixed compound cases. |
| Calculated logP | RDKit `Crippen.MolLogP` | Calculated descriptor, dimensionless; no permeability or clinical interpretation. |
| TPSA | RDKit `rdMolDescriptors.CalcTPSA` defaults | Å²; calculated descriptor. |
| Aromatic fraction | Aromatic heavy atoms / all heavy atoms | Dimensionless; H2 zero-denominator fixture explicitly `not_applicable`. |
| QED | RDKit `QED.qed` defaults | Dimensionless descriptor; descending ordering is a comparator, not a hit prediction. |
| Descriptor distance | `abs(MW-350)/350 + abs(TPSA-75)/75` | Same target-independent arithmetic as the prior heuristic, with the Lab reporting/identity contract. Dimensionless, unvalidated; no kcal/mol or confidence claim. |
| Binding, toxicity, half-life | Disabled assessment policy | Null, `not_available`, `not_assessed`; no reassuring absence-of-alert conclusion. |

Numerical fields are rounded to **eight decimal places** in the authoritative scientific payload. Integral floats become JSON integers. Canonical JSON uses sorted keys, ASCII escaping and no insignificant whitespace. The result hash covers request hash, engine hash, reference snapshot hash, every row/property and the comparison. UUID, timestamps and observed OS metadata are outside that scientific hash. This is exact equality of the declared output representation, not a promise of bitwise equality of hidden floating-point intermediates.

RDKit primitives and stereochemistry behavior are documented in the [RDKit Book](https://www.rdkit.org/docs/RDKit_Book.html) and [chemistry operations reference](https://www.rdkit.org/docs/source/rdkit.Chem.rdmolops.html). Source acquisition uses [PubChem PUG REST](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) and the [ChEMBL molecule API](https://chembl.gitbook.io/chembl-interface-documentation/web-services/chembl-data-web-services). Current online documentation may describe newer releases; the installed dependency is pinned and behavior is checked by fixtures.

## Commands and observed results

Run from the repository root unless a working directory is specified.

```powershell
# New schema/examples, from the installed trusted engine (changes run IDs)
& .\.phase3-venv\Scripts\python.exe hackathon/build_evidence_lab.py

# Windows backend: 234 passed (173 accepted v3 + 61 new), one dependency deprecation warning
Push-Location backend
& ..\.phase3-venv\Scripts\python.exe -m pytest tests_phase3 tests_lab -q --junitxml=../hackathon/evidence-lab/all-backend-tests.xml
Pop-Location

# Client checks: 25 accepted contract + 23 existing hackathon + 35 new
Push-Location bioscribe-ai
npm run test:contract
npm run test:hackathon
node scripts/evidence-lab-check.cjs
npm run lint
npm run typecheck
npm run build
Pop-Location

# Build the tested runtime; the image ID is recorded in portability.json
docker build -t bioscribe-hm01:1.0 .
& .\hackathon\verify-portable.ps1

# General offline replay; socket connections are denied by the CLI
Push-Location backend
& ..\.phase3-venv\Scripts\python.exe -m provenance_lab replay ../bioscribe-ai/public/evidence-lab/reference-run.json --output ../hackathon/evidence-lab/local-replay.json
Pop-Location
```

The production frontend build and type/lint checks passed. Exact final command records and hashes are in `VERIFICATION.json` and `artifact-hashes.json`; browser evidence is recorded separately. The Linux suite passed **61** checks with one dependency deprecation warning. Its first attempt failed because a root-owned temporary mount was not writable by the non-root process; the corrected run sets `BIOSCRIBE_DATABASE=/tmp/startup.sqlite3` and passes. The earlier failed attempt is not counted as a pass.

Linux suite command from the repository root:

```powershell
docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --memory 1g --cpus 2 --tmpfs /tmp --mount "type=bind,source=$PWD\backend\tests_lab,target=/tests,readonly" --mount "type=bind,source=$PWD\hackathon\evidence-lab,target=/out" -e BIOSCRIBE_DATABASE=/tmp/startup.sqlite3 -e PYTHONPATH=/app/backend -e PYTHONDONTWRITEBYTECODE=1 bioscribe-hm01:1.0 python -m pytest /tests -q -p no:cacheprovider --junitxml=/out/linux-tests.xml
```

## Startup and limits

- Start existing installed environments with `hackathon/start-demo.ps1`; open `/evidence`.
- Fresh Python setup: Python **3.11**, create `.phase3-venv`, then install `backend/requirements-phase3.lock`. Fresh frontend setup: `npm ci` in `bioscribe-ai`. The Linux image performs a clean locked Python installation. A fresh Windows npm installation was not repeated in this change.
- Main API: `python -m uvicorn bioscribe.api:app --host 127.0.0.1 --port 8000 --no-access-log`, worker: `python -m bioscribe.worker`, both from `backend` with `BIOSCRIBE_DATABASE`, `BIOSCRIBE_AUTH_FILE` and `BIOSCRIBE_ORIGIN` set by the launcher.
- Authenticated routes: POST `/lab/runs`, POST `/lab/replay`, GET `/lab/runs/{id}`, POST `/lab/runs/{id}/cancel`, GET `/lab/runs/{id}/export`. Public schema: GET `/lab/schema`.
- 1–16 molecular records, 2,048 characters each, 1–256 parsed atoms, budget 1–record count, 128 KiB ordinary HTTP requests, 2 MB replay-package request/output limit, 30 seconds per computation, at most two attempts. Browser imports are bounded to 2 MB.
- Computation subprocesses deny socket connects; the portability container additionally uses OS network isolation. Production OS isolation, memory controls, TLS, operational monitoring and externally protected audit checkpoints remain deployment gates.
- The full HTML report contains all rows, evidence and missingness; it is human-readable and printable. The JSON replay package is required for recomputation. Importing a file is not a fresh execution.

## Trust boundaries and remaining limits

Checksums detect inconsistency, not authenticated authorship, deletion or rollback. Local database/engine administrators remain trusted; independently administered checkpoints and authenticated evidence signing are not supplied by this educational extension. Existing production audit gates remain blocked.

Replay requires the matching installed trusted source/dependency/reference bundle. Source bytes in an uploaded package are never executed. A different historical engine produces `historical_engine_unavailable`; restore that known release externally. Arbitrary old v3 exports and missing historical runtimes cannot be recomputed through this new contract.

Only a small compound snapshot and a bounded parser fixture corpus have been qualified for this demo. It is not a comprehensive chemical-domain guarantee. There is no target-specific model, empirical biological performance validation, clinical utility assessment, authenticated raw-source signature, independent second physical machine test, ARM/Mac validation or production readiness claim. The ALDH1A1 study, its custody gates and outcome restrictions are unchanged.
