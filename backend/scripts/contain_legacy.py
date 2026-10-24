"""One-time migration: preserve legacy code but prevent its import/execution."""
import ast
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
TARGETS=["api_genuine.py","api_enhanced.py","api_advanced.py","api_unified.py","api_v4_frontier.py","main.py","main_demo.py","main_enterprise.py","main_perfect.py","main_real.py","engines/admet_engine.py","engines/protein_engine.py","engines/docking_engine.py","engines/molecule_engine.py","services/benchmark_service.py","enterprise_compliance.py"]

for relative in TARGETS:
    path=ROOT/"backend"/relative
    source=path.read_text(encoding="utf-8-sig")
    if "BIOSCRIBE_PHASE3_LEGACY_DISABLED" in source:
        continue
    tree=ast.parse(source)
    line=0
    for node in tree.body:
        if isinstance(node,ast.Expr) and isinstance(node.value,ast.Constant) and isinstance(node.value.value,str):
            line=node.end_lineno
        elif isinstance(node,ast.ImportFrom) and node.module=="__future__":
            line=node.end_lineno
        else:
            break
    lines=source.splitlines(keepends=True)
    lines.insert(line,'\n# BIOSCRIBE_PHASE3_LEGACY_DISABLED: retained for review, never a supported runtime.\nraise RuntimeError("Legacy BioScribe capability disabled. Use bioscribe.api:app and bioscribe.worker; unsupported scientific claims are withdrawn.")\n\n')
    path.write_text("".join(lines),encoding="utf-8")
