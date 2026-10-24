
# BIOSCRIBE_PHASE3_LEGACY_DISABLED: retained for review, never a supported runtime.
raise RuntimeError("Legacy BioScribe capability disabled. Use bioscribe.api:app and bioscribe.worker; unsupported scientific claims are withdrawn.")

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import os
from datetime import datetime
import json
import logging

# Import our custom modules
from models.protein import ProteinProcessor
from models.drug_generator_simple import DrugGenerator
from models.docking_simple import DockingSimulator
from models.report_generator import MedicalReportGenerator
from models.ai_molecular_engine import AIMolecularEngine
from models.advanced_docking import AIEnhancedDockingEngine
from laboratory_docking_engine import LaboratoryDockingEngine
from database.mongodb import DatabaseManager
from routers.enterprise_router import router as enterprise_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BioScribe AI API",
    description="Next-generation biocomputing platform for AI-powered drug discovery",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
# Register enterprise endpoints
app.include_router(enterprise_router)

protein_processor = ProteinProcessor()
drug_generator = DrugGenerator()
docking_simulator = DockingSimulator()
report_generator = MedicalReportGenerator()
db_manager = DatabaseManager()

# Initialize AI components
ai_molecular_engine = AIMolecularEngine()
ai_docking_engine = AIEnhancedDockingEngine()
laboratory_docking_engine = LaboratoryDockingEngine()

# Pydantic models
class ProteinInput(BaseModel):
    sequence: str = Field(..., description="FASTA protein sequence")
    name: Optional[str] = Field(None, description="Protein name")
    organism: Optional[str] = Field(None, description="Source organism")

class DrugCandidate(BaseModel):
    smiles: str
    name: str
    molecular_weight: float
    logP: float
    tpsa: float
    qed: float
    binding_affinity: Optional[float] = None
    rmsd: Optional[float] = None
    confidence: Optional[float] = None

class DockingResult(BaseModel):
    protein_id: str
    candidates: List[DrugCandidate]
    best_candidate: DrugCandidate
    timestamp: datetime
    session_id: str

class SessionResponse(BaseModel):
    session_id: str
    status: str
    message: str

class DrugGenerationRequest(BaseModel):
    protein_id: str = Field(..., description="Protein ID")
    num_candidates: int = Field(default=10, ge=1, le=20, description="Number of candidates to generate")

# API Status
@app.get("/")
async def root():
    return {
        "message": "BioScribe AI API",
        "version": "1.0.0",
        "status": "active",
        "ai_models": {
            "drug_generator": "active",
            "docking_predictor": "active",
            "protein_analyzer": "active"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": await db_manager.health_check(),
            "ai_models": "operational"
        }
    }

# Protein Processing Endpoints
@app.post("/api/protein/analyze", response_model=Dict[str, Any])
async def analyze_protein(protein_input: ProteinInput):
    """Analyze protein sequence and extract metadata"""
    try:
        logger.info(f"Analyzing protein sequence of length {len(protein_input.sequence)}")
        
        # Validate and process protein sequence
        analysis = await protein_processor.analyze_sequence(
            sequence=protein_input.sequence,
            name=protein_input.name,
            organism=protein_input.organism
        )
        
        # Store in database
        protein_id = await db_manager.store_protein(analysis)
        analysis["protein_id"] = protein_id
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing protein: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Protein analysis failed: {str(e)}")

