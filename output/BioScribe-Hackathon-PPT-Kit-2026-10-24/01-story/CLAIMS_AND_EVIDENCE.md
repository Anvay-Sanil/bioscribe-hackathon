# Claim ledger for slide authors

All paths here are relative to the pack root. “Recorded” means earlier verification, not a new test execution while packaging.

| Slide claim | Evidence | Scope / wording restriction |
| --- | --- | --- |
| HM-01 asks for precise validation, identity, frozen snapshots and reproducibility | `02-official-problem/HM01_EXACT_TEXT.md`; official slide 16 | No general HM-01 scoring rubric or time limit is provided in this deck. |
| Supported graph descriptors and explicit missingness | `06-technical/schema-source.py`, `engine-source.py`, `IMPLEMENTATION.md` | Computed descriptors are not experimental measurements or validated predictions. |
| Six frozen records, three compounds | `06-technical/frozen-references/snapshot.json` | Identity correspondence only; a small retrieval snapshot, not full database releases. |
| Exact replay | `04-evidence/earlier-backend/portability.json` and example packages | Declared eight-decimal payload with matching trusted runtime. Two OS environments on one physical host. |
| 147 passing client checks | `04-evidence/latest-feature/VERIFICATION.json` | Recorded 2026-10-24; 34 new + 113 existing. Not biological accuracy. |
| Seven real local jobs, six expected behaviours | `04-evidence/latest-feature/live-checks.json` | One control plus six trials. Bounded selected examples; not universal invariance. |
| 11 browser checkpoints | `04-evidence/latest-feature/browser-checks.json` | Earlier observed browser behaviour. No participant study. |
| Build/types/lint passed | `04-evidence/latest-feature/VERIFICATION.json` | Earlier iteration. Full backend and Linux suites not repeated in that iteration. |
| 234 Windows backend checks | `04-evidence/earlier-backend/all-backend-tests.xml` and `VERIFICATION.json` | Recorded 2026-10-23. Historical, not rerun for this pack. |
| 61 Linux checks | `04-evidence/earlier-backend/linux-tests.xml` | Overlapping Lab subset in another environment. Do not sum as distinct new tests. |
| 24-case worked comparison | `04-evidence/worked-comparison/observations.json` | Curated default-RDKit example, not a representative benchmark or competitor evaluation. |
| Computed 3D conformers | Current screenshot and `06-technical/IMPLEMENTATION.md` | Example library, not arbitrary-input generation, experimental geometry or docking. |
| Equivalent spelling can change a tied selection | `07-roadmap/probe-results.json` | Observed current tie policy. Same graph identities/descriptors; not a numerical descriptor error. |
| Automatic witness search and stability explorer | `07-roadmap/RESEARCH_AND_ROADMAP.md` | PROPOSED, not implemented. |
| Student usefulness | No participant evidence | Intended benefit only; explicitly untested. |
| Globally novel / first ever | No exhaustive prior-art evidence | Do not claim. Existing curation/provenance/testing tools are acknowledged. |

## Avoid these unsupported claims

“AI discovers drugs”, “predicts binding affinity”, “confirms safety”, “validated synthesis”, “clinical-grade”, “HIPAA compliant”, “FDA approved”, “100% accurate”, “works on every machine”, “saves students X hours”, “first in the world”, “10/10 guaranteed”.

Use “working local public-data educational prototype”, “calculated descriptors”, “recorded software checks”, “bounded challenge”, “matching-runtime replay”, and “proposed development” where appropriate.

Checksums establish consistency. Fresh recomputation tests computational agreement. Signatures would address authorship under a defined trust policy. None alone establishes biological validity.
