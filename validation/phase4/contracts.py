"""Proposed study contracts, separate from the accepted v3 runtime schema.

These schemas check declarations, not their scientific truth or authorship.
No field accepts an approval, a validated prediction, or a release decision.
"""
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

Text = Annotated[str, Field(min_length=1, max_length=8000, pattern=r"\S")]
Sha256 = Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]
PositiveInt = Annotated[int, Field(gt=0)]
NonnegativeInt = Annotated[int, Field(ge=0)]
NonemptyTextList = Annotated[list[Text], Field(min_length=1)]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class FileRef(Strict):
    path: Text  # Relative to a locally supplied bundle root, checked before reading.
    sha256: Sha256


class Endpoint(Strict):
    quantity: Text
    label_units: Text
    prediction_units: Text
    target_definition: Text
    organism_and_population: Text
    assay_and_conditions: Text
    label_transform: Text
    positive_class_definition: Text  # Explicitly "not applicable" for regression.


class Method(Strict):
    method_id: Text
    version: Text
    category: Literal["candidate_predictor", "unvalidated_heuristic"]
    input_policy_version: Text
    training_data_disclosure: Text
    stochastic_policy: Text


class Dataset(Strict):
    dataset_id: Text
    source_release: Text
    provenance_kind: Literal["public_empirical", "synthetic_software_fixture"]
    suitability_rationale: Text
    license_and_permitted_use: Text
    selection_query_and_date: Text
    inclusion_exclusion_policy: Text
    censored_missing_conflicting_labels: Text
    replicate_aggregation_policy: Text


class SamplingPlan(Strict):
    unit_of_analysis: Text
    min_test_units: PositiveInt
    min_independent_groups: PositiveInt
    independence_group: Text
    min_positive_units: NonnegativeInt
    min_negative_units: NonnegativeInt
    sample_size_justification: Text
    precision_or_power_target: Text
    multiplicity_policy: Text
    missingness_and_abstention_analysis: Text

    @model_validator(mode="after")
    def counts(self):
        if self.min_independent_groups > self.min_test_units:
            raise ValueError("independent_groups_exceed_units")
        if self.min_positive_units + self.min_negative_units > self.min_test_units:
            raise ValueError("class_minima_exceed_units")
        return self


class MetricGate(Strict):
    metric_id: Text
    estimand_and_population: Text
    units: Text
    bound: Literal["lower_confidence_bound", "upper_confidence_bound"]
    operator: Literal[">=", "<="]
    threshold: float
    confidence_level: Annotated[float, Field(gt=0, lt=1)]
    interval_method_and_resampling_unit: Text
    rationale: Text

    @model_validator(mode="after")
    def conservative_bound(self):
        if (self.bound == "lower_confidence_bound") != (self.operator == ">="):
            raise ValueError("favorable_confidence_bound_not_allowed")
        return self


class Domain(Strict):
    definition_version: Text
    fitting_population: Literal["development_only"]
    numerical_rules_and_thresholds: Text
    biological_and_assay_limits: Text
    input_eligibility_distinction: Text
    unknown_or_outside_action: Literal["abstain"]
    subgroup_and_shift_studies: Text


class Artifacts(Strict):
    method_bundle: FileRef
    environment_lock: FileRef
    dataset_manifest: FileRef
    split_manifest: FileRef
    curation_log: FileRef
    domain_definition: FileRef
    statistical_analysis_plan: FileRef


class ReviewPlan(Strict):
    scientific_owner: Text
    independent_statistical_reviewer: Text
    data_custodian: Text
    label_adjudication_and_conflicts: Text
    holdout_access_and_freeze_procedure: Text
    trusted_checkpoint_and_authorship_procedure: Text


class Protocol(Strict):
    schema_version: Literal["phase4-protocol/1.0.0"]
    state: Literal["proposed"]
    protocol_id: Text
    protocol_version: Text
    data_class: Literal["public_non_sensitive"]
    claim_type: Literal["endpoint_prediction", "ranking_utility"]
    task_type: Literal["regression", "binary_classification", "ranking"]
    intended_use: Text
    prohibited_uses: NonemptyTextList
    endpoint: Endpoint
    method: Method
    dataset: Dataset
    baselines_and_comparisons: NonemptyTextList
    sampling: SamplingPlan
    primary_gates: Annotated[list[MetricGate], Field(min_length=1)]
    secondary_analyses: NonemptyTextList
    domain: Domain
    split_strategy_and_rationale: Text
    required_disjoint_group_keys: NonemptyTextList
    artifacts: Artifacts
    review: ReviewPlan

    @model_validator(mode="after")
    def compatible_claim(self):
        if self.method.category == "unvalidated_heuristic" and self.claim_type != "ranking_utility":
            raise ValueError("heuristic_cannot_claim_endpoint_prediction")
        if (self.task_type == "ranking") != (self.claim_type == "ranking_utility"):
            raise ValueError("ranking_task_and_claim_must_agree")
        if self.task_type == "regression" and self.endpoint.label_units != self.endpoint.prediction_units:
            raise ValueError("endpoint_units_require_explicit_common_transform")
        if self.task_type == "binary_classification" and (
            self.sampling.min_positive_units == 0 or self.sampling.min_negative_units == 0
        ):
            raise ValueError("classification_requires_both_class_minima")
        ids = [gate.metric_id for gate in self.primary_gates]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate_primary_gate")
        if len(self.required_disjoint_group_keys) != len(set(self.required_disjoint_group_keys)):
            raise ValueError("duplicate_disjoint_group_key")
        if self.sampling.independence_group not in self.required_disjoint_group_keys:
            raise ValueError("independence_group_must_be_declared")
        return self


class SplitRow(Strict):
    unit_id: Text
    entity_key: Text
    role: Literal["train", "tune", "calibration", "external_test", "challenge"]
    groups: dict[Text, Text]


class SplitManifest(Strict):
    schema_version: Literal["phase4-split/1.0.0"]
    dataset_id: Text
    rows: Annotated[list[SplitRow], Field(min_length=1, max_length=100000)]
