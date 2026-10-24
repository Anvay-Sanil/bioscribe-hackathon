'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Scissors } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CRISPRDesignPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runDesign = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/rna/crispr-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_gene: 'TP53',
                    genome_sequence: 'ATGGAGGAGCCGCAGTCAGAT',
                    edit_type: 'knockout'
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">CRISPR Guide Design</h1>
                        <p className="text-xl font-light text-slate-600">Deep learning-based guide RNA design</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60">
                    <CardContent className="p-8">
                        <button onClick={runDesign} disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl">
                            {isRunning ? 'Designing Guide RNAs...' : 'Design CRISPR Guides'}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {results.guides?.map((guide: any, idx: number) => (
                            <Card key={idx} className="border-none shadow-xl bg-white/60">
                                <CardHeader>
                                    <CardTitle className="flex justify-between">
                                        <span>Guide RNA #{idx + 1}</span>
                                        <span className="font-mono text-lg">Chr{guide.chromosome}:{guide.position}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="font-mono text-sm mb-4 p-4 bg-violet-50 rounded-xl">{guide.sequence}</div>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                            <div className="text-xs text-slate-600 mb-1">On-Target</div>
                                            <div className="text-2xl font-light">{(guide.on_target_score * 100).toFixed(0)}%</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                            <div className="text-xs text-slate-600 mb-1">Off-Target</div>
                                            <div className="text-2xl font-light">{guide.off_target_sites}</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                            <div className="text-xs text-slate-600 mb-1">Efficiency</div>
                                            <div className="text-2xl font-light">{(guide.efficiency_score * 100).toFixed(0)}%</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                            <div className="text-xs text-slate-600 mb-1">Specificity</div>
                                            <div className="text-2xl font-light">{(guide.specificity_score * 100).toFixed(0)}%</div>
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
