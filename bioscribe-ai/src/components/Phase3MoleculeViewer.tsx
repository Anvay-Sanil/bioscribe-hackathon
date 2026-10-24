'use client';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import type { Conformer } from '@/lib/phase3/explorer';

type Viewer = {
  addModel(data: string, format: string): unknown;
  setStyle(selection: object, style: object): void;
  zoomTo(): void; zoom(factor: number): void; render(): void; resize(): void; clear(): void; removeAllModels(): void; spin(axis: string | boolean, speed?: number): void;
};
type MolWindow = Window & { $3Dmol?: { createViewer(element: HTMLElement, options: object): Viewer } };

export function Phase3MoleculeViewer({conformer}: {conformer?: Conformer}) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [style, setStyle] = useState('ball-stick');
  const [spinning, setSpinning] = useState(false);
  useEffect(() => {
    if (!ready || !host.current) return;
    let current: Viewer | null = null;
    let observer: ResizeObserver | undefined;
    setError(''); setSpinning(false);
    try {
      const library = (window as MolWindow).$3Dmol;
      if (!library) throw new Error('3D library unavailable');
      current = library.createViewer(host.current, {backgroundColor: '#f6f3ff', antialias: true});
      viewer.current = current;
      observer = new ResizeObserver(() => {current?.resize(); current?.render();});
      observer.observe(host.current);
    } catch { setError('3D rendering is unavailable on this device. Molecular identity and descriptors remain available.'); }
    const element = host.current;
    return () => {observer?.disconnect(); current?.spin(false); current?.clear(); viewer.current = null; element.replaceChildren();};
  }, [ready]);
  useEffect(() => {
    const current = viewer.current;
    if (!current) return;
    // Reuse one WebGL context while switching molecules. Always remove the
    // previous model, including when the new identity has no conformer.
    current.spin(false); current.removeAllModels(); setSpinning(false);
    try {
      if (conformer) {current.addModel(conformer.molblock, 'sdf'); current.zoomTo(); current.zoom(.75);}
      current.render(); setError('');
    } catch {current.removeAllModels();current.render();setError('This conformer could not be rendered. No substitute structure is displayed.');}
  }, [conformer, ready]);
  useEffect(() => {
    const current = viewer.current;
    if (!current) return;
    current.setStyle({}, style === 'spacefill' ? {sphere: {scale: 1}} : style === 'stick' ? {stick: {radius: .16}} : {stick: {radius: .16}, sphere: {scale: .28}});
    current.render();
  }, [style, conformer, ready]);
  return <section className="overflow-hidden rounded-2xl border border-violet-100 bg-violet-50/50" aria-label="3D molecule">
    <Script src="/3dmol-min.js" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setError('The local 3D library could not load.')} />
    <div className="relative h-[340px] sm:h-[420px]">
      <div ref={host} className="absolute inset-0" role="img" aria-label={conformer ? `Computed 3D conformer of ${conformer.name}` : 'No 3D conformer available'} />
      {(!conformer || error || !ready) && <div role="status" className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-slate-600">{error || (!conformer ? 'No matching conformer in the example library. No substitute structure is displayed.' : 'Loading local 3D renderer…')}</div>}
      {conformer && !error && ready && <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs text-slate-600">Drag to rotate · Scroll to zoom</span>}
    </div>
    <div className="flex flex-wrap items-center gap-3 border-t border-violet-100 bg-white/80 p-4">
      <label className="text-xs text-slate-600">Representation <select aria-label="3D representation" className="ml-2 rounded-lg border border-violet-200 p-2" value={style} disabled={!conformer || !ready || !!error} onChange={e => setStyle(e.target.value)}><option value="ball-stick">Ball & stick</option><option value="stick">Sticks</option><option value="spacefill">Space filling</option></select></label>
      <button className="bioscribe-outline-button !px-3 !py-2 !text-xs" disabled={!conformer || !ready || !!error} onClick={() => {viewer.current?.spin(spinning ? false : 'y', 1);setSpinning(!spinning);}}>{spinning ? 'Stop rotation' : 'Rotate'}</button>
      <button className="bioscribe-outline-button !px-3 !py-2 !text-xs" disabled={!conformer || !ready || !!error} onClick={() => {viewer.current?.zoomTo(); viewer.current?.zoom(.75); viewer.current?.render();}}>Reset view</button>
    </div>
    <p className="border-t border-violet-100 p-4 text-xs leading-relaxed text-slate-500">Illustrative computed conformer · not an experimental structure or docking pose. {conformer && `${conformer.method}, ${conformer.version}; seed ${conformer.seed}; ${conformer.optimization_status}. Unspecified stereochemistry remains unspecified.`}</p>
  </section>;
}
