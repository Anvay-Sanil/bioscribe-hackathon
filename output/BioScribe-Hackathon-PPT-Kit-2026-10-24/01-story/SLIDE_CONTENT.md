# Suggested 10-slide deck

Suggested duration: five minutes, plus questions. The official deck does not provide a general HM-01 duration or scoring rubric. The MathWorks rubric belongs to its own challenge.

## Slide 1 — BioScribe

**Molecular Evidence Lab**

Reproducible molecule analysis with evidence checks

HM-01 ProvenanceLab | [Presenter/team] | [Institution, optional]

Visual: `03-visuals/current/evidence-overview.jpg`, or a clean editable wordmark using the brand guide.

## Slide 2 — The student’s problem

- Copied molecular strings can be malformed or ambiguous.
- A different representation can change what gets calculated.
- Missing evidence and lost calculation context make results hard to trust.

Footer: Intended student use case from the official problem statement; prevalence and user benefit not measured.

Visual: a native text example, `CCO C1OC1`, alongside the real invalid-input screenshot.

## Slide 3 — A traceable molecular workflow

Preserve input → Validate graph → Compute descriptors → Compare → Export and replay

- Original rows remain visible.
- Every reported quantity has an evidence state.
- Saved runs link the submitted library to its outputs.

Visual: redraw `03-visuals/current-workflow.mmd` as a simple editable diagram.

## Slide 4 — Missing evidence stays explicit

| State | Example |
| --- | --- |
| Not computed | Rejected molecular input |
| Not available | No validated toxicity model |
| Not applicable | Heavy-atom fraction with zero heavy atoms |

Footer: A successful calculation does not establish biological activity or safety.

Visual: current missing-evidence screenshot, with its hydrogen-input caption.

## Slide 5 — The result includes its calculation context

- Original input and molecular graph identities
- Six frozen reference records covering three compounds
- Method, dependency and result fingerprints
- Matching-engine replay and complete exports

Footer: Exact equality refers to the declared scientific payload at eight-decimal reporting precision. Historical runtime availability is required.

Visual: `03-visuals/historical/replay-proof.jpg`, captioned as an earlier recorded replay.

## Slide 6 — Challenge the experiment

Shuffle the library. Change the spelling. Plant a duplicate. Break an input. Change the budget. Forge a number.

**A rebuilt checksum does not make a changed result agree with fresh computation.**

Footer: Six bounded software challenges; no biological qualification or authenticated authorship.

Visual: `03-visuals/historical/experiment-challenges.jpg`. Explain that it records a previous local execution.

## Slide 7 — How it works

Next.js / React interface → FastAPI + strict schemas → SQLite jobs → bounded RDKit worker → checked exports

- Local public-data workflow
- Frozen references and locked dependencies
- Unsupported predictions remain unassessed

Visual: `03-visuals/architecture.mmd` as editable diagram. Keep detailed version numbers in notes.

## Slide 8 — Recorded verification evidence

| Latest feature iteration | Recorded result |
| --- | --- |
| Client software checks | 147 passed |
| Local integration | 7 jobs; 6 expected behaviours observed |
| Browser checkpoints | 11 passed |
| Build, types and lint | Passed |

Footer: Recorded 24 October 2026; not rerun for this deck. Software behaviour, not biological accuracy. Earlier Windows/Linux checks are separate appendix evidence.

Optional note: two packages matched across Windows/Linux on one physical host. Do not claim universal cross-machine reproducibility.

## Slide 9 — Scope and intended value

**Available:** input diagnostics, descriptors, explicit evidence states, saved runs, replay and experiment challenges.

**Still untested or limited:** student benefit, broader reference coverage, independent-machine reproduction and production deployment.

Footer: No validated affinity, toxicity or pharmacokinetic predictions. Rankings are unvalidated biological heuristics.

Visual: real current aspirin conformer, captioned “Illustrative computed conformer; example library only.” Do not use a predictive-performance chart.

## Slide 10 — Next development

**Proposed: explain what would change a decision.**

- Automatically find a small reproducible counterexample.
- Show which selections depend on declared assumptions.
- Identify the missing fact needed to resolve disagreement.

Footer: Roadmap only. These features are not implemented. Student benefit and global novelty remain unestablished.

Closing line: BioScribe makes the input, evidence and computation inspectable alongside the result.

[Verified repository/demo link, if supplied] · [Presenter details]

## Optional appendix material

Use the claim ledger for precise test scope, JUDGE_QA for difficult questions, official slide 16 for requirements, and the audit for the tied-ranking limitation. Do not add appendices if the event imposes a fixed total slide count.
