"""
Mock AtomNet Adapter
Generates fake AtomNet-like results for development and demos.

Usage:
    adapter = MockAtomNet()
    results = adapter.screen(protein_target, ligand_library)
    
To switch to real AtomNet:
    adapter = RealAtomNet(api_key="...")  # When available
"""

import random
import hashlib
import string
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

try:
    from models.atomnet_models import (
        AtomNetProject,
        AtomNetTarget,
        AtomNetLigand,
        AtomNetLigandMetadata,
        AtomNetDockingPose,
        PoseFormat
    )
except ImportError:
    # For standalone testing
    AtomNetProject = dict
    AtomNetTarget = dict
    AtomNetLigand = dict
    AtomNetLigandMetadata = dict
    AtomNetDockingPose = dict
    PoseFormat = str

logger = logging.getLogger(__name__)


# ============================================================================
# SAMPLE DATA
# ============================================================================

SAMPLE_TARGETS = [
    {
        "id": "ABL1_HUMAN",
        "name": "Tyrosine-protein kinase ABL1",
        "uniprot": "P00519",
        "pdb_id": "2HYY",
        "sequence": "MGLPNSSSGSKWRPKSGNKKKKEKQQEKERDRFHPLQNQRQILNALSRQHSAYQLNSKNTFHCEEMGPPTTRHGGNPTIIHKYVPSIQHNIPVIPSSAVSIGQTEIQLSDLLVRQLSSLQPPSKGSFKLWAHGGLPVRGRLERLKGRGFRGDIRGLPQGRYNNPFSAIREGDSLVCTIKAKVLDLNNAIKRVNCGFFQTNKYLYTVLVPVLQEPVKYPLVNLSQHDPLRMLNSSLTIQLLPNHIQYQAPWFSVLEAELTSQLAPQVLALYNLIIDLPVTTPQVKHAILNLILESGRLVKRFGFEDQLRNLGPPSKLQSMLKQLERQQLLLQEMTTFFQPEEYNKEISKFAVVHPMRSKLLQLLLTGLRPGSGQPKQGRLQHMQSQQQLQRMLPPPPKTTRKLL"
    },
    {
        "id": "EGFR_HUMAN",
        "name": "Epidermal growth factor receptor",
        "uniprot": "P00533",
        "pdb_id": "1M17",
        "sequence": "MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIRGNMYYENSYALAVLSNYDANKTGLKELPMRNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCWGAGEENCQKLTKIICAQQCSGRCRGKSPSDCCHNQCAAGCTGPRESDCLVCRKFRDEATCKDTCPPLMLYNPTTYQMDVNPEGKYSFGATCVKKCPRNYVVTDHGSCVRACGADSYEMEEDGVRKCKKCEGPCRKVCNGIGIGEFKDSLSINATNIKHFKNCTSISGDLHI"
    },
    {
        "id": "BRAF_HUMAN",
        "name": "Serine/threonine-protein kinase B-raf",
        "uniprot": "P15056",
        "pdb_id": "1UWH",
        "sequence": "MAALSGGGGGGAEPGQALFNGDMEPEAGAGAGAAASSAADPAIPEEVWNIKQMIKLTQEHIEALLDKFGGEHNPPSIYLEAYEEYTSKLDALQQREQQLLESLGNGTDFSVSSSASMDTVTSSSSSSLSVLPSSLSVFQNPTDVARSNPKSPQKPIVRVFLPNKQRTVVPARCGVTVRDSLKKALMMRGLIPECCAVYRIQDGEKKPIGWDTDISWLTGEELHVEVLENVPLTTHNFVRKTFFTLAFCDFCRKLLFQGFRCQTCGYKFHQRCSTEVPLMCVNYDQLDLLFVSKFFEHHPIPQEEASLAETALTSGSSPSAPASDSIGPQILTSPSPSKSIPIPQPFRPADEDHRNQFGQRDRSSSAPNVHINTIEPVNIDDLIRDQGFRGDGGSTTGLSATPPASLPGSLTNVKALQKSPGPQRERKSSSSSEDRNRMKTLGRRDSSDDWEIPDGQITVGQRIGSGSFGTVYKGKWHGDVAVKMLNVTAPTPQQLQAFKNEVGVLRKTRHVNILLFMGYSTKPQLAIVTQWCEGSSLYHHLHASETKFEMKKLIDIARQTAQGMDYLHAKNIIHRDMKSNNIFLHEGLTVKIGDFGLATVKSRWSGSHQFEQLSGSILWMAPEVIRMQDNNPFSFQSDVYSYGIVLYELMTGQLPYSNINNRDQIIFMVGRGYASPDLSKLYKNCPKAMKRLVADCVKKVKEERPLFPQILSSIELLQHSLPKINRSASEPSLHRAAHTEDIN"
    }
]

