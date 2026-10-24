# BioScribe learning project

Build and explain a reliable local bioinformatics application using public or synthetic examples. This is the current educational scope, following the user's clarification that BioScribe is an independent project-based learning project.

You can write code, run local examples, debug, test and prepare a project demonstration without appointing an institutional research team. The appointments and protected holdout requirements remain prerequisites for the separate **BS-RANK-001 scientific qualification study**. Its accepted draft 0.3 and evidence records are preserved; its outcomes have not been accessed and the study is still blocked. No learning result qualifies that study or activates a prediction.

## First working exercise: molecular ranking replay

`replay.py` uses the existing strict SMILES parser and unchanged descriptor-distance heuristic. It computes molecular weight, TPSA and RDKit QED, chooses exactly the requested number of unique molecules, and compares the two selections using invented Boolean test labels. The JSON report links the original file, individual molecular inputs, canonical identities, method versions and environment. It includes exact integer numerators/denominators for its descriptive arithmetic.

**Every test label in this exercise is fabricated. No assay results or ALDH1A1 performance are represented.** `demo-input.json` contains 120 straight-chain alkane structures with lengths 1 through 120. A label is true when the chain length is divisible by seven. This deliberately artificial rule and unrealistic library exist only to exercise the code; the resulting metrics have no biological interpretation. They are not assay positives, model validation or evidence that either ranking is useful.

Run from `E:/Bioscribe/CascadeProjects/windsurf-project` in PowerShell, using the existing locked environment:

```powershell
& .phase3-clean/Scripts/python.exe -B -m learning.replay learning/demo-input.json
```

For an exported report:

```powershell
& .phase3-clean/Scripts/python.exe -B -m learning.replay learning/demo-input.json | Set-Content -Encoding utf8 learning/my-report.json
```

Exit 0 means the synthetic exercise completed. Exit 2 means rejected, incomplete, insufficient evidence or failed. Neither exit establishes scientific validity. A sample output from the verified run is in `demo-result.json`. Run IDs change between executions; selections and computed quantities remain deterministic for the same inputs and environment.

Run the exercise's tests:

```powershell
& .phase3-clean/Scripts/python.exe -B -m pytest learning/tests -q -p no:cacheprovider
```

This exercise adds no packages and does not start a server. It uses `backend/requirements-phase3.lock`. Run commands from the repository root so the local modules resolve. It accepts only the explicit synthetic-fixture schema; it has no network acquisition, real-assay importer or application publication route. The data-class declaration is not a tool for authenticating data origin: supply only invented test labels.

## What to learn by changing the example

1. Copy the input into your own learning file. Change the selection budget from 100 to 10 and compare the selected identities and exact denominators.
2. Change one `test_label` to `null`. Observe `insufficient_evidence`, unchanged input coverage and absent aggregate metrics. Unknown does not mean negative.
3. Replace a SMILES with `CCO C1OC1` or `*CC`. Observe explicit rejection of that molecular input and an incomplete replay, with no silent replacement.
4. Reverse the input order. The selected identities must remain the same. Change invented labels and verify that labels do not control selection order.
5. Explain why molecular descriptors, a hand-written ranking heuristic and experimental measurements are different kinds of evidence.

The supplied tests check these behaviors, canonical-identity duplicates, exact-budget ties, arithmetic, zero-positive enrichment, strict labels, input limits and sanitized failures. This demonstrates software behavior, not assay validity.

## Limits and interpretation

- At most 128 rows, 131,072 input bytes, 2,048 SMILES characters per molecule, 256 atoms per molecule and 8,000 atoms total. The existing API's separate 16-molecule submission limit is unchanged; this offline exercise scores one molecule at a time.
- The whole graph is retained under the accepted parser policy: no silent salt, charge, isotope, stereo or tautomer rewriting. Equivalent canonical structures are rejected as duplicates rather than counted twice.
- Rankings use full-precision scores, then a label-independent canonical-identity hash tie-break. The learning tie namespace is separate from BS-RANK-001. Ties never expand the budget.
- Missing labels, unsupported molecules or an insufficient library do not trigger imputation, separate comparison populations or silent reranking. A library with no positive test labels has undefined enrichment.
- There are no confidence intervals, scientific pass/fail thresholds or qualification decisions. All reports retain `scientific_assessment=not_assessed`, and scientific release and sensitive-data intake remain blocked.
- Local hashes and run IDs support debugging and reproducibility; they are not authenticated audit custody. The CLI has no hard wall-clock/memory isolation and is not a deployment-ready service.

## Next educational milestones

The first milestone is this runnable, tested offline example. Subsequent work can make it easier to explore in the local interface, add source-linked public-data import with honest missing-data handling, and prepare a project demonstration that explains the architecture, test evidence and limitations. Real public-data analyses would be exploratory, with documented label exposure; they would not be presented as blinded confirmatory validation. No actual assay outcomes are acquired by this milestone.

Keep the existing identity, parser, evidence-status and security checks. Unsupported affinity, toxicity, half-life and structure predictions stay unassessed. Local educational development can continue; scientific qualification, confidential/patient-data use and public/production deployment are not authorized by this scope clarification.