# Drug Generation Endpoints
@app.post("/api/drugs/generate")
async def generate_drug_candidates(request: DrugGenerationRequest):
    """Generate AI-powered drug candidates for a protein target"""
    try:
        logger.info(f"Generating {request.num_candidates} drug candidates for protein {request.protein_id}")
        
        # Retrieve protein data
        protein_data = await db_manager.get_protein(request.protein_id)
        if not protein_data:
            raise HTTPException(status_code=404, detail="Protein not found")
        
        # Generate drug candidates
        candidates = await drug_generator.generate_candidates(
            protein_sequence=protein_data["sequence"],
            num_candidates=request.num_candidates
        )
        
        # Store candidates
        session_id = await db_manager.store_candidates(request.protein_id, candidates)
        
        return {
            "session_id": session_id,
            "protein_id": request.protein_id,
            "candidates": candidates,
            "count": len(candidates),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating drug candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Drug generation failed: {str(e)}")

# Docking Simulation Endpoints
@app.post("/api/docking/simulate")
async def simulate_docking(
    session_id: str,
    background_tasks: BackgroundTasks
):
    """Perform docking simulation for generated drug candidates"""
    try:
        logger.info(f"Starting docking simulation for session {session_id}")
        
        # Retrieve session data
        session_data = await db_manager.get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Start background docking simulation
        background_tasks.add_task(
            run_docking_simulation,
            session_id,
            session_data["candidates"]
        )
        
        return {
            "session_id": session_id,
            "status": "simulation_started",
            "message": "Docking simulation initiated. Check status for updates.",
            "estimated_time": "2-5 minutes"
        }
        
    except Exception as e:
        logger.error(f"Error starting docking simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Docking simulation failed: {str(e)}")

@app.get("/api/docking/status/{session_id}")
async def get_docking_status(session_id: str):
    """Get the status of a docking simulation"""
    try:
        status = await db_manager.get_docking_status(session_id)
        return status
    except Exception as e:
        logger.error(f"Error getting docking status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")

@app.get("/api/results/{session_id}")
async def get_results(session_id: str):
    """Get final docking results for a session"""
    try:
        results = await db_manager.get_results(session_id)
        if not results:
            raise HTTPException(status_code=404, detail="Results not found")
        return results
    except Exception as e:
        logger.error(f"Error retrieving results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Results retrieval failed: {str(e)}")

# Background task for docking simulation
async def run_docking_simulation(session_id: str, candidates: List[Dict]):
    """Background task to run docking simulation"""
    try:
        logger.info(f"Running docking simulation for session {session_id}")
        
        # Update status to running
        await db_manager.update_docking_status(session_id, "running", 0)
        
        # Simulate docking for each candidate
        docked_candidates = []
        total_candidates = len(candidates)
        
        for i, candidate in enumerate(candidates):
            # Simulate docking
            docking_result = await docking_simulator.dock_molecule(
                smiles=candidate["smiles"],
                protein_sequence=candidate.get("target_sequence", "")
            )
            
            # Update candidate with docking results
            candidate.update(docking_result)
            docked_candidates.append(candidate)
            
            # Update progress
            progress = int((i + 1) / total_candidates * 100)
            await db_manager.update_docking_status(session_id, "running", progress)
        
        # Sort by binding affinity (lower is better)
        docked_candidates.sort(key=lambda x: x.get("binding_affinity", 0))
        
        # Store final results
        results = {
            "session_id": session_id,
            "candidates": docked_candidates,
            "best_candidate": docked_candidates[0] if docked_candidates else None,
            "timestamp": datetime.now().isoformat(),
            "status": "completed"
        }
        
        await db_manager.store_results(session_id, results)
        await db_manager.update_docking_status(session_id, "completed", 100)
        
        logger.info(f"Docking simulation completed for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error in docking simulation: {str(e)}")
        await db_manager.update_docking_status(session_id, "failed", 0, str(e))

# Export endpoints
@app.get("/api/export/{session_id}/json")
async def export_json(session_id: str):
    """Export results as JSON"""
    try:
        results = await db_manager.get_results(session_id)
        if not results:
            raise HTTPException(status_code=404, detail="Results not found")
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.get("/api/export/{session_id}/report")
async def export_comprehensive_report(session_id: str):
    """Generate comprehensive medical-grade drug discovery report"""
    try:
        # Get session data
        session_data = await db_manager.get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get protein data
        protein_data = await db_manager.get_protein(session_data["protein_id"])
        if not protein_data:
            raise HTTPException(status_code=404, detail="Protein data not found")
        
        # Get results
        results = await db_manager.get_results(session_id)
        if not results:
            raise HTTPException(status_code=404, detail="Results not found")
        
        # Generate comprehensive report
        report = report_generator.generate_comprehensive_report(
            protein_data=protein_data,
            candidates=session_data.get("candidates", []),
            docking_results=results,
            session_id=session_id
        )
        
        return report
        
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@app.get("/api/export/{session_id}/summary")
async def export_executive_summary(session_id: str):
    """Export executive summary for quick review"""
    try:
        # Get session data
        session_data = await db_manager.get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get protein data
        protein_data = await db_manager.get_protein(session_data["protein_id"])
        if not protein_data:
            raise HTTPException(status_code=404, detail="Protein data not found")
        
        # Get results
        results = await db_manager.get_results(session_id)
        if not results:
            raise HTTPException(status_code=404, detail="Results not found")
        
        # Generate summary
        summary = report_generator._generate_executive_summary(
            protein_data, session_data.get("candidates", []), results
        )
        
        return {
            "session_id": session_id,
            "generated_at": datetime.now().isoformat(),
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

@app.get("/api/export/{session_id}/text")
async def export_text_report(session_id: str):
    """Export report as formatted text"""
    try:
        # Get comprehensive report
        report_response = await export_comprehensive_report(session_id)
        
        # Convert to text format
        text_report = report_generator.export_to_text(report_response)
        
        return {
            "session_id": session_id,
            "format": "text",
            "content": text_report,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating text report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text export failed: {str(e)}")

# New AI-Enhanced Endpoints

@app.post("/api/ai/analyze-protein")
async def ai_analyze_protein(protein_input: ProteinInput):
    """Advanced AI-powered protein analysis with embeddings"""
    try:
        logger.info(f"Starting AI protein analysis for: {protein_input.name}")
        
        # Initialize AI engine if needed
        await ai_molecular_engine.initialize()
        
        # Perform comprehensive protein analysis
        result = await ai_molecular_engine.protein_embedder.embed_protein_sequence(
            protein_input.sequence
        )
        
        # Add metadata
        result.update({
            "name": protein_input.name,
            "organism": protein_input.organism,
            "analysis_type": "ai_enhanced",
            "timestamp": datetime.now().isoformat()
        })
        
        return result
        
    except Exception as e:
        logger.error(f"AI protein analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@app.post("/api/ai/generate-molecules")
async def ai_generate_molecules(
    protein_input: ProteinInput,
    num_molecules: int = 10,
    target_properties: Optional[Dict[str, float]] = None
):
    """AI-powered molecule generation using HuggingFace models"""
    try:
        logger.info(f"Generating {num_molecules} AI molecules for protein: {protein_input.name}")
        
        # Initialize AI engine
        await ai_molecular_engine.initialize()
        
        # Complete AI pipeline: protein -> drug candidates
        result = await ai_molecular_engine.process_protein_to_drugs(
            protein_input.sequence,
            num_molecules,
            target_properties
        )
        
        # Add session metadata
        session_id = f"ai_session_{int(datetime.now().timestamp())}"
        result.update({
            "session_id": session_id,
            "protein_name": protein_input.name,
            "protein_organism": protein_input.organism,
            "generation_method": "ai_enhanced"
        })
        
        # Store in database
        try:
            await db_manager.store_session_data(session_id, result)
        except Exception as db_error:
            logger.warning(f"Database storage failed: {db_error}")
        
        return result
        
    except Exception as e:
        logger.error(f"AI molecule generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/api/ai/enhanced-docking")
async def ai_enhanced_docking(
    session_id: str,
    num_poses: int = 5,
    use_alphafold: bool = True
):
    """AI-enhanced molecular docking with advanced scoring"""
    try:
        logger.info(f"Starting AI-enhanced docking for session: {session_id}")
        
        # Retrieve session data
        session_data = await db_manager.get_session_data(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        protein_data = {
            "sequence": session_data.get("protein_analysis", {}).get("sequence", ""),
            "name": session_data.get("protein_name", "Unknown")
        }
        
        candidates = session_data.get("candidates", [])
        if not candidates:
            raise HTTPException(status_code=400, detail="No candidates found in session")
        
        # Perform AI-enhanced docking
        docking_result = await ai_docking_engine.perform_docking(
            protein_data, candidates, num_poses
        )
        
        # Update session with docking results
        session_data["ai_docking_results"] = docking_result
        session_data["docking_method"] = "ai_enhanced"
        session_data["last_updated"] = datetime.now().isoformat()
        
        # Store updated data
        try:
            await db_manager.store_session_data(session_id, session_data)
        except Exception as db_error:
            logger.warning(f"Database update failed: {db_error}")
        
        return {
            "session_id": session_id,
            "docking_results": docking_result,
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"AI-enhanced docking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI docking failed: {str(e)}")

@app.get("/api/ai/session/{session_id}")
async def get_ai_session(session_id: str):
    """Retrieve complete AI session data"""
    try:
        session_data = await db_manager.get_session_data(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session_id,
            "data": session_data,
            "has_ai_analysis": "protein_analysis" in session_data,
            "has_ai_candidates": "candidates" in session_data,
            "has_ai_docking": "ai_docking_results" in session_data,
            "retrieved_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Session retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Session retrieval failed: {str(e)}")

@app.post("/api/ai/complete-pipeline")
async def ai_complete_pipeline(
    protein_input: ProteinInput,
    num_molecules: int = 10,
    num_poses: int = 5,
    target_properties: Optional[Dict[str, float]] = None
):
    """Complete AI pipeline: protein analysis -> molecule generation -> docking"""
    try:
        logger.info(f"Starting complete AI pipeline for: {protein_input.name}")
        
        # Initialize AI systems
        await ai_molecular_engine.initialize()
        
        # Step 1: AI molecule generation
        generation_result = await ai_molecular_engine.process_protein_to_drugs(
            protein_input.sequence,
            num_molecules,
            target_properties
        )
        
        # Step 2: AI-enhanced docking
        protein_data = {
            "sequence": protein_input.sequence,
            "name": protein_input.name
        }
        
        docking_result = await ai_docking_engine.perform_docking(
            protein_data, 
            generation_result["candidates"], 
            num_poses
        )
        
        # Combine results
        session_id = f"ai_complete_{int(datetime.now().timestamp())}"
        complete_result = {
            "session_id": session_id,
            "protein_input": {
                "name": protein_input.name,
                "sequence": protein_input.sequence,
                "organism": protein_input.organism
            },
            "ai_generation": generation_result,
            "ai_docking": docking_result,
            "pipeline_version": "2.0.0",
            "completed_at": datetime.now().isoformat(),
            "processing_time": generation_result.get("processing_time", 0) + docking_result.get("processing_time", 0)
        }
        
        # Store complete session
        try:
            await db_manager.store_session_data(session_id, complete_result)
        except Exception as db_error:
            logger.warning(f"Database storage failed: {db_error}")
        
        return complete_result
        
    except Exception as e:
        logger.error(f"Complete AI pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI pipeline failed: {str(e)}")

@app.get("/api/ai/health")
async def ai_health_check():
    """Check AI system health and capabilities"""
    try:
        # Check AI engine initialization
        await ai_molecular_engine.initialize()
        
        # Check HuggingFace API availability
        hf_available = bool(os.getenv("HUGGINGFACE_API_KEY"))
        
        return {
            "status": "healthy",
            "ai_engine_initialized": ai_molecular_engine.initialized,
            "huggingface_api_available": hf_available,
            "protein_embedder_ready": ai_molecular_engine.protein_embedder is not None,
            "molecule_generator_ready": ai_molecular_engine.molecule_generator is not None,
            "docking_engine_ready": ai_docking_engine is not None,
            "capabilities": {
                "protein_analysis": True,
                "ai_molecule_generation": True,
                "enhanced_docking": True,
                "binding_affinity_prediction": True,
                "interaction_analysis": True
            },
            "version": "2.0.0",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Laboratory Docking Endpoint
@app.post("/api/laboratory/docking")
async def laboratory_docking(request: Dict[str, Any]):
    """Real-time laboratory-grade molecular docking"""
    try:
        logger.info("Starting laboratory-grade molecular docking")
        
        protein_data = request.get("protein_data", {})
        ligand_smiles = request.get("ligand_smiles", "")
        binding_sites = request.get("binding_sites", [])
        
        if not protein_data or not ligand_smiles:
            raise HTTPException(status_code=400, detail="Missing protein data or ligand SMILES")
        
        # Perform real-time laboratory docking
        docking_result = await laboratory_docking_engine.perform_real_time_docking(
            protein_data=protein_data,
            ligand_smiles=ligand_smiles,
            binding_sites=binding_sites
        )
        
        return {
            "status": "success",
            "method": "laboratory_grade",
            "timestamp": datetime.now().isoformat(),
            **docking_result
        }
        
    except Exception as e:
        logger.error(f"Laboratory docking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Laboratory docking failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
