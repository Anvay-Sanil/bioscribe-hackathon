"""Strict parsing with explicit normalization and original-coordinate mapping."""
import hashlib
import json
from .schemas import InputIdentity, Record, RunRequest
from .config import LIMITS


class InputError(ValueError):
    pass


def canonical(value) -> str:
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def parse_input(request: RunRequest) -> InputIdentity:
    text = request.content
    records = []
    if request.polymer_type in {"notes", "molecule"}:
        if request.record_count != 0:
            raise InputError("record_count_mismatch")
        if request.polymer_type == "molecule" and (text or not request.molecules):
            raise InputError("molecule_input_requires_smiles_list_only")
        if request.polymer_type == "notes" and (not text.strip() or len(text) > LIMITS["notes_chars"]):
            raise InputError("notes_limit_or_empty")
    else:
        if not text or not text.isascii():
            raise InputError("empty_or_non_ascii_sequence")
        alphabet = {"protein": "ACDEFGHIKLMNPQRSTVWY", "dna": "ACGT", "rna": "ACGU"}[request.polymer_type]
        fasta = text.startswith(">")
        groups = []
        current = None
        offset = 0
        for line in text.splitlines(keepends=True):
            raw = line.rstrip("\r\n")
            if raw.startswith(">"):
                if not fasta or not raw[1:].strip():
                    raise InputError("malformed_fasta_header")
                if current is not None:
                    groups.append(current)
                current = [raw[1:].split()[0], [], [], offset, []]
            else:
                if current is None:
                    if fasta:
                        raise InputError("malformed_fasta")
                    current = ["record_1", [], [], 0, []]
                for index, character in enumerate(raw):
                    if character in " \t":
                        continue
                    if character.upper() not in alphabet:
                        raise InputError("ambiguous_nonstandard_gap_stop_or_invalid_symbol")
                    current[1].append(character.upper())
                    current[2].append(offset + index)
                current[4].append(line)
            offset += len(line)
        if current is not None:
            groups.append(current)
        seen = set()
        for name, residues, positions, _, original_lines in groups:
            sequence = "".join(residues)
            if not sequence or len(sequence) > LIMITS["residues_per_record"] or name in seen:
                raise InputError("empty_duplicate_or_oversized_record")
            seen.add(name)
            records.append(Record(record_id=name, sequence=sequence,
                original_sha256=digest("".join(original_lines)), normalized_sha256=digest(sequence),
                normalization=["ASCII uppercase", "spaces/tabs/line endings removed", "FASTA header excluded" if fasta else "raw sequence"], source_offsets=positions))
        if len(records) != request.record_count or not records:
            raise InputError("record_count_mismatch")
        if sum(len(r.sequence) for r in records) > LIMITS["total_residues"]:
            raise InputError("total_residue_limit")
    return InputIdentity(request_sha256=digest(canonical(request.model_dump())), content_sha256=digest(text),
        polymer_type=request.polymer_type, record_count=len(records), source=request.source.model_dump(), records=records)
