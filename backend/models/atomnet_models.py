"""
AtomNet Integration Models
Pydantic models for AtomNet virtual screening results ingestion
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class PoseFormat(str, Enum):
    """Supported docking pose formats"""
    PDBQT = "pdbqt"
    PDB = "pdb"
    SDF = "sdf"
    MOL2 = "mol2"


# ============================================================================
# CORE ATOMNET MODELS - Input Schema
# ============================================================================

class AtomNetTarget(BaseModel):
    """Protein target information from AtomNet"""
    id: str = Field(..., description="Target identifier (e.g., ABL1_HUMAN)")
    uniprot: Optional[str] = Field(None, description="UniProt accession (e.g., P00519)")
    pdb_id: Optional[str] = Field(None, description="PDB structure ID (e.g., 2HYY)")
    sequence: Optional[str] = Field(None, description="Amino acid sequence")
    name: Optional[str] = Field(None, description="Human-readable target name")
    organism: Optional[str] = Field(None, description="Source organism")
    
    @field_validator('sequence')
    @classmethod
    def validate_sequence(cls, v):
        if v is None:
            return v
        # Clean sequence - keep only valid amino acids
        import re
        clean_seq = re.sub(r'[^ACDEFGHIKLMNPQRSTVWY]', '', v.upper())
        return clean_seq if len(clean_seq) > 0 else None


class AtomNetLigandMetadata(BaseModel):
    """Metadata for an AtomNet ligand"""
    library_id: Optional[str] = Field(None, description="Source library ID")
    batch: Optional[str] = Field(None, description="Screening batch")
    source: Optional[str] = Field("AtomNet", description="Scoring engine source")
    model_version: Optional[str] = Field(None, description="AtomNet model version")
    additional: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AtomNetLigand(BaseModel):
    """Ligand with AtomNet scoring results"""
    ligand_id: str = Field(..., description="Unique ligand identifier")
    smiles: str = Field(..., description="SMILES string")
    score: float = Field(..., description="AtomNet binding score (typically kcal/mol)")
    rank: int = Field(..., ge=1, description="Rank in screening results")
    metadata: Optional[AtomNetLigandMetadata] = Field(default_factory=AtomNetLigandMetadata)
    
    # Optional computed properties
    molecular_weight: Optional[float] = Field(None, description="Molecular weight")
    logp: Optional[float] = Field(None, description="LogP value")
    tpsa: Optional[float] = Field(None, description="Topological polar surface area")
    hbd: Optional[int] = Field(None, description="H-bond donors")
    hba: Optional[int] = Field(None, description="H-bond acceptors")
    
    @field_validator('smiles')
    @classmethod
    def validate_smiles(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("SMILES string cannot be empty")
        return v.strip()


class AtomNetDockingPose(BaseModel):
    """Docking pose data from AtomNet"""
    ligand_id: str = Field(..., description="Reference to parent ligand")
    pose_id: str = Field(..., description="Unique pose identifier")
    format: PoseFormat = Field(..., description="Pose file format")
    data_url: Optional[str] = Field(None, description="URL to pose file (e.g., s3://...)")
    data_inline: Optional[str] = Field(None, description="Inline pose data (for small poses)")
    rmsd: Optional[float] = Field(None, description="RMSD from reference pose")
    
    @field_validator('data_url', 'data_inline')
    @classmethod
    def validate_pose_data(cls, v, info):
        # At least one of data_url or data_inline should be provided
        return v


class AtomNetProject(BaseModel):
    """
    Complete AtomNet project import schema.
    This is the main contract for Atomwise integration.
    """
    project_id: str = Field(..., description="Unique project identifier")
    target: AtomNetTarget = Field(..., description="Protein target information")
    ligands: List[AtomNetLigand] = Field(..., min_length=1, description="Screened ligands with scores")
    docking_poses: Optional[List[AtomNetDockingPose]] = Field(default_factory=list, description="Optional docking poses")
    
    # Project metadata
    partner: Optional[str] = Field(None, description="Partner organization (e.g., Sanofi)")
    campaign_name: Optional[str] = Field(None, description="Screening campaign name")
    description: Optional[str] = Field(None, description="Project description")
    created_at: Optional[datetime] = Field(None, description="When results were generated")
    atomnet_version: Optional[str] = Field(None, description="AtomNet model version used")
    
    @field_validator('ligands')
    @classmethod
    def validate_ligands(cls, v):
        if len(v) == 0:
            raise ValueError("At least one ligand is required")
        # Sort by rank
        return sorted(v, key=lambda x: x.rank)


# ============================================================================
# API REQUEST/RESPONSE MODELS
# ============================================================================

class AtomNetImportRequest(BaseModel):
    """Request model for importing AtomNet results"""
    project: AtomNetProject = Field(..., description="Complete project data")
    trigger_xai: Optional[bool] = Field(True, description="Auto-trigger XAI pipeline")
    trigger_fair: Optional[bool] = Field(True, description="Auto-generate FAIR metadata")
    trigger_blockchain: Optional[bool] = Field(False, description="Auto-record on blockchain")


class AtomNetImportResponse(BaseModel):
    """Response after successful AtomNet import"""
    success: bool = Field(True)
    project_id: str = Field(..., description="Stored project ID")
    message: str = Field(..., description="Status message")
    ligand_count: int = Field(..., description="Number of ligands imported")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    # Triggered pipeline statuses
    xai_status: Optional[str] = Field(None, description="XAI pipeline status")
    fair_status: Optional[str] = Field(None, description="FAIR metadata status")
    blockchain_status: Optional[str] = Field(None, description="Blockchain recording status")


class AtomNetProjectSummary(BaseModel):
    """Summary view of an AtomNet project for listing"""
    project_id: str
    target_id: str
    target_name: Optional[str] = None
    partner: Optional[str] = None
    ligand_count: int
    top_score: float
    imported_at: datetime
    has_poses: bool = False
    has_xai: bool = False
    source: str = "AtomNet"


class AtomNetProjectListResponse(BaseModel):
    """Response for listing AtomNet projects"""
    projects: List[AtomNetProjectSummary]
    total_count: int


# ============================================================================
# XAI MODELS
# ============================================================================

class FragmentContribution(BaseModel):
    """SHAP contribution from a molecular fragment"""
    fragment_smiles: str = Field(..., description="SMARTS/SMILES of fragment")
    fragment_name: Optional[str] = Field(None, description="Common name if known")
    contribution: float = Field(..., description="SHAP value contribution")
    importance_rank: int = Field(..., ge=1)


class ResidueContact(BaseModel):
    """Protein residue contact information"""
    residue_name: str = Field(..., description="Residue name (e.g., ALA, GLY)")
    residue_number: int = Field(..., description="Residue sequence number")
    chain_id: Optional[str] = Field(None, description="Chain identifier")
    distance: float = Field(..., description="Distance to ligand (Å)")
    interaction_type: str = Field(..., description="Type: h_bond, hydrophobic, pi_pi, salt_bridge, etc.")
    contribution: Optional[float] = Field(None, description="Contribution to binding if computed")


class AtomNetXAIExplanation(BaseModel):
    """XAI explanation for a single ligand"""
    ligand_id: str = Field(..., description="Ligand being explained")
    project_id: str = Field(..., description="Parent project")
    
    # Surrogate model info
    surrogate_model: str = Field("XGBoost", description="Surrogate model type")
    surrogate_r2: Optional[float] = Field(None, description="Surrogate model R² score")
    
    # Fragment-level explanations (SHAP)
    fragment_contributions: List[FragmentContribution] = Field(default_factory=list)
    
    # Residue-level explanations
    residue_contacts: List[ResidueContact] = Field(default_factory=list)
    
    # Perturbation analysis results
    critical_groups: Optional[List[Dict[str, Any]]] = Field(None, description="Critical functional groups")
    
    # Summary
    explanation_summary: str = Field(..., description="Human-readable explanation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Explanation confidence")
    
    generated_at: datetime = Field(default_factory=datetime.now)


class AtomNetXAIRequest(BaseModel):
    """Request for XAI explanations"""
    ligand_ids: Optional[List[str]] = Field(None, description="Specific ligands to explain (None = all)")
    methods: Optional[List[str]] = Field(
        default=["shap", "contacts"],
        description="Explanation methods: shap, lime, contacts, perturbation"
    )
    contact_cutoff: Optional[float] = Field(4.0, description="Distance cutoff for contacts (Å)")
    top_n_fragments: Optional[int] = Field(5, description="Number of top fragments to return")


class AtomNetXAIResponse(BaseModel):
    """Response with XAI explanations"""
    project_id: str
    explanations: List[AtomNetXAIExplanation]
    surrogate_trained: bool = False
    training_samples: Optional[int] = None


# ============================================================================
# FAIR METADATA MODELS
# ============================================================================

class FAIRCreator(BaseModel):
    """Creator information for FAIR metadata"""
    name: str
    affiliation: Optional[str] = None
    orcid: Optional[str] = None


class AtomNetFAIRMetadata(BaseModel):
    """FAIR-compliant metadata for AtomNet projects"""
    # Findable
    identifier: str = Field(..., description="Persistent identifier (DOI-like)")
    title: str = Field(..., description="Project title")
    
    # Accessible
    access_url: Optional[str] = Field(None, description="URL to access data")
    access_conditions: str = Field("restricted", description="open, restricted, embargoed")
    
    # Interoperable
    format: str = Field("application/json", description="Data format")
    schema_version: str = Field("1.0.0", description="Schema version")
    
    # Reusable
    license: str = Field("CC-BY-NC-4.0", description="Data license")
    creators: List[FAIRCreator] = Field(default_factory=list)
    description: str = Field(..., description="Detailed description")
    keywords: List[str] = Field(default_factory=list)
    
    # Versioning
    version: str = Field("1.0", description="Data version")
    atomnet_version: Optional[str] = Field(None)
    bioscribe_version: str = Field("4.1.0-enterprise")
    
    # Provenance
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: Optional[datetime] = None
    
    # RO-Crate compatibility
    ro_crate_context: str = Field("https://w3id.org/ro/crate/1.1/context")


# ============================================================================
# BLOCKCHAIN MODELS
# ============================================================================

class AtomNetBlockchainRecord(BaseModel):
    """Blockchain record for AtomNet project"""
    project_id: str
    data_hash: str = Field(..., description="SHA-256 hash of project data")
    metadata_hash: str = Field(..., description="Hash of FAIR metadata")
    
    # Blockchain info
    transaction_hash: Optional[str] = Field(None, description="Ethereum transaction hash")
    block_number: Optional[int] = Field(None, description="Block number")
    ipfs_cid: Optional[str] = Field(None, description="IPFS content identifier")
    
    # Verification
    timestamp: datetime = Field(default_factory=datetime.now)
    signer: Optional[str] = Field(None, description="Wallet address of signer")
    
    # Links
    etherscan_url: Optional[str] = Field(None)
    ipfs_gateway_url: Optional[str] = Field(None)


class AtomNetBlockchainRequest(BaseModel):
    """Request to record project on blockchain"""
    include_ligand_data: bool = Field(True, description="Include ligand data in hash")
    include_poses: bool = Field(False, description="Include pose data in hash")
    store_on_ipfs: bool = Field(True, description="Store metadata on IPFS")


# ============================================================================
# REPORT MODELS
# ============================================================================

class AtomNetReportFormat(str, Enum):
    """Available report formats"""
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"


class AtomNetReportRequest(BaseModel):
    """Request for project reports"""
    formats: List[AtomNetReportFormat] = Field(
        default=[AtomNetReportFormat.JSON],
        description="Requested report formats"
    )
    include_xai: bool = Field(True, description="Include XAI explanations")
    include_fair: bool = Field(True, description="Include FAIR metadata")
    top_n_ligands: Optional[int] = Field(None, description="Limit to top N ligands")


class AtomNetReportResponse(BaseModel):
    """Response with generated reports"""
    project_id: str
    reports: Dict[str, str] = Field(..., description="Format -> content/URL mapping")
    generated_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# INTERNAL STORAGE MODELS
# ============================================================================

class StoredAtomNetProject(AtomNetProject):
    """Extended project model with storage metadata"""
    imported_at: datetime = Field(default_factory=datetime.now)
    imported_by: Optional[str] = Field(None, description="User who imported")
    storage_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Processing status
    xai_generated: bool = False
    fair_generated: bool = False
    blockchain_recorded: bool = False
    
    # Computed fields
    normalized: bool = Field(True, description="Whether data is normalized to internal format")
    source: str = Field("AtomNet", description="Data source identifier")
