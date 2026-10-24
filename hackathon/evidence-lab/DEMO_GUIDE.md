# BioScribe for HM-01 — three-minute judging demo

**Pitch:** BioScribe helps biotechnology students validate molecular inputs, compare reproducible descriptors, and replay an experiment with its evidence intact.

## Start before judging

From the repository root, run `powershell -ExecutionPolicy Bypass -File hackathon/start-demo.ps1`, then open **http://localhost:3000/evidence**. The launcher preserves existing services and credentials. Paste the local token from `hackathon/.local/demo-token.txt` into **Local access token** and tick the public-data confirmation. Never put the token in slides, screenshots or the submission archive.

The installed environment is already prepared. The full setup, commands, evidence and limitations are in [IMPLEMENTATION.md](IMPLEMENTATION.md). Recorded examples work without the API or a token. Fresh analysis and replay require the API and worker.

## Rehearsal

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:25 | Evidence Lab, three reference compounds | “Students copy SMILES into tools and spreadsheets. A plausible number can survive even when the input, identity or evidence is wrong. BioScribe keeps those distinctions visible.” |
| 0:25–0:50 | **Analyze molecules**, then **References** for aspirin | “This is a new persisted computation. These are six frozen compound records from PubChem and ChEMBL. Runs use the local snapshot, with source IDs and exact content hashes.” |
| 0:50–1:20 | **Break the input**, record #3, then #11 | “An unclosed ring is diagnosed precisely and its requested properties say ‘Not computed’. Hydrogen has no heavy-atom denominator, so that fraction is ‘Not applicable’. Toxicity is ‘Not available’ because no validated model is installed.” |
| 1:20–1:40 | Record #2 **Identity**, then #10 | “OCC and CCO are the same graph under the declared policy, with different original-input hashes. Unspecified double-bond geometry stays unresolved. We never invent stereochemistry.” |
| 1:40–2:10 | Restore **Three reference compounds**, show comparison | “The same complete library is ordered by two descriptor rules. These are unvalidated orderings, not biological hit predictions. Rejected inputs or duplicate graphs withhold the selection.” |
| 2:10–2:50 | **Export replay package** → **Open replay package** → **Recompute & compare** | “The package carries original inputs, method source, dependency identity and raw frozen records. The worker recomputes the result. These two full hashes match. Uploaded source is never executed.” |
| 2:50–3:00 | **Export full report** | “Every requested field keeps its meaning in a portable report. The same two test packages also replayed exactly in Windows and network-disabled Linux.” |

For a shorter slot, skip the live initial analysis and 3D. The clearest technical proof is export → import → recompute → matching hashes.

## If a judge asks

- **Is this AI drug discovery?** No target-specific prediction or LLM is enabled. The working contribution is deterministic molecular analysis, explicit evidence status and reproducibility. Adding a model would require endpoint-specific validation.
- **Is a hash proof of scientific truth?** No. A hash checks consistency of bytes under the declared canonicalization. Recomputing checks implementation repeatability. Neither authenticates authorship or proves biological validity.
- **What is the identity rule?** Canonical isomeric graph, preserving fragments, formal charge, tautomer/protonation state, isotope and supplied stereo. No parent/salt stripping or silent neutralization. Ambiguity is reported.
- **Is this just a wrapper around RDKit?** RDKit supplies chemistry primitives. BioScribe adds typed diagnostics, per-field missingness, source-bound reference records, owner-scoped persistent jobs, fenced publication, source/runtime-bound portable replay, consumer validation and tested export behavior.
- **Does it run on any machine?** Tested on Windows x86-64 and a Linux x86-64 container on the same host. Exact scientific-payload equality passed for both reference and challenge packages at the declared eight-decimal reporting precision. Other architectures and arbitrary library versions remain unverified.
- **Why only three reference compounds?** A deliberately inspectable six-record demonstration snapshot. Adding records requires a new explicit freeze and source mapping. No broad database-coverage claim is made.
- **Can I edit the package and recompute its checksums?** Checksums alone can be rebuilt. Replay must also match the installed trusted engine and reproduce the scientific payload. The tests include a rehashed false value and uploaded source containing executable code; both fail safely. An attacker replacing the installed engine or database is outside this local educational trust boundary.

## Fallback

If the local worker is unavailable, use the recorded examples and show [portability.json](portability.json), the saved replay receipts, and [browser-replay.txt](browser-replay.txt). State that these are recorded verification results. Do not describe loading a report as fresh recomputation.

If the engine fingerprint differs, report `historical_engine_unavailable`. Restore the matching trusted release environment; never edit historical evidence or silently relabel it as current.

Scientific release, sensitive-data intake and production deployment are not part of the hackathon claim. The blocked ALDH1A1 study is unchanged.
