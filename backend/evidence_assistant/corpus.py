"""Only local frozen, hash-bound records enter inference; no live web in reviews."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).parent / "sources"


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)


def sha(value):
    return hashlib.sha256(value.encode() if isinstance(value, str) else value).hexdigest()


def load_corpus(root=ROOT):
    root = Path(root)
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    for name, expected in manifest["files"].items():
        target = (root / name).resolve()
        if not target.is_relative_to(root.resolve()) or target.is_symlink() or sha(target.read_bytes()) != expected:
            raise ValueError("corpus_integrity_failure")
    corpus = json.loads((root / "records.json").read_text(encoding="utf-8"))
    ids = set()
    for source in corpus["records"]:
        if source["source_id"] in ids:
            raise ValueError("duplicate_evidence_id")
        ids.add(source["source_id"])
        if source["raw_file"] not in manifest["files"] or source["raw_sha256"] != manifest["files"][source["raw_file"]]:
            raise ValueError("source_manifest_mismatch")
        raw = json.loads((root / source["raw_file"]).read_text(encoding="utf-8"))
        if source["kind"] == "assay_record":
            activity = raw["activity"]
            checks = {"activity_id": str(activity["activity_id"]), "molecule_id": activity["molecule_chembl_id"],
                      "assay_id": activity["assay_chembl_id"], "target_id": activity["target_chembl_id"],
                      "endpoint": activity["standard_type"], "value": activity["standard_value"],
                      "units": activity["standard_units"], "relation": activity["standard_relation"],
                      "data_validity_comment": activity["data_validity_comment"], "potential_duplicate": activity["potential_duplicate"],
                      "organism": activity["target_organism"], "target_name": activity["target_pref_name"], "assay_description":activity["assay_description"]}
            if any(source[k] != v for k, v in checks.items()):
                raise ValueError("source_projection_mismatch")
            # The retraction receipt is bound to the same publication, never a user flag.
            receipt = raw["publication_check"]
            if source["publication_check"] != receipt:
                raise ValueError("retraction_receipt_mismatch")
            from .freeze_sources import publication_status
            if publication_status(receipt.get("metadata", {})) != receipt["status"]:
                raise ValueError("retraction_classification_mismatch")
        elif source["kind"] == "run_record":
            node = raw
            for part in source["locator"].strip("/").split("/"):
                node = node[int(part)] if isinstance(node, list) else node[part]
            if source["property"] != node or source["run_id"] != raw["run_id"] or source["endpoint"] != node["quantity"] or source["units"] != node["units"]:
                raise ValueError("run_projection_mismatch")
        else:
            raise ValueError("unsupported_source_type")
    return corpus["records"], sha(canonical(manifest))


def eligibility(source, now=None):
    if source["kind"] == "run_record":
        return None
    check = source.get("publication_check", {})
    if check.get("status") != "not_flagged_in_checked_snapshot":
        return check.get("status", "publication_status_unknown")
    try:
        age = ((now or datetime.now(timezone.utc)) - datetime.fromisoformat(check["checked_utc"])).total_seconds()
    except (KeyError, ValueError):
        return "publication_status_unknown"
    if age < -300 or age > 30 * 86400:
        return "publication_status_stale"
    if source.get("data_validity_comment"):
        return "flagged_assay_quality"
    if source.get("potential_duplicate"):
        return "potential_duplicate_record"
    if source.get("relation") != "=" or source.get("units") != "nM":
        return "unsupported_measurement_relation_or_units"
    return None
