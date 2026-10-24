"""Verify an extracted transfer against its manifest; no third-party packages."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys


def verify(root, strict=False):
    root = Path(root).resolve()
    manifest = json.loads((root / "FILE_MANIFEST.json").read_text(encoding="utf-8"))
    seen = set()
    failures = []
    for entry in manifest["files"]:
        name = entry["path"]
        rel = PurePosixPath(name)
        if not name or rel.is_absolute() or ".." in rel.parts or "\\" in name or ":" in name or name.casefold() in seen:
            raise ValueError("unsafe_or_duplicate_manifest_path")
        seen.add(name.casefold())
        path = root.joinpath(*rel.parts)
        if not path.resolve().is_relative_to(root) or any(p.is_symlink() for p in [path, *path.parents] if p != root.parent):
            raise ValueError("linked_or_outside_file")
        if not path.is_file():
            failures.append({"path": name, "reason": "missing"})
        elif path.stat().st_size != entry["bytes"] or hashlib.sha256(path.read_bytes()).hexdigest() != entry["sha256"]:
            failures.append({"path": name, "reason": "changed"})
    if strict:
        actual = {p.relative_to(root).as_posix().casefold() for p in root.rglob("*") if p.is_file()}
        extra = actual - seen - {"file_manifest.json"}
        failures.extend({"path": name, "reason": "unexpected"} for name in sorted(extra))
    return {"status": "passed" if not failures else "failed", "checked_files": len(seen), "strict": strict,
            "failures": failures, "scope": "Byte correspondence only; not authenticated authorship or scientific validation"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--strict", action="store_true", help="Reject files added after packaging; use before installing dependencies")
    args = parser.parse_args()
    try:
        result = verify(args.root, args.strict)
    except (OSError, ValueError, KeyError, TypeError):
        print(json.dumps({"status": "failed", "error": "unreadable_or_invalid_manifest"}))
        sys.exit(2)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "passed" else 2)
