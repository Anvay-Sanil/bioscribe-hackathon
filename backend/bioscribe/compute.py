"""Offline computations. No model download, external inference or safety prediction."""
import importlib.metadata
from pathlib import Path
import platform
from .config import LIMITS
from .identity import canonical, digest, parse_input
from .registry import ALERTS, DISABLED, GROUPS, METHODS, MOLECULAR_INPUT_POLICY, motif_intervals
from .provenance import source_digest, source_snapshot
from .schemas import Artifact, ChemicalIdentity, Coverage, Evidence, Manifest, RunRequest

PINS = {"biopython": "1.83", "rdkit": "2025.3.3", "numpy": "1.26.4"}


def dependency_versions():
    return {name: importlib.metadata.version(name) for name in locked_dependencies()}


def locked_dependencies():
    lock = Path(__file__).parent.parent / "requirements-phase3.lock"
    return dict(line.strip().split("==",1) for line in lock.read_text(encoding="utf-8").splitlines() if line.strip() and not line.startswith("#"))


def check_dependencies():
    if dependency_versions() != locked_dependencies() or any(importlib.metadata.version(name) != version for name,version in PINS.items()):
        raise RuntimeError("dependency_version_mismatch")


def manifest():
    root = Path(__file__).parent
    lock = root.parent / "requirements-phase3.lock"
    return Manifest(code_sha256=source_digest(source_snapshot()),
        registry_sha256=digest(canonical(METHODS)), dependency_lock_sha256=digest(lock.read_text(encoding="utf-8")),
        installation_lock_sha256=digest((root.parent/"requirements-phase3-install.lock").read_text(encoding="utf-8")),
        dependencies=dependency_versions(), python_version=platform.python_version(), parameters=LIMITS)


def output(run_id, input_hash, field_id, quantity, value, method_id, size=1, units="dimensionless", category="computed_descriptor", reason="Computed descriptor; not a predictive assessment", state="succeeded"):
    absent = value is None
    method = METHODS[method_id]
    return Evidence(run_id=run_id, input_sha256=input_hash, field_id=field_id, quantity=quantity, value=value,
        units=units, method_id=method_id, method_version=method["version"], evidence_category=category,
        implementation_fidelity=method["fidelity"], fidelity_record=method["fixture"],
        validation_record=None, validation_status="not_applicable" if category in {"computed_descriptor", "structural_rule_observation"} else "not_available",
        validation_reason="No predictive claim" if category in {"computed_descriptor", "structural_rule_observation"} else "No endpoint-specific validation record",
        domain="undetermined" if absent else "in_domain", domain_reason="No supported predictive domain" if absent else "Accepted by the declared method input policy",
        coverage=Coverage(total=size, analyzed=0 if absent else size, complete=(size == 0 or not absent), coordinate_system="molecule" if field_id.startswith("molecule.") else "zero_based_half_open", reason="Not computed" if absent else "Entire accepted input"),
        assessment_status="not_assessed" if absent else "observed" if category == "structural_rule_observation" else "computed",
        execution_status=state, reason=reason)


def abstentions(run_id, input_hash, prefix, reason="Endpoint-specific validation unavailable", state="unavailable"):
    return [output(run_id, input_hash, f"{prefix}.{name}", name, None, "assessment_policy", units=None,
        category="model_prediction", reason="Nucleotide variant and versioned reference/transcript context are required; frameshift analysis is disabled" if name=="frameshift" else reason,
        state="unsupported_input" if name=="frameshift" else state) for name in DISABLED]


def heuristic(mw, tpsa):
    return abs(mw - 350) / 350 + abs(tpsa - 75) / 75


def parse_supported_smiles(smiles):
    from molecular_core import parse
    return parse(smiles)[0]


