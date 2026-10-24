"""Local demo readiness probe. Makes one public analysis and one replay.

Uses only loopback. Does not print/store credentials or include them in receipts.
Exit 0 = exercised now, exit 2 = unavailable or inconsistent; no predictive claim.
"""
import json
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8000"


def main():
    token = (ROOT / "hackathon/.local/demo-token.txt").read_text().strip()
    def request(path, payload=None):
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(BASE + path, data=data, headers={"Authorization": "Bearer " + token,
            "Content-Type": "application/json", "Idempotency-Key": uuid.uuid4().hex})
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.load(response)
    def poll(job):
        deadline = time.monotonic() + 40
        while job["status"] in ("queued", "running"):
            if time.monotonic() > deadline:
                raise RuntimeError("job_timeout")
            time.sleep(.4)
            job = request("/lab/runs/" + job["run_id"])
        if job["status"] != "succeeded":
            raise RuntimeError("job_not_succeeded")
        return job
    health = request("/health/ready")
    if health.get("status") != "ready":
        raise RuntimeError("not_ready")
    caps = request("/v3/capabilities")
    if caps.get("scientific_release") != "blocked" or caps.get("sensitive_intake") != "blocked":
        raise RuntimeError("unexpected_contract")
    job = poll(request("/lab/runs", {"contract_version": "lab-1.1.0", "data_scope": "public_non_sensitive", "molecules": ["CCO", "c1ccccc1"], "budget": 1}))
    package = request("/lab/runs/" + job["run_id"] + "/export")
    if package != job["output"]["package"]:
        raise RuntimeError("export_mismatch")
    replay = poll(request("/lab/replay", package))
    receipt = replay["output"]["replay"]
    if receipt["status"] != "matched" or receipt["actual_sha256"] != package["result_sha256"]:
        raise RuntimeError("replay_mismatch")
    for route in ("evidence", "proof"):
        with urllib.request.urlopen("http://localhost:3000/" + route, timeout=20) as response:
            if response.status != 200:
                raise RuntimeError("frontend_unavailable")
    return {"status": "passed", "analysis_run": job["run_id"], "replay_run": replay["run_id"], "result_sha256": package["result_sha256"],
            "checks": ["API and worker readiness", "authenticated capabilities", "fresh public computation", "persisted export equality", "fresh exact replay", "evidence and proof HTTP routes"],
            "scientific_assessment": "not_assessed", "user_value": "untested", "scope": "This local execution only; not a browser or cross-machine test."}


if __name__ == "__main__":
    try:
        result = main()
    except (OSError, ValueError, KeyError, TypeError, RuntimeError, urllib.error.URLError):
        print(json.dumps({"status": "failed", "error_code": "local_readiness_or_replay_failure", "action": "Check local API, worker, token file and frontend. No successful rehearsal claimed."}))
        sys.exit(2)
    print(json.dumps(result, indent=2))
