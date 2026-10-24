from copy import deepcopy
import pytest
from pydantic import ValidationError
from bioscribe.compute import compute
from bioscribe.schemas import Artifact, Evidence, RunRequest

def test_mixed_evidence_is_not_upgraded(request_payload):
    artifact=Artifact.model_validate(compute("a"*32,request_payload))
    assert any(f.assessment_status=="computed" for f in artifact.outputs)
    assert any(f.assessment_status=="not_assessed" for f in artifact.outputs)
    assert all(f.validation_record is None for f in artifact.outputs)

@pytest.mark.parametrize("change",[
    {"value":2.5},{"assessment_status":"validated"},{"validation_record":"reviewer-approved"},
    {"method_version":"wrong"},{"method_id":"unknown"},{"evidence_category":"computed_descriptor"},
    {"implementation_fidelity":"fixture_checked","fidelity_record":"reviewer-approved"},
])
def test_prediction_and_review_cannot_bypass_schema(request_payload,change):
    field=next(f for f in compute("a"*32,request_payload)["outputs"] if f["evidence_category"]=="model_prediction")
    field.update(change)
    with pytest.raises(ValidationError):Evidence.model_validate(field)

def test_artifact_binding_and_domain(request_payload):
    artifact=compute("a"*32,request_payload)
    for key,value in [("run_id","b"*32),("input_sha256","f"*64),("domain","out_of_domain")]:
        changed=deepcopy(artifact)
        changed["outputs"][0][key]=value
        with pytest.raises(ValidationError):Artifact.model_validate(changed)
    changed=deepcopy(artifact)
    changed["outputs"].append(changed["outputs"][0])
    with pytest.raises(ValidationError):Artifact.model_validate(changed)


@pytest.mark.parametrize('attack',['scope_index','scope_hash','relabel','method_scope','leading_zero'])
def test_field_scope_and_display_identity(request_payload,attack):
    request_payload['molecules']=['CCO']
    artifact=compute('a'*32,request_payload)
    field=artifact['outputs'][0]
    if attack=='scope_index':field['field_id']='record.99.length'
    elif attack=='scope_hash':field['input_sha256']=artifact['chemical_identities'][0]['input_sha256']
    elif attack=='relabel':field['field_id']='record.0.validated_binding_affinity'
    elif attack=='method_scope':
        field['field_id']='molecule.0.length'
        field['input_sha256']=artifact['chemical_identities'][0]['input_sha256']
    elif attack=='leading_zero':field['field_id']='record.00.length'
    with pytest.raises(ValidationError):Artifact.model_validate(artifact)

@pytest.mark.parametrize('change',[{'quantity':'binding_affinity'},{'units':'kcal/mol'},{'value':-1},{'value':1.5},{'value':'safe'}])
def test_descriptor_cannot_impersonate_prediction(request_payload,change):
    field=compute('a'*32,request_payload)['outputs'][0]
    field.update(change)
    with pytest.raises(ValidationError):Evidence.model_validate(field)

def test_notes_no_extraction(request_payload):
    request_payload.update(polymer_type="notes",content="garbled !@ notes",record_count=0)
    field=compute("a"*32,request_payload)["outputs"][0]
    assert field["assessment_status"]=="needs_review" and field["value"] is None

@pytest.mark.parametrize("change",[{"data_classification":"confidential"},{"data_classification":"patient_linked"},{"analysis":"docking"},{"polymer_type":"guess"},{"contract_version":"2.0"},{"reviewer_approved":True}])
def test_unsupported_contract_rejected(request_payload,change):
    request_payload.update(change)
    with pytest.raises(ValidationError):RunRequest.model_validate(request_payload)
