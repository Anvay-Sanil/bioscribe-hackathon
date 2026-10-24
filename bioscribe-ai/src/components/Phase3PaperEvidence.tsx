'use client';
import {useEffect,useRef,useState} from 'react';
import {assistantRequest} from '@/lib/phase3/assistant';
import {decodePaperReview,type Paper,type PaperReview} from '@/lib/phase3/papers';

export function Phase3PaperEvidence({token}:{token:string}){
  const [papers,setPapers]=useState<Paper[]>([]),[snapshot,setSnapshot]=useState(''),[selected,setSelected]=useState<string[]>([]),[text,setText]=useState(''),[consent,setConsent]=useState(false),[result,setResult]=useState<PaperReview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const epoch=useRef(0);
  useEffect(()=>{epoch.current++;setPapers([]);setSelected([]);setSnapshot('');setResult(null);setError('');setBusy(false);},[token]);
  async function connect(){const current=++epoch.current;setResult(null);setError('');setBusy(true);try{
    const data=await assistantRequest('/papers/capabilities',token) as {contract_version:string;snapshot_sha256:string;papers:Paper[]};
    if(current!==epoch.current)return;
    if(data.contract_version!=='paper-review/0.2.0'||!Array.isArray(data.papers)||!data.papers.length)throw new Error('Unexpected paper capabilities.');
    setPapers(data.papers);setSnapshot(data.snapshot_sha256);setSelected([]);
  }catch(e){if(current===epoch.current){setPapers([]);setSelected([]);setError(e instanceof Error?e.message:'Paper sources unavailable.');}}finally{if(current===epoch.current)setBusy(false);}}
  async function check(){const current=++epoch.current;setResult(null);setError('');setBusy(true);try{
    const response=await assistantRequest('/papers/reviews',token,{contract_version:'paper-review/0.2.0',data_scope:'public_non_sensitive',text,paper_ids:selected}) as {status:string;run_id:string;output:unknown};
    if(current!==epoch.current)return;
    if(response.status!=='succeeded')throw new Error('Paper review failed or remains incomplete.');
    const value=decodePaperReview(response.output,text,papers.filter(p=>selected.includes(p.source_id)),snapshot);
    if(value.run_id!==response.run_id)throw new Error('Review ID mismatch.');setResult(value);
  }catch(e){if(current===epoch.current)setError(e instanceof Error?e.message:'Paper review unavailable.');}finally{if(current===epoch.current)setBusy(false);}}
  function download(){if(!result)return;const url=URL.createObjectURL(new Blob([JSON.stringify({format:'bioscribe-paper-review-export/0.1.0',review:result},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`bioscribe-paper-review-${result.run_id}.json`;a.click();URL.revokeObjectURL(url);}
  return <details className="bioscribe-panel my-8 p-6" id="paper-passages"><summary className="cursor-pointer text-xl font-medium text-violet-900">Paper passage reasoning <span className="ml-2 text-xs font-normal">Experimental · human review required</span></summary>
    <p className="mt-4 text-sm leading-6 text-slate-600">Check up to three statements against up to three frozen PubMed abstracts. The local 0.5B model proposes interpretations; exact quotations are checked against the snapshot. This does not prove entailment or scientific truth.</p>
    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Research aid, not a prediction of efficacy or safety. Confidence is not calibrated. The original 150 draft labels remain unreviewed.</p>
    <button className="bioscribe-outline-button mt-4" disabled={!token||busy} onClick={connect}>Load frozen paper sources</button>
    {!token&&<p className="mt-2 text-xs text-slate-500">Load your local access token in the connection panel above.</p>}
    {papers.length>0&&<fieldset className="my-5 space-y-3"><legend className="mb-3 text-sm font-medium">Select up to three sources</legend>{papers.map(p=><div key={p.source_id} className="rounded-xl border border-violet-100 p-3"><label className="flex gap-3 text-sm"><input type="checkbox" disabled={busy||(!selected.includes(p.source_id)&&selected.length>=3)} checked={selected.includes(p.source_id)} onChange={e=>{setResult(null);setSelected(e.target.checked?[...selected,p.source_id]:selected.filter(k=>k!==p.source_id));}}/><span>{p.source_id} · {p.title}<span className="mt-1 block text-xs text-slate-500">{p.eligibility.replaceAll('_',' ')} · snapshot {p.retrieved_utc?.slice(0,10)}</span></span></label><details className="mt-3 text-xs leading-6 text-slate-600"><summary className="cursor-pointer">Inspect frozen abstract</summary><p className="mt-2 whitespace-pre-line">{p.abstract}</p></details></div>)}</fieldset>}
    <label className="mt-5 block text-sm font-medium" htmlFor="paper-claim">Scientific statements</label><textarea id="paper-claim" className="bioscribe-input mt-2 min-h-28 text-sm" maxLength={4000} disabled={busy} value={text} onChange={e=>{setText(e.target.value);setResult(null);}}/>
    <label className="mt-4 flex gap-3 text-sm text-slate-600"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>{setConsent(e.target.checked);setResult(null);}}/>Public, non-sensitive inputs; I understand every interpretation requires review.</label>
    <button className="bioscribe-button mt-4" disabled={busy||!token||!consent||!text.trim()||!selected.length} onClick={check}>{busy?'Reviewing selected passages…':'Review paper passages'}</button>
    {error&&<p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {result&&<div className="mt-6 space-y-4" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3"><p className="break-all text-xs text-slate-500">Saved review {result.run_id} · {result.created_utc}</p><button className="bioscribe-outline-button text-sm" onClick={download}>Export cited interpretation</button></div>{result.statements.map((s,i)=><article className="rounded-xl border border-amber-200 bg-amber-50/40 p-4" key={i}><p className="text-xs font-medium uppercase tracking-wide text-amber-900">{s.verdict.replaceAll('_',' ')} · experimental interpretation · review required</p><h3 className="mt-3 font-medium">{s.text}</h3><p className="mt-2 text-xs text-slate-500">{s.reason_code.replaceAll('_',' ')} · Confidence: not calibrated</p>{s.citations.map((c,j)=><details key={j} className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-6"><summary className="cursor-pointer">{c.source_id} · {c.role.replaceAll('_',' ')}</summary><blockquote className="my-2 whitespace-pre-wrap">{c.excerpt}</blockquote><p className="break-all">{c.locator}<br/>SHA-256: {c.source_sha256}</p>{c.url&&<a className="text-violet-700 underline" href={c.url} target="_blank" rel="noreferrer">Open current publication record</a>}</details>)}</article>)}{result.disagreements.map((d,i)=><p key={i} className="rounded-xl bg-amber-100 p-3 text-sm">{d.interpretation}</p>)}<p className="text-xs leading-6 text-slate-500">{result.scope}</p></div>}
  </details>;
}
