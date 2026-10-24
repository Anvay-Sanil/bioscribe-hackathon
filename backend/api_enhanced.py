"""
Enhanced API Endpoints
Integrating all advanced features with modular workflows
"""

# BIOSCRIBE_PHASE3_LEGACY_DISABLED: retained for review, never a supported runtime.
raise RuntimeError("Legacy BioScribe capability disabled. Use bioscribe.api:app and bioscribe.worker; unsupported scientific claims are withdrawn.")


from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
from datetime import datetime
import logging

# Import enhanced models
from models.enhanced_protein_predictor import EnhancedProteinPredictor
from models.multi_model_drug_generator import MultiModelDrugGenerator
from models.high_throughput_docking import HighThroughputDockingPipeline
from models.collaborative_platform import CollaborativePlatform

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BioScribe AI - Enhanced API",
    description="Industry-grade drug discovery platform with advanced AI capabilities",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize enhanced components
protein_predictor = EnhancedProteinPredictor()
drug_generator = MultiModelDrugGenerator()
ht_docking = HighThroughputDockingPipeline(max_workers=8)
collab_platform = CollaborativePlatform()

# ============================================================================
# Pydantic Models
# ============================================================================

class ProteinInput(BaseModel):
    sequence: str
    name: Optional[str] = "Unknown"
    organism: Optional[str] = None

class MultiModelGenerationRequest(BaseModel):
    protein_sequence: str
    num_candidates: int = Field(default=20, ge=5, le=100)
    target_properties: Optional[Dict[str, float]] = None
    diversity_weight: float = Field(default=0.3, ge=0, le=1)

class HighThroughputDockingRequest(BaseModel):
    protein_data: Dict[str, Any]
    ligands: List[Dict[str, Any]]
    docking_params: Optional[Dict] = None

class VirtualScreeningRequest(BaseModel):
    protein_data: Dict[str, Any]
    compound_library: List[Dict[str, Any]]
    filters: Optional[Dict] = None
    top_n: int = Field(default=100, ge=10, le=1000)

class ProjectCreate(BaseModel):
    name: str
    description: str
    owner: str
    visibility: str = "private"

class ExperimentAdd(BaseModel):
    project_id: str
    experiment_data: Dict[str, Any]
    user: str

# ============================================================================
# Enhanced Protein Prediction Endpoints
# ============================================================================

