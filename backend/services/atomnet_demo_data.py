"""
Screening Demo Data
Pre-seeded realistic demo projects for presentations and testing.
Supports multiple screening engines (AtomNet, GNINA, Vina, Glide).
"""

from datetime import datetime, timedelta
import random
import hashlib
from typing import List, Dict

from models.atomnet_models import (
    AtomNetProject,
    AtomNetTarget,
    AtomNetLigand,
    AtomNetLigandMetadata,
    AtomNetDockingPose,
    PoseFormat,
    StoredAtomNetProject
)


# ============================================================================
# DEMO TARGETS
# ============================================================================

DEMO_TARGETS = {
    "ABL1": AtomNetTarget(
        id="ABL1_HUMAN",
        name="Tyrosine-protein kinase ABL1",
        uniprot="P00519",
        pdb_id="2HYY",
        organism="Homo sapiens",
        sequence="MGLPNSSSGSKWRPKSGNKKKKEKQQEKERDRFHPLQNQRQILNALSRQHSAYQLNSKNTFHCEEMGPPTTRHGGNPTIIHKYVPSIQHNIPVIPSSAVSIGQTEIQLSDLLVRQLSSLQPPSKGSFKLWAHGGLPVRGRLERLKGRGFRGDIRGLPQGRYNNPFSAIREGDSLVCTIKAKVLDLNNAIKRVNCGFFQTNKYLYTVLVPVLQEPVKYPLVNLSQHDPLRMLNSSLTIQLLPNHIQYQAPWFSVLEAELTSQLAPQVLALYNLIIDLPVTTPQVKHAILNLILESGRLVKRFGFEDQLRNLGPPSKLQSMLKQLERQQLLLQEMTTFFQPEE"
    ),
    "EGFR": AtomNetTarget(
        id="EGFR_HUMAN",
        name="Epidermal growth factor receptor",
        uniprot="P00533",
        pdb_id="1M17",
        organism="Homo sapiens",
        sequence="MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIRGNMYYENSYALAVLSNYDANKTGLKELPMRNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCWGAGEENCQKLTKIICAQQCSGRCRGKSPSDCCHNQCAAGCTGPRESDCLVCRKFRDEATCKDTCPPLMLYNPTTYQMDVNPEGKYSFGATCVKKCPRNYVVTDHGSCVRACGADSYEMEEDGVRKCKKCEGPCRKVCNGI"
    ),
    "BRAF": AtomNetTarget(
        id="BRAF_HUMAN",
        name="Serine/threonine-protein kinase B-raf",
        uniprot="P15056",
        pdb_id="1UWH",
        organism="Homo sapiens",
        sequence="MAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEHIEALLDKFGGEHNPPSIYLEAYEEYTSKLDALQQREQQLLESLGNGTDFSVSSSASMDTVTSSSSSSLSVLPSSLSVFQNPTDVARSNPKSPQKPIVRVFLPNKQRTVVPARCGVTVRDSLKKALMMRGLIPECCAVYRIQDGEKKPIGWDTDISWLTGEELHVEVLENVPLTTHNFVRKTFFTLAFCDFCRKLLFQGFRCQTCGYKFHQRCSTEVPLMCVNYDQLDLLFVSKFFEHHPIPQEEASLAETALTSGSSPSAPASDSIGPQIL"
    ),
    "CDK2": AtomNetTarget(
        id="CDK2_HUMAN",
        name="Cyclin-dependent kinase 2",
        uniprot="P24941",
        pdb_id="1HCK",
        organism="Homo sapiens",
        sequence="MENFQKVEKIGEGTYGVVYKARNKLTGEVVALKKIRLDTETEGVPSTAIREISLLKELNHPNIVKLLDVIHTENKLYLVFEFLHQDLKKFMDASALTGIPLPLIKSYLFQLLQGLAFCHSHRVLHRDLKPQNLLINTEGAIKLADFGLARAFGVPVRTYTHEVVTLWYRAPEILLGCKYYSTAVDIWSLGCIFAEMVTRRALFPGDSEIDQLFRIFRTLGTPDEVVWPGVTSMPDYKPSFPKWARQDFSKVVPPLDEDGRSLLSQMLHYDPNKRISAKAALAHPFFQDVTKPVPHLRL"
    ),
    "JAK2": AtomNetTarget(
        id="JAK2_HUMAN",
        name="Tyrosine-protein kinase JAK2",
        uniprot="O60674",
        pdb_id="3KRR",
        organism="Homo sapiens",
        sequence="MGMACLTMTEMEGTSTSSIYQNGDISGNANSMKQIDPVLQVYLYHSLGKSEADYLTFPSGEYVAEEICIAASKACGITPVYHNMFALMSETERIWYPPNHVFHIDESTRHNVLYRIRFYFPRWYCSGSNRAYRHGISRGAEAPLLDDFVMSYLFAQWRHDFVHGWIKVPVTHETQEECLFLERLEENRSGRRPGASEPQALPLTLVPAKVASAVGIYLDMVEGTT"
    )
}

