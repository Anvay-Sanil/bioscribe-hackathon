'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Atom, BarChart3, Dna, FolderOpen, Sparkles } from 'lucide-react';


export default function DashboardPage() {
  const router = useRouter();
  const [runId, setRunId] = useState('');
  const [error, setError] = useState('');
  return <main id="main-content" className="bioscribe-page">
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-20">
      <header className="bioscribe-enter mb-16 text-center">
        <span className="bioscribe-tag mb-6"><Sparkles className="h-3.5 w-3.5" /> Your molecular research workspace</span>
        <h1 className="mb-6 text-5xl font-light leading-tight tracking-tight text-slate-900 sm:text-7xl">Welcome back.<br /><span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Let’s explore.</span></h1>
        <p className="mb-10 text-lg font-light text-slate-600 sm:text-2xl">Your next discovery starts with a clear view of your data.</p>
        <Link href="/evidence" className="group relative inline-flex max-w-full items-center gap-4 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-6 text-left text-white shadow-2xl shadow-violet-500/35 transition-transform hover:-translate-y-1 sm:px-12 sm:py-8">
          <Sparkles className="h-8 w-8 shrink-0" /><span><span className="block text-xl font-light sm:text-3xl">Open the Evidence Lab</span><span className="mt-1 block text-sm font-light text-violet-100 sm:text-lg">Validate · Compare · Recompute · Prove</span></span><ArrowRight className="h-6 w-6 shrink-0" />
        </Link>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-slate-500">Public, non-sensitive inputs only. Calculated descriptors and observations; predictive assessments remain unassessed.</p>
      </header>

      <section aria-labelledby="workspace-title" className="mb-16">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><h2 id="workspace-title" className="text-3xl font-light sm:text-4xl">Your Workspace</h2><span className="text-sm text-slate-500">Choose where to begin</span></div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'Evidence Lab', icon: Dna, text: 'Diagnose tricky inputs, inspect frozen source records and recompute a saved experiment exactly.', href: '/evidence', label: 'Trace the evidence', gradient: 'from-violet-100 via-purple-50 to-fuchsia-100', color: 'text-violet-500' },
            { title: 'Molecular Workbench', icon: Atom, text: 'Rotate molecule conformers, compare calculated descriptors and export a traceable shortlist.', href: '/molecules', label: 'Explore molecules', gradient: 'from-fuchsia-100 via-purple-50 to-violet-100', color: 'text-fuchsia-500' },
            { title: 'Screening Comparison', icon: BarChart3, text: 'Compare heuristic and QED orderings with invented labels. Explore budgets and unknown-label handling.', href: '/hackathon-learning/index.html', label: 'Open learning lab', gradient: 'from-indigo-100 via-violet-50 to-purple-100', color: 'text-indigo-500' },
          ].map(card => <Link key={card.title} href={card.href} className="bioscribe-panel group overflow-hidden transition-transform hover:-translate-y-1">
            <div className={`flex h-40 items-center justify-center bg-gradient-to-br ${card.gradient}`}><card.icon strokeWidth={1} className={`h-20 w-20 ${card.color}`} /></div>
            <div className="p-7"><h3 className="mb-3 text-xl font-normal">{card.title}</h3><p className="mb-6 text-sm leading-relaxed text-slate-600">{card.text}</p><span className="flex items-center gap-2 text-sm text-violet-700">{card.label}<ArrowRight className="h-4 w-4" /></span></div>
          </Link>)}
        </div>
      </section>

      <section id="open-run" className="bioscribe-panel mb-16 scroll-mt-28 p-6 sm:p-9" aria-labelledby="open-run-title">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div><FolderOpen className="mb-3 h-7 w-7 text-violet-600" /><h2 id="open-run-title" className="mb-2 text-2xl font-light">Open an original v3 report</h2><p className="max-w-lg text-sm leading-relaxed text-slate-500">For sequence and original molecular reports, paste a v3 run ID. Evidence Lab experiments can be reopened or resumed inside the Evidence Lab.</p></div>
          <form className="w-full lg:max-w-md" onSubmit={event => { event.preventDefault(); const id = runId.trim(); if (!/^[a-f0-9]{32}$/.test(id)) { setError('Enter a 32-character run ID using lowercase letters a–f and digits.'); return; } setError(''); router.push(`/results/${id}`); }}>
            <label className="bioscribe-label">Run ID<input aria-label="Run ID" className="bioscribe-input font-mono text-sm" placeholder="Paste your run ID" value={runId} onChange={event => setRunId(event.target.value)} required /></label>
            <button className="bioscribe-button mt-3 w-full" type="submit">Open report<ArrowRight className="h-4 w-4" /></button>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          </form>
        </div>
      </section>

      <section className="bioscribe-panel mb-16 flex flex-wrap items-center justify-between gap-6 p-8" aria-labelledby="proof-title">
        <div><span className="bioscribe-tag mb-3">Built for HM-01</span><h2 id="proof-title" className="mb-3 text-3xl font-light">What does the evidence actually show?</h2><p className="max-w-2xl text-sm leading-relaxed text-slate-500">Inspect the same tricky inputs in a basic descriptor script and BioScribe. Follow a three-minute demonstration, with every limitation in view.</p></div>
        <Link href="/proof" className="bioscribe-button">See the worked comparison <ArrowRight size={17}/></Link>
      </section>

      <section id="workflow-guide" aria-labelledby="guide-title" className="bioscribe-panel scroll-mt-28 p-6 sm:p-10">
        <h2 id="guide-title" className="mb-8 text-2xl font-light">From input to insight</h2>
        <div className="grid gap-8 md:grid-cols-3">{[
          ['01', 'Add your inputs', 'Choose an input type, load UTF-8 text or FASTA, or paste molecular SMILES.'],
          ['02', 'Configure your run', 'Review supported analyses, enter your locally provisioned token and confirm public data.'],
          ['03', 'Explore your report', 'Inspect each result’s method, evidence and coverage, then export the persisted run.'],
        ].map(([number, title, text]) => <div key={number}><p className="mb-3 text-4xl font-light text-violet-300">{number}</p><h3 className="mb-2 font-medium">{title}</h3><p className="text-sm leading-relaxed text-slate-500">{text}</p></div>)}</div>
        <p className="mt-8 border-t border-slate-200/70 pt-6 text-xs leading-relaxed text-slate-500">Research prototype. Scientific release and sensitive-data intake remain blocked. Molecular rankings are unvalidated heuristics, not affinity predictions. Notes require review; no AI extraction is enabled.</p>
      </section>
    </div>
  </main>;
}
