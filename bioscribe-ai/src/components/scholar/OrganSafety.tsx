'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '@/stores/GamificationStore';

// ─── Organ Data ──────────────────────────────────────────────────────
interface OrganToxicity {
    organ: string;
    icon: string;
    top: string;
    left: string;
    metrics: { name: string; value: number; threshold: number; unit: string; status: 'pass' | 'warning' | 'fail' }[];
    teachingPoint: string;
}

const ORGANS: OrganToxicity[] = [
    {
        organ: 'Brain', icon: '🧠', top: '8%', left: '50%',
        metrics: [
            { name: 'BBB Permeability', value: 0.72, threshold: 0.7, unit: 'logBB', status: 'warning' },
            { name: 'CNS Toxicity', value: 12, threshold: 30, unit: '%', status: 'pass' },
            { name: 'hERG Inhibition', value: 0.15, threshold: 0.5, unit: 'pIC50', status: 'pass' },
        ],
        teachingPoint: '💡 BBB permeability is critical for CNS drugs (want high) but dangerous for peripherally-acting drugs (want low). logBB > 0.3 = good CNS penetration.',
    },
    {
        organ: 'Heart', icon: '❤️', top: '30%', left: '45%',
        metrics: [
            { name: 'hERG Inhibition', value: 5.8, threshold: 6.0, unit: 'pIC50', status: 'warning' },
            { name: 'QT Prolongation', value: 22, threshold: 30, unit: 'ms', status: 'pass' },
            { name: 'Cardiotoxicity', value: 15, threshold: 25, unit: '%', status: 'pass' },
        ],
        teachingPoint: '💡 hERG channel inhibition is the #1 reason drugs fail in development. It causes QT prolongation → Torsades de Pointes → sudden cardiac death. pIC50 > 6.0 = danger zone.',
    },
    {
        organ: 'Liver', icon: '🫘', top: '42%', left: '40%',
        metrics: [
            { name: 'Hepatotoxicity', value: 68, threshold: 50, unit: '%', status: 'fail' },
            { name: 'CYP3A4 Inhibition', value: 78, threshold: 50, unit: '%', status: 'fail' },
            { name: 'Bile Duct Toxicity', value: 18, threshold: 40, unit: '%', status: 'pass' },
        ],
        teachingPoint: '💡 Drug-Induced Liver Injury (DILI) is the most common reason for post-market drug withdrawal. CYP inhibition causes dangerous drug-drug interactions.',
    },
    {
        organ: 'Kidneys', icon: '🫘', top: '52%', left: '55%',
        metrics: [
            { name: 'Nephrotoxicity', value: 22, threshold: 40, unit: '%', status: 'pass' },
            { name: 'Renal Clearance', value: 45, threshold: 30, unit: 'mL/min', status: 'pass' },
            { name: 'Crystalluria Risk', value: 8, threshold: 20, unit: '%', status: 'pass' },
        ],
        teachingPoint: '💡 Many drugs are renally cleared — dose adjustments are essential in CKD patients. Aminoglycosides and NSAIDs are classic nephrotoxins.',
    },
    {
        organ: 'Lungs', icon: '🫁', top: '28%', left: '55%',
        metrics: [
            { name: 'Pulmonary Toxicity', value: 5, threshold: 25, unit: '%', status: 'pass' },
            { name: 'Bronchospasm Risk', value: 3, threshold: 15, unit: '%', status: 'pass' },
        ],
        teachingPoint: '💡 Amiodarone and methotrexate can cause pulmonary fibrosis. Beta-blockers can trigger bronchospasm in asthmatics.',
    },
    {
        organ: 'GI Tract', icon: '🫄', top: '55%', left: '45%',
        metrics: [
            { name: 'GI Toxicity', value: 42, threshold: 40, unit: '%', status: 'warning' },
            { name: 'Oral Bioavailability', value: 65, threshold: 30, unit: '%', status: 'pass' },
        ],
        teachingPoint: '💡 NSAIDs inhibit COX-1 → reduced prostaglandin E2 → decreased gastric mucosal protection → peptic ulcers. PPIs mitigate this risk.',
    },
];