# ============================================================================
# REALISTIC SMILES LIBRARY
# ============================================================================

KINASE_INHIBITOR_SMILES = [
    # Imatinib-like
    ("Cc1ccc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)cc1Nc1nccc(-c2cccnc2)n1", "Imatinib-analog-001"),
    ("Cc1ccc(C(=O)Nc2ccc(C)c(Nc3nccc(-c4cccnc4)n3)c2)cc1", "Imatinib-scaffold-002"),
    # Erlotinib-like  
    ("COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCOC", "Erlotinib-analog-001"),
    ("COc1cc2c(Nc3ccc(Br)cc3F)ncnc2cc1OCC1CCCCC1", "Erlotinib-variant-002"),
    # Dasatinib-like
    ("Cc1nc(Nc2ncc(C(=O)Nc3c(C)cccc3Cl)s2)cc(N2CCN(CCO)CC2)n1", "Dasatinib-analog-001"),
    ("CN1CCN(c2cc(Nc3ncc(C(=O)Nc4ccccc4C)s3)nc(C)n2)CC1", "Dasatinib-core-002"),
    # Vemurafenib-like
    ("CCCS(=O)(=O)Nc1ccc(F)c(C(=O)c2cc(F)c([nH]c3nccc(-c4ccc(Cl)cc4)n3)cc2F)c1F", "Vemurafenib-analog-001"),
    # Novel scaffolds
    ("Nc1ncnc2c1c(-c1ccc(NC(=O)c3ccccn3)cc1)cn2C1CCCCC1", "Novel-purine-001"),
    ("COc1ccc(-c2nn3c(C)nnc3c3ccccc23)cc1NC(=O)c1ccncc1", "Novel-triazole-002"),
    ("Cc1ccc2c(c1)nc(N)n2-c1ccc(-c2ccnc(NC3CCCCC3)n2)cc1", "Novel-imidazole-003"),
    # Fragment-like
    ("c1ccc(Nc2ncnc3[nH]cnc23)cc1", "Fragment-adenine-001"),
    ("Nc1ncnc2c1ncn2C1CCCC1", "Fragment-cyclopentyl-002"),
    ("O=C(Nc1ccccc1)c1ccncc1", "Fragment-pyridine-003"),
    ("Cc1ccc(S(=O)(=O)Nc2ccccc2)cc1", "Fragment-sulfonamide-004"),
    # Drug-like leads
    ("CC(C)n1nc(-c2ccc(OC(F)(F)F)cc2)c2c(N)ncnc21", "Lead-trifluoro-001"),
    ("Cn1c(=O)c2c(ncn2-c2ccc(Cl)c(Cl)c2)n(C)c1=O", "Lead-dichloro-002"),
    ("CCOc1ccc(-c2nc3ccccc3n2C(=O)c2ccccc2F)cc1", "Lead-benzimidazole-003"),
    ("Nc1nc(c2ccc(F)cc2)c(-c2cccc(C(F)(F)F)c2)s1", "Lead-thiazole-004"),
]

# ============================================================================
# DEMO PROJECT GENERATOR
# ============================================================================

