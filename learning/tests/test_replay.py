"""Software tests with fabricated labels; no ALDH1A1 outcomes are used."""
import json

import pytest

from learning import replay as module


def encode(data):
    return json.dumps(data).encode()


@pytest.fixture
def library():
    smiles = ["CCO", "CC(=O)O", "c1ccccc1", "CCN", "CCOC(=O)C"]
    return {
        "schema_version": "learning-library/1.0.0", "data_class": "synthetic_software_fixture",
        "label_origin": "fabricated_for_software_demonstration", "dataset_id": "test-only", "selection_budget": 2,
        "molecules": [{"record_id": f"r{i}", "smiles": value, "test_label": i < 2} for i, value in enumerate(smiles)],
    }


def test_real_descriptors_and_unsupported_claims(library):
    report = module.replay(encode(library))
    ethanol = report["rows"][0]["chemistry"]
    assert ethanol["molecular_weight"]["value"] == pytest.approx(46.069, abs=0.001)
    assert ethanol["tpsa"]["value"] == pytest.approx(20.23, abs=0.001)
    assert ethanol["heuristic"]["value"] == pytest.approx(1.5986409523809524)
    assert ethanol["qed"]["value"] == pytest.approx(0.40680796565539457)
    assert ethanol["heuristic"]["evidence_category"] == "unvalidated_heuristic"
    assert report["status"] == "complete"
    assert report["scientific_assessment"] == report["qualification_status"] == "not_assessed"
    assert report["scientific_release"] == report["sensitive_intake"] == "blocked"
    assert report["study_execution"] == "not_performed" and report["confidence_bounds"] is None
    assert all(r["label_origin"] == "fabricated_for_software_demonstration" for r in report["rows"])
    assert all(value["validation_record"] is None for value in ethanol.values() if isinstance(value, dict))


def test_counts_and_rational_denominators(library, monkeypatch):
    original = module.score
    positions = {row["smiles"]: i for i, row in enumerate(library["molecules"])}

    def mock_scores(smiles):
        result = original(smiles)
        # Deliberately controlled software scores: H selects r0/r1, Q selects r4/r3.
        result["heuristic"]["value"] = positions[smiles]
        result["qed"]["value"] = positions[smiles] / 5
        return result

    monkeypatch.setattr(module, "score", mock_scores)
    report = module.replay(encode(library))
    assert report["synthetic_label_counts"] == {"population_positive": 2, "heuristic_positive": 2, "qed_positive": 0, "additional_positive": 2}
    metrics = report["conditional_metrics"]
    assert metrics["precision_difference"] == {"numerator": 2, "denominator": 2, "value": 1.0, "status": "computed"}
    assert metrics["expected_random_hits"] == {"numerator": 4, "denominator": 5, "value": 0.8, "status": "computed"}
    assert metrics["enrichment"] == {"numerator": 10, "denominator": 4, "value": 2.5, "status": "computed"}
    assert report["selections"]["overlap_count"] == 0


def test_order_and_labels_do_not_control_selection(library):
    first = module.replay(encode(library))
    library["molecules"].reverse()
    for row in library["molecules"]:
        row["test_label"] = not row["test_label"]
    second = module.replay(encode(library))
    assert first["selections"] == second["selections"]
    assert first["input_sha256"] != second["input_sha256"]
    assert first["run_id"] != second["run_id"]


def test_ties_have_exact_budget_and_ignore_file_order():
    rows = [{"heuristic": {"value": 1.0}, "tie_key": k, "entity_sha256": k} for k in ["c", "a", "b"]]
    assert [r["entity_sha256"] for r in module.select(rows, "heuristic", 2)] == ["a", "b"]
    assert module.select(rows, "heuristic", 2) == module.select(list(reversed(rows)), "heuristic", 2)


def test_near_ties_are_not_rounded():
    rows = [{"heuristic": {"value": 1.0000000000001}, "tie_key": "a", "entity_sha256": "a"},
            {"heuristic": {"value": 1.0}, "tie_key": "z", "entity_sha256": "z"}]
    assert module.select(rows, "heuristic", 1)[0]["entity_sha256"] == "z"


@pytest.mark.parametrize("smiles", ["CCO C1OC1", "*CC", "CCO\n", "C1CC", "C" * 257])
def test_unsupported_graph_never_gets_descriptors_or_metrics(library, smiles):
    library["molecules"][0]["smiles"] = smiles
    report = module.replay(encode(library))
    assert report["status"] == "incomplete"
    assert report["rows"][0]["chemistry"] is None
    assert report["conditional_metrics"] is None and report["selections"] is None
    assert report["coverage"]["unsupported_rows"] == 1


def test_equivalent_graphs_rejected_even_with_different_text(library):
    library["molecules"][1]["smiles"] = "OCC"
    with pytest.raises(module.ReplayError, match="duplicate_chemical_identity"):
        module.replay(encode(library))


