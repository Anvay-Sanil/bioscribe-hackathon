# Suggested five-minute speaker notes

The timings are suggested pacing, not the organiser's requirement. Read naturally and shorten to fit your speaking speed.

## 1 — BioScribe — 15 seconds

BioScribe is our Molecular Evidence Lab for ProvenanceLab. It helps biotechnology students inspect molecular inputs, compare calculated properties and reproduce a saved experiment while keeping missing evidence visible.

## 2 — The problem — 30 seconds

Students often begin with a molecular string copied from somewhere else. The string might be broken, contain extra text or leave stereochemistry unspecified. A program may still produce a number, but that does not tell the student whether the intended molecule was processed. The problem statement asks us to make that uncertainty and the calculation context explicit.

## 3 — Workflow — 30 seconds

We preserve the original input, validate it under a declared policy and compute descriptors only for supported graphs. Every original row remains visible. Comparisons and exports belong to a persisted run, so the displayed result can be traced to the submitted library. Rejected rows do not quietly disappear from a shortlist.

## 4 — Missing evidence — 30 seconds

These three labels mean different things. Not computed means the calculation did not run, for example because the input was rejected. Not available means the relevant evidence or validated model is absent. Not applicable means a quantity is undefined for that input. A blank is not silently replaced with a reassuring value.

## 5 — Reproducibility — 35 seconds

The export includes the request, scientific result, frozen references and the source and dependency identities. A fresh replay recomputes using the matching trusted engine and compares the scientific payload. A checksum alone only establishes internal consistency. Replay asks a stronger computational question, but it still does not prove that a biological claim is true.

## 6 — Experiment Challenges — 45 seconds

Our most distinctive interaction lets a student challenge a saved experiment. BioScribe recomputes a control and performs six deliberate perturbations. The strongest example changes a molecular weight and rebuilds the result checksum. Fresh replay rejects the modified result because it does not agree with the computation. The displayed screenshot records an earlier execution; a live run is available when the local services are ready. The capsule preserves the evidence but does not authenticate authorship.

## 7 — Architecture — 30 seconds

The React interface talks to a FastAPI service with strict schemas. Owner-scoped SQLite records preserve jobs and run IDs. A bounded subprocess worker computes with the pinned RDKit environment and local reference files. The computational path does not depend on an LLM or a live chemical database. Unsupported predictive endpoints stay unassessed.

## 8 — Verification — 30 seconds

The latest feature record reports 147 passing client checks, seven real jobs covering six expected behaviours and 11 browser checkpoints. Build, type and lint checks also passed. Earlier checks cover the backend and Windows/Linux replay on one host. These are scoped software results, not claims of predictive accuracy, universal portability or a fresh suite run for this presentation.

## 9 — Scope — 30 seconds

The working product is a public-data educational prototype. Its intended value is to make errors and evidence understandable. We have not yet tested that benefit with students. The reference snapshot and example conformer library are small. We do not claim validated drug activity, safety, clinical use or production readiness.

## 10 — Roadmap — 25 seconds

Our next direction is to explain what would change a decision. An audit found that changing only a molecular spelling can change a tied selection under the current input-hash tie-break, even though the descriptors remain unchanged. We propose automatically finding such counterexamples, showing assumption-sensitive selections and identifying what missing information would resolve them. Those features remain roadmap work.

## Thirty-second fallback pitch

BioScribe addresses ProvenanceLab with an inspectable molecular workflow: precise input diagnostics, explicit missing-evidence states, frozen references and replayable results. Its Experiment Challenges deliberately perturb saved runs, including changing a number and rebuilding its checksum, to check whether fresh computation catches the discrepancy. It is a working educational prototype with recorded software checks. Biological prediction and student benefit remain unvalidated.
