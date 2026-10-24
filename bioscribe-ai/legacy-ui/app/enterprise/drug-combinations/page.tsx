'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Download, FlaskConical, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DrugCombinationsPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState({
        drug_a_smiles: 'CCO',
        drug_b_smiles: 'CC(=O)O',
        disease_context: 'cancer'
    });

    const runAnalysis = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/ai/predict-drug-combination', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">Drug Combination Prediction</h1>
                        <p className="text-xl font-light text-slate-600">AI-powered synergy and interaction analysis</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl font-light">Drug Pair Configuration</CardTitle>
                        <CardDescription>Enter SMILES for both drugs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <label className="block text-sm font-light text-slate-600 mb-2">Drug A (SMILES)</label>
                            <input
                                type="text"
                                value={formData.drug_a_smiles}
                                onChange={(e) => setFormData({ ...formData, drug_a_smiles: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet -100 outline-none transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-light text-slate-600 mb-2">Drug B (SMILES)</label>
                            <input
                                type="text"
                                value={formData.drug_b_smiles}
                                onChange={(e) => setFormData({ ...formData, drug_b_smiles: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-light text-slate-600 mb-2">Disease Context</label>
                            <input
                                type="text"
                                value={formData.disease_context}
                                onChange={(e) => setFormData({ ...formData, disease_context: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                            />
                        </div>

                        <button
                            onClick={runAnalysis}
                            disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {isRunning ? (
                                <>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                        <FlaskConical className="w-5 h-5" />
                                    </motion.div>
                                    Analyzing Combination...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Predict Synergy
                                </>
                            )}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="grid grid-cols-3 gap-6">
                            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div className="text-5xl font-light mb-2">{results.synergy_score?.toFixed(2)}</div>
                                        <div className="text-sm font-light text-slate-600">Synergy Score</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div className={`text-2xl font-normal mb-2 ${results.interaction_type === 'synergistic' ? 'text-emerald-600' :
                                                results.interaction_type === 'antagonistic' ? 'text-red-600' :
                                                    'text-yellow-600'
                                            }`}>
                                            {results.interaction_type?.toUpperCase()}
                                        </div>
                                        <div className="text-sm font-light text-slate-600">Interaction Type</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-xl bg-white/60 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-light mb-2">{results.optimal_ratio || 'N/A'}</div>
                                        <div className="text-sm font-light text-slate-600">Optimal Dosing Ratio</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-2xl font-light">Pathway Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {results.pathway_crosstalk?.map((pathway: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-normal text-slate-900">{pathway.pathway_name}</span>
                                                <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-sm">
                                                    {pathway.impact_score.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-600">{pathway.mechanism}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {results.adverse_interactions && results.adverse_interactions.length > 0 && (
                            <Card className="border-none shadow-xl bg-red-50 border-2 border-red-200">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                        <CardTitle className="text-2xl font-light text-red-900">Safety Warnings</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {results.adverse_interactions.map((warning: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-xl bg-white/80">
                                                <div className="font-normal text-red-900 mb-1">{warning.interaction}</div>
                                                <div className="text-sm text-red-700">Risk: {warning.severity}</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
