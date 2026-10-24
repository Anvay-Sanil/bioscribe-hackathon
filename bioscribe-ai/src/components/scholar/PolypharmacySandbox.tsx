'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '@/stores/GamificationStore';

// ─── Drug Database ───────────────────────────────────────────────────
interface Drug {
    id: string;
    name: string;
    class: string;
    icon: string;
    color: string;
}

interface Interaction {
    drug1: string;
    drug2: string;
    severity: 'severe' | 'moderate' | 'minor';
    mechanism: string;
    clinicalEffect: string;
    recommendation: string;
    enzymes: string[];
    teachingPoint: string;
}

const DRUGS: Drug[] = [
    { id: 'warfarin', name: 'Warfarin', class: 'Anticoagulant', icon: '💊', color: '#ef4444' },
    { id: 'aspirin', name: 'Aspirin', class: 'NSAID / Antiplatelet', icon: '💊', color: '#f97316' },
    { id: 'metformin', name: 'Metformin', class: 'Biguanide', icon: '💊', color: '#3b82f6' },
    { id: 'lisinopril', name: 'Lisinopril', class: 'ACE Inhibitor', icon: '💊', color: '#8b5cf6' },
    { id: 'amiodarone', name: 'Amiodarone', class: 'Antiarrhythmic', icon: '💊', color: '#ec4899' },
    { id: 'simvastatin', name: 'Simvastatin', class: 'Statin', icon: '💊', color: '#14b8a6' },
    { id: 'fluconazole', name: 'Fluconazole', class: 'Antifungal', icon: '💊', color: '#a855f7' },
    { id: 'metoprolol', name: 'Metoprolol', class: 'Beta Blocker', icon: '💊', color: '#06b6d4' },
    { id: 'digoxin', name: 'Digoxin', class: 'Cardiac Glycoside', icon: '💊', color: '#eab308' },
    { id: 'spironolactone', name: 'Spironolactone', class: 'K+ Sparing Diuretic', icon: '💊', color: '#22c55e' },
];

