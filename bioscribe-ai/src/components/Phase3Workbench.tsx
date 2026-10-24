'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Atom, CheckCircle2, Dna, FileText, KeyRound, Sparkles, Upload } from 'lucide-react';
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
    const payload: RunRequest = {contract_version:'3.1.0', data_classification:'public_non_sensitive', polymer_type:kind, content, record_count:count, molecules:molecules.split(/\r?\n/).filter(s=>s.length>0), analysis:'descriptors_and_observations'};
    const encoded = JSON.stringify(payload);
    if (submission.current?.payload !== encoded) submission.current = {payload:encoded, key:crypto.randomUUID()};
    try {
      credential.token = token;
      const run = await requestRun('',token,payload,submission.current!.key);
      router.push(`/results/${run.run_id}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Submission failed.'); }
    finally { setBusy(false); }
  }

  return <main id="main-content" className="bioscribe-page">
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" />Back to workspace</Link>
      <header className="bioscribe-enter mb-10 text-center">
        <span className="bioscribe-tag mb-5"><Sparkles className="h-3.5 w-3.5" /> Discovery Pipeline</span>
        <h1 className="mb-4 text-4xl font-light tracking-tight sm:text-6xl">Start something <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">new.</span></h1>
        <p className="text-lg font-light text-slate-600">Your inputs. Transparent methods. Traceable results.</p>
      </header>
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-7">
          <section className="bioscribe-panel p-6 sm:p-9" aria-labelledby="inputs-heading">
            <p className="bioscribe-eyebrow mb-3">01 · Your inputs</p>
            <h2 id="inputs-heading" className="mb-2 text-3xl font-light">Bring your research</h2>
            <p className="mb-7 text-sm text-slate-500">Choose your input type and add public research data.</p>
            <button type="button" className="bioscribe-outline-button mb-6 !text-sm" onClick={()=>{setKind('molecule');setCount(0);setContent('');setMolecules('CC(=O)Oc1ccccc1C(=O)O\nCn1c(=O)c2c(ncn2C)n(C)c1=O\nCC(=O)Nc1ccc(O)cc1\nCCO');setError('');}}>Use four public molecule examples</button>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="bioscribe-label">Declared input type<select aria-label="Declared input type" value={kind} onChange={e=>{const type=e.target.value as RunRequest['polymer_type'];setKind(type);setCount(['notes','molecule'].includes(type)?0:1);}} className="bioscribe-input">{['protein','dna','rna','notes','molecule'].map(type=><option key={type} value={type}>{type === 'dna' || type === 'rna' ? type.toUpperCase() : type[0].toUpperCase()+type.slice(1)}</option>)}</select></label>
              <label className="bioscribe-label">Declared sequence record count<input aria-label="Declared sequence record count" type="number" min={0} max={8} value={count} onChange={e=>setCount(Number(e.target.value))} className="bioscribe-input" /></label>
            </div>
            <label className="bioscribe-label mt-6">Sequence or notes<textarea aria-label="Sequence or notes" rows={7} value={content} onChange={e=>setContent(e.target.value)} className="bioscribe-input font-mono text-sm" placeholder={kind==='molecule'?'Leave empty for molecule-only inputs':'Paste your sequence, FASTA records or notes here'} /></label>
            <label className="mt-5 block cursor-pointer rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-6 transition-colors hover:border-violet-400 hover:bg-violet-50">
              <span className="flex items-center gap-3 text-sm text-violet-700"><Upload className="h-5 w-5" />Load UTF-8 text or FASTA</span>
              <span className="mt-1 block pl-8 text-xs text-slate-500">.txt, .fa or .fasta · Up to 128 KiB</span>
              <input aria-label="Load UTF-8 text or FASTA" className="mt-4 block w-full text-xs text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-violet-700" type="file" accept=".txt,.fa,.fasta" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>131072){setError('File exceeds 131072 bytes.');return;}try{setContent(new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer()));setError('');}catch{setError('File is not valid UTF-8.');}}} />
            </label>
            <label className="bioscribe-label mt-6">Molecules <span className="font-normal text-slate-500">· one SMILES per line</span><textarea aria-label="Molecules" rows={4} value={molecules} onChange={e=>setMolecules(e.target.value)} className="bioscribe-input font-mono text-sm" placeholder={'CCO\nOptional alongside sequences'} /></label>
            <p className="bioscribe-caption mt-3">Plain SMILES only. Names, CXSMILES, spaces/tabs and unresolved dummy/query atoms or bonds are unsupported. Each nonempty line is submitted unchanged; invalid inputs receive no descriptor or heuristic values.</p>
          </section>
          <section className="bioscribe-panel p-6 sm:p-9" aria-labelledby="access-heading">
            <p className="bioscribe-eyebrow mb-3">02 · Configure</p>
            <h2 id="access-heading" className="mb-6 text-3xl font-light">Connect your workspace</h2>
            <label className="bioscribe-label"><span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-violet-500" />Access token</span><input aria-label="Access token" type="password" value={token} onChange={e=>setToken(e.target.value)} className="bioscribe-input" autoComplete="off" placeholder="Enter your locally provisioned token" /></label>
            <p className="bioscribe-caption mt-3">Your token stays in memory. You will need it again after reloading.</p>
            <label className="mt-6 flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-sm leading-relaxed text-slate-600"><input className="mt-1 h-4 w-4 shrink-0 accent-violet-600" type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />I confirm these inputs are public and contain no confidential or patient-linked information.</label>
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-28">
          <section className="bioscribe-panel p-6">
            <p className="bioscribe-eyebrow mb-4">03 · Run overview</p>
            <h2 className="mb-5 text-2xl font-light">Built around your data</h2>
            <div className="space-y-5 text-sm">{[
              { icon: Dna, title: 'Sequence descriptors', text: 'Length, composition and supported pattern observations.' },
              { icon: Atom, title: 'Molecular descriptors', text: 'RDKit properties and an unvalidated, dimensionless heuristic.' },
              { icon: FileText, title: 'Evidence & export', text: 'Persisted run identity, methods and per-field assessment status.' },
            ].map(item => <div className="flex gap-3" key={item.title}><item.icon className="mt-1 h-5 w-5 shrink-0 text-violet-500" /><div><h3 className="mb-1 font-medium">{item.title}</h3><p className="text-xs leading-relaxed text-slate-500">{item.text}</p></div></div>)}</div>
            <div className="my-6 space-y-2 border-t border-slate-200/70 pt-5 text-sm text-slate-600"><p className="flex justify-between"><span>Input type</span><span className="font-medium capitalize">{kind}</span></p><p className="flex justify-between"><span>Declared records</span><span>{count}</span></p><p className="flex justify-between"><span>Molecular inputs</span><span>{molecules.split(/\r?\n/).filter(s=>s.length>0).length}</span></p></div>
            <button className="bioscribe-button w-full" disabled={busy||!consent||!token} onClick={submit}>{busy?<><Sparkles className="h-4 w-4 animate-pulse" />Submitting…</>:<>Submit descriptor run<ArrowRight className="h-4 w-4" /></>}</button>
            <p className="mt-3 text-center text-xs text-slate-500">{!token||!consent?'Add your token and confirm public inputs to run.':'Inputs will be validated when submitted.'}</p>
            {error&&<p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          </section>
          <div className="rounded-2xl border border-violet-200/70 bg-white/50 p-5"><p className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-800"><CheckCircle2 className="h-4 w-4" />Know what is assessed</p><p className="bioscribe-caption">Predictive toxicity, pharmacokinetics, affinity, synthesis and structure assessments are unavailable. Notes enter review without extraction.</p></div>
        </aside>
      </div>
      <details className="mt-7 rounded-2xl border border-violet-200/70 bg-white/45 p-5 text-sm text-slate-600"><summary className="cursor-pointer font-medium text-violet-800">Input limits & research scope</summary><p className="mt-4 leading-relaxed">Limits: 8 records, 10,000 residues per record, 20,000 total residues; 16 molecules with 256 atoms each; 4,000 note characters. Gaps, stops, ambiguous and nonstandard residues are rejected. Accession and organism remain explicitly unknown for these user-supplied inputs.</p><p className="mt-3">Scientific release and sensitive-data intake remain blocked. Submit only public, non-sensitive research inputs.</p></details>
    </div>
  </main>;
}
