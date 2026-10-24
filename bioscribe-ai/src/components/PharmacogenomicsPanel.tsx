"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Dna,
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Info,
    Pill,
    Activity,
    Zap,
    BarChart3,
    ChevronRight,
    Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GeneticVariant {
    gene: string;
    variant: string;
    rsid: string;
    phenotype: string;
    frequency: string;
    metabolizerStatus: 'ultra-rapid' | 'extensive' | 'intermediate' | 'poor';
    clinicalImplication: string;
    dosingRecommendation: string;
    cpicLevel: 'A' | 'B' | 'C' | 'D';
}

interface PopulationData {
    population: string;
    frequency: number;
    flag: string;
}

export function PharmacogenomicsPanel() {
    const [selectedGene, setSelectedGene] = useState<string | null>(null);

    const geneticVariants: GeneticVariant[] = [
        {
            gene: 'CYP2D6',
            variant: '*4/*4',
            rsid: 'rs3892097',
            phenotype: 'Poor Metabolizer',
            frequency: '5-10% Caucasians',
            metabolizerStatus: 'poor',
            clinicalImplication: 'Reduced metabolism of codeine, tramadol, tamoxifen. May lack efficacy or accumulate parent drug.',
            dosingRecommendation: 'AVOID codeine (no analgesia). Use alternative opioids. Consider alternative to tamoxifen.',
            cpicLevel: 'A'
        },
        {
            gene: 'CYP2C19',
            variant: '*2/*2',
            rsid: 'rs4244285',
            phenotype: 'Poor Metabolizer',
            frequency: '2-5% Caucasians, 15-25% Asians',
            metabolizerStatus: 'poor',
            clinicalImplication: 'Reduced clopidogrel activation. Increased risk of cardiovascular events post-PCI.',
            dosingRecommendation: 'AVOID clopidogrel. Use prasugrel or ticagrelor instead.',
            cpicLevel: 'A'
        },
        {
            gene: 'CYP2C9',
            variant: '*2/*3',
            rsid: 'rs1799853',
            phenotype: 'Intermediate Metabolizer',
            frequency: '10-15% Caucasians',
            metabolizerStatus: 'intermediate',
            clinicalImplication: 'Reduced warfarin metabolism. Higher bleeding risk at standard doses.',
            dosingRecommendation: 'Reduce initial warfarin dose by 25-50%. Use FDA-approved dosing algorithm.',
            cpicLevel: 'A'
        },
        {
            gene: 'SLCO1B1',
            variant: '*5/*5',
            rsid: 'rs4149056',
            phenotype: 'Reduced Function',
            frequency: '15-20% globally',
            metabolizerStatus: 'poor',
            clinicalImplication: 'Increased simvastatin exposure. 5-17x myopathy risk at high doses.',
            dosingRecommendation: 'Limit simvastatin to 20mg daily or switch to pravastatin/rosuvastatin.',
            cpicLevel: 'A'
        },
        {
            gene: 'HLA-B',
            variant: '*57:01',
            rsid: 'rs2395029',
            phenotype: 'Hypersensitivity Risk',
            frequency: '5-8% Caucasians',
            metabolizerStatus: 'extensive',
            clinicalImplication: 'High risk of abacavir hypersensitivity syndrome (potentially fatal).',
            dosingRecommendation: 'CONTRAINDICATED. Screen all patients before initiating abacavir.',
            cpicLevel: 'A'
        },
        {
            gene: 'TPMT',
            variant: '*2/*3A',
            rsid: 'rs1142345',
            phenotype: 'Intermediate Metabolizer',
            frequency: '10% heterozygous',
            metabolizerStatus: 'intermediate',
            clinicalImplication: 'Reduced thiopurine metabolism. Risk of severe myelosuppression.',
            dosingRecommendation: 'Reduce azathioprine/6-MP dose by 30-50%. Monitor CBC closely.',
            cpicLevel: 'A'
        }
    ];

    const populationFrequencies: PopulationData[] = [
        { population: 'European', frequency: 7.2, flag: '🇪🇺' },
        { population: 'East Asian', frequency: 18.5, flag: '🇯🇵' },
        { population: 'African', frequency: 3.4, flag: '🇳🇬' },
        { population: 'South Asian', frequency: 12.1, flag: '🇮🇳' },
        { population: 'Latino', frequency: 5.8, flag: '🇲🇽' },
    ];

    const getMetabolizerColor = (status: string) => {
        switch (status) {
            case 'ultra-rapid': return 'bg-red-100 text-red-800 border-red-300';
            case 'extensive': return 'bg-green-100 text-green-800 border-green-300';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'poor': return 'bg-orange-100 text-orange-800 border-orange-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCPICColor = (level: string) => {
        switch (level) {
            case 'A': return 'bg-green-500 text-white';
            case 'B': return 'bg-blue-500 text-white';
            case 'C': return 'bg-yellow-500 text-white';
            case 'D': return 'bg-gray-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-indigo-50/30 via-purple-50/30 to-pink-50/30 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Dna className="w-6 h-6 text-indigo-600" />
                        Pharmacogenomics Panel
                    </h2>
                    <p className="text-slate-500">Genetic variant impact on drug response & metabolism</p>
                </div>
                <Badge className="bg-indigo-500 text-white px-4 py-2 text-sm">
                    CPIC Guidelines Aligned
                </Badge>
            </div>

            {/* CPIC Level Legend */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">CPIC Evidence Levels:</span>
                <Badge className={`${getCPICColor('A')} text-xs`}>A: Gene-Drug Prescribed</Badge>
                <Badge className={`${getCPICColor('B')} text-xs`}>B: Moderate Evidence</Badge>
                <Badge className={`${getCPICColor('C')} text-xs`}>C: Annotation Only</Badge>
                <span className="text-xs text-slate-500">(Clinical Pharmacogenetics Implementation Consortium)</span>
            </div>

            {/* Genetic Variants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {geneticVariants.map((variant, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card
                            className={`cursor-pointer hover:shadow-lg transition-all border-2 ${selectedGene === variant.gene ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200'
                                }`}
                            onClick={() => setSelectedGene(selectedGene === variant.gene ? null : variant.gene)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Badge className="bg-indigo-600 text-white">{variant.gene}</Badge>
                                        <span className="text-sm font-mono text-slate-600">{variant.variant}</span>
                                    </CardTitle>
                                    <Badge className={getCPICColor(variant.cpicLevel)}>
                                        CPIC {variant.cpicLevel}
                                    </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                    <Badge variant="outline" className={`${getMetabolizerColor(variant.metabolizerStatus)} border`}>
                                        {variant.phenotype}
                                    </Badge>
                                    <span className="text-xs text-slate-500">{variant.rsid}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-slate-500 mb-2">
                                    <Globe className="w-3 h-3 inline mr-1" /> Frequency: {variant.frequency}
                                </div>

                                {selectedGene === variant.gene && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-3 pt-3 border-t border-slate-200"
                                    >
                                        <div>
                                            <div className="text-xs font-bold text-slate-700 mb-1">Clinical Implication</div>
                                            <p className="text-sm text-slate-600">{variant.clinicalImplication}</p>
                                        </div>
                                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                                            <div className="text-xs font-bold text-indigo-800 mb-1 flex items-center gap-1">
                                                <Pill className="w-4 h-4" /> Dosing Recommendation
                                            </div>
                                            <p className="text-sm text-indigo-900 font-medium">{variant.dosingRecommendation}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Population Frequencies */}
            <Card className="border-purple-200">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Population-Specific Variant Frequencies (CYP2C19 *2)
                    </CardTitle>
                    <CardDescription>Allele frequency varies significantly across populations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {populationFrequencies.map((pop, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="text-2xl">{pop.flag}</span>
                                <span className="w-24 text-sm font-medium text-slate-700">{pop.population}</span>
                                <Progress value={pop.frequency * 3} className="flex-1 h-3" />
                                <span className="w-16 text-right font-bold text-slate-900">{pop.frequency}%</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Precision Medicine Note */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-sm text-indigo-900">
                    <p className="font-bold mb-1">Precision Medicine Integration</p>
                    <p>Pharmacogenomic testing enables personalized drug selection and dosing. Implementing pre-emptive PGx panels can reduce adverse events by up to 30% and improve therapeutic outcomes. All recommendations align with FDA drug labels and CPIC guidelines.</p>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                    <p className="font-bold mb-1">Clinical Disclaimer</p>
                    <p>Pharmacogenomic predictions are based on published gene-drug associations. Clinical implementation should consider patient-specific factors, comedications, and clinical context. Consult pharmacogenomic specialists for complex cases.</p>
                </div>
            </div>
        </div>
    );
}
