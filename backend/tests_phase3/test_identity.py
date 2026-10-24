import pytest
from pydantic import ValidationError
from bioscribe.identity import InputError, parse_input
from bioscribe.schemas import RunRequest

def request(content,kind="protein",count=1,**kwargs):
    return RunRequest(data_classification="public_non_sensitive",polymer_type=kind,content=content,record_count=count,**kwargs)

def test_source_coordinates():
    text=">one\r\n aC d\r\n>two\nLL\n"
    parsed=parse_input(request(text,count=2))
    assert [r.sequence for r in parsed.records]==["ACD","LL"]
    for record in parsed.records:
        assert "".join(text[i].upper() for i in record.source_offsets)==record.sequence
        assert record.normalization

@pytest.mark.parametrize("text",["",">x",">\nLL",">x\nLL\n>x\nAA","LL>X","LLX","LLB","LLZ","LLU","LLO","LL-","LL*","LL1","LÃ©L","LL\x00",">a\n\n>b\nAA"])
def test_rejected_inputs(text):
    with pytest.raises(InputError):parse_input(request(text))

def test_polymer_not_inferred():
    assert parse_input(request("ACGT",kind="dna")).polymer_type=="dna"
    assert parse_input(request("ACGT",kind="protein")).polymer_type=="protein"
    with pytest.raises(InputError):parse_input(request("ACGT",kind="rna"))

@pytest.mark.parametrize("n",[499,500,501,9999,10000])
def test_full_record_identity(n):
    record=parse_input(request("L"*n)).records[0]
    assert len(record.source_offsets)==len(record.sequence)==n

def test_limits_and_counts():
    with pytest.raises(InputError):parse_input(request("L"*10001))
    with pytest.raises(InputError):parse_input(request(">a\nL\n>b\nL",count=1))
    assert len(parse_input(request("\n".join(f">r{i}\nL" for i in range(8)),count=8)).records)==8
    with pytest.raises(ValidationError):request("L",count=9)
    assert len(parse_input(request(">a\n"+"L"*10000+"\n>b\n"+"L"*10000,count=2)).records)==2
    with pytest.raises(InputError):parse_input(request(">a\n"+"L"*10000+"\n>b\n"+"L"*10000+"\n>c\nL",count=3))

def test_notes_and_molecules():
    assert parse_input(request("garbled text @!?",kind="notes",count=0)).records==[]
    assert parse_input(request("x"*4000,kind="notes",count=0))
    with pytest.raises(InputError):parse_input(request("x"*4001,kind="notes",count=0))
    with pytest.raises(InputError):parse_input(request("CCO",kind="molecule",count=0,molecules=["CCO"]))
    assert parse_input(request("",kind="molecule",count=0,molecules=["CCO"]))

def test_source_metadata():
    with pytest.raises(ValidationError): request("LL",source={"accession":"P1"})
    with pytest.raises(ValidationError): request("LL",source={"organism_taxon_id":0})
    assert request("LL",source={"accession":"P1","version":"2","organism_taxon_id":9606}).source.provenance=="user_supplied_unverified"
