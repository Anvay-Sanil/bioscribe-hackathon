"""Explicit, bounded public-source acquisition. Never runs during claim review."""
from datetime import datetime, timezone
import json
from pathlib import Path
import time
import urllib.parse
import urllib.request
from .corpus import ROOT, canonical, sha

MOLECULES = {"CHEMBL113": "caffeine", "CHEMBL25": "aspirin", "CHEMBL112": "acetaminophen", "CHEMBL521": "ibuprofen", "CHEMBL941": "imatinib"}


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "BioScribe-Educational-Evidence/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read(4_000_001)
        if len(raw) > 4_000_000: raise ValueError("source_response_too_large")
        return json.loads(raw)


def publication_status(record):
    if not isinstance(record, dict):
        return "publication_status_unknown"
    pub_types = record.get("pubTypeList") or {}
    if not isinstance(pub_types, dict) or not isinstance(pub_types.get("pubType", []), list):
        return "publication_status_unknown"
    values = pub_types.get("pubType", [])
    if any(not isinstance(value, str) for value in values):
        return "publication_status_unknown"
    types = " ".join(values).lower()
    corrections = canonical(record.get("commentCorrectionList", {})).lower()
    if record.get("isRetracted") in ("Y", True) or "retract" in types or "retract" in corrections:
        return "retracted_or_linked_retraction"
    if "expression of concern" in types + corrections:
        return "expression_of_concern"
    if not record.get("id") or not values:
        return "publication_status_unknown"
    return "not_flagged_in_checked_snapshot"


def main():
    if (ROOT / "manifest.json").exists():
        raise ValueError("frozen_snapshot_exists_use_a_versioned_refresh")
    ROOT.mkdir(parents=True, exist_ok=True)
    raw_dir = ROOT / "raw"
    raw_dir.mkdir(exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()
    documents, pubs, records = {}, {}, []
    for molecule, name in MOLECULES.items():
        url = "https://www.ebi.ac.uk/chembl/api/data/activity.json?" + urllib.parse.urlencode({"molecule_chembl_id": molecule, "pchembl_value__isnull": "false", "potential_duplicate": 0, "limit": 8})
        response = get(url)
        for activity in response["activities"]:
            doc_id = activity["document_chembl_id"]
            if doc_id not in documents:
                document = get(f"https://www.ebi.ac.uk/chembl/api/data/document/{doc_id}.json")
                # Abstract prose is not used as automatically verified entailment.
                documents[doc_id] = {key: document.get(key) for key in ("document_chembl_id", "pubmed_id", "doi", "title", "year", "doc_type")}
            document = documents[doc_id]
            pmid = str(document.get("pubmed_id") or "")
            if pmid and pmid not in pubs:
                pub_url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search?" + urllib.parse.urlencode({"query": f"EXT_ID:{pmid} AND SRC:MED", "format": "json", "resultType": "core"})
                result = get(pub_url).get("resultList", {}).get("result", [])
                correct = [r for r in result if str(r.get("id")) == pmid and r.get("source") == "MED"]
                metadata = {key: correct[0].get(key) for key in ("id", "source", "title", "pubTypeList", "commentCorrectionList", "isRetracted")} if len(correct) == 1 else {}
                pubs[pmid] = {"status": publication_status(metadata), "checked_utc": now, "url": pub_url, "pmid": pmid,
                              "provider": "Europe PMC MED metadata", "metadata": metadata,
                              "scope": "Retraction/concern flags in this response as of retrieval; absence of a flag is not proof of no retraction."}
            receipt = pubs.get(pmid, {"status": "publication_status_unknown", "checked_utc": now, "pmid": None, "metadata": {}})
            raw = {"retrieved_utc": now, "activity_url": f"https://www.ebi.ac.uk/chembl/api/data/activity/{activity['activity_id']}.json",
                   "activity": activity, "document": document, "publication_check": receipt}
            raw_file = "raw/activity-" + str(activity["activity_id"]) + ".json"
            raw_text = canonical(raw) + "\n"
            (ROOT / raw_file).write_bytes(raw_text.encode("utf-8"))
            records.append({"source_id": "chembl-activity:" + str(activity["activity_id"]), "kind": "assay_record",
                "activity_id": str(activity["activity_id"]), "molecule_id": molecule, "molecule_name": name,
                "assay_id": activity["assay_chembl_id"], "target_id": activity["target_chembl_id"],
                "target_name": activity["target_pref_name"], "organism": activity["target_organism"],
                "endpoint": activity["standard_type"], "value": activity["standard_value"], "units": activity["standard_units"],
                "relation": activity["standard_relation"], "assay_description": activity["assay_description"],
                "data_validity_comment": activity["data_validity_comment"], "potential_duplicate": activity["potential_duplicate"],
                "publication_check": receipt, "raw_file": raw_file, "raw_sha256": sha(raw_text), "url": raw["activity_url"]})
        print(json.dumps({"molecule": molecule, "records_so_far": len(records)}), flush=True)
        time.sleep(.25)
    project = Path(__file__).resolve().parents[2]
    run_path = project / "bioscribe-ai/public/evidence-lab/reference-run.json"
    package = json.loads(run_path.read_text(encoding="utf-8"))
    from provenance_lab.engine import verify
    verify(package)
    raw_file = "raw/descriptor-run.json"
    raw_text = canonical(package) + "\n"
    (ROOT / raw_file).write_bytes(raw_text.encode("utf-8"))
    names = ["aspirin", "caffeine", "acetaminophen"]
    for index, row in enumerate(package["result"]["rows"]):
        for prop_index, prop in enumerate(row["properties"]):
            if prop["availability"] != "computed": continue
            records.append({"source_id": f"run:{package['run_id']}:row:{index}:{prop['quantity']}", "kind": "run_record",
                "run_id": package["run_id"], "molecule_name": names[index], "endpoint": prop["quantity"], "units": prop["units"],
                "property": prop, "locator": f"/result/rows/{index}/properties/{prop_index}",
                "raw_file": raw_file, "raw_sha256": sha(raw_text), "url": None})
    (ROOT / "records.json").write_text(json.dumps({"snapshot": "evidence-assistant-sources/0.1.0", "created_utc": now, "records": records}, indent=2) + "\n", encoding="utf-8")
    files = {p.relative_to(ROOT).as_posix(): sha(p.read_bytes()) for p in sorted(ROOT.rglob("*.json"))}
    (ROOT / "manifest.json").write_text(json.dumps({"snapshot": "evidence-assistant-sources/0.1.0", "created_utc": now,
        "scope": "Small source-record collection, not exhaustive literature or experimental validation", "files": files}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"records": len(records), "documents_checked": len(pubs), "path": str(ROOT)}))


if __name__ == "__main__": main()
