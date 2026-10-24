"""Killable subprocess computation with durable leases and stale-writer fencing."""
import multiprocessing as mp
import socket
import time
from .config import LIMITS, Settings
from .identity import canonical, digest
from .store import Store, StoreError


def deny_external_connections():
    def deny(*args,**kwargs):
        raise PermissionError("external_destinations_disabled")
    # Application-level containment; OS/network enforcement remains a deployment gate.
    socket.socket.connect=deny
    socket.create_connection=deny


def child(connection,run_id,payload):
    deny_external_connections()
    try:
        from .compute import compute
        result=compute(run_id,payload)
        connection.send((True,result))
    except Exception:
        connection.send((False,"computation_failed"))
    finally:
        connection.close()


def execute_one(store,timeout=None):
    claimed=store.claim()
    if not claimed:
        return False
    row,attempt=claimed
    import json
    if digest(row["payload"]) != row["input_hash"]:
        store.finish(row["id"],attempt,error="input_integrity_failure")
        return True
    ctx=mp.get_context("spawn")
    reader,writer=ctx.Pipe(duplex=False)
    process=ctx.Process(target=child,args=(writer,row["id"],json.loads(row["payload"])),daemon=True)
    process.start()
    writer.close()
    deadline=time.monotonic()+(LIMITS["job_seconds"] if timeout is None else timeout)
    next_renew=time.monotonic()+5
    result=None
    failure="worker_exited"
    try:
        while time.monotonic() < deadline:
            if reader.poll(0.1):
                try:
                    result=reader.recv()
                except EOFError:
                    pass
                break
            if not process.is_alive():
                break
            if time.monotonic() >= next_renew:
                if not store.renew(row["id"],attempt):
                    failure="attempt_cancelled_or_expired"
                    break
                next_renew=time.monotonic()+5
        else:
            failure="job_timeout"
    finally:
        if process.is_alive():
            process.terminate()
        process.join(timeout=3)
        if process.is_alive():
            process.kill()
            process.join(timeout=3)
        reader.close()
    if result and result[0]:
        try:
            store.finish(row["id"],attempt,artifact=result[1])
        except (StoreError, ValueError) as exc:
            # Publication rolled back. The same attempt may record a sanitized
            # failure, but fencing still prevents it changing a newer attempt.
            code=exc.code if isinstance(exc,StoreError) else "artifact_contract_failure"
            store.finish(row["id"],attempt,error=code)
    else:
        store.finish(row["id"],attempt,error=result[1] if result else failure)
    return True


def main():
    from .compute import check_dependencies
    check_dependencies()
    store=Store(Settings.environment().database)
    while True:
        if not execute_one(store):
            time.sleep(0.5)


if __name__ == "__main__":
    main()
