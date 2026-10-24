'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useGamificationStore } from '@/stores/GamificationStore';

// ─── Types ───────────────────────────────────────────────────────────
type Role = 'physician' | 'pharmacist' | 'nurse';

interface TeamScenario {
    id: string;
    condition: string;
    presentation: string;
    vitals: { hr: number; bp: string; spo2: number; rr: number; temp: number };
    currentMeds: string[];
    criticalInfo: string;
    // Multi-step resolution
    steps: ScenarioStep[];
}

interface ScenarioStep {
    stepNumber: number;
    prompt: string;
    roleRequired: Role;
    options: { label: string; correct: boolean; explanation: string }[];
    vitalChange?: Partial<TeamScenario['vitals']>;
    urgentMessage?: string;
}

interface ChatMessage {
    role: Role;
    text: string;
    timestamp: number;
    isSystem?: boolean;
}

interface TeamState {
    scenarioId: string;
    currentStep: number;
    vitals: TeamScenario['vitals'];
    chat: ChatMessage[];
    answered: Record<number, string>;
    roles: Record<string, Role>;
    gamePhase: 'lobby' | 'playing' | 'complete';
    score: number;
    startTime: number;
}

// ─── Role Config ─────────────────────────────────────────────────────
const ROLE_CONFIG: Record<Role, { label: string; icon: string; color: string; bg: string; border: string; description: string }> = {
    physician: {
        label: 'Physician',
        icon: '🩺',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)',
        description: 'Sees vitals & symptoms. Orders drugs. Cannot see formulary.',
    },
    pharmacist: {
        label: 'Pharmacist',
        icon: '💊',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgba(16, 185, 129, 0.3)',
        description: 'Sees drug inventory & interactions. Approves orders. Cannot see ECG.',
    },
    nurse: {
        label: 'Nurse',
        icon: '💉',
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.1)',
        border: 'rgba(168, 85, 247, 0.3)',
        description: 'Administers dosage & route. Monitors patient response. Limited vitals.',
    },
};

