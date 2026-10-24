'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Atom, Box, Download, FileJson, FlaskConical, Search, Sparkles, Upload } from 'lucide-react';
import { decodeRun } from '@/lib/phase3/client';
import type { RunView } from '@/lib/phase3/contract';
import { conformerFor, moleculeRows, numberValue, saveJSON, selectionExport, shortlist } from '@/lib/phase3/explorer';
import type { Conformer } from '@/lib/phase3/explorer';
import { Phase3MoleculeViewer } from './Phase3MoleculeViewer';

const display = (value: number | null) => value === null ? 'Not assessed' : value.toLocaleString('en', {maximumFractionDigits: 3});

export function Phase3Explorer({initialRun}: {initialRun?: RunView}) {
  const [run, setRun] = useState<RunView | null>(initialRun || null);
  const [source, setSource] = useState(initialRun ? 'Authenticated live run' : '');
  const [conformers, setConformers] = useState<Conformer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [budget, setBudget] = useState(Math.min(3, initialRun?.artifact?.chemical_identities.length || 3));
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [geometryError, setGeometryError] = useState('');
  const generation = useRef(0);
  useEffect(() => {
    const abort = new AbortController();
    const requests = generation;
    void fetch('/hackathon/conformers.json', {signal: abort.signal}).then(r => {if (!r.ok) throw new Error();return r.json();}).then(setConformers).catch(() => {if (!abort.signal.aborted) setGeometryError('Example conformers could not load. Descriptor reports are still usable.');});
    return () => {abort.abort(); requests.current++;};
  }, []);
  async function load(read: () => Promise<unknown>, label: string) {
    const ticket = ++generation.current;
    setRun(null); setError(''); setBusy(true); setQuery(''); setSelectedIndex(0); setSource('');
    try {
      const parsed = decodeRun(await read());
      if (parsed.status !== 'succeeded' || !parsed.artifact) throw new Error(`This run is ${parsed.status}. No completed molecular report is available.`);
      if (!parsed.artifact.chemical_identities.length) throw new Error('This report contains no molecules. Open its sequence report instead.');
      if (ticket !== generation.current) return;
      setRun(parsed);setSource(label);setBudget(Math.min(3, parsed.artifact.chemical_identities.length));
    } catch (e) {if (ticket === generation.current) setError(e instanceof Error ? e.message : 'Report rejected.');}
    finally {if (ticket === generation.current) setBusy(false);}
  }
  const rows = run ? moleculeRows(run) : [];
  const active = rows.find(row => row.index === selectedIndex);
  const conformer = conformerFor(active, conformers);
  const selection = shortlist(rows, budget);
  const label = (index: number) => conformerFor(rows[index], conformers)?.name || `Molecule ${index + 1}`;
  const visible = rows.filter(row => `${label(row.index)} ${row.smiles || ''} ${row.index + 1}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-7">
    {!initialRun && <section className="bioscribe-panel p-6 sm:p-8" aria-label="Choose molecular data">
      <div className="flex flex-wrap items-center justify-between gap-5"><div><h2 className="mb-2 text-2xl font-light">Start with a molecule library</h2><p className="max-w-xl text-sm leading-relaxed text-slate-500">Explore eight recorded public examples, import a BioScribe run, or calculate your own SMILES in the live pipeline.</p></div><Atom className="h-10 w-10 text-violet-300" /></div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="bioscribe-button" disabled={busy} onClick={() => load(async () => {const response = await fetch('/hackathon/example-run.json', {cache:'no-store'});if (!response.ok) throw new Error('Recorded example unavailable.');return response.json();}, 'Recorded public example · previously computed, not a new experiment')}><Sparkles className="h-4 w-4" />Load 8 example molecules</button>
        <label className="bioscribe-outline-button cursor-pointer"><Upload className="h-4 w-4" />Open run JSON<input aria-label="Open run JSON" className="sr-only" type="file" accept=".json,application/json" onChange={e => {const file=e.target.files?.[0];e.target.value='';if (file) void load(async () => {if (file.size > 3145728) throw new Error('Report exceeds the 3 MiB limit.');return JSON.parse(await file.text());}, 'Imported run · contract checked; origin not authenticated');}} /></label>
        <Link href="/pipeline/new" className="bioscribe-outline-button">Analyze your molecules<ArrowRight className="h-4 w-4" /></Link>
      </div>
      <p className="mt-4 text-xs text-slate-500">Imports stay in your browser. Use public, non-sensitive data only. Source authentication and checksum integrity are separate from contract checks.</p>
    </section>}
    {busy && <p role="status" className="bioscribe-panel p-5 text-violet-700">Checking report identity and field evidence…</p>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error} Previous results have been cleared.</p>}
    {!run && !busy && !error && <div className="bioscribe-panel flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center"><Box className="h-14 w-14 text-violet-300" /><h2 className="text-2xl font-light">A clear view of your molecules</h2><p className="max-w-lg text-sm text-slate-500">Load a library to inspect descriptors, rotate matching 3D conformers and build a reproducible shortlist.</p></div>}
    {run && <>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-5"><div><p className="font-medium text-violet-900">{source}</p><p className="mt-1 break-all font-mono text-xs text-violet-600">Run {run.run_id}</p></div><span className="bioscribe-tag">{rows.length} molecules · Scientific assessment: not assessed</span></div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.3fr)]">
        <section className="bioscribe-panel p-5 sm:p-6" aria-label="Molecule library"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-light">Your compounds</h2><span className="text-xs text-slate-500">{visible.length} of {rows.length}</span></div>
          <label className="bioscribe-label"><span className="flex items-center gap-2"><Search className="h-4 w-4" />Search molecules</span><input aria-label="Search molecules" className="bioscribe-input !mb-5 !text-sm" maxLength={2048} placeholder="Name, SMILES or row number" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <div className="max-h-[530px] space-y-2 overflow-y-auto">{visible.map(row => <button key={row.index} aria-pressed={row.index === selectedIndex} onClick={() => setSelectedIndex(row.index)} className={`block w-full rounded-xl border p-4 text-left transition-colors ${row.index === selectedIndex ? 'border-violet-300 bg-violet-100/80' : 'border-transparent bg-white/70 hover:bg-violet-50'}`}><span className="block text-sm font-medium text-slate-800">{label(row.index)}</span><span className="mt-1 block truncate font-mono text-xs text-slate-500">{row.smiles || row.status}</span><span className="mt-2 block text-xs text-violet-700">MW {display(numberValue(row.mw))} · Distance {display(numberValue(row.score))}</span></button>)}{!visible.length && <p className="p-6 text-sm text-slate-500">No matching molecules. Clear your search to restore the library.</p>}</div>
        </section>
        <section className="bioscribe-panel min-w-0 p-5 sm:p-6" aria-label="Selected molecule"><div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><p className="bioscribe-eyebrow mb-2">Molecular explorer</p><h2 className="text-2xl font-light">{active ? label(active.index) : 'Choose a molecule'}</h2></div><span className="bioscribe-tag">{active?.status || 'Unavailable'}</span></div>
          {geometryError && <p role="status" className="mb-3 text-xs text-slate-500">{geometryError}</p>}
          <Phase3MoleculeViewer conformer={conformer} />
          <p className="my-4 break-all rounded-xl bg-white/80 p-3 font-mono text-xs text-slate-600">{active?.smiles || 'Molecular identity unavailable'}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Molecular weight', display(numberValue(active?.mw)), 'g/mol'], ['Calculated logP', display(numberValue(active?.logp)), 'dimensionless'], ['TPSA', display(numberValue(active?.tpsa)), 'Å²'], ['Descriptor distance', display(numberValue(active?.score)), 'unvalidated heuristic']].map(([title,value,unit]) => <div key={title} className="rounded-xl bg-violet-50 p-3"><p className="text-xs text-slate-500">{title}</p><p className="my-2 text-xl font-light text-violet-900">{value}</p><p className="text-[10px] text-slate-500">{unit}</p></div>)}</div>
          <details className="mt-5 text-xs text-slate-600"><summary className="cursor-pointer font-medium text-violet-700">Methods, identity & assessment evidence</summary><p className="mt-3 break-all">Input SHA-256: {active?.hash}</p><div className="mt-3 max-h-64 space-y-3 overflow-auto">{active?.fields.map(field => <div key={field.field_id} className="rounded-lg bg-white p-3"><p className="font-medium">{field.quantity} · {field.assessment_status}</p><p>{field.method_id}/{field.method_version} · {field.evidence_category}</p><p>Domain: {field.domain} · Coverage: {field.coverage.analyzed}/{field.coverage.total} · Validation: {field.validation_status}</p><p>{field.reason}</p></div>)}</div></details>
        </section>
      </div>
      <section className="bioscribe-panel p-6 sm:p-8" aria-label="Screening shortlist"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="bioscribe-eyebrow mb-2">Screen & select</p><h2 className="mb-3 text-3xl font-light">Build your shortlist</h2><p className="max-w-2xl text-sm leading-relaxed text-slate-500">Ranks the entire loaded library by ascending descriptor distance. This target-independent heuristic measures proximity to MW 350 and TPSA 75; it predicts neither binding nor safety. Table search does not change selection.</p></div><label className="bioscribe-label">Selection budget<input aria-label="Selection budget" className="bioscribe-input !w-28" type="number" min={1} max={rows.length} value={budget} onChange={e => setBudget(Number(e.target.value))} /></label></div>
        {selection.reason ? <p role="status" className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{selection.reason}</p> : <ol aria-label="Ranked shortlist" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selection.rows.map((row,i) => <li key={row.index} className="flex items-center gap-4 rounded-xl border border-violet-100 bg-white p-4"><span className="text-2xl font-light text-violet-300">{String(i+1).padStart(2,'0')}</span><div><p className="text-sm font-medium">{label(row.index)}</p><p className="mt-1 text-xs text-slate-500">Distance {display(numberValue(row.score))}</p></div></li>)}</ol>}
        <p className="mt-4 text-xs text-slate-500">Ties: ascending input hash, then original row index. Unknown experimental labels: no hit-rate, precision or enrichment assessed for this library.</p>
      </section>
      <section className="bioscribe-panel p-6 sm:p-8" aria-label="Export reports"><div className="mb-5 flex items-center gap-3"><FileJson className="h-6 w-6 text-violet-500" /><h2 className="text-2xl font-light">Take your evidence with you</h2></div><div className="flex flex-wrap gap-3"><button className="bioscribe-button" onClick={() => saveJSON(run, `bioscribe-${run.run_id}.json`)}><Download className="h-4 w-4" />Export full run JSON</button><button className="bioscribe-outline-button" disabled={!!selection.reason} onClick={() => saveJSON(selectionExport(run,budget), `bioscribe-shortlist-${run.run_id}.json`)}>Export shortlist + evidence</button><button className="bioscribe-outline-button" onClick={() => window.print()}>Print / save PDF</button></div><p className="mt-4 text-xs text-slate-500">Full run exports preserve all original field evidence. Shortlist exports include the source run and selected input hashes. Imported reports are not authenticated by this browser.</p></section>
    </>}
    <Link href="/hackathon-learning/index.html" prefetch={false} className="bioscribe-panel flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8"><div className="flex items-center gap-4"><FlaskConical className="h-8 w-8 shrink-0 text-fuchsia-500" /><div><h2 className="text-xl font-light">Compare two screening strategies</h2><p className="mt-2 text-sm text-slate-500">A separate 120-molecule exercise with invented labels, QED comparison and unknown-label handling.</p></div></div><span className="bioscribe-tag">Synthetic learning data<ArrowRight className="h-4 w-4" /></span></Link>
  </div>;
}
