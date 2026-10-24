# Design draft 0.2 verification

Scope: document/metadata verification only. No new application or preflight implementation, empirical evaluation, candidate/QED scoring, confidence interval, power calculation or scientific approval was performed. The previously accepted 173 backend, 25 client and 45 preflight software checks were not rerun or added to a new test count.

## Observed results

- Existing preflight returned **exit 2**, `status=blocked`, `scientific_assessment=not_assessed`; zero study artifacts were accepted. Missing requirements remain real nulls in the draft.
- **78/78 Phase 3**, **15/15 Phase 4**, and **18/18 earlier preparation** file hashes match their retained ledgers.
- P00352 reference sequence version 2 and AAP35567.1 match exactly at 501 residues; actual assay construct identity remains unverified.
- Both acquired PubChem descriptions declare **version 2, revision 1**, including the response to `?version=1.1`. Requested version 1.1 is **not verified**.
- The acquired PubChem payloads contain description containers and field definitions, not assay-outcome rows. No full assay record/result endpoint or LIT-PCBA archive was fetched.
- Local RDKit reports 2025.03.3; its QED source and mean-weight vector were inspected and retained. This is implementation identification, not a new QED validation result.

Initial shell network access failed at DNS resolution. The two bounded public-metadata acquisitions then succeeded with approved network access. Raw response hashes, retrieval times and URLs are preserved in `references/acquisition.json` and `references/acquisition-versioned.json`. The second filename explicitly identifies the requested/returned version mismatch. Neither local timestamps nor these hashes establish protected preregistration.

## Exact offline checks

Run from `E:/Bioscribe/CascadeProjects/windsurf-project` in PowerShell:

```powershell
& .phase3-clean/Scripts/python.exe -B -m validation.phase4.preflight validation/studies/BS-RANK-001/design-v0.2/protocol.draft.json --bundle-root validation/studies/BS-RANK-001/design-v0.2
exit $LASTEXITCODE
```

The final line propagates the Python process code when run in a shell command. Expected exit is 2, not 0.

Baseline and source-reference checks:

```powershell
@'
from pathlib import Path
import hashlib
import json

root = Path.cwd()
for ledger_path, base in [
    ('docs/PHASE_3_VERIFICATION.json', '.'),
    ('docs/PHASE_4_VERIFICATION.json', '.'),
    ('validation/studies/BS-RANK-001/preparation-verification.json', 'validation/studies/BS-RANK-001'),
]:
    ledger = json.loads((root / ledger_path).read_text())
    bad = [p for p, h in ledger['file_sha256'].items()
           if not (root / base / p).is_file()
           or hashlib.sha256((root / base / p).read_bytes()).hexdigest() != h]
    assert not bad, bad
    print(ledger_path, len(ledger['file_sha256']), 'matching hashes')

refs = root / 'validation/studies/BS-RANK-001/design-v0.2/references'
u = json.loads((refs / 'uniprot-P00352.json').read_bytes())
seq = u['sequence']['value']
lines = (refs / 'NCBI-AAP35567.1.fasta').read_text().splitlines()
assert lines[0].startswith('>AAP35567.1')
assert ''.join(lines[1:]) == seq and len(seq) == 501
assert u['entryAudit']['sequenceVersion'] == 2
assert hashlib.sha256(seq.encode()).hexdigest() == '3643038221afeedeeb244b74f19a4aba11f4c038262b9d8460260d2b476ded7f'
for filename in ['pubchem-AID1030-description.json', 'pubchem-requested-v1.1-returned-v2.1-description.json']:
    data = json.loads((refs / filename).read_bytes())
    assert all('data' not in c for c in data['PC_AssayContainer'])
    descr = data['PC_AssayContainer'][0]['assay']['descr']
    assert descr['aid'] == {'id': 1030, 'version': 2}
    assert descr['revision'] == 1
print('Reference sequences match; requested assay version remains unverified.')
'@ | & .phase3-clean/Scripts/python.exe -B -
```

Expected exit: 0. This verifies the **observed discrepancy**, not closure of the requested assay-version gate. `verification.json` binds this draft and its metadata evidence; it does not hash itself or certify authorship.