// ─── Team Scenarios ──────────────────────────────────────────────────
const TEAM_SCENARIOS: TeamScenario[] = [
    {
        id: 'code-blue-mi',
        condition: 'ST-Elevation Myocardial Infarction (STEMI)',
        presentation: '58-year-old male collapses in the cafeteria clutching his chest. Diaphoretic, pale, crushing substernal pain radiating to left arm. Called code blue.',
        vitals: { hr: 110, bp: '85/55', spo2: 91, rr: 28, temp: 37.0 },
        currentMeds: ['Metformin 1000mg BID', 'Atorvastatin 40mg'],
        criticalInfo: '12-Lead ECG: ST elevation in leads II, III, aVF → INFERIOR STEMI',
        steps: [
            {
                stepNumber: 1,
                prompt: 'The patient is hypotensive and in distress. What is the FIRST medication to administer?',
                roleRequired: 'physician',
                options: [
                    { label: 'Aspirin 325mg PO (chewed)', correct: true, explanation: 'Correct! Aspirin immediately inhibits platelet aggregation. CHEWED for faster absorption. This is the #1 priority in STEMI.' },
                    { label: 'Nitroglycerin SL', correct: false, explanation: 'Nitroglycerin is contraindicated in INFERIOR STEMI with hypotension (BP 85/55). It would cause further vasodilation and cardiovascular collapse.' },
                    { label: 'Morphine 4mg IV', correct: false, explanation: 'Morphine increases mortality in STEMI per recent evidence. It also delays clopidogrel absorption. Use only as last resort for refractory pain.' },
                    { label: 'Metoprolol 5mg IV', correct: false, explanation: 'Beta-blockers are contraindicated in acute STEMI with hypotension and signs of heart failure.' },
                ],
                urgentMessage: '🚨 PHYSICIAN: Patient BP dropping! Order a drug NOW!',
            },
            {
                stepNumber: 2,
                prompt: 'Physician ordered Aspirin. Check for drug interactions with Metformin and verify dosing.',
                roleRequired: 'pharmacist',
                options: [
                    { label: 'APPROVED — No significant interaction. Aspirin 325mg safe.', correct: true, explanation: 'Correct! Aspirin + Metformin has minor interaction risk (hypoglycemia monitoring) but is safe in emergency. Standard STEMI dose is 162-325mg.' },
                    { label: 'REJECT — Aspirin interacts with Metformin causing renal failure', correct: false, explanation: 'Incorrect. Aspirin does not cause renal failure with Metformin. This is a life-threatening emergency — do not delay treatment.' },
                    { label: 'MODIFY — Reduce dose to 81mg', correct: false, explanation: 'In acute STEMI, the full 325mg loading dose is required for rapid platelet inhibition. 81mg is a maintenance dose.' },
                    { label: 'APPROVED — But switch to IV Aspirin instead', correct: false, explanation: 'IV Aspirin is not standard in STEMI protocols. PO chewed Aspirin achieves rapid absorption (15 min).' },
                ],
                vitalChange: { hr: 105, spo2: 89 },
                urgentMessage: '💊 PHARMACIST: Drug order incoming! Verify interactions!',
            },
            {
                stepNumber: 3,
                prompt: 'Drug approved. Choose the correct administration route and preparation.',
                roleRequired: 'nurse',
                options: [
                    { label: 'PO — Give tablet, instruct patient to CHEW immediately', correct: true, explanation: 'Correct! Chewing the aspirin tablet dramatically increases absorption speed (buccal + GI). Swallowing whole would delay onset by 30+ minutes.' },
                    { label: 'IV Push — Crush and dissolve in saline', correct: false, explanation: 'Aspirin cannot be given IV push. There is no IV formulation approved for STEMI.' },
                    { label: 'Rectal — Suppository form for unconscious patient', correct: false, explanation: 'The patient is conscious. Rectal aspirin has erratic absorption. Only used if patient cannot swallow.' },
                    { label: 'PO — Give tablet with full glass of water', correct: false, explanation: 'Do NOT give with water for STEMI — the patient must CHEW the tablet for fastest absorption. Water slows things down.' },
                ],
                vitalChange: { hr: 95, bp: '90/60', spo2: 93 },
                urgentMessage: '💉 NURSE: Drug approved! Administer now — patient deteriorating!',
            },
        ],
    },
    {
        id: 'code-blue-anaphylaxis',
        condition: 'Anaphylactic Shock — Code Blue',
        presentation: '22-year-old female student eating lunch. Sudden facial swelling, widespread urticaria, stridor, wheezing. Peers called for help. She collapses.',
        vitals: { hr: 145, bp: '70/40', spo2: 82, rr: 36, temp: 37.1 },
        currentMeds: ['Sertraline 100mg daily'],
        criticalInfo: 'Known peanut allergy. Ate a cookie with hidden peanut butter. Lost consciousness 3 minutes ago.',
        steps: [
            {
                stepNumber: 1,
                prompt: 'Patient in anaphylactic shock. BP critically low, airway compromised. IMMEDIATE treatment?',
                roleRequired: 'physician',
                options: [
                    { label: 'Epinephrine 0.3mg IM (anterolateral thigh)', correct: true, explanation: 'Correct! Epinephrine IM is ALWAYS first-line in anaphylaxis. No exceptions. It reverses bronchospasm, supports BP, and reduces mediator release. Give in the anterolateral thigh — NOT deltoid.' },
                    { label: 'IV Diphenhydramine 50mg', correct: false, explanation: 'Antihistamines do NOT treat anaphylaxis. They are adjuncts AFTER epinephrine. They do not reverse airway obstruction or hypotension.' },
                    { label: 'Albuterol Nebulizer', correct: false, explanation: 'Albuterol treats bronchospasm only. The patient has systemic anaphylaxis with shock — epinephrine must come first.' },
                    { label: 'IV Normal Saline Bolus 1L', correct: false, explanation: 'Volume resuscitation is important but AFTER epinephrine. The catecholamine effect of epi is needed first to restore vascular tone.' },
                ],
                urgentMessage: '🚨 PHYSICIAN: Airway closing! Patient unconscious! ORDER NOW!',
            },
            {
                stepNumber: 2,
                prompt: 'Physician ordered Epinephrine 0.3mg IM. Verify the correct concentration and any interactions with Sertraline.',
                roleRequired: 'pharmacist',
                options: [
                    { label: 'APPROVED — Use 1:1000 (1mg/mL) concentration for IM. Sertraline interaction is minor.', correct: true, explanation: 'Correct! IM epinephrine uses 1:1000 (1mg/mL). The 1:10000 concentration is for IV only. Sertraline may slightly potentiate epi effects but is NOT a contraindication in anaphylaxis.' },
                    { label: 'REJECT — Sertraline + Epinephrine causes serotonin syndrome', correct: false, explanation: 'Wrong! Epinephrine does not cause serotonin syndrome. That requires serotonergic drugs. This patient will DIE without epi — never withhold it.' },
                    { label: 'APPROVED — Use 1:10000 (0.1mg/mL) concentration for IM', correct: false, explanation: 'Critical error! 1:10000 is the IV concentration. Using IV concentration IM would deliver only 1/10th the dose. The patient needs the full 0.3mg from 1:1000.' },
                    { label: 'MODIFY — Give 0.15mg instead due to small body size', correct: false, explanation: 'For anyone over 30kg (adult), the standard dose is 0.3mg. Under-dosing in anaphylaxis is a common fatal error.' },
                ],
                vitalChange: { spo2: 78, hr: 150 },
                urgentMessage: '💊 PHARMACIST: Urgent epi order! Verify concentration! SpO2 dropping!',
            },
            {
                stepNumber: 3,
                prompt: 'Drug verified. Administer Epinephrine 0.3mg IM. Select injection site and technique.',
                roleRequired: 'nurse',
                options: [
                    { label: 'Anterolateral THIGH — mid-outer, 90° angle, through clothing if needed', correct: true, explanation: 'Correct! The anterolateral thigh has the best IM absorption of epinephrine. It CAN be given through clothing in emergencies. 90° angle, aspirate briefly, inject.' },
                    { label: 'Deltoid muscle — standard IM technique', correct: false, explanation: 'The deltoid has slower and less reliable absorption of epinephrine compared to the thigh. In anaphylaxis, the 5-minute difference could be fatal.' },
                    { label: 'Subcutaneous — 45° angle in upper arm', correct: false, explanation: 'Subcutaneous injection has MUCH slower absorption than IM. In shock with peripheral vasoconstriction, SubQ may not absorb at all.' },
                    { label: 'IV Push — inject directly into antecubital vein', correct: false, explanation: 'IV epinephrine at 1:1000 concentration can cause fatal arrhythmias. IV route requires 1:10000 with cardiac monitoring. IM is correct here.' },
                ],
                vitalChange: { hr: 120, bp: '85/55', spo2: 88 },
                urgentMessage: '💉 NURSE: Epi in hand! Inject NOW — patient crashing!',
            },
        ],
    },
    {
        id: 'code-blue-sepsis',
        condition: 'Septic Shock — Code Blue',
        presentation: '67-year-old female post-hip replacement Day 3. Found confused, febrile, tachycardic. Foley catheter in place. Lactate 6.2 mmol/L.',
        vitals: { hr: 128, bp: '78/45', spo2: 90, rr: 30, temp: 39.8 },
        currentMeds: ['Enoxaparin 40mg SubQ daily', 'Acetaminophen PRN', 'Ondansetron PRN'],
        criticalInfo: 'UTI progressing to urosepsis. Lactate > 4 = SEP-3 criteria for SEPTIC SHOCK. Every hour of antibiotic delay increases mortality by 7.6%.',
        steps: [
            {
                stepNumber: 1,
                prompt: 'Septic shock confirmed. SEP-1 bundle requires antibiotics within 1 hour. Which empiric antibiotic?',
                roleRequired: 'physician',
                options: [
                    { label: 'Piperacillin-Tazobactam 4.5g IV + Vancomycin 25mg/kg IV', correct: true, explanation: 'Correct! Broad-spectrum coverage is essential in undifferentiated sepsis. Pip-Tazo covers gram-negatives (E. coli, Klebsiella) + anaerobes. Vancomycin covers MRSA. This combo covers >95% of urosepsis pathogens.' },
                    { label: 'Amoxicillin 500mg PO', correct: false, explanation: 'Oral antibiotics are NEVER appropriate in septic shock. The patient likely has impaired GI absorption from hypoperfusion. IV is mandatory.' },
                    { label: 'Metronidazole 500mg IV alone', correct: false, explanation: 'Metronidazole only covers anaerobes and some parasites. It has NO activity against the gram-negative aerobes that cause urosepsis.' },
                    { label: 'Ciprofloxacin 400mg IV alone', correct: false, explanation: 'Fluoroquinolone monotherapy may miss resistant gram-negatives and MRSA. In septic shock with >40% mortality, you cannot risk narrow coverage.' },
                ],
                urgentMessage: '🚨 PHYSICIAN: Lactate rising! Order antibiotics — every minute counts!',
            },
            {
                stepNumber: 2,
                prompt: 'Physician ordered Pip-Tazo + Vancomycin. Check allergies, dosing, and interaction with Enoxaparin.',
                roleRequired: 'pharmacist',
                options: [
                    { label: 'APPROVED — No allergies documented. Pip-Tazo 4.5g q6h + Vanco 25mg/kg. Monitor Vanco trough. Enoxaparin interaction: minor.', correct: true, explanation: 'Correct! Standard sepsis dosing. Vancomycin requires trough monitoring (target 15-20 mcg/mL for severe infections). Pip-Tazo + Enoxaparin has minor additive bleeding risk — acceptable given sepsis mortality.' },
                    { label: 'REJECT — Pip-Tazo interacts with Enoxaparin causing major bleeding', correct: false, explanation: 'The interaction is minor and well-characterized. In septic shock with 40% mortality, withholding antibiotics for a minor interaction risk is clinically inappropriate.' },
                    { label: 'MODIFY — Reduce Vancomycin to 15mg/kg due to age', correct: false, explanation: 'In septic shock, under-dosing antibiotics is a major cause of treatment failure. The initial loading dose should be 25-30mg/kg regardless of age.' },
                    { label: 'APPROVED — But delay Vancomycin until culture results return', correct: false, explanation: 'In septic shock, you NEVER wait for cultures to start antibiotics. The SEP-1 bundle requires broad-spectrum antibiotics within 1 hour.' },
                ],
                vitalChange: { hr: 132, bp: '75/42', temp: 40.1 },
                urgentMessage: '💊 PHARMACIST: Double abx order incoming! Verify doses stat!',
            },
            {
                stepNumber: 3,
                prompt: 'Antibiotics approved. Set up IV infusion. What is the correct administration protocol?',
                roleRequired: 'nurse',
                options: [
                    { label: 'Start Pip-Tazo over 30 min on one line. Start Vanco over 60-90 min on separate line. Run NS 30mL/kg bolus simultaneously.', correct: true, explanation: 'Correct! Pip-Tazo and Vanco must run on SEPARATE IV lines (they are incompatible). Vanco requires slow infusion (60-90 min) to prevent Red Man syndrome. The 30mL/kg NS bolus is part of the SEP-1 bundle.' },
                    { label: 'Mix Pip-Tazo and Vanco in same bag for faster delivery', correct: false, explanation: 'NEVER mix Pip-Tazo and Vancomycin — they are physically incompatible and will precipitate. This could cause catheter occlusion and drug inactivation.' },
                    { label: 'Push both antibiotics IV rapid bolus for fastest effect', correct: false, explanation: 'IV push Vancomycin causes Red Man Syndrome (histamine release → flushing, hypotension, rash). It MUST be infused over 60-90 minutes minimum.' },
                    { label: 'Administer Pip-Tazo first, then Vanco 4 hours later to reduce toxicity', correct: false, explanation: 'In septic shock, BOTH antibiotics should start simultaneously (on separate lines). A 4-hour delay in Vancomycin could miss MRSA coverage during the critical window.' },
                ],
                vitalChange: { hr: 115, bp: '88/52', spo2: 93 },
                urgentMessage: '💉 NURSE: Two antibiotics + fluids to hang! Use separate lines! Go go go!',
            },
        ],
    },
];

