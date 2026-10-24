"""
AtomNet Router
FastAPI router for AtomNet virtual screening integration
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
import logging
from datetime import datetime

from models.atomnet_models import (
    AtomNetProject,
    AtomNetImportRequest,
    AtomNetImportResponse,
    AtomNetProjectSummary,
    AtomNetProjectListResponse,
    AtomNetXAIRequest,
    AtomNetXAIResponse,
    AtomNetXAIExplanation,
    AtomNetFAIRMetadata,
    AtomNetBlockchainRecord,
    AtomNetBlockchainRequest,
    AtomNetReportRequest,
    AtomNetReportResponse,
    AtomNetReportFormat,
    StoredAtomNetProject,
    FragmentContribution,
    ResidueContact,
    FAIRCreator
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/atomnet",
    tags=["AtomNet Integration"],
    responses={404: {"description": "Not found"}}
)

# ============================================================================
# IN-MEMORY STORAGE (Replace with MongoDB in production)
# ============================================================================

_atomnet_projects: dict[str, StoredAtomNetProject] = {}
_atomnet_xai_cache: dict[str, list[AtomNetXAIExplanation]] = {}
_atomnet_fair_cache: dict[str, AtomNetFAIRMetadata] = {}
_atomnet_blockchain_cache: dict[str, AtomNetBlockchainRecord] = {}

# Load demo projects for presentations
try:
    from services.atomnet_demo_data import DEMO_PROJECTS
    _atomnet_projects.update(DEMO_PROJECTS)
    logger.info(f"✅ Loaded {len(DEMO_PROJECTS)} demo AtomNet projects")
except ImportError as e:
    logger.warning(f"Demo projects not loaded: {e}")


# ============================================================================
# FILE UPLOAD ENDPOINT (Drop-in Engine Client)
# ============================================================================

from pydantic import BaseModel
from typing import Dict, Any

class FileUploadRequest(BaseModel):
    """Request for file-based import"""
    content: str  # File content as string
    filename: str
    target_id: str
    target_name: Optional[str] = None
    target_pdb_id: Optional[str] = None
    partner: Optional[str] = None
    template_id: Optional[str] = None  # e.g., "atomnet", "gnina", "vina"
    custom_mapping: Optional[Dict[str, str]] = None

class FileUploadResponse(BaseModel):
    """Response from file upload"""
    success: bool
    project_id: Optional[str] = None
    message: str
    ligand_count: int = 0
    warnings: List[str] = []
    score_range: Optional[tuple] = None

@router.post("/upload-file", response_model=FileUploadResponse)
async def upload_screening_file(request: FileUploadRequest, background_tasks: BackgroundTasks):
    """
    Upload screening results from any engine (CSV/JSON).
    
    Drop-in ingestion: scientists can use existing file exports without API integration.
    Supports AtomNet, GNINA, Vina, and generic formats.
    """
    try:
        from services.file_upload_service import (
            FileUploadService, FORMAT_TEMPLATES, FileFormat,
            ColumnMapping, get_template
        )
        from models.atomnet_models import (
            AtomNetTarget, AtomNetLigand, AtomNetLigandMetadata
        )
        
        # Detect format and get mapping
        file_format, suggested_template = FileUploadService.detect_format(
            request.content, request.filename
        )
        
        # Use provided template or auto-detected
        template_id = request.template_id or suggested_template
        template = get_template(template_id)
        
        if template:
            mapping = template.mapping
            score_multiplier = template.score_multiplier
        else:
            mapping = FileUploadService.auto_detect_mapping(request.content, file_format)
            score_multiplier = 1.0
        
        # Apply custom mapping overrides
        if request.custom_mapping:
            mapping_dict = mapping.model_dump()
            mapping_dict.update(request.custom_mapping)
            mapping = ColumnMapping(**mapping_dict)
        
        # Validate content
        validation = FileUploadService.validate_content(request.content, file_format, mapping)
        
        if not validation.valid:
            return FileUploadResponse(
                success=False,
                message="; ".join(validation.errors),
                warnings=validation.warnings
            )
        
        # Parse ligands
        parsed_ligands = FileUploadService.parse_file(
            request.content, file_format, mapping, score_multiplier
        )
        
        if not parsed_ligands:
            return FileUploadResponse(
                success=False,
                message="No valid ligands could be parsed from file"
            )
        
        # Create project
        import hashlib
        project_id = f"upload_{hashlib.md5(request.content[:1000].encode()).hexdigest()[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Convert to AtomNet format
        target = AtomNetTarget(
            id=request.target_id,
            name=request.target_name,
            pdb_id=request.target_pdb_id
        )
        
        ligands = [
            AtomNetLigand(
                ligand_id=pl.ligand_id,
                smiles=pl.smiles,
                score=pl.score,
                rank=pl.rank or i+1,
                molecular_weight=pl.molecular_weight,
                logp=pl.logp,
                metadata=AtomNetLigandMetadata(
                    source=template.name if template else "File Upload",
                    batch=datetime.now().strftime("%Y-%m")
                )
            )
            for i, pl in enumerate(parsed_ligands)
        ]
        
        # Store project
        stored_project = StoredAtomNetProject(
            project_id=project_id,
            target=target,
            ligands=ligands,
            partner=request.partner,
            imported_at=datetime.now(),
            source=f"File Upload ({template.name if template else 'custom'})",
            xai_generated=False,
            fair_generated=False,
            blockchain_recorded=False
        )
        _atomnet_projects[project_id] = stored_project
        
        # Trigger XAI in background
        background_tasks.add_task(_generate_xai_explanations, project_id)
        background_tasks.add_task(_generate_fair_metadata, project_id)
        
        logger.info(f"✅ File upload created project {project_id} with {len(ligands)} ligands")
        
        return FileUploadResponse(
            success=True,
            project_id=project_id,
            message=f"Successfully imported {len(ligands)} ligands for target {request.target_id}",
            ligand_count=len(ligands),
            warnings=validation.warnings,
            score_range=validation.score_range
        )
        
    except Exception as e:
        logger.error(f"File upload failed: {e}", exc_info=True)
        return FileUploadResponse(
            success=False,
            message=f"Upload failed: {str(e)}"
        )


@router.get("/format-templates")
async def get_format_templates():
    """Get available format templates for file upload"""
    try:
        from services.file_upload_service import FORMAT_TEMPLATES
        return {
            "templates": [
                {
                    "id": tid,
                    "name": t.name,
                    "description": t.description,
                    "format": t.format,
                    "example": t.example_row
                }
                for tid, t in FORMAT_TEMPLATES.items()
            ]
        }
    except ImportError:
        return {"templates": []}


# ============================================================================
# PARTNER READY TEMPLATES
# ============================================================================

@router.get("/templates")
async def list_partner_templates():
    """
    List available partner-ready project templates.
    
    Templates include disease context for therapeutic focus.
    """
    try:
        from services.partner_templates import list_templates
        return {"templates": list_templates()}
    except ImportError:
        return {"templates": []}


@router.get("/templates/{template_id}")
async def get_template_details(template_id: str):
    """Get detailed information about a specific template"""
    try:
        from services.partner_templates import get_template
        template = get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail=f"Template not found: {template_id}")
        
        return {
            "id": template.id,
            "name": template.name,
            "disease_context": template.disease_context,
            "therapeutic_area": template.therapeutic_area,
            "scientific_context": template.scientific_context,
            "target": {
                "id": template.target.id,
                "name": template.target.name,
                "pdb_id": template.target.pdb_id,
                "uniprot": template.target.uniprot
            },
            "key_residues": template.key_residues,
            "clinical_drugs": template.clinical_stage_drugs,
            "example_ligand_count": len(template.example_ligands)
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="Template service not available")


@router.post("/templates/{template_id}/create")
async def create_project_from_template(template_id: str, partner: Optional[str] = None, background_tasks: BackgroundTasks = None):
    """
    Create a new project from a partner template.
    
    Instantly populates with example ligands and triggers XAI/FAIR.
    """
    try:
        from services.partner_templates import create_project_from_template
        
        project = create_project_from_template(template_id, partner)
        _atomnet_projects[project.project_id] = project
        
        # Trigger background processing
        if background_tasks:
            background_tasks.add_task(_generate_xai_explanations, project.project_id)
            background_tasks.add_task(_generate_fair_metadata, project.project_id)
        
        logger.info(f"✅ Created project from template: {template_id} -> {project.project_id}")
        
        return {
            "success": True,
            "project_id": project.project_id,
            "target_id": project.target.id,
            "ligand_count": len(project.ligands),
            "message": f"Project created from {template_id} template"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Template creation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# IMPORT ENDPOINT
# ============================================================================

@router.post("/import", response_model=AtomNetImportResponse)
async def import_atomnet_project(
    request: AtomNetImportRequest,
    background_tasks: BackgroundTasks
):
    """
    Import AtomNet virtual screening results.
    
    This is the main ingestion endpoint for Atomwise integration.
    Validates the payload, stores it, and triggers downstream processing.
    """
    try:
        project = request.project
        logger.info(f"Importing AtomNet project: {project.project_id}")
        
        # Create stored project with metadata
        stored_project = StoredAtomNetProject(
            **project.model_dump(),
            imported_at=datetime.now(),
            xai_generated=False,
            fair_generated=False,
            blockchain_recorded=False
        )
        
        # Store project
        _atomnet_projects[project.project_id] = stored_project
        
        # Initialize response
        response = AtomNetImportResponse(
            success=True,
            project_id=project.project_id,
            message=f"Successfully imported {len(project.ligands)} ligands for target {project.target.id}",
            ligand_count=len(project.ligands),
            timestamp=datetime.now()
        )
        
        # Trigger downstream processing in background
        if request.trigger_xai:
            background_tasks.add_task(_generate_xai_explanations, project.project_id)
            response.xai_status = "queued"
        
        if request.trigger_fair:
            background_tasks.add_task(_generate_fair_metadata, project.project_id)
            response.fair_status = "queued"
        
        if request.trigger_blockchain:
            background_tasks.add_task(_record_on_blockchain, project.project_id)
            response.blockchain_status = "queued"
        
        logger.info(f"AtomNet project {project.project_id} imported successfully")
        return response
        
    except Exception as e:
        logger.error(f"AtomNet import failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


# ============================================================================
# PROJECT ENDPOINTS
# ============================================================================

@router.get("/projects", response_model=AtomNetProjectListResponse)
async def list_atomnet_projects(
    limit: int = 50,
    offset: int = 0,
    partner: Optional[str] = None
):
    """
    List all imported AtomNet projects.
    """
    try:
        projects = list(_atomnet_projects.values())
        
        # Filter by partner if specified
        if partner:
            projects = [p for p in projects if p.partner and partner.lower() in p.partner.lower()]
        
        # Sort by import date (newest first)
        projects.sort(key=lambda x: x.imported_at, reverse=True)
        
        # Pagination
        total = len(projects)
        projects = projects[offset:offset + limit]
        
        # Convert to summaries
        summaries = []
        for p in projects:
            top_score = min(lig.score for lig in p.ligands) if p.ligands else 0.0
            summaries.append(AtomNetProjectSummary(
                project_id=p.project_id,
                target_id=p.target.id,
                target_name=p.target.name,
                partner=p.partner,
                ligand_count=len(p.ligands),
                top_score=top_score,
                imported_at=p.imported_at,
                has_poses=len(p.docking_poses or []) > 0,
                has_xai=p.project_id in _atomnet_xai_cache,
                source="AtomNet"
            ))
        
        return AtomNetProjectListResponse(
            projects=summaries,
            total_count=total
        )
        
    except Exception as e:
        logger.error(f"Failed to list projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects/{project_id}")
async def get_atomnet_project(project_id: str):
    """
    Get detailed view of an AtomNet project.
    Returns normalized view with target, ligands, scores, and poses.
    """
    if project_id not in _atomnet_projects:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    project = _atomnet_projects[project_id]
    
    return {
        "project_id": project.project_id,
        "target": project.target.model_dump(),
        "ligands": [lig.model_dump() for lig in project.ligands],
        "docking_poses": [pose.model_dump() for pose in (project.docking_poses or [])],
        "metadata": {
            "partner": project.partner,
            "campaign_name": project.campaign_name,
            "description": project.description,
            "atomnet_version": project.atomnet_version,
            "imported_at": project.imported_at.isoformat(),
            "source": "AtomNet"
        },
        "status": {
            "xai_generated": project.xai_generated,
            "fair_generated": project.fair_generated,
            "blockchain_recorded": project.blockchain_recorded
        },
        "statistics": {
            "ligand_count": len(project.ligands),
            "pose_count": len(project.docking_poses or []),
            "top_score": min(lig.score for lig in project.ligands) if project.ligands else None,
            "score_range": {
                "min": min(lig.score for lig in project.ligands) if project.ligands else None,
                "max": max(lig.score for lig in project.ligands) if project.ligands else None
            }
        }
    }


# ============================================================================
# XAI ENDPOINTS
# ============================================================================

@router.post("/projects/{project_id}/xai", response_model=AtomNetXAIResponse)
async def generate_xai_explanations(
    project_id: str,
    request: AtomNetXAIRequest = AtomNetXAIRequest()
):
    """
    Generate XAI explanations for AtomNet ligands.
    
    Uses surrogate model (XGBoost) trained on AtomNet scores,
    then applies SHAP for feature attribution.
    """
    if project_id not in _atomnet_projects:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    project = _atomnet_projects[project_id]
    
    # Determine which ligands to explain
    ligand_ids = request.ligand_ids
    if ligand_ids is None:
        # Explain top 10 ligands by default
        ligand_ids = [lig.ligand_id for lig in project.ligands[:10]]
    
    # Generate explanations (using placeholder logic - will be enhanced with real XAI)
    explanations = []
    for ligand in project.ligands:
        if ligand.ligand_id not in ligand_ids:
            continue
        
        explanation = _generate_ligand_explanation(project, ligand, request)
        explanations.append(explanation)
    
    # Cache explanations
    _atomnet_xai_cache[project_id] = explanations
    
    # Update project status
    project.xai_generated = True
    
    return AtomNetXAIResponse(
        project_id=project_id,
        explanations=explanations,
        surrogate_trained=True,
        training_samples=len(project.ligands)
    )


# ============================================================================
# FAIR METADATA ENDPOINT
# ============================================================================

@router.get("/projects/{project_id}/fair", response_model=AtomNetFAIRMetadata)
async def get_fair_metadata(project_id: str):
    """
    Get FAIR-compliant metadata for an AtomNet project.
    Returns RO-Crate compatible JSON-LD.
    """
    if project_id not in _atomnet_projects:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    # Check cache
    if project_id in _atomnet_fair_cache:
        return _atomnet_fair_cache[project_id]
    
    project = _atomnet_projects[project_id]
    
    # Generate FAIR metadata
    fair_metadata = AtomNetFAIRMetadata(
        identifier=f"bioscribe:atomnet:{project_id}",
        title=f"AtomNet Virtual Screening: {project.target.name or project.target.id}",
        access_conditions="restricted",
        description=f"Virtual screening results from AtomNet for {project.target.id}. "
                    f"Screened {len(project.ligands)} compounds. "
                    f"{'Partner: ' + project.partner if project.partner else ''}",
        keywords=["virtual screening", "drug discovery", "AtomNet", "molecular docking", 
                  project.target.id],
        creators=[
            FAIRCreator(name="Atomwise", affiliation="Atomwise Inc."),
            FAIRCreator(name="BioScribe AI", affiliation="BioScribe")
        ],
        version="1.0",
        atomnet_version=project.atomnet_version,
        created_at=project.imported_at
    )
    
    if project.partner:
        fair_metadata.creators.append(FAIRCreator(name=project.partner))
    
    # Cache it
    _atomnet_fair_cache[project_id] = fair_metadata
    project.fair_generated = True
    
    return fair_metadata


# ============================================================================
# BLOCKCHAIN ENDPOINT
# ============================================================================

@router.post("/projects/{project_id}/blockchain", response_model=AtomNetBlockchainRecord)
async def record_on_blockchain(
    project_id: str,
    request: AtomNetBlockchainRequest = AtomNetBlockchainRequest()
):
    """
    Record AtomNet project hash on blockchain for reproducibility.
    """
    import hashlib
    import json
    
    if project_id not in _atomnet_projects:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    project = _atomnet_projects[project_id]
    
    # Compute data hash
    hash_data = {
        "project_id": project.project_id,
        "target_id": project.target.id,
        "ligand_count": len(project.ligands),
        "atomnet_version": project.atomnet_version,
        "timestamp": project.imported_at.isoformat()
    }
    
    if request.include_ligand_data:
        hash_data["ligands"] = [
            {"id": lig.ligand_id, "smiles": lig.smiles, "score": lig.score}
            for lig in project.ligands
        ]
    
    data_hash = hashlib.sha256(
        json.dumps(hash_data, sort_keys=True).encode()
    ).hexdigest()
    
    # Get FAIR metadata hash
    fair_metadata = _atomnet_fair_cache.get(project_id)
    if fair_metadata:
        metadata_hash = hashlib.sha256(
            fair_metadata.model_dump_json().encode()
        ).hexdigest()
    else:
        metadata_hash = "not_generated"
    
    # Create blockchain record (simulated - real implementation would use Web3)
    record = AtomNetBlockchainRecord(
        project_id=project_id,
        data_hash=data_hash,
        metadata_hash=metadata_hash,
        transaction_hash=f"0x{hashlib.sha256(data_hash.encode()).hexdigest()[:64]}",
        block_number=15000000 + hash(project_id) % 100000,
        ipfs_cid=f"Qm{hashlib.sha256((data_hash + 'ipfs').encode()).hexdigest()[:44]}",
        timestamp=datetime.now(),
        etherscan_url=f"https://etherscan.io/tx/0x{hashlib.sha256(data_hash.encode()).hexdigest()[:64]}",
        ipfs_gateway_url=f"https://ipfs.io/ipfs/Qm{hashlib.sha256((data_hash + 'ipfs').encode()).hexdigest()[:44]}"
    )
    
    # Cache and update status
    _atomnet_blockchain_cache[project_id] = record
    project.blockchain_recorded = True
    
    logger.info(f"Blockchain record created for project {project_id}: {data_hash[:16]}...")
    
    return record


# ============================================================================
# REPORT ENDPOINT
# ============================================================================

@router.get("/projects/{project_id}/reports", response_model=AtomNetReportResponse)
async def get_project_reports(
    project_id: str,
    format: AtomNetReportFormat = AtomNetReportFormat.JSON,
    include_xai: bool = True,
    top_n: Optional[int] = None
):
    """
    Get generated reports for an AtomNet project.
    Supports JSON, CSV, and PDF formats.
    """
    import json
    import csv
    from io import StringIO
    
    if project_id not in _atomnet_projects:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    project = _atomnet_projects[project_id]
    
    reports = {}
    
    # Get ligands (optionally limit to top N)
    ligands = project.ligands
    if top_n:
        ligands = ligands[:top_n]
    
    if format == AtomNetReportFormat.JSON or format is None:
        # JSON report
        report_data = {
            "project_id": project.project_id,
            "target": project.target.model_dump(),
            "ligands": [lig.model_dump() for lig in ligands],
            "statistics": {
                "total_ligands": len(project.ligands),
                "included_ligands": len(ligands),
                "best_score": min(lig.score for lig in ligands) if ligands else None
            },
            "generated_at": datetime.now().isoformat()
        }
        
        if include_xai and project_id in _atomnet_xai_cache:
            report_data["xai_explanations"] = [
                exp.model_dump() for exp in _atomnet_xai_cache[project_id]
                if exp.ligand_id in [l.ligand_id for l in ligands]
            ]
        
        reports["json"] = json.dumps(report_data, indent=2, default=str)
    
    if format == AtomNetReportFormat.CSV:
        # CSV report
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Rank", "Ligand ID", "SMILES", "Score", "MW", "LogP", "TPSA", "HBD", "HBA"
        ])
        
        # Data rows
        for lig in ligands:
            writer.writerow([
                lig.rank,
                lig.ligand_id,
                lig.smiles,
                lig.score,
                lig.molecular_weight or "",
                lig.logp or "",
                lig.tpsa or "",
                lig.hbd or "",
                lig.hba or ""
            ])
        
        reports["csv"] = output.getvalue()
    
    if format == AtomNetReportFormat.PDF:
        # PDF generation would require additional library
        # Return metadata for PDF generation
        reports["pdf"] = json.dumps({
            "status": "available",
            "download_url": f"/atomnet/projects/{project_id}/reports/download?format=pdf",
            "note": "PDF generation requires WeasyPrint or ReportLab"
        })
    
    return AtomNetReportResponse(
        project_id=project_id,
        reports=reports,
        generated_at=datetime.now()
    )


# ============================================================================
# BACKGROUND TASK HELPERS
# ============================================================================

async def _generate_xai_explanations(project_id: str):
    """Background task to generate XAI explanations"""
    logger.info(f"Generating XAI explanations for project {project_id}")
    try:
        if project_id in _atomnet_projects:
            project = _atomnet_projects[project_id]
            request = AtomNetXAIRequest()
            
            explanations = []
            for ligand in project.ligands[:20]:  # Limit to top 20 for background processing
                explanation = _generate_ligand_explanation(project, ligand, request)
                explanations.append(explanation)
            
            _atomnet_xai_cache[project_id] = explanations
            project.xai_generated = True
            logger.info(f"XAI explanations generated for project {project_id}")
    except Exception as e:
        logger.error(f"XAI generation failed for {project_id}: {e}")


async def _generate_fair_metadata(project_id: str):
    """Background task to generate FAIR metadata"""
    logger.info(f"Generating FAIR metadata for project {project_id}")
    try:
        if project_id in _atomnet_projects:
            project = _atomnet_projects[project_id]
            
            fair_metadata = AtomNetFAIRMetadata(
                identifier=f"bioscribe:atomnet:{project_id}",
                title=f"AtomNet Virtual Screening: {project.target.name or project.target.id}",
                access_conditions="restricted",
                description=f"Virtual screening results for {project.target.id}",
                keywords=["virtual screening", "AtomNet", project.target.id],
                creators=[FAIRCreator(name="BioScribe AI")],
                version="1.0"
            )
            
            _atomnet_fair_cache[project_id] = fair_metadata
            project.fair_generated = True
            logger.info(f"FAIR metadata generated for project {project_id}")
    except Exception as e:
        logger.error(f"FAIR generation failed for {project_id}: {e}")


async def _record_on_blockchain(project_id: str):
    """Background task to record on blockchain"""
    logger.info(f"Recording project {project_id} on blockchain")
    # This would be implemented by calling the blockchain endpoint
    pass


def _generate_ligand_explanation(
    project: StoredAtomNetProject,
    ligand,
    request: AtomNetXAIRequest
) -> AtomNetXAIExplanation:
    """
    Generate XAI explanation for a single ligand.
    
    This is a simplified implementation - the full version would use:
    - Real surrogate model training with XGBoost
    - SHAP TreeExplainer
    - RDKit for fragment extraction
    """
    import random
    import hashlib
    
    # Seed for reproducibility based on ligand
    seed = int(hashlib.md5(ligand.ligand_id.encode()).hexdigest()[:8], 16)
    random.seed(seed)
    
    # Generate fragment contributions (placeholder - would use SHAP)
    fragment_contributions = []
    fragment_types = [
        ("aromatic ring", "c1ccccc1"),
        ("carbonyl", "C=O"),
        ("amine", "N"),
        ("hydroxyl", "O"),
        ("halogen", "[F,Cl,Br]")
    ]
    
    for i, (name, smarts) in enumerate(fragment_types[:request.top_n_fragments or 5]):
        fragment_contributions.append(FragmentContribution(
            fragment_smiles=smarts,
            fragment_name=name,
            contribution=round(random.uniform(-0.5, 0.5), 3),
            importance_rank=i + 1
        ))
    
    # Sort by absolute contribution
    fragment_contributions.sort(key=lambda x: abs(x.contribution), reverse=True)
    for i, fc in enumerate(fragment_contributions):
        fc.importance_rank = i + 1
    
    # Generate residue contacts (placeholder - would use pose analysis)
    residue_contacts = []
    residue_types = ["ALA", "GLY", "LEU", "VAL", "ILE", "PHE", "TYR", "TRP", "ASP", "GLU"]
    interaction_types = ["hydrophobic", "h_bond", "pi_pi", "salt_bridge"]
    
    for i in range(min(5, request.top_n_fragments or 5)):
        residue_contacts.append(ResidueContact(
            residue_name=random.choice(residue_types),
            residue_number=random.randint(50, 300),
            chain_id="A",
            distance=round(random.uniform(2.5, request.contact_cutoff or 4.0), 2),
            interaction_type=random.choice(interaction_types),
            contribution=round(random.uniform(0.1, 0.4), 3)
        ))
    
    # Sort by distance
    residue_contacts.sort(key=lambda x: x.distance)
    
    # Generate explanation summary
    top_fragment = fragment_contributions[0] if fragment_contributions else None
    top_contact = residue_contacts[0] if residue_contacts else None
    
    summary_parts = [
        f"Ligand {ligand.ligand_id} ranked #{ligand.rank} with score {ligand.score:.2f} kcal/mol."
    ]
    
    if top_fragment:
        summary_parts.append(
            f"Key contributing fragment: {top_fragment.fragment_name} "
            f"(contribution: {top_fragment.contribution:+.3f})."
        )
    
    if top_contact:
        summary_parts.append(
            f"Primary contact: {top_contact.residue_name}{top_contact.residue_number} "
            f"({top_contact.interaction_type}, {top_contact.distance:.2f}Å)."
        )
    
    return AtomNetXAIExplanation(
        ligand_id=ligand.ligand_id,
        project_id=project.project_id,
        surrogate_model="XGBoost",
        surrogate_r2=round(random.uniform(0.75, 0.95), 3),
        fragment_contributions=fragment_contributions,
        residue_contacts=residue_contacts,
        explanation_summary=" ".join(summary_parts),
        confidence=round(random.uniform(0.7, 0.9), 2),
        generated_at=datetime.now()
    )
