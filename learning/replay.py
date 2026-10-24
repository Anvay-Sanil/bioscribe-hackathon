"""Offline molecular ranking exercise with explicitly fabricated labels only."""
import argparse
import hashlib
import json
import math
from fractions import Fraction
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from backend.bioscribe.compute import check_dependencies, heuristic, manifest, parse_supported_smiles

MAX_BYTES = 131072
MAX_ROWS = 128
MAX_TOTAL_ATOMS = 8000
TIE_NAMESPACE = b"bioscribe-learning/tie/v1\0"


class ReplayError(ValueError):
    """A fixed error code safe to show without input text or tracebacks."""


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class Molecule(StrictModel):
    record_id: str = Field(pattern=r"^[A-Za-z0-9_-]{1,64}$")
    smiles: str = Field(min_length=1, max_length=2048)
    test_label: bool | None


class Library(StrictModel):
    schema_version: Literal["learning-library/1.0.0"]
    data_class: Literal["synthetic_software_fixture"]
    label_origin: Literal["fabricated_for_software_demonstration"]
    dataset_id: str = Field(pattern=r"^[A-Za-z0-9_-]{1,64}$")
    selection_budget: int = Field(ge=1, le=MAX_ROWS)
    molecules: list[Molecule] = Field(min_length=1, max_length=MAX_ROWS)


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def parse_library(raw: bytes) -> Library:
    if len(raw) > MAX_BYTES:
        raise ReplayError("input_size_limit")

    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ReplayError("duplicate_json_key")
            result[key] = value
        return result

    def invalid_constant(_):
        raise ReplayError("nonfinite_json_number")

    try:
        data = json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid_constant)
        library = Library.model_validate(data)
    except ReplayError:
        raise
    except (ValueError, UnicodeError, RecursionError, ValidationError) as exc:
        raise ReplayError("invalid_learning_library") from exc
    if len({r.record_id for r in library.molecules}) != len(library.molecules):
        raise ReplayError("duplicate_record_id")
    return library


def field(value, method, version, units, category):
    return {
        "value": value, "method": method, "version": version, "units": units,
        "evidence_category": category, "assessment_status": "computed" if value is not None else "not_assessed",
        "validation_record": None, "predictive_domain": "not_established",
        "coverage": "whole_accepted_graph" if value is not None else "not_computed",
    }


def score(smiles):
    from rdkit import Chem, rdBase
    from rdkit.Chem import Descriptors, QED, rdMolDescriptors

    molecule = parse_supported_smiles(smiles)
    if molecule is None:
        return None
    with rdBase.BlockLogs():
        try:
            canonical = Chem.MolToSmiles(molecule, isomericSmiles=True)
            mw = Descriptors.MolWt(molecule)
            tpsa = rdMolDescriptors.CalcTPSA(molecule)
            distance = heuristic(mw, tpsa)
            qed = QED.qed(molecule, w=QED.WEIGHT_MEAN)
        except Exception as exc:
            raise ReplayError("calculation_failed") from exc
    if not all(math.isfinite(x) for x in (mw, tpsa, distance, qed)):
        raise ReplayError("nonfinite_computation")
    entity = sha(canonical.encode("utf-8"))
    return {
        "canonical_isomeric_smiles": canonical,
        "entity_sha256": entity,
        "tie_key": sha(TIE_NAMESPACE + entity.encode("ascii")),
        "atom_count": molecule.GetNumAtoms(),
        "molecular_weight": field(mw, "rdkit_descriptors", "1.1.0", "g/mol", "computed_descriptor"),
        "tpsa": field(tpsa, "rdkit_descriptors", "1.1.0", "angstrom^2", "computed_descriptor"),
        "heuristic": field(distance, "prioritization_heuristic", "1.1.0", "dimensionless", "unvalidated_heuristic"),
        "qed": field(qed, "rdkit_qed_WEIGHT_MEAN", "2025.03.3", "dimensionless", "computed_descriptor"),
    }


def select(rows, key, budget, *, descending=False):
    """Preserve full scores and exact budget; never use labels or file order."""
    sign = -1 if descending else 1
    ordered = sorted(rows, key=lambda r: (sign * r[key]["value"], r["tie_key"], r["entity_sha256"]))
    return ordered[:budget]


def ratio(numerator, denominator):
    if denominator == 0:
        return {"numerator": numerator, "denominator": denominator, "value": None, "status": "undefined"}
    return {"numerator": numerator, "denominator": denominator, "value": float(Fraction(numerator, denominator)), "status": "computed"}


