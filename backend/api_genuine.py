"""
BioScribe AI — Genuine API Server
Every endpoint returns real, deterministic computation results.
No mock data. No random.uniform(). No fake AI model claims.

Computation engines:
  - ProteinEngine:   BioPython physicochemical analysis + Chou-Fasman + motif scanning
  - MoleculeEngine:  RDKit scaffold hopping + R-group enumeration + PAINS/Lipinski
  - AffinityScorer:  Empirical descriptor-based scoring (honest: not 3D docking)
  - ADMETPredictor:  ESOL, Egan, Veber, structural alert models

Run: python api_genuine.py
Docs: http://localhost:8000/docs
"""

# BIOSCRIBE_PHASE3_LEGACY_DISABLED: retained for review, never a supported runtime.
raise RuntimeError("Legacy BioScribe capability disabled. Use bioscribe.api:app and bioscribe.worker; unsupported scientific claims are withdrawn.")


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from datetime import datetime
import numpy as np

# Import genuine engines
from engines.protein_engine import ProteinEngine
from engines.molecule_engine import MoleculeEngine
from engines.docking_engine import AffinityScorer
from engines.admet_engine import ADMETPredictor

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bioscribe.api")

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="BioScribe AI — Genuine Computation",
    description=(
        "Drug discovery platform powered by real cheminformatics. "
        "BioPython protein analysis, RDKit molecule generation, "
        "empirical affinity scoring, ADMET prediction. "
        "No mock data. No random numbers. Every result is deterministic."
    ),
    version="2.0.0-genuine",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Initialize Engines ─────────────────────────────────────────────────────

protein_engine = ProteinEngine()
molecule_engine = MoleculeEngine()
affinity_scorer = AffinityScorer()
admet_predictor = ADMETPredictor()

logger.info("All genuine computation engines initialized")

# ─── Numpy JSON serialization helper ─────────────────────────────────────────

def clean_for_json(obj):
    """Convert numpy types to native Python for JSON serialization."""
    if isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(i) for i in obj]
    return obj

# ─── Request Models ──────────────────────────────────────────────────────────

class ProteinInput(BaseModel):
    sequence: str = Field(..., min_length=10, description="Protein amino acid sequence (FASTA or raw)")
    name: str = Field(default="Unknown Protein", description="Protein name")
    organism: str = Field(default="Unknown", description="Source organism")

class DrugGenerationRequest(BaseModel):
    sequence: str = Field(..., min_length=10, description="Target protein sequence")
    name: str = Field(default="Unknown Protein")
    organism: str = Field(default="Unknown")
    num_candidates: int = Field(default=20, ge=5, le=50, description="Number of candidates to generate")
    target_properties: Optional[Dict[str, float]] = None

class CompletePipelineRequest(BaseModel):
    sequence: str = Field(..., min_length=10)
    name: str = Field(default="Unknown Protein")
    organism: str = Field(default="Unknown")
    num_candidates: int = Field(default=20, ge=5, le=50)

class SMILESInput(BaseModel):
    smiles: str = Field(..., description="SMILES string to validate/analyze")

class BatchSMILESInput(BaseModel):
    smiles_list: List[str] = Field(..., description="List of SMILES strings")

# ─── Health & Status ─────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "BioScribe AI",
        "version": "2.0.0-genuine",
        "status": "active",
        "engines": {
            "protein_analysis": "BioPython ProteinAnalysis + Chou-Fasman + Kyte-Doolittle",
            "molecule_generation": "RDKit scaffold hopping + R-group enumeration",
            "affinity_scoring": "Empirical descriptor-based scoring",
            "admet_prediction": "ESOL + Egan + Veber + structural alerts",
        },
        "mock_data": False,
        "deterministic": True,
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "engines_ready": True,
        "scaffolds_loaded": len(molecule_engine._validated_scaffolds),
    }

# ─── Protein Analysis ────────────────────────────────────────────────────────

@app.post("/api/protein/analyze")
async def analyze_protein(request: ProteinInput):
    """
    Genuine protein sequence analysis.
    Uses BioPython for physicochemical properties, Chou-Fasman for secondary
    structure, Kyte-Doolittle for hydropathy, PROSITE-style motif scanning.
    """
    try:
        logger.info(f"Analyzing protein: {request.name} ({len(request.sequence)} chars)")
        result = await protein_engine.analyze(
            sequence=request.sequence,
            name=request.name,
            organism=request.organism,
        )
        return {"status": "success", "data": clean_for_json(result)}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Protein analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# ─── Drug Candidate Generation ───────────────────────────────────────────────

@app.post("/api/drugs/generate")
async def generate_drugs(request: DrugGenerationRequest):
    """
    Generate drug candidates using RDKit scaffold hopping.
    Every molecule is sanitized, PAINS-filtered, and Lipinski-checked.
    Properties are computed from actual molecular structure.
    """
    try:
        logger.info(f"Generating {request.num_candidates} candidates for {request.name}")

        # Step 1: Analyze protein to guide design
        protein_analysis = await protein_engine.analyze(
            sequence=request.sequence,
            name=request.name,
            organism=request.organism,
        )

        # Step 2: Generate candidates
        generation_result = await molecule_engine.generate_candidates(
            protein_analysis=protein_analysis,
            num_candidates=request.num_candidates,
            target_properties=request.target_properties,
        )

        return {"status": "success", "data": clean_for_json(generation_result)}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Drug generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# ─── Affinity Scoring ────────────────────────────────────────────────────────

