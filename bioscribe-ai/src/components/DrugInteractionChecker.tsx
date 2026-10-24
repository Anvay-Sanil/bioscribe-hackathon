"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Pill,
    Shield,
    Activity,
    Search,
    Info,
    Zap,
    AlertCircle,
    ArrowRight,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrugInteraction {
    drug1: string;
    drug2: string;
    severity: 'severe' | 'moderate' | 'minor';
    mechanism: string;
    clinicalEffect: string;
    recommendation: string;
    enzymes: string[];
    evidenceLevel: 'A' | 'B' | 'C' | 'D';
}

interface CYPEnzyme {
    name: string;
    inhibitors: string[];
    inducers: string[];
    substrates: string[];
    clinicalRelevance: string;
}

const cypEnzymes: CYPEnzyme[] = [
    {
        name: 'CYP3A4',
        inhibitors: ['Ketoconazole', 'Itraconazole', 'Ritonavir', 'Clarithromycin'],
        inducers: ['Rifampicin', 'Phenytoin', 'Carbamazepine', 'St. John\'s Wort'],
        substrates: ['Simvastatin', 'Atorvastatin', 'Cyclosporine', 'Tacrolimus'],
        clinicalRelevance: 'Metabolizes ~50% of all drugs. Most clinically significant CYP enzyme.'
    },
    {
        name: 'CYP2D6',
        inhibitors: ['Fluoxetine', 'Paroxetine', 'Quinidine', 'Bupropion'],
        inducers: ['Dexamethasone', 'Rifampicin'],
        substrates: ['Codeine', 'Tramadol', 'Metoprolol', 'Tamoxifen'],
        clinicalRelevance: 'Highly polymorphic. Poor metabolizers at risk for toxicity.'
    },
    {
        name: 'CYP2C19',
        inhibitors: ['Omeprazole', 'Fluconazole', 'Fluvoxamine', 'Ticlopidine'],
        inducers: ['Rifampicin', 'Phenytoin'],
        substrates: ['Clopidogrel', 'Omeprazole', 'Diazepam', 'Phenytoin'],
        clinicalRelevance: 'Critical for clopidogrel activation. Poor metabolizers have reduced efficacy.'
    },
    {
        name: 'CYP2C9',
        inhibitors: ['Fluconazole', 'Amiodarone', 'Sulfamethoxazole'],
        inducers: ['Rifampicin', 'Phenobarbital'],
        substrates: ['Warfarin', 'Phenytoin', 'Losartan', 'NSAIDs'],
        clinicalRelevance: 'Warfarin metabolism. Variants increase bleeding risk.'
    }
];

const mockInteractions: DrugInteraction[] = [
    {
        drug1: 'Simvastatin',
        drug2: 'Clarithromycin',
        severity: 'severe',
        mechanism: 'CYP3A4 inhibition by clarithromycin increases simvastatin levels 10-fold',
        clinicalEffect: 'Rhabdomyolysis, myopathy, acute kidney injury',
        recommendation: 'CONTRAINDICATED. Use azithromycin or pravastatin instead.',
        enzymes: ['CYP3A4'],
        evidenceLevel: 'A'
    },
    {
        drug1: 'Clopidogrel',
        drug2: 'Omeprazole',
        severity: 'moderate',
        mechanism: 'CYP2C19 inhibition reduces clopidogrel activation',
        clinicalEffect: 'Reduced antiplatelet effect, increased cardiovascular events',
        recommendation: 'Use pantoprazole or H2 blocker instead.',
        enzymes: ['CYP2C19'],
        evidenceLevel: 'B'
    },
    {
        drug1: 'Warfarin',
        drug2: 'Fluconazole',
        severity: 'severe',
        mechanism: 'CYP2C9 inhibition increases warfarin S-enantiomer levels',
        clinicalEffect: 'INR elevation, bleeding risk',
        recommendation: 'Reduce warfarin dose by 25-50%. Monitor INR closely.',
        enzymes: ['CYP2C9'],
        evidenceLevel: 'A'
    },
    {
        drug1: 'Metoprolol',
        drug2: 'Fluoxetine',
        severity: 'moderate',
        mechanism: 'CYP2D6 inhibition by fluoxetine increases metoprolol exposure',
        clinicalEffect: 'Bradycardia, hypotension, fatigue',
        recommendation: 'Monitor HR and BP. Consider bisoprolol (not CYP2D6 substrate).',
        enzymes: ['CYP2D6'],
        evidenceLevel: 'B'
    }
];

