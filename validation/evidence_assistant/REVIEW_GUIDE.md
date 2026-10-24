# Provisional claim review packet

Research aid, not a prediction of efficacy or safety. These forms do not establish qualification.

`review_packet/reviewer-A-blank.csv` and `reviewer-B-blank.csv` each contain all 150 candidate claims with blank verdict, rationale and evidence fields. They omit the proposed labels and system predictions. No reviewer has been appointed and no review has occurred. The parent dataset remains developer-exposed and cannot retrospectively become a protected holdout.

Each reviewer should work independently from the frozen records under `backend/evidence_assistant/sources/`. The `record_group` is a candidate source pointer, not a statement that the evidence supports the claim. Find the exact activity, molecule, endpoint, numerical relation, unit, assay context, original publication and publication-status receipt. A BioScribe computation record is evidence of its recorded computation only.

Enter one of `supported`, `contradicted`, `insufficient_evidence`, `out_of_scope`. Use an explicit source ID and JSON field locator or paper passage locator. Explain the verdict in the rationale. For abstention or scope, record the search boundary and missing context; absence in this small collection is not evidence of biological inactivity. Unknown or stale publication status prevents decisive use. Safety, dosing and clinical efficacy remain outside this implementation's scope.

Record the reviewer's accepted identity, UTC date, each context check and whether adjudication is needed. Reconcile label, citation and scope disagreements in a separate signed/adopted adjudication record preserving both original reviews. Never overwrite either independent form with a consensus result. The blank-form receipt describes the initial files; changed annotation files need new hashes and a review receipt.

Reviewing these forms can improve the development set. Qualification additionally requires natural-language and genuine retraction cases, a task-appropriate source-group split, leakage review, a frozen independent evaluation set, justified thresholds and a complete same-budget comparison. See `PROTOCOL_DRAFT.md` and `EXTERNAL_BENCHMARK_REVIEW.md`.