def test_unknown_does_not_become_negative_or_shrink_population(library):
    library["molecules"][4]["test_label"] = None
    report = module.replay(encode(library))
    assert report["status"] == "insufficient_evidence"
    assert report["coverage"] == {"input_rows": 5, "scored_rows": 5, "unsupported_rows": 0, "unknown_test_labels": 1}
    assert report["conditional_metrics"] is None and report["synthetic_label_counts"] is None
    assert report["selections"] is None


def test_zero_positives_is_undefined_enrichment(library):
    for row in library["molecules"]:
        row["test_label"] = False
    report = module.replay(encode(library))
    assert report["status"] == "complete"
    assert report["conditional_metrics"]["enrichment"] == {"numerator": 0, "denominator": 0, "value": None, "status": "undefined"}
    assert report["conditional_metrics"]["heuristic_precision"]["value"] == 0
    assert report["qualification_status"] == "not_assessed"


def test_budget_larger_than_population_has_no_fallback(library):
    library["selection_budget"] = 6
    report = module.replay(encode(library))
    assert report["status"] == "incomplete"
    assert report["selections"] is None and report["conditional_metrics"] is None


@pytest.mark.parametrize("budget", [0, -1, 129, True, "2", 2.5])
def test_invalid_budgets(library, budget):
    library["selection_budget"] = budget
    with pytest.raises(module.ReplayError, match="invalid_learning_library"):
        module.parse_library(encode(library))


@pytest.mark.parametrize("mutation", ["empirical", "unknown_field", "numeric_label", "too_many_rows", "long_smiles", "duplicate_id"])
def test_contract_rejects_unsupported_input(library, mutation):
    if mutation == "empirical":
        library["data_class"] = "public_empirical"
    elif mutation == "unknown_field":
        library["scientifically_validated"] = True
    elif mutation == "numeric_label":
        library["molecules"][0]["test_label"] = 1
    elif mutation == "too_many_rows":
        library["molecules"] *= 26
    elif mutation == "long_smiles":
        library["molecules"][0]["smiles"] = "C" * 2049
    elif mutation == "duplicate_id":
        library["molecules"][1]["record_id"] = library["molecules"][0]["record_id"]
    with pytest.raises(module.ReplayError):
        module.parse_library(encode(library))


@pytest.mark.parametrize("raw", [b'{"a":1,"a":2}', b'{"a":NaN}', b'\xff', b'{', b' ' * (module.MAX_BYTES + 1)],
                         ids=["duplicate-key", "nonfinite", "invalid-encoding", "broken-json", "oversized"])
def test_malformed_or_oversized_json(raw):
    with pytest.raises(module.ReplayError):
        module.parse_library(raw)


def test_total_atom_bound(library, monkeypatch):
    monkeypatch.setattr(module, "MAX_TOTAL_ATOMS", 4)
    with pytest.raises(module.ReplayError, match="total_atom_limit"):
        module.replay(encode(library))


def test_nonfinite_calculation_abstains(monkeypatch):
    monkeypatch.setattr(module, "heuristic", lambda *_: float("nan"))
    with pytest.raises(module.ReplayError, match="nonfinite_computation"):
        module.score("CCO")


def test_cli_sanitizes_dependency_failure(library, tmp_path, capsys, monkeypatch):
    path = tmp_path / "fixture.json"
    path.write_bytes(encode(library))

    def fail():
        raise RuntimeError("sensitive_internal_detail")

    monkeypatch.setattr(module, "check_dependencies", fail)
    assert module.main([str(path)]) == 2
    output = capsys.readouterr()
    assert "sensitive_internal_detail" not in output.out + output.err
    assert json.loads(output.out)["reason"] == "locked_environment_unavailable"


def test_cli_complete_and_incomplete(library, tmp_path, capsys):
    path = tmp_path / "fixture.json"
    path.write_bytes(encode(library))
    assert module.main([str(path)]) == 0
    assert json.loads(capsys.readouterr().out)["status"] == "complete"
    library["molecules"][0]["test_label"] = None
    path.write_bytes(encode(library))
    assert module.main([str(path)]) == 2
    assert json.loads(capsys.readouterr().out)["status"] == "insufficient_evidence"


def test_bundled_120_compound_demo_selects_exactly_100():
    from pathlib import Path
    report = module.replay(Path("learning/demo-input.json").read_bytes())
    assert report["coverage"]["input_rows"] == 120
    assert report["status"] == "complete"
    for key in ("heuristic_entity_sha256", "qed_entity_sha256"):
        assert len(report["selections"][key]) == len(set(report["selections"][key])) == 100


def test_published_input_schema_matches_enforced_contract():
    from pathlib import Path
    assert json.loads(Path("learning/input.schema.json").read_bytes()) == module.Library.model_json_schema()
