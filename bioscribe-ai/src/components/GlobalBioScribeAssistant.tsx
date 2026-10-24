import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Minimize2, Sparkles, MessageSquare, ChevronRight, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface GlobalBioScribeAssistantProps {
    currentContext?: string;
    onNavigate?: (tab: string) => void;
}

export function GlobalBioScribeAssistant({ currentContext = 'dashboard', onNavigate }: GlobalBioScribeAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm BioScribe AI, your full-time research assistant. I'm here to help you navigate, analyze, and discover. How can I assist you today?",
            timestamp: Date.now()
        }
    ]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Context-aware greeting updates
    useEffect(() => {
        if (isOpen) {
            let contextMsg = '';
            switch (currentContext) {
                case 'complete':
                    contextMsg = "I see you're setting up a complete pipeline. Need help selecting a target protein?";
                    break;
                case 'protein':
                    contextMsg = "Focusing on protein analysis? I can explain the folding metrics.";
                    break;
                case 'drugs':
                    contextMsg = "Ready to generate some drug candidates? I can suggest constraints.";
                    break;
                case 'results':
                    contextMsg = "Analyzing results? I can help you interpret the binding affinity scores.";
                    break;
            }

            if (contextMsg) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: contextMsg,
                    timestamp: Date.now()
                }]);
            }
        }
    }, [currentContext]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI processing
        setTimeout(() => {
            const lowerInput = userMsg.content.toLowerCase();
            let response = "I'm processing that request. Could you elaborate?";

            // Simple intent matching
            if (lowerInput.includes('navigate') || lowerInput.includes('go to')) {
                if (lowerInput.includes('result')) {
                    response = "Navigating you to the Results tab.";
                    onNavigate?.('results');
                } else if (lowerInput.includes('protein')) {
                    response = "Taking you to Protein Analysis.";
                    onNavigate?.('protein');
                } else if (lowerInput.includes('drug')) {
                    response = "Opening Drug Generation tools.";
                    onNavigate?.('drugs');
                }
            } else if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
                response = "I can help you configure pipelines, interpret results, navigate the platform, and even answer scientific questions about your targets.";
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                response = "Hello! Ready to accelerate your drug discovery?";
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 pointer-events-auto"
                    >
                        <Card className="w-[380px] h-[600px] shadow-2xl border-blue-200 flex flex-col overflow-hidden bg-white/95 backdrop-blur-xl">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold">BioScribe AI</CardTitle>
                                            <div className="text-[10px] text-blue-100 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                Online • Full-Time Assistant
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                                            <Minimize2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 p-0 overflow-hidden relative">
                                <ScrollArea className="h-full p-4" ref={scrollRef}>
                                    <div className="space-y-4 pb-4">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {msg.role === 'assistant' && (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                        <Bot className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                )}
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                                            ? 'bg-blue-600 text-white rounded-br-none'
                                                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                                                        }`}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Bot className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="bg-slate-50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1 border border-slate-100">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>

                            <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 shrink-0">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                    className="flex gap-2 w-full"
                                >
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask anything..."
                                        className="flex-1 bg-white border-slate-200 focus-visible:ring-blue-500"
                                    />
                                    <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={!input.trim() || isTyping}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                className={`pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-blue-500/30 transition-all duration-300 ${isOpen ? 'bg-slate-800 text-white rotate-90 scale-0 opacity-0' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-100 opacity-100'
                    }`}
                onClick={() => setIsOpen(true)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Sparkles className="w-6 h-6 animate-pulse" />

                {/* Pulse Ring */}
                <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />

                {/* Tooltip */}
                <AnimatePresence>
                    {isHovered && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: -20 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="absolute right-full mr-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap"
                        >
                            Ask BioScribe AI
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
