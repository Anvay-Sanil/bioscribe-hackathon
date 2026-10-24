import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Share2, CheckCircle2, Loader2, Sparkles, Shield, Activity, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportData {
    targetName: string;
    candidatesFound: number;
    bestAffinity: number;
    safetyScore: string;
    aiSummary: string;
}

export function ExecutiveReportGenerator() {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [reportReady, setReportReady] = useState(false);

    // Mock data - in a real app, this would come from props or context
    const data: ReportData = {
        targetName: "EGFR (Epidermal Growth Factor Receptor)",
        candidatesFound: 247,
        bestAffinity: -11.2,
        safetyScore: "High",
        aiSummary: "Analysis of 247 candidates reveals a novel allosteric binding pocket. The top candidate (BS-2024-X) shows superior binding affinity (-11.2 kcal/mol) compared to standard of care, with a favorable predicted ADMET profile. Recommended for immediate synthesis and in-vitro validation."
    };

    const generateReport = () => {
        setIsGenerating(true);
        setProgress(0);
        setReportReady(false);

        // Simulate generation steps
        const steps = [
            { p: 20, t: 500 },   // Gathering data
            { p: 45, t: 1500 },  // Rendering 3D snapshots
            { p: 70, t: 2500 },  // AI writing summary
            { p: 90, t: 3500 },  // Formatting layout
            { p: 100, t: 4500 }  // Finalizing
        ];

        steps.forEach(step => {
            setTimeout(() => {
                setProgress(step.p);
                if (step.p === 100) {
                    setIsGenerating(false);
                    setReportReady(true);
                }
            }, step.t);
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                {!reportReady && !isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Executive Dossier Generation</h2>
                        <p className="text-slate-500 max-w-md mb-8">
                            Create a board-ready PDF report including executive summaries, 3D visualizations, safety profiles, and synthesis recommendations.
                        </p>
                        <Button size="lg" onClick={generateReport} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                            <Sparkles className="w-5 h-5 mr-2" />
                            Generate Dossier with AI
                        </Button>
                    </div>
                )}

                {isGenerating && (
                    <div className="flex-1 flex flex-col items-center justify-center p-12">
                        <div className="w-full max-w-md space-y-8">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">Assembling Report</h3>
                                <p className="text-slate-500">BioScribe AI is analyzing data and formatting the dossier...</p>
                            </div>

                            <div className="relative pt-4">
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider">
                                    <span>Data Extraction</span>
                                    <span>3D Rendering</span>
                                    <span>AI Summary</span>
                                    <span>Finalizing</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Protein Structure", status: progress > 20 },
                                    { label: "Binding Affinity", status: progress > 20 },
                                    { label: "Safety Profile", status: progress > 45 },
                                    { label: "Synthesis Cost", status: progress > 70 },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        {item.status ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                        )}
                                        <span className={`text-sm font-medium ${item.status ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {reportReady && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Toolbar */}
                        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    BS
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Confidential Dossier</h3>
                                    <p className="text-xs text-slate-500">Generated {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                                <Button size="sm" className="bg-blue-600 text-white">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </div>

                        {/* Report Preview */}
                        <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
                            <div className="max-w-3xl mx-auto bg-white shadow-2xl min-h-[800px] p-12 relative">
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                    <div className="text-9xl font-black transform -rotate-45">CONFIDENTIAL</div>
                                </div>

                                {/* Header */}
                                <div className="border-b-2 border-slate-900 pb-8 mb-8 flex justify-between items-end">
                                    <div>
                                        <h1 className="text-4xl font-bold text-slate-900 mb-2">Executive Summary</h1>
                                        <p className="text-xl text-slate-500">Project: {data.targetName}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-900">BioScribe AI</div>
                                        <div className="text-xs text-slate-500">Enterprise Edition</div>
                                    </div>
                                </div>

                                {/* Key Findings */}
                                <div className="grid grid-cols-3 gap-6 mb-12">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <div className="text-sm text-blue-600 font-bold uppercase tracking-wider mb-1">Best Affinity</div>
                                        <div className="text-3xl font-bold text-slate-900">{data.bestAffinity}</div>
                                        <div className="text-xs text-slate-500">kcal/mol</div>
                                    </div>
                                    <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                                        <div className="text-sm text-green-600 font-bold uppercase tracking-wider mb-1">Safety Score</div>
                                        <div className="text-3xl font-bold text-slate-900">{data.safetyScore}</div>
                                        <div className="text-xs text-slate-500">ADMET Profile</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                                        <div className="text-sm text-purple-600 font-bold uppercase tracking-wider mb-1">Candidates</div>
                                        <div className="text-3xl font-bold text-slate-900">{data.candidatesFound}</div>
                                        <div className="text-xs text-slate-500">Screened</div>
                                    </div>
                                </div>

                                {/* AI Analysis */}
                                <div className="mb-12">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                        AI Strategic Analysis
                                    </h3>
                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed text-justify">
                                        {data.aiSummary}
                                    </div>
                                </div>

                                {/* Visuals Placeholder */}
                                <div className="mb-12">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">Structural Validation</h3>
                                    <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                                        <div className="text-center">
                                            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-400 font-medium">High-Resolution 3D Render</p>
                                            <p className="text-xs text-slate-400">(Binding Pocket Interaction)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="border-t border-slate-200 pt-8 flex justify-between text-xs text-slate-400">
                                    <div>Generated by BioScribe AI Platform</div>
                                    <div>Page 1 of 5</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