const INTERACTIONS: Interaction[] = [
    {
        drug1: 'warfarin', drug2: 'aspirin',
        severity: 'severe',
        mechanism: 'Dual antiplatelet + anticoagulant effect. Aspirin inhibits COX-1 (→ ↓TXA2 → ↓platelet aggregation) while warfarin blocks Vitamin K epoxide reductase (→ ↓Factors II, VII, IX, X).',
        clinicalEffect: '⚠️ MAJOR GI/intracranial hemorrhage risk. Combined bleeding time far exceeds either drug alone.',
        recommendation: 'Avoid combination unless specifically indicated (e.g., mechanical valve + CAD). Monitor INR closely. Add PPI for GI protection.',
        enzymes: ['CYP2C9', 'CYP3A4'],
        teachingPoint: '💡 "Dual antihaemostasis" — both platelet function AND coagulation cascade are impaired. This is why post-stent patients on triple therapy need very careful management.',
    },
    {
        drug1: 'warfarin', drug2: 'fluconazole',
        severity: 'severe',
        mechanism: 'Fluconazole is a potent CYP2C9 inhibitor. Warfarin (S-enantiomer) is primarily metabolized by CYP2C9. Fluconazole blocks this metabolism → warfarin accumulates.',
        clinicalEffect: '⚠️ INR can double or triple within 3-5 days. High risk of spontaneous bleeding.',
        recommendation: 'Reduce warfarin dose by 25-50% when starting fluconazole. Check INR within 3 days. Consider alternative antifungal.',
        enzymes: ['CYP2C9'],
        teachingPoint: '💡 CYP2C9 inhibition is the most dangerous interaction pathway for warfarin because S-warfarin (the active enantiomer) depends on this enzyme for clearance.',
    },
    {
        drug1: 'simvastatin', drug2: 'amiodarone',
        severity: 'severe',
        mechanism: 'Amiodarone inhibits CYP3A4, which metabolizes simvastatin. This causes simvastatin levels to increase dramatically (up to 4x).',
        clinicalEffect: '⚠️ High risk of rhabdomyolysis — muscle breakdown releasing myoglobin that can cause acute kidney injury.',
        recommendation: 'FDA limit: Simvastatin max 20mg/day with amiodarone. Consider switching to rosuvastatin (not CYP3A4 metabolized).',
        enzymes: ['CYP3A4'],
        teachingPoint: '💡 Not all statins are equal! Simvastatin and lovastatin are CYP3A4 substrates (high interaction risk). Rosuvastatin and pravastatin are safer alternatives.',
    },
    {
        drug1: 'lisinopril', drug2: 'spironolactone',
        severity: 'moderate',
        mechanism: 'Both increase serum potassium. ACE inhibitors reduce aldosterone (→ ↓K+ excretion). Spironolactone directly blocks aldosterone receptor (→ ↓K+ excretion).',
        clinicalEffect: '⚠️ Hyperkalemia — K+ > 5.5 mEq/L can cause fatal cardiac arrhythmias (peaked T waves → sine wave → asystole).',
        recommendation: 'Monitor K+ within 1 week of starting combo. Avoid in patients with eGFR < 30. Watch for muscle weakness, paresthesias.',
        enzymes: [],
        teachingPoint: '💡 The RALES trial showed mortality benefit of this combo in heart failure — but ONLY with careful K+ monitoring. Real-world hyperkalemia hospitalizations spiked after RALES publication.',
    },
    {
        drug1: 'digoxin', drug2: 'amiodarone',
        severity: 'severe',
        mechanism: 'Amiodarone reduces renal and non-renal clearance of digoxin, AND displaces digoxin from tissue binding sites → free digoxin levels increase by 70-100%.',
        clinicalEffect: '⚠️ Digoxin toxicity: nausea, visual disturbances (yellow halos), bradycardia, life-threatening arrhythmias.',
        recommendation: 'Reduce digoxin dose by 50% when starting amiodarone. Target lower digoxin level (0.5-0.9 ng/mL).',
        enzymes: ['P-glycoprotein'],
        teachingPoint: '💡 Amiodarone inhibits P-glycoprotein transporter, which normally pumps digoxin OUT of cells. Blocking this "efflux pump" traps digoxin inside cells.',
    },
    {
        drug1: 'metformin', drug2: 'fluconazole',
        severity: 'minor',
        mechanism: 'Fluconazole may enhance the hypoglycemic effect of metformin through CYP2C9 inhibition of concurrent sulfonylureas, but direct interaction with metformin is minimal.',
        clinicalEffect: 'Minimal direct interaction. Low risk unless patient is also on sulfonylureas or has renal impairment.',
        recommendation: 'Generally safe. Monitor blood glucose if patient is on other diabetes medications.',
        enzymes: ['CYP2C9'],
        teachingPoint: '💡 Metformin does NOT undergo significant CYP metabolism — it\'s renally excreted unchanged. This makes it one of the "cleanest" drugs from an interaction standpoint.',
    },
];

