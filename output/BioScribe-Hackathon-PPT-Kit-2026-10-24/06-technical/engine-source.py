"""Bounded offline molecular descriptors, diagnostics and exact replay.

Uploaded source text is evidence only. It is never imported or executed.
Scientific payload uses 8-decimal reporting precision; runtime metadata is separate.
"""
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import platform
import re
import uuid
from .schemas import Bundle, Diagnostic, LabRequest, Molecule, Property, QUANTITIES, Ranking, Reference, ReplayPackage, Result

ROOT = Path(__file__).parent
SOURCE_NAMES = ("__init__.py", "schemas.py", "engine.py")
POLICIES = ["Original input preserved byte-for-byte as UTF-8; no whitespace repair",
    "RDKit sanitization and removal of representational explicit hydrogens",
    "Canonical isomeric SMILES; preserve isotopes, charge, fragments, tautomer and protonation",
    "No salt stripping, tautomer merging, pH assumption or stereo completion",
    "Atom/bond indices refer to the parsed graph, not character offsets"]


def normalize(value):
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("non_finite_value")
        value = round(value, 8)
        return int(value) if value.is_integer() else value
    if isinstance(value, list):
        return [normalize(v) for v in value]
    if isinstance(value, dict):
        return {k: normalize(v) for k, v in value.items()}
    return value


def canonical(value):
    return json.dumps(normalize(value), sort_keys=True, ensure_ascii=True, separators=(",", ":"), allow_nan=False)


