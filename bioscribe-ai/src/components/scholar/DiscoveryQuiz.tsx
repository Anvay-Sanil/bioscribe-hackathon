'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useGamificationStore } from '@/stores/GamificationStore';

// ─── Compound Data ───────────────────────────────────────────────────
interface Compound {
    id: string;
    name: string;
    smiles: string;
    mw: number;
    logP: number;
    bindingAffinity: number; // kcal/mol (more negative = better)
    isHit: boolean;
    properties: { label: string; value: string; good: boolean }[];
}

const COMPOUNDS: Compound[] = [
    {
        id: 'cpd-001', name: 'BioScribe-42α', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
        mw: 354.4, logP: 2.1, bindingAffinity: -9.4, isHit: true,
        properties: [
            { label: 'MW', value: '354.4 Da', good: true },
            { label: 'LogP', value: '2.1', good: true },
            { label: 'HBD', value: '2', good: true },
            { label: 'Docking', value: '-9.4 kcal/mol', good: true },
        ],
    },
    {
        id: 'cpd-002', name: 'Decoy-7β', smiles: 'C1CCCCC1',
        mw: 84.2, logP: 3.4, bindingAffinity: -3.2, isHit: false,
        properties: [
            { label: 'MW', value: '84.2 Da', good: false },
            { label: 'LogP', value: '3.4', good: false },
            { label: 'HBD', value: '0', good: false },
            { label: 'Docking', value: '-3.2 kcal/mol', good: false },
        ],
    },
    {
        id: 'cpd-003', name: 'Fragment-19γ', smiles: 'OC1=CC=CC=C1',
        mw: 156.1, logP: 1.3, bindingAffinity: -5.1, isHit: false,
        properties: [
            { label: 'MW', value: '156.1 Da', good: true },
            { label: 'LogP', value: '1.3', good: true },
            { label: 'HBD', value: '1', good: false },
            { label: 'Docking', value: '-5.1 kcal/mol', good: false },
        ],
    },
    {
        id: 'cpd-004', name: 'BioScribe-88δ', smiles: 'CC1=CC=C(C=C1)NC(=O)C2=CC=CC=C2',
        mw: 412.5, logP: 3.8, bindingAffinity: -8.7, isHit: true,
        properties: [
            { label: 'MW', value: '412.5 Da', good: true },
            { label: 'LogP', value: '3.8', good: true },
            { label: 'HBD', value: '3', good: true },
            { label: 'Docking', value: '-8.7 kcal/mol', good: true },
        ],
    },
    {
        id: 'cpd-005', name: 'Noise-33ε', smiles: 'CCCCCCCCCC',
        mw: 142.3, logP: 5.2, bindingAffinity: -2.8, isHit: false,
        properties: [
            { label: 'MW', value: '142.3 Da', good: false },
            { label: 'LogP', value: '5.2', good: false },
            { label: 'HBD', value: '0', good: false },
            { label: 'Docking', value: '-2.8 kcal/mol', good: false },
        ],
    },
    {
        id: 'cpd-006', name: 'Decoy-51ζ', smiles: 'CC(C)(C)C',
        mw: 72.1, logP: 2.3, bindingAffinity: -4.0, isHit: false,
        properties: [
            { label: 'MW', value: '72.1 Da', good: false },
            { label: 'LogP', value: '2.3', good: false },
            { label: 'HBD', value: '0', good: false },
            { label: 'Docking', value: '-4.0 kcal/mol', good: false },
        ],
    },
    {
        id: 'cpd-007', name: 'Fragment-66η', smiles: 'C1=CC=C(C=C1)O',
        mw: 94.1, logP: 1.5, bindingAffinity: -4.5, isHit: false,
        properties: [
            { label: 'MW', value: '94.1 Da', good: false },
            { label: 'LogP', value: '1.5', good: true },
            { label: 'HBD', value: '1', good: false },
            { label: 'Docking', value: '-4.5 kcal/mol', good: false },
        ],
    },
    {
        id: 'cpd-008', name: 'BioScribe-104θ', smiles: 'CC(=O)NC1=CC=C(C=C1)OCC2=CC=CC=C2',
        mw: 389.3, logP: 2.9, bindingAffinity: -10.1, isHit: true,
        properties: [
            { label: 'MW', value: '389.3 Da', good: true },
            { label: 'LogP', value: '2.9', good: true },
            { label: 'HBD', value: '2', good: true },
            { label: 'Docking', value: '-10.1 kcal/mol', good: true },
        ],
    },
];

