# Draft 0.3 verification record

Scope: local design-document, metadata-correspondence and preflight checks. No empirical dataset was acquired, candidate/QED ranking computed, assay outcome inspected, confidence bound calculated or power result obtained. No application implementation, accepted schema or dependency lock was changed. The earlier 173 backend, 25 client and 45 Phase 4 software checks were **not rerun** and are not reported as new passes.

## Observed results

- Qualification preflight: **exit 2**, `blocked`, `scientific_assessment=not_assessed`, zero checked study artifacts. The unresolved fields are artifacts, dataset, domain, interval specifications within primary gates, required disjoint groups, review, sampling and split strategy.
- Prior ledgers: **78/78 Phase 3**, **15/15 Phase 4**, **18/18 preparation**, and **12/12 draft 0.2** file hashes match, including prior code, locks, schemas and evidence files covered by those ledgers.
- Both prior confidence-bound gate arrays are unchanged in the corresponding 0.3 documents. Candidate definition, method metadata, numerical endpoint cutoffs, tie-break, appointments and custody are preserved. The new operational point comparisons explicitly cannot qualify the candidate.
- Both retained PubChem metadata objects still identify AID 1030/version 2/revision 1, with matching raw hashes and no result-row `data` key in the description containers. The adopted version matches those returned objects. This check does not authenticate any future outcome release.
- P00352 sequence version 2 and AAP35567.1 still match at 501 residues. Experimental construct evidence remains absent.
- All report-template counts, exact metrics, observed confidence bounds and evidence receipts remain null; its status is `not_run`, qualification is `not_assessed`/unmet, and release remains blocked.

`amendment-checks.json` records the offline checks below. These are document/metadata integrity checks, not additional application tests or empirical scientific validation. They establish no protected custody, independent authorship, trusted timestamp, population independence or biological truth. Assertions about this work's lack of outcome acquisition are activity disclosures; local hashes cannot prove all historical developer exposure.

## Exact reproduction commands

Run in PowerShell from `E:/Bioscribe/CascadeProjects/windsurf-project` using the existing locked Python environment. Qualification preflight:

```powershell
& .phase3-clean/Scripts/python.exe -B -m validation.phase4.preflight validation/studies/BS-RANK-001/design-v0.3/protocol.draft.json --bundle-root validation/studies/BS-RANK-001/design-v0.3
exit $LASTEXITCODE
```

Expected exit **2**. The saved `preflight-result.json` is the stdout from that module invocation. It remains blocked intentionally; the schema was not changed to accept descriptive-only plans or fictional sampling data.

Offline baseline and amendment checks (read-only; exit **0** expected):

