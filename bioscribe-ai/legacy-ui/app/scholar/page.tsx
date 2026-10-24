'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    useGamificationStore,
    getCurrentTier,
    getNextTier,
    getXPProgress,
    ALL_BADGES,
    LEVEL_TIERS,
} from '@/stores/GamificationStore';
import { useCrowdsourcedCuresStore, type Discovery } from '@/stores/CrowdsourcedCuresStore';

const modules = [
    {
        label: 'Emergency Room',
        href: '/scholar/emergency-room',
        icon: '🚨',
        description: '60-second time-attack clinical emergency',
        gradient: 'from-red-500/20 to-rose-500/20',
        border: 'border-red-500/30',
        tag: 'GOD MODE',
    },
    {
        label: 'Polypharmacy Sandbox',
        href: '/scholar/polypharmacy-sandbox',
        icon: '💊',
        description: 'Mix drugs on the crafting table — find lethal combos',
        gradient: 'from-orange-500/20 to-amber-500/20',
        border: 'border-orange-500/30',
        tag: null,
    },
    {
        label: 'Organ Safety Visualizer',
        href: '/scholar/organ-safety',
        icon: '🫀',
        description: '3D body scan — watch organs glow by toxicity',
        gradient: 'from-pink-500/20 to-fuchsia-500/20',
        border: 'border-pink-500/30',
        tag: null,
    },
    {
        label: 'Discovery Quiz',
        href: '/scholar/discovery-quiz',
        icon: '🔍',
        description: 'Find the needle in the haystack — timed screening',
        gradient: 'from-blue-500/20 to-indigo-500/20',
        border: 'border-blue-500/30',
        tag: null,
    },
    {
        label: 'Holo-View AR',
        href: '/scholar/holo-view',
        icon: '👁️',
        description: 'See molecules floating in your real room',
        gradient: 'from-cyan-500/20 to-teal-500/20',
        border: 'border-cyan-500/30',
        tag: 'GOD MODE',
    },
    {
        label: 'Molecule Builder',
        href: '/scholar/molecule-builder',
        icon: '🧱',
        description: 'Minecraft-style voxel atom construction',
        gradient: 'from-green-500/20 to-emerald-500/20',
        border: 'border-green-500/30',
        tag: null,
    },
    {
        label: 'Jarvis Voice Lab',
        href: '/scholar/jarvis',
        icon: '🎙️',
        description: 'Voice-control your entire lab',
        gradient: 'from-violet-500/20 to-purple-500/20',
        border: 'border-violet-500/30',
        tag: 'GOD MODE',
    },
    {
        label: 'Metaverse Lab',
        href: '/scholar/metaverse-lab',
        icon: '🌐',
        description: 'Shared lab with other students',
        gradient: 'from-sky-500/20 to-blue-500/20',
        border: 'border-sky-500/30',
        tag: null,
    },
    // ─── NEW APEX MODULES ────────────────────────────────────────────
    {
        label: 'Team Code Blue',
        href: '/scholar/team-code-blue',
        icon: '🚑',
        description: 'Among Us-style ER — 3 roles, real-time sync',
        gradient: 'from-rose-500/20 to-red-600/20',
        border: 'border-rose-500/30',
        tag: 'LIVE',
    },
    {
        label: 'Dr. House Mode',
        href: '/scholar/dr-house',
        icon: '🏥',
        description: 'Socratic AI tutor — infinite cases',
        gradient: 'from-cyan-500/20 to-blue-600/20',
        border: 'border-cyan-500/30',
        tag: 'APEX',
    },
    {
        label: 'Career Passport',
        href: '/scholar/career-passport',
        icon: '🎓',
        description: 'Verifiable skill certificates for recruiters',
        gradient: 'from-yellow-500/20 to-amber-600/20',
        border: 'border-yellow-500/30',
        tag: null,
    },
];

