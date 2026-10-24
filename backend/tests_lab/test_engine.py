import copy
import json
from pathlib import Path
import pytest
from provenance_lab.engine import analyze, canonical, load_bundle, make_package, parse, sha, verify
from provenance_lab.schemas import LabRequest, Property, ReplayPackage


@pytest.mark.parametrize("text,code",[
    ("","empty_input"),("C1CC","ring_closure"),("C(CC","branch_syntax"),
    ("C(C)(C)(C)(C)C","invalid_valence"),("CCO C1OC1","whitespace_or_control"),
    ("CCO\n","whitespace_or_control"),("*CC","dummy_atom"),("C~C","query_graph"),
    ("CCÐž","non_ascii_character"),("C"*257,"atom_limit"),
    ("CCO |$C;C;O$|","unsupported_annotation"),("c1cccc1","aromaticity_failure"),
    ("[CH3:1]C","atom_map"),("N->[Cu]","unsupported_bond"),("invalid","smiles_syntax")])
def test_diagnostic_and_no_values(text,code):
    result=analyze({"molecules":[text],"budget":1})
    row=result.rows[0]
    assert row.status=="rejected"
    assert row.diagnostics[0].code==code
    assert all(p.value is None for p in row.properties)
    assert len(row.properties)==9
    assert result.ranking.status=="not_assessed"


@pytest.mark.parametrize("left,right,same",[
    ("CCO","OCC",True),("c1ccccc1","C1=CC=CC=C1",True),
    ("CC(=O)[O-].[Na+]","[Na+].[O-]C(C)=O",True),
    ("N[C@@H](C)C(=O)O","N[C@H](C)C(=O)O",False),
    ("NC(C)C(=O)O","N[C@H](C)C(=O)O",False),
    ("CC(=O)O","CC(=O)[O-]",False),("CC(=O)O","CC(=O)[O-].[Na+]",False),
    ("CC=O","C=CO",False),("CCO","[13CH3]CO",False),
    ("F/C=C/F","F/C=C\\F",False)])
def test_identity(left,right,same):
    rows=analyze({"molecules":[left,right],"budget":1}).rows
    assert (rows[0].identity_sha256==rows[1].identity_sha256)==same
    if same:
        assert rows[0].properties==rows[1].properties


@pytest.mark.parametrize("text,field",[("FC=CF","bond_indices"),("NC(C)C(=O)O","atom_indices")])
def test_missing_stereo(text,field):
    _,diagnostics=parse(text)
    assert any(d.code=="unspecified_stereo" and getattr(d,field) for d in diagnostics)


def test_three_missingness_states():
    result=analyze({"molecules":["C1CC","[H][H]"],"budget":1})
    assert result.rows[0].properties[0].availability=="not_computed"
    assert next(p for p in result.rows[1].properties if p.quantity=="aromatic_heavy_atom_fraction").availability=="not_applicable"
    assert next(p for p in result.rows[1].properties if p.quantity=="toxicity").availability=="not_available"


def test_reference_binding_and_offline(monkeypatch):
    import socket
    monkeypatch.setattr(socket.socket,"connect",lambda *a: (_ for _ in ()).throw(AssertionError("network")))
    package=make_package({"molecules":["CC(=O)Oc1ccccc1C(=O)O"],"budget":1})
    assert {r.source for r in package.result.rows[0].references}=={"PubChem","ChEMBL"}
    assert verify(package)["status"]=="matched"


def test_reference_tamper():
    bundle=load_bundle().model_dump()
    bundle["references"]["pubchem-2244.json"]+=" "
    from provenance_lab.schemas import Bundle
    with pytest.raises(ValueError,match="reference_integrity_failure"):
        analyze({"molecules":["CCO"],"budget":1},Bundle.model_validate(bundle))


@pytest.mark.parametrize("mutation",["input","row","number","code","reference","result_hash","version"])
def test_tamper_rejected(mutation):
    p=make_package({"molecules":["OCC"],"budget":1}).model_dump()
    if mutation=="input": p["request"]["molecules"][0]="c1ccccc1"
    if mutation=="row": p["result"]["rows"][0]["original_smiles"]="CCO"
    if mutation=="number": p["result"]["rows"][0]["properties"][0]["value"]=999
    if mutation=="code": p["bundle"]["sources"]["engine.py"]+="\n# changed"
    if mutation=="reference": p["bundle"]["references"]["pubchem-2244.json"]+=" "
    if mutation=="result_hash": p["result_sha256"]="0"*64
    if mutation=="version": p["format"]="bioscribe-replay/0.1.0"
    with pytest.raises(ValueError): verify(p)


def test_rehashed_false_result_fails_computation():
    p=make_package({"molecules":["CCO"],"budget":1}).model_dump()
    p["result"]["rows"][0]["properties"][0]["value"]=999
    p["result_sha256"]=sha(canonical(p["result"]))
    with pytest.raises(ValueError,match="replay_result_mismatch"): verify(p)


def test_untrusted_source_never_executes(tmp_path):
    from provenance_lab.engine import engine_hash
    from provenance_lab.schemas import Bundle
    p=make_package({"molecules":["CCO"],"budget":1}).model_dump()
    marker=tmp_path/"executed"
    p["bundle"]["sources"]["engine.py"]+=f"\nopen({str(marker)!r},'w').write('bad')\n"
    p["result"]["engine_sha256"]=engine_hash(Bundle.model_validate(p["bundle"]))
    p["result_sha256"]=sha(canonical(p["result"]))
    with pytest.raises(ValueError,match="historical_engine_unavailable"): verify(p)
    assert not marker.exists()


def test_replay_preserves_original_and_is_exact():
    p=make_package({"molecules":["OCC","C1CC","[H][H]"],"budget":1})
    assert p.request.molecules[0]=="OCC"
    assert p.result.rows[0].canonical_smiles=="CCO"
    assert verify(json.loads(canonical(p.model_dump())))["actual_sha256"]==p.result_sha256
    assert make_package(p.request).result_sha256==p.result_sha256


def test_duplicates_and_budget():
    duplicate=analyze({"molecules":["CCO","OCC"],"budget":1})
    assert duplicate.identity_groups==[[0,1]]
    assert duplicate.ranking.status=="not_assessed"
    big=analyze({"molecules":["CCO","CCC","CC"],"budget":3})
    small=analyze({"molecules":["CCO","CCC","CC"],"budget":1})
    assert len(big.ranking.heuristic_selection)==3
    assert small.ranking.heuristic_selection==big.ranking.heuristic_selection[:1]


@pytest.mark.parametrize("edit",[{"value":1,"availability":"not_computed"},{"value":None},{"units":"kcal/mol"},{"assessment_status":"not_assessed"},{"method":"old/0.0.1"},{"predictive_validation":"validated"},{"coverage":"none"}])
def test_property_contract(edit):
    field=analyze({"molecules":["CCO"],"budget":1}).rows[0].properties[0].model_dump()
    with pytest.raises(ValueError): Property.model_validate({**field,**edit})


@pytest.mark.parametrize("payload",[{"molecules":[],"budget":1},{"molecules":["C"]*17,"budget":1},{"molecules":["C"*2049],"budget":1},{"molecules":["C"],"budget":2},{"molecules":["C"],"budget":True},{"molecules":["C"],"budget":1,"data_scope":"patient"}])
def test_resource_and_scope_limits(payload):
    with pytest.raises(ValueError): LabRequest.model_validate(payload)
