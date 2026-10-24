"""Software grounding checks only. Mock model interpretations are not scientific labels."""
from copy import deepcopy
from datetime import datetime, timezone, timedelta
import hashlib
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from bioscribe.api import create_app
from bioscribe.config import Settings
from evidence_assistant import passage_review as engine
from evidence_assistant.papers import load, eligibility
from evidence_assistant.passage_storage import PaperStore
from evidence_assistant.storage import ReviewError
from validation.evidence_assistant.round1 import reliability, batch_context

@pytest.fixture
def paper():
    papers, _ = load()
    return deepcopy(next(iter(papers.values())))

def fake_response(papers, verdict='supported', quote=None):
    def infer(prompt, data, schema, max_tokens):
        return {'assessments': [{'index': c['index'], 'paper_id': p['paper_id'], 'verdict': verdict,
                    'quote': quote if quote is not None else papers[p['paper_id']]['abstract'][:100]}
                    for c in data['claims'] for p in data['papers']]}, {'response_sha256': 'b' * 64}
    return infer

def payload(paper): return {'text': 'An experimental molecular observation.', 'paper_ids': [paper['source_id']]}

def test_exact_quote_interpretation_is_always_experimental_and_uncalibrated(paper):
    result = engine.interpret(payload(paper), papers={paper['source_id']: paper}, infer=fake_response({paper['source_id']: paper}))
    s = result.statements[0]
    assert s.verdict == 'supported' and s.requires_review
    assert s.confidence is None and s.confidence_status == 'not_calibrated'
    assert s.interpretation == 'experimental_model_interpretation'
    assert result.scientific_assessment == 'not_assessed'
    assert s.citations[0].excerpt == paper['abstract'][:100]

@pytest.mark.parametrize('quote', ['invented source quotation', '', ' '])
def test_missing_or_fabricated_quote_cannot_support(paper, quote):
    result = engine.interpret(payload(paper), papers={paper['source_id']: paper}, infer=fake_response({}, quote=quote))
    assert result.statements[0].verdict == 'insufficient_evidence'

@pytest.mark.parametrize('status', ['retracted', 'concern', 'unknown', 'stale'])
def test_ineligible_paper_never_enters_model_context(paper, status):
    if status == 'retracted': paper['metadata']['isRetracted'] = 'Y'
    elif status == 'concern': paper['metadata']['pubTypeList'] = {'pubType': ['Expression of Concern']}
    elif status == 'unknown': paper['metadata']['pubTypeList'] = {}
    else: paper['retrieved_utc'] = (datetime.now(timezone.utc) - timedelta(days=31)).isoformat()
    def forbidden(*args, **kwargs): raise AssertionError('ineligible source sent to model')
    result = engine.interpret(payload(paper), papers={paper['source_id']: paper}, infer=forbidden)
    assert result.statements[0].verdict == 'insufficient_evidence'
    assert result.excluded_sources and result.model['status'] == 'not_needed'

@pytest.mark.parametrize('claim', ['This molecule is safe.', 'This treatment cures patients.', 'Choose a dose of 100 mg.'])
def test_clinical_decisions_do_not_invoke_model(paper, claim):
    def forbidden(*args, **kwargs): raise AssertionError('clinical interpretation invoked')
    result = engine.interpret({**payload(paper), 'text': claim}, papers={paper['source_id']: paper}, infer=forbidden)
    assert result.statements[0].verdict == 'out_of_scope'

def test_unavailable_model_abstains_with_a_trace(paper):
    def unavailable(*args, **kwargs): raise OSError('synthetic service failure')
    result = engine.interpret(payload(paper), papers={paper['source_id']: paper}, infer=unavailable)
    assert result.model['status'] == 'unavailable_or_invalid'
    assert result.statements[0].verdict == 'insufficient_evidence'
    assert result.statements[0].citations[-1].role == 'assessment_trace'

def test_descriptor_passage_cannot_support_activity_even_when_model_says_yes(paper):
    paper['abstract'] = 'Computed molecular weight and QED rank this molecule highly.'
    value = engine.interpret({'text': 'This molecule inhibits an enzyme.', 'paper_ids': [paper['source_id']]},
        papers={paper['source_id']: paper}, infer=fake_response({paper['source_id']: paper}))
    assert value.statements[0].verdict == 'insufficient_evidence'

def test_repeated_quotation_is_ambiguous_and_abstains(paper):
    paper['abstract'] = 'Same quote. Same quote.'
    value = engine.interpret(payload(paper), papers={paper['source_id']: paper}, infer=fake_response({}, quote='Same quote.'))
    assert value.statements[0].verdict == 'insufficient_evidence'

