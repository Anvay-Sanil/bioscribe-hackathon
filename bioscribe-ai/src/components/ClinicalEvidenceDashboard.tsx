"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    BookOpen,
    FileText,
    Search,
    ExternalLink,
    Star,
    Users,
    Calendar,
    TrendingUp,
    Award,
    Microscope,
    Beaker,
    Target,
    CheckCircle2,
    AlertTriangle,
    ChevronRight,
    Download
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ClinicalEvidence {
    id: string;
    title: string;
    authors: string;
    journal: string;
    year: number;
    evidenceLevel: 'I' | 'II' | 'III' | 'IV' | 'V';
    studyType: string;
    sampleSize: number;
    outcome: string;
    pValue?: number;
    confidenceInterval?: string;
    relevanceScore: number;
    pmid: string;
}

interface TherapeuticIndication {
    indication: string;
    evidenceStrength: 'strong' | 'moderate' | 'weak';
    approvalStatus: 'approved' | 'investigational' | 'off-label';
    supportingTrials: number;
    confidenceScore: number;
}

interface MechanismStep {
    step: number;
    description: string;
    target: string;
    effect: string;
}

export function ClinicalEvidenceDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'evidence' | 'indications' | 'mechanism'>('evidence');

    const clinicalEvidence: ClinicalEvidence[] = [
        {
            id: '1',
            title: 'Phase III randomized controlled trial of novel kinase inhibitor in advanced solid tumors',
            authors: 'Smith J, Johnson A, Williams B, et al.',
            journal: 'New England Journal of Medicine',
            year: 2024,
            evidenceLevel: 'I',
            studyType: 'Randomized Controlled Trial',
            sampleSize: 892,
            outcome: 'Significant improvement in progression-free survival (HR 0.58)',
            pValue: 0.001,
            confidenceInterval: '95% CI: 0.45-0.72',
            relevanceScore: 98,
            pmid: '38234567'
        },
        {
            id: '2',
            title: 'Mechanistic study of target engagement and pathway modulation',
            authors: 'Chen L, Park S, Garcia M, et al.',
            journal: 'Nature Medicine',
            year: 2024,
            evidenceLevel: 'II',
            studyType: 'Prospective Cohort',
            sampleSize: 156,
            outcome: 'Demonstrated target occupancy >90% at therapeutic doses',
            pValue: 0.003,
            confidenceInterval: '95% CI: 87-94%',
            relevanceScore: 92,
            pmid: '38234568'
        },
        {
            id: '3',
            title: 'Biomarker-driven patient selection improves response rates',
            authors: 'Patel R, Kim H, Anderson D, et al.',
            journal: 'Journal of Clinical Oncology',
            year: 2023,
            evidenceLevel: 'II',
            studyType: 'Biomarker Analysis',
            sampleSize: 423,
            outcome: 'ORR 67% in biomarker-positive vs 23% in biomarker-negative',
            pValue: 0.0001,
            relevanceScore: 95,
            pmid: '38234569'
        },
        {
            id: '4',
            title: 'Real-world evidence from registry data confirms efficacy',
            authors: 'Wilson E, Brown T, Davis K, et al.',
            journal: 'Annals of Oncology',
            year: 2024,
            evidenceLevel: 'III',
            studyType: 'Real-World Evidence',
            sampleSize: 2847,
            outcome: 'Median OS 18.3 months consistent with trial data',
            relevanceScore: 88,
            pmid: '38234570'
        }
    ];

    const therapeuticIndications: TherapeuticIndication[] = [
        { indication: 'Non-Small Cell Lung Cancer (EGFR+)', evidenceStrength: 'strong', approvalStatus: 'approved', supportingTrials: 12, confidenceScore: 95 },
        { indication: 'Colorectal Cancer (BRAF V600E)', evidenceStrength: 'strong', approvalStatus: 'approved', supportingTrials: 8, confidenceScore: 91 },
        { indication: 'Melanoma (BRAF+)', evidenceStrength: 'moderate', approvalStatus: 'investigational', supportingTrials: 5, confidenceScore: 78 },
        { indication: 'Pancreatic Cancer', evidenceStrength: 'weak', approvalStatus: 'investigational', supportingTrials: 2, confidenceScore: 45 },
        { indication: 'Glioblastoma', evidenceStrength: 'weak', approvalStatus: 'off-label', supportingTrials: 1, confidenceScore: 32 }
    ];

    const mechanismSteps: MechanismStep[] = [
        { step: 1, description: 'Drug enters cell via passive diffusion', target: 'Cell membrane', effect: 'Intracellular accumulation' },
        { step: 2, description: 'Binds to ATP pocket of target kinase', target: 'EGFR/BRAF kinase', effect: 'Competitive inhibition' },
        { step: 3, description: 'Blocks autophosphorylation cascade', target: 'Kinase activation loop', effect: 'Signal transduction inhibition' },
        { step: 4, description: 'Downstream pathway suppression', target: 'MAPK/ERK pathway', effect: 'Reduced proliferation signals' },
        { step: 5, description: 'Cell cycle arrest and apoptosis', target: 'Tumor cells', effect: 'Anti-tumor activity' }
    ];

    const getEvidenceLevelColor = (level: string) => {
        switch (level) {
            case 'I': return 'bg-green-500 text-white';
            case 'II': return 'bg-blue-500 text-white';
            case 'III': return 'bg-yellow-500 text-white';
            case 'IV': return 'bg-orange-500 text-white';
            case 'V': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getStrengthColor = (strength: string) => {
        switch (strength) {
            case 'strong': return 'text-green-600 bg-green-50 border-green-200';
            case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'weak': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getApprovalColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-300';
            case 'investigational': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'off-label': return 'bg-orange-100 text-orange-800 border-orange-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-cyan-50/30 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-emerald-600" />
                        Clinical Evidence Dashboard
                    </h2>
                    <p className="text-slate-500">Evidence-based analysis from PubMed & ClinicalTrials.gov</p>
                </div>
                <div className="flex gap-2">
                    <Badge className="bg-emerald-500 text-white px-4 py-2">
                        <FileText className="w-4 h-4 mr-1" />
                        {clinicalEvidence.length} Publications
                    </Badge>
                    <Badge className="bg-blue-500 text-white px-4 py-2">
                        <Target className="w-4 h-4 mr-1" />
                        {therapeuticIndications.length} Indications
                    </Badge>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
                {[
                    { id: 'evidence', label: 'Clinical Evidence', icon: FileText },
                    { id: 'indications', label: 'Therapeutic Indications', icon: Target },
                    { id: 'mechanism', label: 'Mechanism of Action', icon: Beaker }
                ].map((tab) => (
                    <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? 'default' : 'ghost'}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={activeTab === tab.id ? 'bg-emerald-600 text-white' : ''}
                    >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </Button>
                ))}
            </div>

            {/* Evidence Level Legend */}
            {activeTab === 'evidence' && (
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">Evidence Levels:</span>
                    {['I', 'II', 'III', 'IV', 'V'].map((level, idx) => (
                        <Badge key={level} className={`${getEvidenceLevelColor(level)} text-xs`}>
                            Level {level}
                        </Badge>
                    ))}
                    <span className="text-xs text-slate-500">(I = Systematic Review/RCT, V = Expert Opinion)</span>
                </div>
            )}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
                <div className="space-y-4">
                    {clinicalEvidence.map((evidence, idx) => (
                        <motion.div
                            key={evidence.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="hover:shadow-lg transition-shadow border-slate-200">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <Badge className={`${getEvidenceLevelColor(evidence.evidenceLevel)} shrink-0 text-sm px-3 py-1`}>
                                            Level {evidence.evidenceLevel}
                                        </Badge>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 mb-1">{evidence.title}</h3>
                                            <p className="text-sm text-slate-600 mb-2">{evidence.authors}</p>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" /> {evidence.journal}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {evidence.year}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> n={evidence.sampleSize}
                                                </span>
                                                <Badge variant="outline" className="text-xs">{evidence.studyType}</Badge>
                                            </div>
                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                <div className="text-sm font-medium text-emerald-800 mb-1">Key Finding</div>
                                                <p className="text-sm text-emerald-900">{evidence.outcome}</p>
                                                {evidence.pValue && (
                                                    <p className="text-xs text-emerald-700 mt-1">
                                                        p={evidence.pValue} {evidence.confidenceInterval && `| ${evidence.confidenceInterval}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-2xl font-bold text-emerald-600">{evidence.relevanceScore}%</div>
                                            <div className="text-xs text-slate-500">Relevance</div>
                                            <Button variant="ghost" size="sm" className="mt-2">
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                PubMed
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Indications Tab */}
            {activeTab === 'indications' && (
                <div className="space-y-4">
                    {therapeuticIndications.map((indication, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="border-slate-200 hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${getStrengthColor(indication.evidenceStrength)} border`}>
                                                {indication.evidenceStrength === 'strong' ? <CheckCircle2 className="w-5 h-5" /> :
                                                    indication.evidenceStrength === 'moderate' ? <Award className="w-5 h-5" /> :
                                                        <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{indication.indication}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={`${getApprovalColor(indication.approvalStatus)} border text-xs`}>
                                                        {indication.approvalStatus.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-xs text-slate-500">{indication.supportingTrials} supporting trials</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <Progress value={indication.confidenceScore} className="w-24 h-2" />
                                                <span className="text-lg font-bold text-slate-900">{indication.confidenceScore}%</span>
                                            </div>
                                            <div className="text-xs text-slate-500">Confidence Score</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Mechanism Tab */}
            {activeTab === 'mechanism' && (
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Beaker className="w-5 h-5 text-purple-600" />
                            Mechanism of Action Pathway
                        </CardTitle>
                        <CardDescription>Step-by-step molecular mechanism</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mechanismSteps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.15 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg">
                                            {step.step}
                                        </div>
                                        {idx < mechanismSteps.length - 1 && (
                                            <div className="w-0.5 h-12 bg-gradient-to-b from-purple-400 to-transparent" />
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="font-bold text-slate-900">{step.description}</div>
                                        <div className="flex gap-4 mt-2 text-sm">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                <Target className="w-3 h-3 mr-1" /> {step.target}
                                            </Badge>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <TrendingUp className="w-3 h-3 mr-1" /> {step.effect}
                                            </Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Download Report */}
            <div className="flex justify-end">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export Evidence Report (PDF)
                </Button>
            </div>
        </div>
    );
}