SAMPLE_SMILES_TEMPLATES = [
    # Kinase inhibitor-like scaffolds
    "Cc1ccc(NC(=O)c2ccccc2)cc1",
    "CC(=O)Oc1ccccc1C(=O)O",
    "c1ccc2c(c1)ccc3ccccc32",
    "Nc1ccc(S(=O)(=O)Nc2ccccc2)cc1",
    "COc1ccc(C(=O)Nc2ccccc2)cc1",
    "Cc1nc(N)nc(N)c1N=Nc2ccc(S(=O)(=O)N)cc2",
    "CC(C)Cc1ccc(C(C)C(=O)O)cc1",
    "c1ccc2[nH]c(-c3ccccc3)nc2c1",
    "Cn1cnc2c1c(=O)n(C)c(=O)n2C",
    "CC(C)(C)NCC(O)COc1ccccc1",
    "Nc1ncnc2c1ncn2C3OC(CO)C(O)C3O",
    "CC(=O)Nc1ccc(O)cc1",
    "c1ccc(Nc2ncnc3ccccc23)cc1",
    "Clc1ccc(Oc2ccccc2)cc1",
    "COc1ccc(CCN)cc1OC"
]


class MockAtomNet:
    """
    Mock adapter that simulates AtomNet virtual screening results.
    
    This allows full development and demo of the AtomNet integration
    without requiring access to real AtomNet API.
    """
    
    def __init__(
        self,
        model_version: str = "AtomNet v2.0 (mock)",
        random_seed: Optional[int] = None
    ):
        self.model_version = model_version
        if random_seed:
            random.seed(random_seed)
        
        logger.info(f"MockAtomNet initialized: {model_version}")
    
    def screen(
        self,
        target: Optional[Dict[str, Any]] = None,
        library_size: int = 100,
        partner: str = "Demo Partner",
        project_id: Optional[str] = None
    ) -> AtomNetProject:
        """
        Simulate a virtual screening run.
        
        Args:
            target: Target protein info (uses random if not provided)
            library_size: Number of ligands to generate
            partner: Partner organization name
            project_id: Custom project ID (auto-generated if not provided)
        
        Returns:
            AtomNetProject with screening results
        """
        # Select or use provided target
        if target is None:
            target_data = random.choice(SAMPLE_TARGETS)
        else:
            target_data = target
        
        # Generate project ID
        if project_id is None:
            project_id = self._generate_project_id(target_data.get("id", "TARGET"))
        
        # Create target model
        atomnet_target = AtomNetTarget(
            id=target_data.get("id", "UNKNOWN"),
            name=target_data.get("name"),
            uniprot=target_data.get("uniprot"),
            pdb_id=target_data.get("pdb_id"),
            sequence=target_data.get("sequence"),
            organism="Homo sapiens"
        )
        
        # Generate ligands with scores
        ligands = self._generate_ligands(library_size, target_data)
        
        # Sort by score (lower is better for binding energy)
        ligands.sort(key=lambda x: x.score)
        
        # Update ranks
        for i, lig in enumerate(ligands):
            lig.rank = i + 1
        
        # Generate some docking poses for top ligands
        poses = self._generate_poses(ligands[:20])
        
        # Create project
        project = AtomNetProject(
            project_id=project_id,
            target=atomnet_target,
            ligands=ligands,
            docking_poses=poses,
            partner=partner,
            campaign_name=f"VS Campaign - {target_data.get('id', 'TARGET')}",
            description=f"Mock virtual screening of {library_size} compounds against {target_data.get('name', 'target')}",
            created_at=datetime.now(),
            atomnet_version=self.model_version
        )
        
        logger.info(
            f"MockAtomNet screening complete: {len(ligands)} ligands, "
            f"best score: {ligands[0].score:.2f} kcal/mol"
        )
        
        return project
    
    def _generate_project_id(self, target_id: str) -> str:
        """Generate a unique project ID"""
        timestamp = datetime.now().strftime("%Y%m%d")
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        return f"{target_id.lower()}_{timestamp}_{random_suffix}"
    
    def _generate_ligands(
        self,
        count: int,
        target_data: Dict[str, Any]
    ) -> List[AtomNetLigand]:
        """Generate mock ligand results"""
        ligands = []
        
        # Use target for reproducible randomization
        target_seed = hash(target_data.get("id", ""))
        random.seed(target_seed)
        
        libraries = ["Enamine_REAL", "ChEMBL_fragments", "ZINC_leads", "Custom_focused"]
        batches = ["A", "B", "C", "D"]
        
        for i in range(count):
            # Generate SMILES with some variation
            base_smiles = random.choice(SAMPLE_SMILES_TEMPLATES)
            smiles = self._mutate_smiles(base_smiles, i)
            
            # Generate score (binding affinity in kcal/mol)
            # Best hits: -12 to -9, good: -9 to -7, weak: -7 to -5
            score = self._generate_score(i, count)
            
            # Generate molecular properties
            mw = self._estimate_mw(smiles)
            logp = random.uniform(1.0, 5.0)
            tpsa = random.uniform(20, 140)
            hbd = random.randint(0, 5)
            hba = random.randint(1, 10)
            
            ligand = AtomNetLigand(
                ligand_id=f"LIG_{i+1:05d}",
                smiles=smiles,
                score=round(score, 2),
                rank=i + 1,  # Will be updated after sorting
                metadata=AtomNetLigandMetadata(
                    library_id=random.choice(libraries),
                    batch=random.choice(batches),
                    source="AtomNet",
                    model_version=self.model_version
                ),
                molecular_weight=round(mw, 2),
                logp=round(logp, 2),
                tpsa=round(tpsa, 2),
                hbd=hbd,
                hba=hba
            )
            
            ligands.append(ligand)
        
        return ligands
    
    def _mutate_smiles(self, smiles: str, index: int) -> str:
        """Add some variation to base SMILES"""
        # Simple mutations - add substituents
        substituents = ["C", "CC", "O", "N", "F", "Cl", "OC", "NC"]
        
        random.seed(hash(smiles) + index)
        
        # Randomly add substituent
        if random.random() > 0.5 and len(smiles) < 100:
            sub = random.choice(substituents)
            pos = random.randint(0, len(smiles) - 1)
            if smiles[pos].isalpha():
                smiles = smiles[:pos] + f"({sub})" + smiles[pos:]
        
        return smiles[:150]  # Limit length
    
    def _generate_score(self, index: int, total: int) -> float:
        """Generate realistic binding affinity score"""
        # Distribution: mostly weak binders, few strong
        percentile = index / total
        
        if percentile < 0.05:
            # Top 5%: strong binders
            return random.uniform(-12.0, -9.5)
        elif percentile < 0.20:
            # Top 20%: good binders
            return random.uniform(-9.5, -7.5)
        elif percentile < 0.50:
            # Top 50%: moderate
            return random.uniform(-7.5, -6.0)
        else:
            # Bottom 50%: weak
            return random.uniform(-6.0, -4.0)
    
    def _estimate_mw(self, smiles: str) -> float:
        """Rough molecular weight estimate from SMILES"""
        # Very rough approximation
        weights = {
            'C': 12, 'N': 14, 'O': 16, 'S': 32, 'F': 19,
            'Cl': 35.5, 'Br': 80, 'P': 31
        }
        
        mw = 0
        for char in smiles.upper():
            if char in weights:
                mw += weights[char]
        
        # Add hydrogens (rough estimate)
        mw += sum(1 for c in smiles if c.isalpha()) * 0.5
        
        return mw + random.uniform(-20, 50)
    
    def _generate_poses(self, ligands: List[AtomNetLigand]) -> List[AtomNetDockingPose]:
        """Generate mock docking poses for top ligands"""
        poses = []
        
        for lig in ligands:
            pose = AtomNetDockingPose(
                ligand_id=lig.ligand_id,
                pose_id=f"{lig.ligand_id}_pose1",
                format=PoseFormat.PDBQT,
                data_url=f"s3://mock-bucket/poses/{lig.ligand_id}_pose1.pdbqt",
                rmsd=round(random.uniform(0.5, 2.5), 2)
            )
            poses.append(pose)
        
        return poses


