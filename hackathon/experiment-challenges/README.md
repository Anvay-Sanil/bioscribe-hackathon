# Experiment challenges: a report you can try to disprove

Implemented on 24 October 2026 for BioScribe's public-data educational workflow. The differentiating proposal is an interactive, per-experiment challenge suite with explicit expected behavior and portable evidence. **Global novelty is not established.** This is a new BioScribe feature built using established software-testing and cheminformatics techniques.

## Try it

1. Start the existing API, worker and frontend. Open `http://localhost:3000/evidence`.
2. Choose **Load challenge-ready library**. It contains four public example graphs with six applicable challenges; this initial package is a recorded example.
3. Load the local token and confirm public, non-sensitive input.
4. Follow **Go to experiment challenges**, then choose **Challenge this experiment**.
5. Inspect the expected/observed behavior and persisted run IDs. **Forge a number** passes only when replay fails for the exact altered package with `replay_result_mismatch`.
6. Export the challenge capsule. Reopening it recomputes the relationship checks locally, but explicitly does not rerun its historical jobs. To get fresh execution evidence, run the challenges again.

Suggested pitch: **“BioScribe gives every molecular experiment an adversarial rehearsal: change the inputs, challenge the assumptions and inspect the evidence for what survived.”** The rehearsal tests bounded software behavior, not biological truth.

## Six challenges

| Challenge | Deliberate change | Required observation |
|---|---|---|
| Shuffle the library | Reverse input record order | Same graph identities, full property records and selected graph identities |
| Change the spelling | Use recorded canonical isomeric SMILES | Same graph identities and full property records; no assertion about selection ties because input-hash tie-breaks can change |
| Plant a duplicate | Append an exact copy of the first input | Preserve the duplicate and original records; withhold ranking |
| Break one input | Replace the first input with an empty record | Retain the record, reject it, publish no numeric descriptors for it, preserve other records and withhold ranking |
| Move the budget | Change to the next budget, or to one at the maximum | Unchanged molecular rows and full orderings; selections are exact prefixes |
| Forge a number | Add one to a copy's molecular weight and rebuild its result hash | The copied package remains structurally consistent, but fresh server replay rejects the changed scientific payload |

The original source is never changed. A fresh control must reproduce its scientific hash before challenges begin. Libraries with rejected inputs, missing ranking scores or duplicate identities are ineligible. Single-record reorder/budget checks, already-canonical spelling changes and duplicate insertion at the 16-record bound are explicitly `not_run`. They cannot become successful observations.

## Evidence contract and execution limits

`bioscribe-challenge-capsule/1.0.0` identifies the capsule; `bioscribe-experiment-challenges/1.0.0` identifies the installed plan/evaluator. The authoritative decoder and types are `bioscribe-ai/src/lib/phase3/lab-challenges.ts`. The runner is `lab-challenge-runner.ts`.

A capsule contains a suite ID, timestamp, source run and result hash, freshly computed control, exactly six ordered dispositions, and a capsule checksum. Each attempted challenge carries its job ID, mode, status, **persisted request SHA-256**, error code and output when present. Requests are reconstructed deterministically from the control and versioned challenge method. The decoder checks each receipt against the planned request hash, validates every successful molecular package, and derives outcomes again; it does not trust imported pass counters.

The failed forgery receipt is also bound to the altered package's full request hash. An unrelated failure, generic timeout, cancelled job, reused run, swapped payload or changed engine cannot count as success. Canonicalization checks are limited to the specific original/canonical strings tested; they are not exhaustive enumeration or an independent chemistry oracle.

Limits: up to seven jobs (one control and six trials), sequential submissions, 45-second polling deadline per job, four-minute suite deadline, existing 30-second worker bound and existing 1–16 molecule limits. Each package retains the original server limits. Imported challenge capsules are bounded to 16 MB and six dispositions. Cancellation attempts to stop the active server job; uncertain cancellation is explicit. Changing the displayed experiment aborts the old component's runner and clears its displayed results.

