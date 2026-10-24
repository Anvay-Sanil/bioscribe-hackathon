'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Download, TrendingUp, Database, Brain, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TargetDiscoveryPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>({
        targets: [
            {
                target_name: 'PD-L1',
                gene_id: 'CD274',
                novelty_score: 0.85,
                druggability_score: 0.92,
                disease_relevance_score: 0.88,
                pathways: ['Immune checkpoint', 'T-cell regulation', 'Cancer immunity']
            },
            {
                target_name: 'KRAS G12C',
                gene_id: 'KRAS',
                novelty_score: 0.78,
                druggability_score: 0.75,
                disease_relevance_score: 0.95,
                pathways: ['MAPK signaling', 'Cell proliferation', 'RAS pathway']
            },
            {
                target_name: 'IDH1 R132H',
                gene_id: 'IDH1',
                novelty_score: 0.92,
                druggability_score: 0.88,
                disease_relevance_score: 0.85,
                pathways: ['Metabolism', 'Epigenetic regulation', 'Oncogenesis']
            },
            {
                target_name: 'FGFR3',
                gene_id: 'FGFR3',
                novelty_score: 0.70,
                druggability_score: 0.90,
                disease_relevance_score: 0.82,
                pathways: ['RTK signaling', 'Cell growth', 'Angiogenesis']
            },
            {
                target_name: 'CDK4/6',
                gene_id: 'CDK4',
                novelty_score: 0.65,
                druggability_score: 0.95,
                disease_relevance_score: 0.90,
                pathways: ['Cell cycle', 'G1/S transition', 'Proliferation']
            }
        ],
        avg_novelty_score: 0.78,
        avg_druggability_score: 0.88,
        total_clinical_trials: 247,
        pathway_analysis: [
            {
                pathway_name: 'Immune checkpoint regulation',
                target_count: 3,
                p_value: 0.00012
            },
            {
                pathway_name: 'Cell cycle control',
                target_count: 2,
                p_value: 0.00045
            },
            {
                pathway_name: 'Metabolic reprogramming',
                target_count: 2,
                p_value: 0.0018
            }
        ]
    });
    const [formData, setFormData] = useState({
        disease_name: 'cancer',
        num_targets: 10,
        novelty_threshold: 0.6
    });

    const runDiscovery = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/ai/discover-targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('API Error:', error);
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">AI-Powered Target Discovery</h1>
                        <p className="text-xl font-light text-slate-600">Discover novel drug targets using multi-omics AI analysis</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl font-light">Discovery Parameters</CardTitle>
                        <CardDescription>Configure your target discovery search</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <label className="block text-sm font-light text-slate-600 mb-2">Disease/Indication</label>
                            <input
                                type="text"
                                value={formData.disease_name}
                                onChange={(e) => setFormData({ ...formData, disease_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                placeholder="e.g., cancer, Alzheimer's, diabetes"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Number of Targets</label>
                                <input
                                    type="number"
                                    value={formData.num_targets}
                                    onChange={(e) => setFormData({ ...formData, num_targets: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                    min="1"
                                    max="50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Novelty Threshold (0-1)</label>
                                <input
                                    type="number"
                                    value={formData.novelty_threshold}
                                    onChange={(e) => setFormData({ ...formData, novelty_threshold: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                />
                            </div>
                        </div>

                        <button
                            onClick={runDiscovery}
                            disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {isRunning ? (
                                <>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                        <Brain className="w-5 h-5" />
                                    </motion.div>
                                    Running AI Analysis...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Discover Targets
                                </>
                            )}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
                        <div className="grid grid-cols-4 gap-6">
                            {[
                                { label: 'Targets Found', value: results.targets?.length || 0, icon: Database },
                                { label: 'Avg Novelty', value: (results.avg_novelty_score || 0).toFixed(2), icon: TrendingUp },
                                { label: 'Avg Druggability', value: (results.avg_druggability_score || 0).toFixed(2), icon: CheckCircle2 },
                                { label: 'Clinical Trials', value: results.total_clinical_trials || 0, icon: Brain }
                            ].map((stat, idx) => (
                                <Card key={idx} className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <stat.icon className="w-8 h-8 text-violet-600" />
                                            <div className="text-3xl font-light text-slate-900">{stat.value}</div>
                                        </div>
                                        <div className="text-sm font-light text-slate-600">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-3xl font-light">Discovered Targets</CardTitle>
                                    <CardDescription>Novel protein targets ranked by AI scoring</CardDescription>
                                </div>
                                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-lg flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="text-left py-4 px-4 font-normal text-slate-600">Rank</th>
                                                <th className="text-left py-4 px-4 font-normal text-slate-600">Target Name</th>
                                                <th className="text-left py-4 px-4 font-normal text-slate-600">Gene ID</th>
                                                <th className="text-right py-4 px-4 font-normal text-slate-600">Novelty</th>
                                                <th className="text-right py-4 px-4 font-normal text-slate-600">Druggability</th>
                                                <th className="text-right py-4 px-4 font-normal text-slate-600">Disease Score</th>
                                                <th className="text-left py-4 px-4 font-normal text-slate-600">Pathways</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.targets?.map((target: any, idx: number) => (
                                                <tr key={idx} className="border-b border-slate-100 hover:bg-violet-50/30 transition-colors">
                                                    <td className="py-4 px-4 font-mono text-slate-500">#{idx + 1}</td>
                                                    <td className="py-4 px-4 font-normal text-slate-900">{target.target_name}</td>
                                                    <td className="py-4 px-4 font-mono text-sm text-violet-600">{target.gene_id}</td>
                                                    <td className="py-4 px-4 text-right">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-normal ${target.novelty_score > 0.7 ? 'bg-emerald-100 text-emerald-700' :
                                                                target.novelty_score > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {target.novelty_score.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right font-mono text-sm">{target.druggability_score.toFixed(2)}</td>
                                                    <td className="py-4 px-4 text-right font-mono text-sm">{target.disease_relevance_score.toFixed(2)}</td>
                                                    <td className="py-4 px-4 text-sm text-slate-600">
                                                        {target.pathways.slice(0, 2).join(', ')}
                                                        {target.pathways.length > 2 && ` +${target.pathways.length - 2} more`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-6">
                            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-light">Pathway Analysis</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {results.pathway_analysis?.map((pathway: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                                                <span className="font-normal text-slate-900">{pathway.pathway_name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-600">{pathway.target_count} targets</span>
                                                    <span className="px-2 py-1 rounded-full bg-violet-600 text-white text-xs font-normal">
                                                        p&lt;{pathway.p_value.toExponential(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-light">Clinical Context</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-sm font-light text-slate-600 mb-1">Active Clinical Trials</div>
                                            <div className="text-3xl font-light text-slate-900">{results.total_clinical_trials || 0}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-light text-slate-600 mb-1">Success Probability</div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                                                        style={{ width: `${(results.avg_druggability_score || 0) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-sm text-slate-600">
                                                    {((results.avg_druggability_score || 0) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
