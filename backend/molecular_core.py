"""One concrete-graph parser and canonical descriptor authority for current contracts.

No salt, tautomer, protonation or stereochemistry completion is performed.
"""
import hashlib
import math
import re
POLICY_VERSION = "canonical_graph/1.0.0"
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



def diagnostic(code, message, offset=None, atoms=None, bonds=None, severity="error"):
    return dict(code=code, message=message, character_offset=offset,
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



def describe(mol):
    from rdkit import Chem, rdBase
    from rdkit.Chem import Crippen, Descriptors, QED, rdMolDescriptors
    with rdBase.BlockLogs():
        canonical_smiles = Chem.MolToSmiles(mol, isomericSmiles=True)
        params = Chem.SmilesParserParams()
        params.parseName = False
        params.allowCXSMILES = False
        calculation = Chem.MolFromSmiles(canonical_smiles, params)
        if calculation is None:
            raise ValueError("canonical_graph_reparse_failed")
        mw = Descriptors.MolWt(calculation)
        tpsa = rdMolDescriptors.CalcTPSA(calculation)
        heavy = [a for a in calculation.GetAtoms() if a.GetAtomicNum() > 1]
        values = dict(molecular_weight=mw, calculated_logp=Crippen.MolLogP(calculation), tpsa=tpsa,
            aromatic_heavy_atom_fraction=sum(a.GetIsAromatic() for a in heavy)/len(heavy) if heavy else None,
            qed=QED.qed(calculation), descriptor_distance=abs(mw-350)/350+abs(tpsa-75)/75)
    return canonical_smiles, calculation, normalize(values)


def identity_sha256(canonical_smiles):
    return hashlib.sha256(canonical_smiles.encode("utf-8")).hexdigest()
