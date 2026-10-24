"""Generate recorded educational examples and the authoritative browser schema."""
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"backend"))
from provenance_lab.engine import canonical, make_package, sha
from provenance_lab.schemas import ReplayPackage

DEST=ROOT/"bioscribe-ai/public/evidence-lab"
DEST.mkdir(parents=True,exist_ok=True)
clean={"molecules":["CC(=O)Oc1ccccc1C(=O)O","Cn1c(=O)c2c(ncn2C)n(C)c1=O","CC(=O)Nc1ccc(O)cc1"],"budget":2}
stress={"molecules":["CCO","OCC","C1CC","C(C)(C)(C)(C)C","*CC","C~C","CCO C1OC1","CC\u041e","NC(C)C(=O)O","FC=CF","[H][H]","CC(=O)Oc1ccccc1C(=O)O"],"budget":3}
for name,request in [("reference",clean),("challenge",stress)]:
    (DEST/f"{name}-request.json").write_text(canonical(request)+"\n",encoding="utf-8")
    package=make_package(request)
    (DEST/f"{name}-run.json").write_text(canonical(package.model_dump())+"\n",encoding="utf-8")
    print(name,package.result_sha256)
schema=ReplayPackage.model_json_schema()
(ROOT/"bioscribe-ai/src/lib/phase3/LabPackage.schema.json").write_text(json.dumps(schema,indent=2)+"\n",encoding="utf-8")
(DEST/"schema.json").write_text(json.dumps(schema,indent=2)+"\n",encoding="utf-8")
manifest={p.name:sha(p.read_text(encoding="utf-8")) for p in sorted(DEST.glob("*.json")) if p.name!="assets-manifest.json"}
(DEST/"assets-manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
