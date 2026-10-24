'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestRun } from '@/lib/phase3/client';
import type { RunRequest } from '@/lib/phase3/contract';

// Credentials are held only in memory and must be re-entered after a full reload.
export const credential = { token: '' };

export function Phase3Workbench() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [content, setContent] = useState('');
  const [kind, setKind] = useState<RunRequest['polymer_type']>('protein');
  const [count, setCount] = useState(1);
  const [molecules, setMolecules] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submission = useRef<{payload: string; key: string} | null>(null);

  async function submit() {
    setError(''); setBusy(true);
    const payload: RunRequest = {contract_version:'3.0.0', data_classification:'public_non_sensitive', polymer_type:kind, content, record_count:count, molecules:molecules.split(/\r?\n/).filter(s=>s.length>0), analysis:'descriptors_and_observations'};
    const encoded = JSON.stringify(payload);
    if (submission.current?.payload !== encoded) submission.current = {payload:encoded, key:crypto.randomUUID()};
    try {
      credential.token = token;
      const run = await requestRun('',token,payload,submission.current!.key);
      router.push(`/results/${run.run_id}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Submission failed.'); }
    finally { setBusy(false); }
  }

  return <main className="max-w-3xl mx-auto p-8 space-y-6">
    <h1 className="text-3xl font-semibold">BioScribe descriptor workbench</h1>
    <p role="status" className="rounded border border-amber-600 bg-amber-50 p-4 text-slate-900">Scientific release and sensitive-data intake are blocked. Submit only public, non-sensitive research inputs. Predictive toxicity, pharmacokinetics, affinity, synthesis and structure assessments are unavailable.</p>
    <label className="block">Access token<input aria-label="Access token" type="password" value={token} onChange={e=>setToken(e.target.value)} className="block w-full border p-2" autoComplete="off" /></label>
    <label className="block">Declared input type<select aria-label="Declared input type" value={kind} onChange={e=>{const type=e.target.value as RunRequest['polymer_type'];setKind(type);setCount(['notes','molecule'].includes(type)?0:1);}} className="block border p-2">{['protein','dna','rna','notes','molecule'].map(type=><option key={type}>{type}</option>)}</select></label>
    <label className="block">Sequence or notes<textarea aria-label="Sequence or notes" rows={8} value={content} onChange={e=>setContent(e.target.value)} className="block w-full border p-2 font-mono" /></label>
    <label className="block">Load UTF-8 text or FASTA<input aria-label="Load UTF-8 text or FASTA" type="file" accept=".txt,.fa,.fasta" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>131072){setError('File exceeds 131072 bytes.');return;}try{setContent(new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer()));}catch{setError('File is not valid UTF-8.');}}} /></label>
    <label className="block">Declared sequence record count<input aria-label="Declared sequence record count" type="number" min={0} max={8} value={count} onChange={e=>setCount(Number(e.target.value))} className="block border p-2" /></label>
    <label className="block">Molecules (one SMILES per line; optional with sequences)<textarea aria-label="Molecules" rows={3} value={molecules} onChange={e=>setMolecules(e.target.value)} className="block w-full border p-2 font-mono" /></label>
    <p>Molecular inputs use plain SMILES only. Names, CXSMILES, spaces/tabs and unresolved dummy/query atoms or bonds are unsupported. Each nonempty line is submitted unchanged; invalid inputs receive no descriptor or heuristic values.</p>
    <p>Limits: 8 records, 10,000 residues per record, 20,000 total residues; 16 molecules with 256 atoms each; 4,000 note characters. Gaps, stops, ambiguous and nonstandard residues are rejected. Notes enter review without extraction. Accession and organism remain explicitly unknown for these user-supplied inputs.</p>
    <label className="flex gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />I confirm these inputs are public and contain no confidential or patient-linked information.</label>
    <button className="rounded bg-slate-900 text-white p-3 disabled:opacity-50" disabled={busy||!consent||!token} onClick={submit}>{busy?'Submitting…':'Submit descriptor run'}</button>
    {error&&<p role="alert">{error}</p>}
  </main>;
}