```powershell
@'
from pathlib import Path
import hashlib
import json

root = Path.cwd()
study = root / 'validation/studies/BS-RANK-001'
old, new = study / 'design-v0.2', study / 'design-v0.3'
load = lambda p: json.loads(p.read_bytes())
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
checks = []
for ledger_path, base, expected in [
    ('docs/PHASE_3_VERIFICATION.json', '.', 78),
    ('docs/PHASE_4_VERIFICATION.json', '.', 15),
    ('validation/studies/BS-RANK-001/preparation-verification.json', 'validation/studies/BS-RANK-001', 18),
    ('validation/studies/BS-RANK-001/design-v0.2/verification.json', 'validation/studies/BS-RANK-001/design-v0.2', 12),
]:
    ledger = load(root / ledger_path)
    bad = [name for name, sha in ledger['file_sha256'].items()
           if not (root / base / name).is_file() or digest(root / base / name) != sha]
    assert len(ledger['file_sha256']) == expected and not bad, (ledger_path, bad)
    checks.append({'ledger': ledger_path, 'ledger_sha256': digest(root / ledger_path),
                   'checked': expected, 'mismatches': bad})

d0, d = load(old / 'design-decisions.json'), load(new / 'design-decisions.json')
p0, p = load(old / 'protocol.draft.json'), load(new / 'protocol.draft.json')
t = load(new / 'descriptive-report.template.json')
f = load(new / 'preflight-result.json')
assert d['design_version'] == p['protocol_version'] == t['design_version'] == '0.3'
assert d['co_primary_gates'] == d0['co_primary_gates']
assert p['primary_gates'] == p0['primary_gates']
assert [(g['threshold'], g['confidence_level'], g['bound']) for g in d['co_primary_gates']] == [(0.05, 0.95, 'one_sided_lower'), (2.0, 0.95, 'one_sided_lower')]
for key in ['candidate', 'tie_break', 'appointments', 'custody', 'target']:
    assert d[key] == d0[key], key
assert p['method'] == p0['method']
assert d['endpoint']['ac50_max_micromolar'] == d0['endpoint']['ac50_max_micromolar'] == 10.0
assert d['endpoint']['maximum_inhibition_min_percent'] == d0['endpoint']['maximum_inhibition_min_percent'] == 50.0
assert d['decision']['selection_budget'] == t['selections']['budget_each'] == 100
assert d['decision']['initial_evaluation'] == 'descriptive_fixed_library_replay'
assert d['supersedes']['prior_design_sha256'] == digest(old / 'design-decisions.json')
assert digest(new / d['qed_comparator']['source_file']) == d['qed_comparator']['source_sha256']

refs = old / 'references'
for ref in d['assay']['description_sources']:
    path = new / ref['path']
    assert digest(path) == ref['sha256'] == 'fd6fbc1c65c0957b1a737d33c1fa8e6bf89e81eaf103437ac53d64bb1902e2c9'
    containers = load(path)['PC_AssayContainer']
    assert len(containers) == 1 and all('data' not in c for c in containers)
    descr = containers[0]['assay']['descr']
    assert descr['aid'] == {'id': 1030, 'version': d['assay']['adopted_version']}
    assert descr['revision'] == d['assay']['adopted_revision']
assert (d['assay']['adopted_version'], d['assay']['adopted_revision']) == (2, 1)
assert d['assay']['raw_outcome_release_identity'] is None
assert d['assay']['prior_request']['authenticated'] is False
assert d['target']['experimental_construct_identity'] is None
u = load(refs / 'uniprot-P00352.json')
lines = (refs / 'NCBI-AAP35567.1.fasta').read_text().splitlines()
seq = u['sequence']['value']
assert lines[0].startswith('>AAP35567.1') and ''.join(lines[1:]) == seq
assert len(seq) == 501 and u['entryAudit']['sequenceVersion'] == 2
assert hashlib.sha256(seq.encode()).hexdigest() == d['target']['reference_sequence_sha256']

assert d['descriptive_replay']['upgrades_qualification'] is False
assert d['inference']['mandatory_scaffold_cluster_method'] is False
for key in ['inferential_population', 'estimand', 'sampling_or_measurement_model', 'independent_units_and_dependence', 'interval_method', 'method_calibration', 'minimum_independent_units', 'sample_size', 'power_target', 'power_justification', 'coverage_threshold', 'subgroup_definitions_and_thresholds', 'multiplicity_policy']:
    assert d['inference'][key] is None, key
assert all(v is None for v in d['inference']['lower_confidence_bounds'].values())
assert t['execution_status'] == 'not_run'
assert all(v is None for v in t['counts'].values())
assert all(v is None for v in t['provenance'].values())
assert all(v is None for v in t['population_and_coverage'].values())
assert all(v is None for k, v in t['selections'].items() if k != 'budget_each')
for metric in t['exact_conditional_metrics'].values():
    assert metric == {'numerator': None, 'denominator': None, 'display_decimal': None, 'status': 'not_run'}
assert t['operational_point_comparisons'] == d['descriptive_replay']['operational_point_comparisons']
assert [x['threshold'] for x in t['operational_point_comparisons']] == [0.05, 2.0]
assert all(x['status'] == 'not_run' and x['qualifies_candidate'] is False for x in t['operational_point_comparisons'])
q = t['inferential_qualification']
assert q['status'] == 'not_assessed' and q['gate_status'] == 'unmet'
assert q['point_comparisons_can_satisfy_gates'] is False
assert len(q['gates']) == len(d['co_primary_gates']) == 2
for actual, original in zip(q['gates'], d['co_primary_gates']):
    assert all(actual[k] == v for k, v in original.items())
    assert actual['observed_lower_bound'] is None and actual['assessment_status'] == 'not_assessed' and actual['gate_status'] == 'unmet'
for key in ['dataset', 'sampling', 'domain', 'split_strategy_and_rationale', 'artifacts', 'review']:
    assert p[key] is None, key
for key in ['protocol_freeze', 'confirmatory_label_access', 'descriptive_outcome_access', 'confirmatory_evaluation', 'scientific_release', 'sensitive_intake', 'deployment']:
    assert d[key] == 'blocked', key
assert d['trusted_freeze_claim'] is False and d['preregistration_receipt'] is None
assert all(d['data'][k] is False for k in ['empirical_dataset_frozen', 'test_outcome_rows_accessed', 'candidate_scores_computed', 'descriptive_replay_performed'])
assert f['status'] == 'blocked' and f['scientific_assessment'] == 'not_assessed' and f['checked_artifacts'] == 0
assert f['issues'] == ['invalid_protocol:' + field for field in ['artifacts', 'dataset', 'domain', 'primary_gates', 'required_disjoint_group_keys', 'review', 'sampling', 'split_strategy_and_rationale']]
print(json.dumps({'scope': 'offline design and metadata correspondence only', 'baseline_checks': checks, 'qualification_gates_preserved': True, 'metadata_identity': 'AID1030/version2/revision1', 'raw_outcome_version_verified': False, 'reference_sequences_equal': True, 'experimental_construct_verified': False, 'template_unpopulated': True, 'inferential_model_unassigned': True, 'preflight_status': f['status'], 'scientific_assessment': 'not_assessed'}, indent=2))
'@ | & .phase3-clean/Scripts/python.exe -B -
exit $LASTEXITCODE
```

The output is retained as `amendment-checks.json`. These checks assert the stated blocked design state; they do not implement a study evaluator or prove future enforcement by one.

To verify the new artifact ledger after delivery (exit **0** expected):

```powershell
@'
from pathlib import Path
import hashlib
import json
p = Path('validation/studies/BS-RANK-001/design-v0.3')
ledger = json.loads((p / 'verification.json').read_bytes())
bad = [name for name, sha in ledger['file_sha256'].items()
       if not (p / name).is_file() or hashlib.sha256((p / name).read_bytes()).hexdigest() != sha]
assert not bad, bad
print(len(ledger['file_sha256']), 'draft 0.3 file hashes match')
'@ | & .phase3-clean/Scripts/python.exe -B -
exit $LASTEXITCODE
```

The ledger does not hash itself. Hash matching establishes local byte correspondence only. All custody, appointment, label mapping, dataset suitability, experimental construct, inference, freeze, preregistration, evaluation, release, sensitive-intake and previously declared deployment gates remain unresolved or blocked as detailed in the protocol.