// ─── BroadcastChannel Name ───────────────────────────────────────────
const CHANNEL_NAME = 'bioscribe-code-blue';

// ─── Component ───────────────────────────────────────────────────────
export default function TeamCodeBlue() {
    const [myRole, setMyRole] = useState<Role | null>(null);
    const [teamState, setTeamState] = useState<TeamState | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [shakeEffect, setShakeEffect] = useState(false);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const { awardXP, unlockBadge, incrementCodeBlue } = useGamificationStore();

    // ─── Initialize BroadcastChannel ─────────────────────────────────
    useEffect(() => {
        channelRef.current = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current.onmessage = (event) => {
            const data = event.data;
            if (data.type === 'STATE_UPDATE') {
                setTeamState(data.state);
            } else if (data.type === 'SHAKE') {
                setShakeEffect(true);
                setTimeout(() => setShakeEffect(false), 600);
            }
        };
        return () => channelRef.current?.close();
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [teamState?.chat]);

    // Shake effect when vitals are critical
    useEffect(() => {
        if (teamState && teamState.gamePhase === 'playing') {
            const v = teamState.vitals;
            if (v.hr < 50 || v.hr > 140 || v.spo2 < 85) {
                setShakeEffect(true);
                setTimeout(() => setShakeEffect(false), 600);
            }
        }
    }, [teamState?.vitals, teamState?.gamePhase]);

    const broadcast = useCallback((state: TeamState) => {
        setTeamState(state);
        channelRef.current?.postMessage({ type: 'STATE_UPDATE', state });
    }, []);

    const broadcastShake = useCallback(() => {
        channelRef.current?.postMessage({ type: 'SHAKE' });
        setShakeEffect(true);
        setTimeout(() => setShakeEffect(false), 600);
    }, []);

    // ─── Start Game ──────────────────────────────────────────────────
    const startGame = useCallback(() => {
        if (!myRole) return;
        const scenario = TEAM_SCENARIOS[Math.floor(Math.random() * TEAM_SCENARIOS.length)];
        const newState: TeamState = {
            scenarioId: scenario.id,
            currentStep: 0,
            vitals: { ...scenario.vitals },
            chat: [{ role: myRole, text: `${ROLE_CONFIG[myRole].icon} ${ROLE_CONFIG[myRole].label} has joined the Code Blue team.`, timestamp: Date.now(), isSystem: true }],
            answered: {},
            roles: { [myRole]: myRole },
            gamePhase: 'playing',
            score: 0,
            startTime: Date.now(),
        };
        broadcast(newState);
    }, [myRole, broadcast]);

    // ─── Answer Step ─────────────────────────────────────────────────
    const answerStep = useCallback((optionLabel: string, correct: boolean) => {
        if (!teamState || !myRole) return;
        const scenario = TEAM_SCENARIOS.find(s => s.id === teamState.scenarioId);
        if (!scenario) return;

        const step = scenario.steps[teamState.currentStep];
        const nextStep = teamState.currentStep + 1;
        const isLastStep = nextStep >= scenario.steps.length;

        const newVitals = step.vitalChange
            ? { ...teamState.vitals, ...step.vitalChange }
            : teamState.vitals;

        const systemMsg: ChatMessage = {
            role: myRole,
            text: correct
                ? `✅ ${ROLE_CONFIG[myRole].label} chose correctly: "${optionLabel}"`
                : `❌ ${ROLE_CONFIG[myRole].label} chose: "${optionLabel}" — Review the teaching point!`,
            timestamp: Date.now(),
            isSystem: true,
        };

        const newScore = teamState.score + (correct ? 1 : 0);

        if (isLastStep) {
            const finalState: TeamState = {
                ...teamState,
                currentStep: nextStep,
                vitals: newVitals,
                chat: [...teamState.chat, systemMsg],
                answered: { ...teamState.answered, [teamState.currentStep]: optionLabel },
                gamePhase: 'complete',
                score: newScore,
            };
            broadcast(finalState);
            setShowConfetti(true);
            awardXP(75, `Team Code Blue: ${scenario.condition}`, 'Team Code Blue');
            unlockBadge('team_resuscitator');
            incrementCodeBlue();
        } else {
            if (!correct) broadcastShake();
            const nextStepData = scenario.steps[nextStep];
            const urgentMsg: ChatMessage | null = nextStepData.urgentMessage ? {
                role: nextStepData.roleRequired,
                text: nextStepData.urgentMessage,
                timestamp: Date.now() + 1,
                isSystem: true,
            } : null;

            const newState: TeamState = {
                ...teamState,
                currentStep: nextStep,
                vitals: newVitals,
                chat: [...teamState.chat, systemMsg, ...(urgentMsg ? [urgentMsg] : [])],
                answered: { ...teamState.answered, [teamState.currentStep]: optionLabel },
                score: newScore,
            };
            broadcast(newState);
        }
    }, [teamState, myRole, broadcast, broadcastShake, awardXP, unlockBadge, incrementCodeBlue]);

    // ─── Send Chat ───────────────────────────────────────────────────
    const sendChat = useCallback(() => {
        if (!teamState || !myRole || !chatInput.trim()) return;
        const msg: ChatMessage = { role: myRole, text: chatInput.trim(), timestamp: Date.now() };
        const newState = { ...teamState, chat: [...teamState.chat, msg] };
        broadcast(newState);
        setChatInput('');
    }, [teamState, myRole, chatInput, broadcast]);

    // ─── Get current scenario & step ─────────────────────────────────
    const scenario = teamState ? TEAM_SCENARIOS.find(s => s.id === teamState.scenarioId) : null;
    const currentStep = scenario && teamState && teamState.currentStep < scenario.steps.length
        ? scenario.steps[teamState.currentStep] : null;
    const isMyTurn = currentStep?.roleRequired === myRole;
    const isVitalsCritical = teamState && (teamState.vitals.hr < 50 || teamState.vitals.hr > 140 || teamState.vitals.spo2 < 85);

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Role Selection
    // ═══════════════════════════════════════════════════════════════════
    if (!myRole) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full text-center space-y-8">
                    <div className="text-7xl mb-2">🚑</div>
                    <h1 className="text-4xl md:text-5xl font-bold">
                        <span className="neon-text-red">TEAM</span>{' '}
                        <span className="text-white">CODE BLUE</span>
                    </h1>
                    <p className="text-slate-400 text-lg">3-player collaborative resuscitation. Each role sees different information. Communication is critical.</p>

                    <div className="p-4 rounded-xl text-sm text-left" style={{ background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                        <span className="font-bold neon-text-gold">💡 Demo Tip:</span>{' '}
                        <span className="text-slate-300">Open this page in 2-3 browser windows (split screen). Each selects a different role. Watch the real-time sync!</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => (
                            <motion.button
                                key={role}
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setMyRole(role)}
                                className="p-6 rounded-2xl text-center cursor-pointer transition-all"
                                style={{ background: config.bg, border: `2px solid ${config.border}` }}
                            >
                                <div className="text-5xl mb-3">{config.icon}</div>
                                <div className="text-lg font-bold" style={{ color: config.color }}>{config.label}</div>
                                <div className="text-xs text-slate-400 mt-2">{config.description}</div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Game Complete
    // ═══════════════════════════════════════════════════════════════════
    if (teamState?.gamePhase === 'complete') {
        const elapsed = Math.floor((Date.now() - teamState.startTime) / 1000);
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center space-y-6">
                    <div className="text-7xl">🎉</div>
                    <h2 className="text-3xl font-bold neon-text-green">PATIENT STABILIZED!</h2>
                    <p className="text-slate-400">Your team scored {teamState.score} / {scenario?.steps.length ?? 3} correct decisions in {elapsed} seconds.</p>
                    <div className="scholar-card p-5 space-y-3">
                        <div className="text-sm font-bold text-white">📋 Case: {scenario?.condition}</div>
                        {scenario?.steps.map((step, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                                <span className="text-slate-400">{ROLE_CONFIG[step.roleRequired].icon} Step {i + 1}</span>
                                <span className={teamState.answered[i] === step.options.find(o => o.correct)?.label ? 'neon-text-green' : 'neon-text-red'}>
                                    {teamState.answered[i] === step.options.find(o => o.correct)?.label ? '✅' : '❌'} {teamState.answered[i]}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { setTeamState(null); setShowConfetti(false); }} className="scholar-btn flex-1 py-3 rounded-xl cursor-pointer font-bold">🔄 New Case</button>
                        <a href="/scholar" className="scholar-btn-success flex-1 py-3 rounded-xl inline-flex items-center justify-center font-bold">🏠 Dashboard</a>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Lobby (role selected, waiting to start)
    // ═══════════════════════════════════════════════════════════════════
    if (!teamState || teamState.gamePhase === 'lobby') {
        const roleConf = ROLE_CONFIG[myRole];
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full text-center space-y-6">
                    <div className="text-6xl">{roleConf.icon}</div>
                    <h2 className="text-2xl font-bold" style={{ color: roleConf.color }}>You are the {roleConf.label}</h2>
                    <p className="text-slate-400 text-sm">{roleConf.description}</p>
                    <div className="scholar-card p-5 space-y-3 text-left">
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Fog of War — Your View is Limited</div>
                        {myRole === 'physician' && <div className="text-sm text-slate-300">✅ Full vitals & ECG &nbsp;&nbsp; ❌ Cannot see drug inventory</div>}
                        {myRole === 'pharmacist' && <div className="text-sm text-slate-300">✅ Drug inventory & interactions &nbsp;&nbsp; ❌ Cannot see ECG</div>}
                        {myRole === 'nurse' && <div className="text-sm text-slate-300">✅ Administration & dosing &nbsp;&nbsp; ❌ Limited vitals only (HR, SpO2)</div>}
                    </div>
                    <button onClick={startGame} className="scholar-btn-danger w-full py-4 text-lg font-bold rounded-xl cursor-pointer">
                        🚨 START CODE BLUE
                    </button>
                    <button onClick={() => setMyRole(null)} className="text-xs text-slate-500 hover:text-white transition-colors cursor-pointer">← Change role</button>
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // RENDER: Active Game
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className={`min-h-screen p-4 md:p-6 ${isVitalsCritical ? 'er-pulse-border' : ''} ${shakeEffect ? 'code-blue-shake' : ''}`}>
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Header */}
                <div className="scholar-card p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl animate-pulse">🚨</span>
                            <div>
                                <span className="text-sm font-bold text-white uppercase tracking-wider">Code Blue — {scenario?.condition}</span>
                                <div className="text-xs text-slate-500">Step {(teamState.currentStep) + 1} / {scenario?.steps.length}</div>
                            </div>
                        </div>
                        <div className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: ROLE_CONFIG[myRole].bg, border: `1px solid ${ROLE_CONFIG[myRole].border}`, color: ROLE_CONFIG[myRole].color }}>
                            {ROLE_CONFIG[myRole].icon} {ROLE_CONFIG[myRole].label}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column: Vitals + Patient Info (FOG OF WAR) */}
                    <div className="space-y-4">
                        {/* VITALS — Physician sees all, Nurse sees limited, Pharmacist sees none */}
                        {myRole !== 'pharmacist' && (
                            <div className="scholar-card p-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                    {myRole === 'physician' ? '📊 Full Vitals' : '📊 Limited Vitals'}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-3 rounded-xl" style={{ background: teamState.vitals.hr > 120 || teamState.vitals.hr < 50 ? 'rgba(255,51,85,0.15)' : 'rgba(0,240,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="text-[10px] text-slate-500">HR</div>
                                        <div className={`text-xl font-bold ${teamState.vitals.hr > 120 || teamState.vitals.hr < 50 ? 'neon-text-red' : 'neon-text-cyan'}`}>
                                            {teamState.vitals.hr}
                                        </div>
                                    </div>
                                    <div className="text-center p-3 rounded-xl" style={{ background: teamState.vitals.spo2 < 90 ? 'rgba(255,51,85,0.15)' : 'rgba(0,255,136,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div className="text-[10px] text-slate-500">SpO2</div>
                                        <div className={`text-xl font-bold ${teamState.vitals.spo2 < 90 ? 'neon-text-red' : 'neon-text-green'}`}>
                                            {teamState.vitals.spo2}%
                                        </div>
                                    </div>
                                    {/* Physician sees full vitals */}
                                    {myRole === 'physician' && (
                                        <>
                                            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <div className="text-[10px] text-slate-500">BP</div>
                                                <div className="text-lg font-bold neon-text-cyan">{teamState.vitals.bp}</div>
                                            </div>
                                            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <div className="text-[10px] text-slate-500">RR</div>
                                                <div className="text-lg font-bold neon-text-gold">{teamState.vitals.rr}</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pharmacist sees FOG warning instead of vitals */}
                        {myRole === 'pharmacist' && (
                            <div className="scholar-card p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <div className="text-3xl mb-2">🌫️</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Fog of War</div>
                                <div className="text-sm text-slate-400 mt-1">You cannot see patient vitals. Ask the Physician!</div>
                            </div>
                        )}

                        {/* Patient Info — visible to physician */}
                        {myRole === 'physician' && scenario && (
                            <div className="scholar-card p-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">📋 Patient</div>
                                <p className="text-sm text-slate-300 mb-3">{scenario.presentation}</p>
                                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.15)' }}>
                                    <div className="text-xs font-bold neon-text-red mb-1">⚠️ Critical</div>
                                    <div className="text-xs text-slate-300">{scenario.criticalInfo}</div>
                                </div>
                            </div>
                        )}

                        {/* Drug Info — visible to pharmacist */}
                        {myRole === 'pharmacist' && scenario && (
                            <div className="scholar-card p-4">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">💊 Drug Formulary</div>
                                <div className="text-xs text-slate-500 mb-2">Current Patient Meds:</div>
                                <div className="space-y-1">
                                    {scenario.currentMeds.map(med => (
                                        <div key={med} className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)', color: '#ffd700' }}>
                                            💊 {med}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Center Column: Action Panel */}
                    <div className="space-y-4">
                        {currentStep && (
                            <motion.div key={teamState.currentStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="scholar-card p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">{ROLE_CONFIG[currentStep.roleRequired].icon}</span>
                                    <span className="text-xs font-bold uppercase" style={{ color: ROLE_CONFIG[currentStep.roleRequired].color }}>
                                        {ROLE_CONFIG[currentStep.roleRequired].label}&apos;s Decision
                                    </span>
                                    {isMyTurn && (
                                        <span className="ml-auto px-2 py-0.5 text-[9px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full animate-pulse">YOUR TURN</span>
                                    )}
                                </div>

                                <p className="text-sm text-white font-medium mb-4">{currentStep.prompt}</p>

                                <div className="space-y-2">
                                    {currentStep.options.map((opt) => (
                                        <motion.button
                                            key={opt.label}
                                            whileHover={isMyTurn ? { scale: 1.02 } : {}}
                                            onClick={() => isMyTurn && answerStep(opt.label, opt.correct)}
                                            disabled={!isMyTurn}
                                            className="w-full p-3 rounded-xl text-left text-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            {opt.label}
                                        </motion.button>
                                    ))}
                                </div>

                                {!isMyTurn && (
                                    <div className="mt-4 p-3 rounded-lg text-center" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}>
                                        <span className="text-xs text-yellow-400">⏳ Waiting for the {ROLE_CONFIG[currentStep.roleRequired].label} to decide...</span>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Explanation after answer (shown if step was just answered) */}
                        {teamState.answered[teamState.currentStep - 1] && scenario && teamState.currentStep > 0 && (
                            <div className="scholar-card p-4" style={{ borderColor: 'rgba(0,240,255,0.2)' }}>
                                <div className="text-xs font-bold neon-text-cyan mb-2">💡 Teaching Point — Step {teamState.currentStep}</div>
                                {scenario.steps[teamState.currentStep - 1].options
                                    .filter(o => o.correct)
                                    .map(o => <p key={o.label} className="text-xs text-slate-300">{o.explanation}</p>)}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Team Chat */}
                    <div className="scholar-card p-4 flex flex-col" style={{ minHeight: '400px' }}>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">📡 Team Comms</div>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-80">
                            <AnimatePresence>
                                {teamState.chat.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-2 rounded-lg text-xs ${msg.isSystem ? 'italic' : ''}`}
                                        style={{
                                            background: msg.isSystem ? 'rgba(255,255,255,0.02)' : ROLE_CONFIG[msg.role].bg,
                                            borderLeft: `3px solid ${ROLE_CONFIG[msg.role].color}`,
                                        }}
                                    >
                                        <span className="font-bold" style={{ color: ROLE_CONFIG[msg.role].color }}>
                                            {ROLE_CONFIG[msg.role].icon} {ROLE_CONFIG[msg.role].label}:
                                        </span>{' '}
                                        <span className="text-slate-300">{msg.text}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={chatEndRef} />
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                placeholder={`Message as ${ROLE_CONFIG[myRole].label}...`}
                                className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-slate-500"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <button onClick={sendChat} className="scholar-btn px-4 py-2 rounded-lg text-xs font-bold cursor-pointer">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
