import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FlaskConical, DollarSign, Clock, AlertTriangle, CheckCircle2, Beaker, Truck, Factory } from 'lucide-react';
import { motion } from 'framer-motion';
import { RetrosynthesisPlanner } from './RetrosynthesisPlanner';

export function WetLabSimulation() {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationStep, setSimulationStep] = useState(0);

    const synthesisSteps = [
        { name: 'Retrosynthetic Analysis', duration: '2h', status: 'completed' },
        { name: 'Reagent Sourcing', duration: '1d', status: 'completed' },
        { name: 'Reaction Optimization', duration: '3d', status: 'in-progress' },
        { name: 'Purification (HPLC)', duration: '1d', status: 'pending' },
        { name: 'QC & Validation', duration: '12h', status: 'pending' },
    ];

    const costBreakdown = [
        { item: 'Starting Materials', cost: 1250, trend: 'stable' },
        { item: 'Catalysts & Solvents', cost: 450, trend: 'up' },
        { item: 'Lab Labor (Est.)', cost: 3200, trend: 'stable' },
        { item: 'Purification Overhead', cost: 800, trend: 'down' },
    ];

    const totalCost = costBreakdown.reduce((acc, item) => acc + item.cost, 0);

    const startSimulation = () => {
        setIsSimulating(true);
        setSimulationStep(0);

        const interval = setInterval(() => {
            setSimulationStep(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 50);
    };

    return (
        <div className="space-y-6 p-6 bg-slate-50/50 rounded-xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-blue-600" />
                        Virtual Wet Lab
                    </h2>
                    <p className="text-slate-500">Synthesis feasibility and cost estimation engine.</p>
                </div>
                <Button
                    onClick={startSimulation}
                    disabled={isSimulating && simulationStep < 100}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isSimulating && simulationStep < 100 ? (
                        <>
                            <Beaker className="w-4 h-4 mr-2 animate-spin" />
                            Simulating...
                        </>
                    ) : (
                        <>
                            <Factory className="w-4 h-4 mr-2" />
                            Run Synthesis Simulation
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Synthesis Difficulty (SA Score)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-slate-900">2.4</span>
                            <span className="text-sm text-green-600 font-medium mb-1">Easy to Make</span>
                        </div>
                        <Progress value={24} className="h-2 bg-slate-100" />
                        <p className="text-xs text-slate-400 mt-2">Scale: 1 (Easy) to 10 (Hard)</p>
                    </CardContent>
                </Card>

                <Card className="border-green-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Est. Cost per Gram</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-slate-900">${totalCost.toLocaleString()}</span>
                            <span className="text-sm text-slate-500 mb-1">USD</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                            <DollarSign className="w-3 h-3" />
                            <span>15% below industry average</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-purple-100 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Time to Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold text-slate-900">5.5</span>
                            <span className="text-sm text-slate-500 mb-1">Days</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>Includes purification & QC</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Retrosynthesis Planner */}
            <div className="mt-8">
                <RetrosynthesisPlanner />
            </div>

            {/* Vendor Integration Mockup */}
            <Card className="bg-slate-900 text-white border-0">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg mb-1">Ready to Synthesize?</h3>
                        <p className="text-slate-400 text-sm">Send this protocol directly to our partner CROs.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="text-black bg-transparent border-slate-600 hover:bg-slate-800 hover:text-white">
                            Export Protocol
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                            <Truck className="w-4 h-4 mr-2" />
                            Order Synthesis
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
