'use client';
import {useRef,useState} from 'react';
import {GitCompareArrows,Upload} from 'lucide-react';
import {compareLabPackages,type LabDiff} from '@/lib/phase3/lab-diff';
import {type LabPackage} from '@/lib/phase3/lab';

export function Phase3RunChanges({current}:{current:LabPackage}){
  const [diff,setDiff]=useState<LabDiff|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const upload=useRef<HTMLInputElement>(null),generation=useRef(0);
  async function compare(file?:File){
    if(!file)return;const id=++generation.current;setDiff(null);setError('');setBusy(true);
    try{if(file.size>2_000_000)throw new Error('Package exceeds the 2 MB limit.');const result=await compareLabPackages(JSON.parse(await file.text()),current);if(id===generation.current)setDiff(result);}
    catch(e){if(id===generation.current)setError(e instanceof Error?e.message.replace(' Previous results cleared.',''):'Comparison unavailable.');}
    finally{if(id===generation.current)setBusy(false);if(upload.current)upload.current.value='';}
  }
  return <section className="bioscribe-panel p-6 sm:p-7" aria-label="Run change inspector">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-xs text-violet-600"><GitCompareArrows size={16}/> Understand a changed result</p><h2 className="text-2xl font-light">What changed between runs?</h2></div><button disabled={busy} className="bioscribe-outline-button !text-xs" onClick={()=>upload.current?.click()}><Upload size={15}/>{busy?'Checking packages…':'Compare earlier package'}</button></div>
    <input ref={upload} type="file" accept=".json,application/json" aria-label="Earlier replay package" className="sr-only" onChange={e=>void compare(e.target.files?.[0])}/>
    <p className="mt-3 text-xs leading-relaxed text-slate-500">Open an earlier JSON export to compare with the currently displayed run. Matching uses unique molecular graph identities, so moving a row cannot turn it into a different compound.</p>
    {error&&<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-xs text-rose-800">{error} No comparison displayed.</p>}
    {diff&&<div className="mt-5 space-y-4"><p className="rounded-xl bg-violet-50 p-4 text-sm text-violet-900">{diff.explanation}</p>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">{[['Input rows',diff.inputsSame],['Engine + lock',diff.engineSame],['Source snapshot',diff.snapshotSame],['Identity policy',diff.policySame],['Selection budget',diff.budgetSame],['Result payload',diff.sameScientificPayload]].map(([label,same])=><div key={String(label)} className="rounded-xl border border-slate-200 p-3"><span className="block text-slate-500">{label}</span><strong className={same?'text-slate-700':'text-amber-800'}>{same?'Unchanged':'Changed'}</strong></div>)}</div>
      <p className="text-xs text-slate-600">Budget {diff.beforeBudget} → {diff.afterBudget} · {diff.matches.length} unique graph matches · {diff.unmatchedBefore} earlier / {diff.unmatchedAfter} current records unmatched. Rejected, absent or duplicate identities are not paired.</p>
      {diff.warning&&<p role="alert" className="text-sm text-rose-800">{diff.warning}</p>}
      <ul className="space-y-2 text-xs text-slate-600">{diff.matches.map(m=><li key={m.identity} className="rounded-lg bg-slate-50 p-3"><code className="break-all">{m.canonical}</code><span className="mt-1 block">Earlier #{m.beforeIndex+1} → current #{m.afterIndex+1} · {m.spellingChanged?'Different input spelling':'Same input spelling'} · {!m.comparable?'Numeric comparison withheld: engine or identity policy changed.':m.changes.length?`${m.changes.length} computed fields differ; recompute before interpreting.`:'Comparable computed descriptors unchanged.'}</span></li>)}</ul>
      {diff.selectionComparison&&<div className="rounded-xl border border-violet-100 p-4 text-xs leading-6 text-slate-600"><strong>Selections at each budget (original row numbers)</strong><p>Descriptor distance: {diff.selectionComparison.heuristicBefore.map(i=>`#${i+1}`).join(', ')} → {diff.selectionComparison.heuristicAfter.map(i=>`#${i+1}`).join(', ')}</p><p>QED: {diff.selectionComparison.qedBefore.map(i=>`#${i+1}`).join(', ')} → {diff.selectionComparison.qedAfter.map(i=>`#${i+1}`).join(', ')}</p></div>}
      <details className="text-[11px] text-slate-500"><summary className="cursor-pointer">Compared run identifiers</summary><p className="mt-2 break-all">Earlier: {diff.beforeRun}<br/>Current: {diff.afterRun}</p></details><p className="text-[11px] leading-relaxed text-slate-500">{diff.scope}</p>
    </div>}
  </section>;
}