def generate_demo_ligands(
    target_id: str,
    count: int = 100,
    base_score: float = -11.0,
    source: str = "AtomNet",
    engine_version: str = "v2.1.0"
) -> List[AtomNetLigand]:
    """Generate realistic demo ligands for a target"""
    random.seed(hash(target_id + source) + 42)  # Reproducible per source
    
    ligands = []
    libraries = ["Enamine_REAL_2024", "ChEMBL_Kinase_Focused", "ZINC_Lead_Like", "Internal_HTS"]
    
    for i in range(count):
        # Pick a base scaffold and mutate
        base_smiles, base_name = random.choice(KINASE_INHIBITOR_SMILES)
        
        # Simple SMILES variations
        variations = ["", "C", "CC", "F", "Cl", "O", "N"]
        suffix = random.choice(variations)
        smiles = base_smiles + suffix if random.random() > 0.3 else base_smiles
        
        # Generate score - exponential distribution (few good, many mediocre)
        # Top 5%: -12 to -10, Good 20%: -10 to -8, Mediocre: -8 to -5
        percentile = i / count
        if percentile < 0.05:
            score = random.uniform(-12.5, -10.5)
        elif percentile < 0.20:
            score = random.uniform(-10.5, -8.5)
        elif percentile < 0.50:
            score = random.uniform(-8.5, -7.0)
        else:
            score = random.uniform(-7.0, -4.5)
        
        # Molecular properties (realistic ranges)
        mw = random.uniform(280, 550)
        logp = random.uniform(1.5, 5.0)
        tpsa = random.uniform(40, 140)
        hbd = random.randint(0, 4)
        hba = random.randint(2, 10)
        
        ligand = AtomNetLigand(
            ligand_id=f"{target_id[:4]}_{i+1:05d}",
            smiles=smiles[:200],  # Limit length
            score=round(score, 2),
            rank=i + 1,  # Will be re-sorted
            metadata=AtomNetLigandMetadata(
                library_id=random.choice(libraries),
                batch=random.choice(["Q4-2024", "Q3-2024", "Q2-2024"]),
                source=source,
                model_version=f"{source} {engine_version}"
            ),
            molecular_weight=round(mw, 1),
            logp=round(logp, 2),
            tpsa=round(tpsa, 1),
            hbd=hbd,
            hba=hba
        )
        ligands.append(ligand)
    
    # Sort by score and update ranks
    ligands.sort(key=lambda x: x.score)
    for i, lig in enumerate(ligands):
        lig.rank = i + 1
    
    return ligands


def generate_demo_poses(ligands: List[AtomNetLigand], pdb_id: str) -> List[AtomNetDockingPose]:
    """Generate mock docking poses for top ligands"""
    poses = []
    for lig in ligands[:30]:  # Top 30 only
        pose = AtomNetDockingPose(
            ligand_id=lig.ligand_id,
            pose_id=f"{lig.ligand_id}_pose1",
            format=PoseFormat.PDBQT,
            data_url=f"s3://bioscribe-screening/poses/{pdb_id}/{lig.ligand_id}_pose1.pdbqt",
            rmsd=round(random.uniform(0.5, 2.5), 2)
        )
        poses.append(pose)
    return poses


