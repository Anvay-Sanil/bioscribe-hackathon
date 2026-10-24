'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useGamificationStore } from '@/stores/GamificationStore';

// ─── Patient Scenarios ───────────────────────────────────────────────
interface PatientScenario {
    id: string;
    condition: string;
    presentation: string;
    vitals: { hr: number; bp: string; spo2: number; rr: number; temp: number };
    currentMeds: string[];
    question: string;
    options: { drug: string; correct: boolean; explanation: string }[];
    criticalInfo: string;
    teachingPoint: string;
}

const SCENARIOS: PatientScenario[] = [
    {
        id: 'afib-warfarin',
        condition: 'Atrial Fibrillation with Hemorrhage',
        presentation: '72-year-old male on Warfarin presents with severe GI bleeding. INR is 8.2.',
        vitals: { hr: 118, bp: '88/52', spo2: 94, rr: 24, temp: 36.8 },
        currentMeds: ['Warfarin 5mg', 'Metoprolol 50mg', 'Lisinopril 10mg'],
        question: 'Which is the BEST immediate reversal agent?',
        options: [
            { drug: 'Vitamin K (IV)', correct: false, explanation: 'Vitamin K takes 6-24 hours for full effect. Too slow for acute hemorrhage with hemodynamic instability.' },
            { drug: 'Protamine Sulfate', correct: false, explanation: 'Protamine reverses heparin, NOT warfarin. Wrong anticoagulant reversal agent.' },
            { drug: '4-Factor PCC (Kcentra)', correct: true, explanation: 'Correct! 4-Factor PCC provides immediate INR reversal (within 15-30 min) for life-threatening warfarin-related bleeding.' },
            { drug: 'Tranexamic Acid', correct: false, explanation: 'TXA is an antifibrinolytic — it prevents clot breakdown but does not reverse warfarin anticoagulation.' },
        ],
        criticalInfo: 'INR > 5 with active bleeding = Life-threatening emergency',
        teachingPoint: '💡 Key Concept: 4-Factor PCC (Factors II, VII, IX, X) is the gold standard for urgent warfarin reversal. Always give WITH Vitamin K for sustained effect.',
    },
    {
        id: 'anaphylaxis',
        condition: 'Anaphylactic Shock',
        presentation: '28-year-old female develops difficulty breathing, hives, and tongue swelling 5 minutes after penicillin injection.',
        vitals: { hr: 142, bp: '72/40', spo2: 88, rr: 32, temp: 37.2 },
        currentMeds: ['Amoxicillin (just given)'],
        question: 'What is the FIRST-LINE drug to administer?',
        options: [
            { drug: 'Epinephrine 0.3mg IM', correct: true, explanation: 'Correct! Epinephrine IM (anterolateral thigh) is ALWAYS first-line for anaphylaxis. It reverses bronchospasm, vasoconstriction, and reduces mediator release.' },
            { drug: 'Diphenhydramine 50mg IV', correct: false, explanation: 'Antihistamines are second-line adjuncts. They do NOT treat the cardiovascular collapse or bronchospasm that kill patients.' },
            { drug: 'Hydrocortisone 200mg IV', correct: false, explanation: 'Steroids take 4-6 hours to work. They prevent biphasic reactions but won\'t save the patient right now.' },
            { drug: 'Albuterol Nebulizer', correct: false, explanation: 'Albuterol helps bronchospasm but does NOT address the systemic vasodilation and shock. Epinephrine must come first.' },
        ],
        criticalInfo: 'Anaphylaxis = Epinephrine FIRST, no exceptions',
        teachingPoint: '💡 Key Concept: The #1 mistake in anaphylaxis is DELAYING epinephrine. Every minute without epi increases mortality. IM injection works in 5-15 minutes.',
    },
    {
        id: 'opioid-overdose',
        condition: 'Opioid Overdose',
        presentation: '19-year-old male found unresponsive at a party. Pinpoint pupils. Respiratory rate of 4.',
        vitals: { hr: 52, bp: '90/60', spo2: 74, rr: 4, temp: 35.6 },
        currentMeds: ['Unknown substances'],
        question: 'What is the IMMEDIATE reversal agent?',
        options: [
            { drug: 'Flumazenil', correct: false, explanation: 'Flumazenil reverses benzodiazepines, NOT opioids. Using it in mixed overdose can precipitate seizures.' },
            { drug: 'Naloxone (Narcan) 0.4mg IV', correct: true, explanation: 'Correct! Naloxone is a competitive opioid receptor antagonist. It reverses respiratory depression within 1-2 minutes. May need repeat doses.' },
            { drug: 'Activated Charcoal', correct: false, explanation: 'Charcoal only works for oral ingestion within 1-2 hours. This patient is unresponsive — aspiration risk is extremely high.' },
            { drug: 'N-Acetylcysteine', correct: false, explanation: 'NAC is the antidote for acetaminophen (paracetamol) toxicity, not opioid overdose.' },
        ],
        criticalInfo: 'Pinpoint pupils + RR < 8 = Opioid overdose until proven otherwise',
        teachingPoint: '💡 Key Concept: Naloxone has a shorter half-life than most opioids. The patient may "re-narcotize" — always observe for 4+ hours after reversal.',
    },
    {
        id: 'digoxin-toxicity',
        condition: 'Digoxin Toxicity',
        presentation: '81-year-old woman on digoxin for heart failure presents with nausea, yellow-halo vision, and irregular pulse. Digoxin level: 4.2 ng/mL.',
        vitals: { hr: 42, bp: '100/65', spo2: 95, rr: 18, temp: 36.9 },
        currentMeds: ['Digoxin 0.25mg', 'Furosemide 40mg', 'Potassium 20mEq'],
        question: 'What is the specific antidote?',
        options: [
            { drug: 'Atropine', correct: false, explanation: 'Atropine can temporarily increase HR in digoxin bradycardia, but it does NOT address the underlying toxicity mechanism.' },
            { drug: 'Digoxin Immune Fab (DigiFab)', correct: true, explanation: 'Correct! Digoxin Immune Fab binds free digoxin, preventing it from binding to Na+/K+ ATPase. It\'s the definitive treatment for life-threatening digoxin toxicity.' },
            { drug: 'Calcium Gluconate', correct: false, explanation: 'DANGER! Calcium is relatively CONTRAINDICATED in digoxin toxicity — it can worsen cardiac arrhythmias ("stone heart").' },
            { drug: 'Magnesium Sulfate', correct: false, explanation: 'Magnesium can help with some digoxin arrhythmias but is NOT the definitive antidote. DigiFab is required.' },
        ],
        criticalInfo: 'Digoxin level > 2.0 ng/mL + symptoms = Toxicity',
        teachingPoint: '💡 Key Concept: The classic triad of digoxin toxicity: GI symptoms (nausea/vomiting), visual changes (yellow halos), and cardiac arrhythmias (bradycardia, heart block).',
    },
    {
        id: 'status-epilepticus',
        condition: 'Status Epilepticus',
        presentation: '35-year-old male with epilepsy. Continuous seizure for 8 minutes, not responding to commands.',
        vitals: { hr: 130, bp: '160/95', spo2: 89, rr: 28, temp: 38.5 },
        currentMeds: ['Levetiracetam 500mg BID (non-compliant)'],
        question: 'What is the FIRST-LINE acute treatment?',
        options: [
            { drug: 'Phenytoin IV Loading', correct: false, explanation: 'Phenytoin is a second-line agent given AFTER benzodiazepines fail. It also has a black-box risk of "Purple Glove Syndrome" with IV extravasation.' },
            { drug: 'Lorazepam 4mg IV', correct: true, explanation: 'Correct! IV Lorazepam (or IM Midazolam if no IV access) is first-line for status epilepticus. It enhances GABA-A receptor activity to stop seizures.' },
            { drug: 'Propofol Infusion', correct: false, explanation: 'Propofol is reserved for refractory status (stage 3) — after benzodiazepines AND second-line agents have failed. It requires intubation.' },
            { drug: 'Levetiracetam IV Bolus', correct: false, explanation: 'Levetiracetam is used as a second-line agent or maintenance therapy. It is NOT fast enough for acute seizure termination.' },
        ],
        criticalInfo: 'Seizure > 5 minutes = Status epilepticus = Medical emergency',
        teachingPoint: '💡 Key Concept: Status epilepticus protocol: Step 1: Benzodiazepine (Lorazepam/Midazolam) → Step 2: Fosphenytoin/Valproate/Levetiracetam → Step 3: Intubation + Propofol/Midazolam drip.',
    },
];

