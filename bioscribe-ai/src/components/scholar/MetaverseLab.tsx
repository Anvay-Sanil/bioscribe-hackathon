'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '@/stores/GamificationStore';

// ─── Shared State Interface ──────────────────────────────────────────
interface LabState {
    userId: string;
    username: string;
    color: string;
    cursorX: number;
    cursorY: number;
    message: string;
    timestamp: number;
    selectedAtom: string;
}

const STORAGE_KEY = 'bioscribe-metaverse-lab';
const USER_COLORS = ['#00f0ff', '#ff00e5', '#00ff88', '#ffd700', '#ff3355', '#a855f7'];

export default function MetaverseLab() {
    const [userId] = useState(() => `user-${Math.random().toString(36).slice(2, 8)}`);
    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [peers, setPeers] = useState<LabState[]>([]);
    const [chatMessages, setChatMessages] = useState<{ user: string; text: string; color: string; time: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [userColor] = useState(() => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);
    const containerRef = useRef<HTMLDivElement>(null);

    const { awardXP, unlockBadge } = useGamificationStore();

    // ─── localStorage Sync ─────────────────────────────────────────
    useEffect(() => {
        if (!isJoined) return;

        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const states: LabState[] = JSON.parse(e.newValue);
                    setPeers(states.filter((s) => s.userId !== userId));
                } catch {
                    // ignore parse errors
                }
            }
            if (e.key === `${STORAGE_KEY}-chat` && e.newValue) {
                try {
                    const msgs = JSON.parse(e.newValue);
                    setChatMessages(msgs);
                } catch {
                    // ignore
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [isJoined, userId]);

    // ─── Broadcast Own State ───────────────────────────────────────
    const broadcastState = useCallback(
        (partialState: Partial<LabState>) => {
            try {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                const myState: LabState = {
                    userId,
                    username,
                    color: userColor,
                    cursorX: 0,
                    cursorY: 0,
                    message: '',
                    timestamp: Date.now(),
                    selectedAtom: 'C',
                    ...partialState,
                };
                const updated = [...existing.filter((s: LabState) => s.userId !== userId), myState];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
                // ignore
            }
        },
        [userId, username, userColor]
    );

    // ─── Track Cursor ──────────────────────────────────────────────
    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!containerRef.current || !isJoined) return;
            const rect = containerRef.current.getBoundingClientRect();
            broadcastState({
                cursorX: ((e.clientX - rect.left) / rect.width) * 100,
                cursorY: ((e.clientY - rect.top) / rect.height) * 100,
            });
        },
        [isJoined, broadcastState]
    );

    // ─── Send Chat ────────────────────────────────────────────────
    const sendChat = () => {
        if (!chatInput.trim()) return;
        const newMsg = {
            user: username,
            text: chatInput,
            color: userColor,
            time: new Date().toLocaleTimeString(),
        };
        const updated = [...chatMessages, newMsg].slice(-50);
        setChatMessages(updated);
        localStorage.setItem(`${STORAGE_KEY}-chat`, JSON.stringify(updated));
        setChatInput('');
    };

    const joinLab = () => {
        if (!username.trim()) return;
        setIsJoined(true);
        broadcastState({});
        awardXP(10, 'Joined Metaverse Lab', 'Metaverse Lab');
        unlockBadge('team_player');
    };

    // ─── Not Joined ────────────────────────────────────────────────
    if (!isJoined) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-6">
                    <div className="text-8xl">🌐</div>
                    <h1 className="text-4xl font-bold neon-text-cyan">METAVERSE LAB</h1>
                    <p className="text-slate-400">Collaborate with other students in a shared laboratory. Open this page in two browser tabs to simulate multiplayer.</p>
                    <div className="scholar-card p-5 text-left space-y-2 text-sm text-slate-300">
                        <div>🖱️ See each other&apos;s cursors in real-time</div>
                        <div>💬 Chat with lab partners</div>
                        <div>🔬 Shared experimental workspace</div>
                        <div>📡 Powered by localStorage sync (demo mode)</div>
                    </div>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && joinLab()}
                        placeholder="Enter your lab name..."
                        className="w-full px-4 py-3 rounded-xl text-white bg-transparent text-center text-lg"
                        style={{ border: '2px solid rgba(0, 240, 255, 0.3)', outline: 'none' }}
                    />
                    <button onClick={joinLab} disabled={!username.trim()} className="scholar-btn px-10 py-4 rounded-xl w-full text-lg font-bold cursor-pointer disabled:opacity-30">
                        🚀 Join Lab
                    </button>
                </motion.div>
            </div>
        );
    }

    // ─── Joined Lab ────────────────────────────────────────────────
    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">🌐 Metaverse</span>{' '}
                        <span className="neon-text-cyan">Lab</span>
                    </h1>
                    <p className="text-slate-400">Open a second tab at the same URL to see multiplayer sync</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lab Workspace */}
                    <div className="lg:col-span-2">
                        <div
                            ref={containerRef}
                            onMouseMove={handleMouseMove}
                            className="scholar-card relative holo-grid cursor-crosshair overflow-hidden"
                            style={{ height: '500px' }}
                        >
                            {/* Own cursor label */}
                            <div className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-bold" style={{ background: `${userColor}20`, border: `1px solid ${userColor}40`, color: userColor }}>
                                👤 {username} (You)
                            </div>

                            {/* Peer cursors */}
                            {peers.map((peer) => (
                                <motion.div
                                    key={peer.userId}
                                    animate={{ left: `${peer.cursorX}%`, top: `${peer.cursorY}%` }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute pointer-events-none"
                                    style={{ zIndex: 20 }}
                                >
                                    <div className="relative">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill={peer.color}>
                                            <path d="M0 0L0 18L5 13L10 20L14 18L9 11L16 11Z" />
                                        </svg>
                                        <div className="absolute top-5 left-4 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap" style={{ background: `${peer.color}20`, border: `1px solid ${peer.color}40`, color: peer.color }}>
                                            {peer.username}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Center workspace instructions */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-6xl mb-4 opacity-20">🔬</div>
                                    <p className="text-slate-600 text-sm">Shared Lab Workspace</p>
                                    <p className="text-slate-700 text-xs mt-1">Move your cursor — peers will see it</p>
                                </div>
                            </div>

                            {/* Connection status */}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] text-green-400 font-bold">{peers.length + 1} CONNECTED</span>
                            </div>
                        </div>
                    </div>

                    {/* Chat Panel */}
                    <div className="scholar-card p-4 flex flex-col" style={{ height: '500px' }}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">💬 Lab Chat</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
                            {chatMessages.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center mt-8">No messages yet. Say hello! 👋</p>
                            ) : (
                                chatMessages.map((msg, i) => (
                                    <div key={i} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold" style={{ color: msg.color }}>{msg.user}</span>
                                            <span className="text-[10px] text-slate-600">{msg.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-300 mt-0.5">{msg.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                placeholder="Message..."
                                className="flex-1 px-3 py-2 rounded-lg text-xs text-white bg-transparent"
                                style={{ border: '1px solid rgba(0, 240, 255, 0.2)', outline: 'none' }}
                            />
                            <button onClick={sendChat} className="scholar-btn px-3 py-2 rounded-lg text-xs cursor-pointer">↑</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
