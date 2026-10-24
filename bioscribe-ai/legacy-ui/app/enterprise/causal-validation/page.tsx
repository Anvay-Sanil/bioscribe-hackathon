'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Network } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CausalValidationPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runValidation = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/causal/target-validation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_gene: 'EGFR',
                    omics_data: {
                        expression: 2.5,
                        mutation: 'L858R'
                    }
                })
            });
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-12">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex items-center gap-6 mb-12">
                    <Link href="/dashboard">
                        <button className="p-2 rounded-xl hover:bg-white/50 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-5xl font-light text-slate-900 mb-2">Causal AI Validation</h1>
                        <p className="text-xl font-light text-slate-600">Causal inference for target validation</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60">
                    <CardContent className="p-8">
                        <button onClick={runValidation} disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl">
                            {isRunning ? 'Running Causal Analysis...' : 'Validate Target'}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <Card className="border-none shadow-2xl bg-white/60">
                            <CardContent className="p-8 text-center">
                                <div className="text-6xl font-light mb-4">{results.causal_score?.toFixed(2)}</div>
                                <div className="text-xl font-light text-slate-600">Causal Confidence Score</div>
                                <div className="mt-4 text-sm text-slate-500">95% CI: [{results.confidence_interval?.lower.toFixed(2)}, {results.confidence_interval?.upper.toFixed(2)}]</div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-2xl font-light">Causal Pathways</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {results.causal_pathways?.map((pathway: any, idx: number) => (
                                        <div key={idx} className="p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="font-normal text-slate-900 mb-1">{pathway.pathway_name}</div>
                                                    <div className="text-sm text-slate-600">{pathway.mechanism}</div>
                                                </div>
                                                <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-sm font-mono">
                                                    ATE: {pathway.average_treatment_effect.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <div className="text-xs text-slate-600">Effect Size</div>
                                                    <div className="font-mono text-sm">{pathway.effect_size.toFixed(3)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-600">P-value</div>
                                                    <div className="font-mono text-sm">{pathway.p_value.toExponential(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-2xl font-light">Intervention Predictions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {results.intervention_predictions?.map((pred: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-normal text-slate-900">{pred.intervention_type}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-slate-600">Expected Δ:</span>
                                                    <span className="font-mono text-sm text-slate-900">{pred.expected_change.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
