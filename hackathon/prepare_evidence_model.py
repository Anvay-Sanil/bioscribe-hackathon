"""Fetch one pinned <=8B model and a portable inference runtime; no service startup."""
import hashlib
import json
from pathlib import Path
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CARD = json.loads((ROOT / "backend/evidence_assistant/model_card.json").read_text())
DEST = ROOT / "hackathon/.local/evidence-model"


def download(url, path, limit, expected=None):
    if path.exists() and (expected is None or digest(path) == expected): return
    part = path.with_suffix(path.suffix + ".part")
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "BioScribe-Educational/0.1"}), timeout=60) as response, part.open("wb") as stream:
        count = 0
        last_notice = 0
        while chunk := response.read(4 * 1024 * 1024):
            count += len(chunk)
            if count > limit: raise ValueError("download_size_limit")
            stream.write(chunk)
            if count - last_notice >= 250_000_000:
                print(json.dumps({"file": path.name, "downloaded_mb": round(count / 1e6)}), flush=True)
                last_notice = count
    if expected and digest(part) != expected: raise ValueError("model_checksum_failure")
    part.replace(path)


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    if shutil.disk_usage(DEST).free < CARD["bytes"] + 500_000_000:
        raise ValueError("insufficient_disk_space")
    runtime = DEST / "runtime.zip"
    download(CARD["runtime_url"], runtime, 80_000_000)
    with zipfile.ZipFile(runtime) as archive:
        if sum(item.file_size for item in archive.infolist()) > 500_000_000: raise ValueError("runtime_expansion_limit")
        for item in archive.infolist():
            target = (DEST / "runtime" / item.filename).resolve()
            if not target.is_relative_to((DEST / "runtime").resolve()): raise ValueError("invalid_archive_path")
        archive.extractall(DEST / "runtime")
    model = DEST / CARD["file"]
    download(CARD["model_url"], model, CARD["bytes"], CARD["sha256"])
    (DEST / "installation.json").write_text(json.dumps({"model_id": CARD["model_id"], "model_sha256": digest(model),
        "runtime_sha256": digest(runtime), "runtime_release": CARD["runtime_release"], "parameters": CARD["parameter_count"],
        "scope": "Local installation receipt; not a benchmark or remote attestation"}, indent=2) + "\n")
    print(json.dumps({"status": "installed", "path": str(DEST), "parameters": CARD["parameter_count"]}))


if __name__ == "__main__": main()
