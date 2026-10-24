import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Target,
    Brain,
    Activity,
    Zap,
    ThumbsUp,
    ThumbsDown,
    HelpCircle,
    Sparkles,
    RefreshCw,
    BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PredictionFeedback {
    id: string;
    moleculeName: string;
    predictedAffinity: number;
    actualAffinity?: number;
    uncertainty: number;
    userFeedback?: 'correct' | 'incorrect' | 'unsure';
    confidenceScore: number;
}

export function ActiveLearningPanel() {
    const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
    const [isRetraining, setIsRetraining] = useState(false);
    const [modelVersion, setModelVersion] = useState(1);

    // Mock prediction data
    const predictions: PredictionFeedback[] = [
        {
            id: 'pred-1',
            moleculeName: 'Candidate BS-2024-001',
            predictedAffinity: -8.2,
            actualAffinity: -7.9,
            uncertainty: 0.8,
            userFeedback: 'correct',
            confidenceScore: 92
        },
        {
            id: 'pred-2',
            moleculeName: 'Candidate BS-2024-002',
            predictedAffinity: -6.5,
            actualAffinity: undefined,
            uncertainty: 2.3,
            userFeedback: undefined,
            confidenceScore: 54
        },
        {
            id: 'pred-3',
            moleculeName: 'Candidate BS-2024-003',
            predictedAffinity: -9.1,
            actualAffinity: -8.8,
            uncertainty: 1.1,
            userFeedback: 'correct',
            confidenceScore: 85
        },
        {
            id: 'pred-4',
            moleculeName: 'Candidate BS-2024-004',
            predictedAffinity: -7.3,
            actualAffinity: undefined,
            uncertainty: 3.2,
            userFeedback: undefined,
            confidenceScore: 41
        },
    ];

    const modelMetrics = {
        totalPredictions: 147,
        validatedPredictions: 89,
        accuracy: 87.6,
        mae: 0.92, // Mean Absolute Error
        r2: 0.84,
        improvementSinceV1: 12.3
    };

    const handleFeedback = (predId: string, feedback: 'correct' | 'incorrect' | 'unsure') => {
        // In production, this would update the backend
        console.log(`Feedback for ${predId}: ${feedback}`);
    };

    const handleRetrain = () => {
        setIsRetraining(true);
        setTimeout(() => {
            setIsRetraining(false);
            setModelVersion(prev => prev + 1);
        }, 3000);
    };

    const getUncertaintyColor = (uncertainty: number) => {
        if (uncertainty < 1.5) return 'text-green-600 bg-green-50 border-green-200';
        if (uncertainty < 2.5) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'bg-green-500';
        if (confidence >= 60) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <RefreshCw className="w-6 h-6 text-emerald-600" />
                        Active Learning Dashboard
                    </h2>
                    <p className="text-slate-500">Improve AI models through experimental feedback</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-600 text-white text-sm px-3 py-1">
                        Model v{modelVersion}
                    </Badge>
                    <Button
                        onClick={handleRetrain}
                        disabled={isRetraining}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                    >
                        {isRetraining ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Retraining...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Retrain Model
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Model Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="w-8 h-8 text-emerald-600" />
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{modelMetrics.accuracy}%</div>
                                <div className="text-xs text-slate-500">Accuracy</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <TrendingUp className="w-3 h-3" />
                            +{modelMetrics.improvementSinceV1}% since v1
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="w-8 h-8 text-blue-600" />
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{modelMetrics.mae}</div>
                                <div className="text-xs text-slate-500">MAE (kcal/mol)</div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500">Mean Absolute Error</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <BarChart3 className="w-8 h-8 text-purple-600" />
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{modelMetrics.r2}</div>
                                <div className="text-xs text-slate-500">R² Score</div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500">Model Fit Quality</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{modelMetrics.validatedPredictions}</div>
                                <div className="text-xs text-slate-500">Validated</div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500">of {modelMetrics.totalPredictions} total</div>
                    </CardContent>
                </Card>
            </div>

            {/* Prediction Feedback Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Predictions Awaiting Validation</CardTitle>
                        <CardDescription>
                            Provide feedback to improve model accuracy
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {predictions.map((pred, idx) => (
                                <motion.div
                                    key={pred.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Card
                                        className={`transition-all hover:shadow-md ${selectedPrediction === pred.id ? 'border-2 border-emerald-500' : 'border'
                                            }`}
                                        onClick={() => setSelectedPrediction(pred.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 mb-1">{pred.moleculeName}</h4>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="text-slate-600">
                                                            Predicted: <span className="font-mono font-bold text-blue-600">{pred.predictedAffinity}</span> kcal/mol
                                                        </span>
                                                        {pred.actualAffinity && (
                                                            <span className="text-slate-600">
                                                                Actual: <span className="font-mono font-bold text-green-600">{pred.actualAffinity}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Confidence Bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span>Confidence</span>
                                                    <span>{pred.confidenceScore}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${getConfidenceColor(pred.confidenceScore)}`}
                                                        style={{ width: `${pred.confidenceScore}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Uncertainty Badge */}
                                            <Badge variant="outline" className={`mb-3 ${getUncertaintyColor(pred.uncertainty)}`}>
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Uncertainty: ±{pred.uncertainty} kcal/mol
                                            </Badge>

                                            {/* Feedback Buttons */}
                                            {!pred.userFeedback && !pred.actualAffinity && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 border-green-200 hover:bg-green-50"
                                                        onClick={(e) => { e.stopPropagation(); handleFeedback(pred.id, 'correct'); }}
                                                    >
                                                        <ThumbsUp className="w-3 h-3 mr-1" />
                                                        Correct
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 border-red-200 hover:bg-red-50"
                                                        onClick={(e) => { e.stopPropagation(); handleFeedback(pred.id, 'incorrect'); }}
                                                    >
                                                        <ThumbsDown className="w-3 h-3 mr-1" />
                                                        Incorrect
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 border-slate-200"
                                                        onClick={(e) => { e.stopPropagation(); handleFeedback(pred.id, 'unsure'); }}
                                                    >
                                                        <HelpCircle className="w-3 h-3 mr-1" />
                                                        Unsure
                                                    </Button>
                                                </div>
                                            )}

                                            {pred.userFeedback && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    {pred.userFeedback === 'correct' && (
                                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Marked as Correct
                                                        </Badge>
                                                    )}
                                                    {pred.userFeedback === 'incorrect' && (
                                                        <Badge className="bg-red-100 text-red-700 border-red-200">
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Marked as Incorrect
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Uncertainty Prioritization */}
                <Card>
                    <CardHeader>
                        <CardTitle>Suggested Next Experiments</CardTitle>
                        <CardDescription>
                            AI recommends testing these high-uncertainty candidates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {predictions
                                .filter(p => !p.actualAffinity)
                                .sort((a, b) => b.uncertainty - a.uncertainty)
                                .slice(0, 3)
                                .map((pred, idx) => (
                                    <Card key={pred.id} className="bg-orange-50 border-orange-200">
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-900 mb-1">{pred.moleculeName}</h4>
                                                    <p className="text-sm text-slate-600 mb-2">
                                                        High uncertainty (±{pred.uncertainty}) suggests this prediction needs validation
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-orange-500 text-white text-xs">
                                                            Priority {idx + 1}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">
                                                            Confidence: {pred.confidenceScore}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mt-4">
                                <div className="flex gap-3">
                                    <Brain className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div className="text-sm text-emerald-900">
                                        <p className="font-bold mb-1">Active Learning Strategy</p>
                                        <p className="text-xs leading-relaxed">
                                            Testing high-uncertainty predictions first maximizes information gain and accelerates model improvement. Each validation reduces uncertainty across similar molecules.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Training Progress */}
            {isRetraining && (
                <Card className="border-2 border-emerald-500 bg-emerald-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Retraining Model v{modelVersion + 1}</h3>
                                <p className="text-sm text-slate-600">Incorporating {modelMetrics.validatedPredictions} validated predictions</p>
                            </div>
                        </div>
                        <Progress value={67} className="h-2 mb-2" />
                        <p className="text-xs text-slate-500">Step 3/4: Hyperparameter optimization...</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
