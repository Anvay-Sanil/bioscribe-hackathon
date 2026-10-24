'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Download, Sparkles, Atom, CheckCircle2, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NovelMoleculesPage() {
    const [isRunning, setIsRunning] = useState(false);

    // Initial mock results displayed immediately
    const [results, setResults] = useState<any>({
        molecules: [
            {
                smiles: 'CC(=O)Oc1ccccc1C(=O)O',
                novelty_score: 0.85,
                qed_score: 0.78,
                properties: { molecular_weight: 180.2, logp: 1.19, tpsa: 63.6 },
                admet_predictions: { absorption: 0.92, distribution: 0.75, metabolism: 0.68, excretion: 0.81, toxicity: 0.15 },
                synthetic_accessibility_score: 2.1,
                retrosynthesis_success: true,
                retrosynthesis_routes: 3
            },
            {
                smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
                novelty_score: 0.72,
                qed_score: 0.82,
                properties: { molecular_weight: 194.2, logp: -0.02, tpsa: 58.4 },
                admet_predictions: { absorption: 0.88, distribution: 0.72, metabolism: 0.75, excretion: 0.85, toxicity: 0.08 },
                synthetic_accessibility_score: 1.8,
                retrosynthesis_success: true,
                retrosynthesis_routes: 5
            },
            {
                smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
                novelty_score: 0.91,
                qed_score: 0.71,
                properties: { molecular_weight: 206.3, logp: 3.51, tpsa: 37.3 },
                admet_predictions: { absorption: 0.95, distribution: 0.82, metabolism: 0.65, excretion: 0.70, toxicity: 0.22 },
                synthetic_accessibility_score: 2.5,
                retrosynthesis_success: true,
                retrosynthesis_routes: 2
            }
        ],
        avg_novelty: 0.83,
        avg_qed: 0.77,
        synthesizable_count: 3,
        avg_tanimoto: 0.18,
        drug_like_percentage: 78,
        unique_scaffolds: 3
    });

    // Editable parameters with sliders
    const [formData, setFormData] = useState({
        molecular_weight: 400,
        logp: 3.0,
        tpsa: 90,
        num_molecules: 20,
        novelty_threshold: 0.8
    });

    const runGeneration = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/ai/generate-novel-molecules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_properties: {
                        molecular_weight: formData.molecular_weight,
                        logp: formData.logp,
                        tpsa: formData.tpsa
                    },
                    num_molecules: formData.num_molecules,
                    novelty_threshold: formData.novelty_threshold
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">Novel Molecule Generation</h1>
                        <p className="text-xl font-light text-slate-600">AI-assisted chemical space exploration with expert control</p>
                    </div>
                </div>

                {/* Interactive Controls */}
                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl font-light">Target Properties</CardTitle>
                        <CardDescription>Adjust parameters and regenerate molecules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* MW Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-light text-slate-600">Molecular Weight (Da)</label>
                                <span className="font-mono text-sm text-violet-600">{formData.molecular_weight}</span>
                            </div>
                            <input
                                type="range"
                                min="200"
                                max="600"
                                step="10"
                                value={formData.molecular_weight}
                                onChange={(e) => setFormData({ ...formData, molecular_weight: parseInt(e.target.value) })}
                                className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>

                        {/* LogP Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-light text-slate-600">LogP (Lipophilicity)</label>
                                <span className="font-mono text-sm text-violet-600">{formData.logp.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="6"
                                step="0.1"
                                value={formData.logp}
                                onChange={(e) => setFormData({ ...formData, logp: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* TPSA Slider */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-light text-slate-600">TPSA (Å²)</label>
                                <span className="font-mono text-sm text-violet-600">{formData.tpsa}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                step="5"
                                value={formData.tpsa}
                                onChange={(e) => setFormData({ ...formData, tpsa: parseInt(e.target.value) })}
                                className="w-full h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Number of Molecules</label>
                                <input
                                    type="number"
                                    value={formData.num_molecules}
                                    onChange={(e) => setFormData({ ...formData, num_molecules: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
                                    min="1"
                                    max="100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-light text-slate-600 mb-2">Novelty Threshold</label>
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
                            onClick={runGeneration}
                            disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {isRunning ? (
                                <>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                        <Sparkles className="w-5 h-5" />
                                    </motion.div>
                                    Generating Molecules...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Generate Molecules
                                </>
                            )}
                        </button>
                    </CardContent>
                </Card>

                {/* Results */}
                {results && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
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
                                    <div className="text-3xl font-light">{((results.avg_novelty || 0) * 100).toFixed(0)}%</div>
                                    <div className="text-sm text-slate-600">Avg Novelty</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <CheckCircle2 className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                                    <div className="text-3xl font-light">{(results.avg_qed || 0).toFixed(2)}</div>
                                    <div className="text-sm text-slate-600">Avg QED</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <div className="text-3xl font-light">{results.synthesizable_count || 0}</div>
                                    <div className="text-sm text-slate-600">Synthesizable</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-2xl bg-white/60">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-3xl font-light">Generated Molecules</CardTitle>
                                    <CardDescription>Click SMILES to edit manually</CardDescription>
                                </div>
                                <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-lg flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export SDF
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {results.molecules?.map((mol: any, idx: number) => (
                                        <div key={idx} className="p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 hover:border-violet-300 transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-sm font-mono">
                                                        MOL-{String(idx + 1).padStart(3, '0')}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-sm ${mol.novelty_score > 0.8 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        Novelty: {mol.novelty_score.toFixed(2)}
                                                    </span>
                                                </div>
                                                <button className="p-2 hover:bg-white rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4 text-violet-600" />
                                                </button>
                                            </div>

                                            <div className="font-mono text-sm text-slate-900 mb-4 p-3 bg-white/70 rounded-xl cursor-pointer hover:bg-white transition-colors">
                                                {mol.smiles}
                                            </div>

                                            <div className="grid grid-cols-6 gap-4 mb-4">
                                                <div>
                                                    <div className="text-xs text-slate-600">MW</div>
                                                    <div className="font-mono text-sm">{mol.properties.molecular_weight.toFixed(1)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-600">LogP</div>
                                                    <div className="font-mono text-sm">{mol.properties.logp.toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-600">TPSA</div>
                                                    <div className="font-mono text-sm">{mol.properties.tpsa.toFixed(1)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-600">QED</div>
                                                    <div className="font-mono text-sm">{mol.qed_score.toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-600">SA Score</div>
                                                    <div className="font-mono text-sm">{mol.synthetic_accessibility_score.toFixed(1)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-600">Routes</div>
                                                    <div className="font-mono text-sm">{mol.retrosynthesis_routes}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-5 gap-2">
                                                {Object.entries(mol.admet_predictions).map(([key, value]: [string, any]) => (
                                                    <div key={key} className="text-center p-2 bg-white/50 rounded-lg">
                                                        <div className="text-xs text-slate-600 capitalize">{key.slice(0, 3)}</div>
                                                        <div className={`text-sm font-mono ${value > 0.7 ? 'text-emerald-600' : value > 0.4 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                            {(value * 100).toFixed(0)}%
                                                        </div>
                                                    </div>
                                                ))}
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