def sha(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def load_bundle():
    return Bundle(sources={name: (ROOT/name).read_text(encoding="utf-8") for name in SOURCE_NAMES},
        dependency_lock=(ROOT.parent/"requirements-phase3.lock").read_text(encoding="utf-8"),
        references={p.name: p.read_bytes().decode("utf-8") for p in sorted((ROOT/"references").glob("*.json"))})


def engine_hash(bundle):
    return sha(canonical({"sources": bundle.sources, "dependency_lock": bundle.dependency_lock}))


def runtime_check(bundle):
    pins = dict(line.strip().split("==", 1) for line in bundle.dependency_lock.splitlines() if line.strip() and not line.startswith("#"))
    if platform.python_version_tuple()[:2] != ("3", "11") or not pins or any(importlib.metadata.version(k) != v for k, v in pins.items()):
        raise ValueError("incompatible_runtime")


def diagnostic(code, message, offset=None, atoms=None, bonds=None, severity="error"):
    return Diagnostic(code=code, message=message, character_offset=offset,
        atom_indices=atoms or [], bond_indices=bonds or [], severity=severity)


def parse(smiles):
    from rdkit import Chem, rdBase
    if not smiles:
        return None, [diagnostic("empty_input", "Supply one plain SMILES string; this record is empty.")]
    if "|" in smiles:
        return None, [diagnostic("unsupported_annotation", "CXSMILES annotations are unsupported; no text was discarded.", smiles.index("|"))]
    for pos, char in enumerate(smiles):
        if ord(char) > 127:
            return None, [diagnostic("non_ascii_character", "Non-ASCII character; check for look-alike letters.", pos)]
        if ord(char) <= 32 or ord(char) == 127:
            return None, [diagnostic("whitespace_or_control", "Whitespace, names and multi-record strings are unsupported; use separate rows.", pos)]
    params = Chem.SmilesParserParams()
    params.parseName = False
    params.allowCXSMILES = False
    params.sanitize = False
    params.removeHs = False
    with rdBase.BlockLogs():
        try:
            mol = Chem.MolFromSmiles(smiles, params)
        except (ValueError, RuntimeError):
            mol = None
        if mol is None:
            # Lexical hints only after a parse failure, outside bracket atom syntax.
            outside = re.sub(r"\[[^\]]*\]", "", smiles)
            rings = re.findall(r"%\d{2}|\d", outside)
            if any(rings.count(r) % 2 for r in set(rings)):
                return None, [diagnostic("ring_closure", "Unpaired ring label; check matching ring closures.")]
            if outside.count("(") != outside.count(")"):
                return None, [diagnostic("branch_syntax", "Unbalanced branch parentheses.")]
            return None, [diagnostic("smiles_syntax", "RDKit could not parse this SMILES. No repair was attempted.")]
        if not 1 <= mol.GetNumAtoms() <= 256:
            return None, [diagnostic("atom_limit", "Accepted graph size is 1–256 atoms before hydrogen removal.")]
        dummy = [a.GetIdx() for a in mol.GetAtoms() if a.GetAtomicNum() == 0]
        if dummy:
            return None, [diagnostic("dummy_atom", "Unresolved dummy atoms cannot receive concrete descriptors.", atoms=dummy)]
        if any(a.HasQuery() for a in mol.GetAtoms()) or any(b.HasQuery() for b in mol.GetBonds()):
            return None, [diagnostic("query_graph", "Query atoms/bonds are not concrete molecular structures.")]
        if any(a.GetAtomMapNum() for a in mol.GetAtoms()):
            return None, [diagnostic("atom_map", "Atom maps are unsupported in this identity policy; submit an explicitly curated unmapped record.")]
        if any(str(a.GetChiralTag()) not in {"CHI_UNSPECIFIED", "CHI_TETRAHEDRAL_CW", "CHI_TETRAHEDRAL_CCW"} for a in mol.GetAtoms()):
            return None, [diagnostic("unsupported_stereo", "Only tetrahedral atom and ordinary double-bond stereochemistry are supported.")]
        if any(str(b.GetBondType()) not in {"SINGLE", "DOUBLE", "TRIPLE", "AROMATIC"} for b in mol.GetBonds()):
            return None, [diagnostic("unsupported_bond", "Only concrete single, double, triple and aromatic bonds are supported.")]
        problems = Chem.DetectChemistryProblems(mol)
        if problems:
            items = []
            for p in problems:
                code = "invalid_valence" if p.GetType() == "AtomValenceException" else "aromaticity_failure" if "Kekul" in p.GetType() else "sanitization_failure"
                atoms = [p.GetAtomIdx()] if hasattr(p, "GetAtomIdx") else list(p.GetAtomIndices()) if hasattr(p, "GetAtomIndices") else []
                items.append(diagnostic(code, {"invalid_valence": "Atom valence exceeds the allowed RDKit model.", "aromaticity_failure": "Aromatic graph could not be kekulized.", "sanitization_failure": "Graph failed RDKit chemical sanitization."}[code], atoms=atoms))
            return None, items
        try:
            Chem.SanitizeMol(mol)
            mol = Chem.RemoveHs(mol)
            Chem.AssignStereochemistry(mol, cleanIt=True, force=True)
        except (ValueError, RuntimeError):
            return None, [diagnostic("sanitization_failure", "Graph failed RDKit chemical sanitization.")]
        warnings = []
        for item in Chem.FindPotentialStereo(mol):
            if str(item.specified) != "Specified":
                bond = "Bond" in str(item.type)
                warnings.append(diagnostic("unspecified_stereo", "Potential double-bond geometry is unspecified." if bond else "Potential atom stereochemistry is unspecified.", atoms=[] if bond else [item.centeredOn], bonds=[item.centeredOn] if bond else [], severity="warning"))
        if len(Chem.GetMolFrags(mol)) > 1:
            warnings.append(diagnostic("multiple_fragments", "All fragments retained; this is not a salt-stripped parent identity.", severity="warning"))
        if Chem.GetFormalCharge(mol):
            warnings.append(diagnostic("charged_graph", "Formal charge retained; no pH or neutralization assumed.", severity="warning"))
    return mol, warnings


def frozen_records(bundle):
    snapshot = json.loads(bundle.references["snapshot.json"])
    records = []
    for r in snapshot["records"]:
        if sha(bundle.references[r["filename"]]) != r["raw_sha256"]:
            raise ValueError("reference_integrity_failure")
        raw = json.loads(bundle.references[r["filename"]])
        if r["source"] == "PubChem":
            source = raw["PropertyTable"]["Properties"][0]
            sid = str(source["CID"])
            smiles = source.get("SMILES", source.get("IsomericSMILES"))
            key = source["InChIKey"]
        else:
            sid = raw["molecule_chembl_id"]
            smiles = raw["molecule_structures"]["canonical_smiles"]
            key = raw["molecule_structures"]["standard_inchi_key"]
        if (sid, smiles, key) != (r["identifier"], r["smiles"], r["inchi_key"]):
            raise ValueError("reference_mapping_failure")
        mol, _ = parse(smiles)
        if mol is None:
            raise ValueError("unsupported_reference_graph")
        from rdkit import Chem
        records.append((Chem.MolToSmiles(mol, isomericSmiles=True), Reference(**{k:r[k] for k in ("source", "identifier", "label", "raw_sha256", "retrieved_utc", "source_version", "url")})))
    return records


def property_record(name, value=None, availability="computed", reason="Calculated from the accepted graph; not an experimental measurement."):
    units, category = QUANTITIES[name]
    return Property(quantity=name, value=value, units=units, availability=availability,
        assessment_status="computed" if availability == "computed" else "not_assessed", evidence_category=category,
        domain={"computed": "accepted_graph", "not_computed": "unsupported_input", "not_applicable": "undefined_quantity", "not_available": "not_established"}[availability],
        coverage="complete" if availability == "computed" else "none", reason=reason)


def rank(rows, budget):
    empty = dict(budget=budget, heuristic_order=[], qed_order=[], heuristic_selection=[], qed_selection=[])
    if any(r.status != "identified" or any(p.availability != "computed" for p in r.properties if p.quantity in {"descriptor_distance", "qed"}) for r in rows):
        return Ranking(status="not_assessed", reason="Every input must have both scores; rejected or missing rows are never dropped.", **empty)
    if len({r.identity_sha256 for r in rows}) != len(rows):
        return Ranking(status="not_assessed", reason="Duplicate graph identities require explicit curation before selecting a library.", **empty)
    def order(quantity, reverse=False):
        return [r.index for r in sorted(rows, key=lambda r: ((-1 if reverse else 1)*next(p.value for p in r.properties if p.quantity == quantity), r.input_sha256, r.index))]
    h, q = order("descriptor_distance"), order("qed", True)
    return Ranking(status="computed", reason="Complete unique library; fixed budget and label-independent tie-break.", budget=budget, heuristic_order=h, qed_order=q, heuristic_selection=h[:budget], qed_selection=q[:budget])


def analyze(request, bundle=None):
    from rdkit import Chem, rdBase
    from rdkit.Chem import Crippen, Descriptors, QED, rdMolDescriptors
    request = LabRequest.model_validate(request)
    bundle = bundle or load_bundle()
    runtime_check(bundle)
    refs = frozen_records(bundle)
    rows = []
    for index, original in enumerate(request.molecules):
        mol, diagnostics = parse(original)
        values = {}
        if mol is not None:
            with rdBase.BlockLogs():
                # Canonical atom ordering makes summation independent of alternate spellings.
                canonical_smiles = Chem.MolToSmiles(mol, isomericSmiles=True)
                calculation = Chem.MolFromSmiles(canonical_smiles)
                mw = Descriptors.MolWt(calculation)
                tpsa = rdMolDescriptors.CalcTPSA(calculation)
                heavy = [a for a in calculation.GetAtoms() if a.GetAtomicNum() > 1]
                values = dict(molecular_weight=mw, calculated_logp=Crippen.MolLogP(calculation), tpsa=tpsa,
                    aromatic_heavy_atom_fraction=sum(a.GetIsAromatic() for a in heavy)/len(heavy) if heavy else None,
                    qed=QED.qed(calculation), descriptor_distance=abs(mw-350)/350 + abs(tpsa-75)/75)
        else:
            canonical_smiles = None
        fields = []
        for name, (_, category) in QUANTITIES.items():
            if category == "model_prediction":
                fields.append(property_record(name, availability="not_available", reason="No endpoint-specific validated model or applicability domain. Assessment unavailable."))
            elif mol is None:
                fields.append(property_record(name, availability="not_computed", reason="Input rejected; see the structured diagnostics. No numeric value was computed."))
            elif values[name] is None:
                fields.append(property_record(name, availability="not_applicable", reason="No heavy atoms: the fraction has a zero denominator and is undefined."))
            else:
                fields.append(property_record(name, normalize(values[name]), reason="Unvalidated target-independent descriptor distance; lower is closer to MW 350 and TPSA 75." if name == "descriptor_distance" else "Calculated descriptor; 8-decimal reporting precision, no biological assessment."))
        matches = [r for smi, r in refs if smi == canonical_smiles]
        rows.append(Molecule(index=index, original_smiles=original, input_sha256=sha(original),
            status="identified" if mol is not None else "rejected", canonical_smiles=canonical_smiles,
            identity_sha256=sha(canonical_smiles) if canonical_smiles else None,
            formal_charge=Chem.GetFormalCharge(mol) if mol is not None else None,
            fragments=len(Chem.GetMolFrags(mol)) if mol is not None else None,
            normalization_history=POLICIES if mol is not None else [POLICIES[0], "Rejected without normalization"],
            diagnostics=diagnostics, properties=fields, references=matches,
            reference_status="matched_frozen_record" if matches else "not_available" if mol is not None else "not_computed"))
    groups = {}
    for r in rows:
        if r.identity_sha256:
            groups.setdefault(r.identity_sha256, []).append(r.index)
    return Result(request_sha256=sha(canonical(request.model_dump())), engine_sha256=engine_hash(bundle),
        snapshot_sha256=sha(canonical(bundle.references)), rows=rows, identity_groups=list(groups.values()), ranking=rank(rows, request.budget))


def make_package(request, run_id=None):
    request = LabRequest.model_validate(request)
    bundle = load_bundle()
    result = analyze(request, bundle)
    if load_bundle() != bundle:
        raise ValueError("engine_changed_during_run")
    return ReplayPackage(run_id=run_id or uuid.uuid4().hex, request=request, result=result,
        result_sha256=sha(canonical(result.model_dump())), bundle=bundle,
        runtime={"python": platform.python_version(), "platform": platform.platform(), "rdkit": importlib.metadata.version("rdkit")})


def verify(package, recompute=True):
    package = ReplayPackage.model_validate(package)
    if package.result.request_sha256 != sha(canonical(package.request.model_dump())) or package.result.engine_sha256 != engine_hash(package.bundle) or package.result.snapshot_sha256 != sha(canonical(package.bundle.references)) or package.result_sha256 != sha(canonical(package.result.model_dump())):
        raise ValueError("package_integrity_failure")
    if len(package.result.rows) != len(package.request.molecules) or any((r.index, r.original_smiles, r.input_sha256) != (i, s, sha(s)) for i, (r, s) in enumerate(zip(package.result.rows, package.request.molecules))):
        raise ValueError("input_result_binding_failure")
    if recompute:
        installed = load_bundle()
        if package.bundle != installed:
            raise ValueError("historical_engine_unavailable")
        result = analyze(package.request, installed)
        actual = sha(canonical(result.model_dump()))
        if actual != package.result_sha256:
            raise ValueError("replay_result_mismatch")
        return {"status": "matched", "expected_sha256": package.result_sha256, "actual_sha256": actual,
            "scientific_assessment": "not_assessed", "comparison": "Exact canonical scientific payload at declared 8-decimal precision", "network": "not_required"}
    return package
