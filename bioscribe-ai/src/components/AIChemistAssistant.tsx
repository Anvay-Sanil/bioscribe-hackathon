import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    X,
    Send,
    Sparkles,
    Maximize2,
    Minimize2,
    Bot,
    User,
    ChevronRight,
    Zap,
    Microscope,
    Eye
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: {
        label: string;
        action: string;
        icon?: React.ReactNode;
    }[];
}

interface AIChemistAssistantProps {
    onAction: (action: string, params?: any) => void;
    context: {
        viewMode: string;
        renderStyle: string;
        selectedResidue?: string;
        showInteractions: boolean;
    };
}

export function AIChemistAssistant({ onAction, context }: AIChemistAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your AI Chemist Assistant. I can help you analyze this structure, suggest modifications, or adjust the visualization. What would you like to do?",
            timestamp: new Date(),
            actions: [
                { label: "Analyze Binding Site", action: "analyze_binding", icon: <Microscope className="w-3 h-3" /> },
                { label: "Show Interactions", action: "show_interactions", icon: <Zap className="w-3 h-3" /> },
                { label: "Optimize View", action: "optimize_view", icon: <Eye className="w-3 h-3" /> }
            ]
        }
    ]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsThinking(true);

        // Simulate AI processing
        setTimeout(() => {
            const response = generateAIResponse(input, context);
            setMessages(prev => [...prev, response]);
            setIsThinking(false);

            // Execute action if implied
            if (response.actions && response.actions.length > 0 && response.content.includes("I've updated")) {
                // Auto-execute first action if it's a direct command response
                onAction(response.actions[0].action);
            }
        }, 1000);
    };

    const generateAIResponse = (query: string, ctx: any): Message => {
        const lowerQuery = query.toLowerCase();
        let content = "I'm not sure how to help with that specific request yet.";
        let actions: any[] = [];

        if (lowerQuery.includes('binding') || lowerQuery.includes('site') || lowerQuery.includes('pocket')) {
            content = "I've analyzed the binding pocket. It's a hydrophobic cavity with key residues His57 and Ser195. Would you like to zoom in or see the surface?";
            actions = [
                { label: "Zoom to Pocket", action: "zoom_binding_site", icon: <Maximize2 className="w-3 h-3" /> },
                { label: "Show Surface", action: "show_surface", icon: <Eye className="w-3 h-3" /> }
            ];
        } else if (lowerQuery.includes('interaction') || lowerQuery.includes('bond') || lowerQuery.includes('contact')) {
            content = "I can highlight the key interactions. There are 3 strong hydrogen bonds and a pi-stacking interaction with Trp215.";
            actions = [
                { label: "Show H-Bonds", action: "toggle_hbonds", icon: <Zap className="w-3 h-3" /> },
                { label: "Show All Contacts", action: "show_interactions", icon: <Zap className="w-3 h-3" /> }
            ];
        } else if (lowerQuery.includes('style') || lowerQuery.includes('render') || lowerQuery.includes('look')) {
            content = "I can change the rendering style for you. The 'Cinematic' quality with 'Realistic' style is great for presentations.";
            actions = [
                { label: "Apply Cinematic", action: "set_cinematic", icon: <Sparkles className="w-3 h-3" /> },
                { label: "Switch to X-Ray", action: "set_xray", icon: <Eye className="w-3 h-3" /> }
            ];
        } else if (lowerQuery.includes('report') || lowerQuery.includes('summary')) {
            content = "I can generate a comprehensive report of this structure, including the binding affinity analysis and interaction profile.";
            actions = [
                { label: "Generate PDF", action: "export_pdf", icon: <MessageSquare className="w-3 h-3" /> }
            ];
        }

        return {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content,
            timestamp: new Date(),
            actions
        };
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'w-96' : 'w-auto'}`}>
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                    >
                        <Button
                            onClick={() => setIsOpen(true)}
                            className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white p-0 flex items-center justify-center"
                        >
                            <Sparkles className="w-6 h-6" />
                        </Button>
                    </motion.div>
                )}

                {isOpen && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ height: isExpanded ? '600px' : '450px' }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-sm">AI Chemist</h3>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-xs text-slate-500">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] rounded-2xl p-3 ${msg.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-br-none'
                                                : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed">{msg.content}</p>

                                            {msg.actions && msg.actions.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {msg.actions.map((action, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => onAction(action.action)}
                                                            className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${msg.role === 'user'
                                                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                                                    : 'bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 shadow-sm'
                                                                }`}
                                                        >
                                                            {action.icon}
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <span className={`text-[10px] mt-1 block opacity-70 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'
                                                }`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {isThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 rounded-2xl rounded-bl-none p-3 flex items-center gap-1">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-3 border-t border-slate-200 bg-white">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask about the structure..."
                                    className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || isThinking}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
