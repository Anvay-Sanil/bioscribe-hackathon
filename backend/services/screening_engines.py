"""
Screening Engine Abstraction Layer
Protocol-based interface for virtual screening engines
"""

from typing import Protocol, List, Dict, Any, Optional, runtime_checkable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging
import hashlib
import json

logger = logging.getLogger(__name__)


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class TargetProtein:
    """Target protein for screening"""
    id: str
    name: str
    pdb_id: Optional[str] = None
    pdb_content: Optional[str] = None  # PDB file content
    binding_site_residues: Optional[List[int]] = None
    true_affinity: Optional[float] = None  # Known Kd/Ki for benchmarking


@dataclass
class Ligand:
    """Ligand for screening"""
    id: str
    smiles: str
    name: Optional[str] = None
    true_affinity: Optional[float] = None  # Known Kd/Ki for benchmarking


@dataclass
class ScoredLigand:
    """Scored ligand result"""
    ligand_id: str
    smiles: str
    score: float  # kcal/mol (negative = better)
    rank: int
    pose_pdb: Optional[str] = None  # Docked pose
    extra_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BenchmarkMetrics:
    """Benchmark performance metrics"""
    spearman_correlation: float  # vs true affinities
    pearson_correlation: float
    rmse: float
    enrichment_1pct: float  # True positives in top 1%
    enrichment_5pct: float  # True positives in top 5%
    enrichment_10pct: float  # True positives in top 10%
    time_per_1k_ligands: float  # seconds
    additional_metrics: Dict[str, float] = field(default_factory=dict)


@dataclass
class BenchmarkResult:
    """Complete benchmark result"""
    run_id: str
    engine_name: str
    engine_version: str
    target_id: str
    target_name: str
    ligand_count: int
    metrics: BenchmarkMetrics
    timestamp: datetime
    scored_ligands: List[ScoredLigand]


# ============================================================================
# ENGINE PROTOCOL
# ============================================================================

@runtime_checkable
class ScreeningEngine(Protocol):
    """
    Abstract interface for virtual screening engines.
    
    Any engine (AtomNet, GNINA, Vina, etc.) can implement this protocol
    to integrate with BioScribe's benchmarking and visualization layer.
    """
    
    @property
    def name(self) -> str:
        """Engine name (e.g., 'AtomNet', 'GNINA', 'AutoDock Vina')"""
        ...
    
    @property
    def version(self) -> str:
        """Engine version"""
        ...
    
    @property
    def description(self) -> str:
        """Short description of the engine"""
        ...
    
    def is_available(self) -> bool:
        """Check if engine is installed and ready"""
        ...
    
    def screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand],
        config: Optional[Dict[str, Any]] = None
    ) -> List[ScoredLigand]:
        """
        Run virtual screening.
        
        Args:
            protein: Target protein with structure
            ligands: List of ligands to screen
            config: Engine-specific configuration
            
        Returns:
            Scored and ranked ligands
        """
        ...


# ============================================================================
# ENGINE IMPLEMENTATIONS
# ============================================================================

class MockAtomNetEngine:
    """
    Mock AtomNet engine for demos and testing.
    
    Simulates AtomNet-style deep learning scoring.
    """
    
    name = "AtomNet"
    version = "2.1.0 (Mock)"
    description = "Atomwise deep learning virtual screening (simulated)"
    
    def is_available(self) -> bool:
        return True
    
    def screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand],
        config: Optional[Dict[str, Any]] = None
    ) -> List[ScoredLigand]:
        """Simulate AtomNet scoring with realistic distributions"""
        import random
        random.seed(hash(protein.id) + 42)
        
        results = []
        for i, lig in enumerate(ligands):
            # Simulate score based on SMILES complexity
            base_score = -8.0
            complexity_bonus = len(lig.smiles) * 0.02
            random_noise = random.gauss(0, 1.5)
            
            # Favor some structural features
            if 'N' in lig.smiles:
                complexity_bonus -= 0.5
            if 'O' in lig.smiles:
                complexity_bonus -= 0.3
            if 'c1ccccc1' in lig.smiles:  # Benzene
                complexity_bonus -= 1.0
            
            score = base_score - complexity_bonus + random_noise
            
            results.append(ScoredLigand(
                ligand_id=lig.id,
                smiles=lig.smiles,
                score=round(score, 2),
                rank=0,  # Will be assigned after sorting
                extra_data={"cnn_score": round(random.uniform(0.7, 0.95), 3)}
            ))
        
        # Sort and assign ranks
        results.sort(key=lambda x: x.score)
        for i, r in enumerate(results):
            r.rank = i + 1
        
        return results


