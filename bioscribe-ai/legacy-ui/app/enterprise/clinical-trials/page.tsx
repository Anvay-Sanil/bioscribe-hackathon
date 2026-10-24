'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Download, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClinicalTrialsPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [formData, setFormData] = useState({
        drug_candidates: ['DRUG_001', 'DRUG_002'],
        endpoints: ['Overall Response Rate', 'Progression-Free Survival']
    });

    const runOptimization = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/ai/optimize-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drug_candidates: formData.drug_candidates,
                    patient_population: {},
                    endpoints: formData.endpoints
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">Clinical Trial Optimization</h1>
                        <p className="text-xl font-light text-slate-600">AI-powered adaptive trial design</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl font-light">Trial Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <button onClick={runOptimization} disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl shadow-violet-500/50">
                            {isRunning ? 'Optimizing...' : 'Optimize Trial Design'}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div className="grid grid-cols-4 gap-6">
                            {[
                                { label: 'Sample Size', value: results.sample_size, icon: Users },
                                { label: 'Estimated Cost', value: `$${(results.estimated_cost_millions || 0).toFixed(1)}M`, icon: DollarSign },
                                { label: 'Duration', value: `${results.duration_months} mo`, icon: Calendar },
                                { label: 'Success Prob', value: `${(results.success_probability * 100).toFixed(0)}%`, icon: TrendingUp }
                            ].map((stat, idx) => (
                                <Card key={idx} className="border-none shadow-xl bg-white/60">
                                    <CardContent className="p-6 text-center">
                                        <stat.icon className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                                        <div className="text-3xl font-light mb-1">{stat.value}</div>
                                        <div className="text-sm font-light text-slate-600">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-2xl font-light">Trial Design</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                        <div className="font-normal text-slate-900 mb-2">Design Type: {results.design_type}</div>
                                        <div className="text-sm text-slate-600">{results.design_rationale}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-violet-50">
                                            <div className="text-sm text-slate-600 mb-1">Phase</div>
                                            <div className="text-2xl font-light">{results.recommended_phase}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-fuchsia-50">
                                            <div className="text-sm text-slate-600 mb-1">Arms</div>
                                            <div className="text-2xl font-light">{results.number_of_arms}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
