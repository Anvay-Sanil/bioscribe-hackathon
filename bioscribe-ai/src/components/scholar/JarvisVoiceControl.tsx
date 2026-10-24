'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '@/stores/GamificationStore';

// ─── Voice Commands ──────────────────────────────────────────────────
interface VoiceCommand {
    phrases: string[];
    action: string;
    description: string;
    response: string;
}

const COMMANDS: VoiceCommand[] = [
    { phrases: ['check toxicity', 'toxicity check', 'run toxicity'], action: 'toxicity', description: 'Run ADMET toxicity check', response: 'Running toxicity prediction... Hepatotoxicity risk: LOW. Cardiotoxicity: CLEAR. Drug-likeness score: 0.82/1.0.' },
    { phrases: ['rotate left', 'turn left'], action: 'rotate-left', description: 'Rotate molecule left', response: 'Rotating molecular structure counterclockwise...' },
    { phrases: ['rotate right', 'turn right'], action: 'rotate-right', description: 'Rotate molecule right', response: 'Rotating molecular structure clockwise...' },
    { phrases: ['zoom in', 'magnify', 'closer'], action: 'zoom-in', description: 'Zoom into molecule', response: 'Zooming in. You can now see the hydrogen bond network more clearly.' },
    { phrases: ['zoom out', 'zoom away'], action: 'zoom-out', description: 'Zoom out of molecule', response: 'Zooming out. Full molecular structure now visible.' },
    { phrases: ['show interactions', 'drug interactions', 'check interactions'], action: 'interactions', description: 'Show drug interactions', response: 'Scanning interaction database... Found 2 potential interactions: CYP3A4 inhibition with ketoconazole, and moderate P-gp substrate activity.' },
    { phrases: ['explain result', 'explain', 'what does this mean'], action: 'explain', description: 'AI Professor explanation', response: 'This molecule shows a binding affinity of -9.4 kcal/mol — think of it like a key fitting perfectly into a lock. The negative number means energy is RELEASED when binding occurs, so more negative = tighter fit.' },
    { phrases: ['start emergency', 'emergency room', 'er mode'], action: 'emergency', description: 'Launch Emergency Room', response: 'Initializing Emergency Room simulation... Incoming patient with cardiac symptoms. Redirecting to ER module.' },
    { phrases: ['help', 'commands', 'what can you do'], action: 'help', description: 'List all commands', response: 'Available commands: Check Toxicity, Rotate Left/Right, Zoom In/Out, Show Interactions, Explain Result, Start Emergency, and Help.' },
];