Capsules detect inconsistent content and preserve inspectable recorded evidence. They do **not** authenticate authorship: someone able to reconstruct a complete unsigned capsule can fabricate historical job receipts. Fresh execution against a trusted local service and independently protected checkpoints address different trust questions. Imported source text is never executed.

The scientific engine, API, worker, storage schema, locked dependencies, six frozen source records and ALDH1A1 study were not changed for this feature. Existing authenticated owner-scoped jobs are reused. No predictive capability or sensitive-data intake was enabled.

## Verification

Run from the repository root unless noted:

```powershell
.\.phase3-venv\Scripts\python.exe hackathon/experiment-challenges/build_fixtures.py
cd bioscribe-ai
node scripts/experiment-challenges-check.cjs
node scripts/experiment-challenges-live.cjs
node scripts/evidence-lab-check.cjs
node scripts/judging-upgrade-check.cjs
npm run test:contract
npm run test:hackathon
npm run lint
npm run typecheck
npm run build
```

- **34 new software checks passed.** Molecular fixture packages are computed with the locked engine; synthetic unit-test receipts are explicitly marked in their generation script. Tests cover positive relationships, falsified receipts, request binding, changed methods and controls, skipped operations, cancellation and failed cancellation.
- **113 existing client checks passed** (35 Lab + 30 judging-upgrade + 25 contract + 23 original hackathon).
- The live integration probe submitted **seven real local jobs**, observed all six expected behaviors, and retrieved all six saved trial outcomes with matching request hashes. See `live-checks.json` and `live-capsule.json`.
- Browser execution, actual export/reimport, damaged-capsule clearing, eligibility and cancellation checks are recorded separately in `browser-checks.json`. The browser-produced capsule is `browser-capsule.json`.
- Lint and typecheck passed; the production build passed. Evidence Lab first-load JavaScript is approximately 216 kB in the recorded build.
- Full backend/Linux regression suites, a clean install, cold start, another physical machine and a production-server browser session were not repeated in this iteration. No backend engine change occurred.

No participant testing was performed. User value remains untested; scientific release, sensitive-data intake, custody and production deployment gates remain blocked.

## Prior-art check and next ideas

The targeted search found substantial existing capabilities. [ChEMBL's pipeline](https://github.com/chembl/ChEMBL_Structure_Pipeline) already checks, standardizes and extracts parent structures. [ChemAudit](https://github.com/Kohulan/ChemAudit) documents validation, cross-pipeline comparison, change tracking and round-trip diagnostics. [RDKit's cookbook](https://www.rdkit.org/docs/Cookbook.html) documents alternate SMILES generation. These components and representation-invariance testing should not be presented as inventions.

The product-level hypothesis is that students benefit from **actively challenging their own saved experiment, including a rebuilt-checksum forgery, and handing another person a capsule of the exact checks**. The reviewed sources do not establish whether this precise interaction already exists elsewhere. The search is neither exhaustive prior-art research nor a patent opinion.

Additional concepts, **not implemented or claimed globally novel**:

| Candidate | Distinctive interaction to investigate | Necessary safeguards |
|---|---|---|
| Assumption branches | Fork a run under explicit salt, protonation or tautomer policies and show which graph identities and selections change | Versioned chemistry policies; never label a transformed form the experimentally correct species; no silent overwrites |
| Evidence removal map | Remove a source record or validation record in a sandbox and show exactly which report statements lose support | A deterministic claim-to-evidence dependency contract; calculation results must not disappear merely because a reference was removed |
| Minimal counterexample finder | When a challenge fails, search for the smallest subset of records that still exhibits that failure and package its reproduction | Bounded, versioned subset search; distinguish a minimal found witness from a globally smallest witness; retain original evidence |

The minimal counterexample finder is the strongest next technical extension. It would turn a red test into a small reproducible debugging case. It has not been added to the interface or represented as a working feature.
