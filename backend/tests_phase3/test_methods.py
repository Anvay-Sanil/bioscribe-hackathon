import pytest
from bioscribe.compute import chemistry, compute, heuristic
from bioscribe.registry import ALERTS, motif_intervals
from bioscribe.schemas import RunRequest

def run(sequence):
    return compute("a"*32,RunRequest(data_classification="public_non_sensitive",polymer_type="protein",content=sequence,record_count=1).model_dump())

@pytest.mark.parametrize("residue,expected",[("L",(1,0,1)),("E",(1,0,0)),("V",(0,0,1)),("G",(0,1,0)),("C",(0,0,0))])
def test_composition(residue,expected):
    artifact=run(residue*10)
    group=[o for o in artifact["outputs"] if o["method_id"]=="protein_composition"]
    assert tuple(o["value"] for o in group)==expected
    assert not any("coil" in o["field_id"] or "dominant" in o["field_id"] for o in artifact["outputs"])
    assert all(o["coverage"]["analyzed"]==10 for o in group)

@pytest.mark.parametrize("length",[499,500,501,10000])
def test_complete_coverage(length):
    assert all(o["coverage"]["analyzed"]==length for o in run("L"*length)["outputs"] if o["value"] is not None)

@pytest.mark.parametrize("span",[5,18])
def test_ps00107(span):
    seq="LGAGAFSALAAI"+"Q"*span+"LAIK"
    assert motif_intervals(seq)==[(0,len(seq))]
    assert motif_intervals(seq+"QQ"+seq)==[(0,len(seq)),(len(seq)+2,2*len(seq)+2)]
    for position,char in [(0,"A"),(2,"P"),(4,"P"),(7,"W"),(9,"D")]:
        assert motif_intervals(seq[:position]+char+seq[position+1:])==[]
    assert motif_intervals("LGAGAFSALAAI"+"Q"*4+"LAIK")==[]
    assert motif_intervals("LGAGAFSALAAI"+"Q"*19+"LAIK")==[]

def test_chemistry():
    identity,fields=chemistry("a"*32,"CCO",0)
    values={f.quantity:f.value for f in fields}
    assert values["molecular_weight"]==pytest.approx(46.069,abs=0.001)
    assert values["tpsa"]==pytest.approx(20.23)
    assert values["aromatic_heavy_atom_fraction"]==0
    _,benzene=chemistry("a"*32,"c1ccccc1",0)
    assert next(f.value for f in benzene if f.quantity=="aromatic_heavy_atom_fraction")==1
    _,toluene=chemistry("a"*32,"Cc1ccccc1",0)
    assert next(f.value for f in toluene if f.quantity=="aromatic_heavy_atom_fraction")==pytest.approx(6/7)
    assert all(f.value is None and f.assessment_status=="not_assessed" for f in fields if f.evidence_category=="model_prediction")
    assert identity.formal_charge==0 and identity.fragments==1

@pytest.mark.parametrize("smiles,count",[("CCO",0),("C1OC1",1),("O=CCC1OC1",2),("CC(=O)N",0)])
def test_alerts(smiles,count):
    _,fields=chemistry("a"*32,smiles,0)
    assert next(f.value for f in fields if f.quantity=="matches_in_limited_rule_set")==count
    assert all(f.value is None for f in fields if f.quantity in {"toxicity","ames_mutagenicity","herg_liability","half_life"})

def test_alert_failure_is_not_negative(monkeypatch):
    monkeypatch.setitem(ALERTS,"broken","[")
    _,fields=chemistry("a"*32,"CCO",0)
    assert not any(f.quantity=="matches_in_limited_rule_set" for f in fields)
    assert any(f.execution_status=="failed" and f.value is None for f in fields)

def test_chemical_identity_and_limits():
    left,_=chemistry("a"*32,"N[C@@H](C)C(=O)O",0)
    right,_=chemistry("a"*32,"N[C@H](C)C(=O)O",0)
    unknown,_=chemistry("a"*32,"NC(C)C(=O)O",0)
    assert left.canonical_isomeric_smiles!=right.canonical_isomeric_smiles
    assert any("?" in label for label in unknown.stereocenters)
    salt,_=chemistry("a"*32,"[Na+].[Cl-]",0)
    assert salt.fragments==2 and salt.formal_charge==0
    charged,_=chemistry("a"*32,"CC(=O)[O-]",0)
    neutral,_=chemistry("a"*32,"CC(=O)O",0)
    assert charged.formal_charge==-1 and neutral.formal_charge==0
    keto,_=chemistry("a"*32,"CC(=O)C",0)
    enol,_=chemistry("a"*32,"CC(O)=C",0)
    assert keto.canonical_isomeric_smiles!=enol.canonical_isomeric_smiles
    for invalid in ["invalid","C"*257]:
        identity,fields=chemistry("a"*32,invalid,0)
        assert identity.status=="unsupported_input"
        assert all(f.value is None for f in fields)
    assert chemistry("a"*32,"C"*256,0)[0].status=="identified"

def test_heuristic():
    assert heuristic(350,75)==0
    assert heuristic(0,0)==2
    assert heuristic(700,150)==2
    assert heuristic(351,75)<heuristic(352,75)<heuristic(10000,75)
