"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Pill, Shield, BookOpen, Dna, Radio, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrugInteractionChecker } from '@/components/DrugInteractionChecker';
import { AdverseEventPredictor } from '@/components/AdverseEventPredictor';
import { ClinicalEvidenceDashboard } from '@/components/ClinicalEvidenceDashboard';
import { PharmacogenomicsPanel } from '@/components/PharmacogenomicsPanel';
import { SafetySignalMonitor } from '@/components/SafetySignalMonitor';

export default function ClinicalSafetyPage() {
    const [activeTab, setActiveTab] = useState('interactions');

    const tabs = [
        { id: 'interactions', label: 'Drug Interactions', icon: Pill, color: 'text-red-600' },
        { id: 'adverse', label: 'Adverse Events', icon: Shield, color: 'text-rose-600' },
        { id: 'evidence', label: 'Clinical Evidence', icon: BookOpen, color: 'text-emerald-600' },
        { id: 'pgx', label: 'Pharmacogenomics', icon: Dna, color: 'text-indigo-600' },
        { id: 'safety', label: 'Safety Signals', icon: Radio, color: 'text-slate-600' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100">
            <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Header */}
                <div className="flex items-center gap-6 mb-8">
                    <Link href="/dashboard">
                        <button className="p-2 rounded-xl hover:bg-white/50 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                    </Link>
                    <div className="flex-1">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-5xl font-light text-slate-900 mb-2"
                        >
                            Clinical Safety Suite
                        </motion.h1>
                        <p className="text-xl font-light text-slate-600">
                            Professional-grade safety assessment and pharmacovigilance tools
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 glass-premium border border-white/20 rounded-xl shadow-sm animate-pulse">
                        <Activity className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-slate-700">All Systems Operational</span>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start glass-premium p-2 rounded-2xl mb-6 shadow-lg border border-white/30">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl data-[state=active]:bg-white/80 data-[state=active]:shadow-md data-[state=active]:text-slate-900 transition-all hover:bg-white/40`}
                            >
                                <tab.icon className={`w-4 h-4 ${tab.color}`} />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <TabsContent value="interactions" className="mt-0">
                            <DrugInteractionChecker />
                        </TabsContent>

                        <TabsContent value="adverse" className="mt-0">
                            <AdverseEventPredictor />
                        </TabsContent>

                        <TabsContent value="evidence" className="mt-0">
                            <ClinicalEvidenceDashboard />
                        </TabsContent>

                        <TabsContent value="pgx" className="mt-0">
                            <PharmacogenomicsPanel />
                        </TabsContent>

                        <TabsContent value="safety" className="mt-0">
                            <SafetySignalMonitor />
                        </TabsContent>
                    </motion.div>
                </Tabs>
            </div>
        </div>
    );
}
