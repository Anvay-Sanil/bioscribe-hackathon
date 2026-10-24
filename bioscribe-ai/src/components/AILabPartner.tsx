import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Sparkles, Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AILabPartnerProps {
    onConfigComplete: (config: any) => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface PipelineConfig {
    targetName: string;
    targetType: 'protein' | 'dna' | 'rna';
    goal: 'inhibitor' | 'activator' | 'binder';
    pdbId?: string;
    sequence?: string;
    constraints: string[];
}

export function AILabPartner({ onConfigComplete }: AILabPartnerProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello! I'm your AI Lab Partner. Tell me what you'd like to discover today. For example: 'Design a high-affinity inhibitor for EGFR.'",
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Live Configuration State
    const [config, setConfig] = useState<PipelineConfig>({
        targetName: '',
        targetType: 'protein',
        goal: 'inhibitor',
        constraints: []
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const parseIntent = (text: string) => {
        const newConfig = { ...config };
        const lowerText = text.toLowerCase();

        // Simple keyword extraction (mocking NLP)
        if (lowerText.includes('egfr')) newConfig.targetName = 'EGFR';
        if (lowerText.includes('hiv')) newConfig.targetName = 'HIV-1 Protease';
        if (lowerText.includes('kras')) newConfig.targetName = 'KRAS';

        if (lowerText.includes('inhibitor')) newConfig.goal = 'inhibitor';
        if (lowerText.includes('activator')) newConfig.goal = 'activator';

        if (lowerText.includes('high affinity')) {
            if (!newConfig.constraints.includes('High Affinity')) newConfig.constraints.push('High Affinity');
        }
        if (lowerText.includes('oral')) {
            if (!newConfig.constraints.includes('Oral Bioavailability')) newConfig.constraints.push('Oral Bioavailability');
        }

        setConfig(newConfig);
        return newConfig;
    };

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

        // Parse intent immediately
        const updatedConfig = parseIntent(input);

        // Simulate AI thinking
        setTimeout(() => {
            let aiResponse = '';

            if (!updatedConfig.targetName) {
                aiResponse = "I see you're interested in drug design. What is your target protein?";
            } else if (!updatedConfig.pdbId && !updatedConfig.sequence) {
                aiResponse = `Great, targeting ${updatedConfig.targetName}. Do you have a specific PDB ID, or should I search the RCSB database for the best structure?`;
                // Auto-fill for demo purposes if they mention the target
                setConfig(prev => ({ ...prev, pdbId: 'Auto-select' }));
            } else {
                aiResponse = `Excellent. I've configured the pipeline for ${updatedConfig.targetName} (${updatedConfig.goal}). Ready to launch the analysis?`;
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
            {/* Chat Interface */}
            <Card className="lg:col-span-2 flex flex-col border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="w-5 h-5 text-blue-600" />
                        AI Lab Partner
                        <Badge variant="secondary" className="ml-auto bg-blue-50 text-blue-700">
                            Beta
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-5 h-5 text-blue-600" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-slate-600" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-slate-100 bg-white">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Describe your experiment..."
                                className="flex-1"
                            />
                            <Button type="submit" disabled={!input.trim() || isTyping}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            {/* Live Configuration Panel */}
            <Card className="border-slate-200 shadow-sm bg-slate-50/50">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase tracking-wider">
                        <Settings2 className="w-4 h-4" />
                        Live Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        {/* Target */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Target Protein</label>
                            <div className={`p-3 rounded-lg border ${config.targetName ? 'bg-white border-green-200 shadow-sm' : 'bg-slate-100 border-transparent border-dashed'}`}>
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium ${config.targetName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                                        {config.targetName || 'Waiting for input...'}
                                    </span>
                                    {config.targetName && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                </div>
                            </div>
                        </div>

                        {/* Goal */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Goal</label>
                            <div className="flex gap-2">
                                {['inhibitor', 'activator', 'binder'].map((type) => (
                                    <Badge
                                        key={type}
                                        variant={config.goal === type ? 'default' : 'outline'}
                                        className={`cursor-pointer capitalize ${config.goal === type ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-500'}`}
                                        onClick={() => setConfig(prev => ({ ...prev, goal: type as any }))}
                                    >
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Constraints */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Constraints</label>
                            <div className="min-h-[60px] p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                                {config.constraints.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {config.constraints.map((c, i) => (
                                            <Badge key={i} variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100">
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">No constraints detected</span>
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-4">
                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
                                disabled={!config.targetName}
                                onClick={() => onConfigComplete(config)}
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Launch Pipeline
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
