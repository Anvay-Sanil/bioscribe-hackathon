import json
import httpx
import pytest
from evidence_assistant import model


def install_receipt(tmp_path, monkeypatch):
    monkeypatch.setattr(model, 'LOCAL_ROOT', tmp_path)
    (tmp_path / 'installation.json').write_text(json.dumps({'model_sha256': model.CARD['sha256'], 'parameters': 4_000_000_000}))


def test_model_adapter_requires_local_authentication(tmp_path, monkeypatch):
    install_receipt(tmp_path, monkeypatch)
    with pytest.raises(ValueError, match='local_model_authentication_missing'):
        model.complete('test', '{}')


def test_unbounded_model_timeout_is_rejected():
    with pytest.raises(ValueError, match='model_timeout_limit'):
        model.complete('test', '{}', timeout_seconds=181)


def test_model_adapter_authenticates_only_to_fixed_loopback(tmp_path, monkeypatch):
    install_receipt(tmp_path, monkeypatch)
    synthetic_key = 'synthetic-local-key-for-test-only-0001'
    (tmp_path / 'api-key.txt').write_text(synthetic_key)
    real_client = httpx.Client
    calls = []

    def respond(request):
        assert str(request.url) == 'http://127.0.0.1:8091/v1/chat/completions'
        assert request.headers['Authorization'] == 'Bearer ' + synthetic_key
        calls.append(request)
        return httpx.Response(200, json={'choices': [{'message': {'content': '{"statements":["test"]}'}}]})

    def client(**options):
        assert options == {'timeout': 90, 'trust_env': False, 'follow_redirects': False}
        return real_client(transport=httpx.MockTransport(respond), **options)

    monkeypatch.setattr(model.httpx, 'Client', client)
    value, meta = model.complete('test', '{}')
    assert value == {'statements': ['test']}
    assert len(calls) == 1
    assert meta['parameters'] == 4_000_000_000
