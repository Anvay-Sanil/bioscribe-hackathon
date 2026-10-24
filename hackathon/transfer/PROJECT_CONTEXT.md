# BioScribe handoff context

Snapshot prepared for HM-01 ProvenanceLab, Track 04 Health & MedTech, 24 October 2026. This is a curated summary of the project files and recorded review history, not a verbatim conversation export.

## Goal and current product

BioScribe is a molecular evidence lab for biotechnology students. It preserves original molecular strings, validates supported graphs precisely, computes descriptors, keeps missing evidence explicit, compares saved runs and exports enough context for matching-engine recomputation. The hackathon pitch is reproducible molecular analysis with evidence checks.

The user's priorities are the original light/purple frontend, a working molecule/3D/comparison/report demonstration and honest evidence. The user is building independently as a project-based learning exercise and has declined participant testing. Never invent user studies, independent reviewers, scientific validation, winning odds or world-first novelty.

## Current supported composition

- `source/backend/bioscribe/api.py`: supported FastAPI application, composing `/v3` and `/lab` contracts.
- `source/backend/bioscribe/`: authentication, strict evidence contract, biological parsing, durable SQLite jobs, bounded worker and recovery logic.
- `source/backend/provenance_lab/`: HM-01 plain-SMILES validation, graph identities, calculated descriptors, frozen reference bytes and offline replay.
- `source/bioscribe-ai/`: Next.js 15.5.4 / React 19.1.0 / TypeScript UI, original light lavender/purple styling, local example 3Dmol conformers.
- `source/hackathon/start-demo.ps1`: loopback launcher; creates new credentials, persists local jobs, preserves occupied ports. Uses `.phase3-venv` and frontend `node_modules` after installation.
- `source/learning/`: standalone synthetic-label teaching exercise and viewer; invented labels must stay labelled synthetic.
- `source/validation/`: Phase 4 preflight and blocked study records, not completed predictive evaluation.

Main routes: `/dashboard`, `/proof`, `/evidence`, `/molecules`, `/pipeline/new`, `/results/[run_id]`. Legacy predictive/clinical routes are disabled. Older source remains for history; its presence does not establish a working capability.

## What actually works

Precise input diagnostics, declared graph normalization, original and canonical identities, supported molecular descriptors, explicit evidence/assessment metadata, fixed-budget comparisons, owner-scoped run persistence, JSON/HTML reports, run-change inspection and matching-runtime replay. Example conformers are precomputed illustrations, not docking poses or arbitrary molecule-to-3D generation.

The descriptor-distance score is `abs(MW - 350)/350 + abs(TPSA - 75)/75`, dimensionless, ascending. QED comparison sorts descending. Both are unvalidated as biological ranking methods. Current ties use original-input hash then row index.

Molecular identity preserves isotopes, formal charge, fragments, assigned/unassigned stereochemistry and tautomer/protonation distinctions. No salt stripping, pH inference, tautomer merging or stereo completion is performed. Plain-SMILES policy rejects unsupported annotation, whitespace/control characters, query/dummy graphs and invalid valence. Unsupported rows stay visible; affected shortlists are withheld.

The snapshot contains six public identity records for aspirin, caffeine and acetaminophen, each from PubChem and ChEMBL. It is not a full database release and contains no assay-hit dataset. Eight example conformers are available through the original explorer. Current Lab limits include 16 molecules, 2,048 characters each, 256 parsed atoms, 30-second worker computation, queue 32 and two attempts.

## Strongest demonstration

Experiment Challenges recomputes a control and applies six perturbations: row order, equivalent spelling, duplicate insertion, invalid input, budget change and numerical forgery. Changing a molecular weight and rebuilding the checksum must still fail fresh replay. The suite uses seven local jobs for six expected behaviours. Capsules retain recorded evidence; importing a capsule does not rerun jobs or authenticate authorship.

Replay compares a declared scientific payload at eight-decimal reporting precision under a matching trusted installed engine. Uploaded source text is evidence only and must never be executed. Checksums are not signatures or biological truth.

## Accepted review history and recorded verification

Phase 1 inventoried the repository. Phase 2 established scientific and privacy containment requirements. Phase 3 implemented a constrained public-data workflow; R1 wrong-compound publication, R2 silent molecular reinterpretation/dummy graphs and R3 correlation-direction defects were subsequently corrected and independently reviewed as closed. Phase 3 remains partial with deployment/scientific/privacy gates open.

Phase 4 software preflight was accepted for study design. Its original 45 checks and incomplete-template exit 2 do not establish predictive validity. The proposed ALDH1A1 study BS-RANK-001 design 0.3 was accepted as a blocked design record: assay version 2/revision 1 was adopted prospectively; fixed-library replay is descriptive. Confidence-bound qualification, custody, named roles, construct identity, source-release binding, label adjudication and dataset suitability remain unresolved. Do not execute/unblind the study or claim preregistration.

Recorded project checks:

- Corrected original Phase 3: 173 backend tests and 25 client contract checks (earlier iteration).
- Later Evidence Lab: 234 Windows backend tests; 61 overlapping Linux Lab checks (23 October).
- Latest Experiment Challenges iteration: 147 client checks (34 new plus 113 existing), seven real local jobs, six expected behaviours, 11 browser checkpoints, build/type/lint passed (24 October).
- Two recorded packages matched across Windows/Linux on one physical host. Second-physical-machine reproduction is not demonstrated.

Counts overlap and must not be summed as unique tests. These are historical records retained in source/hackathon and source/docs; they were not all rerun for the transfer. Consult `TRANSFER_CHECKS.json` for packaging-specific checks performed now. Software checks do not establish biological accuracy.

## Current known gaps and next work

The 24 October innovation audit reproduced a tied-selection change caused by equivalent SMILES spelling under the raw-input-hash tie policy, while graph identities and descriptors stayed equal. It also found different backend/browser handling of omitted constant evidence metadata. Those observations are documented in `source/docs/innovation-audit-2026-10-24/`; no fix should be implied.

Proposed only: automatic Counterexample Finder, Decision Stability Explorer, evidence-dependency rules, decision-directed clarification and independent replay exchange. Existing curation/provenance/testing tools are prior art. Global uniqueness has not been established.

## Mandatory continuation rules

1. Keep unsupported affinity, confidence, toxicity, half-life, synthesis and structural predictions disabled or explicitly unassessed.
2. Retain one authoritative contract per API version, per-field evidence semantics and input-to-output identity binding. Never upgrade historical method evidence silently.
3. Retain strict molecular parsing and complete rows; unknown labels are not negatives and must not be silently excluded.
4. Keep recorded demos, synthetic labels, fresh computations and proposed features distinguishable.
5. Preserve the original light interface. Make improvements within the supported workflow rather than reviving unverified legacy modules.
6. Run implementation checks for changes; preserve historical verification and record new commands/results separately.
7. Keep sensitive data, scientific release and production deployment blocked until their separately documented gates are satisfied.

## Submission and continuation map

`00-START-HERE.md`: transfer/setup. `AI_HANDOFF.txt`: this context plus complete slide brief. `presentation/`: slides, notes, prompt, official problem, screenshots, evidence and roadmap. `SUBMISSION_CHECKLIST.md`: final submission actions and unresolved user-supplied details. `source/README.md`: current product. The source checkout contains old historical documents; use this summary and the current README before interpreting earlier claims.

No destination, public repository, live public URL, team identity or final slide deck has been invented. No upload or public publishing occurred while preparing this transfer.
