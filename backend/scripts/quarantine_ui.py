"""Move unsupported route sources out of Next's route tree, preserving their contents."""
from pathlib import Path

root=Path(__file__).resolve().parents[2]
workspace=root.resolve()
app=root/"bioscribe-ai/src/app"
archive=root/"bioscribe-ai/legacy-ui/app"
allowed={"pipeline/new/page.tsx","results/[id]/page.tsx"}
for source in app.rglob("page.tsx"):
    relative=source.relative_to(app)
    if relative.as_posix() in allowed:
        continue
    if relative.as_posix()=="page.tsx" and "PHASE3_CANONICAL_REDIRECT" in source.read_text(encoding="utf-8"):
        continue
    target=archive/relative
    # Check resolved absolute targets before any move; never traverse outside workspace.
    if not source.resolve().is_relative_to(workspace) or not target.resolve().is_relative_to(workspace):
        raise RuntimeError("outside_workspace")
    if target.exists():
        raise RuntimeError(f"archive_already_exists: {relative}")
    target.parent.mkdir(parents=True,exist_ok=True)
    source.rename(target)
(app/"page.tsx").write_text("// PHASE3_CANONICAL_REDIRECT\nimport { redirect } from 'next/navigation';\nexport default function Home() { redirect('/pipeline/new'); }\n",encoding="utf-8")
