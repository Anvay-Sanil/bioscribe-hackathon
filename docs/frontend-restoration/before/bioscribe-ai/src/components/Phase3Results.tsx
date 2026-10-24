'use client';
import { useEffect, useState } from 'react';
import { requestRun } from '@/lib/phase3/client';
import type { RunView } from '@/lib/phase3/contract';
import { credential } from './Phase3Workbench';

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
  return <main className="max-w-5xl mx-auto p-8 space-y-5">
    <h1 className="text-3xl font-semibold">Run results</h1>
    <p>Scientific release blocked · Sensitive intake blocked · Audit integrity unverified</p>
    <p className="font-mono break-all">Run: {runId}</p>
    <label>Access token<input aria-label="Access token" type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" className="block border p-2" /></label>
    {!token&&<p>Enter your token to retrieve this persisted run.</p>}
    {error&&<p role="alert">{error}</p>}
    {visibleRun&&<><p role="status">Execution: {visibleRun.status}. Attempts: {visibleRun.attempts}. {visibleRun.error_code}</p><p className="break-all">Input hash: {visibleRun.request_sha256}</p></>}
    {visibleRun&&['queued','running'].includes(visibleRun.status)&&<button onClick={async()=>{try{setRun(await requestRun(`/${runId}/cancel`,token));}catch{setError('Cancellation failed.');}}} className="border p-2">Cancel run</button>}
    {visibleRun?.status==='succeeded'&&visibleRun.artifact&&<>
      <button className="border p-2" onClick={download}>Export this run and its evidence</button>
      <p>Execution success does not establish predictive validity. Composition groups overlap; they do not describe structural occupancy.</p>
      <p className="break-all">Artifact hash: {visibleRun.artifact_sha256}</p>
      {visibleRun.artifact.outputs.map(field=><article className="border rounded p-4 space-y-1" key={field.field_id}>
        <h2 className="font-semibold">{field.field_id}</h2>
        <p>{field.value===null?'No assessment':JSON.stringify(field.value)} {field.value===null?'':field.units}</p>
        <p>Assessment: {field.assessment_status} · Execution: {field.execution_status}</p>
        <p>Evidence: {field.evidence_category} · Predictive validation: {field.validation_status}</p>
        <p>{field.reason}</p><p>{field.validation_reason}</p>
        <p>Method: {field.method_id} / {field.method_version} · Fidelity: {field.implementation_fidelity}</p>
        <p>Domain: {field.domain}. Coverage: {field.coverage.analyzed}/{field.coverage.total}; {field.coverage.reason}</p>
      </article>)}
    </>}
  </main>;
}
