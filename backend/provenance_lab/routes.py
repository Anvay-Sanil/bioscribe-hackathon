import re
from fastapi import Depends, Header, HTTPException
from fastapi.responses import JSONResponse, Response
from .engine import canonical, load_bundle
from .schemas import LabRequest, ReplayPackage
from provenance_lab_legacy_v1.schemas import ReplayPackage as HistoricalReplayPackage
from contract_fields import require_complete
from .storage import LabError, LabStore


def install(app, settings, principal):
    store = LabStore(settings.database)

    @app.exception_handler(LabError)
    async def lab_error(request, exc):
        return JSONResponse({"error_code":exc.code},status_code=exc.status)

    def submit(mode, payload, key, actor):
        if not re.fullmatch(r"[A-Za-z0-9_-]{16,128}",key):
            raise HTTPException(422,detail="invalid_idempotency_key")
        try:
            if mode == "replay":
                require_complete(payload)
            run_id = store.submit(actor,key,mode,payload.model_dump())
        except ValueError as exc:
            if isinstance(exc,LabError):
                raise
            raise HTTPException(422,detail="invalid_replay_package") from None
        return store.get(actor,run_id)

    @app.post("/lab/runs",status_code=202)
    def analyze(payload:LabRequest,idempotency_key:str=Header(),actor=Depends(principal)):
        return submit("analyze",payload,idempotency_key,actor)

    @app.post("/lab/replay",status_code=202)
    def replay(payload:ReplayPackage | HistoricalReplayPackage,idempotency_key:str=Header(),actor=Depends(principal)):
        return submit("replay",payload,idempotency_key,actor)

    @app.get("/lab/runs/{run_id}")
    def get(run_id:str,actor=Depends(principal)):
        return store.get(actor,run_id)

    @app.post("/lab/runs/{run_id}/cancel")
    def cancel(run_id:str,actor=Depends(principal)):
        return store.cancel(actor,run_id)

    @app.get("/lab/runs/{run_id}/export")
    def export(run_id:str,actor=Depends(principal)):
        run = store.get(actor,run_id)
        if run["status"] != "succeeded":
            raise HTTPException(409,detail="run_has_no_successful_artifact")
        return Response(canonical(run["output"]["package"]),media_type="application/json",headers={"Content-Disposition":f'attachment; filename="bioscribe-replay-{run_id}.json"'})

    @app.get("/lab/schema")
    def schema():
        return ReplayPackage.model_json_schema()
