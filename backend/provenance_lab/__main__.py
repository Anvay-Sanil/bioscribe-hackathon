"""Offline CLI: python -m provenance_lab analyze|replay INPUT --output OUTPUT."""
import argparse
import json
from pathlib import Path
from .engine import canonical, make_package, verify


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation",choices=["analyze","replay"])
    parser.add_argument("input",type=Path)
    parser.add_argument("--output",type=Path,required=True)
    args = parser.parse_args()
    from bioscribe.worker import deny_external_connections
    deny_external_connections()
    try:
        if args.input.stat().st_size > 2_000_000:
            raise ValueError("input_size_limit")
        data = json.loads(args.input.read_text(encoding="utf-8"))
        result = make_package(data).model_dump() if args.operation == "analyze" else verify(data)
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(canonical(result)+"\n",encoding="utf-8")
        print(json.dumps({"status":"completed","operation":args.operation,"output":str(args.output),"result_sha256":result.get("result_sha256",result.get("actual_sha256"))}))
        return 0
    except Exception as exc:
        code = str(exc)
        if code not in {"input_size_limit","historical_engine_unavailable","incompatible_runtime","package_integrity_failure","replay_result_mismatch","input_result_binding_failure"}:
            code = "invalid_input_or_computation_failure"
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(canonical({"status":"failed","error_code":code,"scientific_assessment":"not_assessed"})+"\n",encoding="utf-8")
        print(json.dumps({"status":"failed","error_code":code}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
