"""Versioned method identities; fidelity is deliberately separate from prediction."""
import re

PS00107 = "[LIV]-G-{P}-G-{P}-[FYWMGSTNH]-[SGA]-{PW}-[LIVCAT]-{PD}-x-[GSTACLIVMFY]-x(5,18)-[LIVMFYWCSTAR]-[AIVP]-[LIVMFAGCKR]-K."
PS00107_REGEX = r"[LIV]G[^P]G[^P][FYWMGSTNH][SGA][^PW][LIVCAT][^PD].[GSTACLIVMFY].{5,18}[LIVMFYWCSTAR][AIVP][LIVMFAGCKR]K"
GROUPS = {"helix_group_fraction": "EMALK", "turn_group_fraction": "NPGSD", "sheet_group_fraction": "VIYFWLT"}
ALERTS = {"nitro": "[N+](=O)[O-]", "aniline_substructure": "c1ccccc1N", "epoxide": "C1OC1", "aldehyde": "[CH]=O", "conjugated_carbonyl": "C=CC(=O)", "acyl_halide": "C(=O)[F,Cl,Br,I]", "hydrazine_substructure": "NN"}
DISABLED = ("binding_affinity", "confidence", "toxicity", "ames_mutagenicity", "herg_liability", "half_life", "renal_clearance", "elimination_route", "metabolic_stability", "cyp_substrate", "cyp_inhibition", "synthesis_feasibility", "secondary_structure", "frameshift", "esol_solubility")
MOLECULAR_INPUT_POLICY = {
    "id": "plain_smiles_concrete_graph", "version": "1.1.0",
    "parser": "RDKit 2025.03.3 SmilesParserParams",
    "parameters": {"parseName": False, "allowCXSMILES": False, "sanitize": True, "removeHs": True},
    "text": "One nonempty ASCII SMILES string without whitespace/control characters; no names or CXSMILES; no trimming or repair",
    "graph": "Nonempty sanitized graph within the atom limit; no atomic-number-zero, query atoms or query bonds",
    "identity": "Retain fragments, formal charges, isotopes and specified/unspecified stereochemistry; no salt stripping or tautomer/protonation adjustment",
    "interpretation": "Syntactic/concrete-graph eligibility only; not endpoint-specific predictive validation",
    "reference": "https://www.rdkit.org/docs/RDKit_Book.html#reading-molecule-names",
    "fixture": "tests_phase3/test_sentinel_molecules.py",
}


def method(reference, algorithm, assumptions, fixture, fidelity="fixture_checked", parameters=None):
    return {"version": "1.0.0", "reference": reference, "algorithm": algorithm,
        "parameters": parameters or {}, "assumptions": assumptions,
        "fidelity": fidelity, "fixture": fixture, "predictive_validation": None,
        "validation_status": "not_available", "owner": "BioScribe maintainers", "scientific_review": "not_performed"}


METHODS = {
    "protein_composition": method("https://biopython.org/docs/1.83/api/Bio.SeqUtils.ProtParam.html", "count(group residues)/sequence length; overlapping groups", "canonical protein only; no structural occupancy or disorder inference", "tests_phase3/test_methods.py::test_composition", parameters=GROUPS),
    "sequence_length": method("BioScribe identity policy v1", "count accepted normalized residues", "declared polymer identity; no inferred accession", "tests_phase3/test_identity.py"),
    "ps00107_observation": method("https://prosite.expasy.org/PS00107; pattern version 1, data update 1995-11-01; retrieved 2026-10-15", "regex translation; overlapping starts; longest match per start; zero-based half-open", "pattern observations only; not catalytic activity, kinase classification or a 3D pocket", "tests_phase3/test_methods.py::test_ps00107", parameters={"prosite": PS00107, "regex": PS00107_REGEX}),
    "rdkit_descriptors": method("RDKit 2025.03.3 descriptors", "MolWt, MolLogP, TPSA and aromatic heavy-atom proportion", "whole sanitized molecular graph; no salt stripping, protonation adjustment or tautomer normalization", "tests_phase3/test_methods.py::test_chemistry"),
    "structural_alert_scan": method("BioScribe limited structural rule set v1", "RDKit SMARTS matches; all rules must compile and complete", "not a toxicity assay or safety assessment", "tests_phase3/test_methods.py::test_alerts", parameters=ALERTS),
    "prioritization_heuristic": method("BioScribe descriptor distance heuristic v1; no affinity reference", "abs(MW-350)/350 + abs(TPSA-75)/75; lower is nearer chosen descriptor targets", "unvalidated dimensionless ordering; target independent; not docking or binding energy", "tests_phase3/test_methods.py::test_heuristic", parameters={"mw_target":350, "tpsa_target":75}),
    "assessment_policy": method("Accepted Phase 2 diagnostic", "abstain from unsupported predictions", "no endpoint-specific predictive validation records installed", "tests_phase3/test_contract.py"),
    "notes_review_policy": method("Accepted Phase 2 diagnostic", "retain source in protected run; do not extract scientific facts", "unverified notes require review; LLM extraction disabled", "tests_phase3/test_identity.py"),
}
for identity in ("rdkit_descriptors", "structural_alert_scan", "prioritization_heuristic"):
    METHODS[identity]["version"] = "1.1.0"
    METHODS[identity]["input_policy"] = MOLECULAR_INPUT_POLICY

def specification(units,shape):
    return {"units":units,"shape":shape}

OUTPUTS={
    "sequence_length":{"sequence_length":specification("residues","count")},
    "protein_composition":{name:specification("dimensionless","fraction") for name in GROUPS},
    "ps00107_observation":{"PS00107_pattern_matches":specification("count","count"),"PS00107_match_interval":specification("zero_based_half_open","interval")},
    "rdkit_descriptors":{"molecular_weight":specification("g/mol","nonnegative"),"calculated_logp":specification("dimensionless","number"),"tpsa":specification("angstrom^2","nonnegative"),"aromatic_heavy_atom_fraction":specification("dimensionless","fraction")},
    "structural_alert_scan":{**{name:specification("zero_based_atom_indices","indices") for name in ALERTS},"matches_in_limited_rule_set":specification("count","count"),"structural_alert_scan":specification("dimensionless","null")},
    "prioritization_heuristic":{"descriptor_distance":specification("dimensionless","nonnegative")},
    "assessment_policy":{name:specification(None,"null") for name in DISABLED},
    "notes_review_policy":{"source_notes":specification(None,"null")},
}
for identity,outputs in OUTPUTS.items():
    METHODS[identity]["outputs"]=outputs


def field_suffix(method_id, quantity):
    """Canonical field names are part of interpretation, not arbitrary display text."""
    if method_id == "sequence_length":
        return "length"
    if method_id == "ps00107_observation":
        return "ps00107_count" if quantity == "PS00107_pattern_matches" else "ps00107.{index}"
    if method_id == "structural_alert_scan":
        if quantity == "matches_in_limited_rule_set":
            return "alert_match_count"
        if quantity == "structural_alert_scan":
            return "alerts"
        return f"alert.{quantity}.{{index}}"
    if method_id == "prioritization_heuristic":
        return "prioritization_heuristic"
    if method_id == "notes_review_policy":
        return "review"
    return quantity


for identity, method_outputs in OUTPUTS.items():
    for quantity, spec in method_outputs.items():
        spec["field_suffix"] = field_suffix(identity, quantity)


def motif_intervals(sequence):
    pattern = re.compile(f"(?=({PS00107_REGEX}))")
    return [(match.start(), match.start() + len(match.group(1))) for match in pattern.finditer(sequence)]
