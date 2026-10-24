"""Synthetic software checks. No fixture is a scientific validation dataset."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path

import pytest

from validation.phase4.contracts import Protocol, SplitManifest
from validation.phase4.preflight import assess, read_bounded, MAX_PROTOCOL_BYTES


def encode(value):
    return json.dumps(value, allow_nan=False).encode()


@pytest.fixture
def bundle(tmp_path):
    # This mock declares empirical provenance solely to test the structural path.
    # The tool deliberately cannot authenticate this declaration; see limitations.
    rows = [dict(unit_id=f"u{i}", entity_key=f"e{i}",
                 role="train" if i == 0 else "external_test",
                 groups={"series": f"s{i}"}) for i in range(4)]
    split = dict(schema_version="phase4-split/1.0.0", dataset_id="mock", rows=rows)
    refs = {}
    for name in Protocol.model_fields["artifacts"].annotation.model_fields:
        path = tmp_path / (name + ".json")
        path.write_bytes(encode(split if name == "split_manifest" else {"synthetic_software_fixture": True}))
        refs[name] = dict(path=path.name, sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    plan = dict(
        schema_version="phase4-protocol/1.0.0", state="proposed", protocol_id="synthetic-test-only",
        protocol_version="1", data_class="public_non_sensitive", claim_type="endpoint_prediction",
        task_type="regression",
        intended_use="Synthetic unit test", prohibited_uses=["Scientific qualification"],
        endpoint=dict(quantity="mock", label_units="mock_units", prediction_units="mock_units",
                      target_definition="mock", organism_and_population="mock", assay_and_conditions="mock",
                      label_transform="identity", positive_class_definition="not applicable"),
        method=dict(method_id="mock", version="1", category="candidate_predictor", input_policy_version="1",
                    training_data_disclosure="mock disclosed membership", stochastic_policy="deterministic"),
        dataset=dict(dataset_id="mock", source_release="mock1", provenance_kind="public_empirical",
                     suitability_rationale="mock", license_and_permitted_use="mock", selection_query_and_date="mock",
                     inclusion_exclusion_policy="mock", censored_missing_conflicting_labels="mock",
                     replicate_aggregation_policy="mock"),
        baselines_and_comparisons=["mock"],
        sampling=dict(unit_of_analysis="mock unit", min_test_units=3, min_independent_groups=3,
                      independence_group="series", min_positive_units=0, min_negative_units=0,
                      sample_size_justification="mock", precision_or_power_target="mock",
                      multiplicity_policy="mock", missingness_and_abstention_analysis="mock"),
        primary_gates=[dict(metric_id="mock_error", estimand_and_population="mock", units="mock_units",
                            bound="upper_confidence_bound", operator="<=", threshold=0.5, confidence_level=0.95,
                            interval_method_and_resampling_unit="mock", rationale="fixture only, not an approved threshold")],
        secondary_analyses=["mock"],
        domain=dict(definition_version="mock1", fitting_population="development_only",
                    numerical_rules_and_thresholds="mock", biological_and_assay_limits="mock",
                    input_eligibility_distinction="mock", unknown_or_outside_action="abstain",
                    subgroup_and_shift_studies="mock"),
        split_strategy_and_rationale="mock", required_disjoint_group_keys=["series"], artifacts=refs,
        review=dict(scientific_owner="mock", independent_statistical_reviewer="mock", data_custodian="mock",
                    label_adjudication_and_conflicts="mock", holdout_access_and_freeze_procedure="mock",
                    trusted_checkpoint_and_authorship_procedure="mock"),
    )
    return tmp_path, plan, split


def run(bundle):
    root, plan, _ = bundle
    return assess(encode(plan), root)


def save_split(bundle):
    root, plan, split = bundle
    value = encode(split)
    (root / plan["artifacts"]["split_manifest"]["path"]).write_bytes(value)
    plan["artifacts"]["split_manifest"]["sha256"] = hashlib.sha256(value).hexdigest()


def test_complete_declarations_do_not_grant_scientific_status(bundle):
    report = run(bundle)
    assert report["status"] == "structural_checks_passed_review_required"
    assert report["checked_artifacts"] == 7
    assert report["scientific_assessment"] == "not_assessed"
    assert report["scientific_release"] == report["sensitive_intake"] == "blocked"
    assert len(report["limitations"]) == 4


def test_delivered_template_is_blocked():
    root = Path(__file__).parents[1]
    report = assess((root / "study.template.json").read_bytes(), root)
    assert report["status"] == "blocked"
    assert report["scientific_assessment"] == "not_assessed"


@pytest.mark.parametrize("field", ["endpoint", "method", "dataset", "sampling", "primary_gates", "domain", "review", "artifacts"])
def test_missing_scientific_design_blocks(bundle, field):
    del bundle[1][field]
    assert run(bundle)["status"] == "blocked"


@pytest.mark.parametrize("value", [None, True, "0.5"])
def test_threshold_must_be_finite_number(bundle, value):
    bundle[1]["primary_gates"][0]["threshold"] = value
    assert run(bundle)["status"] == "blocked"


def test_nonfinite_json_and_duplicate_keys_rejected(bundle):
    root, plan, _ = bundle
    raw = encode(plan).replace(b'"threshold": 0.5', b'"threshold": NaN')
    assert assess(raw, root)["status"] == "blocked"
    raw = encode(plan).replace(b'"threshold": 0.5', b'"threshold": 0.5, "threshold": 2.0')
    assert assess(raw, root)["status"] == "blocked"


def test_optimistic_ci_bound_is_rejected(bundle):
    bundle[1]["primary_gates"][0]["bound"] = "lower_confidence_bound"
    assert run(bundle)["status"] == "blocked"


def test_duplicate_gates_rejected(bundle):
    bundle[1]["primary_gates"] *= 2
    assert run(bundle)["status"] == "blocked"


def test_synthetic_labels_never_support_qualification(bundle):
    bundle[1]["dataset"]["provenance_kind"] = "synthetic_software_fixture"
    assert "synthetic_data_cannot_support_scientific_qualification" in run(bundle)["issues"]


def test_heuristic_requires_ranking_scope(bundle):
    bundle[1]["method"]["category"] = "unvalidated_heuristic"
    assert run(bundle)["status"] == "blocked"
    bundle[1]["claim_type"] = "ranking_utility"
    bundle[1]["task_type"] = "ranking"
    bundle[1]["endpoint"]["prediction_units"] = "dimensionless"
    assert run(bundle)["status"] == "structural_checks_passed_review_required"


def test_unit_mismatch_rejected_for_endpoint_prediction(bundle):
    bundle[1]["endpoint"]["prediction_units"] = "different"
    assert run(bundle)["status"] == "blocked"


def test_binary_probability_prediction_has_its_own_scale_and_class_support(bundle):
    bundle[1]["task_type"] = "binary_classification"
    bundle[1]["endpoint"]["label_units"] = "binary_label"
    bundle[1]["endpoint"]["prediction_units"] = "probability"
    assert run(bundle)["status"] == "blocked"
    bundle[1]["sampling"].update(min_positive_units=1, min_negative_units=1)
    assert run(bundle)["status"] == "structural_checks_passed_review_required"


def test_ranking_task_cannot_be_endpoint_claim(bundle):
    bundle[1]["task_type"] = "ranking"
    assert run(bundle)["status"] == "blocked"


def test_untrusted_field_names_are_not_echoed(bundle):
    bundle[1]["private_canary_name"] = "private_canary_value"
    assert "private_canary" not in json.dumps(run(bundle))


def test_artifact_substitution_detected(bundle):
    (bundle[0] / bundle[1]["artifacts"]["method_bundle"]["path"]).write_bytes(b"changed")
    assert "artifact_hash_mismatch:method_bundle" in run(bundle)["issues"]


@pytest.mark.parametrize("path", ["../outside.json", "/outside.json", "E:/outside.json", "file.json:stream", "..\\outside.json"])
def test_outside_bundle_read_rejected(bundle, path):
    bundle[1]["artifacts"]["method_bundle"]["path"] = path
    assert "artifact_unreadable_or_outside_limits:method_bundle" in run(bundle)["issues"]


def test_unavailable_artifact_blocks(bundle):
    (bundle[0] / bundle[1]["artifacts"]["method_bundle"]["path"]).unlink()
    assert run(bundle)["status"] == "blocked"


@pytest.mark.parametrize("mutation,expected", [
    ("unit", "duplicate_unit_id"), ("entity", "entity_crosses_split_roles"),
    ("group", "declared_group_crosses_split_roles"), ("missing_group", "missing_required_group"),
    ("dataset", "split_dataset_identity_mismatch"),
    ("test_count", "insufficient_declared_test_units"),
    ("cluster_count", "insufficient_declared_independent_groups"),
    ("no_development", "development_membership_not_disclosed"),
])
def test_disclosed_split_defects_block(bundle, mutation, expected):
    _, _, split = bundle
    a, b = split["rows"][:2]
    if mutation == "unit": b["unit_id"] = a["unit_id"]
    elif mutation == "entity": b["entity_key"] = a["entity_key"]
    elif mutation == "group": b["groups"] = deepcopy(a["groups"])
    elif mutation == "missing_group": b["groups"] = {}
    elif mutation == "dataset": split["dataset_id"] = "other"
    elif mutation == "test_count": split["rows"].pop()
    elif mutation == "cluster_count": split["rows"][2]["groups"] = deepcopy(b["groups"])
    elif mutation == "no_development": a["role"] = "challenge"
    save_split(bundle)
    assert expected in run(bundle)["issues"]


def test_impossible_sample_plan_rejected(bundle):
    bundle[1]["sampling"]["min_positive_units"] = 4
    assert run(bundle)["status"] == "blocked"


def test_unknown_and_positive_release_fields_rejected(bundle):
    bundle[1]["scientific_release"] = "approved"
    assert run(bundle)["status"] == "blocked"


def test_oversized_protocol_rejected(bundle):
    assert assess(b" " * (MAX_PROTOCOL_BYTES + 1), bundle[0])["issues"] == ["protocol_size_limit"]


@pytest.mark.parametrize("size", [15, 16, 17])
def test_bounded_artifact_read(tmp_path, size):
    path = tmp_path / "payload"
    path.write_bytes(b"x" * size)
    if size > 16:
        with pytest.raises(ValueError, match="file_size_limit"):
            read_bounded(path, 16)
    else:
        assert read_bounded(path, 16) == b"x" * size


def test_invalid_split_content_blocks_even_with_matching_hash(bundle):
    bundle[2]["rows"][1]["role"] = "unknown"
    save_split(bundle)
    assert "invalid_split_manifest" in run(bundle)["issues"]


def test_published_schemas_match_models():
    root = Path(__file__).parents[1]
    for name, model in [("protocol", Protocol), ("split", SplitManifest)]:
        assert json.loads((root / f"{name}.schema.json").read_text()) == model.model_json_schema()
