# Evidence Assistant - first implementation

This extension is a research aid, not a prediction of efficacy or safety. It is the first bounded implementation of the requested Phase 2 extension, not a claim that the full scientific acceptance criteria have been met.

Open `/evidence-assistant` through Workbench > Evidence Assistant. The existing light violet frontend is retained. A labelled recorded example works without a token. Fresh reviews use the existing local token, require a public-input declaration, and persist owner-scoped records in the same local SQLite database under a separate table.

## Implemented flow

1. Receive up to 8,000 characters and retain the exact input with a request hash.
2. Split sentences, newlines and semicolons into source spans, with a limit of 16. Retain conjunction context for review: a qualified compound such as an exact record proposition followed by “but this is not true” cannot become a supported prefix. Semantic completeness is unverified; unsupported/ambiguous fragments abstain rather than silently becoming interpreted facts.
3. Parse the bounded source-record syntax. Example: `CHEMBL113 in activity 189032 has Ki = 26000 nM.`
4. Look up the specific frozen record, check molecule/endpoint identity, compare units using decimal arithmetic and apply publication/quality eligibility rules.
5. Return supported, contradicted, insufficient_evidence or out_of_scope with a specific record citation and a separate persisted assessment trace. The trace supports the explanation of abstention/scope, not a biological conclusion.
6. Show different numerical assay observations grouped by molecule, target, organism and endpoint. Conditions and sources remain visible; values are not pooled and assay differences are not automatically a biological contradiction.
7. Export the cited review. Source hashes, input hash, corpus hash, source spans, review ID, method basis, missing confidence and the research-aid label are retained.

Computed-run propositions use the separate syntax `<molecule name> in run <32-character ID> has <descriptor> = <value> <units>`. A computed property can support only that computation-record statement. Broad activity, efficacy, safety and dose claims cannot become supported through descriptors.

## Source collection

`backend/evidence_assistant/sources/` contains 40 public ChEMBL activity records and 18 computed fields from a previously recorded, replay-checked BioScribe example. The assay collection is deliberately small. Twenty-three publication IDs received Europe PMC MED metadata checks. Three activity records have unresolved publication status and are ineligible for decisive decisions. None of this establishes universal retraction coverage.

Retraction notices, retracted-publication flags and expressions of concern are excluded. Unknown status and publication checks older than 30 days also abstain. The receipt's provider, query, identifier, relevant publication metadata and as-of timestamp are stored with each source record. Rechecking source flags requires an explicit new versioned snapshot. Existing historical reviews retain their original as-of interpretation.

Specific record citations include IDs, source URL, JSON locator, a normalized factual excerpt and SHA-256. The raw snapshots are normalized JSON records with retrieval metadata, not an assertion that HTTP response bytes were preserved unchanged. A source hash is not authenticated authorship. Clicking an external source URL retrieves its current version; the saved excerpt/hash describe the frozen version.

Arbitrary paper-passage entailment is not enabled in this first version. The contract reserves a passage citation type, but no LLM-generated paper claim can promote itself into decisive evidence. Scientific reading and passage adjudication remain a next development gate.

## Model

The selected open model is Qwen3-4B-Instruct-2507 (4.0B parameters, Apache-2.0). The 2.50 GB Q4_K_M quantization is pinned to an immutable repository revision and exact weight hash. `hackathon/prepare_evidence_model.py` downloads it to ignored `.local` storage and records the runtime archive hash. `hackathon/start-evidence-model.ps1` verifies the model hash and starts llama.cpp on loopback port 8091, preserving any occupied service.

The application never sends claims to a hosted model. The local adapter has a context and output limit, timeout, strict JSON parsing and source-ID/span checks. Unavailable inference is explicit. Model statement suggestions are candidates, not scientific findings, and do not override the deterministic evidence checks. The retrieval-plus-LLM baseline uses the same model/corpus/retriever and a frozen safety-aware prompt. The expected model identity is a configured local installation receipt, not remote attestation.

The native model gateway requires a separate local API key read by the backend adapter. Its web UI is disabled, CORS is limited to the configured local frontend origin, and credentials are stored only under ignored `.local` storage. The live gateway check records rejection of an unauthenticated request and the tested unrelated origin. These local controls do not constitute sensitive-data or deployment approval.

## Contracts and persistence

- `backend/evidence_assistant/schemas.py`: authoritative request, citation, statement and review schemas.
- `corpus.py`, `freeze_sources.py`: snapshot integrity, source correspondence and publication-state eligibility.
- `engine.py`: splitting, bounded parsing, comparison, abstention and cross-assay display data.
- `storage.py`, `routes.py`: existing actor authentication, owner-scope, idempotency, input/output binding and exports.
- `model.py`, `model_card.json`: pinned local model adapter and baseline prompt.
- `bioscribe-ai/src/lib/phase3/assistant.ts`: schema and semantic decoding; rejects invalid evidence before display.
- `Phase3EvidenceAssistant.tsx`: input, per-statement verdicts, citations, disagreements, explicit model status and export.