def test_disagreement_is_retained_and_abstains():
    papers, _ = load(); selected = dict(list(papers.items())[:2])
    def infer(prompt, data, schema, max_tokens):
        return {'assessments': [{'index': 0, 'paper_id': k, 'verdict': v, 'quote': p['abstract'][:100]}
                               for (k, p), v in zip(selected.items(), ['supported', 'contradicted'])]}, {}
    value = engine.interpret({'text': 'A molecular observation.', 'paper_ids': list(selected)}, papers=selected, infer=infer)
    assert value.statements[0].verdict == 'insufficient_evidence'
    assert value.disagreements and {c.role for c in value.statements[0].citations} >= {'supports', 'contradicts'}

def test_omitted_or_duplicate_assessment_cannot_selectively_publish_support(paper):
    def incomplete(*args, **kwargs): return {'assessments': []}, {}
    value = engine.interpret(payload(paper), papers={paper['source_id']: paper}, infer=incomplete)
    assert value.model['status'] == 'unavailable_or_invalid'
    assert value.statements[0].verdict == 'insufficient_evidence'

@pytest.mark.parametrize('bad', [[], ['PMID:1'] * 2, ['PMID:1'] * 4])
def test_paper_selection_bounds(bad):
    with pytest.raises(ValueError): engine.PaperRequest(text='a', paper_ids=bad)

def test_statement_limit_is_explicit(paper):
    with pytest.raises(ValueError): engine.PaperRequest(text='A. B. C. D.', paper_ids=[paper['source_id']])

def test_store_checks_owner_input_and_exact_quote(tmp_path, paper):
    store = PaperStore(tmp_path / 'runs.sqlite3'); actor = ('a', 'alice'); request = payload(paper)
    run, created = store.create(actor, 'key_00000000000001', request)
    assert created
    papers, fingerprint = load()
    output = engine.interpret(request, run_id=run, papers=papers, snapshot_hash=fingerprint, infer=fake_response(papers)).model_dump()
    mutated = deepcopy(output); mutated['statements'][0]['citations'][0]['excerpt'] = 'fabricated'
    with pytest.raises(ReviewError, match='paper_quote_binding_failure'): store.finish(actor, run, mutated)
    missing = deepcopy(output); del missing['statements'][0]['confidence_status']
    with pytest.raises(ValueError, match='missing_evidence_metadata'): store.finish(actor, run, missing)
    store.finish(actor, run, output)
    assert store.get(actor, run)['output'] == output
    with pytest.raises(ReviewError, match='not_found'): store.get(('a', 'bob'), run)
    with pytest.raises(ReviewError, match='idempotency_conflict'): store.create(actor, 'key_00000000000001', {**request, 'text': 'changed'})

def test_snapshot_change_detected(tmp_path):
    from evidence_assistant.papers import ROOT
    import shutil
    shutil.copytree(ROOT, tmp_path / 'snapshot')
    target = next((tmp_path / 'snapshot').glob('[0-9]*.json'))
    target.write_bytes(target.read_bytes() + b' ')
    with pytest.raises(ValueError, match='integrity_failure'): load(tmp_path / 'snapshot')

def test_title_cannot_be_promoted_to_a_decisive_passage(paper):
    value = engine.interpret(payload(paper), papers={paper['source_id']: paper}, infer=fake_response({paper['source_id']: paper})).model_dump()
    c = value['statements'][0]['citations'][0]
    c['locator'], c['excerpt'] = '/metadata/title', paper['title']
    with pytest.raises(ValueError, match='requires_eligible_passage'): engine.PaperReview.model_validate(value)

def test_historical_paper_output_does_not_acquire_new_provenance_fields(tmp_path, paper):
    from evidence_assistant.corpus import canonical, sha
    store = PaperStore(tmp_path / 'runs.sqlite3'); actor = ('a', 'alice')
    run, _ = store.create(actor, 'historical_key_00001', payload(paper))
    papers, fingerprint = load()
    old_request = engine.PaperRequest.model_validate(payload(paper)).model_dump()
    old_request['contract_version'] = 'paper-review/0.1.0'
    old = engine.interpret(payload(paper), run_id=run, papers=papers, snapshot_hash=fingerprint, infer=fake_response(papers)).model_dump()
    old['contract_version'] = 'paper-review/0.1.0'
    del old['method']; del old['implementation_sha256']
    old['input_sha256'] = sha(canonical(old_request))
    with store.connect() as db:
        db.execute('UPDATE paper_reviews SET input=?, input_hash=? WHERE id=?', (canonical(old_request), old['input_sha256'], run))
    store.finish(actor, run, old)
    assert store.get(actor, run)['output'] == old

