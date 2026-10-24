"""Authoritative IO and field-evidence contract; no predictive validation exists yet."""
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator
CONTRACT_VERSION = "3.0.0"
from .config import LIMITS

Digest = Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
Identifier = Annotated[str, Field(pattern=r"^[a-f0-9]{32}$")]


class HistoricalStrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False, frozen=True, revalidate_instances="always")


class HistoricalSourceIdentity(HistoricalStrictModel):
    accession: str | None = Field(default=None, max_length=128)
    version: str | None = Field(default=None, max_length=64)
    organism_taxon_id: int | None = Field(default=None, gt=0)
    provenance: Literal["user_supplied_unverified"] = "user_supplied_unverified"
    unknown_reason: str = Field(default="User supplied; no verified source accession", min_length=1, max_length=256)

    @model_validator(mode="after")
    def accession_version(self):
        if (self.accession is None) != (self.version is None):
            raise ValueError("accession_and_version_required_together")
        return self


class HistoricalRunRequest(HistoricalStrictModel):
    contract_version: Literal["3.0.0"] = CONTRACT_VERSION
    data_classification: Literal["public_non_sensitive"]
    polymer_type: Literal["protein", "dna", "rna", "notes", "molecule"]
    content: str = Field(max_length=LIMITS["request_bytes"])
    record_count: int = Field(ge=0, le=LIMITS["records"])
    source: HistoricalSourceIdentity = Field(default_factory=HistoricalSourceIdentity)
    molecules: list[Annotated[str, Field(min_length=1, max_length=LIMITS["smiles_chars"])]] = Field(default_factory=list, max_length=LIMITS["molecules"])
    analysis: Literal["descriptors_and_observations"] = "descriptors_and_observations"


class HistoricalRecord(HistoricalStrictModel):
    record_id: str
    sequence: str
    original_sha256: Digest
    normalized_sha256: Digest
    normalization: list[str]
    # Original Unicode string offsets, zero based. Headers are never residues.
    source_offsets: list[int]

    @model_validator(mode="after")
    def check_record(self):
        import hashlib
        if hashlib.sha256(self.sequence.encode()).hexdigest()!=self.normalized_sha256 or len(self.sequence)!=len(self.source_offsets):
            raise ValueError("record_identity_mismatch")
        if any(x<0 for x in self.source_offsets) or any(a>=b for a,b in zip(self.source_offsets,self.source_offsets[1:])):
            raise ValueError("invalid_source_coordinates")
        return self


class HistoricalInputIdentity(HistoricalStrictModel):
    request_sha256: Digest
    content_sha256: Digest
    polymer_type: str
    record_count: int
    source: HistoricalSourceIdentity
    records: list[HistoricalRecord]
    normalization_policy: Literal["ascii_case_and_layout_only_v1"] = "ascii_case_and_layout_only_v1"


class HistoricalCoverage(HistoricalStrictModel):
    total: int = Field(ge=0)
    analyzed: int = Field(ge=0)
    complete: bool
    coordinate_system: Literal["zero_based_half_open", "molecule", "not_applicable"]
    reason: str

    @model_validator(mode="after")
    def consistent(self):
        if self.analyzed > self.total or self.complete != (self.analyzed == self.total):
            raise ValueError("inconsistent_coverage")
        return self


class HistoricalEvidence(HistoricalStrictModel):
    run_id: Identifier
    input_sha256: Digest
    field_id: str
    quantity: str
    value: float | int | list[int] | None
    units: str | None
    evidence_category: Literal["computed_descriptor", "structural_rule_observation", "unvalidated_heuristic", "model_prediction", "unverified_extraction"]
    method_id: str
    method_version: str
    implementation_fidelity: Literal["fixture_checked", "not_verified"]
    fidelity_record: str | None
    validation_record: None = None
    validation_status: Literal["not_available", "not_applicable"]
    validation_reason: str
    domain: Literal["in_domain", "out_of_domain", "undetermined", "not_applicable"]
    domain_reason: str
    coverage: HistoricalCoverage
    assessment_status: Literal["computed", "observed", "not_assessed", "needs_review"]
    execution_status: Literal["succeeded", "failed", "unavailable", "unsupported_input"]
    reason: str

    @model_validator(mode="after")
    def enforce_evidence(self):
        from .legacy_registry_v3 import METHODS
        method = METHODS.get(self.method_id)
        if not method or self.method_version != method["version"]:
            raise ValueError("unknown_method_version")
        if self.implementation_fidelity != method["fidelity"] or self.fidelity_record != method["fixture"]:
            raise ValueError("fidelity_record_mismatch")
        categories = {"protein_composition":"computed_descriptor", "sequence_length":"computed_descriptor", "rdkit_descriptors":"computed_descriptor", "ps00107_observation":"structural_rule_observation", "structural_alert_scan":"structural_rule_observation", "prioritization_heuristic":"unvalidated_heuristic", "assessment_policy":"model_prediction", "notes_review_policy":"unverified_extraction"}
        if self.evidence_category != categories[self.method_id]:
            raise ValueError("method_evidence_category_mismatch")
        spec=method["outputs"].get(self.quantity)
        if spec is None or self.units != spec["units"]:
            raise ValueError("method_quantity_or_units_mismatch")
        if self.value is not None:
            shape=spec["shape"]
            numeric=type(self.value) in (float,int)
            if shape=="null" or (shape in {"number","nonnegative","fraction","count"} and not numeric):
                raise ValueError("method_value_shape_mismatch")
            if shape in {"nonnegative","fraction","count"} and self.value<0:
                raise ValueError("negative_descriptor")
            if shape=="fraction" and self.value>1:
                raise ValueError("fraction_out_of_bounds")
            if shape=="count" and type(self.value) is not int:
                raise ValueError("count_must_be_integer")
            if shape in {"interval","indices"}:
                if not isinstance(self.value,list) or not self.value or any(x<0 for x in self.value):
                    raise ValueError("invalid_coordinates")
                if shape=="interval" and (len(self.value)!=2 or self.value[0]>=self.value[1] or self.value[1]>self.coverage.total):
                    raise ValueError("invalid_interval")
        if self.method_id == "prioritization_heuristic" and self.units != "dimensionless":
            raise ValueError("heuristic_cannot_have_physical_units")
        if self.assessment_status in {"not_assessed", "needs_review"} or self.execution_status != "succeeded":
            if self.value is not None:
                raise ValueError("unassessed_value_must_be_null")
        elif self.value is None:
            raise ValueError("computed_value_required")
        if self.evidence_category in {"model_prediction", "unverified_extraction"}:
            if self.value is not None or self.assessment_status not in {"not_assessed", "needs_review"}:
                raise ValueError("predictive_capability_disabled")
        if self.evidence_category in {"computed_descriptor", "structural_rule_observation"}:
            if self.validation_status != "not_applicable":
                raise ValueError("descriptor_is_not_predictive_validation")
        if self.value is not None and (self.domain != "in_domain" or not self.coverage.complete):
            raise ValueError("unsupported_domain_or_coverage")
        return self


