'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Atom, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeNovoDesignPage() {
    const [results, setResults] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);

    const runDesign = async () => {
        setIsRunning(true);
        try {
            // Using novel molecules endpoint for de novo design
            const response = await fetch('http://localhost:8000/api/ai/generate-novel-molecules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_properties: { molecular_weight: 350, logp: 2.5 },
                    num_molecules: 50,
                    novelty_threshold: 0.7
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">De Novo Molecular Design</h1>
                        <p className="text-xl font-light text-slate-600">AI-generated molecules from scratch</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60">
                    <CardContent className="p-8">
                        <button onClick={runDesign} disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl">
                            {isRunning ? 'Generating Molecules...' : 'Generate De Novo Molecules'}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="grid grid-cols-4 gap-6">
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <Atom className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                                    <div className="text-3xl font-light">{results.molecules?.length || 0}</div>
                                    <div className="text-sm text-slate-600">Generated</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <Sparkles className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                                    <div className="text-3xl font-light">{(results.avg_novelty * 100 || 0).toFixed(0)}%</div>
                                    <div className="text-sm text-slate-600">Novelty</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-light">{(results.avg_qed || 0).toFixed(2)}</div>
                                    <div className="text-sm text-slate-600">QED Score</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-light">{results.synthesizable_count || 0}</div>
                                    <div className="text-sm text-slate-600">Synthesizable</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle>Top Candidates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {results.molecules?.slice(0, 10).map((mol: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                            <div className="font-mono text-sm mb-2">{mol.smiles}</div>
                                            <div className="flex gap-4 text-sm">
                                                <span>MW: {mol.properties.molecular_weight.toFixed(1)}</span>
                                                <span>LogP: {mol.properties.logp.toFixed(2)}</span>
                                                <span>QED: {mol.qed_score.toFixed(2)}</span>
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
