"""Explicit, one-time public compound acquisition; never called by analysis/replay.

Fetches compound identities only. No assays, activities or study outcomes.
Refuses to replace an existing freeze. Review raw records before use.
"""
import hashlib
import json
from pathlib import Path
import urllib.request
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "backend/provenance_lab/references"
RECORDS = [("aspirin", 2244, "CHEMBL25"), ("caffeine", 2519, "CHEMBL113"),
           ("acetaminophen", 1983, "CHEMBL112")]


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    if (DEST / "snapshot.json").exists():
        raise SystemExit("Freeze already exists; create a separately versioned amendment.")
    responses = []
    for label, cid, chembl in RECORDS:
        for source, identifier, url in [
            ("PubChem", str(cid), f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/property/IsomericSMILES,InChIKey,MolecularFormula,MolecularWeight/JSON"),
            ("ChEMBL", chembl, f"https://www.ebi.ac.uk/chembl/api/data/molecule/{chembl}.json"),
        ]:
            request = urllib.request.Request(url, headers={"User-Agent": "BioScribe-educational-snapshot/1.0", "Accept": "application/json"})
            with urllib.request.urlopen(request, timeout=45) as response:
                raw = response.read(500000)
                data = json.loads(raw)
                headers = {k.lower(): v for k, v in response.headers.items() if k.lower() in {"date", "etag", "last-modified", "content-type"}}
            if source == "PubChem":
                record = data["PropertyTable"]["Properties"][0]
                assert str(record["CID"]) == identifier
                smiles = record.get("SMILES", record.get("IsomericSMILES"))
                key = record["InChIKey"]
            else:
                assert data["molecule_chembl_id"] == identifier
                smiles = data["molecule_structures"]["canonical_smiles"]
                key = data["molecule_structures"]["standard_inchi_key"]
            assert smiles and key
            filename = f"{source.lower()}-{identifier}.json"
            (DEST / filename).write_bytes(raw)
            responses.append(dict(source=source, identifier=identifier, label=label, url=url,
                filename=filename, raw_sha256=hashlib.sha256(raw).hexdigest(),
                retrieved_utc=datetime.now(timezone.utc).isoformat(), headers=headers,
                source_version="not supplied by compound endpoint; content-addressed retrieval snapshot",
                smiles=smiles, inchi_key=key,
                curation="Exact identifier checked; compare local canonical graph. No biological labels imported."))
    snapshot = dict(snapshot_id="bioscribe-public-compounds-1", scope="compound identity only; no assay outcomes",
        identity_policy="Exact isomeric graph; preserve charge, fragments, tautomer and isotopes",
        units_policy="Source properties retained as raw evidence; not silently substituted for local calculations",
        records=responses)
    (DEST / "snapshot.json").write_text(json.dumps(snapshot, indent=2)+"\n", encoding="utf-8")
    print(f"Frozen {len(responses)} public records at {DEST}")


if __name__ == "__main__":
    main()
