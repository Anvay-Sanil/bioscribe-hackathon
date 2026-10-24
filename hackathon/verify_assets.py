"""Verify molecular identity, descriptor correspondence, geometry and asset hashes."""
import hashlib
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from bioscribe.compute import check_dependencies, chemistry, parse_supported_smiles
from bioscribe.identity import canonical, digest
from bioscribe.schemas import RunView
from rdkit import Chem

check_dependencies()
folder = ROOT / 'bioscribe-ai/public/hackathon'
run = RunView.model_validate_json((folder / 'example-run.json').read_text())
assert digest(canonical(run.artifact.model_dump())) == run.artifact_sha256
conformers = json.loads((folder / 'conformers.json').read_text())
checks = 1
for i, record in enumerate(conformers):
    identity, fields = chemistry(run.run_id, record['input_smiles'], i)
    assert identity == run.artifact.chemical_identities[i]
    assert fields == [f for f in run.artifact.outputs if f.field_id.startswith(f'molecule.{i}.')]
    assert identity.canonical_isomeric_smiles == record['canonical_isomeric_smiles']
    mol = Chem.MolFromMolBlock(record['molblock'], removeHs=True)
    original = parse_supported_smiles(record['input_smiles'])
    assert Chem.MolToSmiles(mol, isomericSmiles=False) == Chem.MolToSmiles(original, isomericSmiles=False)
    assert mol.GetConformer().Is3D()
    assert hashlib.sha256(record['molblock'].encode()).hexdigest() == record['molblock_sha256']
    checks += 6
manifest = json.loads((ROOT / 'hackathon/assets-manifest.json').read_text())
for name, expected in manifest['files'].items():
    assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected
    checks += 1
print(json.dumps({'status':'passed','assertions':checks,'molecules':len(conformers),'scientific_assessment':'not_assessed'}))