// ─── Component ───────────────────────────────────────────────────────
export default function EmergencyRoom() {
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'answered' | 'gameover'>('idle');
    const [currentScenario, setCurrentScenario] = useState<PatientScenario | null>(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    const { awardXP, unlockBadge, setERBestTime, addCompletedChallenge } = useGamificationStore();

    // ─── Timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setGameState('gameover');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [gameState, timeLeft]);

    // ─── Start Game ──────────────────────────────────────────────────
    const startGame = useCallback(() => {
        const shuffled = [...SCENARIOS].sort(() => Math.random() - 0.5);
        setCurrentScenario(shuffled[0]);
        setScenarioIndex(0);
        setTimeLeft(60);
        setScore(0);
        setSelectedDrug(null);
        setIsCorrect(null);
        setGameState('playing');
        setShowConfetti(false);
        startTimeRef.current = Date.now();
    }, []);

    // ─── Select Answer ──────────────────────────────────────────────
    const selectAnswer = useCallback(
        (drug: string) => {
            if (gameState !== 'playing' || selectedDrug) return;

            setSelectedDrug(drug);
            if (timerRef.current) clearInterval(timerRef.current);

            const option = currentScenario!.options.find((o) => o.drug === drug);
            const correct = option?.correct ?? false;
            setIsCorrect(correct);
            setGameState('answered');

            if (correct) {
                setScore((prev) => prev + 1);
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                awardXP(25 + Math.max(0, 60 - elapsed), 'Emergency Room: Correct diagnosis', 'Emergency Room');

                if (elapsed < 30) {
                    unlockBadge('speed_demon');
                }
            } else {
                awardXP(5, 'Emergency Room: Learning from mistakes', 'Emergency Room');
            }
        },
        [gameState, selectedDrug, currentScenario, awardXP, unlockBadge]
    );

    // ─── Next Scenario ──────────────────────────────────────────────
    const nextScenario = useCallback(() => {
        const shuffled = [...SCENARIOS].sort(() => Math.random() - 0.5);
        const nextIdx = scenarioIndex + 1;

        if (nextIdx >= SCENARIOS.length) {
            // Game complete
            const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setERBestTime(totalTime);
            addCompletedChallenge('emergency-room-full');
            setShowConfetti(true);
            setGameState('gameover');
            awardXP(50, 'Emergency Room: Completed all scenarios', 'Emergency Room');
            return;
        }

        setCurrentScenario(shuffled[nextIdx % shuffled.length]);
        setScenarioIndex(nextIdx);
        setSelectedDrug(null);
        setIsCorrect(null);
        setTimeLeft(60);
        setGameState('playing');
    }, [scenarioIndex, setERBestTime, addCompletedChallenge, awardXP]);

    // ─── Heartbeat SVG ──────────────────────────────────────────────
    const HeartbeatLine = () => (
        <svg width="100%" height="40" className="heartbeat-svg" viewBox="0 0 600 40" preserveAspectRatio="none">
            <polyline
                points="0,20 50,20 60,20 70,5 80,35 90,10 100,30 110,20 150,20 200,20 210,20 220,5 230,35 240,10 250,30 260,20 300,20 350,20 360,20 370,5 380,35 390,10 400,30 410,20 450,20 500,20 510,20 520,5 530,35 540,10 550,30 560,20 600,20"
                fill="none"
                stroke={timeLeft <= 15 ? '#ff3355' : '#00f0ff'}
                strokeWidth="2"
                opacity="0.7"
            />
        </svg>
    );

    // ─── Render: Idle State ─────────────────────────────────────────
    if (gameState === 'idle') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full text-center space-y-8"
                >
                    <div className="text-8xl mb-4">🚨</div>
                    <h1 className="text-4xl md:text-5xl font-bold neon-text-red">EMERGENCY ROOM</h1>
                    <p className="text-slate-400 text-lg">
                        60-second clinical emergencies. Choose the right drug. Save the patient.
                    </p>
                    <div className="scholar-card p-6 text-left space-y-3">
                        <div className="text-sm text-slate-300">⏱️ 60-second countdown per scenario</div>
                        <div className="text-sm text-slate-300">🧠 5 randomized patient emergencies</div>
                        <div className="text-sm text-slate-300">💊 Select the correct drug intervention</div>
                        <div className="text-sm text-slate-300">⚡ Bonus XP for fast answers</div>
                        <div className="text-sm text-slate-300">🏆 Unlock &quot;Speed Demon&quot; badge under 30s</div>
                    </div>
                    <button onClick={startGame} className="scholar-btn-danger text-lg px-10 py-4 rounded-xl w-full font-bold cursor-pointer">
                        🚑 START EMERGENCY
                    </button>
                </motion.div>
            </div>
        );
    }

    // ─── Render: Game Over ──────────────────────────────────────────
    if (gameState === 'gameover' && !currentScenario) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <div className="text-6xl">⏱️</div>
                    <h2 className="text-3xl font-bold neon-text-red">TIME&apos;S UP!</h2>
                    <p className="text-slate-400">You answered {score} / {SCENARIOS.length} correctly.</p>
                    <button onClick={startGame} className="scholar-btn-danger px-8 py-3 rounded-xl cursor-pointer">
                        🔄 Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    if (!currentScenario) return null;

    // ─── Render: Playing / Answered ─────────────────────────────────
    return (
        <div className={`min-h-screen p-4 md:p-6 ${gameState === 'playing' && timeLeft <= 15 ? 'er-pulse-border' : ''}`}>
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Heartbeat + Timer Header */}
                <div className="scholar-card p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🚨</span>
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Emergency Room</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500">
                                Case {scenarioIndex + 1} / {SCENARIOS.length}
                            </span>
                            <motion.div
                                key={timeLeft}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className={`text-3xl font-mono font-bold ${timeLeft <= 10 ? 'neon-text-red' : timeLeft <= 30 ? 'neon-text-gold' : 'neon-text-cyan'
                                    } ${timeLeft <= 10 ? 'countdown-critical' : ''}`}
                            >
                                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                            </motion.div>
                        </div>
                    </div>
                    <HeartbeatLine />
                </div>

                {/* Patient Card */}
                <motion.div
                    key={currentScenario.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="scholar-card p-6"
                >
                    {/* Condition Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Clinical Presentation</div>
                            <h2 className="text-xl md:text-2xl font-bold neon-text-red">{currentScenario.condition}</h2>
                        </div>
                        <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{
                            background: 'rgba(255, 51, 85, 0.2)',
                            border: '1px solid rgba(255, 51, 85, 0.3)',
                            color: '#ff3355'
                        }}>
                            CRITICAL
                        </div>
                    </div>

                    <p className="text-slate-300 mb-6 leading-relaxed">{currentScenario.presentation}</p>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-5 gap-2 mb-6">
                        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 51, 85, 0.1)', border: '1px solid rgba(255, 51, 85, 0.2)' }}>
                            <div className="text-[10px] text-slate-500 uppercase">HR</div>
                            <div className="text-lg font-bold neon-text-red">{currentScenario.vitals.hr}</div>
                            <div className="text-[10px] text-slate-500">bpm</div>
                        </div>
                        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <div className="text-[10px] text-slate-500 uppercase">BP</div>
                            <div className="text-lg font-bold neon-text-cyan">{currentScenario.vitals.bp}</div>
                            <div className="text-[10px] text-slate-500">mmHg</div>
                        </div>
                        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                            <div className="text-[10px] text-slate-500 uppercase">SpO2</div>
                            <div className="text-lg font-bold neon-text-green">{currentScenario.vitals.spo2}%</div>
                            <div className="text-[10px] text-slate-500">%</div>
                        </div>
                        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                            <div className="text-[10px] text-slate-500 uppercase">RR</div>
                            <div className="text-lg font-bold neon-text-gold">{currentScenario.vitals.rr}</div>
                            <div className="text-[10px] text-slate-500">/min</div>
                        </div>
                        <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                            <div className="text-[10px] text-slate-500 uppercase">Temp</div>
                            <div className="text-lg font-bold" style={{ color: '#a855f7' }}>{currentScenario.vitals.temp}°</div>
                            <div className="text-[10px] text-slate-500">°C</div>
                        </div>
                    </div>

                    {/* Current Meds */}
                    <div className="mb-6">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Current Medications</div>
                        <div className="flex flex-wrap gap-2">
                            {currentScenario.currentMeds.map((med) => (
                                <span key={med} className="px-3 py-1 rounded-lg text-xs font-medium" style={{
                                    background: 'rgba(255, 215, 0, 0.1)',
                                    border: '1px solid rgba(255, 215, 0, 0.2)',
                                    color: '#ffd700',
                                }}>
                                    💊 {med}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Critical Info */}
                    <div className="p-4 rounded-xl mb-6" style={{
                        background: 'rgba(255, 51, 85, 0.08)',
                        border: '1px solid rgba(255, 51, 85, 0.2)',
                    }}>
                        <div className="text-xs font-bold neon-text-red uppercase tracking-wider mb-1">⚠️ Critical Information</div>
                        <div className="text-sm text-slate-300">{currentScenario.criticalInfo}</div>
                    </div>
                </motion.div>

                {/* Question + Drug Options */}
                <div className="scholar-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">🧠 {currentScenario.question}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentScenario.options.map((option) => {
                            let btnStyle: React.CSSProperties = {
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                            };

                            if (selectedDrug) {
                                if (option.correct) {
                                    btnStyle = {
                                        background: 'rgba(0, 255, 136, 0.15)',
                                        border: '2px solid rgba(0, 255, 136, 0.5)',
                                        boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)',
                                    };
                                } else if (selectedDrug === option.drug && !option.correct) {
                                    btnStyle = {
                                        background: 'rgba(255, 51, 85, 0.15)',
                                        border: '2px solid rgba(255, 51, 85, 0.5)',
                                        boxShadow: '0 0 20px rgba(255, 51, 85, 0.2)',
                                    };
                                } else {
                                    btnStyle = {
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '2px solid rgba(255, 255, 255, 0.05)',
                                        opacity: 0.5,
                                    };
                                }
                            }

                            return (
                                <motion.button
                                    key={option.drug}
                                    onClick={() => selectAnswer(option.drug)}
                                    disabled={!!selectedDrug}
                                    whileHover={!selectedDrug ? { scale: 1.02, y: -2 } : {}}
                                    whileTap={!selectedDrug ? { scale: 0.98 } : {}}
                                    className="p-4 rounded-xl text-left transition-all cursor-pointer disabled:cursor-default"
                                    style={btnStyle}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">
                                            {selectedDrug
                                                ? option.correct
                                                    ? '✅'
                                                    : selectedDrug === option.drug
                                                        ? '❌'
                                                        : '💊'
                                                : '💊'}
                                        </span>
                                        <span className="text-sm font-semibold text-white">{option.drug}</span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Explanation (after answer) */}
                <AnimatePresence>
                    {gameState === 'answered' && selectedDrug && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="space-y-4"
                        >
                            {/* Result Banner */}
                            <div
                                className="scholar-card p-6"
                                style={{
                                    borderColor: isCorrect ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 51, 85, 0.3)',
                                    background: isCorrect ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 51, 85, 0.05)',
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-4xl">{isCorrect ? '🎉' : '📚'}</span>
                                    <div>
                                        <h3 className={`text-xl font-bold ${isCorrect ? 'neon-text-green' : 'neon-text-red'}`}>
                                            {isCorrect ? 'CORRECT! Patient Stabilized!' : 'Incorrect — Learning Moment'}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {isCorrect ? `+${25 + Math.max(0, 60 - (60 - timeLeft))} XP earned` : '+5 XP for learning'}
                                        </p>
                                    </div>
                                </div>

                                {/* Per-option explanations */}
                                <div className="space-y-3">
                                    {currentScenario.options.map((opt) => (
                                        <div
                                            key={opt.drug}
                                            className="p-3 rounded-lg text-sm"
                                            style={{
                                                background: opt.correct
                                                    ? 'rgba(0, 255, 136, 0.08)'
                                                    : 'rgba(255, 255, 255, 0.02)',
                                                borderLeft: `3px solid ${opt.correct ? '#00ff88' : 'rgba(255,255,255,0.1)'}`,
                                            }}
                                        >
                                            <span className="font-semibold text-white">
                                                {opt.correct ? '✅' : '❌'} {opt.drug}:
                                            </span>{' '}
                                            <span className="text-slate-300">{opt.explanation}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Teaching Point */}
                            <div
                                className="scholar-card p-5"
                                style={{ background: 'rgba(0, 240, 255, 0.05)', borderColor: 'rgba(0, 240, 255, 0.2)' }}
                            >
                                <div className="text-xs font-bold neon-text-cyan uppercase tracking-wider mb-2">
                                    🎓 Teaching Point
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">{currentScenario.teachingPoint}</p>
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={nextScenario}
                                className="scholar-btn w-full py-4 text-lg font-bold rounded-xl cursor-pointer"
                            >
                                {scenarioIndex + 1 >= SCENARIOS.length ? '🏆 View Results' : '➡️ Next Emergency'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Game Over (completed all) */}
                <AnimatePresence>
                    {gameState === 'gameover' && showConfetti && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="scholar-card p-8 text-center"
                        >
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-3xl font-bold neon-text-gold mb-2">ALL EMERGENCIES HANDLED!</h2>
                            <p className="text-slate-400 mb-6">
                                You correctly treated {score} / {SCENARIOS.length} patients.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={startGame} className="scholar-btn px-8 py-3 rounded-xl cursor-pointer">
                                    🔄 Play Again
                                </button>
                                <a href="/scholar" className="scholar-btn-success px-8 py-3 rounded-xl inline-block">
                                    🏠 Dashboard
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
