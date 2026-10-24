"""Single bounded worker, no external connections or execution of uploaded code."""
import json
import multiprocessing as mp
from .engine import canonical, make_package, sha, verify


def child(pipe, row):
    from bioscribe.worker import deny_external_connections
    deny_external_connections()
    try:
        if sha(row["payload"]) != row["input_hash"]:
            raise ValueError("input_integrity_failure")
        payload = json.loads(row["payload"])
        if row["mode"] == "analyze":
            output = {"package": make_package(payload,row["id"]).model_dump(), "replay": None}
        else:
            output = {"package": payload, "replay": verify(payload)}
        pipe.send((True,output))
    except Exception as exc:
        known = {"historical_engine_unavailable", "incompatible_runtime", "replay_result_mismatch", "package_integrity_failure", "input_integrity_failure", "reference_integrity_failure", "reference_mapping_failure", "input_result_binding_failure"}
        pipe.send((False,str(exc) if str(exc) in known else "computation_failed"))
    finally:
        pipe.close()


def execute_one(store, timeout=30):
    claimed = store.claim()
    if not claimed:
        return False
    row, attempt = claimed
    ctx = mp.get_context("spawn")
    reader, writer = ctx.Pipe(duplex=False)
    process = ctx.Process(target=child,args=(writer,row),daemon=True)
    result = None
    try:
        process.start()
        writer.close()
        if reader.poll(timeout):
            try:
                result = reader.recv()
            except EOFError:
                pass
    finally:
        if process.is_alive():
            process.terminate()
        if process.pid:
            process.join(3)
            if process.is_alive():
                process.kill()
                process.join(3)
        reader.close()
        writer.close()
    try:
        store.finish(row["id"],attempt,output=result[1] if result and result[0] else None,error=result[1] if result and not result[0] else "job_timeout_or_worker_exit" if not result else None)
    except (ValueError, KeyError, TypeError):
        store.finish(row["id"],attempt,error="publication_rejected")
    return True
