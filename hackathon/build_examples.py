"""Build public, recorded calculations and illustrative conformers; no assay labels.

Run with the locked Phase 3 Python environment from the repository root.
The accepted application engine and study/learning originals are not modified.
"""
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from bioscribe.compute import check_dependencies, compute, parse_supported_smiles
from bioscribe.identity import canonical, digest
from bioscribe.schemas import RunRequest
from bioscribe.store import Store
from rdkit import Chem, rdBase
from rdkit.Chem import AllChem

EXAMPLES = [
    ("Aspirin", "CC(=O)Oc1ccccc1C(=O)O"),
    ("Caffeine", "Cn1c(=O)c2c(ncn2C)n(C)c1=O"),
    ("Acetaminophen", "CC(=O)Nc1ccc(O)cc1"),
    ("Ibuprofen · unspecified stereochemistry", "CC(C)Cc1ccc(C(C)C(=O)O)cc1"),
    ("Lidocaine", "CCN(CC)CC(=O)Nc1c(C)cccc1C"),
    ("Benzocaine", "CCOC(=O)c1ccc(N)cc1"),
    ("Salicylic acid", "O=C(O)c1ccccc1O"),
    ("Ethanol", "CCO"),
]


def main():
    check_dependencies()
    dest = ROOT / "bioscribe-ai/public/hackathon"
    dest.mkdir(parents=True, exist_ok=True)
    request = RunRequest(data_classification="public_non_sensitive", polymer_type="molecule",
                         content="", record_count=0, molecules=[s for _, s in EXAMPLES]).model_dump()
    store = Store(ROOT / "hackathon/data/examples.sqlite3")
    principal = ("public_examples", "example_builder")
    run_id = store.submit(principal, digest(canonical(request)), request)
    run = store.get(principal, run_id)
    if run.status == "queued":
        row, attempt = store.claim()
        assert row["id"] == run_id
        assert store.finish(run_id, attempt, compute(run_id, request))
    run = store.get(principal, run_id)
    assert run.status == "succeeded"
    (dest / "example-run.json").write_text(json.dumps(run.model_dump(), indent=2), encoding="utf-8")
    (dest / "example-request.json").write_text(json.dumps(request, indent=2), encoding="utf-8")
    entries = []
    for name, smiles in EXAMPLES:
        source = parse_supported_smiles(smiles)
        mol = Chem.AddHs(source)
        params = AllChem.ETKDGv3()
        params.randomSeed = 20261023
        params.maxIterations = 1000
        assert AllChem.EmbedMolecule(mol, params) == 0
        status = AllChem.UFFOptimizeMolecule(mol, maxIters=200)
        block = Chem.MolToMolBlock(mol)
        # Coordinates must retain connectivity; stereo omitted only in this
        # round-trip check because embedding assigns an arbitrary conformer to
        # explicitly unspecified stereochemistry, which remains unspecified.
        restored = Chem.MolFromMolBlock(block, removeHs=True)
        assert Chem.MolToSmiles(restored, isomericSmiles=False) == Chem.MolToSmiles(source, isomericSmiles=False)
        entries.append(dict(name=name, input_smiles=smiles, input_sha256=digest(smiles),
            canonical_isomeric_smiles=Chem.MolToSmiles(source, isomericSmiles=True), molblock=block,
            molblock_sha256=hashlib.sha256(block.encode()).hexdigest(),
            method="RDKit ETKDGv3 + UFF", version=rdBase.rdkitVersion, seed=20261023,
            optimization_status="converged" if status == 0 else "iteration_limit",
            interpretation="Illustrative computed conformer; not experimental structure, docking, or a bioactive pose. Unspecified stereochemistry remains unspecified."))
    (dest / "conformers.json").write_text(json.dumps(entries, indent=2), encoding="utf-8")

    learning_dest = ROOT / "bioscribe-ai/public/hackathon-learning"
    learning_dest.mkdir(exist_ok=True)
    for name in ("index.html", "viewer.css", "report.js", "filters.js", "viewer.js"):
        shutil.copyfile(ROOT / "learning/viewer" / name, learning_dest / name)
    html = (learning_dest / "index.html").read_text(encoding="utf-8")
    html = html.replace('<script src="viewer.js" defer>', '<script src="examples.js" defer></script>\n  <script src="viewer.js" defer>')
    html = html.replace('<main>', '<main><a href="/molecules">← Back to Molecular Explorer</a>')
    html = html.replace('<section class="file-panel"', '<section class="file-panel"><div><h2>Ready-to-present examples</h2><p>All labels are invented. Switch reports to see the unknown-label guard.</p></div><div class="file-actions"><button class="button" data-example="budget100">Budget 100</button><button class="button" data-example="budget10">Budget 10</button><button class="button secondary" data-example="unknown">Unknown label</button><button class="button secondary" id="download-example" disabled>Download displayed JSON</button></div></section>\n    <section class="file-panel"')
    (learning_dest / "index.html").write_text(html, encoding="utf-8")
    fixtures = {key: json.loads((ROOT / "learning/exercises/budget-and-unknown" / filename).read_text(encoding="utf-8")) for key, filename in (
        ("budget100", "budget-100-result.json"), ("budget10", "budget-10-result.json"), ("unknown", "budget-10-unknown-result.json"))}
    (learning_dest / "examples.js").write_text("globalThis.HackathonExamples = " + json.dumps(fixtures) + ";\n", encoding="utf-8")
    js = (learning_dest / "viewer.js").read_text(encoding="utf-8")
    js = js.replace('currentReport = report;', 'currentReport = report;\n    element("download-example").disabled = !report;')
    js = js.replace('  loader.clear();', '''  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.example;
    void loader.load(new File([JSON.stringify(HackathonExamples[key])], `${key}-synthetic.json`, {type:'application/json'}));
  }));
  element('download-example').addEventListener('click', () => {
    if (!currentReport) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(currentReport, null, 2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href=url; link.download='bioscribe-synthetic-comparison.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  loader.clear();''')
    (learning_dest / "viewer.js").write_text(js, encoding="utf-8")
    manifest = {"recorded_run_id":run_id,"files":{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for folder in (dest, learning_dest) for p in sorted(folder.iterdir()) if p.is_file()}}
    (ROOT / "hackathon/assets-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps({"status":"generated", "molecules":len(entries), "recorded_run_id":run_id, "scientific_assessment":"not_assessed"}))


if __name__ == "__main__":
    main()