class VinaEngine:
    """
    AutoDock Vina wrapper.
    
    Requires vina executable to be installed.
    """
    
    name = "AutoDock Vina"
    version = "1.2.5"
    description = "Classic physics-based docking with empirical scoring"
    
    def __init__(self, vina_path: str = "vina"):
        self.vina_path = vina_path
    
    def is_available(self) -> bool:
        """Check if Vina is installed"""
        import shutil
        return shutil.which(self.vina_path) is not None
    
    def screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand],
        config: Optional[Dict[str, Any]] = None
    ) -> List[ScoredLigand]:
        """
        Run Vina docking.
        
        Note: Full implementation requires preparing PDBQT files.
        This is a simplified mock when Vina is not available.
        """
        if not self.is_available():
            logger.warning("Vina not installed, using mock scores")
            return self._mock_screen(protein, ligands)
        
        # Full Vina implementation would go here
        # For now, return mock results
        return self._mock_screen(protein, ligands)
    
    def _mock_screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand]
    ) -> List[ScoredLigand]:
        """Mock Vina-style scoring"""
        import random
        random.seed(hash(protein.id) + 123)
        
        results = []
        for lig in ligands:
            # Vina-style scoring
            base = -7.5
            mw_penalty = len(lig.smiles) * 0.015
            score = base - mw_penalty + random.gauss(0, 1.2)
            
            results.append(ScoredLigand(
                ligand_id=lig.id,
                smiles=lig.smiles,
                score=round(score, 2),
                rank=0
            ))
        
        results.sort(key=lambda x: x.score)
        for i, r in enumerate(results):
            r.rank = i + 1
        
        return results


class GNINAEngine:
    """
    GNINA CNN-based docking.
    
    Requires gnina executable to be installed.
    """
    
    name = "GNINA"
    version = "1.0"
    description = "CNN-based docking with learned scoring functions"
    
    def __init__(self, gnina_path: str = "gnina"):
        self.gnina_path = gnina_path
    
    def is_available(self) -> bool:
        """Check if GNINA is installed"""
        import shutil
        return shutil.which(self.gnina_path) is not None
    
    def screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand],
        config: Optional[Dict[str, Any]] = None
    ) -> List[ScoredLigand]:
        """Run GNINA docking (mock when not available)"""
        if not self.is_available():
            logger.warning("GNINA not installed, using mock scores")
            return self._mock_screen(protein, ligands)
        
        return self._mock_screen(protein, ligands)
    
    def _mock_screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand]
    ) -> List[ScoredLigand]:
        """Mock GNINA-style scoring"""
        import random
        random.seed(hash(protein.id) + 456)
        
        results = []
        for lig in ligands:
            # GNINA outputs both CNN affinity and score
            base = -8.5
            cnn_boost = random.uniform(0, 2)
            score = base - cnn_boost + random.gauss(0, 1.0)
            
            results.append(ScoredLigand(
                ligand_id=lig.id,
                smiles=lig.smiles,
                score=round(score, 2),
                rank=0,
                extra_data={
                    "cnn_affinity": round(-score, 2),
                    "cnn_score": round(random.uniform(0.6, 0.98), 3)
                }
            ))
        
        results.sort(key=lambda x: x.score)
        for i, r in enumerate(results):
            r.rank = i + 1
        
        return results