export default function DiscoveryQuiz() {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'results'>('idle');
    const [timer, setTimer] = useState(90);
    const [selected, setSelected] = useState<string[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [shuffled, setShuffled] = useState<Compound[]>([]);

    const { awardXP, unlockBadge } = useGamificationStore();

    const totalHits = COMPOUNDS.filter((c) => c.isHit).length;

    useEffect(() => {
        if (gameState === 'playing' && timer > 0) {
            const t = setInterval(() => setTimer((p) => p - 1), 1000);
            return () => clearInterval(t);
        }
        if (timer === 0 && gameState === 'playing') {
            finishGame();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, timer]);

    const startGame = () => {
        setShuffled([...COMPOUNDS].sort(() => Math.random() - 0.5));
        setSelected([]);
        setTimer(90);
        setShowConfetti(false);
        setGameState('playing');
    };

    const toggleSelect = (id: string) => {
        if (gameState !== 'playing') return;
        setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
    };

    const finishGame = useCallback(() => {
        setGameState('results');
        const correctHits = selected.filter((id) => COMPOUNDS.find((c) => c.id === id)?.isHit).length;
        const falsePositives = selected.filter((id) => !COMPOUNDS.find((c) => c.id === id)?.isHit).length;
        const score = Math.max(0, correctHits * 25 - falsePositives * 10);
        awardXP(score, `Discovery Quiz: ${correctHits}/${totalHits} hits found`, 'Discovery Quiz');

        if (correctHits === totalHits && falsePositives === 0) {
            unlockBadge('quiz_champion');
            setShowConfetti(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, awardXP, unlockBadge, totalHits]);

    if (gameState === 'idle') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg text-center space-y-6">
                    <div className="text-8xl">🔍</div>
                    <h1 className="text-4xl font-bold neon-text-cyan">DISCOVERY QUIZ</h1>
                    <p className="text-slate-400 text-lg">Find the drug candidates hiding among the decoys. Analyze molecular properties to separate hits from noise.</p>
                    <div className="scholar-card p-5 text-left space-y-2">
                        <div className="text-sm text-slate-300">⏱️ 90 seconds to find all {totalHits} true hits</div>
                        <div className="text-sm text-slate-300">🧪 {COMPOUNDS.length} compounds to analyze</div>
                        <div className="text-sm text-slate-300">✅ +25 XP per correct hit, -10 XP per false alarm</div>
                        <div className="text-sm text-slate-300">🏆 Perfect score unlocks &quot;Quiz Champion&quot; badge</div>
                    </div>
                    <button onClick={startGame} className="scholar-btn px-10 py-4 rounded-xl w-full text-lg font-bold cursor-pointer">
                        🔬 Start Screening
                    </button>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'results') {
        const correctHits = selected.filter((id) => COMPOUNDS.find((c) => c.id === id)?.isHit).length;
        const missed = totalHits - correctHits;
        const falsePos = selected.filter((id) => !COMPOUNDS.find((c) => c.id === id)?.isHit).length;

        return (
            <div className="min-h-screen p-6">
                {showConfetti && <Confetti recycle={false} numberOfPieces={400} />}
                <div className="max-w-4xl mx-auto space-y-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="text-6xl mb-4">{correctHits === totalHits && falsePos === 0 ? '🏆' : '📊'}</div>
                        <h2 className="text-3xl font-bold text-white mb-2">Screening Results</h2>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="scholar-card p-5 text-center">
                            <div className="text-3xl font-bold neon-text-green">{correctHits}</div>
                            <div className="text-xs text-slate-500">True Positives</div>
                        </div>
                        <div className="scholar-card p-5 text-center">
                            <div className="text-3xl font-bold neon-text-red">{missed}</div>
                            <div className="text-xs text-slate-500">Missed Hits</div>
                        </div>
                        <div className="scholar-card p-5 text-center">
                            <div className="text-3xl font-bold neon-text-gold">{falsePos}</div>
                            <div className="text-xs text-slate-500">False Alarms</div>
                        </div>
                    </div>

                    {/* Show verdicts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {COMPOUNDS.map((cpd) => {
                            const wasSelected = selected.includes(cpd.id);
                            const correct = wasSelected === cpd.isHit;
                            return (
                                <div key={cpd.id} className="scholar-card p-4" style={{
                                    borderColor: correct ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,85,0.3)',
                                    background: correct ? 'rgba(0,255,136,0.05)' : 'rgba(255,51,85,0.05)',
                                }}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-white">{cpd.name}</span>
                                        <div className="flex gap-2">
                                            {cpd.isHit && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">HIT</span>}
                                            <span className="text-xs px-2 py-0.5 rounded" style={{
                                                background: correct ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,85,0.2)',
                                                color: correct ? '#00ff88' : '#ff3355',
                                            }}>
                                                {correct ? '✅' : '❌'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button onClick={startGame} className="scholar-btn px-8 py-3 rounded-xl w-full cursor-pointer">🔄 Play Again</button>
                </div>
            </div>
        );
    }

    // ─── Playing State ──────────────────────────────────────────────
    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Timer Header */}
                <div className="scholar-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔍</span>
                        <span className="text-sm font-bold uppercase tracking-wider text-white">Discovery Quiz</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500">Selected: {selected.length}</span>
                        <div className={`text-2xl font-mono font-bold ${timer <= 15 ? 'neon-text-red countdown-critical' : timer <= 45 ? 'neon-text-gold' : 'neon-text-cyan'}`}>
                            {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                        </div>
                    </div>
                </div>

                <p className="text-center text-sm text-slate-400">
                    Click compounds you think are true drug hits. Look for strong binding affinity and drug-like properties.
                </p>

                {/* Compound Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shuffled.map((cpd) => {
                        const isSel = selected.includes(cpd.id);
                        return (
                            <motion.button
                                key={cpd.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleSelect(cpd.id)}
                                className="scholar-card p-4 text-left transition-all cursor-pointer"
                                style={{
                                    borderColor: isSel ? 'rgba(0, 240, 255, 0.5)' : 'var(--scholar-border)',
                                    background: isSel ? 'rgba(0, 240, 255, 0.08)' : 'var(--scholar-surface)',
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-bold text-white">{cpd.name}</span>
                                    {isSel && <span className="neon-text-cyan text-lg">✓</span>}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {cpd.properties.map((p) => (
                                        <div key={p.label} className="text-center">
                                            <div className="text-[10px] text-slate-500">{p.label}</div>
                                            <div className="text-xs font-mono font-bold" style={{ color: p.good ? '#00ff88' : '#94a3b8' }}>
                                                {p.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <button onClick={finishGame} className="scholar-btn-success px-8 py-3 rounded-xl w-full text-lg font-bold cursor-pointer">
                    ✅ Submit Selections
                </button>
            </div>
        </div>
    );
}