export default function ScholarDashboard() {
    const { xp, level, badges, erBestTime, moleculesBuilt, completedChallenges, xpHistory, nukeAll } =
        useGamificationStore();
    const { getRecentDiscoveries, totalDiscoveries } = useCrowdsourcedCuresStore();
    const currentTier = getCurrentTier(level);
    const nextTier = getNextTier(level);
    const xpProgress = getXPProgress(xp, level);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="neon-text-cyan text-xl animate-pulse">Initializing Lab Systems...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-4">
                        <span className="neon-text-cyan">Welcome</span>{' '}
                        <span className="text-white">to the Lab</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                        Your pharmacology flight simulator. Learn how drugs work by{' '}
                        <span className="neon-text-green">building</span>,{' '}
                        <span className="neon-text-red">breaking</span>, and{' '}
                        <span className="neon-text-gold">discovering</span> them.
                    </p>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {/* Level Card */}
                    <div className="scholar-card p-5 text-center">
                        <div className="text-4xl mb-2">{currentTier.icon}</div>
                        <div className="text-2xl font-bold" style={{ color: currentTier.color }}>
                            {currentTier.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Level {level}</div>
                        <div className="xp-bar-outer mt-3">
                            <div className="xp-bar-inner" style={{ width: `${xpProgress}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                            {xp} / {nextTier ? nextTier.minXP : '∞'} XP
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="scholar-card p-5 text-center">
                        <div className="text-4xl mb-2">🏅</div>
                        <div className="text-2xl font-bold neon-text-gold">{badges.length}</div>
                        <div className="text-xs text-slate-500 mt-1">of {ALL_BADGES.length} Badges</div>
                        <div className="flex flex-wrap justify-center gap-1 mt-3">
                            {badges.slice(0, 5).map((b) => (
                                <span key={b.id} className="text-lg" title={b.name}>
                                    {b.icon}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ER Best Time */}
                    <div className="scholar-card p-5 text-center">
                        <div className="text-4xl mb-2">⏱️</div>
                        <div className="text-2xl font-bold neon-text-red">
                            {erBestTime !== null ? `${erBestTime}s` : '—'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">ER Best Time</div>
                    </div>

                    {/* Molecules Built */}
                    <div className="scholar-card p-5 text-center">
                        <div className="text-4xl mb-2">🧪</div>
                        <div className="text-2xl font-bold neon-text-green">{moleculesBuilt}</div>
                        <div className="text-xs text-slate-500 mt-1">Molecules Built</div>
                    </div>
                </motion.div>

                {/* Module Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="neon-text-cyan">⚡</span> Lab Modules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {modules.map((mod, idx) => (
                            <motion.div
                                key={mod.href}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.5 + idx * 0.08 }}
                            >
                                <Link href={mod.href}>
                                    <div
                                        className={`scholar-card p-5 h-full cursor-pointer group bg-gradient-to-br ${mod.gradient} border ${mod.border}`}
                                    >
                                        {mod.tag && (
                                            <div className="absolute top-3 right-3">
                                                <span className="px-2 py-0.5 text-[9px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full animate-pulse">
                                                    {mod.tag}
                                                </span>
                                            </div>
                                        )}
                                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                                            {mod.icon}
                                        </div>
                                        <div className="text-sm font-bold text-white mb-1">{mod.label}</div>
                                        <div className="text-xs text-slate-400">{mod.description}</div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent XP Activity */}
                {xpHistory.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="neon-text-gold">📊</span> Recent Activity
                        </h2>
                        <div className="scholar-card p-5">
                            <div className="space-y-3">
                                {xpHistory
                                    .slice(-5)
                                    .reverse()
                                    .map((evt, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                                        >
                                            <div>
                                                <div className="text-sm text-white">{evt.reason}</div>
                                                <div className="text-xs text-slate-500">{evt.module}</div>
                                            </div>
                                            <span className="text-sm font-bold neon-text-green">+{evt.amount} XP</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Crowdsourced Cures Discovery Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <span className="neon-text-green">🌍</span> Crowdsourced Cures — Live Feed
                        <span className="ml-auto text-xs text-slate-500">{totalDiscoveries} total compounds</span>
                    </h2>
                    <div className="scholar-card p-5">
                        <div className="space-y-2">
                            {getRecentDiscoveries().slice(0, 5).map((d, i) => {
                                const ago = Math.floor((Date.now() - d.timestamp) / 60000);
                                return (
                                    <div key={d.id + i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm">{d.status === 'promising' ? '⭐' : d.status === 'analyzing' ? '🔬' : d.status === 'submitted' ? '📨' : '🗃️'}</span>
                                            <div>
                                                <div className="text-sm text-white font-mono">{d.formula}</div>
                                                <div className="text-xs text-slate-500">by {d.designerName} · {ago <= 0 ? 'just now' : `${ago}m ago`}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-bold ${d.bindingAffinity < -8 ? 'neon-text-green' : d.bindingAffinity < -6 ? 'neon-text-gold' : 'text-slate-400'}`}>
                                                {d.bindingAffinity.toFixed(1)} kcal/mol
                                            </div>
                                            <div className="text-[10px] text-slate-600">{d.molecularWeight.toFixed(0)} Da</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Dev Nuke Button (hidden in footer) */}
                <div className="text-center pt-8 pb-4">
                    <button
                        onClick={nukeAll}
                        className="text-[10px] text-slate-700 hover:text-red-500 transition-colors cursor-pointer"
                        title="Reset all progress (dev only)"
                    >
                        💣 Reset All Progress
                    </button>
                </div>
            </div>
        </div>
    );
}
