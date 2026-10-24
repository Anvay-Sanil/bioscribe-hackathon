import Link from 'next/link';
import { ArrowLeft, Atom } from 'lucide-react';
import { Phase3Explorer } from '@/components/Phase3Explorer';

export default function MoleculesPage() {
  return <main id="main-content" className="bioscribe-page"><div className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8 sm:py-14">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600"><ArrowLeft className="h-4 w-4" />Back to workspace</Link>
    <header><span className="bioscribe-tag mb-4"><Atom className="h-4 w-4" />BioScribe Discovery Lab</span><h1 className="mb-4 text-4xl font-light tracking-tight sm:text-6xl">Small molecules.<br /><span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">A clearer perspective.</span></h1><p className="text-lg font-light text-slate-600">Explore in 3D. Compare descriptors. Export the evidence.</p></header>
    <Phase3Explorer />
    <p className="text-xs text-slate-500">Educational research prototype · Affinity, toxicity and pharmacokinetics: not assessed · Scientific release and sensitive-data intake remain blocked.</p>
  </div></main>;
}
