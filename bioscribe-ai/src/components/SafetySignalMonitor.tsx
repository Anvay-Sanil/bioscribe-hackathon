"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Shield,
    AlertTriangle,
    Bell,
    Activity,
    TrendingUp,
    BarChart3,
    Eye,
    FileWarning,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Zap,
    Radio,
    Database
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SafetySignal {
    id: string;
    event: string;
    prr: number; // Proportional Reporting Ratio
    ror: number; // Reporting Odds Ratio
    ic: number;  // Information Component
    caseCount: number;
    expectedCount: number;
    signalStrength: 'strong' | 'moderate' | 'weak' | 'disproportionate';
    timeToOnset: string;
    seriousness: 'death' | 'life-threatening' | 'hospitalization' | 'disability' | 'other';
    actionTaken: string;
}

interface REMSComponent {
    component: string;
    status: 'required' | 'recommended' | 'not-required';
    description: string;
}

export function SafetySignalMonitor() {
    const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

    const safetySignals: SafetySignal[] = [
        {
            id: '1',
            event: 'Hepatotoxicity (Drug-Induced Liver Injury)',
            prr: 4.2,
            ror: 4.8,
            ic: 2.1,
            caseCount: 127,
            expectedCount: 30,
            signalStrength: 'strong',
            timeToOnset: '14-90 days',
            seriousness: 'hospitalization',
            actionTaken: 'Label update with hepatic monitoring recommendations'
        },
        {
            id: '2',
            event: 'QT Prolongation',
            prr: 2.8,
            ror: 3.1,
            ic: 1.6,
            caseCount: 89,
            expectedCount: 32,
            signalStrength: 'moderate',
            timeToOnset: '1-7 days',
            seriousness: 'life-threatening',
            actionTaken: 'ECG monitoring added to prescribing information'
        },
        {
            id: '3',
            event: 'Interstitial Lung Disease',
            prr: 6.1,
            ror: 7.2,
            ic: 2.9,
            caseCount: 43,
            expectedCount: 7,
            signalStrength: 'strong',
            timeToOnset: '30-180 days',
            seriousness: 'death',
            actionTaken: 'Black box warning under consideration'
        },
        {
            id: '4',
            event: 'Rhabdomyolysis',
            prr: 1.8,
            ror: 1.9,
            ic: 0.9,
            caseCount: 28,
            expectedCount: 15,
            signalStrength: 'weak',
            timeToOnset: '7-30 days',
            seriousness: 'hospitalization',
            actionTaken: 'Continued routine monitoring'
        },
        {
            id: '5',
            event: 'Stevens-Johnson Syndrome',
            prr: 3.5,
            ror: 3.9,
            ic: 1.9,
            caseCount: 12,
            expectedCount: 3,
            signalStrength: 'disproportionate',
            timeToOnset: '7-21 days',
            seriousness: 'life-threatening',
            actionTaken: 'Dermatologic warning added'
        }
    ];

    const remsComponents: REMSComponent[] = [
        { component: 'Medication Guide', status: 'required', description: 'Patient-friendly document distributed with each prescription' },
        { component: 'Communication Plan', status: 'required', description: 'Healthcare provider letters and educational materials' },
        { component: 'Elements to Assure Safe Use (ETASU)', status: 'recommended', description: 'Prescriber certification, patient registry, pharmacy restrictions' },
        { component: 'Implementation System', status: 'not-required', description: 'Specialized distribution system not currently needed' }
    ];

    const getSignalColor = (strength: string) => {
        switch (strength) {
            case 'strong': return 'bg-red-100 text-red-800 border-red-300';
            case 'disproportionate': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'weak': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSeriousnessIcon = (seriousness: string) => {
        switch (seriousness) {
            case 'death': return <XCircle className="w-4 h-4 text-red-600" />;
            case 'life-threatening': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
            case 'hospitalization': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            default: return <Activity className="w-4 h-4 text-blue-600" />;
        }
    };

    const getREMSColor = (status: string) => {
        switch (status) {
            case 'required': return 'bg-red-500 text-white';
            case 'recommended': return 'bg-yellow-500 text-white';
            case 'not-required': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const blackBoxRisk = safetySignals.filter(s => s.signalStrength === 'strong' && ['death', 'life-threatening'].includes(s.seriousness)).length > 0;

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50/30 via-zinc-50/30 to-neutral-50/30 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Radio className="w-6 h-6 text-slate-600" />
                        Safety Signal Monitor
                    </h2>
                    <p className="text-slate-500">Real-time pharmacovigilance & signal detection</p>
                </div>
                {blackBoxRisk && (
                    <Badge className="bg-black text-white px-4 py-2 text-sm animate-pulse">
                        ⚠️ BLACK BOX WARNING RISK
                    </Badge>
                )}
            </div>

            {/* Signal Detection Metrics */}
            <Card className="border-slate-300 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-100 to-zinc-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-slate-600" />
                        Signal Detection Algorithms
                    </CardTitle>
                    <CardDescription>PRR, ROR, and IC-based disproportionality analysis</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="font-bold text-blue-800">PRR (Proportional Reporting Ratio)</div>
                            <div className="text-xs text-blue-600">Signal if PRR ≥ 2, χ² ≥ 4, N ≥ 3</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="font-bold text-purple-800">ROR (Reporting Odds Ratio)</div>
                            <div className="text-xs text-purple-600">Signal if lower 95% CI &gt; 1</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="font-bold text-green-800">IC (Information Component)</div>
                            <div className="text-xs text-green-600">Bayesian method, IC025 &gt; 0 indicates signal</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Safety Signals Table */}
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-600" />
                        Detected Safety Signals (FAERS-style Analysis)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {safetySignals.map((signal, idx) => (
                            <motion.div
                                key={signal.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => setSelectedSignal(selectedSignal === signal.id ? null : signal.id)}
                                className={`cursor-pointer p-4 rounded-lg border-2 transition-all hover:shadow-md ${selectedSignal === signal.id ? 'border-slate-400 bg-slate-50' : 'border-slate-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getSeriousnessIcon(signal.seriousness)}
                                        <div>
                                            <div className="font-bold text-slate-900">{signal.event}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>Cases: {signal.caseCount}</span>
                                                <span>|</span>
                                                <span>Expected: {signal.expectedCount}</span>
                                                <span>|</span>
                                                <span>Onset: {signal.timeToOnset}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={`${getSignalColor(signal.signalStrength)} border`}>
                                            {signal.signalStrength.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                {selectedSignal === signal.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 pt-4 border-t border-slate-200"
                                    >
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-700">{signal.prr}</div>
                                                <div className="text-xs text-blue-600">PRR</div>
                                            </div>
                                            <div className="text-center p-2 bg-purple-50 rounded-lg">
                                                <div className="text-2xl font-bold text-purple-700">{signal.ror}</div>
                                                <div className="text-xs text-purple-600">ROR</div>
                                            </div>
                                            <div className="text-center p-2 bg-green-50 rounded-lg">
                                                <div className="text-2xl font-bold text-green-700">{signal.ic}</div>
                                                <div className="text-xs text-green-600">IC</div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="text-sm font-bold text-amber-800 mb-1">Regulatory Action</div>
                                            <p className="text-sm text-amber-900">{signal.actionTaken}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* REMS Assessment */}
            <Card className="border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        REMS (Risk Evaluation and Mitigation Strategies) Assessment
                    </CardTitle>
                    <CardDescription>FDA-required risk management program evaluation</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="space-y-3">
                        {remsComponents.map((rems, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    {rems.status === 'required' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                                        rems.status === 'recommended' ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                    <div>
                                        <div className="font-medium text-slate-900">{rems.component}</div>
                                        <div className="text-xs text-slate-500">{rems.description}</div>
                                    </div>
                                </div>
                                <Badge className={getREMSColor(rems.status)}>
                                    {rems.status.toUpperCase().replace('-', ' ')}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Data Source */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-bold mb-1">Data Sources</p>
                    <p>Signal detection analysis simulates FDA FAERS (Adverse Event Reporting System) methodology. Real implementations would integrate with openFDA API, EudraVigilance, and WHO VigiBase for comprehensive post-market surveillance.</p>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                    <p className="font-bold mb-1">Pharmacovigilance Disclaimer</p>
                    <p>This is a simulated pharmacovigilance dashboard for demonstration purposes. Signal detection requires rigorous statistical validation, clinical review, and regulatory assessment before any action. Report suspected adverse events to FDA MedWatch.</p>
                </div>
            </div>
        </div>
    );
}
