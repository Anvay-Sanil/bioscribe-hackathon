"""
Benchmark Router
API endpoints for virtual screening benchmarks
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import logging

from services.screening_engines import list_engines
from services.benchmark_service import (
    run_benchmark, get_benchmark_history, get_pdbind_targets
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/benchmarks",
    tags=["Virtual Screening Benchmarks"],
    responses={404: {"description": "Not found"}}
)


class BenchmarkRunRequest(BaseModel):
    """Request to run a benchmark"""
    engine_id: str
    target_id: str


class BenchmarkRunResponse(BaseModel):
    """Response from benchmark run"""
    success: bool
    run_id: Optional[str] = None
    engine_name: Optional[str] = None
    target_name: Optional[str] = None
    ligand_count: int = 0
    spearman: Optional[float] = None
    rmse: Optional[float] = None
    enrichment_5pct: Optional[float] = None
    time_per_1k: Optional[float] = None
    message: str = ""


@router.get("/engines")
async def get_available_engines():
    """
    List available screening engines.
    
    Returns engines with availability status.
    """
    try:
        engines = list_engines()
        return {"engines": engines}
    except Exception as e:
        logger.error(f"Failed to list engines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/targets")
async def get_available_targets():
    """
    List available benchmark targets from PDBbind subset.
    """
    try:
        targets = get_pdbind_targets()
        return {"targets": targets}
    except Exception as e:
        logger.error(f"Failed to list targets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run", response_model=BenchmarkRunResponse)
async def run_engine_benchmark(request: BenchmarkRunRequest):
    """
    Run a benchmark for a specific engine and target.
    
    This runs the engine on the PDBbind subset and calculates metrics.
    """
    try:
        result = run_benchmark(request.engine_id, request.target_id)
        
        return BenchmarkRunResponse(
            success=True,
            run_id=result.run_id,
            engine_name=result.engine_name,
            target_name=result.target_name,
            ligand_count=result.ligand_count,
            spearman=result.metrics.spearman_correlation,
            rmse=result.metrics.rmse,
            enrichment_5pct=result.metrics.enrichment_5pct,
            time_per_1k=result.metrics.time_per_1k_ligands,
            message=f"Benchmark completed: {result.engine_name} on {result.target_id}"
        )
    except ValueError as e:
        return BenchmarkRunResponse(success=False, message=str(e))
    except Exception as e:
        logger.error(f"Benchmark failed: {e}", exc_info=True)
        return BenchmarkRunResponse(success=False, message=f"Benchmark failed: {str(e)}")


@router.get("/history")
async def get_history(
    engine_id: Optional[str] = None,
    target_id: Optional[str] = None,
    limit: int = 20
):
    """
    Get benchmark run history.
    
    Optionally filter by engine or target.
    """
    try:
        history = get_benchmark_history(engine_id, target_id, limit)
        return {"history": history, "count": len(history)}
    except Exception as e:
        logger.error(f"Failed to get history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
