"""
Partner Ready Templates Service
Pre-configured project templates with disease context for key therapeutic areas
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import hashlib

from models.atomnet_models import (
    AtomNetTarget, AtomNetLigand, AtomNetLigandMetadata, StoredAtomNetProject
)


# ============================================================================
# TEMPLATE DEFINITIONS WITH DISEASE CONTEXT
# ============================================================================

@dataclass
class ProjectTemplate:
    """Partner-ready project template with therapeutic context"""
    id: str
    name: str
    disease_context: str  # Key differentiator - shows domain understanding
    therapeutic_area: str
    target: AtomNetTarget
    example_ligands: List[AtomNetLigand]
    key_residues: List[str]  # Binding site residues
    clinical_stage_drugs: List[str]  # Known drugs for context
    scientific_context: str  # Brief background


# ============================================================================
# ONCOLOGY TEMPLATES
# ============================================================================

EGFR_TEMPLATE = ProjectTemplate(
    id="egfr_nsclc",
    name="EGFR NSCLC Kinase Inhibitor Discovery",
    disease_context="Non-small cell lung cancer (NSCLC) - 85% of lung cancers. EGFR mutations drive ~15% of cases. Focus: overcoming T790M resistance.",
    therapeutic_area="Oncology",
    target=AtomNetTarget(
        id="EGFR_HUMAN",
        name="Epidermal growth factor receptor",
        uniprot="P00533",
        pdb_id="1M17",
        sequence="FKKIKVLGSGAFGTVYKGLWIPEGEK..."
    ),
    example_ligands=[
        AtomNetLigand(ligand_id="EGFR_001", smiles="COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OC", score=-11.5, rank=1, metadata=AtomNetLigandMetadata(source="Erlotinib-like")),
        AtomNetLigand(ligand_id="EGFR_002", smiles="C#Cc1cccc(Nc2ncnc3cc(OCCOC)c(OCCOC)cc23)c1", score=-10.8, rank=2, metadata=AtomNetLigandMetadata(source="Gefitinib-like")),
        AtomNetLigand(ligand_id="EGFR_003", smiles="COc1cc2c(Nc3ccc(Br)cc3F)ncnc2cc1OCC1CCN(C)CC1", score=-10.2, rank=3, metadata=AtomNetLigandMetadata(source="4-Anilinoquinazoline")),
    ],
    key_residues=["L718", "G719", "T790", "L792", "C797", "L858"],
    clinical_stage_drugs=["Erlotinib", "Gefitinib", "Osimertinib", "Afatinib"],
    scientific_context="EGFR kinase inhibitors revolutionized NSCLC treatment. Third-generation inhibitors target C797 to overcome T790M resistance."
)

BRAF_TEMPLATE = ProjectTemplate(
    id="braf_melanoma",
    name="BRAF V600E Melanoma Resistance",
    disease_context="Metastatic melanoma - BRAF V600E mutation in ~50% of cases. Challenge: resistance via RAF dimerization and MEK reactivation.",
    therapeutic_area="Oncology",
    target=AtomNetTarget(
        id="BRAF_HUMAN",
        name="Serine/threonine-protein kinase B-raf V600E",
        uniprot="P15056",
        pdb_id="1UWH",
        sequence="MAALSGGGGGGAEPGQALFNGDMEPEAG..."
    ),
    example_ligands=[
        AtomNetLigand(ligand_id="BRAF_001", smiles="CCCS(=O)(=O)Nc1ccc(F)c(C(=O)c2cc[nH]c2C)c1F", score=-11.2, rank=1, metadata=AtomNetLigandMetadata(source="Vemurafenib-like")),
        AtomNetLigand(ligand_id="BRAF_002", smiles="COc1cc(Nc2nc3ccc(CCNC(C)C)cc3s2)ccc1NC(=O)c1ccc(C)cc1", score=-10.5, rank=2, metadata=AtomNetLigandMetadata(source="Dabrafenib-like")),
    ],
    key_residues=["G464", "V600E", "K483", "E501", "D594", "F595"],
    clinical_stage_drugs=["Vemurafenib", "Dabrafenib", "Encorafenib"],
    scientific_context="BRAF V600E creates constitutive kinase activation. Paradox breakers avoid RAF dimer-induced pathway reactivation."
)

ABL1_TEMPLATE = ProjectTemplate(
    id="abl1_cml",
    name="ABL1 CML Imatinib-Resistant Variants",
    disease_context="Chronic myeloid leukemia (CML) - BCR-ABL fusion drives 95% of cases. Challenge: resistance mutations (T315I 'gatekeeper').",
    therapeutic_area="Oncology",
    target=AtomNetTarget(
        id="ABL1_HUMAN",
        name="Tyrosine-protein kinase ABL1",
        uniprot="P00519",
        pdb_id="2HYY",
        sequence="MGLPNSSSGSKWRPKSGNKKKKEKQQE..."
    ),
    example_ligands=[
        AtomNetLigand(ligand_id="ABL1_001", smiles="Cc1ccc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)cc1Nc1nccc(-c2cccnc2)n1", score=-12.5, rank=1, metadata=AtomNetLigandMetadata(source="Imatinib")),
        AtomNetLigand(ligand_id="ABL1_002", smiles="CC(C)c1ccc(NC(=O)Nc2ccc(C)c(Nc3nccc(-c4cncnc4)n3)c2)cc1", score=-11.8, rank=2, metadata=AtomNetLigandMetadata(source="Nilotinib-like")),
        AtomNetLigand(ligand_id="ABL1_003", smiles="CC1=C(C(=O)Nc2ccc(C(=O)Nc3cccc(CF)c3)cc2)C(c2ccc(Cl)cc2)=NO1", score=-11.2, rank=3, metadata=AtomNetLigandMetadata(source="Ponatinib-like")),
    ],
    key_residues=["T315I", "E255", "Y253", "G250", "M351", "F359"],
    clinical_stage_drugs=["Imatinib", "Nilotinib", "Dasatinib", "Ponatinib", "Asciminib"],
    scientific_context="Imatinib was the first targeted cancer therapy. Allosteric inhibitors (asciminib) address resistance by targeting myristoyl pocket."
)


# ============================================================================
# VIROLOGY TEMPLATES
# ============================================================================

HIV_PROTEASE_TEMPLATE = ProjectTemplate(
    id="hiv1_protease",
    name="HIV-1 Protease Antiretroviral Design",
    disease_context="HIV/AIDS - 38M people living with HIV globally. Protease inhibitors are cornerstone of HAART. Challenge: drug resistance mutations.",
    therapeutic_area="Virology",
    target=AtomNetTarget(
        id="POL_HIV1",
        name="HIV-1 Protease",
        uniprot="P03366",
        pdb_id="1HVR",
        sequence="PQVTLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMNLPGRWKPK..."
    ),
    example_ligands=[
        AtomNetLigand(ligand_id="HIV_001", smiles="CC(C)(C)NC(=O)[C@@H]1C[C@@H]2CCCC[C@@H]2CN1C[C@@H](O)[C@H](Cc1ccccc1)NC(=O)O[C@H]1CCOC1", score=-11.5, rank=1, metadata=AtomNetLigandMetadata(source="Indinavir-like")),
        AtomNetLigand(ligand_id="HIV_002", smiles="CC(C)CN(C[C@@H](O)[C@H](Cc1ccccc1)NC(=O)O[C@H]1CCOC1)S(=O)(=O)c1ccc(N)cc1", score=-10.8, rank=2, metadata=AtomNetLigandMetadata(source="Darunavir-like")),
    ],
    key_residues=["D25", "G27", "D29", "D30", "I50", "V82", "I84"],
    clinical_stage_drugs=["Darunavir", "Atazanavir", "Lopinavir", "Ritonavir"],
    scientific_context="HIV protease cleaves Gag-Pol polyprotein. Substrate-envelope hypothesis guides design of resistance-evading inhibitors."
)

SARSCOV2_MPRO_TEMPLATE = ProjectTemplate(
    id="sars2_mpro",
    name="SARS-CoV-2 Main Protease (MPro) COVID-19",
    disease_context="COVID-19 pandemic - MPro is essential for viral replication. Nirmatrelvir (Paxlovid) validates target. Challenge: broad-spectrum coronvirus coverage.",
    therapeutic_area="Virology",
    target=AtomNetTarget(
        id="MPRO_SARS2",
        name="SARS-CoV-2 Main protease (3CLpro)",
        uniprot="P0DTD1",
        pdb_id="6LU7",
        sequence="SGFRKMAFPSGKVEGCMVQVTCGTTTLNGLWLDDVVYCPRHVICTSEDMLNPNYEDL..."
    ),
    example_ligands=[
        AtomNetLigand(ligand_id="MPro_001", smiles="CC(C)(C)C(NC(=O)[C@@H]1C[C@H](F)CN1C(=O)[C@@H](NC(=O)c1nc2c(C#N)cccc2[nH]1)C(C)(C)C)C(=O)NC1CC1", score=-10.2, rank=1, metadata=AtomNetLigandMetadata(source="Nirmatrelvir-like")),
        AtomNetLigand(ligand_id="MPro_002", smiles="CC1=NN(c2ccc(Cl)cc2)C(=O)C1=Cc1ccc(O)c(O)c1", score=-8.8, rank=2, metadata=AtomNetLigandMetadata(source="Curcumin-derivative")),
    ],
    key_residues=["H41", "C145", "G143", "S144", "E166", "Q189"],
    clinical_stage_drugs=["Nirmatrelvir", "Ensitrelvir", "Simnotrelvir"],
    scientific_context="MPro cleaves viral polyproteins at 11 sites. Covalent inhibitors targeting C145 show potent antiviral activity."
)


# ============================================================================
# TEMPLATE REGISTRY
# ============================================================================

TEMPLATES: Dict[str, ProjectTemplate] = {
    "egfr_nsclc": EGFR_TEMPLATE,
    "braf_melanoma": BRAF_TEMPLATE,
    "abl1_cml": ABL1_TEMPLATE,
    "hiv1_protease": HIV_PROTEASE_TEMPLATE,
    "sars2_mpro": SARSCOV2_MPRO_TEMPLATE,
}


def get_template(template_id: str) -> Optional[ProjectTemplate]:
    """Get a specific template"""
    return TEMPLATES.get(template_id)


def list_templates() -> List[Dict[str, Any]]:
    """List all available templates"""
    return [
        {
            "id": t.id,
            "name": t.name,
            "disease_context": t.disease_context,
            "therapeutic_area": t.therapeutic_area,
            "target_id": t.target.id,
            "pdb_id": t.target.pdb_id,
            "ligand_count": len(t.example_ligands),
            "clinical_drugs": t.clinical_stage_drugs,
            "key_residues": t.key_residues[:4]  # First 4 for display
        }
        for t in TEMPLATES.values()
    ]


def create_project_from_template(template_id: str, partner: Optional[str] = None) -> StoredAtomNetProject:
    """Create a full project from a template"""
    template = get_template(template_id)
    if not template:
        raise ValueError(f"Unknown template: {template_id}")
    
    # Generate unique project ID
    project_id = f"template_{template_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Create project with expanded ligands
    import random
    random.seed(hash(template_id) + 42)
    
    # Generate more ligands based on template examples
    ligands = list(template.example_ligands)
    for i in range(len(ligands), 50):  # Expand to 50 ligands
        base = template.example_ligands[i % len(template.example_ligands)]
        ligands.append(AtomNetLigand(
            ligand_id=f"{template.target.id.split('_')[0]}_{i+1:03d}",
            smiles=base.smiles + "C" * (i % 3),  # Slight variation
            score=base.score + 0.2 * (i - len(template.example_ligands)) + random.gauss(0, 0.5),
            rank=i + 1,
            molecular_weight=300 + random.randint(0, 150),
            logp=2.5 + random.uniform(-1, 2),
            tpsa=60 + random.uniform(-20, 40),
            metadata=AtomNetLigandMetadata(
                source=f"Generated from {template.name}",
                batch=datetime.now().strftime("%Y-%m")
            )
        ))
    
    # Sort by score
    ligands.sort(key=lambda x: x.score)
    for i, lig in enumerate(ligands):
        lig.rank = i + 1
    
    return StoredAtomNetProject(
        project_id=project_id,
        target=template.target,
        ligands=ligands,
        partner=partner,
        source=f"Template: {template.name}",
        imported_at=datetime.now(),
        xai_generated=True,
        fair_generated=True,
        blockchain_recorded=False
    )


def get_templates_by_area(therapeutic_area: str) -> List[Dict[str, Any]]:
    """Get templates filtered by therapeutic area"""
    return [
        t for t in list_templates()
        if t["therapeutic_area"].lower() == therapeutic_area.lower()
    ]