API routes: GET `/assistant/capabilities`, POST `/assistant/reviews`, GET `/assistant/reviews/{id}`, GET `/assistant/reviews/{id}/export`, GET `/assistant/schema`. Review/capability routes require the existing bearer credential. A failed or interrupted review remains explicit. Two synchronous reviews may run concurrently. Stale in-progress reviews fail after 150 seconds on subsequent access; this version does not transparently resume interrupted model work. Output is capped at 500 KB.

Application model suggestions retain a 90-second inference timeout. The separate evaluation CLI permits only 90 or 180 seconds, records the chosen budget and elapsed time, and saves partial prediction progress. Five baseline calls timed out at the original 90-second CPU budget. They remain recorded failures. Any longer-budget smoke result has its own receipt and cannot replace those failures or establish the 150-claim comparison.

The separate one-claim 180-second rehearsal returned a valid model output with substantial prompt-cache reuse. This confirms the inference/output/reporting path under that observed state. Cold-start baseline latency and a complete 150-claim comparison remain unresolved.

The generated browser schema and recorded example are produced by `hackathon/build_evidence_assistant.py`. Python/frontend dependencies were not changed; the optional native inference runtime is tracked separately to preserve existing molecular replay locks. The Docker source composition includes the new module; a new container run is not implied by the Windows checks.

## Acceptance status

| Requirement | Current implementation | Remaining gate |
| --- | --- | --- |
| Split claims into statements | Source-span-preserving bounded splitting and optional unverified model suggestions | Robust arbitrary scientific clause decomposition and semantic completeness need adjudicated evaluation. |
| Four verdicts | Implemented in backend, schema, UI and export | General evidence entailment beyond exact record propositions is not established. |
| Cite every verdict | Direct source citations for decisive record comparisons; review trace and retrieved context for abstentions/scope | Review traces must not be mistaken for biological source support; arbitrary paper passage checking is not implemented. |
| No activity from descriptors | Enforced by parsing, category and citation-kind constraints; broad activity abstains | Broader validated activity reasoning remains absent. |
| Exclude retracted papers | Snapshot flags, concern/unknown/stale gates and fixture checks | Independent publication-status audit and genuine retraction challenge cases remain open. |
| Show assay disagreements | Differing values and contexts shown separately with citations | No inference of a pooled effect or statistical incompatibility. |
| Abstain on weak evidence | Implemented for missing, unsupported, stale, flagged and mismatched evidence | Threshold/calibration decisions for more complex evidence require data. |
| Report accuracy by confidence | Evaluator has fixed bins, sample counts, null empty bins and missing-model handling | Rule confidence is null; model self-report is uncalibrated. Independent reviewed accuracy is not established. |
| Beat retrieval + LLM on 150 claims with <=8B | Pinned 4B adapter, frozen baseline prompt and 150-row provisional set implemented | Independently adjudicated labels, source-group split, calibrated thresholds and complete fair comparison are required; no win claimed. |
| Research-aid label everywhere | API, page, every stored/exported review and recorded demo | No efficacy/safety prediction is enabled. |

## Verification commands

```powershell
# From backend
& ../.phase3-venv/Scripts/python.exe -B -m pytest tests_phase3 tests_lab tests_assistant -q -p no:cacheprovider --junitxml=../docs/evidence-assistant-all-backend-tests.xml
# From bioscribe-ai
node scripts/evidence-assistant-check.cjs
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
# From repository root
& ./.phase3-venv/Scripts/python.exe -B -m validation.evidence_assistant.evaluate
```

Test and runtime results are recorded separately in `EVIDENCE_ASSISTANT_VERIFICATION.json` when the iteration is complete. The provisional evaluator is not a scientific validation pass. The existing ALDH1A1 study, sensitive-data and production-deployment gates remain blocked.

For a short rehearsal see [the demo guide](EVIDENCE_ASSISTANT_DEMO.md). The supplied external benchmark recommendation was checked against primary sources in [the source assessment](../validation/evidence_assistant/EXTERNAL_BENCHMARK_REVIEW.md). The blank independent-review forms are described in [the review guide](../validation/evidence_assistant/REVIEW_GUIDE.md); they contain no completed reviews or inferred appointments.

## References

- Model parameter count/licence: https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507
- ChEMBL activity/assay web services: https://chembl.gitbook.io/chembl-interface-documentation/web-services/chembl-data-web-services
- ChEMBL data-quality/units guidance: https://chembl.gitbook.io/chembl-interface-documentation/frequently-asked-questions/chembl-data-questions
- NLM retraction/publication-type policy: https://www.nlm.nih.gov/bsd/policy/errata.html
- Local inference runtime: https://github.com/ggml-org/llama.cpp
