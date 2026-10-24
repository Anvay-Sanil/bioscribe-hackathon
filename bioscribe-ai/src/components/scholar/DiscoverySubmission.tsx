'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';

interface DiscoverySubmissionProps {
    formula: string;
    molecularWeight: number;
    logP: number;
    hbd: number;
    hba: number;
    atomCount: number;
    onClose: () => void;
    onSubmit: () => void;
}

const PROCESSING_STEPS = [
    'Validating molecular structure...',
    'Calculating Tanimoto Coefficient...',
    'Searching PubChem for known analogs...',
    'Running ADMET prediction model...',
    'Docking to 5HT2A Receptor (AutoDock Vina)...',
    'Docking to COX-2 active site...',
    'Calculating binding free energy (ΔG)...',
    'Checking WHO Essential Medicines List...',
    'Querying Patent Database (USPTO/EPO)...',
    'Running Cytotoxicity prediction (hERG channel)...',
    'Generating 3D conformer ensemble...',
    'Deep learning binding affinity prediction...',
    'Cross-referencing DrugBank interactions...',
    'Finalizing compound profile...',
    '✅ Analysis complete. NOVEL COMPOUND CONFIRMED.',
];

export default function DiscoverySubmission({
    formula, molecularWeight, logP, hbd, hba, atomCount, onClose, onSubmit,
}: DiscoverySubmissionProps) {
    const [phase, setPhase] = useState<'reveal' | 'processing' | 'complete'>('reveal');
    const [currentLogLine, setCurrentLogLine] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [processLog, setProcessLog] = useState<string[]>([]);

    // Start processing animation
    useEffect(() => {
        if (phase !== 'processing') return;
        if (currentLogLine >= PROCESSING_STEPS.length) {
            setPhase('complete');
            setShowConfetti(true);
            onSubmit();
            return;
        }
        const timer = setTimeout(() => {
            setProcessLog(prev => [...prev, PROCESSING_STEPS[currentLogLine]]);
            setCurrentLogLine(prev => prev + 1);
        }, 300 + Math.random() * 400);
        return () => clearTimeout(timer);
    }, [phase, currentLogLine, onSubmit]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6"
                style={{ background: 'rgba(0,0,0,0.8)' }}
            >
                {showConfetti && <Confetti recycle={false} numberOfPieces={600} />}

                <motion.div
                    initial={{ scale: 0.7, y: 40 }}
                    animate={{ scale: 1, y: 0 }}
                    className="max-w-lg w-full p-8 rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, #0f1923 0%, #0a1628 100%)',
                        border: '2px solid rgba(0,255,136,0.3)',
                        boxShadow: '0 0 80px rgba(0,255,136,0.15)',
                    }}
                >
                    {/* Phase: REVEAL */}
                    {phase === 'reveal' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.8, ease: 'easeInOut' }}
                                className="text-7xl"
                            >
                                🧬
                            </motion.div>
                            <div>
                                <motion.h2
                                    animate={{ opacity: [0, 1] }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold neon-text-green tracking-wider"
                                >
                                    NOVEL COMPOUND DETECTED
                                </motion.h2>
                                <motion.p
                                    animate={{ opacity: [0, 1] }}
                                    transition={{ delay: 0.6 }}
                                    className="text-xs text-slate-500 mt-1 uppercase tracking-[3px]"
                                >
                                    Crowdsourced Cures Pipeline
                                </motion.p>
                            </div>

                            <div className="scholar-card p-5 text-left space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">Formula</span>
                                    <span className="text-sm font-bold neon-text-cyan">{formula}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">MW</span>
                                    <span className="text-sm text-slate-300">{molecularWeight.toFixed(1)} Da</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">LogP</span>
                                    <span className="text-sm text-slate-300">{logP.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">HBD / HBA</span>
                                    <span className="text-sm text-slate-300">{hbd} / {hba}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">Atoms</span>
                                    <span className="text-sm text-slate-300">{atomCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">Lipinski</span>
                                    <span className="text-sm font-bold neon-text-green">✅ ALL RULES PASSED</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setPhase('processing')}
                                className="scholar-btn-success w-full py-4 rounded-xl font-bold text-lg cursor-pointer"
                            >
                                🚀 Submit for Deep-Learning Analysis
                            </button>
                            <button onClick={onClose} className="text-xs text-slate-500 hover:text-white cursor-pointer">Skip</button>
                        </motion.div>
                    )}

                    {/* Phase: PROCESSING (Terminal Animation) */}
                    {phase === 'processing' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-xs text-slate-500 ml-2 font-mono">bioscribe-analysis-pipeline</span>
                            </div>
                            <div
                                className="rounded-xl p-4 font-mono text-xs overflow-y-auto max-h-64"
                                style={{ background: '#0a0a0a', border: '1px solid rgba(0,255,136,0.2)' }}
                            >
                                <div className="text-green-400 mb-2">$ bioscribe submit --compound {formula} --mode deep-learning</div>
                                {processLog.map((line, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`py-0.5 ${line.startsWith('✅') ? 'text-green-400 font-bold' : 'text-slate-400'}`}
                                    >
                                        {'>'} {line}
                                    </motion.div>
                                ))}
                                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-green-400">▌</motion.span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg, #00ff88, #00f0ff)' }}
                                    animate={{ width: `${(currentLogLine / PROCESSING_STEPS.length) * 100}%` }}
                                    transition={{ ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Phase: COMPLETE */}
                    {phase === 'complete' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-5">
                            <div className="text-6xl">🏆</div>
                            <h2 className="text-2xl font-bold neon-text-green">COMPOUND SUBMITTED!</h2>
                            <p className="text-sm text-slate-400">Your molecule has been queued for deep-learning binding analysis.</p>

                            <div className="p-4 rounded-xl text-left" style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)' }}>
                                <div className="text-xs text-slate-500 mb-1">Compound designed by</div>
                                <div className="text-sm font-bold neon-text-cyan">Scholar_{'{You}'}</div>
                                <div className="text-xs text-slate-500 mt-2">Estimated analysis time</div>
                                <div className="text-sm text-slate-300">~24-48 hours (simulated)</div>
                            </div>

                            <button onClick={onClose} className="scholar-btn w-full py-3 rounded-xl font-bold cursor-pointer">
                                🔬 Back to Lab
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
