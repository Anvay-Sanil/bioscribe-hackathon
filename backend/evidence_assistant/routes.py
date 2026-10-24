import re
from fastapi import Depends, Header, HTTPException
from fastapi.responses import JSONResponse, Response
from .corpus import canonical, load_corpus
from .engine import review
from .schemas import LABEL, Review, ReviewRequest
from .storage import ReviewError, ReviewStore


def install(app, settings, principal):
    store = ReviewStore(settings.database)

    @app.exception_handler(ReviewError)
    async def review_error(request, exc):
        return JSONResponse({"error_code":exc.code}, status_code=exc.status)

    @app.get("/assistant/capabilities")
    def capabilities(actor=Depends(principal)):
        records, corpus_hash = load_corpus()
        assays = [r for r in records if r["kind"] == "assay_record"]
        examples = [f"{r['molecule_id']} in activity {r['activity_id']} has {r['endpoint']} = {r['value']} {r['units']}." for r in assays[:3]]
        run = next(r for r in records if r["kind"] == "run_record")
        examples.append(f"{run['molecule_name']} in run {run['run_id']} has {run['endpoint']} = {run['property']['value']} {run['units']}.")
        return {"contract_version":"evidence-assistant/0.1.0", "research_aid_label":LABEL, "corpus_sha256":corpus_hash,
                "sources":len(records), "assay_records":len(assays), "examples":examples,
                "confidence_status":"not_calibrated", "benchmark_status":"provisional_unreviewed",
                "supported_scope":"Exact scoped assay-record and computed-run propositions; broader semantics abstain",
                "limits":{"characters":8000,"statements":16,"concurrent_reviews":2,"model_timeout_seconds":90}}

    @app.post("/assistant/reviews", status_code=201)
    def submit(payload: ReviewRequest, idempotency_key: str=Header(), actor=Depends(principal)):
        if not re.fullmatch(r"[A-Za-z0-9_-]{16,128}",idempotency_key): raise HTTPException(422,detail="invalid_idempotency_key")
        run_id, created = store.create(actor,idempotency_key,payload.model_dump())
        if created:
            try:
                result = review(payload.model_dump(),run_id=run_id)
                store.finish(actor,run_id,result.model_dump())
            except Exception:
                store.finish(actor,run_id,error="review_failed_or_unavailable")
        return store.get(actor,run_id)

    @app.get("/assistant/reviews/{run_id}")
    def get(run_id: str, actor=Depends(principal)):
        return store.get(actor,run_id)

    @app.get("/assistant/reviews/{run_id}/export")
    def export(run_id: str, actor=Depends(principal)):
        result = store.get(actor,run_id)
        if result["status"] != "succeeded": raise HTTPException(409,detail="review_unavailable")
        return Response(canonical(result), media_type="application/json",headers={"Content-Disposition":f'attachment; filename="bioscribe-claim-review-{run_id}.json"'})

    @app.get("/assistant/schema")
    def schema(): return Review.model_json_schema()

    from .passage_review import PaperRequest, interpret, output_schema
    from .passage_storage import PaperStore
    from .papers import load as load_papers, eligibility as paper_eligibility
    paper_store = PaperStore(settings.database)

    @app.get('/assistant/papers/capabilities')
    def papers_capabilities(actor=Depends(principal)):
        papers, fingerprint = load_papers()
        return {'contract_version': 'paper-review/0.2.0', 'research_aid_label': LABEL,
                'snapshot_sha256': fingerprint, 'status': 'experimental_requires_review',
                'papers': [{'source_id': key, 'title': p['title'], 'url': p['url'], 'abstract': p['abstract'],
                            'raw_sha256': p['raw_sha256'], 'retrieved_utc': p['retrieved_utc'],
                            'eligibility': paper_eligibility(p) or 'eligible_as_of_snapshot'} for key, p in papers.items()],
                'limits': {'characters': 4000, 'statements': 3, 'papers': 3, 'concurrent_reviews': 1, 'model_timeout_seconds': 90}}

    @app.post('/assistant/papers/reviews', status_code=201)
    def paper_submit(payload: PaperRequest, idempotency_key: str=Header(), actor=Depends(principal)):
        if not re.fullmatch(r'[A-Za-z0-9_-]{16,128}', idempotency_key): raise HTTPException(422, detail='invalid_idempotency_key')
        papers, _ = load_papers()
        if any(key not in papers for key in payload.paper_ids): raise HTTPException(422, detail='paper_not_in_snapshot')
        run_id, created = paper_store.create(actor, idempotency_key, payload.model_dump())
        if created:
            try: paper_store.finish(actor, run_id, interpret(payload.model_dump(), run_id=run_id).model_dump())
            except Exception: paper_store.finish(actor, run_id, error='paper_review_failed_or_unavailable')
        return paper_store.get(actor, run_id)

    @app.get('/assistant/papers/reviews/{run_id}')
    def paper_get(run_id: str, actor=Depends(principal)): return paper_store.get(actor, run_id)

    @app.get('/assistant/papers/reviews/{run_id}/export')
    def paper_export(run_id: str, actor=Depends(principal)):
        value = paper_store.get(actor, run_id)
        if value['status'] != 'succeeded': raise HTTPException(409, detail='paper_review_unavailable')
        return Response(canonical(value), media_type='application/json', headers={'Content-Disposition': f'attachment; filename="bioscribe-paper-review-{run_id}.json"', 'Cache-Control': 'no-store'})

    @app.get('/assistant/papers/schema')
    def paper_schema(): return output_schema()

    @app.get('/assistant/evaluation')
    def evaluation_summary(actor=Depends(principal)):
        from .benchmark_report import read_summary
        try: return read_summary()
        except (ValueError, OSError, KeyError, TypeError): raise HTTPException(409, detail='evaluation_summary_unavailable_or_invalid')
