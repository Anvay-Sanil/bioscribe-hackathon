import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'hackathon/transfer'))
from import_audit import audit_imports


def test_source_named_data_build_and_env_is_not_pruned(tmp_path, monkeypatch):
    spec = importlib.util.spec_from_file_location('transfer_for_test', ROOT / 'hackathon/transfer/build_transfer.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, 'ROOT', tmp_path)
    for name in ('data', 'build', 'dist', 'out', 'env', 'coverage'):
        file = tmp_path / f'bioscribe-ai/src/{name}/fixture.json'
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text('{}')
    private = tmp_path / 'backend/data/private.json'
    private.parent.mkdir(parents=True)
    private.write_text('{}')
    collected = {str(p.relative_to(tmp_path)).replace('\\', '/') for p in module.collect(tmp_path)}
    assert all(f'bioscribe-ai/src/{name}/fixture.json' in collected for name in ('data', 'build', 'dist', 'out', 'env', 'coverage'))
    assert 'backend/data/private.json' not in collected


def test_import_audit_rejects_an_excluded_source_file(tmp_path):
    original, copied = tmp_path / 'original', tmp_path / 'copy'
    for base in (original, copied):
        (base / 'bioscribe-ai/src').mkdir(parents=True)
        (base / 'bioscribe-ai/src/page.ts').write_text("import value from '@/data/probe.json';")
    source = original / 'bioscribe-ai/src/data/probe.json'
    source.parent.mkdir()
    source.write_text('{"test":true}')
    with pytest.raises(ValueError, match='import_excluded_or_changed'):
        audit_imports(original, copied)
    target = copied / 'bioscribe-ai/src/data/probe.json'
    target.parent.mkdir()
    target.write_bytes(source.read_bytes())
    assert audit_imports(original, copied)['literal_local_imports'] == 1


def test_extracted_verification_replays_sibling_presentation_capsules(tmp_path, monkeypatch):
    spec = importlib.util.spec_from_file_location('verification_for_test', ROOT / 'scripts/verify.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    source = tmp_path / 'source'
    public = source / 'bioscribe-ai/public/evidence-lab'
    presentation = tmp_path / 'presentation/05-demo'
    public.mkdir(parents=True)
    presentation.mkdir(parents=True)
    (tmp_path / 'FILE_MANIFEST.json').write_text('{}')
    raw = json.loads((ROOT / 'bioscribe-ai/public/evidence-lab/reference-run.json').read_text())
    (public / 'reference.json').write_text(json.dumps(raw))
    (presentation / 'nested.json').write_text(json.dumps({'trials': [{'package': raw}]}))
    monkeypatch.setattr(module, 'ROOT', source)
    receipts = module.replay_all()
    assert {item['path'] for item in receipts} == {
        'bioscribe-ai/public/evidence-lab/reference.json',
        'presentation/05-demo/nested.json/trials/0/package',
    }


def test_gitattributes_preserve_reference_bytes_with_autocrlf(tmp_path):
    git = shutil.which('git')
    if not git:
        pytest.fail('git is required for the source-byte acceptance gate')
    env = {**os.environ, 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': os.devnull}
    def command(*args):
        subprocess.run([git, '-c', 'core.autocrlf=true', *args], cwd=tmp_path, env=env, check=True, capture_output=True)
    command('init')
    (tmp_path / '.gitattributes').write_bytes((ROOT / '.gitattributes').read_bytes())
    reference = (ROOT / 'backend/provenance_lab/references/snapshot.json').read_bytes()
    (tmp_path / 'snapshot.json').write_bytes(reference)
    (tmp_path / 'sentinel.json').write_bytes(b'{\r\n  "bytes": true\r\n}\r\n')
    command('add', '.gitattributes', 'snapshot.json', 'sentinel.json')
    target = tmp_path / 'checkout'
    target.mkdir()
    command('checkout-index', '--all', '--prefix=' + target.as_posix() + '/')
    assert (target / 'snapshot.json').read_bytes() == reference
    assert (target / 'sentinel.json').read_bytes() == (tmp_path / 'sentinel.json').read_bytes()


def test_require_hashes_rejects_a_changed_local_wheel(tmp_path):
    wheel = tmp_path / 'bioscribe_probe-0.0.0-py3-none-any.whl'
    with zipfile.ZipFile(wheel, 'w') as archive:
        archive.writestr('bioscribe_probe.py', '')
        archive.writestr('bioscribe_probe-0.0.0.dist-info/METADATA', 'Metadata-Version: 2.1\nName: bioscribe-probe\nVersion: 0.0.0\n')
        archive.writestr('bioscribe_probe-0.0.0.dist-info/WHEEL', 'Wheel-Version: 1.0\nGenerator: test\nRoot-Is-Purelib: true\nTag: py3-none-any\n')
        archive.writestr('bioscribe_probe-0.0.0.dist-info/RECORD', '')
    expected = hashlib.sha256(wheel.read_bytes()).hexdigest()
    requirement = tmp_path / 'requirements.txt'
    requirement.write_text(f'bioscribe-probe==0.0.0 --hash=sha256:{expected}\n')
    wheel.write_bytes(wheel.read_bytes() + b'changed-after-recording')
    run = subprocess.run([sys.executable, '-m', 'pip', 'install', '--dry-run', '--no-cache-dir', '--no-index',
                          '--require-hashes', '--find-links', str(tmp_path), '-r', str(requirement)],
                         capture_output=True, text=True, timeout=30)
    assert run.returncode != 0
    assert 'DO NOT MATCH THE HASHES' in run.stdout + run.stderr
