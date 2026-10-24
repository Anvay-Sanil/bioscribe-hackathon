# Phase 4 offline review bundle

The [framework](../../docs/PHASE_4_VALIDATION_FRAMEWORK.md) defines the study pipeline and its unmet gates. This directory implements **protocol preflight only**, using Pydantic 2.11.7 and pytest 8.4.1 from the unchanged `backend/requirements-phase3.lock`. There is no new dependency or application integration.

- `contracts.py` generates `protocol.schema.json` and `split.schema.json`. Unknown fields are forbidden. The schemas describe proposed protocols and declared split membership; they accept no scientific approval or release state.
- `study.template.json` is intentionally incomplete and schema-invalid until a real study is designed. Null scientific choices cannot be defaulted or copied from synthetic tests.
- `dataset-manifest.template.json` and `evaluation-report.template.json` are worksheets, not enforced data/result schemas. Their nulls and empty collections are absence of evidence.
- `preflight.py` checks declarations, seven metadata-artifact hashes, and declared entity/group separation. Other referenced files are opaque. It does not calculate actual chemistry/homology clusters, check empirical label truth, validate threshold rationale, compute predictive statistics or authenticate reviews.
- Test fixtures are synthetic software probes only. Even the fixture that declares empirical provenance proves only that structural checks can pass; the declaration is not authenticated by this tool.

Run from the repository root:

```powershell
& .phase3-clean/Scripts/python.exe -B -m pytest validation/phase4/tests -q -p no:cacheprovider --junitxml=docs/phase4-verification.xml
& .phase3-clean/Scripts/python.exe -B -m validation.phase4.preflight validation/phase4/study.template.json --bundle-root validation/phase4
```

Exit 2 is expected for the supplied draft. Exit 0 for a complete bundle means only `structural_checks_passed_review_required`. Both paths retain `scientific_assessment=not_assessed`, `scientific_release=blocked` and `sensitive_intake=blocked`.

Each artifact reference is `{ "path": "relative/path", "sha256": "64 lowercase hex characters" }`, rooted at `--bundle-root`. Copy the actual frozen metadata into a separate study bundle; do not point to mutable live application files and assume they were preregistered. Absolute, parent-traversing, drive/stream and escaping resolved paths are refused. Limits: 1 MiB protocol, 32 MiB per artifact, 100,000 split rows. The tool is read-only and offline.

The split schema requires `dataset_id` and rows with unique `unit_id`, `entity_key`, `role` (`train`, `tune`, `calibration`, `external_test`, `challenge`) and a `groups` mapping. Define each grouping algorithm and cutoff in the protocol. Declared required groups cannot cross any split roles. `entity_key` is an equivalence key for leakage detection, not permission to merge scientifically distinct labels. Every study must disclose development membership; unknown training data is a substantive limitation, not a reason to invent rows.

The preflight deliberately does not authorize study execution or replace independent design, statistical, data-custody and deployment review. See the framework's P4-01 through P4-10 gates.
