"""Freeze a local, unqualified presentation summary. Does not publish externally."""
import argparse
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from evidence_assistant.corpus import canonical, sha
from evidence_assistant.benchmark_report import DraftSummary, MetricSummary, ROOT as DEST, read_summary

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--recovery', type=Path)
    args = parser.parse_args()
    if DEST.exists(): raise ValueError('summary_exists_use_new_version')
    report = json.loads(args.report.read_text(encoding='utf-8'))
    if report['dataset_status'] != 'provisional_unreviewed' or report['baseline_beaten'] is not None or len(report['predictions']) != 150:
        raise ValueError('unqualified_complete_attempt_record_required')
    def subset(metrics): return {key: metrics[key] for key in MetricSummary.model_fields}
    systems = [{'name': 'Record checker', 'metrics': subset(report['ours'])}, {'name': '0.5B baseline: first attempts', 'metrics': subset(report['retrieval_plus_llm'])}]
    confidence = report['confidence_diagnostics']
    if args.recovery:
        recovery = json.loads(args.recovery.read_text(encoding='utf-8'))
        if recovery['original_report_sha256'] != sha(args.report.read_bytes()) or recovery['baseline_beaten'] is not None:
            raise ValueError('recovery_report_binding_failure')
        systems.append({'name': '0.5B baseline: after technical recovery', 'metrics': subset(recovery['retrieval_plus_llm'])})
        confidence = recovery['confidence_diagnostics']
    protocol = report['protocol']
    value = DraftSummary(source_report_sha256=sha(args.report.read_bytes()),
        claims_sha256=protocol['dataset']['claims_sha256'], labels_sha256=protocol['dataset']['proposed_labels_sha256'],
        model=protocol['model'], systems=systems, confidence_diagnostics=confidence,
        limitations=protocol['dataset']['limitations'] + [
            'Original draft labels remain unchanged. No independent review or calibrated scientific accuracy.',
            'This comparison covers exact source-record templates, not general paper-passage reasoning.',
            'Additional 0.5B model; historical 4B timeout results remain separate.',
            'All-expected agreement includes missing/invalid outputs in its denominator. Any technical recovery is shown separately.',
            'Not a benchmark victory, protected holdout or independent biological validation.'
        ])
    DEST.mkdir(parents=True)
    raw = canonical(value.model_dump()) + '\n'
    (DEST / 'round1-summary.json').write_bytes(raw.encode())
    (DEST / 'manifest.json').write_text(json.dumps({'sha256': sha(raw), 'scope': 'Local byte correspondence, not authenticated authorship or scientific qualification'}, indent=2) + '\n')
    print(json.dumps({'status': read_summary()['status'], 'scientific_assessment': 'not_assessed'}))

if __name__ == '__main__': main()
