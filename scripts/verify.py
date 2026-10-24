"""One supported verification entry point for local work, CI and extracted transfers."""
import argparse
from datetime import datetime, timezone
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
sys.path.insert(0, str(ROOT / 'hackathon/transfer'))
sys.path.insert(0, str(ROOT / 'scripts'))
from source_manifest import verify as verify_source
from import_audit import audit_imports

CLIENT_CHECKS = ['phase3-contract-check.cjs', 'hackathon-check.cjs', 'evidence-lab-check.cjs',
                 'hm01-check.cjs', 'judging-upgrade-check.cjs', 'experiment-challenges-check.cjs',
                 'evidence-assistant-check.cjs']
CLIENT_CHECKS.append('paper-assistant-check.cjs')


def replay_all():
    from provenance_lab.engine import verify
    folders = [ROOT / 'bioscribe-ai/public/evidence-lab', ROOT / 'presentation/05-demo',
               ROOT / 'output/BioScribe-Hackathon-PPT-Kit-2026-10-24/05-demo']
    if (ROOT.parent / 'FILE_MANIFEST.json').is_file():
        folders.append(ROOT.parent / 'presentation/05-demo')
    receipts = []
    def packages(value, location):
        if isinstance(value, dict):
            if value.get('format') == 'bioscribe-replay/1.0.0':
                result = verify(value)
                assert result['status'] == 'matched'
                receipts.append({'path': location, 'contract': value['request']['contract_version'],
                                 'result_sha256': result['actual_sha256']})
            else:
                for key, child in value.items():
                    packages(child, location + '/' + key)
        elif isinstance(value, list):
            for index, child in enumerate(value):
                packages(child, location + '/' + str(index))
    for folder in folders:
        if folder.is_dir():
            for file in sorted(folder.rglob('*.json')):
                base = ROOT if file.is_relative_to(ROOT) else ROOT.parent
                packages(json.loads(file.read_text(encoding='utf-8-sig')), file.relative_to(base).as_posix())
    if not receipts:
        raise ValueError('no_recorded_replay_packages')
    return receipts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--install', action='store_true', help='Install hash-verified Python wheels and run npm ci first')
    parser.add_argument('--backend-only', action='store_true', help='Backend/fixtures only; does not claim full application verification')
    parser.add_argument('--output', type=Path, default=ROOT / 'verification-output/latest.json')
    args = parser.parse_args()
    args.output = args.output.resolve()
    if sys.version_info[:2] != (3, 11):
        raise SystemExit('Python 3.11 required')
    report = {'started_utc': datetime.now(timezone.utc).isoformat(), 'status': 'running',
              'scope': 'backend_only' if args.backend_only else 'full_application', 'steps': [],
              'scientific_assessment': 'not_assessed', 'user_value': 'untested'}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    def step(name, command, cwd=ROOT, timeout=900):
        print(name, flush=True)
        started = time.monotonic()
        result = subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                encoding='utf-8', errors='replace', timeout=timeout,
                                env={**os.environ, 'PYTHONUTF8': '1', 'BIOSCRIBE_VERIFICATION_OUTPUT': str(args.output.parent)})
        log = args.output.parent / (name + '.txt')
        log.write_text(result.stdout, encoding='utf-8')
        report['steps'].append({'name': name, 'command': command, 'returncode': result.returncode,
                                'seconds': round(time.monotonic() - started, 3), 'log': str(log)})
        if result.returncode:
            print(result.stdout[-7000:], flush=True)
            raise RuntimeError('verification_step_failed: ' + name)
    try:
        report['source_manifest'] = verify_source()
        report['local_imports'] = audit_imports(ROOT, ROOT)
        # An extracted transfer also verifies its outer manifest before installs.
        if (ROOT.parent / 'FILE_MANIFEST.json').is_file() and (ROOT.parent / 'VERIFY_TRANSFER.py').is_file():
            step('transfer_manifest', [sys.executable, '-B', str(ROOT.parent / 'VERIFY_TRANSFER.py'), '--root', str(ROOT.parent)])
        npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm')
        if args.install:
            step('python_install', [sys.executable, '-m', 'pip', 'install', '--require-hashes', '--only-binary=:all:', '-r', str(ROOT / 'backend/requirements-phase3-install.lock')])
            step('python_dependencies', [sys.executable, '-m', 'pip', 'check'])
            if not args.backend_only:
                if not npm: raise RuntimeError('npm_not_available')
                step('npm_ci', [npm, 'ci'], ROOT / 'bioscribe-ai')
        step('backend_tests', [sys.executable, '-B', '-m', 'pytest', '-q', '-p', 'no:cacheprovider', '--junitxml=' + str(args.output.parent / 'backend-tests.xml')], ROOT / 'backend', timeout=600)
        report['recorded_replays'] = replay_all()
        if not args.backend_only:
            if not npm: raise RuntimeError('npm_not_available')
            for script in ('typecheck', 'lint'):
                step(script, [npm, 'run', script], ROOT / 'bioscribe-ai')
            for script in CLIENT_CHECKS:
                step(script.removesuffix('.cjs'), [shutil.which('node') or 'node', 'scripts/' + script], ROOT / 'bioscribe-ai')
            step('next_build', [npm, 'run', 'build'], ROOT / 'bioscribe-ai', timeout=1200)
        report['source_manifest_after'] = verify_source()
        report['status'] = 'passed'
    except Exception as exc:
        report['status'] = 'failed'
        report['error'] = str(exc)
    finally:
        report['finished_utc'] = datetime.now(timezone.utc).isoformat()
        args.output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': report['status'], 'scope': report['scope'], 'report': str(args.output)}), flush=True)
    return 0 if report['status'] == 'passed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
