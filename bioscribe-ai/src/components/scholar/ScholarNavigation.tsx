'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGamificationStore,
    getCurrentTier,
    getNextTier,
    getXPProgress,
} from '@/stores/GamificationStore';

const scholarModules = [
    { label: 'Dashboard', href: '/scholar', icon: '🏠', description: 'Your lab hub' },
    { label: 'Emergency Room', href: '/scholar/emergency-room', icon: '🚨', description: 'Time-attack mode' },
    { label: 'Polypharmacy Sandbox', href: '/scholar/polypharmacy-sandbox', icon: '💊', description: 'Drug interactions' },
    { label: 'Organ Safety', href: '/scholar/organ-safety', icon: '🫀', description: 'Toxicity visualizer' },
    { label: 'Discovery Quiz', href: '/scholar/discovery-quiz', icon: '🔍', description: 'Find the hit' },
    { label: 'Holo-View', href: '/scholar/holo-view', icon: '👁️', description: 'AR molecules' },
    { label: 'Molecule Builder', href: '/scholar/molecule-builder', icon: '🧱', description: 'Voxel atoms' },
    { label: 'Jarvis', href: '/scholar/jarvis', icon: '🎙️', description: 'Voice control' },
    { label: 'Metaverse Lab', href: '/scholar/metaverse-lab', icon: '🌐', description: 'Multiplayer' },
];

export function ScholarNavigation() {
    const pathname = usePathname();
    const { xp, level, badges } = useGamificationStore();
    const currentTier = getCurrentTier(level);
    const nextTier = getNextTier(level);
    const xpProgress = getXPProgress(xp, level);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <nav className="sticky top-0 z-50" style={{
            background: 'rgba(10, 14, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
        }}>
            {/* Main Nav Bar */}
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/scholar" className="flex items-center gap-3 group">
                        <div className="relative">
                            <span className="text-2xl">🧬</span>
                            <div className="absolute -inset-1 bg-cyan-400/20 rounded-full blur-sm group-hover:bg-cyan-400/30 transition-all" />
                        </div>
                        <div>
                            <div className="font-bold text-white text-lg tracking-tight">
                                BioScribe <span className="neon-text-cyan">Scholar</span>
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                                Pharmacology Flight Simulator
                            </div>
                        </div>
                    </Link>

                    {/* XP Bar + Level (Desktop) */}
                    <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{currentTier.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: currentTier.color }}>
                                {currentTier.title}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="xp-bar-outer">
                                <div className="xp-bar-inner" style={{ width: `${xpProgress}%` }} />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-slate-500">{xp} XP</span>
                                {nextTier && (
                                    <span className="text-[10px] text-slate-500">{nextTier.minXP} XP</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Badges + Enterprise Toggle + Mobile Menu */}
                    <div className="flex items-center gap-3">
                        {/* Badge Count */}
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{
                            background: 'rgba(255, 215, 0, 0.1)',
                            border: '1px solid rgba(255, 215, 0, 0.2)',
                        }}>
                            <span className="text-sm">🏅</span>
                            <span className="text-xs font-bold text-yellow-400">{badges.length}</span>
                        </div>

                        {/* Enterprise Mode Toggle */}
                        <Link
                            href="/dashboard"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                            style={{
                                background: 'rgba(168, 85, 247, 0.1)',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                color: '#a855f7',
                            }}
                        >
                            🔓 Enterprise Mode
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <div className="space-y-1.5">
                                <div className={`w-5 h-0.5 bg-cyan-400 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                                <div className={`w-5 h-0.5 bg-cyan-400 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                                <div className={`w-5 h-0.5 bg-cyan-400 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Module Quick Links (Desktop) */}
                <div className="hidden md:flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
                    {scholarModules.map((mod) => {
                        const isActive = pathname === mod.href;
                        return (
                            <Link
                                key={mod.href}
                                href={mod.href}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                                style={{
                                    background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                                    border: isActive ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
                                    color: isActive ? '#00f0ff' : '#94a3b8',
                                }}
                            >
                                <span>{mod.icon}</span>
                                <span>{mod.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="md:hidden overflow-hidden"
                        style={{ borderTop: '1px solid rgba(0, 240, 255, 0.1)' }}
                    >
                        <div className="p-4 space-y-2">
                            {/* Mobile XP */}
                            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(0, 240, 255, 0.05)' }}>
                                <span className="text-2xl">{currentTier.icon}</span>
                                <div className="flex-1">
                                    <div className="text-sm font-bold" style={{ color: currentTier.color }}>
                                        {currentTier.title} — {xp} XP
                                    </div>
                                    <div className="xp-bar-outer mt-1">
                                        <div className="xp-bar-inner" style={{ width: `${xpProgress}%` }} />
                                    </div>
                                </div>
                            </div>

                            {scholarModules.map((mod) => {
                                const isActive = pathname === mod.href;
                                return (
                                    <Link
                                        key={mod.href}
                                        href={mod.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                        style={{
                                            background: isActive ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                            border: isActive ? '1px solid rgba(0, 240, 255, 0.2)' : '1px solid transparent',
                                        }}
                                    >
                                        <span className="text-xl">{mod.icon}</span>
                                        <div>
                                            <div className="text-sm font-semibold" style={{ color: isActive ? '#00f0ff' : '#e2e8f0' }}>
                                                {mod.label}
                                            </div>
                                            <div className="text-xs text-slate-500">{mod.description}</div>
                                        </div>
                                    </Link>
                                );
                            })}

                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl mt-4"
                                style={{
                                    background: 'rgba(168, 85, 247, 0.1)',
                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                }}
                            >
                                <span className="text-xl">🔓</span>
                                <div>
                                    <div className="text-sm font-semibold text-purple-400">Enterprise Mode</div>
                                    <div className="text-xs text-slate-500">Advanced research tools</div>
                                </div>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
