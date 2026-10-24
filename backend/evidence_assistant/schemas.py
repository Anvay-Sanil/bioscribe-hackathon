from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

LABEL = "Research aid, not a prediction of efficacy or safety."
Verdict = Literal["supported", "contradicted", "insufficient_evidence", "out_of_scope"]
Hash = Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class ReviewRequest(Strict):
    contract_version: Literal["evidence-assistant/0.1.0"] = "evidence-assistant/0.1.0"
    data_scope: Literal["public_non_sensitive"] = "public_non_sensitive"
    text: Annotated[str, Field(min_length=1, max_length=8000)]
    use_model: bool = False


class Citation(Strict):
    source_id: str
    kind: Literal["assay_record", "paper_passage", "run_record"]
    role: Literal["supports", "contradicts", "context", "excluded", "assessment_trace"]
    locator: str
    url: str | None
    source_sha256: Hash
    excerpt: str
    retraction_status: str


class Statement(Strict):
    statement_id: str
    text: str
    start: int
    end: int
    category: Literal["assay_observation", "computed_property", "activity", "efficacy_or_safety", "unparsed"]
    verdict: Verdict
    reason_code: str
    explanation: str
    citations: Annotated[list[Citation], Field(min_length=1)]
    confidence: None = None
    confidence_status: Literal["not_calibrated"] = "not_calibrated"
    decision_basis: Literal["exact_record_comparison", "abstention", "scope_policy"]
    requires_review: bool

    @model_validator(mode="after")
    def grounded(self):
        if self.verdict in ("supported", "contradicted"):
            role = "supports" if self.verdict == "supported" else "contradicts"
            cited = [c for c in self.citations if c.role == role]
            if not cited or self.category not in ("assay_observation", "computed_property"):
                raise ValueError("unbacked_decision")
            expected_kind = "assay_record" if self.category == "assay_observation" else "run_record"
            expected_status = "not_flagged_in_checked_snapshot" if self.category == "assay_observation" else "not_applicable"
            if any(c.kind != expected_kind for c in cited):
                raise ValueError("evidence_kind_mismatch")
            if any(c.retraction_status != expected_status for c in cited):
                raise ValueError("ineligible_publication")
            if self.decision_basis != "exact_record_comparison":
                raise ValueError("decision_basis_mismatch")
        if self.end <= self.start:
            raise ValueError("invalid_source_span")
        return self


class Review(Strict):
    contract_version: Literal["evidence-assistant/0.1.0"] = "evidence-assistant/0.1.0"
    research_aid_label: Literal["Research aid, not a prediction of efficacy or safety."] = LABEL
    run_id: Annotated[str, Field(pattern=r"^[a-f0-9]{32}$")]
    input_sha256: Hash
    corpus_sha256: Hash
    created_utc: str
    text: str
    statements: Annotated[list[Statement], Field(min_length=1, max_length=16)]
    decomposition: dict
    disagreements: list[dict]
    excluded_sources: list[dict]
    model: dict
    evidence_scope: str
    scientific_assessment: Literal["not_assessed"] = "not_assessed"
    benchmark_status: Literal["provisional_unreviewed"] = "provisional_unreviewed"

    @model_validator(mode="after")
    def spans(self):
        previous = 0
        for statement in self.statements:
            if statement.start < previous or self.text[statement.start:statement.end] != statement.text:
                raise ValueError("statement_source_mismatch")
            previous = statement.end
        return self
