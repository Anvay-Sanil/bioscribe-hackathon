import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Activity, AlertCircle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface InteractionData {
    type: string;
    residue: string;
    energy: number; // kcal/mol (negative is better)
    strength: 'Strong' | 'Medium' | 'Weak';
    description: string;
}

export function ExplainabilityPanel() {
    // Mock data for demonstration
    const interactions: InteractionData[] = [
        { type: 'Hydrogen Bond', residue: 'ASP-25', energy: -4.5, strength: 'Strong', description: 'Critical anchor point in the active site' },
        { type: 'Pi-Stacking', residue: 'PHE-42', energy: -3.2, strength: 'Medium', description: 'Stabilizes the aromatic ring structure' },
        { type: 'Hydrophobic', residue: 'VAL-84', energy: -2.1, strength: 'Medium', description: 'Contributes to core packing stability' },
        { type: 'Salt Bridge', residue: 'LYS-101', energy: -1.5, strength: 'Weak', description: 'Long-range electrostatic interaction' },
    ];

    const totalEnergy = interactions.reduce((acc, curr) => acc + curr.energy, 0);

    return (
        <div className="space-y-6 p-4 bg-slate-50/50 rounded-xl h-full overflow-y-auto">
            {/* Header Section */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-lg">
                    <Brain className="w-5 h-5" />
                    <h3>AI Reasoning Engine</h3>
                </div>
                <p className="text-sm text-slate-500">
                    Transparency report for Candidate BS-2024-X. Explaining the structural basis for high affinity.
                </p>
            </div>

            {/* Top Level Score Breakdown */}
            <Card className="border-purple-100 shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">Predicted Affinity</div>
                            <div className="text-3xl font-bold text-slate-900">{totalEnergy.toFixed(1)} <span className="text-sm font-normal text-slate-500">kcal/mol</span></div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            High Confidence (94%)
                        </Badge>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Contribution Breakdown</span>
                            <span>Key Drivers</span>
                        </div>
                        <div className="h-3 flex rounded-full overflow-hidden">
                            <div className="bg-blue-500 w-[40%]" title="H-Bonds (40%)" />
                            <div className="bg-purple-500 w-[30%]" title="Electrostatics (30%)" />
                            <div className="bg-orange-500 w-[20%]" title="Van der Waals (20%)" />
                            <div className="bg-slate-300 w-[10%]" title="Other (10%)" />
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-500 justify-center">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> H-Bonds</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Electrostatics</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" /> VdW</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Interactions List */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Key Interactions
                </h4>

                <div className="grid gap-3">
                    {interactions.map((interaction, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{interaction.residue}</div>
                                    <div className="text-xs text-blue-600 font-medium">{interaction.type}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-sm font-bold text-slate-900">{interaction.energy}</div>
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${interaction.strength === 'Strong' ? 'bg-green-50 text-green-700' :
                                        interaction.strength === 'Medium' ? 'bg-yellow-50 text-yellow-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {interaction.strength}
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700">
                                {interaction.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* AI Insight */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-purple-900 mb-1">Strategic Insight</h4>
                        <p className="text-xs text-purple-800 leading-relaxed">
                            The strong hydrogen bond with <span className="font-bold">ASP-25</span> mimics the natural substrate, while the hydrophobic interaction at <span className="font-bold">VAL-84</span> improves selectivity against homologous receptors. This profile suggests reduced off-target effects.
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning/Alert */}
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800">
                    <span className="font-bold">Note:</span> LYS-101 interaction is solvent-exposed. Consider modifying the R-group to improve metabolic stability.
                </p>
            </div>
        </div>
    );
}
