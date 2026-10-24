import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FlaskConical,
    GitBranch,
    ChevronRight,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Beaker,
    DollarSign,
    Clock,
    TrendingUp,
    Zap,
    Info,
    Download,
    Edit,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionStep {
    id: string;
    stepNumber: number;
    reaction: string;
    reagents: string[];
    conditions: string;
    yield: number;
    difficulty: 'easy' | 'medium' | 'hard';
    cost: number;
    time: string;
    availability: 'common' | 'specialty' | 'exotic';
}

interface SynthesisRoute {
    id: string;
    name: string;
    totalSteps: number;
    overallYield: number;
    totalCost: number;
    totalTime: string;
    difficulty: string;
    steps: ReactionStep[];
    score: number;
}

export function RetrosynthesisPlanner() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<number>(0);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

    // Mock synthesis routes - in production, these would come from AI retrosynthesis models
    const routes: SynthesisRoute[] = [
        {
            id: 'route-1',
            name: 'Direct Amide Coupling Route',
            totalSteps: 3,
            overallYield: 72,
            totalCost: 1250,
            totalTime: '4 days',
            difficulty: 'Easy',
            score: 92,
            steps: [
                {
                    id: 'step-1-1',
                    stepNumber: 1,
                    reaction: 'Amine Protection',
                    reagents: ['Boc2O', 'TEA', 'DCM'],
                    conditions: '0°C → RT, 2h',
                    yield: 95,
                    difficulty: 'easy',
                    cost: 120,
                    time: '2h',
                    availability: 'common'
                },
                {
                    id: 'step-1-2',
                    stepNumber: 2,
                    reaction: 'Amide Coupling',
                    reagents: ['EDC·HCl', 'HOBt', 'DIPEA', 'DMF'],
                    conditions: 'RT, 16h',
                    yield: 82,
                    difficulty: 'easy',
                    cost: 450,
                    time: '16h',
                    availability: 'common'
                },
                {
                    id: 'step-1-3',
                    stepNumber: 3,
                    reaction: 'Deprotection',
                    reagents: ['TFA', 'DCM'],
                    conditions: 'RT, 1h',
                    yield: 92,
                    difficulty: 'easy',
                    cost: 680,
                    time: '1h',
                    availability: 'common'
                }
            ]
        },
        {
            id: 'route-2',
            name: 'Reductive Amination Route',
            totalSteps: 4,
            overallYield: 65,
            totalCost: 1850,
            totalTime: '6 days',
            difficulty: 'Medium',
            score: 78,
            steps: [
                {
                    id: 'step-2-1',
                    stepNumber: 1,
                    reaction: 'Aldehyde Formation',
                    reagents: ['PCC', 'DCM', 'Celite'],
                    conditions: 'RT, 3h',
                    yield: 88,
                    difficulty: 'medium',
                    cost: 350,
                    time: '3h',
                    availability: 'common'
                },
                {
                    id: 'step-2-2',
                    stepNumber: 2,
                    reaction: 'Reductive Amination',
                    reagents: ['NaBH(OAc)3', 'MeOH', 'AcOH'],
                    conditions: 'RT, 12h',
                    yield: 75,
                    difficulty: 'medium',
                    cost: 720,
                    time: '12h',
                    availability: 'specialty'
                },
                {
                    id: 'step-2-3',
                    stepNumber: 3,
                    reaction: 'Cyclization',
                    reagents: ['K2CO3', 'DMF'],
                    conditions: '80°C, 8h',
                    yield: 82,
                    difficulty: 'medium',
                    cost: 480,
                    time: '8h',
                    availability: 'common'
                },
                {
                    id: 'step-2-4',
                    stepNumber: 4,
                    reaction: 'Final Purification',
                    reagents: ['Silica gel', 'EtOAc/Hexanes'],
                    conditions: 'Column chromatography',
                    yield: 96,
                    difficulty: 'easy',
                    cost: 300,
                    time: '4h',
                    availability: 'common'
                }
            ]
        }
    ];

    const toggleStep = (stepId: string) => {
        setExpandedSteps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stepId)) {
                newSet.delete(stepId);
            } else {
                newSet.add(stepId);
            }
            return newSet;
        });
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'hard': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getAvailabilityIcon = (availability: string) => {
        switch (availability) {
            case 'common': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'specialty': return <AlertCircle className="w-4 h-4 text-orange-500" />;
            case 'exotic': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <AlertCircle className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <GitBranch className="w-6 h-6 text-green-600" />
                        Retrosynthesis Planner
                    </h2>
                    <p className="text-slate-500">AI-driven synthesis route optimization</p>
                </div>
                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm px-4 py-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI-Optimized
                </Badge>
            </div>

            {/* Route Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route, idx) => (
                    <motion.div
                        key={route.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card
                            className={`cursor-pointer transition-all ${selectedRoute === idx
                                    ? 'border-2 border-green-500 shadow-lg'
                                    : 'border hover:border-green-300 hover:shadow-md'
                                }`}
                            onClick={() => setSelectedRoute(idx)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Badge className={`${idx === 0 ? 'bg-green-500' : 'bg-blue-500'
                                                } text-white text-xs`}>
                                                Route {idx + 1}
                                            </Badge>
                                            {route.name}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            {route.totalSteps} steps · {route.totalTime} · ${route.totalCost}
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-600">{route.score}</div>
                                        <div className="text-xs text-slate-500">AI Score</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="text-center">
                                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
                                        <div className="text-sm font-bold text-slate-900">{route.overallYield}%</div>
                                        <div className="text-xs text-slate-500">Yield</div>
                                    </div>
                                    <div className="text-center">
                                        <DollarSign className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                                        <div className="text-sm font-bold text-slate-900">${route.totalCost}</div>
                                        <div className="text-xs text-slate-500">Cost</div>
                                    </div>
                                    <div className="text-center">
                                        <Clock className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                                        <div className="text-sm font-bold text-slate-900">{route.totalTime}</div>
                                        <div className="text-xs text-slate-500">Time</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={getDifficultyColor(route.difficulty.toLowerCase())}>
                                    {route.difficulty} Synthesis
                                </Badge>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Steps */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Synthesis Pathway: Route {selectedRoute + 1}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Route
                            </Button>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export Protocol
                            </Button>
                        </div>
                    </CardTitle>
                    <CardDescription>
                        Click on each step to view detailed reaction conditions and reagent information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {routes[selectedRoute].steps.map((step, idx) => {
                            const isExpanded = expandedSteps.has(step.id);
                            const isLastStep = idx === routes[selectedRoute].steps.length - 1;

                            return (
                                <div key={step.id} className="relative">
                                    {/* Connection Line */}
                                    {!isLastStep && (
                                        <div className="absolute left-4 top-16 bottom-0 w-0.5 bg-gradient-to-b from-green-300 to-transparent" />
                                    )}

                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card
                                            className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500"
                                            onClick={() => toggleStep(step.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                                                                {step.stepNumber}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900">{step.reaction}</h4>
                                                                <p className="text-xs text-slate-500">{step.conditions}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 ml-11 text-sm">
                                                            <div className="flex items-center gap-1">
                                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                                <span className="font-bold text-green-600">{step.yield}%</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <DollarSign className="w-4 h-4 text-blue-600" />
                                                                <span className="font-mono">${step.cost}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4 text-purple-600" />
                                                                <span>{step.time}</span>
                                                            </div>
                                                            <Badge variant="outline" className={getDifficultyColor(step.difficulty)}>
                                                                {step.difficulty}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {getAvailabilityIcon(step.availability)}
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                                        ) : (
                                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="ml-11 mt-4 pt-4 border-t border-slate-100"
                                                        >
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <h5 className="text-sm font-semibold text-slate-700 mb-2">Reagents & Solvents</h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {step.reagents.map((reagent, i) => (
                                                                            <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                                <Beaker className="w-3 h-3 mr-1" />
                                                                                {reagent}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                                        <div className="text-xs text-slate-500 mb-1">Reagent Availability</div>
                                                                        <div className="font-medium text-slate-900 capitalize">{step.availability}</div>
                                                                    </div>
                                                                    <div className="bg-slate-50 p-3 rounded-lg">
                                                                        <div className="text-xs text-slate-500 mb-1">Safety Considerations</div>
                                                                        <div className="font-medium text-slate-900">
                                                                            {step.difficulty === 'easy' ? 'Standard precautions' :
                                                                                step.difficulty === 'medium' ? 'Inert atmosphere required' :
                                                                                    'Specialized equipment'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <Sparkles className="w-8 h-8 text-green-600 shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-green-900 mb-2">AI Optimization Insights</h3>
                            <div className="space-y-2 text-sm text-green-800">
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold shrink-0">✓</span>
                                    <span><strong>Route 1 (Recommended):</strong> Higher overall yield with all common reagents. Suitable for scale-up to 100g+ batch sizes.</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold shrink-0">⚠</span>
                                    <span><strong>Route 2:</strong> Reductive amination in Step 2 may require optimization. Consider screening alternative reducing agents (NaBH4, LiBH4).</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-blue-600 font-bold shrink-0">ⓘ</span>
                                    <span><strong>Alternative Path:</strong> A convergent synthesis starting from commercially available intermediate X could reduce step count by 1.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Info Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-bold mb-1">About Retrosynthesis AI</p>
                    <p>
                        Routes generated using a trained model on 10M+ reactions from Reaxys and USPTO databases.
                        The AI considers yield, cost, reagent availability, and reaction complexity to rank pathways.
                    </p>
                </div>
            </div>
        </div>
    );
}
