# Phase 3 Sentinel corrections — resubmission

16 October 2026, Asia/Calcutta. This record responds to R1–R3 in the unchanged
[Sentinel review](PHASE_3_SENTINEL_REVIEW.md). Scientific release, sensitive-data
intake and the previously declared deployment gates remain blocked. No predictive
evaluation or compliance determination is claimed.

## R1 — Persisted request binds the ordered molecular batch

`backend/bioscribe/store.py::assert_artifact_request_binding` compares the full
parsed input identity and canonical request hash against the durable request, then
compares the ordered list of chemical input hashes with hashes of the submitted
SMILES strings. List comparison retains multiplicity: deliberately repeated
molecules are accepted, while replacement, insertion, deletion and reordering are
rejected.

The check runs inside the fenced publication transaction before any success,
artifact or provenance is committed. It also runs when retrieving stored successful
artifacts, including through export, audit and provenance routes. Recomputed output
checksums cannot bypass the request comparison. A rejected read does not modify
the stored evidence. `worker.py` records a sanitized failed state after a rejected
publication, using the same attempt fence, and can process the next job.

Regression evidence: `tests_phase3/test_sentinel_binding.py` includes the exact
ethanol-submission/benzene-artifact construction, seven ordered-batch mutations at
publication and retrieval, valid and duplicate batches, full input identity
replacement, continued worker operation, and rejection without rewriting obsolete
method artifacts. API and export assertions are included.

## R2 — Plain SMILES and concrete graph policy precede calculations

`backend/bioscribe/compute.py::parse_supported_smiles` rejects empty, non-ASCII,
whitespace/control-containing inputs without trimming or repair. It explicitly
sets `parseName=False`, `allowCXSMILES=False`, `sanitize=True`, and `removeHs=True`.
It then requires a nonempty graph within the existing atom limit, with no atomic
number zero, query atoms or query bonds. Native parser diagnostics and exceptions
cannot echo submitted strings into the response or logs.

This closes the trailing-name interpretation documented by
[RDKit](https://www.rdkit.org/docs/RDKit_Book.html#reading-molecule-names). The
documentation is an algorithm reference; execution was checked against the locked
RDKit 2025.3.3 installation, not an assumed version of the current documentation.

Unsupported inputs retain their original input hash, return `unsupported_input`,
and carry null assessments. They have no descriptor/heuristic numbers and no
completed zero-match scan. Valid salts, formal charge, isotope labels and
specified/unspecified stereochemistry remain under the declared preservation
policy. Eligibility for these calculations is not a validated predictive domain.
The workbench submits each nonempty SMILES line without trimming it and displays
the narrower policy.

The policy is `plain_smiles_concrete_graph/1.1.0`; descriptor, structural-alert and
heuristic method records are version **1.1.0**. Their generated frontend method
records and persisted provenance identify the new policy. The IO schema shape and
contract version remain **3.0.0**; no payload migration is required.

Regression evidence: `tests_phase3/test_sentinel_molecules.py` tests the reported
counterexamples, names, CXSMILES, whitespace-separated structures, dummy/query
graphs, empty/invalid graphs, size limits, explicit parser parameters, exception
sanitization, retained supported chemistry and a persisted mixed-input run. Query
bonds are also tested on a graph with concrete atoms to exercise that guard
independently. Existing zero/positive/failed alert-scan checks remain in the suite.

## R3 — Numerical correlation is independent of enrichment ordering

`backend/bioscribe/metrics.py` now computes Pearson and Spearman on the original
prediction and label vectors. `ranking_direction` controls enrichment ordering
only. The previous `direction` argument remains a compatibility alias; conflicting
declarations fail explicitly. Every metric, including an undefined or
insufficient-evidence metric, records `ranking_direction`,
`correlation_basis=original_prediction_and_label_values`, and definition version
`descriptive_metrics/1.1.0`.

The ordinary numerical correlation definition follows the
[Pearson reference](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html).
Matching `[1,2,3] nM` Kd vectors return Pearson/Spearman **+1** and RMSE **0** for
either ranking direction; inverse vectors return **−1**. Enrichment still changes
with the declared order. Ties, constants, insufficient pairs and the existing
boundary-tie policy remain covered in `tests_phase3/test_metrics.py`.

## Verification and historical evidence

The integrated targeted run passed **70 tests** in **11.78 seconds**, with one
Starlette/AnyIO deprecation warning. The full backend suite passed **173 tests** in
**35.88 seconds**, zero failures/errors/skips and the same warning. These counts
overlap and must not be added. The review's 27 isolated snippet checks are not
included in these counts. The live API/worker startup, computation, export and
restart test passed after the corrections. Lint, type checking and the production
frontend build passed; the client decoder passed **25 checks**, including refusal
of obsolete molecular method versions. Generated artifacts reproduce byte-for-byte.
The final browser run verified malformed/dummy/padded-input abstention, valid
ethanol/isotope descriptors, unchanged submitted lines, persisted/export equality,
reload/re-authentication and obsolete-artifact refusal. The synthetic fixture
services were shut down after verification. Exact commands and results are recorded
in [the current ledger](PHASE_3_VERIFICATION.json).

The original counterexamples were also rerun directly after integration; their
concrete outputs are retained in [the probe record](phase3-sentinel-probes.json).
Wrong-compound publication is rejected, all three malformed/dummy examples are
unsupported, and identical Kd vectors give correlations +1 and RMSE 0 under both
ranking directions, while enrichment changes from 0 to 3 as expected for that
synthetic activity-label fixture.

Both dependency locks are unchanged from the first submission. The existing clean
Python environment passes `pip check`. Prior clean-install evidence remains
historical evidence for those same locks; it is not described as a new installation.

Original submission reports, example run, startup record and test results are
copied under `docs/phase3-history/submission-1/`. The earlier browser export and
screenshot retain their original identity. No historical database or artifact is
rewritten to claim the new policy. Existing molecular artifacts carrying method
1.0.0 are rejected by the current API/client contract (`artifact_contract_failure`
at retrieval); a new run is required for the 1.1.0 policy. This is fail-closed
version handling, not retrospective scientific validation or a claim that the
earlier run was recomputed.

Independent live checkpoint integration/administration, operational privacy
controls, complete resource qualification, Linux/container verification and
endpoint-specific scientific validation remain open exactly as previously
declared. This resubmission requests review of the corrected implementation;
passing software checks does not clear those gates.
