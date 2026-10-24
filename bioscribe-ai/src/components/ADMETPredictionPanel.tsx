import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Brain,
    Droplet,
    Zap,
    Activity,
    Pill,
    TrendingUp,
    Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ADMETMetric {
    name: string;
    value: number;
    unit: string;
    threshold: number;
    status: 'pass' | 'warning' | 'fail';
    description: string;
}

export function ADMETPredictionPanel() {
    // Mock ADMET predictions - in production, these would come from ML models
    const lipinskiRules = [
        { rule: 'Molecular Weight', value: 342.4, threshold: '< 500', status: 'pass' as const },
        { rule: 'LogP (Lipophilicity)', value: 2.8, threshold: '< 5', status: 'pass' as const },
        { rule: 'H-Bond Donors', value: 2, threshold: '≤ 5', status: 'pass' as const },
        { rule: 'H-Bond Acceptors', value: 5, threshold: '≤ 10', status: 'pass' as const },
    ];

    const admetMetrics: ADMETMetric[] = [
        {
            name: 'Oral Bioavailability',
            value: 78,
            unit: '%',
            threshold: 50,
            status: 'pass',
            description: 'Predicted fraction absorbed in GI tract'
        },
        {
            name: 'BBB Permeability',
            value: 0.32,
            unit: 'log BB',
            threshold: 0.3,
            status: 'warning',
            description: 'Blood-Brain Barrier penetration (CNS activity)'
        },
        {
            name: 'hERG Inhibition',
            value: 4.2,
            unit: 'pIC50',
            threshold: 5.5,
            status: 'pass',
            description: 'Cardiac toxicity risk (higher is safer)'
        },
        {
            name: 'CYP3A4 Inhibition',
            value: 15,
            unit: '%',
            threshold: 50,
            status: 'pass',
            description: 'Drug-drug interaction potential'
        },
        {
            name: 'Plasma Protein Binding',
            value: 92,
            unit: '%',
            threshold: 95,
            status: 'pass',
            description: 'Fraction bound to plasma proteins'
        },
        {
            name: 'Solubility (LogS)',
            value: -3.2,
            unit: 'log mol/L',
            threshold: -4,
            status: 'pass',
            description: 'Aqueous solubility at pH 7.4'
        },
        {
            name: 'Half-Life (t½)',
            value: 4.8,
            unit: 'hours',
            threshold: 2,
            status: 'pass',
            description: 'Predicted pharmacokinetic half-life'
        },
        {
            name: 'Mutagenicity (Ames)',
            value: 12,
            unit: '% risk',
            threshold: 30,
            status: 'pass',
            description: 'Probability of bacterial mutagenicity'
        },
    ];

    const overallScore = admetMetrics.filter(m => m.status === 'pass').length / admetMetrics.length * 100;
    const passCount = lipinskiRules.filter(r => r.status === 'pass').length;

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        ADMET Prediction Suite
                    </h2>
                    <p className="text-slate-500">Absorption, Distribution, Metabolism, Excretion, and Toxicity analysis</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold text-slate-900">{overallScore.toFixed(0)}%</div>
                    <div className="text-sm text-slate-500">Drug-Likeness Score</div>
                </div>
            </div>

            {/* Lipinski's Rule of Five */}
            <Card className="border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        Lipinski's Rule of Five
                        {passCount === 4 ? (
                            <Badge className="ml-2 bg-green-500 text-white">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                PASS (4/4)
                            </Badge>
                        ) : (
                            <Badge className="ml-2 bg-orange-500 text-white">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                PARTIAL ({passCount}/4)
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Predicts oral drug-likeness based on Lipinski's criteria
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                        {lipinskiRules.map((rule, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-200 transition-colors"
                            >
                                <div>
                                    <div className="text-sm font-medium text-slate-700">{rule.rule}</div>
                                    <div className="text-xs text-slate-500">Threshold: {rule.threshold}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-900">{rule.value}</span>
                                    {rule.status === 'pass' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ADMET Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {admetMetrics.map((metric, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + idx * 0.05 }}
                    >
                        <Card className={`hover:shadow-md transition-shadow ${metric.status === 'fail' ? 'border-red-200' :
                                metric.status === 'warning' ? 'border-orange-200' :
                                    'border-green-200'
                            }`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-900 mb-1">{metric.name}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">{metric.description}</p>
                                    </div>
                                    {metric.status === 'pass' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2" />
                                    ) : metric.status === 'warning' ? (
                                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 ml-2" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />
                                    )}
                                </div>

                                <div className="flex items-end justify-between mt-3">
                                    <div>
                                        <span className="text-2xl font-bold text-slate-900">{metric.value}</span>
                                        <span className="text-sm text-slate-500 ml-1">{metric.unit}</span>
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${metric.status === 'pass' ? 'border-green-500 text-green-700 bg-green-50' :
                                            metric.status === 'warning' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                                                'border-red-500 text-red-700 bg-red-50'
                                        }`}>
                                        {metric.status === 'pass' ? 'PASS' : metric.status === 'warning' ? 'CAUTION' : 'FAIL'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Recommendations */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <Brain className="w-8 h-8 text-purple-600 shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-purple-900 mb-2">AI Recommendations</h3>
                            <div className="space-y-2 text-sm text-purple-800">
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold shrink-0">✓</span>
                                    <span><strong>Excellent GI absorption</strong> predicted due to favorable LogP and MW. No formulation challenges expected.</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold shrink-0">⚠</span>
                                    <span><strong>BBB permeability borderline.</strong> Consider adding polar groups if CNS activity is desired, or maintain if CNS exclusion is preferred.</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold shrink-0">✓</span>
                                    <span><strong>Low hERG risk</strong> suggests minimal cardiac toxicity. Safe to proceed to in-vitro patch clamp validation.</span>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold shrink-0">✓</span>
                                    <span><strong>Low CYP3A4 inhibition</strong> reduces risk of drug-drug interactions. Compatible with polypharmacy regimens.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-bold mb-1">Validation Recommendation</p>
                    <p>These predictions are based on AI models trained on ChEMBL and PubChem data. We recommend experimental validation of hERG, CYP450, and solubility via contract assays before advancing to IND-enabling studies.</p>
                </div>
            </div>
        </div>
    );
}
