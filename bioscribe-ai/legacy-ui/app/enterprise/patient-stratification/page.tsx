'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Users, Target, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PatientStratificationPage() {
    const [isRunning, setIsRunning] = useState(false);

    // Initial mock results
    const [results, setResults] = useState<any>({
        stratification_group: 'High Response Group A',
        group_id: 'A',
        predicted_response: 0.85,
        confidence_score: 0.92,
        recommended_treatments: [
            {
                treatment_name: 'Pembrolizumab + Chemotherapy',
                mechanism: 'PD-1 inhibitor combined with platinum-based therapy',
                expected_response: 0.78,
                evidence_level: 'Level 1A',
                clinical_trials: 24,
                rationale: 'High PD-L1 expression (>75%) indicates strong likelihood of response to immune checkpoint inhibition'
            },
            {
                treatment_name: 'Nivolumab Monotherapy',
                mechanism: 'PD-1 checkpoint inhibitor',
                expected_response: 0.65,
                evidence_level: 'Level 1A',
                clinical_trials: 18,
                rationale: 'TMB-high status (>12 mut/Mb) correlates with improved outcomes on immunotherapy'
            }
        ],
        biomarker_profile: [
            { name: 'PD-L1', level: 0.75 },
            { name: 'TMB', level: 0.82 },
            { name: 'MSI Status', level: 0.90 },
            { name: 'EGFR', level: 0.30 }
        ],
        monitoring_protocols: [
            {
                test_name: 'CT Imaging',
                description: 'Monitor tumor response and progression',
                frequency: 'Every 6 weeks'
            },
            {
                test_name: 'Immune Panel',
                description: 'Track T-cell and cytokine levels',
                frequency: 'Every 3 weeks'
            }
        ]
    });

    // Editable biomarker inputs with sliders
    const [formData, setFormData] = useState({
        pdl1: 0.75,
        tmb: 12.5,
        msi_score: 0.90,
        age: 65,
        stage: 'III'
    });

    const runStratification = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/ai/stratify-patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    biomarkers: {
                        'PD-L1': formData.pdl1,
                        'TMB': formData.tmb,
                        'MSI': formData.msi_score
                    },
                    genomic_data: {},
                    clinical_features: {
                        age: formData.age,
                        stage: formData.stage
                    }
                })
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">Patient Stratification</h1>
                        <p className="text-xl font-light text-slate-600">AI-assisted precision medicine with expert biomarker control</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl font-light">Patient Biomarkers</CardTitle>
                        <CardDescription>Adjust biomarker levels and clinical features</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* PD-L1 Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-light text-slate-600">PD-L1 Expression (0-1)</label>
                                <span className="font-mono text-sm text-violet-600">{(formData.pdl1 * 100).toFixed(0)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={formData.pdl1}
                                onChange={(e) => setFormData({ ...formData, pdl1: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* TMB Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-light text-slate-600">Tumor Mutational Burden (mut/Mb)</label>
                                <span className="font-mono text-sm text-violet-600">{formData.tmb.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="30"
                                step="0.5"
                                value={formData.tmb}
                                onChange={(e) => setFormData({ ...formData, tmb: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* MSI Score Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-light text-slate-600">MSI Score (0-1)</label>
                                <span className="font-mono text-sm text-violet-600">{formData.msi_score.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={formData.msi_score}
                                onChange={(e) => setFormData({ ...formData, msi_score: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Age (years)</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                    min="18"
                                    max="120"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Disease Stage</label>
                                <select
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all bg-white"
                                >
                                    <option value="I">Stage I</option>
                                    <option value="II">Stage II</option>
                                    <option value="III">Stage III</option>
                                    <option value="IV">Stage IV</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={runStratification}
                            disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {isRunning ? (
                                <>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                        <Users className="w-5 h-5" />
                                    </motion.div>
                                    Analyzing Patient Profile...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Stratify Patient
                                </>
                            )}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <Card className="border-none shadow-2xl bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-3xl font-light">Stratification Result</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="p-8 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border-2 border-violet-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="text-sm font-light text-slate-600 mb-1">Assigned Group</div>
                                            <div className="text-4xl font-light text-slate-900">{results.stratification_group}</div>
                                        </div>
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                                            <span className="text-3xl font-light text-white">{results.group_id}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <div className="text-sm font-light text-slate-600 mb-2">Response Prediction</div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                                                        style={{ width: `${(results.predicted_response || 0) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-lg text-slate-900">
                                                    {((results.predicted_response || 0) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-sm font-light text-slate-600 mb-2">Confidence</div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-3 bg-white/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                                                        style={{ width: `${(results.confidence_score || 0) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono text-lg text-slate-900">
                                                    {((results.confidence_score || 0) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-light">Recommended Treatments</CardTitle>
                                </div>
                                <Target className="w-8 h-8 text-violet-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {results.recommended_treatments?.map((treatment: any, idx: number) => (
                                        <div key={idx} className="p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="text-lg font-normal text-slate-900 mb-1">{treatment.treatment_name}</div>
                                                    <div className="text-sm font-light text-slate-600">{treatment.mechanism}</div>
                                                </div>
                                                <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-sm font-normal">
                                                    Rank #{idx + 1}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <div className="text-xs font-light text-slate-600 mb-1">Expected Response</div>
                                                    <div className="font-mono text-sm text-slate-900">{(treatment.expected_response * 100).toFixed(0)}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-light text-slate-600 mb-1">Evidence Level</div>
                                                    <div className="text-sm text-slate-900">{treatment.evidence_level}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs font-light text-slate-600 mb-1">Clinical Trials</div>
                                                    <div className="text-sm text-slate-900">{treatment.clinical_trials} active</div>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-violet-200">
                                                <div className="text-xs font-light text-slate-600 mb-2">Biomarker Rationale</div>
                                                <div className="text-sm text-slate-700">{treatment.rationale}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-6">
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-light">Biomarker Profile</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {results.biomarker_profile?.map((bio: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                                <span className="font-normal text-slate-900">{bio.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-32 h-2 bg-white/50 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${bio.level > 0.7 ? 'bg-emerald-500' :
                                                                    bio.level > 0.4 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                }`}
                                                            style={{ width: `${bio.level * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-mono text-sm text-slate-600">{bio.level.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-xl bg-white/60">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-light">Monitoring Protocol</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {results.monitoring_protocols?.map((protocol: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <Activity className="w-5 h-5 text-violet-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="font-normal text-slate-900 mb-1">{protocol.test_name}</div>
                                                        <div className="text-sm font-light text-slate-600">{protocol.description}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-violet-200">
                                                    <span className="text-slate-600">Frequency:</span>
                                                    <span className="font-normal text-slate-900">{protocol.frequency}</span>
                                                </div>
                                            </div>
                                        ))}
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
