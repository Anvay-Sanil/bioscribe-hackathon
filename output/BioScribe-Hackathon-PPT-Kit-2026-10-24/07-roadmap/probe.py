"""Read-only application probes on public toy molecules; no study outcomes.

Writes only this audit's JSON record when --output is supplied. This is not a
replacement for the application suite or evidence of biological performance.
"""
import argparse
from copy import deepcopy
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from provenance_lab.engine import analyze, canonical, make_package, sha, verify
from provenance_lab.schemas import Property
from rdkit import Chem


def request(molecules):
    return {"contract_version": "lab-1.0.0", "data_scope": "public_non_sensitive", "molecules": molecules, "budget": 1}


def selected(result):
    return result.rows[result.ranking.heuristic_selection[0]].identity_sha256


def main():
    base = ["C[C@H](O)C(=O)O", "C[C@@H](O)C(=O)O"]
    original = analyze(request(base))
    score = lambda row: next(p.value for p in row.properties if p.quantity == "descriptor_distance")
    assert score(original.rows[0]) == score(original.rows[1])
    assert original.rows[0].identity_sha256 != original.rows[1].identity_sha256
    witness = None
    for index, smiles in enumerate(base):
        molecule = Chem.MolFromSmiles(smiles)
        variants = sorted({Chem.MolToSmiles(molecule, canonical=False, rootedAtAtom=root, isomericSmiles=True) for root in range(molecule.GetNumAtoms())})
        for variant in variants:
            inputs = list(base)
            inputs[index] = variant
            changed = analyze(request(inputs))
            assert [r.identity_sha256 for r in changed.rows] == [r.identity_sha256 for r in original.rows]
            assert [r.properties for r in changed.rows] == [r.properties for r in original.rows]
            if selected(changed) != selected(original):
                witness = {"before": base, "after": inputs, "unchanged_identity_hashes": [r.identity_sha256 for r in original.rows], "equal_distance": score(original.rows[0]), "before_selected_index": original.ranking.heuristic_selection[0], "after_selected_index": changed.ranking.heuristic_selection[0], "tie_break": original.ranking.tie_break}
                break
        if witness:
            break
    assert witness is not None, "Expected to find a notation-sensitive tie witness"

    package = make_package(request(["CCO"]))
    incomplete = deepcopy(package.model_dump())
    removed = ["method", "implementation_fidelity", "validation_record", "predictive_validation"]
    for field in incomplete["result"]["rows"][0]["properties"]:
        for key in removed:
            del field[key]
    restored = verify(incomplete, recompute=False)
    replay = verify(incomplete)
    assert restored.model_dump() == package.model_dump()
    assert replay["status"] == "matched"

    repeated = analyze(request(base))
    assert sha(canonical(original.model_dump())) == sha(canonical(repeated.model_dump()))
    result = {
        "scope": "Read-only local probes; no full-suite rerun, study outcomes or application edits",
        "scientific_assessment": "not_assessed",
        "notation_sensitive_tie": {"observed": True, "interpretation": "Documented current policy, not an incorrect descriptor; equivalent spelling can change a tied selection", "witness": witness},
        "backend_metadata_defaults": {"observed": True, "removed_fields": removed, "restored_to_identical_package": True, "fresh_replay_status": replay["status"], "required_property_fields": Property.model_json_schema()["required"], "interpretation": "Backend reconstructs constant metadata; differs from strict original-document completeness in the browser. No fabricated numerical result or predictive validation demonstrated."},
        "exact_repeat_on_same_runtime": {"observed": True, "result_sha256": sha(canonical(original.model_dump()))}
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    text = json.dumps(result, indent=2)
    if args.output:
        args.output.write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