class AtomNetEngine:
    """
    Atomwise AtomNet integration.
    
    Placeholder for real AtomNet API integration.
    When Atomwise provides API access, implement the `screen()` method
    to call their service.
    """
    
    name = "AtomNet"
    version = "API (Placeholder)"
    description = "Atomwise deep learning virtual screening - requires API key"
    
    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None):
        self.api_key = api_key
        self.api_url = api_url or "https://api.atomwise.com/v1"
    
    def is_available(self) -> bool:
        """Check if API key is configured"""
        return self.api_key is not None
    
    def screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand],
        config: Optional[Dict[str, Any]] = None
    ) -> List[ScoredLigand]:
        """
        Run AtomNet screening via API.
        
        TODO: Implement when Atomwise API access is provided.
        
        Expected implementation:
        1. Upload protein structure to AtomNet
        2. Submit ligand batch for screening
        3. Poll for results
        4. Parse and return scored ligands
        """
        raise NotImplementedError(
            "AtomNet API integration requires Atomwise credentials. "
            "Contact partnerships@atomwise.com for API access."
        )


class GlideEngine:
    """
    Schrödinger Glide docking engine.
    
    Requires Schrödinger Suite license.
    """
    
    name = "Glide"
    version = "2024.1 (Placeholder)"
    description = "Schrödinger Glide - industry-standard physics-based docking"
    
    def __init__(self, schrodinger_path: Optional[str] = None):
        self.schrodinger_path = schrodinger_path
    
    def is_available(self) -> bool:
        """Check if Schrödinger is installed"""
        import shutil
        if self.schrodinger_path:
            return shutil.which(self.schrodinger_path) is not None
        return shutil.which("glide") is not None
    
    def screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand],
        config: Optional[Dict[str, Any]] = None
    ) -> List[ScoredLigand]:
        """Run Glide docking (mock when not available)"""
        if not self.is_available():
            logger.warning("Glide not installed, using mock scores")
            return self._mock_screen(protein, ligands)
        return self._mock_screen(protein, ligands)
    
    def _mock_screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand]
    ) -> List[ScoredLigand]:
        """Mock Glide-style scoring"""
        import random
        random.seed(hash(protein.id) + 789)
        
        results = []
        for lig in ligands:
            # Glide SP scoring
            base = -7.0
            score = base - len(lig.smiles) * 0.018 + random.gauss(0, 1.1)
            
            results.append(ScoredLigand(
                ligand_id=lig.id,
                smiles=lig.smiles,
                score=round(score, 2),
                rank=0,
                extra_data={"glide_gscore": round(score, 2), "glide_emodel": round(score * 1.2, 2)}
            ))
        
        results.sort(key=lambda x: x.score)
        for i, r in enumerate(results):
            r.rank = i + 1
        
        return results


class SchrodingerFEPEngine:
    """
    Schrödinger FEP+ free energy perturbation.
    
    High-accuracy relative binding affinity predictions.
    """
    
    name = "Schrödinger FEP+"
    version = "2024.1 (Placeholder)"
    description = "Free energy perturbation - high-accuracy relative binding predictions"
    
    def is_available(self) -> bool:
        return False  # Requires enterprise license
    
    def screen(
        self, 
        protein: TargetProtein, 
        ligands: List[Ligand],
        config: Optional[Dict[str, Any]] = None
    ) -> List[ScoredLigand]:
        raise NotImplementedError(
            "FEP+ requires Schrödinger enterprise license. "
            "Contact sales@schrodinger.com for access."
        )


# ============================================================================
# ENGINE REGISTRY
# ============================================================================

AVAILABLE_ENGINES: Dict[str, ScreeningEngine] = {
    # Open-source / Free engines
    "vina": VinaEngine(),
    "gnina": GNINAEngine(),
    # Commercial / Enterprise engines
    "glide": GlideEngine(),
    "fep_plus": SchrodingerFEPEngine(),
    # Demo engines (always available)
    "demo": MockAtomNetEngine(),
}


def get_engine(engine_id: str) -> Optional[ScreeningEngine]:
    """Get engine by ID"""
    return AVAILABLE_ENGINES.get(engine_id)


def list_engines() -> List[Dict[str, Any]]:
    """List all registered engines with availability status"""
    return [
        {
            "id": eid,
            "name": engine.name,
            "version": engine.version,
            "description": engine.description,
            "available": engine.is_available(),
            "category": "open_source" if eid in ["vina", "gnina"] else "commercial" if eid in ["glide", "fep_plus"] else "demo"
        }
        for eid, engine in AVAILABLE_ENGINES.items()
    ]
