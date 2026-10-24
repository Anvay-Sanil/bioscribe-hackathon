"""Inventory maintained and archived source without importing or executing it."""
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TREES = ["backend", "bioscribe-ai/src", "bioscribe-ai/legacy-ui", "bioscribe-ai/scripts", "validation/phase4", "learning", "hackathon"]
EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".cjs", ".ps1", ".css"}
EXCLUDE = {"__pycache__", "node_modules", ".local", ".pytest_cache", ".next", "venv", ".venv", "data"}
files = []
for tree in TREES:
    for directory, folders, names in os.walk(ROOT / tree):
        folders[:] = sorted(folder for folder in folders if folder not in EXCLUDE)
        for name in sorted(names):
            path = Path(directory) / name
            if path.suffix not in EXTENSIONS:
                continue
            content = path.read_bytes()
            files.append({"path": path.relative_to(ROOT).as_posix(), "lines": len(content.splitlines()), "sha256": hashlib.sha256(content).hexdigest(), "legacy_entry_guard": b"BIOSCRIBE_PHASE3_LEGACY_DISABLED" in content})
result = {
    "scope": "Source-file inventory only; hashes are correspondence checks, not code review completion or authorship. Excludes environments, private runtime state, generated packages and all study outcomes.",
    "files": files,
    "summary": {"source_files": len(files), "source_lines": sum(f["lines"] for f in files), "guard_marked_files": sum(f["legacy_entry_guard"] for f in files), "by_tree": {tree: sum(f["path"].startswith(tree + "/") for f in files) for tree in TREES}},
}
(Path(__file__).parent / "source-inventory.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result["summary"], indent=2))
