"""Regressions for Sentinel R2: concrete graph eligibility before calculation."""
import pytest
from rdkit import Chem
from bioscribe.compute import chemistry, parse_supported_smiles
from bioscribe.identity import digest
from bioscribe.registry import METHODS, MOLECULAR_INPUT_POLICY
from bioscribe.worker import execute_one


@pytest.mark.parametrize('smiles',[
    'CCO C1OC1','CCO ethanol','CCO\tC1OC1','CCO\nC1OC1',
    'CCO |$C;C;O$|','*CC','*','[1*]CC','[C,N]','C~C',
    '', ' ', 'CCO ', ' CCO', 'CCO\x00C1OC1', 'CCO\u00a0C1OC1',
    '.', 'C1CC', 'C(C)(C)(C)(C)C', 'C'*257,
])
def test_unsupported_input_never_yields_descriptors_or_negative_scan(smiles,capfd):
    identity,fields=chemistry('a'*32,smiles,0)
    assert identity.status=='unsupported_input'
    assert identity.input_sha256==digest(smiles)
    assert identity.canonical_isomeric_smiles is None
    assert all(field.value is None for field in fields)
    assert all(field.execution_status=='unsupported_input' for field in fields)
    assert all(field.assessment_status=='not_assessed' for field in fields)
    assert not any(field.method_id in {'rdkit_descriptors','prioritization_heuristic'} for field in fields)
    assert not any(field.quantity=='matches_in_limited_rule_set' for field in fields)
    assert any(field.method_id=='structural_alert_scan' for field in fields)
    assert capfd.readouterr().err==''


@pytest.mark.parametrize('smiles',[
    'CCO','[Na+].[Cl-]','CC(=O)[O-]','[13CH3]CO','[2H]O[2H]',
    'N[C@@H](C)C(=O)O','N[C@H](C)C(=O)O','NC(C)C(=O)O',
    'F/C=C/F','FC=CF','CC(=O)C','CC(O)=C','C'*256,
])
def test_supported_chemistry_retains_identity_policy(smiles):
    molecule=parse_supported_smiles(smiles)
    assert molecule is not None
    identity,fields=chemistry('a'*32,smiles,0)
    assert identity.status=='identified' and identity.input_sha256==digest(smiles)
    assert identity.canonical_isomeric_smiles==Chem.MolToSmiles(molecule,isomericSmiles=True)
    assert identity.formal_charge==Chem.GetFormalCharge(molecule)
    assert identity.fragments==len(Chem.GetMolFrags(molecule))
    assert any('plain_smiles_concrete_graph/1.2.0' in policy for policy in identity.policies)
    for field in fields:
        if field.method_id in {'rdkit_descriptors','structural_alert_scan','prioritization_heuristic'}:
            assert field.method_version=='1.2.0'
            assert METHODS[field.method_id]['input_policy']==MOLECULAR_INPUT_POLICY
    assert any(field.quantity=='matches_in_limited_rule_set' and field.execution_status=='succeeded' for field in fields)


@pytest.mark.parametrize('smarts',['[#6]','C~C'])
def test_query_graphs_returned_by_parser_are_rejected(monkeypatch,smarts):
    graph=Chem.MolFromSmarts(smarts)
    assert graph is not None
    monkeypatch.setattr(Chem,'MolFromSmiles',lambda *_:graph)
    assert parse_supported_smiles('CC') is None


def test_query_bond_guard_without_query_atoms(monkeypatch):
    # MolFromSmarts makes query atoms too. Replace only a bond on a concrete
    # molecule so this exercises the independent query-bond guard.
    graph=Chem.RWMol(Chem.MolFromSmiles('CC'))
    graph.ReplaceBond(0,Chem.BondFromSmarts('~'))
    assert not any(atom.HasQuery() for atom in graph.GetAtoms())
    assert graph.GetBondWithIdx(0).HasQuery()
    monkeypatch.setattr(Chem,'MolFromSmiles',lambda *_:graph)
    assert parse_supported_smiles('CC') is None


def test_parser_parameters_and_exception_sanitization(monkeypatch,capfd):
    def failing_parser(smiles,parameters):
        assert parameters.parseName is False and parameters.allowCXSMILES is False
        assert parameters.sanitize is False and parameters.removeHs is False
        raise ValueError('SENSITIVE_PARSER_CANARY')
    monkeypatch.setattr(Chem,'MolFromSmiles',failing_parser)
    identity,fields=chemistry('a'*32,'CCO',0)
    assert identity.status=='unsupported_input'
    assert all(field.value is None and 'CANARY' not in field.reason for field in fields)
    assert 'CANARY' not in capfd.readouterr().err


def test_mixed_supported_and_rejected_molecules_persist_and_export(api,headers,request_payload):
    client,store=api
    molecules=['CCO C1OC1','*CC','CCO','C1OC1']
    response=client.post('/v3/runs',headers=headers,json=dict(request_payload,molecules=molecules))
    assert response.status_code==202
    run_id=response.json()['run_id']
    assert execute_one(store)
    view=client.get('/v3/runs/'+run_id,headers=headers).json()
    assert view['status']=='succeeded'
    artifact=view['artifact']
    assert [i['status'] for i in artifact['chemical_identities']]==['unsupported_input','unsupported_input','identified','identified']
    for index in [0,1]:
        assert all(f['value'] is None for f in artifact['outputs'] if f['field_id'].startswith(f'molecule.{index}.'))
    counts={f['field_id']:f['value'] for f in artifact['outputs'] if f['quantity']=='matches_in_limited_rule_set'}
    assert counts=={'molecule.2.alert_match_count':0,'molecule.3.alert_match_count':1}
    assert all(f['value'] is None for f in artifact['outputs'] if f['evidence_category']=='model_prediction')
    assert client.get('/v3/runs/'+run_id+'/export',headers=headers).json()==view
