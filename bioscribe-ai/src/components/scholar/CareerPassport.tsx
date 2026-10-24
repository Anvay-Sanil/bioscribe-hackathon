'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '@/stores/GamificationStore';
import CertificateGenerator from './CertificateGenerator';

// ─── Competency Map ──────────────────────────────────────────────────
interface Competency {
    id: string;
    title: string;
    icon: string;
    module: string;
    skills: string[];
    requiredBadges: string[];
    color: string;
}

const COMPETENCIES: Competency[] = [
    {
        id: 'clinical-emergency',
        title: 'Clinical Emergency Management',
        icon: '🚨',
        module: 'Emergency Room',
        skills: ['Time-Critical Decision Making', 'Drug Selection Under Pressure', 'Clinical Prioritization', 'Vital Sign Interpretation'],
        requiredBadges: ['speed_demon'],
        color: '#ef4444',
    },
    {
        id: 'cyp450-interactions',
        title: 'CYP450 Interaction Management',
        icon: '💊',
        module: 'Polypharmacy Sandbox',
        skills: ['Drug-Drug Interaction Identification', 'CYP Enzyme Inhibition/Induction', 'Polypharmacy Risk Assessment', 'Metabolic Pathway Analysis'],
        requiredBadges: ['polypharmacy_master'],
        color: '#f59e0b',
    },
    {
        id: 'admet-toxicology',
        title: 'ADMET Toxicology Assessment',
        icon: '🫀',
        module: 'Organ Safety Visualizer',
        skills: ['Organ-Specific Toxicity Prediction', 'ADMET Parameter Interpretation', 'Therapeutic Window Assessment', 'Hepatotoxicity Screening'],
        requiredBadges: ['organ_protector'],
        color: '#ec4899',
    },
    {
        id: 'hts-screening',
        title: 'High-Throughput Screening Proficiency',
        icon: '🔍',
        module: 'Discovery Quiz',
        skills: ['Hit Identification', 'Screening Data Interpretation', 'Lead Compound Selection', 'SAR Analysis'],
        requiredBadges: ['quiz_champion'],
        color: '#3b82f6',
    },
    {
        id: 'molecular-design',
        title: 'Molecular Design & Lipinski Compliance',
        icon: '🧱',
        module: 'Molecule Builder',
        skills: ['Atom-Level Molecular Construction', 'Lipinski Rule of 5 Compliance', 'Drug-Likeness Optimization', 'Physicochemical Property Calculation'],
        requiredBadges: ['safe_designer', 'molecule_architect'],
        color: '#10b981',
    },
    {
        id: 'ai-lab-ops',
        title: 'AI-Assisted Lab Operations',
        icon: '🎙️',
        module: 'Jarvis Voice Lab',
        skills: ['Voice-Controlled Lab Navigation', 'AI Command Interface', 'Workflow Automation', 'Natural Language Lab Queries'],
        requiredBadges: ['voice_commander'],
        color: '#8b5cf6',
    },
    {
        id: 'clinical-reasoning',
        title: 'Clinical Reasoning & Differential Diagnosis',
        icon: '🏥',
        module: 'Dr. House Mode',
        skills: ['Socratic Method Application', 'Differential Diagnosis', 'Evidence-Based Drug Selection', 'Red Herring Identification'],
        requiredBadges: ['socratic_thinker'],
        color: '#00f0ff',
    },
    {
        id: 'team-resuscitation',
        title: 'Team-Based Emergency Resuscitation',
        icon: '🚑',
        module: 'Team Code Blue',
        skills: ['Multi-Role Coordination', 'Real-Time Communication', 'Protocol Adherence Under Stress', 'Handoff Documentation'],
        requiredBadges: ['team_resuscitator'],
        color: '#f43f5e',
    },
    {
        id: 'collaborative-research',
        title: 'Collaborative Research',
        icon: '🌐',
        module: 'Metaverse Lab',
        skills: ['Multi-User Lab Collaboration', 'Shared Research Protocols', 'Real-Time Data Sharing'],
        requiredBadges: ['team_player'],
        color: '#0ea5e9',
    },
];

