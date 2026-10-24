"""Generate outcome-free molecular fixtures for challenge regression checks."""
import copy
import json
from pathlib import Path
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from provenance_lab.engine import canonical, make_package, sha


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def package(molecules, budget):
    return make_package({"molecules": molecules, "budget": budget}).model_dump()


if __name__ == "__main__":
    molecules = ["OCC", "C1=CC=CC=C1", "CC(=O)Oc1ccccc1C(=O)O", "CC(N)C(=O)O"]
    control = package(molecules, 2)
    fixtures = {"control": control, "single": package(["CCO"], 1), "full": package(["C"*n for n in range(1, 17)], 3)}
    variants = {
        "reorder": (list(reversed(molecules)), 2),
        "canonical": ([r["canonical_smiles"] for r in control["result"]["rows"]], 2),
        "duplicate": (molecules + [molecules[0]], 2),
        "invalid": ([""] + molecules[1:], 2),
        "budget": (molecules, 3),
    }
    fixtures["jobs"] = {key: {"run_id": (p := package(rows, budget))["run_id"], "request_sha256": p["result"]["request_sha256"], "mode": "analyze", "status": "succeeded", "error_code": None, "output": {"package": p, "replay": None}} for key, (rows, budget) in variants.items()}
    # The failed receipt here is a labelled unit-test fixture; live verification
    # obtains its own failed receipt from an actual persisted server replay.
    forged = copy.deepcopy(control)
    forged["result"]["rows"][0]["properties"][0]["value"] += 1
    forged["result_sha256"] = sha(canonical(forged["result"]))
    fixtures["jobs"]["forged"] = {"run_id": uuid.uuid4().hex, "request_sha256": sha(canonical(forged)), "mode": "replay", "status": "failed", "error_code": "replay_result_mismatch", "output": None}
    write(ROOT / "hackathon/experiment-challenges/test-fixtures.json", fixtures)
    write(ROOT / "bioscribe-ai/public/evidence-lab/challenge-source-run.json", control)
    print(json.dumps({"source_result_sha256": control["result_sha256"], "computed_variant_packages": len(variants), "forged_receipt": "synthetic_unit_test_fixture"}))