def create_demo_projects() -> Dict[str, StoredAtomNetProject]:
    """Create pre-seeded demo projects for presentations - MULTI-ENGINE"""
    
    projects = {}
    
    # Project 1: ABL1 - AtomNet (Pharma partnership scenario)
    abl1_ligands = generate_demo_ligands("ABL1", count=150, base_score=-11.5, source="AtomNet")
    abl1_project = StoredAtomNetProject(
        project_id="abl1_kinase_screen_2024q4",
        target=DEMO_TARGETS["ABL1"],
        ligands=abl1_ligands,
        docking_poses=generate_demo_poses(abl1_ligands, "2HYY"),
        partner="Sanofi Oncology",
        campaign_name="CML Resistance Panel - Wave 3",
        description="Virtual screening campaign targeting imatinib-resistant ABL1 mutants. "
                    "Focus on T315I gatekeeper mutation. Library: Enamine REAL + internal HTS hits.",
        created_at=datetime.now() - timedelta(days=3),
        atomnet_version="AtomNet v2.1.0",
        imported_at=datetime.now() - timedelta(days=3),
        xai_generated=True,
        fair_generated=True,
        blockchain_recorded=True,
        source="AtomNet"
    )
    projects[abl1_project.project_id] = abl1_project
    
    # Project 2: EGFR - AtomNet (Mid-size focused screen)
    egfr_ligands = generate_demo_ligands("EGFR", count=100, base_score=-10.8, source="AtomNet")
    egfr_project = StoredAtomNetProject(
        project_id="egfr_external_screen_001",
        target=DEMO_TARGETS["EGFR"],
        ligands=egfr_ligands,
        docking_poses=generate_demo_poses(egfr_ligands, "1M17"),
        partner="Novartis Respiratory",
        campaign_name="NSCLC Third-Gen Candidates",
        description="Targeting EGFR C797S mutation found in osimertinib-resistant NSCLC. "
                    "Screening focused library of covalent warhead compounds.",
        created_at=datetime.now() - timedelta(days=7),
        atomnet_version="AtomNet v2.1.0",
        imported_at=datetime.now() - timedelta(days=7),
        xai_generated=True,
        fair_generated=True,
        blockchain_recorded=False,
        source="AtomNet"
    )
    projects[egfr_project.project_id] = egfr_project
    
    # Project 3: BRAF - AtomNet (Academic collaboration)
    braf_ligands = generate_demo_ligands("BRAF", count=75, base_score=-10.2, source="AtomNet")
    braf_project = StoredAtomNetProject(
        project_id="braf_v600e_academic_screen",
        target=DEMO_TARGETS["BRAF"],
        ligands=braf_ligands,
        docking_poses=generate_demo_poses(braf_ligands, "1UWH"),
        partner="MIT Koch Institute",
        campaign_name="BRAF V600E Allosteric Series",
        description="Exploring allosteric site adjacent to ATP pocket. Novel mechanism "
                    "to overcome paradoxical pathway activation. Academic collaboration.",
        created_at=datetime.now() - timedelta(days=14),
        atomnet_version="AtomNet v2.0.3",
        imported_at=datetime.now() - timedelta(days=14),
        xai_generated=False,
        fair_generated=True,
        blockchain_recorded=False,
        source="AtomNet"
    )
    projects[braf_project.project_id] = braf_project
    
    # =========================================================================
    # NEW: MULTI-ENGINE DEMO PROJECTS
    # =========================================================================
    
    # Project 4: CDK2 - GNINA (Open-source CNN docking)
    cdk2_ligands = generate_demo_ligands("CDK2", count=120, base_score=-10.5, source="GNINA", engine_version="v1.0")
    cdk2_project = StoredAtomNetProject(
        project_id="cdk2_gnina_screen_2024",
        target=DEMO_TARGETS["CDK2"],
        ligands=cdk2_ligands,
        docking_poses=generate_demo_poses(cdk2_ligands, "1HCK"),
        partner="Stanford Chemistry",
        campaign_name="CDK2 Academic Screen",
        description="Cell cycle inhibitor discovery using GNINA CNN-based docking. "
                    "Open-source workflow for academic reproducibility.",
        created_at=datetime.now() - timedelta(days=5),
        atomnet_version="GNINA v1.0",
        imported_at=datetime.now() - timedelta(days=5),
        xai_generated=True,
        fair_generated=True,
        blockchain_recorded=False,
        source="GNINA"
    )
    projects[cdk2_project.project_id] = cdk2_project
    
    # Project 5: JAK2 - AutoDock Vina (Classic physics-based)
    jak2_ligands = generate_demo_ligands("JAK2", count=80, base_score=-9.8, source="AutoDock Vina", engine_version="v1.2.5")
    jak2_project = StoredAtomNetProject(
        project_id="jak2_vina_screen_2024",
        target=DEMO_TARGETS["JAK2"],
        ligands=jak2_ligands,
        docking_poses=generate_demo_poses(jak2_ligands, "3KRR"),
        partner="UC Berkeley",
        campaign_name="JAK2 Myelofibrosis Study",
        description="JAK2 V617F mutation screen using AutoDock Vina. "
                    "Comparing results against known clinical inhibitors (ruxolitinib).",
        created_at=datetime.now() - timedelta(days=10),
        atomnet_version="AutoDock Vina v1.2.5",
        imported_at=datetime.now() - timedelta(days=10),
        xai_generated=False,
        fair_generated=True,
        blockchain_recorded=False,
        source="AutoDock Vina"
    )
    projects[jak2_project.project_id] = jak2_project
    
    return projects


# Pre-generated demo projects (loaded on import)
DEMO_PROJECTS = create_demo_projects()

