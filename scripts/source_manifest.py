"""Explicit source receipt; verification never regenerates its own expectation."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def inventory(root=ROOT):
    spec = importlib.util.spec_from_file_location('transfer_inventory', root / 'hackathon/transfer/build_transfer.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    files = []
    for name in module.SOURCE_DIRS:
        files.extend(module.collect(root / name))
    files.extend(root / name for name in module.ROOT_FILES if name != 'SOURCE_MANIFEST.json' and (root / name).is_file())
    # Next regenerates this ambient TypeScript scaffold. Configuration, contracts,
    # implementation and frozen data remain guarded; build/cache trees are pruned.
    return {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files))
            if p.relative_to(root).as_posix() != 'bioscribe-ai/next-env.d.ts'}


def verify(root=ROOT):
    expected = json.loads((root / 'SOURCE_MANIFEST.json').read_text(encoding='utf-8'))['files']
    actual = inventory(root)
    changed = sorted(k for k in expected if actual.get(k) != expected[k])
    added = sorted(actual.keys() - expected.keys())
    if changed or added:
        raise ValueError(json.dumps({'changed_or_missing': changed, 'unrecorded_source': added}))
    return {'status': 'passed', 'files': len(actual), 'scope': 'Current source byte correspondence; no authorship or scientific validation'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Deliberately issue a new source receipt after reviewing changes')
    args = parser.parse_args()
    if args.write:
        (ROOT / 'SOURCE_MANIFEST.json').write_text(json.dumps({'algorithm': 'SHA-256', 'scope': 'Reviewed local source inventory; not an authenticated checkpoint', 'files': inventory()}, indent=2) + '\n', encoding='utf-8')
    else:
        print(json.dumps(verify(), indent=2))
