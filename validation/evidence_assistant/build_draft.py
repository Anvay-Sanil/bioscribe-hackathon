"""Draft 150 source-linked claims. Proposed labels are not reviewed ground truth."""
import json
from pathlib import Path
import sys
from decimal import Decimal

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
from evidence_assistant.corpus import canonical, eligibility, load_corpus, sha


def main():
    here = Path(__file__).parent
    if (here / "claims.jsonl").exists(): raise ValueError("draft_exists_do_not_silently_regenerate_labels")
    records, corpus_hash = load_corpus()
    selected = [r for r in records if r["kind"] == "assay_record" and eligibility(r) is None][:30]
    if len(selected) != 30: raise ValueError("insufficient_source_records")
    claims, labels = [], []
    for index, row in enumerate(selected):
        number = Decimal(row["value"])
        other_endpoint = "IC50" if row["endpoint"].lower() != "ic50" else "Ki"
        variants = [
            (f"{row['molecule_id']} in activity {row['activity_id']} has {row['endpoint']} = {row['value']} {row['units']}.", "supported", "exact_record"),
            (f"{row['molecule_id']} in activity {row['activity_id']} has {row['endpoint']} = {number * 2 + 1} {row['units']}.", "contradicted", "changed_numeric_value"),
            (f"{row['molecule_id']} in activity {row['activity_id']} has {other_endpoint} = {row['value']} {row['units']}.", "insufficient_evidence", "wrong_endpoint"),
            (f"{row['molecule_id']} inhibits {row['target_name']} in every experimental context, based on activity {row['activity_id']}.", "insufficient_evidence", "unsupported_generalization"),
            (f"{row['molecule_id']} is safe for patients because activity {row['activity_id']} reports a measurement.", "out_of_scope", "clinical_inference"),
        ]
        for variant, (text, label, case) in enumerate(variants):
            claim_id = f"EA-{index * 5 + variant + 1:03d}"
            # Grouping by publication prevents alternate rows from one paper
            # being misrepresented as independent evidence or train/test units.
            group = "PMID:" + str(row["publication_check"].get("pmid"))
            claims.append({"claim_id":claim_id,"text":text,"source_group":group,"record_group":row["source_id"],"split":"unassigned"})
            labels.append({"claim_id":claim_id,"proposed_verdict":label,"rationale_type":case,"source_ids":[row["source_id"]],
                "label_status":"provisional_unreviewed","reviewer_ids":[],"adjudication":None})
    for name, rows in (("claims.jsonl",claims),("proposed_labels.jsonl",labels)):
        (here/name).write_bytes(("\n".join(canonical(row) for row in rows)+"\n").encode())
    manifest = {"status":"provisional_unreviewed","claims":150,"source_records":30,"source_groups":len({c['source_group'] for c in claims}),
        "corpus_sha256":corpus_hash,"claims_sha256":sha((here/'claims.jsonl').read_bytes()),"proposed_labels_sha256":sha((here/'proposed_labels.jsonl').read_bytes()),
        "label_counts":{label:sum(row['proposed_verdict']==label for row in labels) for label in ('supported','contradicted','insufficient_evidence','out_of_scope')},
        "limitations":["Template-generated challenge set, not a representative independent benchmark", "Labels drafted after implementation and not independently adjudicated", "No protected holdout or source-group split assigned", "Repeated source records and publications are dependent", "No real retracted-paper claim in this 150-row draft; retraction handling has synthetic software fixtures only", "No inferential performance or calibrated-confidence claim"]}
    (here/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(manifest,indent=2))


if __name__=='__main__':main()
