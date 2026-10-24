"""The only supported API composition. Legacy routers are intentionally absent."""
import asyncio
import json
import re
import time
from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from .auth import authenticate
from .compute import check_dependencies
from .config import LIMITS, Settings
from .identity import InputError, canonical, parse_input
from .registry import METHODS
from .schemas import RunRequest, RunView
from .store import Store, StoreError


class BodyLimit:
    def __init__(self,app):
        self.app=app

    async def __call__(self,scope,receive,send):
        if scope["type"] != "http":
            return await self.app(scope,receive,send)
        headers=dict(scope["headers"])
        error=None
        if headers.get(b"content-encoding",b"identity") != b"identity":
            error=(415,"compressed_requests_disabled")
        chunks=[]
        size=0
        if not error:
            try:
                async with asyncio.timeout(LIMITS["request_seconds"]):
                    while True:
                        message=await receive()
                        if message["type"] == "http.disconnect":
                            return
                        size+=len(message.get("body",b""))
                        if size>LIMITS["request_bytes"]:
                            error=(413,"request_size_limit")
                            break
                        chunks.append(message.get("body",b""))
                        if not message.get("more_body",False):
                            break
            except TimeoutError:
                error=(408,"request_timeout")
        if error:
            return await JSONResponse({"error_code":error[1]},status_code=error[0])(scope,receive,send)
        sent=False
        async def replay():
            nonlocal sent
            if not sent:
                sent=True
                return {"type":"http.request","body":b"".join(chunks),"more_body":False}
            return await receive()
        response_started=False
        async def protected_send(message):
            nonlocal response_started
            if message["type"]=="http.response.start":
                response_started=True
                message["headers"]=list(message.get("headers",[]))+[(b"cache-control",b"no-store"),(b"x-content-type-options",b"nosniff")]
            await send(message)
        try:
            await self.app(scope,replay,protected_send)
        except Exception:
            # Do not let Uvicorn's exception logger serialize input-bearing exceptions.
            if not response_started:
                await JSONResponse({"error_code":"internal_error"},status_code=500)(scope,replay,protected_send)


def create_app(settings=None):
    settings=settings or Settings.environment()
    store=Store(settings.database)
    app=FastAPI(title="BioScribe public-data descriptor workbench",version="3.0.0",
        description="Scientific release and sensitive intake blocked. No validated predictive endpoints.")
    app.state.store=store
    app.add_middleware(BodyLimit)
    app.add_middleware(CORSMiddleware,allow_origins=[settings.origin],allow_credentials=False,
        allow_methods=["GET","POST"],allow_headers=["Authorization","Content-Type","Idempotency-Key"])

    @app.exception_handler(RequestValidationError)
    async def validation_error(request,exc):
        # Pydantic error records contain input values; never serialize them.
        return JSONResponse({"error_code":"invalid_request"},status_code=422)

    @app.exception_handler(StoreError)
    async def store_error(request,exc):
        return JSONResponse({"error_code":exc.code},status_code=exc.status)

    @app.exception_handler(Exception)
    async def internal_error(request,exc):
        return JSONResponse({"error_code":"internal_error"},status_code=500)

    def principal(authorization: str | None=Header(default=None)):
        actor=authenticate(settings.auth_file,authorization)
        if actor is None:
            raise HTTPException(401,detail="authentication_required")
        return actor

    @app.get("/health/live")
    def live():
        return {"status":"alive","contract_version":"3.0.0","scientific_release":"blocked","sensitive_intake":"blocked"}

    @app.get("/health/ready")
    def ready():
        try:
            check_dependencies()
            if not settings.auth_file.is_file():
                raise RuntimeError()
            principals=json.loads(settings.auth_file.read_text(encoding="utf-8"))
            if not principals or not all(p.get("tenant") and p.get("subject") and re.fullmatch(r"[a-f0-9]{64}",p.get("token_sha256","")) for p in principals):
                raise RuntimeError()
            with store.connection() as db:
                if db.execute("PRAGMA user_version").fetchone()[0] != 1:
                    raise RuntimeError()
                if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                    raise RuntimeError()
                worker=db.execute("SELECT last_seen FROM worker_health WHERE id=1").fetchone()
                if not worker or time.time()-worker[0] > LIMITS["lease_seconds"]:
                    raise RuntimeError()
            return {"status":"ready","scope":"public_non_sensitive_descriptors","scientific_release":"blocked","sensitive_intake":"blocked","audit_integrity":"integrity_unverified"}
        except Exception:
            return JSONResponse({"status":"not_ready","error_code":"dependency_configuration_or_storage_failure"},status_code=503)

    @app.get("/v3/capabilities")
    def capabilities(actor=Depends(principal)):
        return {"contract_version":"3.0.0","limits":LIMITS,"scientific_release":"blocked","sensitive_intake":"blocked","external_destinations":[],"predictive_endpoints":[],"methods":METHODS}

    @app.post("/v3/runs",response_model=RunView,status_code=202)
    def submit(payload: RunRequest,idempotency_key: str=Header(),actor=Depends(principal)):
        if not re.fullmatch(r"[A-Za-z0-9_-]{16,128}",idempotency_key):
            raise HTTPException(422,detail="invalid_idempotency_key")
        try:
            parse_input(payload)
        except InputError as exc:
            raise HTTPException(422,detail=str(exc))
        run_id=store.submit(actor,idempotency_key,payload.model_dump())
        return store.get(actor,run_id)

    @app.get("/v3/runs/{run_id}",response_model=RunView)
    def get(run_id: str,actor=Depends(principal)):
        return store.get(actor,run_id)

    @app.post("/v3/runs/{run_id}/cancel",response_model=RunView)
    def cancel(run_id: str,actor=Depends(principal)):
        return store.cancel(actor,run_id)

    @app.get("/v3/runs/{run_id}/export",response_model=RunView)
    def export(run_id: str,actor=Depends(principal)):
        run=store.get(actor,run_id)
        if run.status != "succeeded":
            raise HTTPException(409,detail="run_has_no_successful_artifact")
        return Response(canonical(run.model_dump()),media_type="application/json",
            headers={"Content-Disposition":f'attachment; filename="bioscribe-{run.run_id}.json"',"Cache-Control":"no-store"})

    @app.get("/v3/runs/{run_id}/audit")
    def audit(run_id: str,actor=Depends(principal)):
        return store.audit(actor,run_id)

    @app.get("/v3/runs/{run_id}/provenance")
    def provenance(run_id: str,actor=Depends(principal)):
        return store.provenance(actor,run_id)

    return app


app=create_app()
