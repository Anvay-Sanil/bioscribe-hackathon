"""Source concordance, independent formula arithmetic, and representation invariance."""
from decimal import Decimal, ROUND_HALF_EVEN
import importlib.metadata
import json
from pathlib import Path
import random
import pytest
from rdkit import Chem
from bioscribe.compute import chemistry
from bioscribe.schemas import parse_artifact
from provenance_lab.engine import analyze, verify

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize('budget', [1, 2, 5])
def test_shortlist_identities_survive_seeded_random_smiles_and_shuffling(budget):
    inputs = ['C[C@H](N)C(=O)O', 'C[C@@H](N)C(=O)O', 'CCO', 'c1ccccc1',
              'CC(=O)Oc1ccccc1C(=O)O', 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
              'C[C@H](O)C(=O)O', 'C[C@@H](O)C(=O)O']
    original = analyze({'molecules': inputs, 'budget': budget})
    def selected(result, which):
        return [result.rows[i].identity_sha256 for i in getattr(result.ranking, which)]
    expected = [selected(original, which) for which in ('heuristic_selection', 'qed_selection')]
    assert original.ranking.tie_break == 'identity_sha256_then_index'
    for seed in range(1, 25):
        alternate = [Chem.MolToRandomSmilesVect(Chem.MolFromSmiles(s), 1, randomSeed=seed)[0] for s in inputs]
        random.Random(seed).shuffle(alternate)
        result = analyze({'molecules': alternate, 'budget': budget})
        assert [selected(result, which) for which in ('heuristic_selection', 'qed_selection')] == expected


@pytest.mark.parametrize('smiles', ['', 'CCO', 'OCC', '[CH3:1]C', 'C[C@SP1](F)(Cl)Br', '*CC', 'CCO C1OC1',
    'C~C', 'C1CC', 'C(C)(C)(C)(C)C', 'CC\u041e', 'c1cccc1', '[H][H]', '[13CH3]CO', '[2H]O[2H]',
    '[Na+].[Cl-]', 'CC(=O)[O-]', 'F/C=C/F', 'FC=CF', 'C[C@H](N)C(=O)O', 'N[C@@H](C)C(=O)O',
    'CC(=O)Oc1ccccc1C(=O)O', 'O=C(O)c1ccccc1OC(C)=O', 'CC(=O)Nc1ccc(O)cc1', 'Oc1ccc(NC(C)=O)cc1'])
def test_current_contracts_share_acceptance_identity_and_descriptor_values(smiles):
    row = analyze({'molecules': [smiles], 'budget': 1}).rows[0]
    identity, fields = chemistry('a' * 32, smiles, 0)
    assert (identity.status == 'identified') == (row.status == 'identified')
    assert identity.canonical_isomeric_smiles == row.canonical_smiles
    assert identity.identity_sha256 == row.identity_sha256
    if identity.status == 'identified':
        actual = {f.quantity: f.value for f in fields}
        for field in row.properties:
            if field.evidence_category != 'model_prediction':
                assert actual[field.quantity] == field.value


@pytest.mark.parametrize('identifier', ['CHEMBL25', 'CHEMBL113', 'CHEMBL112'])
def test_descriptors_agree_with_frozen_chembl_at_reported_precision(identifier):
    raw = json.loads((ROOT / f'backend/provenance_lab/references/chembl-{identifier}.json').read_text(encoding='utf-8'))
    row = analyze({'molecules': [raw['molecule_structures']['canonical_smiles']], 'budget': 1}).rows[0]
    values = {f.quantity: f.value for f in row.properties}
    for quantity, key in [('molecular_weight', 'full_mwt'), ('tpsa', 'psa'), ('calculated_logp', 'alogp'), ('qed', 'qed_weighted')]:
        reference = Decimal(raw['molecule_properties'][key])
        rounded = Decimal(str(values[quantity])).quantize(Decimal('0.01'), rounding=ROUND_HALF_EVEN)
        assert rounded == reference, (identifier, quantity, rounded, reference)
    # ChEMBL uses RDKit too: this checks source concordance, not toolkit independence.
    assert importlib.metadata.version('rdkit') == '2025.3.3'


# Explicit formulae and CIAAW 2024 abridged central weights; no RDKit-derived
# formula or periodic-table lookup participates in the expected-value calculation.
WEIGHTS = {'H': Decimal('1.0080'), 'C': Decimal('12.011'), 'N': Decimal('14.007'), 'O': Decimal('15.999')}
@pytest.mark.parametrize('smiles,formula', [('O', {'H': 2, 'O': 1}), ('N', {'N': 1, 'H': 3}),
    ('CCO', {'C': 2, 'H': 6, 'O': 1}), ('c1ccccc1', {'C': 6, 'H': 6}),
    ('CC(N)C(=O)O', {'C': 3, 'H': 7, 'N': 1, 'O': 2})])
def test_hand_formula_molar_mass_independent_of_rdkit_tables(smiles, formula):
    expected = sum((WEIGHTS[element] * count for element, count in formula.items()), Decimal(0))
    value = analyze({'molecules': [smiles], 'budget': 1}).rows[0].properties[0].value
    assert abs(Decimal(str(value)) - expected) <= Decimal('0.00000001')


def test_original_v3_artifact_read_is_not_upgraded():
    raw = json.loads((ROOT / 'docs/phase3-example-run.json').read_text(encoding='utf-8'))['artifact']
    parsed = parse_artifact(raw)
    assert parsed.contract_version == '3.0.0'
    assert parsed.model_dump() == raw


def test_historical_capsule_replays_its_original_tie_rule():
    raw = json.loads((ROOT / 'bioscribe-ai/public/evidence-lab/reference-run.json').read_text(encoding='utf-8'))
    before = json.dumps(raw, sort_keys=True)
    assert verify(raw)['status'] == 'matched'
    assert raw['request']['contract_version'] == 'lab-1.0.0'
    assert raw['result']['ranking']['tie_break'] == 'input_sha256_then_index'
    assert json.dumps(raw, sort_keys=True) == before


@pytest.mark.parametrize('version', ['current', 'historical'])
def test_missing_metadata_is_rejected_by_backend_for_both_versions(version):
    if version == 'historical':
        raw = json.loads((ROOT / 'bioscribe-ai/public/evidence-lab/reference-run.json').read_text(encoding='utf-8'))
    else:
        from provenance_lab.engine import make_package
        raw = make_package({'molecules': ['CCO'], 'budget': 1}).model_dump()
    del raw['result']['rows'][0]['properties'][0]['implementation_fidelity']
    with pytest.raises(ValueError, match='missing_evidence_metadata'):
        verify(raw, recompute=False)
