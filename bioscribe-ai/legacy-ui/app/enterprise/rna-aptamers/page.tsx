'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Dna } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RNAAptamersPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runDesign = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/rna/design-aptamer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_protein: 'HIV-1 Protease',
                    protein_sequence: 'PQITLWQRPLVTIKIGGQLK',
                    aptamer_length: 40
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">RNA Aptamer Design</h1>
                        <p className="text-xl font-light text-slate-600">SELEX-inspired computational design</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60">
                    <CardContent className="p-8">
                        <button onClick={runDesign} disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl">
                            {isRunning ? 'Designing Aptamers...' : 'Design Aptamers'}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {results.aptamers?.map((apt: any, idx: number) => (
                            <Card key={idx} className="border-none shadow-xl bg-white/60">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Aptamer #{idx + 1}</span>
                                        <span className="text-lg font-mono">Kd: {apt.predicted_kd} nM</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="font-mono text-sm mb-4 p-4 bg-violet-50 rounded-xl">{apt.sequence}</div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-slate-600">Stability</div>
                                            <div className="text-xl font-light">{apt.stability_score.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-600">Specificity</div>
                                            <div className="text-xl font-light">{apt.specificity_score.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-slate-600">GC Content</div>
                                            <div className="text-xl font-light">{(apt.gc_content * 100).toFixed(0)}%</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
