'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import {
    generateScenario,
    getDrugOptions,
    getSocraticResponse,
    getHouseIntro,
    DIFFICULTY_CONFIG,
    type Difficulty,
    type GeneratedScenario,
    type SocraticResponse,
} from '@/lib/SocraticEngine';
import { useGamificationStore } from '@/stores/GamificationStore';

interface ConversationEntry {
    type: 'house' | 'student' | 'system';
    text: string;
    isCorrect?: boolean;
}

export default function DrHouseMode() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [scenario, setScenario] = useState<GeneratedScenario | null>(null);
    const [conversation, setConversation] = useState<ConversationEntry[]>([]);
    const [drugOptions, setDrugOptions] = useState<{ label: string; isCorrect: boolean }[]>([]);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [caseComplete, setCaseComplete] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [casesCompleted, setCasesCompleted] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const conversationEndRef = useRef<HTMLDivElement>(null);

    const { awardXP, unlockBadge, incrementHouseCases } = useGamificationStore();

    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // ─── Start a Case ────────────────────────────────────────────────
    const startCase = useCallback((diff: Difficulty) => {
        setDifficulty(diff);
        const newScenario = generateScenario(diff);
        setScenario(newScenario);
        setDrugOptions(getDrugOptions(newScenario));
        setHasAnswered(false);
        setCaseComplete(false);
        setShowWhiteboard(false);
        setShowConfetti(false);

        const intro = getHouseIntro();
        setConversation([
            { type: 'house', text: `"${intro}"` },
            { type: 'system', text: `📋 Case #${casesCompleted + 1} — ${DIFFICULTY_CONFIG[diff].label} Level` },
            { type: 'house', text: `${newScenario.patient.age}-year-old ${newScenario.patient.sex.toLowerCase()} ${newScenario.patient.occupation.toLowerCase()}. ${newScenario.patient.presentingComplaint}. What do you do?` },
        ]);
    }, [casesCompleted]);

    // ─── Submit Answer ───────────────────────────────────────────────
    const submitAnswer = useCallback((optionLabel: string, isCorrect: boolean) => {
        if (!scenario || hasAnswered) return;
        setHasAnswered(true);
        setIsThinking(true);

        // Add student's answer
        setConversation(prev => [...prev, { type: 'student', text: `I'd give: ${optionLabel}` }]);

        // Simulate House "thinking"
        setTimeout(() => {
            const response: SocraticResponse = getSocraticResponse(isCorrect, scenario);
            const newEntries: ConversationEntry[] = [
                { type: 'house', text: response.text, isCorrect },
            ];
            if (response.followUp) {
                newEntries.push({ type: 'house', text: response.followUp });
            }
            if (response.houseQuote) {
                newEntries.push({ type: 'system', text: response.houseQuote });
            }

            setConversation(prev => [...prev, ...newEntries]);
            setIsThinking(false);

            if (isCorrect) {
                setCaseComplete(true);
                setShowConfetti(true);
                const xp = difficulty === 'house' ? 50 : difficulty === 'attending' ? 35 : difficulty === 'resident' ? 25 : 15;
                awardXP(xp, `Dr. House: ${scenario.diagnosis}`, 'Dr. House');
                const newCount = casesCompleted + 1;
                setCasesCompleted(newCount);
                incrementHouseCases();
                if (newCount >= 5) unlockBadge('socratic_thinker');
            }
        }, 1500 + Math.random() * 1000);
    }, [scenario, hasAnswered, difficulty, casesCompleted, awardXP, unlockBadge, incrementHouseCases]);

    // ─── Try Again (wrong answer) ────────────────────────────────────
    const tryAgain = useCallback(() => {
        setHasAnswered(false);
    }, []);

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Difficulty Selection
    // ═══════════════════════════════════════════════════════════════════
    if (!difficulty || !scenario) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full text-center space-y-8">
                    <div className="text-7xl mb-2">🏥</div>
                    <h1 className="text-4xl md:text-5xl font-bold">
                        <span className="text-white">Dr.</span>{' '}
                        <span className="neon-text-cyan">House</span>{' '}
                        <span className="text-slate-400 text-2xl">Mode</span>
                    </h1>
                    <p className="text-slate-400 text-lg italic">&quot;Everybody lies. But the symptoms don&apos;t.&quot;</p>
                    <p className="text-slate-500 text-sm">Infinite AI-generated patient cases. Socratic questioning — you learn by being challenged, not hand-held.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([diff, config]) => (
                            <motion.button
                                key={diff}
                                whileHover={{ scale: 1.03, y: -3 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => startCase(diff)}
                                className="p-6 rounded-2xl text-left cursor-pointer transition-all"
                                style={{
                                    background: `rgba(${diff === 'house' ? '239,68,68' : diff === 'attending' ? '245,158,11' : diff === 'resident' ? '139,92,246' : '59,130,246'}, 0.08)`,
                                    border: `2px solid ${config.color}33`,
                                }}
                            >
                                <div className="text-3xl mb-2">{config.icon}</div>
                                <div className="text-lg font-bold" style={{ color: config.color }}>{config.label}</div>
                                <div className="text-xs text-slate-400 mt-1">{config.description}</div>
                            </motion.button>
                        ))}
                    </div>

                    {casesCompleted > 0 && (
                        <div className="text-sm text-slate-500">Cases solved this session: <span className="neon-text-green font-bold">{casesCompleted}</span></div>
                    )}
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Active Case
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen p-4 md:p-6">
            {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

            <div className="max-w-5xl mx-auto space-y-4">
                {/* Header */}
                <div className="scholar-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏥</span>
                        <div>
                            <span className="text-sm font-bold text-white">Dr. House — {DIFFICULTY_CONFIG[difficulty].label} Case</span>
                            <div className="text-xs text-slate-500">Case #{casesCompleted + (caseComplete ? 0 : 1)}</div>
                        </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: `${DIFFICULTY_CONFIG[difficulty].color}15`, border: `1px solid ${DIFFICULTY_CONFIG[difficulty].color}33`, color: DIFFICULTY_CONFIG[difficulty].color }}>
                        {DIFFICULTY_CONFIG[difficulty].icon} {DIFFICULTY_CONFIG[difficulty].label}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Patient Chart (Left) */}
                    <div className="space-y-4">
                        <div className="scholar-card p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">📋 Patient Chart</div>
                            <div className="space-y-2 text-sm">
                                <div className="text-slate-300"><span className="text-slate-500">Age/Sex:</span> {scenario.patient.age}{scenario.patient.sex === 'Male' ? 'M' : 'F'}</div>
                                <div className="text-slate-300"><span className="text-slate-500">Occupation:</span> {scenario.patient.occupation}</div>
                            </div>
                        </div>

                        <div className="scholar-card p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">💊 Medications</div>
                            <div className="space-y-1">
                                {scenario.medications.map(med => (
                                    <div key={med} className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', color: '#ffd700' }}>
                                        {med}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="scholar-card p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">🔬 Labs</div>
                            <div className="space-y-1">
                                {scenario.labResults.map(lab => (
                                    <div key={lab.label} className="flex justify-between text-xs py-1 border-b border-white/5">
                                        <span className="text-slate-400">{lab.label}</span>
                                        <span className={lab.abnormal ? 'neon-text-red font-bold' : 'text-slate-300'}>{lab.value} {lab.abnormal && '⚠️'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="scholar-card p-4">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">📊 Vitals</div>
                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="p-2 rounded" style={{ background: 'rgba(0,240,255,0.06)' }}>
                                    <div className="text-[10px] text-slate-500">HR</div>
                                    <div className="text-sm font-bold neon-text-cyan">{scenario.vitals.hr}</div>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'rgba(0,255,136,0.06)' }}>
                                    <div className="text-[10px] text-slate-500">BP</div>
                                    <div className="text-sm font-bold neon-text-green">{scenario.vitals.bp}</div>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'rgba(255,215,0,0.06)' }}>
                                    <div className="text-[10px] text-slate-500">SpO2</div>
                                    <div className="text-sm font-bold neon-text-gold">{scenario.vitals.spo2}%</div>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'rgba(168,85,247,0.06)' }}>
                                    <div className="text-[10px] text-slate-500">Temp</div>
                                    <div className="text-sm font-bold text-purple-400">{scenario.vitals.temp}°C</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conversation (Center) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="scholar-card p-4 min-h-[400px] flex flex-col">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">🗣️ Consultation</div>
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[500px]">
                                <AnimatePresence>
                                    {conversation.map((entry, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`p-3 rounded-xl text-sm ${entry.type === 'house' ? 'ml-0 mr-8' : entry.type === 'student' ? 'ml-8 mr-0' : 'mx-4'}`}
                                            style={{
                                                background: entry.type === 'house'
                                                    ? 'rgba(0,240,255,0.06)'
                                                    : entry.type === 'student'
                                                        ? 'rgba(139,92,246,0.08)'
                                                        : 'rgba(255,215,0,0.05)',
                                                borderLeft: entry.type === 'house'
                                                    ? '3px solid rgba(0,240,255,0.4)'
                                                    : entry.type === 'student'
                                                        ? '3px solid rgba(139,92,246,0.4)'
                                                        : '3px solid rgba(255,215,0,0.3)',
                                            }}
                                        >
                                            {entry.type === 'house' && <span className="text-xs font-bold neon-text-cyan">🏥 Dr. House: </span>}
                                            {entry.type === 'student' && <span className="text-xs font-bold text-purple-400">👨‍⚕️ You: </span>}
                                            {entry.type === 'system' && <span className="text-xs font-bold neon-text-gold">📖 </span>}
                                            <span className="text-slate-300">{entry.text}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {isThinking && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl ml-0 mr-8" style={{ background: 'rgba(0,240,255,0.04)', borderLeft: '3px solid rgba(0,240,255,0.2)' }}>
                                        <span className="text-xs neon-text-cyan">🏥 Dr. House is thinking</span>
                                        <span className="animate-pulse"> ...</span>
                                    </motion.div>
                                )}

                                <div ref={conversationEndRef} />
                            </div>

                            {/* Drug Options */}
                            {!caseComplete && !isThinking && (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                                        {hasAnswered ? '❌ Wrong answer — try again?' : '💊 Choose your treatment:'}
                                    </div>
                                    {!hasAnswered && drugOptions.map((opt) => (
                                        <motion.button
                                            key={opt.label}
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => submitAnswer(opt.label, opt.isCorrect)}
                                            className="w-full p-3 rounded-xl text-left text-sm cursor-pointer transition-all"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            <span className="text-slate-300">{opt.label}</span>
                                        </motion.button>
                                    ))}
                                    {hasAnswered && !caseComplete && (
                                        <button onClick={tryAgain} className="scholar-btn w-full py-3 rounded-xl font-bold cursor-pointer">🔄 Try Again</button>
                                    )}
                                </div>
                            )}

                            {/* Case Complete */}
                            {caseComplete && (
                                <div className="space-y-3">
                                    <button onClick={() => setShowWhiteboard(true)} className="scholar-btn-success w-full py-3 rounded-xl font-bold cursor-pointer">
                                        📋 House&apos;s Whiteboard Reveal
                                    </button>
                                    <div className="flex gap-3">
                                        <button onClick={() => startCase(difficulty)} className="scholar-btn flex-1 py-3 rounded-xl font-bold cursor-pointer">🔄 Next Case</button>
                                        <button onClick={() => { setDifficulty(null); setScenario(null); }} className="flex-1 py-3 rounded-xl font-bold cursor-pointer text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            Change Difficulty
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* House's Whiteboard Modal */}
                <AnimatePresence>
                    {showWhiteboard && scenario && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-6"
                            style={{ background: 'rgba(0,0,0,0.7)' }}
                            onClick={() => setShowWhiteboard(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.8, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.8, y: 30 }}
                                className="max-w-lg w-full p-8 rounded-2xl"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: '#0f1923',
                                    border: '2px solid rgba(0,240,255,0.3)',
                                    boxShadow: '0 0 60px rgba(0,240,255,0.1)',
                                }}
                            >
                                <div className="text-center mb-6">
                                    <div className="text-3xl mb-2">📋</div>
                                    <div className="text-xs uppercase tracking-[4px] text-slate-500 mb-2">House&apos;s Whiteboard</div>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <h2 className="text-2xl font-bold neon-text-cyan whitespace-nowrap" style={{ fontFamily: "'Caveat', cursive, sans-serif" }}>
                                            {scenario.diagnosis}
                                        </h2>
                                    </motion.div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase mb-1">Treatment</div>
                                        <div className="neon-text-green font-bold">{scenario.keyDrug}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase mb-1">Mechanism of Action</div>
                                        <div className="text-slate-300">{scenario.keyMechanism}</div>
                                    </div>
                                    {scenario.redHerring && (
                                        <div>
                                            <div className="text-xs text-slate-500 uppercase mb-1">🚩 Red Herring</div>
                                            <div className="text-slate-400 italic">{scenario.redHerring}</div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => setShowWhiteboard(false)} className="mt-6 w-full scholar-btn py-3 rounded-xl font-bold cursor-pointer">Close</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