export default function OrganSafety() {
    const [selectedOrgan, setSelectedOrgan] = useState<OrganToxicity | null>(null);
    const { awardXP } = useGamificationStore();

    const overallSafety = useMemo(() => {
        let fails = 0, warnings = 0;
        ORGANS.forEach((o) => o.metrics.forEach((m) => {
            if (m.status === 'fail') fails++;
            if (m.status === 'warning') warnings++;
        }));
        return { fails, warnings };
    }, []);

    const getOrganGlow = (organ: OrganToxicity) => {
        const hasFail = organ.metrics.some((m) => m.status === 'fail');
        const hasWarning = organ.metrics.some((m) => m.status === 'warning');
        if (hasFail) return { color: '#ff3355', shadow: '0 0 30px rgba(255,51,85,0.6)', pulse: true };
        if (hasWarning) return { color: '#ffd700', shadow: '0 0 20px rgba(255,215,0,0.4)', pulse: false };
        return { color: '#00ff88', shadow: '0 0 15px rgba(0,255,136,0.3)', pulse: false };
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">🫀 Organ Safety</span>{' '}
                        <span className="neon-text-cyan">Visualizer</span>
                    </h1>
                    <p className="text-slate-400">Click an organ to see its toxicity profile</p>
                </motion.div>

                {/* Safety Summary */}
                <div className="flex justify-center gap-4">
                    <div className="scholar-card px-4 py-2 flex items-center gap-2">
                        <span className="text-red-500 text-lg">●</span>
                        <span className="text-sm text-white font-bold">{overallSafety.fails} Failures</span>
                    </div>
                    <div className="scholar-card px-4 py-2 flex items-center gap-2">
                        <span className="text-yellow-500 text-lg">●</span>
                        <span className="text-sm text-white font-bold">{overallSafety.warnings} Warnings</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Body Map */}
                    <div className="scholar-card p-6 relative" style={{ minHeight: '500px' }}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">🏥 Body Scan</h3>

                        {/* Stylized body outline */}
                        <div className="relative" style={{ height: '420px' }}>
                            {/* Body silhouette */}
                            <div className="absolute inset-0 flex justify-center">
                                <div className="relative w-48">
                                    {/* Head */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-slate-700" />
                                    {/* Torso */}
                                    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-28 h-48 rounded-lg border-2 border-slate-700" style={{ borderTopWidth: 0 }} />
                                    {/* Legs */}
                                    <div className="absolute top-64 left-1/2 -translate-x-1/2 flex gap-2">
                                        <div className="w-12 h-32 rounded-b-lg border-2 border-slate-700" style={{ borderTopWidth: 0 }} />
                                        <div className="w-12 h-32 rounded-b-lg border-2 border-slate-700" style={{ borderTopWidth: 0 }} />
                                    </div>
                                </div>
                            </div>

                            {/* Organ Markers */}
                            {ORGANS.map((organ) => {
                                const glow = getOrganGlow(organ);
                                return (
                                    <motion.button
                                        key={organ.organ}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                                        style={{ top: organ.top, left: organ.left }}
                                        whileHover={{ scale: 1.3 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setSelectedOrgan(organ);
                                            awardXP(2, `Inspected ${organ.organ}`, 'Organ Safety');
                                        }}
                                    >
                                        <div
                                            className={`text-3xl ${glow.pulse ? 'animate-pulse' : ''}`}
                                            style={{ filter: `drop-shadow(${glow.shadow})` }}
                                        >
                                            {organ.icon}
                                        </div>
                                        <div className="text-[10px] text-center mt-0.5 font-medium" style={{ color: glow.color }}>
                                            {organ.organ}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div className="space-y-4">
                        <AnimatePresence mode="wait">
                            {selectedOrgan ? (
                                <motion.div
                                    key={selectedOrgan.organ}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="scholar-card p-6 space-y-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">{selectedOrgan.icon}</span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{selectedOrgan.organ}</h3>
                                            <p className="text-xs text-slate-500">Toxicity Profile</p>
                                        </div>
                                    </div>

                                    {/* Metrics */}
                                    <div className="space-y-3">
                                        {selectedOrgan.metrics.map((metric) => {
                                            const pct = Math.min(100, (metric.value / (metric.threshold * 1.5)) * 100);
                                            const colors = {
                                                pass: { bar: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
                                                warning: { bar: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
                                                fail: { bar: '#ff3355', bg: 'rgba(255,51,85,0.1)' },
                                            };
                                            return (
                                                <div key={metric.name} className="p-3 rounded-xl" style={{ background: colors[metric.status].bg }}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs font-medium text-white">{metric.name}</span>
                                                        <span className="text-xs font-bold" style={{ color: colors[metric.status].bar }}>
                                                            {metric.value} {metric.unit}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.6 }}
                                                            className="h-full rounded-full"
                                                            style={{ background: colors[metric.status].bar }}
                                                        />
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1">
                                                        Threshold: {metric.threshold} {metric.unit} | Status: {metric.status.toUpperCase()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Teaching Point */}
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                                        <div className="text-xs font-bold neon-text-cyan mb-1">🎓 Teaching Point</div>
                                        <p className="text-sm text-slate-300">{selectedOrgan.teachingPoint}</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="scholar-card p-12 text-center"
                                >
                                    <span className="text-5xl mb-4 block">👆</span>
                                    <p className="text-slate-400">Click an organ on the body map to see its safety profile</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
