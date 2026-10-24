'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, KeyRound, Layers } from 'lucide-react';
import { requestRun } from '@/lib/phase3/client';
import type { RunView } from '@/lib/phase3/contract';
import { credential } from './Phase3Workbench';
import { Phase3Explorer } from './Phase3Explorer';

export function Phase3Results({runId}: {runId:string}) {
  const [token,setToken]=useState(credential.token);
  const [run,setRun]=useState<RunView|null>(null);
  const [loadedToken,setLoadedToken]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{
    let disposed=false;
    let timer:ReturnType<typeof setTimeout>;
    setRun(null);setError('');
    async function refresh(){
      if(!token)return;
      try{
        const result=await requestRun(`/${runId}`,token);
        if(disposed)return;
        if(result.run_id!==runId)throw new Error('Requested run and returned run differ.');
        setRun(result);setLoadedToken(token);setError('');
        if(['queued','running'].includes(result.status))timer=setTimeout(refresh,1000);
      }catch(e){if(!disposed){setRun(null);setError(e instanceof Error?e.message:'Unable to load run.');}}
    }
    void refresh();
    return ()=>{disposed=true;clearTimeout(timer);};
  },[runId,token]);
  async function download(){
    try{
      const exported=await requestRun(`/${runId}/export`,token);
      if(exported.run_id!==runId)throw new Error('Export attribution mismatch.');
      const url=URL.createObjectURL(new Blob([JSON.stringify(exported,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download=`bioscribe-${runId}.json`;a.click();URL.revokeObjectURL(url);
    }catch(e){setError(e instanceof Error?e.message:'Export failed.');}
  }
  const visibleRun=run?.run_id===runId&&loadedToken===token?run:null;
  return <main id="main-content" className="bioscribe-page">
    <div className="mx-auto max-w-6xl space-y-7 px-5 py-10 sm:px-8 sm:py-16">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-violet-700"><ArrowLeft className="h-4 w-4" />Back to workspace</Link>
      <header className="bioscribe-enter flex flex-wrap items-center justify-between gap-5">
        <div><span className="bioscribe-tag mb-4"><FileText className="h-3.5 w-3.5" /> Your research report</span><h1 className="mb-3 text-4xl font-light tracking-tight sm:text-5xl">Pipeline Results</h1><p className="break-all font-mono text-xs text-slate-500">Run: {runId}</p></div>
        {visibleRun?.status==='succeeded'&&visibleRun.artifact&&<button className="bioscribe-button" onClick={download}><Download className="h-4 w-4" />Export this run and its evidence</button>}
      </header>
      <section className="bioscribe-panel p-6 sm:p-8" aria-labelledby="report-access">
        <div className="grid items-center gap-6 md:grid-cols-2"><div><h2 id="report-access" className="mb-2 flex items-center gap-2 text-xl font-light"><KeyRound className="h-5 w-5 text-violet-500" />Access your run</h2><p className="text-sm leading-relaxed text-slate-500">Enter your token to retrieve this persisted run. Reports are shown only after identity and evidence checks.</p></div><label className="bioscribe-label">Access token<input aria-label="Access token" type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" className="bioscribe-input" /></label></div>
        {!token&&<p className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-800">Awaiting your access token. No results loaded.</p>}
        {token&&!visibleRun&&!error&&<p role="status" className="mt-5 text-sm text-violet-700">Retrieving your run…</p>}
        {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      </section>
      {visibleRun&&<section className="bioscribe-panel space-y-4 p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><p role="status" className="bioscribe-tag">Execution: {visibleRun.status} · Attempts: {visibleRun.attempts}</p>{visibleRun.error_code&&<p className="text-sm text-red-800">{visibleRun.error_code}</p>}
        {['queued','running'].includes(visibleRun.status)&&<button onClick={async()=>{try{const cancelled=await requestRun(`/${runId}/cancel`,token);if(cancelled.run_id!==runId)throw new Error('Run mismatch');setRun(cancelled);}catch{setError('Cancellation failed.');}}} className="bioscribe-outline-button">Cancel run</button>}</div>
        <p className="break-all font-mono text-xs leading-relaxed text-slate-500">Input hash: {visibleRun.request_sha256}</p>
        {visibleRun.artifact_sha256&&<p className="break-all font-mono text-xs leading-relaxed text-slate-500">Artifact hash: {visibleRun.artifact_sha256}</p>}
      </section>}
      {visibleRun?.status==='succeeded'&&visibleRun.artifact&&<>
        {visibleRun.artifact.chemical_identities.length > 0 && <Phase3Explorer key={visibleRun.run_id} initialRun={visibleRun} />}
        <div><h2 className="mb-3 flex items-center gap-3 text-3xl font-light"><Layers className="h-6 w-6 text-violet-500" />Results & evidence</h2><p className="text-sm leading-relaxed text-slate-600">Execution success does not establish predictive validity. Composition groups overlap; they do not describe structural occupancy.</p></div>
        <div className="grid items-start gap-5 md:grid-cols-2">{visibleRun.artifact.outputs.map(field=><article className="bioscribe-panel min-w-0 p-6 [overflow-wrap:anywhere]" key={field.field_id}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-mono text-sm text-slate-600">{field.field_id}</h3><span className={`rounded-full px-2.5 py-1 text-xs ${field.value===null?'bg-slate-100 text-slate-600':'bg-violet-100 text-violet-800'}`}>{field.assessment_status}</span></div>
          <p className={`mb-5 text-2xl font-light ${field.value===null?'text-slate-400':'text-violet-900'}`}>{field.value===null?'No assessment':JSON.stringify(field.value)}<span className="ml-2 text-sm text-slate-500">{field.value===null?'':field.units}</span></p>
          <div className="space-y-2 border-t border-slate-200/70 pt-4 text-xs leading-relaxed text-slate-600">
            <p>Assessment: {field.assessment_status} · Execution: {field.execution_status}</p>
            <p>Evidence: {field.evidence_category} · Predictive validation: {field.validation_status}</p>
            <p>{field.reason}</p><p>{field.validation_reason}</p>
            <p>Method: {field.method_id} / {field.method_version} · Fidelity: {field.implementation_fidelity}</p>
            <p>Domain: {field.domain}. Coverage: {field.coverage.analyzed}/{field.coverage.total}; {field.coverage.reason}</p>
          </div>
        </article>)}</div>
      </>}
      <p className="border-t border-violet-200/70 pt-6 text-xs leading-relaxed text-slate-500">Scientific release blocked · Sensitive intake blocked · Audit integrity unverified</p>
    </div>
  </main>;
}
