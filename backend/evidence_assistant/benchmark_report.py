"""Read an explicitly frozen, unqualified development comparison summary."""
import json
from pathlib import Path
from typing import Literal, Annotated
from pydantic import Field, model_validator
from .corpus import sha
from .schemas import Strict, LABEL, Hash

ROOT = Path(__file__).with_name('evaluation')
Count = Annotated[int, Field(ge=0, le=150)]
Probability = Annotated[float, Field(ge=0, le=1, allow_inf_nan=False)]

class MetricSummary(Strict):
    expected_count: Literal[150]
    evaluated: Count
    missing_or_invalid: Count
    accuracy_all_expected: Probability | None
    false_supported_count: Count
    @model_validator(mode='after')
    def counts(self):
        if self.evaluated + self.missing_or_invalid != 150 or self.false_supported_count > self.evaluated:
            raise ValueError('inconsistent_metric_counts')
        if self.accuracy_all_expected is not None and self.accuracy_all_expected > self.evaluated / 150 + 1e-12:
            raise ValueError('agreement_exceeds_valid_outputs')
        return self

class SystemSummary(Strict):
    name: Literal['Record checker', '0.5B baseline: first attempts', '0.5B baseline: after technical recovery']
    metrics: MetricSummary

class ConfidenceBin(Strict):
    lower: Probability
    upper: Probability
    n: Count
    draft_label_agreement: Probability | None
    mean_self_report: Probability | None
    @model_validator(mode='after')
    def defined(self):
        if self.lower >= self.upper or (self.n == 0) != (self.draft_label_agreement is None and self.mean_self_report is None):
            raise ValueError('invalid_confidence_bin')
        if self.n and (self.draft_label_agreement is None or self.mean_self_report is None): raise ValueError('undefined_nonempty_bin')
        return self

class ConfidenceDiagnostics(Strict):
    status: Literal['uncalibrated_provisional_labels']
    n: Count
    bins: Annotated[list[ConfidenceBin], Field(min_length=10, max_length=10)]
    correctness_brier: Probability | None
    ece_10_bins: Probability | None
    interpretation: str
    @model_validator(mode='after')
    def partition(self):
        if sum(b.n for b in self.bins) != self.n or any(b.lower != i / 10 or b.upper != (i + 1) / 10 for i, b in enumerate(self.bins)):
            raise ValueError('confidence_bins_do_not_partition_outputs')
        if (self.n == 0) != (self.correctness_brier is None and self.ece_10_bins is None): raise ValueError('invalid_empty_reliability')
        return self

class DraftSummary(Strict):
    status: Literal['available'] = 'available'
    research_aid_label: Literal['Research aid, not a prediction of efficacy or safety.'] = LABEL
    dataset_status: Literal['provisional_unreviewed'] = 'provisional_unreviewed'
    scientific_assessment: Literal['not_assessed'] = 'not_assessed'
    calibration_status: Literal['not_calibrated'] = 'not_calibrated'
    baseline_beaten: None = None
    claim_count: Literal[150] = 150
    source_report_sha256: Hash
    claims_sha256: Hash
    labels_sha256: Hash
    model: dict
    systems: Annotated[list[SystemSummary], Field(min_length=2, max_length=3)]
    confidence_diagnostics: ConfidenceDiagnostics
    limitations: list[str]
    @model_validator(mode='after')
    def unique(self):
        if len({s.name for s in self.systems}) != len(self.systems): raise ValueError('duplicate_summary_system')
        return self

def schema():
    value = DraftSummary.model_json_schema()
    def explicit(node):
        if isinstance(node, dict):
            if node.get('type') == 'object' and 'properties' in node: node['required'] = list(node['properties'])
            for child in node.values(): explicit(child)
        elif isinstance(node, list):
            for child in node: explicit(child)
    explicit(value)
    return value

def read_summary(root=ROOT):
    root = Path(root)
    if not (root / 'manifest.json').is_file():
        return {'status': 'not_available', 'dataset_status': 'provisional_unreviewed', 'baseline_beaten': None,
                'scientific_assessment': 'not_assessed', 'calibration_status': 'not_calibrated'}
    manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
    raw = (root / 'round1-summary.json').read_bytes()
    if sha(raw) != manifest['sha256']: raise ValueError('evaluation_summary_hash_mismatch')
    from contract_fields import require_complete
    value = DraftSummary.model_validate(json.loads(raw)); require_complete(value)
    return value.model_dump()
