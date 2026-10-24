"""Authoritative HM-01 contract. Legacy v3 reports retain their own contract."""
import math
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

Hash = Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
VERSION = "1.0.0"
QUANTITIES = {
    "molecular_weight": ("g/mol", "computed_descriptor"),
    "calculated_logp": ("dimensionless", "computed_descriptor"),
    "tpsa": ("angstrom^2", "computed_descriptor"),
    "aromatic_heavy_atom_fraction": ("dimensionless", "computed_descriptor"),
    "qed": ("dimensionless", "computed_descriptor"),
    "descriptor_distance": ("dimensionless", "unvalidated_heuristic"),
    "binding_affinity": (None, "model_prediction"),
    "toxicity": (None, "model_prediction"),
    "half_life": (None, "model_prediction"),
}


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


class LabRequest(Strict):
    contract_version: Literal["lab-1.0.0"] = "lab-1.0.0"
    data_scope: Literal["public_non_sensitive"] = "public_non_sensitive"
    molecules: Annotated[list[Annotated[str, Field(max_length=2048)]], Field(min_length=1, max_length=16)]
    budget: Annotated[int, Field(ge=1, le=16)] = 3

    @model_validator(mode="after")
    def budget_bound(self):
        if self.budget > len(self.molecules):
            raise ValueError("budget_exceeds_input_count")
        return self


class Diagnostic(Strict):
    code: Literal["empty_input", "unsupported_annotation", "non_ascii_character", "whitespace_or_control", "atom_limit", "dummy_atom", "query_graph", "unsupported_bond", "unsupported_stereo", "atom_map", "ring_closure", "branch_syntax", "smiles_syntax", "invalid_valence", "aromaticity_failure", "sanitization_failure", "unspecified_stereo", "multiple_fragments", "charged_graph"]
    severity: Literal["error", "warning"]
    message: str
    character_offset: Annotated[int, Field(ge=0)] | None = None
    atom_indices: list[int] = []
    bond_indices: list[int] = []


class Property(Strict):
    quantity: str
    value: float | int | None
    units: str | None
    availability: Literal["computed", "not_computed", "not_available", "not_applicable"]
    assessment_status: Literal["computed", "not_assessed"]
    evidence_category: Literal["computed_descriptor", "unvalidated_heuristic", "model_prediction"]
    method: Literal["bioscribe-evidence-lab/1.0.0"] = "bioscribe-evidence-lab/1.0.0"
    implementation_fidelity: Literal["software_fixture_checked"] = "software_fixture_checked"
    validation_record: None = None
    predictive_validation: Literal["not_assessed"] = "not_assessed"
    domain: Literal["accepted_graph", "unsupported_input", "undefined_quantity", "not_established"]
    coverage: Literal["complete", "none"]
    reason: str

    @model_validator(mode="after")
    def meaning(self):
        if self.quantity not in QUANTITIES or QUANTITIES[self.quantity] != (self.units, self.evidence_category):
            raise ValueError("quantity_metadata_mismatch")
        if self.availability == "computed":
            if self.value is None or isinstance(self.value, bool) or not math.isfinite(self.value) or self.assessment_status != "computed" or self.coverage != "complete" or self.domain != "accepted_graph" or self.evidence_category == "model_prediction":
                raise ValueError("contradictory_computation")
        elif self.value is not None or self.assessment_status != "not_assessed" or self.coverage != "none":
            raise ValueError("contradictory_missingness")
        if self.evidence_category == "model_prediction" and (self.availability != "not_available" or self.domain != "not_established"):
            raise ValueError("unsupported_prediction")
        if self.availability == "not_applicable" and (self.quantity != "aromatic_heavy_atom_fraction" or self.domain != "undefined_quantity"):
            raise ValueError("inapplicable_quantity_mismatch")
        return self


class Reference(Strict):
    source: Literal["PubChem", "ChEMBL"]
    identifier: str
    label: str
    raw_sha256: Hash
    retrieved_utc: str
    source_version: str
    url: str
    correspondence: Literal["exact_isomeric_graph"] = "exact_isomeric_graph"


class Molecule(Strict):
    index: int
    original_smiles: str
    input_sha256: Hash
    status: Literal["identified", "rejected"]
    canonical_smiles: str | None
    identity_sha256: Hash | None
    formal_charge: int | None
    fragments: int | None
    normalization_history: list[str]
    diagnostics: list[Diagnostic]
    properties: list[Property]
    references: list[Reference]
    reference_status: Literal["matched_frozen_record", "not_available", "not_computed"]

    @model_validator(mode="after")
    def complete_properties(self):
        if [p.quantity for p in self.properties] != list(QUANTITIES):
            raise ValueError("property_coverage_mismatch")
        if self.status == "rejected" and (self.canonical_smiles is not None or self.identity_sha256 is not None or self.formal_charge is not None or self.fragments is not None or self.references or any(p.value is not None for p in self.properties) or not any(d.severity == "error" for d in self.diagnostics)):
            raise ValueError("rejected_graph_has_results")
        if self.status == "identified" and (not self.canonical_smiles or not self.identity_sha256 or self.formal_charge is None or not self.fragments or any(d.severity == "error" for d in self.diagnostics)):
            raise ValueError("identified_graph_incomplete")
        return self


class Ranking(Strict):
    status: Literal["computed", "not_assessed"]
    reason: str
    budget: int
    heuristic_order: list[int]
    qed_order: list[int]
    heuristic_selection: list[int]
    qed_selection: list[int]
    tie_break: Literal["input_sha256_then_index"] = "input_sha256_then_index"
    interpretation: Literal["Descriptor orderings only; no activity labels or performance assessment"] = "Descriptor orderings only; no activity labels or performance assessment"


class Result(Strict):
    contract_version: Literal["lab-1.0.0"] = "lab-1.0.0"
    request_sha256: Hash
    engine_sha256: Hash
    snapshot_sha256: Hash
    identity_policy: Literal["exact_isomeric_graph/1.0.0"] = "exact_isomeric_graph/1.0.0"
    rows: list[Molecule]
    identity_groups: list[list[int]]
    ranking: Ranking
    scientific_assessment: Literal["not_assessed"] = "not_assessed"
    sensitive_intake: Literal["blocked"] = "blocked"


class Bundle(Strict):
    sources: dict[str, str]
    dependency_lock: str
    references: dict[str, str]


class ReplayPackage(Strict):
    format: Literal["bioscribe-replay/1.0.0"] = "bioscribe-replay/1.0.0"
    run_id: Annotated[str, Field(pattern=r"^[a-f0-9]{32}$")]
    request: LabRequest
    result: Result
    result_sha256: Hash
    bundle: Bundle
    runtime: dict[str, str]
    integrity_scope: Literal["Checksums detect inconsistency; they do not authenticate authorship"] = "Checksums detect inconsistency; they do not authenticate authorship"