def replay(raw: bytes) -> dict:
    library = parse_library(raw)
    try:
        check_dependencies()
        environment = manifest().model_dump()
    except Exception as exc:
        raise ReplayError("locked_environment_unavailable") from exc

    rows, seen, atoms = [], set(), 0
    for record in library.molecules:
        result = score(record.smiles)
        row = {"record_id": record.record_id, "input_sha256": sha(record.smiles.encode("utf-8")),
               "test_label": record.test_label, "label_origin": library.label_origin,
               "status": "computed" if result else "unsupported_input", "chemistry": result}
        if result:
            if result["entity_sha256"] in seen:
                raise ReplayError("duplicate_chemical_identity")
            seen.add(result["entity_sha256"])
            atoms += result["atom_count"]
            if atoms > MAX_TOTAL_ATOMS:
                raise ReplayError("total_atom_limit")
        rows.append(row)

    unknown = sum(r.test_label is None for r in library.molecules)
    unsupported = sum(r["status"] != "computed" for r in rows)
    budget, n = library.selection_budget, len(rows)
    report = {
        "schema_version": "learning-replay/1.0.0", "run_id": uuid4().hex,
        "purpose": "SOFTWARE LEARNING EXERCISE — ALL LABELS ARE FABRICATED",
        "data_class": library.data_class, "dataset_id": library.dataset_id,
        "input_sha256": sha(raw), "environment": environment,
        "learning_source_sha256": sha(Path(__file__).read_bytes()),
        "scientific_assessment": "not_assessed", "scientific_release": "blocked", "sensitive_intake": "blocked",
        "study_execution": "not_performed", "qualification_status": "not_assessed", "confidence_bounds": None,
        "scope": "Fixed synthetic library, conditional on invented test labels; no assay or population claim",
        "input_policy": "plain_smiles_concrete_graph/1.1.0",
        "tie_policy": "bioscribe-learning/tie/v1; unrounded score, ascending tie hash, ascending entity hash; no tie expansion",
        "limits": {"input_bytes": MAX_BYTES, "rows": MAX_ROWS, "smiles_chars": 2048, "atoms_per_molecule": 256, "total_atoms": MAX_TOTAL_ATOMS},
        "coverage": {"input_rows": n, "scored_rows": n - unsupported, "unsupported_rows": unsupported, "unknown_test_labels": unknown},
        "selection_budget": budget, "status": "complete", "reason": None,
        "selections": None, "synthetic_label_counts": None, "conditional_metrics": None,
        "rows": rows,
    }
    if unsupported:
        report.update(status="incomplete", reason="unsupported_molecules_no_reranking")
    elif n < budget:
        report.update(status="incomplete", reason="fewer_unique_molecules_than_budget")
    elif unknown:
        report.update(status="insufficient_evidence", reason="unknown_test_labels_no_imputation_or_exclusion")
    else:
        scored = [{**r["chemistry"], "test_label": r["test_label"]} for r in rows]
        h_rows = select(scored, "heuristic", budget)
        q_rows = select(scored, "qed", budget, descending=True)
        h_ids, q_ids = [r["entity_sha256"] for r in h_rows], [r["entity_sha256"] for r in q_rows]
        h, q, a = sum(r["test_label"] for r in h_rows), sum(r["test_label"] for r in q_rows), sum(r.test_label for r in library.molecules)
        report["selections"] = {"heuristic_entity_sha256": h_ids, "qed_entity_sha256": q_ids,
                                "overlap_count": len(set(h_ids) & set(q_ids))}
        report["synthetic_label_counts"] = {"population_positive": a, "heuristic_positive": h, "qed_positive": q, "additional_positive": h - q}
        report["conditional_metrics"] = {"heuristic_precision": ratio(h, budget), "qed_precision": ratio(q, budget),
                                         "precision_difference": ratio(h - q, budget), "expected_random_hits": ratio(budget * a, n),
                                         "enrichment": ratio(h * n, budget * a)}
    if manifest().model_dump() != environment:
        raise ReplayError("runtime_source_changed")
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Local synthetic learning-library JSON; no network access")
    args = parser.parse_args(argv)
    try:
        with args.input.open("rb") as stream:
            raw = stream.read(MAX_BYTES + 1)
        result = replay(raw)
        code = 0 if result["status"] == "complete" else 2
    except (OSError, ReplayError) as exc:
        result = {"status": "rejected", "reason": str(exc) if isinstance(exc, ReplayError) else "input_unreadable",
                  "scientific_assessment": "not_assessed", "scientific_release": "blocked", "sensitive_intake": "blocked"}
        code = 2
    except Exception:
        result = {"status": "failed", "reason": "unexpected_local_failure", "scientific_assessment": "not_assessed",
                  "scientific_release": "blocked", "sensitive_intake": "blocked"}
        code = 2
    print(json.dumps(result, indent=2, allow_nan=False))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