@app.post("/api/v2/protein/predict-structure")
async def predict_protein_structure(protein_input: ProteinInput):
    """
    Enhanced protein structure prediction with multiple methods
    """
    try:
        logger.info(f"Enhanced structure prediction for: {protein_input.name}")
        
        result = await protein_predictor.predict_structure_comprehensive(
            sequence=protein_input.sequence,
            name=protein_input.name,
            include_confidence=True
        )
        
        return {
            "status": "success",
            "prediction": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Structure prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/protein/batch-predict")
async def batch_predict_proteins(sequences: List[Dict[str, str]]):
    """
    Batch protein structure prediction
    """
    try:
        logger.info(f"Batch prediction for {len(sequences)} proteins")
        
        results = await protein_predictor.batch_predict(
            sequences=sequences,
            max_concurrent=5
        )
        
        return {
            "status": "success",
            "total_proteins": len(sequences),
            "successful_predictions": len([r for r in results if "error" not in r]),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Multi-Model Drug Generation Endpoints
# ============================================================================

@app.post("/api/v2/drugs/multi-model-generate")
async def multi_model_drug_generation(request: MultiModelGenerationRequest):
    """
    Generate drug candidates using ensemble of AI models
    """
    try:
        logger.info(f"Multi-model generation: {request.num_candidates} candidates")
        
        result = await drug_generator.generate_multi_model_candidates(
            protein_sequence=request.protein_sequence,
            target_properties=request.target_properties,
            num_candidates=request.num_candidates,
            diversity_weight=request.diversity_weight
        )
        
        return {
            "status": "success",
            "generation_results": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Multi-model generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/drugs/optimize-lead")
async def optimize_lead_compound(
    lead_smiles: str,
    optimization_goals: Dict[str, float],
    iterations: int = 10
):
    """
    Optimize a lead compound using multi-model approach
    """
    try:
        result = await drug_generator.optimize_lead_compound(
            lead_smiles=lead_smiles,
            optimization_goals=optimization_goals,
            iterations=iterations
        )
        
        return {
            "status": "success",
            "optimization_results": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# High-Throughput Docking Endpoints
# ============================================================================

@app.post("/api/v2/docking/high-throughput")
async def high_throughput_docking(
    request: HighThroughputDockingRequest,
    background_tasks: BackgroundTasks
):
    """
    High-throughput docking with parallel processing
    """
    try:
        logger.info(f"HT-Docking: {len(request.ligands)} ligands")
        
        result = await ht_docking.run_high_throughput_docking(
            protein_data=request.protein_data,
            ligands=request.ligands,
            docking_params=request.docking_params
        )
        
        return {
            "status": "success",
            "docking_results": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"HT-Docking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/docking/virtual-screening")
async def virtual_screening(request: VirtualScreeningRequest):
    """
    Virtual screening of large compound libraries
    """
    try:
        logger.info(f"Virtual screening: {len(request.compound_library)} compounds")
        
        result = await ht_docking.run_virtual_screening(
            protein_data=request.protein_data,
            compound_library=request.compound_library,
            filters=request.filters,
            top_n=request.top_n
        )
        
        return {
            "status": "success",
            "screening_results": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v2/docking/job-status/{job_id}")
async def get_docking_job_status(job_id: str):
    """
    Get status of a running docking job
    """
    try:
        status = await ht_docking.get_job_status(job_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ============================================================================
# Collaborative Platform Endpoints
# ============================================================================

@app.post("/api/v2/projects/create")
async def create_project(project: ProjectCreate):
    """
    Create a new research project
    """
    try:
        result = await collab_platform.create_project(
            name=project.name,
            description=project.description,
            owner=project.owner,
            visibility=project.visibility
        )
        
        return {
            "status": "success",
            "project": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/projects/add-experiment")
async def add_experiment(experiment: ExperimentAdd):
    """
    Add an experiment to a project
    """
    try:
        result = await collab_platform.add_experiment(
            project_id=experiment.project_id,
            experiment_data=experiment.experiment_data,
            user=experiment.user
        )
        
        return {
            "status": "success",
            "experiment": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/projects/{project_id}/fork")
async def fork_project(project_id: str, new_owner: str):
    """
    Fork a project for independent development
    """
    try:
        result = await collab_platform.fork_project(
            project_id=project_id,
            new_owner=new_owner
        )
        
        return {
            "status": "success",
            "forked_project": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/projects/{project_id}/share-dataset")
async def share_dataset(
    project_id: str,
    dataset: Dict[str, Any],
    license: str = "CC-BY-4.0"
):
    """
    Share a dataset with the community
    """
    try:
        result = await collab_platform.share_dataset(
            project_id=project_id,
            dataset=dataset,
            license=license
        )
        
        return {
            "status": "success",
            "shared_dataset": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v2/projects/search")
async def search_projects(
    query: str = Query(..., description="Search query"),
    filters: Optional[str] = None
):
    """
    Search for public projects
    """
    try:
        filter_dict = eval(filters) if filters else None
        results = await collab_platform.search_projects(
            query=query,
            filters=filter_dict
        )
        
        return {
            "status": "success",
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v2/projects/{project_id}/analytics")
async def get_project_analytics(project_id: str):
    """
    Get analytics for a project
    """
    try:
        analytics = await collab_platform.get_project_analytics(project_id)
        return {
            "status": "success",
            "analytics": analytics
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/v2/projects/{project_id}/export")
async def export_project(project_id: str, format: str = "json"):
    """
    Export project data
    """
    try:
        export_data = await collab_platform.export_project(
            project_id=project_id,
            format=format
        )
        
        return {
            "status": "success",
            "export": export_data
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# ============================================================================
# Workflow Endpoints
# ============================================================================

@app.post("/api/v2/workflows/complete-pipeline")
async def complete_drug_discovery_pipeline(
    protein_input: ProteinInput,
    num_candidates: int = 20,
    docking_params: Optional[Dict] = None
):
    """
    Complete end-to-end drug discovery pipeline
    """
    try:
        logger.info("Starting complete pipeline")
        
        # Step 1: Predict protein structure
        structure = await protein_predictor.predict_structure_comprehensive(
            sequence=protein_input.sequence,
            name=protein_input.name
        )
        
        # Step 2: Generate drug candidates
        candidates_result = await drug_generator.generate_multi_model_candidates(
            protein_sequence=protein_input.sequence,
            num_candidates=num_candidates
        )
        
        # Step 3: High-throughput docking
        docking_result = await ht_docking.run_high_throughput_docking(
            protein_data={"name": protein_input.name, "sequence": protein_input.sequence},
            ligands=candidates_result["candidates"],
            docking_params=docking_params
        )
        
        return {
            "status": "success",
            "pipeline_results": {
                "protein_structure": structure,
                "drug_candidates": candidates_result,
                "docking_results": docking_result
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# System Endpoints
# ============================================================================

@app.get("/api/v2/health")
async def health_check():
    """Enhanced health check"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "components": {
            "protein_predictor": "operational",
            "drug_generator": "operational",
            "ht_docking": "operational",
            "collab_platform": "operational"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v2/capabilities")
async def get_capabilities():
    """Get platform capabilities"""
    return {
        "protein_prediction": {
            "methods": ["secondary_structure", "disorder", "binding_sites", "ptm_sites"],
            "batch_processing": True,
            "max_concurrent": 5
        },
        "drug_generation": {
            "models": ["GPT", "BERT", "T5", "VAE", "RL"],
            "ensemble_prediction": True,
            "lead_optimization": True
        },
        "docking": {
            "high_throughput": True,
            "virtual_screening": True,
            "max_workers": 8,
            "parallel_processing": True
        },
        "collaboration": {
            "project_management": True,
            "version_control": True,
            "data_sharing": True,
            "team_collaboration": True
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "api_enhanced:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
