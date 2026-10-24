> Standalone hackathon snapshot. See [setup and current development status](HACKATHON_SNAPSHOT.md).

# BioScribe — Molecular Evidence Lab

**A working HM-01 hackathon project for reproducible molecule analysis with evidence checks.**

Validate molecular inputs, compare calculated descriptors, inspect frozen PubChem and ChEMBL records, and export a complete experiment that can be recomputed with a matching result hash.

## Run the demo

```powershell
powershell -ExecutionPolicy Bypass -File hackathon/start-demo.ps1 -Verify
```

Open **http://localhost:3000/proof** for the worked comparison and judging walkthrough, or **http://localhost:3000/evidence** for the lab. Recorded examples need no token. For fresh calculations and replay, choose **Load token file**, select `hackathon/.local/demo-token.txt`, click **Check connection** and confirm public, non-sensitive input. Keep that credential private. `-Verify` performs one public analysis, checks its persisted export and recomputes it locally before judging.

- [Current judging guide, exact checks and remaining evidence gaps](hackathon/judging-upgrade/README.md)
- [Earlier three-minute judging guide](hackathon/evidence-lab/DEMO_GUIDE.md)
- [Implementation, methods, exact verification commands and limits](hackathon/evidence-lab/IMPLEMENTATION.md)
- [Verification record](hackathon/evidence-lab/VERIFICATION.json)
- [Windows/Linux replay comparison](hackathon/evidence-lab/portability.json)

## What works

- [Evidence Assistant (first bounded implementation)](docs/EVIDENCE_ASSISTANT_IMPLEMENTATION.md) at `/evidence-assistant`: source-cited claim reviews, four verdicts, exact assay/run comparisons, weak-evidence abstention and differing assay observations. The 150-claim set is provisional; general paper entailment, calibrated accuracy and beating the model baseline remain unestablished.

- Precise parsing diagnostics and explicit stereochemistry warnings.
- Original-input and canonical-graph identities with a declared normalization policy.
- Per-field **not computed**, **not available** and **not applicable** meanings.
- Molecular descriptors, conservative fixed-budget comparisons and identity-matched example 3D conformers.
- Six frozen public compound records with source IDs, raw bytes and hashes.
- Owner-scoped persisted jobs, bounded workers, interruption recovery and wrong-input publication checks.
- Portable JSON replay packages, fresh recomputation with hash comparison, and complete human-readable HTML reports.
- A run change inspector that matches unique graph identities, distinguishes budget and dependency changes, and clears invalid comparisons.
- A reproducible 24-case worked comparison against a supplied basic RDKit script. This is a curated demonstration, not a representative benchmark.
- [Experiment challenges](hackathon/experiment-challenges/README.md): recompute a control, run six deliberate perturbations, detect rebuilt-checksum numeric tampering, and export/reopen the recorded evidence capsule. These are bounded software checks, not biological qualification or established global novelty.
- The original molecular explorer at `/molecules` and synthetic learning exercises remain available.

## What the evidence supports

The software checks and replay receipts establish tested implementation behavior and repeatability under the declared runtime. They do **not** establish biological activity, affinity, safety, pharmacokinetics, calibrated confidence or clinical usefulness. **Student usefulness and productivity benefits remain untested.** Descriptor orderings remain scientifically unvalidated. Scientific release, sensitive-data intake and production deployment gates remain blocked.

The original Phase 3 `/v3` contract remains supported. New Evidence Lab runs use the separate versioned `/lab` contract; historical evidence is never silently upgraded. The blocked ALDH1A1 study and its files are unchanged.

See [the accepted Phase 3 implementation](docs/PHASE_3_IMPLEMENTATION.md) for earlier scope and gates. The earlier README and speculative prototype feature descriptions are preserved in [the historical archive](docs/archive/PRE_EVIDENCE_LAB_README.md); they are not current capability claims.
