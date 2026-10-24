"""Conservative workstation limits, not measured deployment capacity."""
from dataclasses import dataclass
from pathlib import Path
import os

LIMITS = {
    "request_bytes": 131072,
    "records": 8,
    "residues_per_record": 10000,
    "total_residues": 20000,
    "smiles_chars": 2048,
    "molecules": 16,
    "molecule_atoms": 256,
    "notes_chars": 4000,
    "model_tokens": 0,
    "output_bytes": 2097152,
    "queued_jobs": 32,
    "workers": 1,
    "job_seconds": 30,
    "lease_seconds": 45,
    "attempts": 2,
    "request_seconds": 10,
}


@dataclass(frozen=True)
class Settings:
    database: Path
    auth_file: Path
    origin: str = "http://localhost:3000"

    @classmethod
    def environment(cls):
        return cls(
            Path(os.getenv("BIOSCRIBE_DATABASE", "data/runs.sqlite3")),
            Path(os.getenv("BIOSCRIBE_AUTH_FILE", "data/principals.json")),
            os.getenv("BIOSCRIBE_ORIGIN", "http://localhost:3000"),
        )