export function DrugInteractionChecker() {
    const [selectedDrug, setSelectedDrug] = useState('');
    const [interactions, setInteractions] = useState<DrugInteraction[]>(mockInteractions);
    const [expandedInteraction, setExpandedInteraction] = useState<number | null>(null);
    const [showEnzymePanel, setShowEnzymePanel] = useState(false);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'severe': return 'bg-red-500 text-white';
            case 'moderate': return 'bg-orange-500 text-white';
            case 'minor': return 'bg-yellow-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'severe': return <XCircle className="w-5 h-5" />;
            case 'moderate': return <AlertTriangle className="w-5 h-5" />;
            case 'minor': return <Info className="w-5 h-5" />;
            default: return <CheckCircle2 className="w-5 h-5" />;
        }
    };

    const polypharmacyRisk = interactions.filter(i => i.severity === 'severe').length > 0 ? 'high' :
        interactions.filter(i => i.severity === 'moderate').length > 1 ? 'moderate' : 'low';

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-red-50/30 via-orange-50/30 to-yellow-50/30 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="w-6 h-6 text-red-600" />
                        Drug-Drug Interaction Checker
                    </h2>
                    <p className="text-slate-500">CYP450-based interaction analysis for patient safety</p>
                </div>
                <div className="text-right">
                    <Badge className={`${polypharmacyRisk === 'high' ? 'bg-red-500' : polypharmacyRisk === 'moderate' ? 'bg-orange-500' : 'bg-green-500'} text-white px-4 py-2 text-sm`}>
                        {polypharmacyRisk === 'high' ? '⚠️ HIGH RISK' : polypharmacyRisk === 'moderate' ? '⚡ MODERATE RISK' : '✓ LOW RISK'}
                    </Badge>
                    <div className="text-sm text-slate-500 mt-1">Polypharmacy Assessment</div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Severe', count: interactions.filter(i => i.severity === 'severe').length, color: 'red' },
                    { label: 'Moderate', count: interactions.filter(i => i.severity === 'moderate').length, color: 'orange' },
                    { label: 'Minor', count: interactions.filter(i => i.severity === 'minor').length, color: 'yellow' },
                    { label: 'Total Checked', count: interactions.length, color: 'blue' }
                ].map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 rounded-xl bg-white border-2 border-${stat.color}-200 shadow-sm`}
                    >
                        <div className={`text-3xl font-bold text-${stat.color}-600`}>{stat.count}</div>
                        <div className="text-sm text-slate-600">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* CYP450 Enzyme Panel Toggle */}
            <Button
                variant="outline"
                onClick={() => setShowEnzymePanel(!showEnzymePanel)}
                className="w-full justify-between"
            >
                <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    CYP450 Enzyme Reference Panel
                </span>
                {showEnzymePanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            <AnimatePresence>
                {showEnzymePanel && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        {cypEnzymes.map((enzyme, idx) => (
                            <Card key={idx} className="border-purple-200">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Badge className="bg-purple-600 text-white">{enzyme.name}</Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs">{enzyme.clinicalRelevance}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs">
                                    <div>
                                        <span className="font-bold text-red-600">Inhibitors:</span>{' '}
                                        {enzyme.inhibitors.join(', ')}
                                    </div>
                                    <div>
                                        <span className="font-bold text-green-600">Inducers:</span>{' '}
                                        {enzyme.inducers.join(', ')}
                                    </div>
                                    <div>
                                        <span className="font-bold text-blue-600">Substrates:</span>{' '}
                                        {enzyme.substrates.join(', ')}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interaction List */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Detected Interactions
                </h3>

                {interactions.map((interaction, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card
                            className={`cursor-pointer hover:shadow-lg transition-all ${interaction.severity === 'severe' ? 'border-red-300 bg-red-50/50' :
                                    interaction.severity === 'moderate' ? 'border-orange-300 bg-orange-50/50' :
                                        'border-yellow-300 bg-yellow-50/50'
                                }`}
                            onClick={() => setExpandedInteraction(expandedInteraction === idx ? null : idx)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Badge className={getSeverityColor(interaction.severity)}>
                                            {getSeverityIcon(interaction.severity)}
                                            <span className="ml-1 uppercase">{interaction.severity}</span>
                                        </Badge>
                                        <div>
                                            <div className="font-bold text-slate-900">
                                                {interaction.drug1} <ArrowRight className="w-4 h-4 inline mx-1" /> {interaction.drug2}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                via {interaction.enzymes.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            Evidence: {interaction.evidenceLevel}
                                        </Badge>
                                        {expandedInteraction === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedInteraction === idx && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 pt-4 border-t border-slate-200 space-y-3"
                                        >
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 uppercase mb-1">Mechanism</div>
                                                <div className="text-sm text-slate-600">{interaction.mechanism}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-700 uppercase mb-1">Clinical Effect</div>
                                                <div className="text-sm text-red-700 font-medium">{interaction.clinicalEffect}</div>
                                            </div>
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="text-xs font-bold text-blue-800 uppercase mb-1">
                                                    <Shield className="w-4 h-4 inline mr-1" />
                                                    Clinical Recommendation
                                                </div>
                                                <div className="text-sm text-blue-900">{interaction.recommendation}</div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                    <p className="font-bold mb-1">Clinical Disclaimer</p>
                    <p>This tool is for research and educational purposes only. Always consult clinical pharmacology resources and package inserts before making clinical decisions. Drug interaction predictions are based on known CYP450 pathways and may not capture all interactions.</p>
                </div>
            </div>
        </div>
    );
}