class HistoricalChemicalIdentity(HistoricalStrictModel):
    input_sha256: Digest
    canonical_isomeric_smiles: str | None
    formal_charge: int | None
    fragments: int | None
    stereocenters: list[str]
    policies: list[str]
    status: Literal["identified", "unsupported_input", "unavailable"]


class HistoricalManifest(HistoricalStrictModel):
    code_sha256: Digest
    registry_sha256: Digest
    dependency_lock_sha256: Digest
    dependencies: dict[str, str]
    python_version: str
    parameters: dict[str, int]
    random_seed: None = None
    model: Literal["none"] = "none"
    external_destinations: list[str] = Field(default_factory=list, max_length=0)


class HistoricalArtifact(HistoricalStrictModel):
    contract_version: Literal["3.0.0"] = CONTRACT_VERSION
    run_id: Identifier
    input_identity: HistoricalInputIdentity
    chemical_identities: list[HistoricalChemicalIdentity]
    outputs: list[HistoricalEvidence]
    manifest: HistoricalManifest
    scientific_release: Literal["blocked"] = "blocked"
    sensitive_intake: Literal["blocked"] = "blocked"
    audit_integrity: Literal["integrity_unverified"] = "integrity_unverified"

    @model_validator(mode="after")
    def binding(self):
        import re
        from .legacy_registry_v3 import METHODS
        identifiers = set()
        source_hashes = {self.input_identity.content_sha256, *(r.normalized_sha256 for r in self.input_identity.records), *(c.input_sha256 for c in self.chemical_identities)}
        for field in self.outputs:
            if field.run_id != self.run_id or field.field_id in identifiers or field.input_sha256 not in source_hashes:
                raise ValueError("invalid_output_binding")
            prefix=field.field_id.split(".")
            if prefix[0] in {"record","molecule"}:
                if len(prefix)<3 or not re.fullmatch(r"0|[1-9][0-9]*",prefix[1]):
                    raise ValueError("invalid_field_scope")
                index=int(prefix[1])
                sources=self.input_identity.records if prefix[0]=="record" else self.chemical_identities
                if index>=len(sources):
                    raise ValueError("invalid_field_scope")
                expected=sources[index].normalized_sha256 if prefix[0]=="record" else sources[index].input_sha256
                allowed = {"assessment_policy", "sequence_length", "protein_composition", "ps00107_observation"} if prefix[0]=="record" else {"assessment_policy", "rdkit_descriptors", "structural_alert_scan", "prioritization_heuristic"}
                if field.method_id not in allowed or (field.method_id in {"protein_composition", "ps00107_observation"} and self.input_identity.polymer_type != "protein"):
                    raise ValueError("method_input_scope_mismatch")
                suffix = ".".join(prefix[2:])
            elif prefix[0]=="notes" and self.input_identity.polymer_type=="notes":
                expected=self.input_identity.content_sha256
                if field.method_id != "notes_review_policy":
                    raise ValueError("method_input_scope_mismatch")
                suffix = ".".join(prefix[1:])
            else:
                raise ValueError("invalid_field_scope")
            if field.input_sha256!=expected:
                raise ValueError("field_input_mismatch")
            template=METHODS[field.method_id]["outputs"][field.quantity]["field_suffix"]
            pattern=re.escape(template).replace(r"\{index\}", r"(?:0|[1-9][0-9]*)")
            if not re.fullmatch(pattern,suffix):
                raise ValueError("field_name_interpretation_mismatch")
            identifiers.add(field.field_id)
        return self


class HistoricalRunView(HistoricalStrictModel):
    contract_version: Literal["3.0.0"] = CONTRACT_VERSION
    run_id: Identifier
    status: Literal["queued", "running", "succeeded", "failed", "cancelled"]
    request_sha256: Digest
    created_at: str
    attempts: int
    error_code: str | None
    artifact_sha256: Digest | None
    artifact: HistoricalArtifact | None

    @model_validator(mode="after")
    def result_state(self):
        if (self.status == "succeeded") != (self.artifact is not None and self.artifact_sha256 is not None):
            raise ValueError("artifact_state_mismatch")
        if self.artifact and (self.artifact.run_id != self.run_id or self.artifact.input_identity.request_sha256 != self.request_sha256):
            raise ValueError("artifact_run_mismatch")
        return self
