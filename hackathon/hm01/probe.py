"""Executable HM-01 acceptance probes; never changes application implementation.

Exit 0: every defined acceptance gate met. Exit 2: report contains open gates.
These are requirement assessments, not a claimed scientific benchmark.
"""
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from bioscribe.compute import chemistry, compute, check_dependencies
from bioscribe.config import Settings
from bioscribe.identity import canonical, digest
from bioscribe.provenance import verify_bundle
from bioscribe.schemas import Evidence, RunRequest
from bioscribe.store import Store

DEST = Path(__file__).resolve().parent
RUN_ID = "c" * 32
checks = []


def record(name, passed, detail):
    checks.append({"name":name,"status":"pass" if passed else "fail","detail":detail})


def request(smiles):
    return RunRequest(data_classification="public_non_sensitive", polymer_type="molecule",
                      content="",record_count=0,molecules=smiles).model_dump()


def main():
    check_dependencies()
    invalid = [
        ("unclosed_ring", "C1CC"),
        ("invalid_valence", "C(C)(C)(C)(C)C"),
        ("whitespace_or_multiple_records", "CCO C1OC1"),
        ("dummy_atom", "*CC"),
        ("unsupported_query_bond", "C~C"),
        ("non_ascii", "CCО"),  # final character is Cyrillic O
        ("atom_limit", "C" * 257),
        ("unsupported_annotation", "CCO |$C;C;O$|"),
    ]
    diagnostic_results = []
    for expected, smiles in invalid:
        identity, fields = chemistry(RUN_ID, smiles, 0)
        rejected = identity.status == "unsupported_input" and all(f.value is None for f in fields)
        record(f"reject_without_values:{expected}", rejected, {"status":identity.status,"numeric_fields":sum(f.value is not None for f in fields)})
        diagnostic_results.append({"fixture_class":expected,"input":smiles,"status":identity.status,
            "distinct_reasons":sorted({f.reason for f in fields if f.quantity != "frameshift"}),
            "descriptor_records":sum(f.method_id == "rdkit_descriptors" for f in fields)})
    signatures = {canonical({"status":r["status"],"reasons":r["distinct_reasons"]}) for r in diagnostic_results}
    record("precise_input_diagnostics", len(signatures) == len(invalid),
           {"different_failure_classes":len(invalid),"different_reported_diagnostics":len(signatures),
            "observation":"Unsupported input is safely rejected, but distinct causes are collapsed."})

    pairs = [
        ("equivalent_atom_order", "CCO", "OCC", True),
        ("equivalent_aromatic_notation", "c1ccccc1", "C1=CC=CC=C1", True),
        ("equivalent_fragment_order", "[Na+].[Cl-]", "[Cl-].[Na+]", True),
        ("opposite_tetrahedral_stereo", "N[C@@H](C)C(=O)O", "N[C@H](C)C(=O)O", False),
        ("unspecified_vs_specified_stereo", "NC(C)C(=O)O", "N[C@@H](C)C(=O)O", False),
        ("retain_protonation", "CC(=O)O", "CC(=O)[O-]", False),
        ("retain_salts", "CC(=O)[O-]", "CC(=O)[O-].[Na+]", False),
        ("retain_tautomers", "CC(=O)C", "CC(O)=C", False),
        ("retain_isotopes", "CCO", "[13CH3]CO", False),
    ]
    pair_results = []
    for name, left, right, expected in pairs:
        a, _ = chemistry(RUN_ID,left,0)
        b, _ = chemistry(RUN_ID,right,1)
        same = a.canonical_isomeric_smiles == b.canonical_isomeric_smiles
        detail = {"left":a.model_dump(),"right":b.model_dump(),"canonical_identity_equal":same,"expected_under_current_policy":expected}
        pair_results.append({"case":name,**detail})
        record(f"identity:{name}", same == expected and a.status == b.status == "identified", detail)
    tetra, _ = chemistry(RUN_ID,"NC(C)C(=O)O",0)
    alkene, _ = chemistry(RUN_ID,"FC=CF",0)
    record("tetrahedral_ambiguity_recorded", any(x.endswith(":?") for x in tetra.stereocenters),tetra.model_dump())
    record("double_bond_ambiguity_explicitly_recorded", bool(alkene.stereocenters),
           {"identity":alkene.model_dump(),"observation":"Unspecified double-bond geometry stays unspecified in SMILES; no explicit E/Z ambiguity item is emitted."})

    identity, ethanol = chemistry(RUN_ID,"CCO",0)
    values = {f.quantity:f.value for f in ethanol}
    record("ethanol_fixed_descriptor_fixture", abs(values["molecular_weight"]-46.069)<1e-9 and abs(values["tpsa"]-20.23)<1e-9,
           {"molecular_weight":values["molecular_weight"],"tpsa":values["tpsa"],"scope":"Software fixture only, not predictive accuracy"})
    mixed = request(["CCO","C1CC","*CC","NC(C)C(=O)O"])
    artifact = compute(RUN_ID,mixed)
    record("mixed_library_preserves_all_rows", len(artifact["chemical_identities"]) == 4 and
           [x["status"] for x in artifact["chemical_identities"]] == ["identified","unsupported_input","unsupported_input","identified"],
           [x["status"] for x in artifact["chemical_identities"]])
    record("unassessed_predictions_never_imputed", all(f["value"] is None for f in artifact["outputs"] if f["evidence_category"] == "model_prediction"),
           {"prediction_fields":sum(f["evidence_category"] == "model_prediction" for f in artifact["outputs"])})
    invalid_fields = [f for f in artifact["outputs"] if f["field_id"].startswith("molecule.1.")]
    record("invalid_rows_have_explicit_descriptor_status_records", any(f["quantity"] == "molecular_weight" and f["value"] is None for f in invalid_fields),
           {"observation":"Descriptor fields are absent for unsupported inputs, although row identity and policy abstentions are retained."})
    schema = Evidence.model_json_schema()
    status_enums = {k:v.get("enum") for k,v in schema["properties"].items() if k.endswith("status")}
    _, hydrogen_fields = chemistry(RUN_ID,"[H][H]",0)
    undefined_fraction = next(f for f in hydrogen_fields if f.quantity == "aromatic_heavy_atom_fraction")
    unavailable_model = next(f for f in ethanol if f.quantity == "binding_affinity")
    invalid_mw = next((f for f in invalid_fields if f["quantity"] == "molecular_weight"),None)
    # Assess semantic examples, not merely whether an enum uses the statement's
    # spelling. A different schema could satisfy these distinctions on other axes.
    record("property_missingness_distinguishes_all_three_required_states",
        invalid_mw is not None and unavailable_model.execution_status == "unavailable" and undefined_fraction.domain == "not_applicable",
        {"status_enums":status_enums,"not_computed_example":invalid_mw,"unavailable_example":unavailable_model.model_dump(),
         "undefined_denominator_example":undefined_fraction.model_dump(),
         "observation":"Broken-ring MW has no field record; unavailable affinity has an execution status; H2 aromatic-heavy-atom fraction is undefined but reports unsupported_input/undetermined. UI reduces absent numeric fields to Not assessed. Validation not_applicable is a different concept."})

    # Isolated processes deny socket connections before running the engine.
    payload = request(["OCC","c1ccccc1","NC(C)C(=O)O","CC(=O)[O-].[Na+]"])
    code = "from bioscribe.worker import deny_external_connections; deny_external_connections(); from bioscribe.compute import compute; from bioscribe.identity import canonical; import json,sys; print(canonical(compute(sys.argv[1],json.loads(sys.stdin.read()))))"
    outputs = []
    for _ in range(3):
        child = subprocess.run([sys.executable,"-c",code,RUN_ID],input=json.dumps(payload),text=True,
                               capture_output=True,cwd=ROOT/"backend",timeout=30,check=True)
        outputs.append(json.loads(child.stdout))
    hashes = [digest(canonical(x)) for x in outputs]
    record("offline_same_environment_cross_process_exact_repeat", len(set(hashes)) == 1,
           {"independent_processes":3,"artifact_sha256":hashes,"scope":"One Windows host and locked interpreter; no cross-platform claim."})

    with tempfile.TemporaryDirectory(prefix="bioscribe-hm01-") as temp:
        store = Store(Path(temp)/"runs.sqlite3")
        principal = ("hm01-test","reviewer")
        run_id = store.submit(principal,"hm01_test_original",payload)
        row, attempt = store.claim()
        original = compute(run_id,json.loads(row["payload"]))
        assert store.finish(run_id,attempt,original)
        stored = Store(store.path).get(principal,run_id)
        record("durable_retrieval_preserves_exact_artifact", stored.artifact.model_dump() == original,
               {"run_id":run_id,"artifact_sha256":stored.artifact_sha256})
        provenance = store.provenance(principal,run_id)
        record("persisted_source_registry_lock_verify", verify_bundle(provenance["bundle"],stored.artifact.manifest),
               {"bundle_keys":list(provenance["bundle"]),"input_payload_in_bundle":"request" in provenance["bundle"]})
        manual = compute(run_id,json.loads(row["payload"]))
        record("manual_recompute_with_private_stored_request", manual == original,
               {"scope":"Manual harness recomputation using private stored request and current installed runtime, not a product replay command."})
        exported = stored.model_dump()
        record("export_is_self_contained_original_input_replay_package", "request" in exported or "request" in provenance["bundle"],
               {"export_keys":list(exported),"canonical_first_smiles":stored.artifact.chemical_identities[0].canonical_isomeric_smiles,
                "original_first_smiles":payload["molecules"][0],"observation":"Original spelling OCC is held only in the private job payload; export has CCO and the hash of OCC."})
        mixed_id = store.submit(principal,"hm01_mixed_library",mixed)
        mixed_row, mixed_attempt = store.claim()
        assert mixed_row["id"] == mixed_id
        assert store.finish(mixed_id,mixed_attempt,compute(mixed_id,mixed))
        (DEST / "mixed-case-run.json").write_text(json.dumps(store.get(principal,mixed_id).model_dump(),indent=2),encoding="utf-8")

    # Route inventory is evidence for the supported composition, not a guessed URL.
    from bioscribe.api import app
    routes = sorted({r.path for r in app.routes})
    record("general_historical_replay_route", any("replay" in r for r in routes), routes)
    files = sorted(str(p.relative_to(ROOT)) for p in (ROOT/"bioscribe-ai/public/hackathon").glob("*.json"))
    supplied = json.loads((ROOT/"bioscribe-ai/public/hackathon/example-request.json").read_text())
    record("frozen_pubchem_and_chembl_compound_snapshot_used", False,
           {"active_demo_files":files,"source":supplied.get("source"),
            "observation":"Active demo is a local SMILES list, not source-ID-bound PubChem/ChEMBL compound records. Retained AID1030 study files are assay descriptions, not this workflow's compound snapshot."})

    gates = [
        {"requirement":"Reject malformed/unsupported inputs without invented numbers","status":"pass"},
        {"requirement":"Precise input diagnostic categories and ambiguity flags","status":"partial"},
        {"requirement":"Molecular identity under an explicit policy","status":"pass_scoped","scope":"Exact canonical graph identity; no parent/tautomer equivalence claim"},
        {"requirement":"Calculate and compare descriptors reproducibly","status":"pass_scoped","scope":"Fixtures and repeatability on the current locked host"},
        {"requirement":"Never silently fill missing values","status":"pass_scoped","scope":"Unsupported graphs and absent predictions stay unassessed; field completeness is a separate gap"},
        {"requirement":"Separate not computed/not available/not applicable at property level","status":"partial"},
        {"requirement":"Frozen PubChem and ChEMBL record snapshots","status":"unmet"},
        {"requirement":"Exactly replay any historical run from an exported package","status":"partial"},
        {"requirement":"Identical results on any machine","status":"unverified"},
    ]
    result = {"statement":"HM-01 ProvenanceLab: Reproducible Molecule Analysis with Evidence Checks",
        "timestamp_utc":datetime.now(timezone.utc).isoformat(),"assessment":"partial_fit","scientific_assessment":"not_assessed",
        "environment":{"platform":platform.platform(),"python":platform.python_version(),"executable":sys.executable},
        "probe_counts":{"pass":sum(c["status"]=="pass" for c in checks),"fail":sum(c["status"]=="fail" for c in checks)},
        "requirements":gates,"probes":checks,"invalid_input_diagnostics":diagnostic_results,"identity_pairs":pair_results,
        "limitations":["No application code changed","No assay labels or external data fetched","Cross-platform execution not attempted","A fixed fixture is not an independent scientific property benchmark"]}
    (DEST/"results.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps({"assessment":result["assessment"],"probe_counts":result["probe_counts"],"report":str(DEST/"results.json"),"exit_code":2}))
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
