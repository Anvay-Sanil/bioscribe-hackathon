"""Semantic checks of the demonstration and its claims; no target outcomes."""
import json
from pathlib import Path
import sys
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(ROOT / "backend"))
from build_comparison import build
from provenance_lab.engine import verify


@pytest.fixture(scope="module")
def comparison():
    return build()


def test_recorded_observations_match_executed_code(comparison):
    assert comparison == json.loads((ROOT / "bioscribe-ai/src/lib/phase3/worked-comparison.json").read_text())


@pytest.mark.parametrize("identifier,code", [
    ("empty", "empty_input"), ("ring", "ring_closure"), ("branch", "branch_syntax"),
    ("valence", "invalid_valence"), ("aromaticity", "aromaticity_failure"),
    ("trailing-text", "whitespace_or_control"), ("named-smiles", "whitespace_or_control"),
    ("dummy", "dummy_atom"), ("bond", "query_graph"), ("map", "atom_map"), ("unicode", "non_ascii_character")])
def test_rejections_abstain_without_dropping_rows(comparison, identifier, code):
    row = next(r for r in comparison["rows"] if r["id"] == identifier)["bioscribe"]
    assert row["status"] == "rejected"
    assert row["diagnostics"][0]["code"] == code
    assert all(p["value"] is None for p in row["properties"])


@pytest.mark.parametrize("identifier", ["ethanol", "ethanol-alternate", "benzene", "aspirin", "neutral", "isotope"])
def test_baseline_successes_preserved(comparison, identifier):
    row = next(r for r in comparison["rows"] if r["id"] == identifier)
    for name in ("molecular_weight", "tpsa"):
        assert row["baseline"][name] == next(p["value"] for p in row["bioscribe"]["properties"] if p["quantity"] == name)
    assert row["baseline"]["canonical_smiles"] == row["bioscribe"]["canonical_smiles"]


def test_no_performance_or_safety_claims(comparison):
    assert comparison["user_value"] == "untested"
    assert comparison["scientific_assessment"] == "not_assessed"
    for row in comparison["rows"]:
        for p in row["bioscribe"]["properties"][6:]:
            assert p["value"] is None and p["assessment_status"] == "not_assessed"


def test_missingness_and_stereo(comparison):
    by_id = {r["id"]: r for r in comparison["rows"]}
    assert next(p for p in by_id["hydrogen"]["bioscribe"]["properties"] if p["quantity"] == "aromatic_heavy_atom_fraction")["availability"] == "not_applicable"
    assert by_id["stereo-left"]["bioscribe"]["canonical_smiles"] != by_id["stereo-right"]["bioscribe"]["canonical_smiles"]
    assert by_id["charged"]["bioscribe"]["canonical_smiles"] != by_id["neutral"]["bioscribe"]["canonical_smiles"]
    assert any(d["code"] == "unspecified_stereo" for d in by_id["stereo-unset"]["bioscribe"]["diagnostics"])


def test_budget_fixture_recomputes_and_preserves_properties():
    a = json.loads((ROOT / "bioscribe-ai/public/evidence-lab/reference-run.json").read_text())
    b = json.loads((ROOT / "bioscribe-ai/public/evidence-lab/budget-one-run.json").read_text())
    assert verify(b)["status"] == "matched"
    assert a["result"]["rows"] == b["result"]["rows"]
    assert b["result"]["ranking"]["heuristic_selection"] == a["result"]["ranking"]["heuristic_selection"][:1]
    assert b["result"]["ranking"]["qed_selection"] == a["result"]["ranking"]["qed_selection"][:1]
