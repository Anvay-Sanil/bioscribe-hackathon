"""Explicit public abstract acquisition, separate from original assay/claim snapshots."""
from datetime import datetime, timezone
import argparse
import json
from pathlib import Path
import sys
import urllib.parse
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from evidence_assistant.freeze_sources import get
from evidence_assistant.corpus import load_corpus, sha, canonical
from evidence_assistant.papers import ROOT as DEST, plain, load

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pmid', action='append', help='Public PMID; repeat up to 20 times. Default: linked assay publications.')
    parser.add_argument('--output', type=Path, default=DEST, help='New snapshot directory; existing snapshots are never overwritten.')
    args = parser.parse_args(); destination = args.output.resolve()
    if not destination.is_relative_to(ROOT): raise ValueError('snapshot_output_must_be_inside_project')
    if destination.exists(): raise ValueError('paper_snapshot_exists_use_new_version')
    if args.pmid:
        if len(args.pmid) > 20 or any(not value.isdecimal() or len(value) > 10 for value in args.pmid): raise ValueError('invalid_pmid_list')
        pmids = sorted(set(args.pmid)); limit = len(pmids)
    else:
        records, _ = load_corpus()
        pmids = sorted({r['publication_check']['pmid'] for r in records if r['kind'] == 'assay_record' and r['publication_check'].get('pmid')}); limit = 5
    collected, acquisition = [], []
    for pmid in pmids:
        url = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?' + urllib.parse.urlencode({'query': f'EXT_ID:{pmid} AND SRC:MED', 'format': 'json', 'resultType': 'core'})
        data = get(url)
        rows = [r for r in data.get('resultList', {}).get('result', []) if str(r.get('id')) == pmid and r.get('source') == 'MED']
        if len(rows) != 1:
            acquisition.append({'pmid': pmid, 'status': 'not_available', 'reason': 'missing_or_ambiguous_MED_identity'}); continue
        if not rows[0].get('abstractText'):
            acquisition.append({'pmid': pmid, 'status': 'not_available', 'reason': 'abstract_missing'}); continue
        if len(plain(rows[0]['abstractText'])) > 8000:
            acquisition.append({'pmid': pmid, 'status': 'not_available', 'reason': 'abstract_exceeds_resource_limit_no_truncation'}); continue
        acquisition.append({'pmid': pmid, 'status': 'acquired', 'reason': None})
        collected.append({'pmid': pmid, 'url': url, 'retrieved_utc': datetime.now(timezone.utc).isoformat(),
                          'metadata': rows[0], 'normalization': 'HTML data nodes; block separators; whitespace normalized per line. Original abstractText retained.'})
        if len(collected) == limit: break
    if not collected: raise ValueError('no_public_abstracts_available')
    destination.mkdir(parents=True)
    files = {}
    for record in collected:
        name = record['pmid'] + '.json'; content = canonical(record) + '\n'
        (destination / name).write_bytes(content.encode('utf-8')); files[name] = sha(content)
    (destination / 'manifest.json').write_text(json.dumps({'version': 'paper-sources/0.1.0', 'files': files, 'acquisition': acquisition,
        'scope': 'Bounded explicitly acquired PubMed abstracts, not full text or an exhaustive literature search.',
        'licensing': 'Public bibliographic/abstract metadata; original publisher rights may apply. No open full-text licence is inferred.'}, indent=2) + '\n', encoding='utf-8')
    papers, fingerprint = load(destination)
    print(json.dumps({'status': 'frozen', 'papers': list(papers), 'snapshot_sha256': fingerprint}))

if __name__ == '__main__': main()
