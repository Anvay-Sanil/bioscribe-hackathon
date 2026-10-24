"""Generate a local, outcome-free worked comparison. Run from repository root."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from provenance_lab.engine import analyze, make_package, runtime_check, load_bundle
from baseline import describe

CASES = [
    ("ethanol", "Ordinary valid graph", "CCO"),
    ("ethanol-alternate", "Alternate spelling of ethanol", "OCC"),
    ("benzene", "Ordinary aromatic graph", "c1ccccc1"),
    ("aspirin", "Compound with frozen source records", "CC(=O)Oc1ccccc1C(=O)O"),
    ("empty", "Empty record", ""),
    ("ring", "Unpaired ring label", "C1CC"),
    ("branch", "Unbalanced branch", "CC(O"),
    ("valence", "Five single bonds at carbon", "C(C)(C)(C)(C)C"),
    ("aromaticity", "Unkekulizable aromatic graph", "c1cccc1"),
    ("trailing-text", "Two strings separated by a space", "CCO C1OC1"),
    ("named-smiles", "Name after SMILES", "CCO ethanol"),
    ("dummy", "Unresolved dummy atom", "*CC"),
    ("bond", "Nonconcrete bond", "C~C"),
    ("map", "Atom-mapped graph", "[CH3:1]CO"),
    ("unicode", "Unicode look-alike character", "ССO"),
    ("stereo-unset", "Potential atom stereo unspecified", "CC(N)C(=O)O"),
    ("stereo-left", "Specified tetrahedral stereo", "C[C@H](N)C(=O)O"),
    ("stereo-right", "Opposite tetrahedral stereo", "C[C@@H](N)C(=O)O"),
    ("double-unset", "Potential bond stereo unspecified", "FC=CF"),
    ("salt", "Multiple fragments and formal charge", "C[NH3+].[Cl-]"),
    ("charged", "Charged graph", "C[NH3+]"),
    ("neutral", "Neutral form", "CN"),
    ("isotope", "Isotope label", "[13CH3]CO"),
    ("hydrogen", "No heavy atoms", "[H][H]"),
]


def build():
    bundle = load_bundle()
    runtime_check(bundle)
    rows = []
    for identifier, purpose, smiles in CASES:
        result = analyze({"molecules": [smiles], "budget": 1})
        row = result.rows[0]
        rows.append({"id": identifier, "purpose": purpose, "input": smiles, "baseline": describe(smiles),
                     "bioscribe": {"status": row.status, "canonical_smiles": row.canonical_smiles,
                         "diagnostics": [d.model_dump() for d in row.diagnostics],
                         "properties": [p.model_dump() for p in row.properties],
                         "reference_count": len(row.references)}})
    return {"format": "bioscribe-worked-comparison/1.0.0", "scope": "Curated software demonstration, not a representative benchmark or predictive evaluation.",
            "user_value": "untested", "scientific_assessment": "not_assessed",
            "baseline_source_sha256": hashlib.sha256(Path(__file__).with_name("baseline.py").read_bytes()).hexdigest(),
            "engine_sha256": result.engine_sha256, "snapshot_sha256": result.snapshot_sha256,
            "rows": rows}


if __name__ == "__main__":
    output = ROOT / "bioscribe-ai/src/lib/phase3/worked-comparison.json"
    output.write_text(json.dumps(build(), indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    reference = json.loads((ROOT / "bioscribe-ai/public/evidence-lab/reference-run.json").read_text(encoding="utf-8"))
    request = {**reference["request"], "budget": 1}
    package = make_package(request).model_dump()
    (ROOT / "bioscribe-ai/public/evidence-lab/budget-one-run.json").write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"cases": len(CASES), "comparison": str(output), "budget_one_result_sha256": package["result_sha256"]}))
