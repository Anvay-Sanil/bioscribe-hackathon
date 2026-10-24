"""Offline structural checks only. Never qualifies a model or changes runtime state.

Exit 0: declarations/files pass these checks; independent review still required.
Exit 2: incomplete, invalid, leaking, synthetic, or unreadable proposed bundle.
"""
import argparse
import hashlib
import json
from pathlib import Path

from pydantic import ValidationError

from .contracts import Protocol, SplitManifest

MAX_PROTOCOL_BYTES = 1_048_576
MAX_ARTIFACT_BYTES = 33_554_432
LIMITATIONS = [
    "No empirical predictions, performance metrics or confidence intervals were computed.",
    "Declared group identities, label truth, suitability, thresholds and independence need expert review.",
    "Local hashes do not prove authorship, preregistration time, holdout secrecy or an independent trust boundary.",
    "No approval, validation-registry installation, runtime activation or deployment clearance is performed.",
]


def result(issues, checked=0):
    return {
        "tool_version": "phase4-preflight/1.0.0",
        "status": "blocked" if issues else "structural_checks_passed_review_required",
        "scientific_assessment": "not_assessed",
        "scientific_release": "blocked",
        "sensitive_intake": "blocked",
        "checked_artifacts": checked,
        "issues": issues,
        "limitations": LIMITATIONS,
    }


def read_bounded(path, maximum):
    # Bound the read itself, including a file growing after the read starts.
    with path.open("rb") as stream:
        value = stream.read(maximum + 1)
    if len(value) > maximum:
        raise ValueError("file_size_limit")
    return value


def local_path(root, relative):
    # Resolve junctions/symlinks and prohibit alternate data streams and drive paths.
    if ":" in relative or "\\" in relative or Path(relative).is_absolute():
        raise ValueError("bundle_relative_posix_path_required")
    if ".." in Path(relative).parts:
        raise ValueError("path_traversal")
    resolved = (root / relative).resolve()
    if not resolved.is_relative_to(root.resolve()):
        raise ValueError("path_outside_bundle")
    if not resolved.is_file():
        raise ValueError("artifact_not_regular_file")
    return resolved


def strict_json(raw):
    def pairs(items):
        out = {}
        for key, value in items:
            if key in out:
                raise ValueError("duplicate_json_key")
            out[key] = value
        return out

    def invalid_constant(_):
        raise ValueError("nonfinite_json_number")

    return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid_constant)


def split_issues(plan, manifest):
    issues = []
    if manifest.dataset_id != plan.dataset.dataset_id:
        issues.append("split_dataset_identity_mismatch")
    units, entities, groups = set(), {}, {}
    for row in manifest.rows:
        if row.unit_id in units:
            issues.append("duplicate_unit_id")
        units.add(row.unit_id)
        if row.entity_key in entities and entities[row.entity_key] != row.role:
            issues.append("entity_crosses_split_roles")
        entities[row.entity_key] = row.role
        for key in plan.required_disjoint_group_keys:
            if key not in row.groups:
                issues.append("missing_required_group")
                continue
            identity = (key, row.groups[key])
            if identity in groups and groups[identity] != row.role:
                issues.append("declared_group_crosses_split_roles")
            groups[identity] = row.role
    test = [r for r in manifest.rows if r.role == "external_test"]
    if len(test) < plan.sampling.min_test_units:
        issues.append("insufficient_declared_test_units")
    independent = {r.groups.get(plan.sampling.independence_group) for r in test} - {None}
    if len(independent) < plan.sampling.min_independent_groups:
        issues.append("insufficient_declared_independent_groups")
    if not any(row.role in {"train", "tune"} for row in manifest.rows):
        issues.append("development_membership_not_disclosed")
    return sorted(set(issues))


def assess(raw, bundle_root):
    if len(raw) > MAX_PROTOCOL_BYTES:
        return result(["protocol_size_limit"])
    try:
        plan = Protocol.model_validate(strict_json(raw))
    except ValidationError as exc:
        # Do not echo supplied values, paths, labels, or free-text source content.
        fields = sorted({str(e["loc"][0]) if e["loc"] and e["loc"][0] in Protocol.model_fields else "protocol" for e in exc.errors()})
        return result(["invalid_protocol:" + field for field in fields])
    except (ValueError, UnicodeError, RecursionError):
        return result(["invalid_protocol_json"])
    issues, checked = [], 0
    if plan.dataset.provenance_kind != "public_empirical":
        issues.append("synthetic_data_cannot_support_scientific_qualification")
    payloads = {}
    for name, ref in plan.artifacts:
        try:
            data = read_bounded(local_path(bundle_root, ref.path), MAX_ARTIFACT_BYTES)
            if hashlib.sha256(data).hexdigest() != ref.sha256:
                issues.append("artifact_hash_mismatch:" + name)
                continue
            checked += 1
            if name == "split_manifest":
                payloads[name] = data
        except (OSError, ValueError):
            issues.append("artifact_unreadable_or_outside_limits:" + name)
    if "split_manifest" in payloads:
        try:
            manifest = SplitManifest.model_validate(strict_json(payloads["split_manifest"]))
            issues.extend(split_issues(plan, manifest))
        except (ValidationError, ValueError, UnicodeError, RecursionError):
            issues.append("invalid_split_manifest")
    return result(sorted(set(issues)), checked)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("protocol", type=Path)
    parser.add_argument("--bundle-root", type=Path, required=True)
    args = parser.parse_args()
    try:
        raw = read_bounded(args.protocol, MAX_PROTOCOL_BYTES)
        report = assess(raw, args.bundle_root)
    except (OSError, ValueError):
        report = result(["protocol_unreadable_or_outside_limits"])
    print(json.dumps(report, indent=2, allow_nan=False))
    return 2 if report["issues"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