@app.post("/api/affinity/score")
async def score_affinity(request: DrugGenerationRequest):
    """
    Score drug candidates against a protein target.
    Uses empirical descriptor-based scoring (NOT 3D docking).
    Deterministic: same inputs always produce the same scores.
    """
    try:
        logger.info(f"Scoring candidates against {request.name}")

        # Analyze protein
        protein_analysis = await protein_engine.analyze(
            sequence=request.sequence,
            name=request.name,
            organism=request.organism,
        )

        # Generate candidates
        gen_result = await molecule_engine.generate_candidates(
            protein_analysis=protein_analysis,
            num_candidates=request.num_candidates,
        )

        # Score candidates
        scored = await affinity_scorer.score_candidates(
            candidates=gen_result["candidates"],
            protein_analysis=protein_analysis,
        )

        return {
            "status": "success",
            "data": {
                "scored_candidates": clean_for_json(scored),
                "protein_name": request.name,
                "scoring_method": "Empirical descriptor-based (not 3D docking)",
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Affinity scoring failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

# ─── ADMET Prediction ────────────────────────────────────────────────────────

@app.post("/api/admet/predict")
async def predict_admet(request: SMILESInput):
    """
    Predict ADMET properties for a molecule.
    Uses ESOL (solubility), Egan egg (BBB), Veber (oral BA), structural alerts.
    """
    try:
        result = await admet_predictor.predict(request.smiles)
        if result is None:
            raise HTTPException(status_code=400, detail="Invalid SMILES string")
        return {"status": "success", "data": clean_for_json(result)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ADMET prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ADMET prediction failed: {str(e)}")

@app.post("/api/admet/predict-batch")
async def predict_admet_batch(request: BatchSMILESInput):
    """Batch ADMET prediction for multiple molecules."""
    try:
        candidates = [{"canonical_smiles": s} for s in request.smiles_list]
        results = await admet_predictor.predict_batch(candidates)
        return {"status": "success", "data": clean_for_json(results)}

    except Exception as e:
        logger.error(f"Batch ADMET failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ─── SMILES Validation ───────────────────────────────────────────────────────

@app.post("/api/molecule/validate")
async def validate_molecule(request: SMILESInput):
    """Validate a SMILES string and return computed properties."""
    result = molecule_engine.validate_smiles(request.smiles)
    if result is None:
        raise HTTPException(status_code=400, detail="Invalid SMILES string")
    return {"status": "success", "data": clean_for_json(result)}

# ─── Complete Pipeline ───────────────────────────────────────────────────────

@app.post("/api/pipeline/complete")
async def complete_pipeline(request: CompletePipelineRequest):
    """
    Complete end-to-end pipeline:
      1. Protein analysis (BioPython + Chou-Fasman + motif scanning)
      2. Drug candidate generation (RDKit scaffold hopping)
      3. Affinity scoring (empirical descriptor-based)
      4. ADMET prediction (ESOL + Egan + Veber)

    Every step uses genuine computation. No mock data.
    """
    try:
        logger.info("=" * 70)
        logger.info(f"COMPLETE PIPELINE: {request.name}")
        logger.info(f"Sequence: {len(request.sequence)} residues")
        logger.info("=" * 70)

        start_time = datetime.now()

        # ── Step 1: Protein Analysis ──
        logger.info("Step 1/4: Protein analysis...")
        protein_analysis = await protein_engine.analyze(
            sequence=request.sequence,
            name=request.name,
            organism=request.organism,
        )

        # ── Step 2: Drug Generation ──
        logger.info("Step 2/4: Drug candidate generation...")
        generation_result = await molecule_engine.generate_candidates(
            protein_analysis=protein_analysis,
            num_candidates=request.num_candidates,
        )

        # ── Step 3: Affinity Scoring ──
        logger.info("Step 3/4: Affinity scoring...")
        scored_candidates = await affinity_scorer.score_candidates(
            candidates=generation_result["candidates"],
            protein_analysis=protein_analysis,
        )

        # ── Step 4: ADMET Prediction ──
        logger.info("Step 4/4: ADMET prediction...")
        admet_results = await admet_predictor.predict_batch(scored_candidates)

        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"Pipeline completed in {elapsed:.2f}s")

        # ── Build Response ──
        best = admet_results[0] if admet_results else None
        best_affinity = best["affinity_prediction"]["predicted_affinity_kcal_mol"] if best else None

        result = {
            "pipeline_id": f"genuine_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "protein_name": request.name,
            "organism": request.organism,
            "sequence_length": len(request.sequence),

            "protein_analysis": protein_analysis,
            "candidates": admet_results,

            "summary": {
                "total_candidates": len(admet_results),
                "best_candidate": best["candidate_id"] if best else None,
                "best_affinity_kcal_mol": best_affinity,
                "lipinski_compliant_count": sum(
                    1 for c in admet_results
                    if c.get("properties", {}).get("lipinski_compliant", False)
                ),
                "elapsed_seconds": round(elapsed, 2),
            },

            "methods": {
                "protein_analysis": "BioPython ProteinAnalysis + Chou-Fasman + Kyte-Doolittle + PROSITE motifs",
                "drug_generation": "RDKit scaffold hopping + R-group enumeration + PAINS/Lipinski filtering",
                "affinity_scoring": "Empirical descriptor-based scoring (not 3D docking)",
                "admet_prediction": "ESOL (Delaney 2004) + Egan egg (BBB) + Veber rules + structural alerts",
            },

            "honest_disclaimers": [
                "Affinity scores are QSAR estimates, not physics-based docking calculations",
                "ADMET predictions use empirical models with known limitations",
                "Generated molecules are computationally valid but require experimental validation",
                "Secondary structure predictions are Chou-Fasman propensity-based, not ML-predicted",
            ],

            "timestamp": datetime.now().isoformat(),
            "deterministic": True,
        }

        return {"status": "success", "results": clean_for_json(result)}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        import traceback
        raise HTTPException(status_code=500, detail={
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc(),
        })


# ─── Run ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "api_genuine:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
