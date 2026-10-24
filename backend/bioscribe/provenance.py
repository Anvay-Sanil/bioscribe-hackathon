"""Recoverable source/reference snapshots, separate from scientific validation."""
from pathlib import Path
from .identity import canonical, digest
from .registry import METHODS


def source_snapshot():
    root=Path(__file__).parent
    return {**{path.name:path.read_text(encoding="utf-8") for path in sorted(root.glob("*.py"))},
            **{name:(root.parent/name).read_text(encoding="utf-8") for name in ("molecular_core.py","contract_fields.py")}}


def source_digest(sources):
    return digest(canonical({name:digest(content) for name,content in sources.items()}))


def bundle():
    sources=source_snapshot()
    return {"sources":sources,"methods":METHODS,"dependency_lock":(Path(__file__).parent.parent/"requirements-phase3.lock").read_text(encoding="utf-8"),
            "installation_lock":(Path(__file__).parent.parent/"requirements-phase3-install.lock").read_text(encoding="utf-8")}


def verify_bundle(data,manifest):
    installation_ok = not hasattr(manifest,"installation_lock_sha256") or digest(data.get("installation_lock",""))==manifest.installation_lock_sha256
    return installation_ok and (source_digest(data["sources"])==manifest.code_sha256 and digest(canonical(data["methods"]))==manifest.registry_sha256 and digest(data["dependency_lock"])==manifest.dependency_lock_sha256)
