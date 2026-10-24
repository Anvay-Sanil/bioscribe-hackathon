# Evidence Assistant evaluation - provisional design 0.1

Status: draft, not frozen or preregistered. The user explicitly requested a new 150-claim set that remains provisional until independently reviewed. No claim of beating a baseline is authorised by the draft labels.

## Task and scope

The first implementation checks *what a particular source record reports*. It can compare a named ChEMBL molecule, activity ID, endpoint, numerical relation and concentration unit; it can separately compare a named molecule's computed field in a specific saved BioScribe run. It abstains on broader biological activity, unresolved language and missing/weak evidence. Efficacy, clinical safety and dosing are out of scope.

Every statement receives one of supported, contradicted, insufficient_evidence or out_of_scope. Decisive verdicts require an eligible direct record. An abstention has a persisted review trace documenting its source collection, retrieved IDs and reason; that trace is not proof of biological absence. Computed fields cannot establish activity.

## Dataset

See [the external benchmark source assessment](EXTERNAL_BENCHMARK_REVIEW.md) for the supplied CIViC-Fact, SciFact, SciClaimHunt, SMA Evidence Graph, WithdrarXiv and HallOumi recommendation. No external release or published leaderboard score has been substituted for this draft or its comparator.

`claims.jsonl` contains 150 candidate claims. `proposed_labels.jsonl` contains separate suggested labels, rationale categories and source IDs. `manifest.json` binds both to the frozen source collection. The 30 source activity records originate from 19 publication groups. Each record yields five related statements. These dependent templates are development challenges, not 150 independent biological examples.

Current label counts: 30 supported, 30 contradicted, 60 insufficient evidence, 30 out of scope. The proposed labels were authored after implementation and are not an unbiased holdout. The implementation's agreement with those labels must never be advertised as independently demonstrated accuracy.

Required before qualification:

1. Two named reviewers independently adjudicate statement meaning, label, exact evidence span/record, molecular identity, endpoint, assay context and uncertainty; reconcile disagreements with recorded reasons.
2. Expand or replace the template-heavy set with naturally occurring claims, compound sentences, paraphrases, near-miss identities, null/weak evidence, conflicting assays, genuine retraction cases, unsupported clinical inference and paper passages. The current 150-row draft has no real retracted-paper or arbitrary-paper-entailment cases.
3. Define a source/publication/molecule grouping policy and allocate development/calibration and held-out evaluation groups before outcomes are evaluated. The present split is unassigned.
4. Review retraction receipts against an agreed publication-status source and freeze its as-of date. “Not flagged in this snapshot” is not a universal no-retraction guarantee.
5. Freeze the exact claim set, labels, corpus, model weights and quantization, prompt, retriever, code, token budget, decoding settings, threshold policy and evaluation command before confirmatory use. Keep developer exposure documented.

## Comparators

Baseline: the same frozen corpus and lexical retriever, followed by Qwen3-4B-Instruct-2507 at temperature 0, seed 1337 and a bounded context/output. Model source card, 4.0B parameter count, quantization revision and weight SHA-256 are in `backend/evidence_assistant/model_card.json`. The selected quantization is Q4_K_M. Local model self-reported confidence is uncalibrated.

The baseline prompt explicitly tells the model not to infer activity from descriptors, to abstain without adequate evidence, respect units and assay context, and exclude problematic publication records. It is not deliberately weakened by removing these instructions. Its output must satisfy the same verdict set and source-ID whitelist. Missing/invalid model responses are recorded as failures, not silently scored as correct abstentions.

Current BioScribe method: span-preserving splitting plus exact-record identity/endpoint/unit checks, eligibility rules and explicit abstention. Optional model suggestions remain unverified and do not determine verdicts. Thus the present comparison would test structured verification against a retrieval-plus-LLM answer, not prove broad natural-language scientific reasoning or a trained predictive model.

## Report and prospective acceptance proposal

Report four-class macro-F1, per-class precision/recall, full confusion matrix, exact label accuracy, decisive coverage, accuracy among decisive verdicts, false-supported count, citation validity, source retrieval recall, retraction-exclusion errors and decomposition/span completeness. The implemented evaluator currently covers the label/confusion/coverage/false-support metrics and confidence bins; expert citation-entailment and semantic-completeness metrics remain manual/unimplemented gates.

Report model accuracy by fixed confidence bins [0,.5), [.5,.7), [.7,.85), [.85,.95), [.95,1]. Include counts and missing predictions. A bin with no samples has null accuracy. Rule-based verdict confidence is null until a justified calibration scheme is evaluated; it is not set to 1 because arithmetic is deterministic. Do not describe self-reported scores as calibrated probabilities. Calibration and inferential intervals require an independent reviewed set and defensible grouping/population assumptions.

The report exposes both accuracy among valid returned verdicts and `accuracy_all_expected`, whose denominator includes all expected claims and whose numerator excludes missing/invalid responses. Always report the completion count with either metric. Nonfinite, Boolean, missing and out-of-range confidence values are unscored. Confidence bins cover only valid returned verdicts with valid confidence; they cannot hide unavailable responses from the overall denominator.

Proposed criterion for reviewer agreement before freeze: a complete, same-budget held-out run; positive paired macro-F1 difference with a source-group-aware lower confidence bound above zero; no increase in false-supported decisions; no clinically unsafe support; no support using retracted evidence; and reported decisive coverage and evidence quality. The numerical coverage/safety margins, inferential procedure, multiplicity policy and sufficient sample-size justification are still unassigned. A “win” is therefore not currently assessable.

The evaluator always emits `qualification: not_assessed` and `baseline_beaten: null` in this draft. A partial run, a draft-label score or a successful software test cannot close the qualification gate.

## Commands

From the repository root using the existing locked Python environment:

```powershell
& .\.phase3-venv\Scripts\python.exe -B -m validation.evidence_assistant.evaluate
```

This produces a descriptive rule-engine report against the provisional labels and an explicit not-run baseline. With the pinned local model server ready:

```powershell
& .\.phase3-venv\Scripts\python.exe -B -m validation.evidence_assistant.evaluate --run-baseline --limit 5 --output docs/evidence-assistant-baseline-smoke.json
```

The five-row command is an inference smoke check, not the 150-claim comparison. Use `--limit 150` only for a deliberately recorded full exploratory run; it still cannot establish qualification before the review and freeze gates above. Never edit labels or tune the prompt based on held-out failures and then report the same set as independent.

The original five-claim CPU rehearsal reached the 90-second timeout for all five model calls; these are failed/missing outputs, never correct abstentions. Its receipt is preserved as `docs/evidence-assistant-baseline-smoke.json`. The CLI also permits an explicit bounded 180-second budget via `--model-timeout-seconds 180`; application suggestion requests retain 90 seconds. This is an operational development amendment before any qualified evaluation, with no change to labels, evidence, prompt or weight selection. A one-claim longer-budget smoke test is separate from a full comparison. Freeze one common computational budget for any future comparative study.

New CLI runs record input, context and execution-code hashes, per-call elapsed time, requested count and timeout. They save a partial progress file after each attempted model call. An existing baseline report path is preserved rather than overwritten. Attempted-subset metrics are reported separately so a partial baseline cannot be compared silently with all 150 rule outputs.

The separate 180-second one-claim rehearsal returned one valid prediction (`docs/evidence-assistant-baseline-long-context-smoke.json`). The runtime reported substantial cached prompt tokens; it is a warm-cache inference check, not proof of acceptable cold-start latency, throughput or benchmark performance. Confidence-bin counts are descriptive against an unreviewed proposed label, not calibrated accuracy. The five failures remain in their original receipt.
