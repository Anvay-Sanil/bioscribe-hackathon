'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pill } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function mRNATherapeuticsPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runDesign = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/rna/mrna-therapeutic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    protein_target: 'Insulin',
                    protein_sequence: 'MALWMRLLPLLALLALWGPDPAA'
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">mRNA Therapeutics Design</h1>
                        <p className="text-xl font-light text-slate-600">Optimized mRNA for protein expression</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60">
                    <CardContent className="p-8">
                        <button onClick={runDesign} disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl">
                            {isRunning ? 'Designing mRNA...' : 'Design mRNA Therapeutic'}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle>Optimized mRNA Sequence</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="font-mono text-xs mb-4 p-4 bg-violet-50 rounded-xl break-all">
                                    {results.optimized_sequence}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                        <div className="text-sm text-slate-600 mb-1">Codon Optim</div>
                                        <div className="text-2xl font-light">{(results.codon_optimization_score * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                        <div className="text-sm text-slate-600 mb-1">Stability</div>
                                        <div className="text-2xl font-light">{results.predicted_stability.toFixed(1)}/10</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                        <div className="text-sm text-slate-600 mb-1">Expression</div>
                                        <div className="text-2xl font-light">{results.expression_level}×</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-2xl font-light">UTR Designs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-violet-50">
                                        <div className="text-sm text-slate-600 mb-2">5' UTR</div>
                                        <div className="font-mono text-sm">{results.utr_designs?.['5_prime']}</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-fuchsia-50">
                                        <div className="text-sm text-slate-600 mb-2">3' UTR</div>
                                        <div className="font-mono text-sm">{results.utr_designs?.['3_prime']}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-2xl font-light">Formulation Guidance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {results.formulation_recommendations?.map((rec: string, idx: number) => (
                                        <div key={idx} className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 text-sm">
                                            {rec}
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
