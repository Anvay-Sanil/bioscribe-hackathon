'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Activity, Zap } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MDSimulationPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runSimulation = async () => {
        setIsRunning(true);
        try {
            const response = await fetch('http://localhost:8000/api/ai/run-md-simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    protein_structure: 'MKTIIALSYIFCLVFA',
                    ligand_smiles: 'CCO',
                    simulation_time_ns: 100
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
                        <h1 className="text-5xl font-light text-slate-900 mb-2">Molecular Dynamics Simulation</h1>
                        <p className="text-xl font-light text-slate-600">AMBER force field trajectory analysis</p>
                    </div>
                </div>

                <Card className="mb-8 border-none shadow-2xl bg-white/60">
                    <CardContent className="p-8">
                        <button onClick={runSimulation} disabled={isRunning}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl">
                            {isRunning ? (
                                <>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="inline-block mr-2">
                                        <Activity className="w-5 h-5" />
                                    </motion.div>
                                    Running 100ns MD Simulation...
                                </>
                            ) : 'Run MD Simulation'}
                        </button>
                    </CardContent>
                </Card>

                {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div className="grid grid-cols-3 gap-6">
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl font-light mb-2">{results.binding_free_energy?.toFixed(2)}</div>
                                    <div className="text-sm text-slate-600">ΔG (kcal/mol)</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl font-light mb-2">{results.rmsd_average?.toFixed(2)}</div>
                                    <div className="text-sm text-slate-600">RMSD (Å)</div>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-xl bg-white/60">
                                <CardContent className="p-6 text-center">
                                    <div className="text-4xl font-light mb-2">{results.stability_score?.toFixed(1)}%</div>
                                    <div className="text-sm text-slate-600">Stability</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-xl bg-white/60">
                            <CardHeader>
                                <CardTitle className="text-2xl font-light">Key Interactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {results.key_interactions?.map((inter: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50">
                                            <div className="flex justify-between">
                                                <span className="font-mono text-sm">{inter.residue}</span>
                                                <span className="text-sm text-slate-600">{inter.interaction_type}</span>
                                                <span className="font-mono text-sm">{inter.distance.toFixed(2)} Å</span>
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
