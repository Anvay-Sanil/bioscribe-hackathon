# Architecture notes for technical slides

Supported application composition: `backend/bioscribe/api.py` installs both the existing `/v3` API and the `/lab` extension. The two contracts retain their own versions. The Lab's authoritative Python schema and engine excerpts are copied here for reference; they are not a runnable standalone project.

1. UI submits plain molecular strings and budget under `lab-1.0.0`.
2. Authentication and owner scope protect local job access.
3. SQLite persists the request with UUID run ID, idempotency, lease and retry state.
4. A bounded child process computes against local frozen records and pinned dependencies.
5. Evidence records carry method, units, availability, domain, coverage and assessment status.
6. Publication and retrieval bind the output to submitted input count/order/identity.
7. A replay package contains original request, result, source text, dependency lock and references. Uploaded source text is evidence only and is not executed.
8. Fresh replay requires the matching installed trusted bundle and compares the declared scientific payload hash.

Current Lab limits: 1–16 records, up to 2,048 characters each and 256 parsed atoms, 30-second worker computation bound, at most two attempts, queue bound 32. These are conservative workstation limits, not measured production capacity.

Distance heuristic: `abs(MW - 350)/350 + abs(TPSA - 75)/75`, dimensionless, ascending. QED comparator sorts descending. Current ties use original input hash then index. Neither ranking is validated for a target/assay. The audit documents representation-sensitive ties.

Example conformers use RDKit ETKDGv3 and UFF with a recorded seed. The current viewer selects matching precomputed examples, rather than generating all submitted molecules.

Selected files are supplied to explain the design. Paths referenced by copied historical documentation refer to the original repository unless a corresponding pack-relative file is listed in the claim ledger. The original repository is needed to execute scripts or tests.