class RealAtomNet:
    """
    Placeholder for real AtomNet API integration.
    
    When Atomwise provides API access, this class would implement
    actual API calls with authentication.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.atomwise.com"):
        self.api_key = api_key
        self.base_url = base_url
        raise NotImplementedError(
            "RealAtomNet is a placeholder. "
            "Implement API integration when Atomwise provides access."
        )
    
    def screen(self, target, library_size):
        """Real screening would call AtomNet API"""
        raise NotImplementedError()


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def generate_demo_project(
    target_name: str = "ABL1_HUMAN",
    ligand_count: int = 50
) -> AtomNetProject:
    """
    Generate a demo AtomNet project for testing.
    
    Usage:
        from services.mock_atomnet import generate_demo_project
        project = generate_demo_project("EGFR_HUMAN", 100)
    """
    adapter = MockAtomNet()
    
    # Find target by name
    target = None
    for t in SAMPLE_TARGETS:
        if target_name.upper() in t["id"].upper():
            target = t
            break
    
    return adapter.screen(
        target=target,
        library_size=ligand_count,
        partner="Demo - BioScribe"
    )


if __name__ == "__main__":
    # Test the mock adapter
    logging.basicConfig(level=logging.INFO)
    
    adapter = MockAtomNet()
    project = adapter.screen(library_size=50)
    
    print(f"\nProject ID: {project.project_id}")
    print(f"Target: {project.target.name} ({project.target.id})")
    print(f"Ligands: {len(project.ligands)}")
    print(f"\nTop 5 hits:")
    for lig in project.ligands[:5]:
        print(f"  {lig.ligand_id}: {lig.score:.2f} kcal/mol - {lig.smiles[:40]}...")
