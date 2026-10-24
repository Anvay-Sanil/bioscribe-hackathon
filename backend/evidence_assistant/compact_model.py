"""Separate pinned CPU model. No hosted destinations or inferred calibration."""
import json
from pathlib import Path
import re
import time
import httpx
from .corpus import canonical, sha

CARD = json.loads(Path(__file__).with_name('model_card_small.json').read_text())
LOCAL = Path(__file__).resolve().parents[2] / 'hackathon/.local/evidence-small'


def complete(prompt, data, schema, max_tokens=512):
    text = canonical(data)
    if len(text) > 24000 or not 1 <= max_tokens <= 1024:
        raise ValueError('model_resource_limit')
    receipt = json.loads((LOCAL / 'installation.json').read_text())
    if receipt.get('model_sha256') != CARD['sha256']:
        raise ValueError('model_installation_mismatch')
    key = (LOCAL / 'api-key.txt').read_text(encoding='utf-8-sig').strip()
    if not re.fullmatch(r'[A-Za-z0-9_-]{32,256}', key):
        raise ValueError('invalid_local_key')
    start = time.monotonic()
    with httpx.Client(timeout=90, trust_env=False, follow_redirects=False) as client:
        with client.stream('POST', CARD['endpoint'], headers={'Authorization': 'Bearer ' + key}, json={
            'model': CARD['local_alias'], 'temperature': 0, 'seed': 1337,
            'max_tokens': max_tokens, 'cache_prompt': False,
            'response_format': {'type': 'json_schema', 'json_schema': {'name': 'evidence', 'strict': True, 'schema': schema}},
            'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': text}],
        }) as response:
            response.raise_for_status()
            chunks, size = [], 0
            for chunk in response.iter_bytes():
                size += len(chunk)
                if size > 64000: raise ValueError('response_resource_limit')
                chunks.append(chunk)
    raw = json.loads(b''.join(chunks))
    choice = raw['choices'][0]
    if choice.get('finish_reason') != 'stop': raise ValueError('model_output_truncated')
    value = json.loads(choice['message']['content'])
    return value, {'model_id': CARD['model_id'], 'weights_sha256': CARD['sha256'],
        'nominal_parameters': CARD['nominal_parameter_count'], 'prompt_sha256': sha(prompt),
        'context_sha256': sha(text), 'response_sha256': sha(canonical(value)),
        'temperature': 0, 'seed': 1337, 'cache_prompt': False, 'timeout_seconds': 90,
        'max_output_tokens': max_tokens, 'usage': raw.get('usage', {}),
        'seconds': round(time.monotonic() - start, 3),
        'identity_scope': 'Configured local installation; not remote attestation'}
