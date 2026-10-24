"""Metric denominator and confidence-boundary regressions; no biological accuracy claim."""
import importlib.util
from pathlib import Path
import pytest
from evidence_assistant.freeze_sources import publication_status

spec = importlib.util.spec_from_file_location('assistant_evaluation', Path(__file__).resolve().parents[2] / 'validation/evidence_assistant/evaluate.py')
evaluation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation)


def test_missing_model_outputs_remain_in_all_expected_denominator():
    gold = [{'claim_id': 'a', 'proposed_verdict': 'supported'}, {'claim_id': 'b', 'proposed_verdict': 'contradicted'}]
    result = evaluation.metrics(gold, {'a': {'verdict': 'supported', 'confidence': .7}})
    assert result['accuracy'] == 1
    assert result['accuracy_all_expected'] == .5
    assert result['missing_or_invalid'] == 1
    assert result['expected_count'] == 2


def test_empty_evaluation_is_undefined():
    result = evaluation.metrics([], {})
    assert result['accuracy'] is None
    assert result['accuracy_all_expected'] is None
    assert result['macro_f1'] is None
    assert all(b['n'] == 0 and b['accuracy'] is None for b in result['accuracy_by_confidence'])


def test_confidence_bins_do_not_overlap_at_boundaries():
    values = [0, .5, .7, .85, .95, 1]
    gold = [{'claim_id': str(i), 'proposed_verdict': 'supported'} for i in range(len(values))]
    predictions = {str(i): {'verdict': 'supported', 'confidence': value} for i, value in enumerate(values)}
    result = evaluation.metrics(gold, predictions)
    assert [b['n'] for b in result['accuracy_by_confidence']] == [1, 1, 1, 1, 2]
    assert result['confidence_unscored_count'] == 0


@pytest.mark.parametrize('value', [None, True, -.1, 1.1, float('nan'), float('inf'), '.9'])
def test_invalid_confidence_is_unscored(value):
    result = evaluation.metrics([{'claim_id': 'a', 'proposed_verdict': 'supported'}], {'a': {'verdict': 'supported', 'confidence': value}})
    assert result['confidence_unscored_count'] == 1
    assert sum(b['n'] for b in result['accuracy_by_confidence']) == 0


def test_undefined_per_class_metrics_stay_null():
    result = evaluation.metrics([{'claim_id': 'a', 'proposed_verdict': 'supported'}], {'a': {'verdict': 'contradicted'}})
    assert result['per_class']['out_of_scope']['precision'] is None
    assert result['per_class']['out_of_scope']['recall'] is None
    assert result['macro_f1'] is None


@pytest.mark.parametrize('metadata', [None, [], {'id': '1', 'pubTypeList': None}, {'id': '1', 'pubTypeList': {'pubType': []}}, {'id': '1', 'pubTypeList': {'pubType': 'Journal Article'}}, {'id': '1', 'pubTypeList': {'pubType': [None]}}])
def test_missing_or_malformed_publication_types_are_unknown(metadata):
    assert publication_status(metadata) == 'publication_status_unknown'