def test_api_schema_requires_explicit_metadata_and_matches_generated_schema():
    expected = json.loads((Path(__file__).resolve().parents[2] / 'bioscribe-ai/src/lib/phase3/PaperReview.schema.json').read_text())
    assert engine.output_schema() == expected
    assert 'requires_review' in expected['$defs']['PaperStatement']['required']

def test_paper_routes_require_auth_and_persist_scope(tmp_path, monkeypatch):
    token = 'a' * 48; auth = tmp_path / 'auth.json'
    auth.write_text(json.dumps([{'tenant': 't', 'subject': 's', 'token_sha256': hashlib.sha256(token.encode()).hexdigest(), 'enabled': True}]))
    with TestClient(create_app(Settings(tmp_path / 'db.sqlite3', auth))) as client:
        assert client.get('/assistant/papers/capabilities').status_code == 401
        headers = {'Authorization': 'Bearer ' + token, 'Idempotency-Key': 'paper_request_000000001'}
        caps = client.get('/assistant/papers/capabilities', headers=headers).json()
        paper_id = caps['papers'][0]['source_id']
        result = client.post('/assistant/papers/reviews', headers=headers, json={'text': 'This is safe for patients.', 'paper_ids': [paper_id]})
        assert result.status_code == 201
        value = result.json(); assert value['status'] == 'succeeded'
        assert value['output']['statements'][0]['verdict'] == 'out_of_scope'
        exported = client.get('/assistant/papers/reviews/' + value['run_id'] + '/export', headers=headers)
        assert exported.json() == value
        assert 'Traceback' not in client.post('/assistant/papers/reviews', headers={**headers, 'Idempotency-Key': 'paper_request_000000002'}, json={'text': 'A claim', 'paper_ids': ['PMID:1']}).text

def test_reliability_is_descriptive_and_empty_bins_undefined():
    labels = [{'claim_id': 'a', 'proposed_verdict': 'supported'}, {'claim_id': 'b', 'proposed_verdict': 'contradicted'}]
    values = {'a': {'verdict': 'supported', 'confidence': .8}, 'b': {'verdict': 'supported', 'confidence': 1.0}}
    result = reliability(labels, values)
    assert result['n'] == 2 and result['status'] == 'uncalibrated_provisional_labels'
    assert result['correctness_brier'] == pytest.approx(.52)
    assert sum(b['n'] for b in result['bins']) == 2
    assert all(b['draft_label_agreement'] is None for b in result['bins'] if b['n'] == 0)

def test_baseline_context_has_no_labels_and_binds_each_allowed_source():
    from evidence_assistant.corpus import load_corpus
    records, _ = load_corpus()
    value = batch_context([{'claim_id': 'test', 'text': 'CHEMBL113 in activity 189032 has Ki = 26000 nM.'}], records)
    assert 'proposed_verdict' not in json.dumps(value)
    assert 'chembl-activity:189032' in value['claims'][0]['allowed_source_ids']
    assert {r['source_id'] for r in value['evidence']} == set(value['claims'][0]['allowed_source_ids'])

def test_summary_schema_correspondence_and_empty_bins():
    from evidence_assistant.benchmark_report import DraftSummary, schema
    base = Path(__file__).resolve().parents[2]
    assert schema() == json.loads((base / 'bioscribe-ai/src/lib/phase3/DraftComparison.schema.json').read_text())
    value = json.loads((base / 'hackathon/paper-review/synthetic-summary-fixture.json').read_text())['summary']
    parsed = DraftSummary.model_validate(value)
    assert all(b.draft_label_agreement is None for b in parsed.confidence_diagnostics.bins)
    for key, bad in [('baseline_beaten', True), ('calibration_status', 'calibrated'), ('dataset_status', 'independently_reviewed')]:
        with pytest.raises(ValueError): DraftSummary.model_validate({**value, key: bad})

def test_summary_count_contradictions_rejected():
    from evidence_assistant.benchmark_report import MetricSummary
    with pytest.raises(ValueError): MetricSummary(expected_count=150, evaluated=1, missing_or_invalid=0, accuracy_all_expected=1.0, false_supported_count=0)
    with pytest.raises(ValueError): MetricSummary(expected_count=150, evaluated=1, missing_or_invalid=149, accuracy_all_expected=1.0, false_supported_count=0)