def chemistry(run_id, smiles, index):
    from rdkit import Chem, rdBase
    from rdkit.Chem import Crippen, Descriptors, rdMolDescriptors
    input_hash = digest(smiles)
    prefix = f"molecule.{index}"
    mol = parse_supported_smiles(smiles)
    policy = ["canonical_graph/1.0.0: canonical reparse and 8-decimal descriptors; diagnostics refer to input, alert indices to canonical graph", "plain_smiles_concrete_graph/1.2.0: no names, CXSMILES, whitespace, dummy/query atoms or query bonds", "Isomeric canonical SMILES; isotopes retained", "Formal charge preserved", "All fragments retained; no parent/salt stripping", "Tautomer and protonation state preserved; no pH assumed", "Unspecified stereochemistry remains unspecified", "RDKit sanitization and hydrogen representation v2025.03.3"]
    if mol is None:
        identity = ChemicalIdentity(identity_sha256=None, input_sha256=input_hash, canonical_isomeric_smiles=None, formal_charge=None, fragments=None, stereocenters=[], policies=policy, status="unsupported_input")
        return identity, abstentions(run_id, input_hash, prefix, "Input rejected by canonical_graph/1.0.0; no molecular assessment", "unsupported_input") + [output(run_id,input_hash,prefix+".alerts","structural_alert_scan",None,"structural_alert_scan",category="structural_rule_observation",reason="Unsupported molecular input; no rule scan performed",state="unsupported_input")]
    from molecular_core import describe, identity_sha256
    canonical_smiles, mol, values = describe(mol)
    identity = ChemicalIdentity(identity_sha256=identity_sha256(canonical_smiles), input_sha256=input_hash, canonical_isomeric_smiles=canonical_smiles, formal_charge=Chem.GetFormalCharge(mol), fragments=len(Chem.GetMolFrags(mol)), stereocenters=[f"{atom}:{label}" for atom,label in Chem.FindMolChiralCenters(mol,includeUnassigned=True)], policies=policy,status="identified")
    fields = abstentions(run_id,input_hash,prefix)
    for name,unit in [("molecular_weight","g/mol"),("calculated_logp","dimensionless"),("tpsa","angstrom^2"),("aromatic_heavy_atom_fraction","dimensionless"),("qed","dimensionless")]:
        value = values[name]
        fields.append(output(run_id,input_hash,prefix+"."+name,name,value,"rdkit_descriptors",units=unit,state="succeeded" if value is not None else "unsupported_input"))
    fields.append(output(run_id,input_hash,prefix+".prioritization_heuristic","descriptor_distance",values["descriptor_distance"],"prioritization_heuristic",category="unvalidated_heuristic",reason="Unvalidated, target-independent, dimensionless; lower is closer to chosen descriptor targets"))
    observations=[]
    try:
        for rule, pattern in ALERTS.items():
            with rdBase.BlockLogs():
                compiled=Chem.MolFromSmarts(pattern)
            if compiled is None:
                raise ValueError("invalid_rule")
            matches=mol.GetSubstructMatches(compiled, maxMatches=10000)
            if len(matches) >= 10000:
                raise ValueError("match_limit")
            for number, match in enumerate(matches):
                observations.append(output(run_id,input_hash,f"{prefix}.alert.{rule}.{number}",rule,list(match),"structural_alert_scan",units="zero_based_atom_indices",category="structural_rule_observation",reason="Substructure match only; toxicity not assessed"))
        fields.extend(observations)
        fields.append(output(run_id,input_hash,prefix+".alert_match_count","matches_in_limited_rule_set",len(observations),"structural_alert_scan",units="count",category="structural_rule_observation",reason="Complete limited-rule scan; zero matches does not establish safety"))
    except Exception:
        fields.append(output(run_id,input_hash,prefix+".alerts","structural_alert_scan",None,"structural_alert_scan",category="structural_rule_observation",reason="Rule scan failed; no negative finding available",state="failed"))
    return identity, fields


def compute(run_id: str, payload: dict) -> dict:
    check_dependencies()
    initial_manifest=manifest()
    request=RunRequest.model_validate(payload)
    identity=parse_input(request)
    fields=[]
    chemicals=[]
    if request.polymer_type == "notes":
        item=output(run_id,identity.content_sha256,"notes.review","source_notes",None,"notes_review_policy",size=len(request.content),units=None,category="unverified_extraction",reason="Needs source review; no LLM extraction performed",state="unavailable")
        fields.append(Evidence.model_validate({**item.model_dump(),"assessment_status":"needs_review"}))
    for index,record in enumerate(identity.records):
        prefix=f"record.{index}"
        seq=record.sequence
        fields.append(output(run_id,record.normalized_sha256,prefix+".length","sequence_length",len(seq),"sequence_length",size=len(seq),units="residues"))
        fields.extend(abstentions(run_id,record.normalized_sha256,prefix,"Nucleotide/reference context and a supported implementation are required" if request.polymer_type != "protein" else "No endpoint-specific model validation or required reference context"))
        if request.polymer_type == "protein":
            from Bio.SeqUtils.ProtParam import ProteinAnalysis
            fractions=ProteinAnalysis(seq).secondary_structure_fraction()
            for name,value in zip(GROUPS,fractions):
                fields.append(output(run_id,record.normalized_sha256,prefix+"."+name,name,float(value),"protein_composition",size=len(seq),reason="Overlapping residue-group composition; not secondary-structure occupancy"))
            intervals=motif_intervals(seq)
            fields.append(output(run_id,record.normalized_sha256,prefix+".ps00107_count","PS00107_pattern_matches",len(intervals),"ps00107_observation",size=len(seq),units="count",category="structural_rule_observation",reason="Pattern observation; no protein function or binding-pocket assessment"))
            for n,(start,end) in enumerate(intervals):
                fields.append(output(run_id,record.normalized_sha256,f"{prefix}.ps00107.{n}","PS00107_match_interval",[start,end],"ps00107_observation",size=len(seq),units="zero_based_half_open",category="structural_rule_observation",reason="Longest match per start; overlapping starts retained"))
    for index,smiles in enumerate(request.molecules):
        chemical,observations=chemistry(run_id,smiles,index)
        chemicals.append(chemical)
        fields.extend(observations)
    if manifest()!=initial_manifest:
        raise RuntimeError("runtime_source_changed")
    artifact=Artifact(run_id=run_id,input_identity=identity,chemical_identities=chemicals,outputs=fields,manifest=initial_manifest)
    rendered=artifact.model_dump()
    if len(canonical(rendered).encode()) > LIMITS["output_bytes"]:
        raise ValueError("output_limit")
    return rendered