export default function CareerPassport() {
    const { badges, unlockBadge, incrementCertificates } = useGamificationStore();
    const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
    const [studentName, setStudentName] = useState('');
    const [showNamePrompt, setShowNamePrompt] = useState(false);

    const unlockedBadgeIds = badges.map(b => b.id);

    const isCompetencyCompleted = (comp: Competency) =>
        comp.requiredBadges.every(b => unlockedBadgeIds.includes(b));

    const completedCount = COMPETENCIES.filter(isCompetencyCompleted).length;

    const handleGenerateCert = (comp: Competency) => {
        setSelectedCompetency(comp);
        if (!studentName) {
            setShowNamePrompt(true);
        }
    };

    const confirmName = () => {
        setShowNamePrompt(false);
    };

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">🎓 Career</span>{' '}
                        <span className="neon-text-gold">Passport</span>
                    </h1>
                    <p className="text-slate-400">Verifiable credentials that prove your pharmacology skills to recruiters.</p>
                </motion.div>

                {/* Progress Overview */}
                <div className="scholar-card p-5 flex items-center gap-5">
                    <div className="text-center">
                        <div className="text-3xl font-bold neon-text-gold">{completedCount}</div>
                        <div className="text-xs text-slate-500">/ {COMPETENCIES.length}</div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Passport Completion</span>
                            <span className="neon-text-gold">{Math.round((completedCount / COMPETENCIES.length) * 100)}%</span>
                        </div>
                        <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                                animate={{ width: `${(completedCount / COMPETENCIES.length) * 100}%` }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #ffd700, #f59e0b)' }}
                            />
                        </div>
                    </div>
                    <div className="text-2xl">
                        {completedCount === COMPETENCIES.length ? '🏆' : completedCount >= 5 ? '⭐' : '📋'}
                    </div>
                </div>

                {/* Competency Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {COMPETENCIES.map((comp, i) => {
                        const completed = isCompetencyCompleted(comp);
                        const progress = comp.requiredBadges.filter(b => unlockedBadgeIds.includes(b)).length / comp.requiredBadges.length;

                        return (
                            <motion.div
                                key={comp.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="scholar-card p-5 relative overflow-hidden"
                                style={{
                                    borderColor: completed ? `${comp.color}40` : 'rgba(255,255,255,0.08)',
                                    boxShadow: completed ? `0 0 30px ${comp.color}15` : 'none',
                                }}
                            >
                                {/* Stamp overlay for completed */}
                                {completed && (
                                    <div className="absolute top-3 right-3">
                                        <motion.div
                                            initial={{ scale: 0, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                            style={{ background: `${comp.color}20`, border: `2px solid ${comp.color}60` }}
                                        >
                                            ✅
                                        </motion.div>
                                    </div>
                                )}

                                <div className="text-3xl mb-2">{comp.icon}</div>
                                <div className="text-sm font-bold text-white mb-1">{comp.title}</div>
                                <div className="text-xs text-slate-500 mb-3">{comp.module}</div>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {comp.skills.slice(0, 3).map(s => (
                                        <span key={s} className="px-2 py-0.5 rounded-full text-[9px]" style={{ background: `${comp.color}10`, border: `1px solid ${comp.color}25`, color: comp.color }}>
                                            {s}
                                        </span>
                                    ))}
                                    {comp.skills.length > 3 && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] text-slate-500">+{comp.skills.length - 3}</span>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div className="h-full rounded-full transition-all" style={{ width: `${progress * 100}%`, background: comp.color }} />
                                </div>

                                {completed ? (
                                    <button
                                        onClick={() => handleGenerateCert(comp)}
                                        className="w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
                                        style={{ background: `${comp.color}18`, border: `1px solid ${comp.color}40`, color: comp.color }}
                                    >
                                        📜 Generate Certificate
                                    </button>
                                ) : (
                                    <div className="text-[10px] text-slate-500 text-center">
                                        🔒 Complete {comp.module} to unlock
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Name Prompt Modal */}
            <AnimatePresence>
                {showNamePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        style={{ background: 'rgba(0,0,0,0.7)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="scholar-card p-8 max-w-sm w-full space-y-4 text-center"
                        >
                            <div className="text-3xl">✍️</div>
                            <h3 className="text-lg font-bold text-white">Enter Your Name</h3>
                            <p className="text-xs text-slate-400">This will appear on your certificate</p>
                            <input
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="Your full name..."
                                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}
                                autoFocus
                            />
                            <button
                                onClick={confirmName}
                                disabled={!studentName.trim()}
                                className="scholar-btn-success w-full py-3 rounded-xl font-bold cursor-pointer disabled:opacity-30"
                            >
                                Continue
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Certificate Generator Modal */}
            <AnimatePresence>
                {selectedCompetency && studentName && !showNamePrompt && (
                    <CertificateGenerator
                        studentName={studentName}
                        competencyTitle={selectedCompetency.title}
                        skills={selectedCompetency.skills}
                        moduleIcon={selectedCompetency.icon}
                        onClose={() => setSelectedCompetency(null)}
                        onGenerated={() => {
                            unlockBadge('career_ready');
                            incrementCertificates();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
