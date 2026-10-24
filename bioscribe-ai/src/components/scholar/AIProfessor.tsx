'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExplanationCard } from './ExplanationCard';

const QUICK_TOPICS = [
    { key: 'warfarin-aspirin', label: 'Warfarin + Aspirin', icon: '💊' },
    { key: 'paracetamol-toxicity', label: 'Paracetamol Toxicity', icon: '🫘' },
    { key: 'docking-score', label: 'Docking Scores', icon: '🔑' },
    { key: 'lipinski-rules', label: "Lipinski's Rules", icon: '📏' },
];

export function AIProfessor() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 cursor-pointer"
                style={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)',
                    border: '2px solid rgba(168, 85, 247, 0.5)',
                }}
            >
                <span className="text-2xl">{isOpen ? '✕' : '🧠'}</span>
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-96 max-h-[70vh] z-50 overflow-y-auto rounded-2xl"
                        style={{
                            background: 'rgba(10, 14, 26, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">🧠</div>
                                <div>
                                    <div className="text-sm font-bold text-purple-400">AI Professor</div>
                                    <div className="text-[10px] text-slate-500">Ask me anything about pharmacology</div>
                                </div>
                            </div>

                            {selectedTopic ? (
                                <>
                                    <button onClick={() => setSelectedTopic(null)} className="text-xs neon-text-cyan cursor-pointer hover:underline">
                                        ← Back to topics
                                    </button>
                                    <ExplanationCard scenarioKey={selectedTopic} />
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider">Quick Topics</div>
                                    {QUICK_TOPICS.map((topic) => (
                                        <button
                                            key={topic.key}
                                            onClick={() => setSelectedTopic(topic.key)}
                                            className="w-full p-3 rounded-xl text-left transition-all hover:bg-white/5 cursor-pointer flex items-center gap-3"
                                            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                                        >
                                            <span className="text-xl">{topic.icon}</span>
                                            <span className="text-sm text-white">{topic.label}</span>
                                            <span className="ml-auto text-slate-600">→</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
