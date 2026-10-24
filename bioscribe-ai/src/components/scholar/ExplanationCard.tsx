'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '@/stores/GamificationStore';
import mockData from '@/data/MockAIResponses.json';

interface ExplanationCardProps {
    scenarioKey: string;
    onClose?: () => void;
}

interface QuizData {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

interface ScenarioData {
    title: string;
    emoji: string;
    simpleExplanation: string;
    advancedExplanation: string;
    metaphor: string;
    quiz: QuizData;
}

export function ExplanationCard({ scenarioKey, onClose }: ExplanationCardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [difficulty, setDifficulty] = useState<'simple' | 'advanced'>('simple');
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
    const [scenario, setScenario] = useState<ScenarioData | null>(null);

    const { awardXP, incrementExplanationsRead } = useGamificationStore();

    // Fake "thinking" delay
    useEffect(() => {
        const timer = setTimeout(() => {
            const data = (mockData.scenarios as Record<string, ScenarioData>)[scenarioKey];
            if (data) {
                setScenario(data);
                incrementExplanationsRead();
                awardXP(3, `Read: ${data.title}`, 'AI Professor');
            }
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scenarioKey]);

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="scholar-card p-6"
                style={{ borderColor: 'rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.05)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">🧠</div>
                    <div>
                        <div className="text-sm font-bold text-purple-400">AI Professor is thinking...</div>
                        <div className="flex gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!scenario) {
        return (
            <div className="scholar-card p-4 text-center text-slate-500 text-sm">
                No explanation available for this context.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="scholar-card p-6 space-y-4"
            style={{ borderColor: 'rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.05)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">🧠</div>
                    <div>
                        <div className="text-sm font-bold text-purple-400">AI Professor</div>
                        <div className="text-xs text-slate-500">{scenario.emoji} {scenario.title}</div>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer">✕</button>
                )}
            </div>

            {/* Difficulty Toggle */}
            <div className="flex gap-2">
                <button
                    onClick={() => setDifficulty('simple')}
                    className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    style={{
                        background: difficulty === 'simple' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                        border: `1px solid ${difficulty === 'simple' ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                        color: difficulty === 'simple' ? '#a855f7' : '#94a3b8',
                    }}
                >
                    🎓 Simple
                </button>
                <button
                    onClick={() => setDifficulty('advanced')}
                    className="px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    style={{
                        background: difficulty === 'advanced' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                        border: `1px solid ${difficulty === 'advanced' ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                        color: difficulty === 'advanced' ? '#a855f7' : '#94a3b8',
                    }}
                >
                    🔬 Advanced
                </button>
            </div>

            {/* Explanation */}
            <div className="text-sm text-slate-300 leading-relaxed">
                {difficulty === 'simple' ? scenario.simpleExplanation : scenario.advancedExplanation}
            </div>

            {/* Metaphor */}
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.15)' }}>
                <div className="text-xs font-bold text-yellow-400 mb-1">💡 Analogy</div>
                <p className="text-sm text-slate-300">{scenario.metaphor}</p>
            </div>

            {/* Quiz Button */}
            <button
                onClick={() => setShowQuiz(!showQuiz)}
                className="scholar-btn w-full py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
                🧪 Quiz Me!
            </button>

            {/* Quiz */}
            <AnimatePresence>
                {showQuiz && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                        <div className="text-sm font-medium text-white">{scenario.quiz.question}</div>
                        <div className="space-y-2">
                            {scenario.quiz.options.map((opt, i) => {
                                let style: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' };
                                if (quizAnswer !== null) {
                                    if (i === scenario.quiz.correct) style = { background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' };
                                    else if (i === quizAnswer) style = { background: 'rgba(255,51,85,0.1)', border: '1px solid rgba(255,51,85,0.3)' };
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (quizAnswer === null) {
                                                setQuizAnswer(i);
                                                if (i === scenario.quiz.correct) awardXP(10, `Quiz correct: ${scenario.title}`, 'AI Professor');
                                            }
                                        }}
                                        disabled={quizAnswer !== null}
                                        className="w-full p-3 rounded-lg text-xs text-left text-white transition-all cursor-pointer disabled:cursor-default"
                                        style={style}
                                    >
                                        {quizAnswer !== null && i === scenario.quiz.correct && '✅ '}
                                        {quizAnswer !== null && i === quizAnswer && i !== scenario.quiz.correct && '❌ '}
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        {quizAnswer !== null && (
                            <div className="p-3 rounded-lg text-xs text-slate-300" style={{ background: 'rgba(0,240,255,0.05)' }}>
                                {scenario.quiz.explanation}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