export default function JarvisVoiceControl() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [responseText, setResponseText] = useState('');
    const [lastCommand, setLastCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [commandLog, setCommandLog] = useState<{ command: string; response: string; time: string }[]>([]);
    const [speechSupported, setSpeechSupported] = useState(true);
    const [textInput, setTextInput] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const { awardXP, incrementVoiceCommands, unlockBadge, voiceCommandsUsed } = useGamificationStore();

    // ─── Setup Speech Recognition ──────────────────────────────────
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.results.length - 1];
            setTranscript(result[0].transcript);
            if (result.isFinal) {
                processCommand(result[0].transcript);
            }
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognitionRef.current = recognition;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Process Command ───────────────────────────────────────────
    const processCommand = useCallback((text: string) => {
        const lower = text.toLowerCase().trim();
        setIsProcessing(true);

        const matched = COMMANDS.find((cmd) => cmd.phrases.some((p) => lower.includes(p)));

        setTimeout(() => {
            if (matched) {
                setLastCommand(matched.description);
                setResponseText(matched.response);
                incrementVoiceCommands();
                awardXP(5, `Jarvis: ${matched.description}`, 'Jarvis');

                setCommandLog((prev) => [
                    { command: text, response: matched.response, time: new Date().toLocaleTimeString() },
                    ...prev,
                ].slice(0, 10));

                if ((voiceCommandsUsed + 1) >= 10) {
                    unlockBadge('voice_commander');
                }

                // Speech synthesis response
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(matched.response);
                    utterance.rate = 1.1;
                    utterance.pitch = 0.9;
                    window.speechSynthesis.speak(utterance);
                }
            } else {
                setLastCommand('Unknown command');
                setResponseText(`I didn't recognize "${text}". Try saying "help" to see available commands.`);
            }
            setIsProcessing(false);
        }, 800);
    }, [awardXP, incrementVoiceCommands, unlockBadge, voiceCommandsUsed]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const handleTextSubmit = () => {
        if (textInput.trim()) {
            setTranscript(textInput);
            processCommand(textInput);
            setTextInput('');
        }
    };

    // Wave bars
    const WaveVisualization = () => (
        <div className="flex items-center justify-center gap-1 h-8">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="voice-wave-bar"
                    style={{ animationDelay: `${i * 0.1}s` }}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <h1 className="text-4xl font-bold mb-2">
                        <span className="text-white">🎙️ Jarvis</span>{' '}
                        <span className="neon-text-cyan">Voice Lab</span>
                    </h1>
                    <p className="text-slate-400">Control your lab with voice commands</p>
                </motion.div>

                {/* Main Listener */}
                <div className="scholar-card p-8 text-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startListening}
                        disabled={isListening || !speechSupported}
                        className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center cursor-pointer transition-all"
                        style={{
                            background: isListening
                                ? 'rgba(0, 240, 255, 0.2)'
                                : 'rgba(0, 240, 255, 0.05)',
                            border: `3px solid ${isListening ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
                            boxShadow: isListening ? '0 0 40px rgba(0, 240, 255, 0.3)' : 'none',
                        }}
                    >
                        {isListening ? (
                            <WaveVisualization />
                        ) : isProcessing ? (
                            <div className="neon-text-cyan animate-pulse text-xl">⚡</div>
                        ) : (
                            <span className="text-4xl">🎙️</span>
                        )}
                    </motion.button>

                    <div className="text-sm text-slate-400 mb-4">
                        {isListening ? 'Listening...' : isProcessing ? 'Processing...' : speechSupported ? 'Tap to speak' : 'Voice not supported — use text input'}
                    </div>

                    {/* Transcript */}
                    {transcript && (
                        <div className="text-sm text-white font-mono mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            &quot;{transcript}&quot;
                        </div>
                    )}

                    {/* Text input fallback */}
                    <div className="flex gap-2 max-w-md mx-auto">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                            placeholder="Or type a command..."
                            className="flex-1 px-4 py-2 rounded-xl text-sm text-white bg-transparent"
                            style={{ border: '1px solid rgba(0, 240, 255, 0.2)', outline: 'none' }}
                        />
                        <button onClick={handleTextSubmit} className="scholar-btn px-4 py-2 rounded-xl cursor-pointer">→</button>
                    </div>
                </div>

                {/* Response */}
                <AnimatePresence>
                    {responseText && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="scholar-card p-5"
                            style={{ borderColor: 'rgba(0, 240, 255, 0.2)', background: 'rgba(0, 240, 255, 0.05)' }}
                        >
                            <div className="text-xs neon-text-cyan uppercase tracking-wider mb-2">🎙️ JARVIS — {lastCommand}</div>
                            <p className="text-sm text-slate-300 leading-relaxed">{responseText}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Available Commands */}
                <div className="scholar-card p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Available Commands</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {COMMANDS.map((cmd) => (
                            <button
                                key={cmd.action}
                                onClick={() => { setTranscript(cmd.phrases[0]); processCommand(cmd.phrases[0]); }}
                                className="p-3 rounded-xl text-left transition-all hover:bg-white/5 cursor-pointer"
                                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div className="text-xs font-mono neon-text-cyan">&quot;{cmd.phrases[0]}&quot;</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{cmd.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Command Log */}
                {commandLog.length > 0 && (
                    <div className="scholar-card p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">📜 Command Log</h3>
                        <div className="space-y-2">
                            {commandLog.map((log, i) => (
                                <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <div className="flex justify-between">
                                        <span className="text-xs font-mono text-white">&quot;{log.command}&quot;</span>
                                        <span className="text-[10px] text-slate-500">{log.time}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">{log.response}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