export default function PolypharmacySandbox() {
    const [craftingSlots, setCraftingSlots] = useState<(Drug | null)[]>([null, null]);
    const [foundInteraction, setFoundInteraction] = useState<Interaction | null>(null);
    const [showExplosion, setShowExplosion] = useState(false);
    const [interactionLog, setInteractionLog] = useState<Interaction[]>([]);

    const { awardXP, unlockBadge, incrementInteractionsFound } = useGamificationStore();

    const addDrug = useCallback(
        (drug: Drug) => {
            setCraftingSlots((prev) => {
                if (prev[0]?.id === drug.id || prev[1]?.id === drug.id) return prev;
                if (!prev[0]) return [drug, prev[1]];
                if (!prev[1]) return [prev[0], drug];
                return [drug, prev[1]];
            });
        },
        []
    );

    const checkInteraction = useCallback(() => {
        if (!craftingSlots[0] || !craftingSlots[1]) return;

        const d1 = craftingSlots[0].id;
        const d2 = craftingSlots[1].id;
        const interaction = INTERACTIONS.find(
            (i) => (i.drug1 === d1 && i.drug2 === d2) || (i.drug1 === d2 && i.drug2 === d1)
        );

        if (interaction) {
            setFoundInteraction(interaction);
            setShowExplosion(interaction.severity === 'severe');
            incrementInteractionsFound();

            if (!interactionLog.some((l) => l.drug1 === interaction.drug1 && l.drug2 === interaction.drug2)) {
                setInteractionLog((prev) => [...prev, interaction]);
                const xpAmount = interaction.severity === 'severe' ? 20 : interaction.severity === 'moderate' ? 10 : 5;
                awardXP(xpAmount, `Found interaction: ${craftingSlots[0].name} + ${craftingSlots[1].name}`, 'Polypharmacy Sandbox');
            }

            if (interactionLog.length + 1 >= 5) {
                unlockBadge('polypharmacy_master');
            }

            setTimeout(() => setShowExplosion(false), 2000);
        } else {
            setFoundInteraction(null);
        }
    }, [craftingSlots, awardXP, unlockBadge, incrementInteractionsFound, interactionLog]);

    const clearSlots = () => {
        setCraftingSlots([null, null]);
        setFoundInteraction(null);
        setShowExplosion(false);
    };

    const severityStyles = {
        severe: { bg: 'rgba(255, 51, 85, 0.1)', border: 'rgba(255, 51, 85, 0.3)', text: '#ff3355', label: '🔴 SEVERE' },
        moderate: { bg: 'rgba(255, 215, 0, 0.1)', border: 'rgba(255, 215, 0, 0.3)', text: '#ffd700', label: '🟡 MODERATE' },
        minor: { bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', text: '#00ff88', label: '🟢 MINOR' },
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">💊 Polypharmacy</span>{' '}
                        <span className="neon-text-cyan">Sandbox</span>
                    </h1>
                    <p className="text-slate-400">Drop two drugs on the crafting table. Discover what happens when they mix.</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Drug Palette */}
                    <div className="scholar-card p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Drug Shelf</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {DRUGS.map((drug) => (
                                <motion.button
                                    key={drug.id}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => addDrug(drug)}
                                    className="p-3 rounded-xl text-left transition-all cursor-pointer"
                                    style={{
                                        background: `${drug.color}15`,
                                        border: `1px solid ${drug.color}40`,
                                    }}
                                >
                                    <div className="text-sm font-semibold text-white">{drug.name}</div>
                                    <div className="text-[10px]" style={{ color: drug.color }}>{drug.class}</div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Crafting Table */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="scholar-card p-6 relative overflow-hidden">
                            {/* Explosion overlay */}
                            <AnimatePresence>
                                {showExplosion && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 1 }}
                                        animate={{ scale: 4, opacity: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 2 }}
                                        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                                    >
                                        <div className="w-40 h-40 rounded-full" style={{
                                            background: 'radial-gradient(circle, rgba(255,51,85,0.8) 0%, rgba(255,51,85,0) 70%)',
                                        }} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">⚗️ Crafting Table</h3>

                            <div className="flex items-center justify-center gap-6 mb-6">
                                {/* Slot 1 */}
                                <div
                                    className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center transition-all"
                                    style={{
                                        background: craftingSlots[0] ? `${craftingSlots[0].color}15` : 'rgba(255,255,255,0.03)',
                                        border: craftingSlots[0] ? `2px solid ${craftingSlots[0].color}60` : '2px dashed rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {craftingSlots[0] ? (
                                        <>
                                            <span className="text-3xl mb-1">{craftingSlots[0].icon}</span>
                                            <span className="text-sm font-bold text-white">{craftingSlots[0].name}</span>
                                            <span className="text-[10px]" style={{ color: craftingSlots[0].color }}>{craftingSlots[0].class}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-500 text-sm">Drop Drug A</span>
                                    )}
                                </div>

                                {/* Mix icon */}
                                <div className="text-3xl neon-text-cyan">⚡</div>

                                {/* Slot 2 */}
                                <div
                                    className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center transition-all"
                                    style={{
                                        background: craftingSlots[1] ? `${craftingSlots[1].color}15` : 'rgba(255,255,255,0.03)',
                                        border: craftingSlots[1] ? `2px solid ${craftingSlots[1].color}60` : '2px dashed rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {craftingSlots[1] ? (
                                        <>
                                            <span className="text-3xl mb-1">{craftingSlots[1].icon}</span>
                                            <span className="text-sm font-bold text-white">{craftingSlots[1].name}</span>
                                            <span className="text-[10px]" style={{ color: craftingSlots[1].color }}>{craftingSlots[1].class}</span>
                                        </>
                                    ) : (
                                        <span className="text-slate-500 text-sm">Drop Drug B</span>
                                    )}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-center gap-3">
                                <button onClick={checkInteraction} disabled={!craftingSlots[0] || !craftingSlots[1]}
                                    className="scholar-btn-danger px-6 py-2 rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-default">
                                    ⚡ Mix & Check
                                </button>
                                <button onClick={clearSlots} className="scholar-btn px-6 py-2 rounded-xl cursor-pointer">
                                    🗑️ Clear
                                </button>
                            </div>
                        </div>

                        {/* Interaction Result */}
                        <AnimatePresence>
                            {foundInteraction && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                >
                                    <div
                                        className="scholar-card p-6"
                                        style={{
                                            background: severityStyles[foundInteraction.severity].bg,
                                            borderColor: severityStyles[foundInteraction.severity].border,
                                        }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <span style={{ color: severityStyles[foundInteraction.severity].text }} className="text-lg font-bold">
                                                {severityStyles[foundInteraction.severity].label}
                                            </span>
                                            <span className="text-slate-400 text-sm">Drug-Drug Interaction</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Mechanism</div>
                                                <p className="text-sm text-slate-300">{foundInteraction.mechanism}</p>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Clinical Effect</div>
                                                <p className="text-sm text-slate-300">{foundInteraction.clinicalEffect}</p>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommendation</div>
                                                <p className="text-sm text-slate-300">{foundInteraction.recommendation}</p>
                                            </div>
                                            {foundInteraction.enzymes.length > 0 && (
                                                <div className="flex gap-2">
                                                    {foundInteraction.enzymes.map((e) => (
                                                        <span key={e} className="px-2 py-1 rounded text-[10px] font-mono" style={{
                                                            background: 'rgba(168, 85, 247, 0.15)',
                                                            border: '1px solid rgba(168, 85, 247, 0.3)',
                                                            color: '#a855f7',
                                                        }}>
                                                            {e}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="p-4 rounded-xl" style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
                                                <div className="text-xs font-bold neon-text-cyan mb-1">🎓 Teaching Point</div>
                                                <p className="text-sm text-slate-300">{foundInteraction.teachingPoint}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* No interaction */}
                        {craftingSlots[0] && craftingSlots[1] && !foundInteraction && (
                            <div className="scholar-card p-6 text-center">
                                <span className="text-3xl mb-2 block">✅</span>
                                <p className="text-sm text-slate-400">No significant interaction found between these drugs.</p>
                                <p className="text-xs text-slate-500 mt-1">Try other combinations to discover dangerous pairs!</p>
                            </div>
                        )}

                        {/* Discovery Log */}
                        {interactionLog.length > 0 && (
                            <div className="scholar-card p-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                                    🔬 Discovered Interactions ({interactionLog.length})
                                </h3>
                                <div className="space-y-2">
                                    {interactionLog.map((log, i) => {
                                        const d1 = DRUGS.find((d) => d.id === log.drug1)!;
                                        const d2 = DRUGS.find((d) => d.id === log.drug2)!;
                                        return (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <div className="text-sm text-white">
                                                    {d1.name} + {d2.name}
                                                </div>
                                                <span style={{ color: severityStyles[log.severity].text }} className="text-xs font-bold">
                                                    {log.severity.toUpperCase()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
