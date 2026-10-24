"""Resolve literal local frontend imports against source and the selected transfer."""
from pathlib import Path
import re

IMPORTS = re.compile(r'''(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s*)["']([^"']+)["']''')
EXTENSIONS = ('', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.scss')


def audit_imports(original_root, copied_root):
    original_root, copied_root = Path(original_root).resolve(), Path(copied_root).resolve()
    source = original_root / 'bioscribe-ai/src'
    checked = 0
    for file in sorted(source.rglob('*')):
        if file.suffix not in {'.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'}:
            continue
        for name in IMPORTS.findall(file.read_text(encoding='utf-8-sig')):
            if name.startswith('@/'):
                base = source / name[2:]
            elif name.startswith('.'):
                base = file.parent / name
            else:
                continue
            candidates = [Path(str(base) + suffix) for suffix in EXTENSIONS]
            candidates += [base / ('index' + suffix) for suffix in EXTENSIONS[1:]]
            if base.suffix in {'.js', '.jsx'}:
                candidates += [base.with_suffix(suffix) for suffix in ('.ts', '.tsx')]
            target = next((p.resolve() for p in candidates if p.is_file()), None)
            if target is None:
                raise ValueError(f'unresolved_source_import: {file.relative_to(original_root)} -> {name}')
            if not target.is_relative_to(original_root):
                raise ValueError('import_outside_source_root')
            rel = target.relative_to(original_root)
            copied = copied_root / rel
            if not copied.is_file() or copied.read_bytes() != target.read_bytes():
                raise ValueError(f'import_excluded_or_changed: {rel}')
            checked += 1
    return {'status': 'passed', 'literal_local_imports': checked,
            'scope': 'Literal local imports throughout src; dynamic resolution also checked by clean TypeScript/Next build'}
