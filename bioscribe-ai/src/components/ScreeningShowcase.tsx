"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Layers,
    Upload,
    BarChart3,
    Target,
    Sparkles,
    ChevronRight,
    Shield,
    Zap,
    Database,
    Globe,
    Cpu
} from "lucide-react";

// Engine logos/icons display
const SUPPORTED_ENGINES = [
    { name: "GNINA", color: "text-green-400", bgColor: "bg-green-500/20" },
    { name: "AutoDock Vina", color: "text-blue-400", bgColor: "bg-blue-500/20" },
    { name: "Glide", color: "text-purple-400", bgColor: "bg-purple-500/20" },
    { name: "AtomNet", color: "text-pink-400", bgColor: "bg-pink-500/20" },
    { name: "FEP+", color: "text-orange-400", bgColor: "bg-orange-500/20" },
];

export function ScreeningShowcase() {
    return (
        <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-950 to-blue-900 text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

            <div className="relative max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-purple-500/30 px-4 py-2 mb-6">
                        <Globe className="w-4 h-4 mr-2 inline" />
                        Platform-Agnostic Analysis
                    </Badge>
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        Universal
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"> Screening Hub</span>
                    </h2>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                        Upload results from <strong>any</strong> virtual screening engine and instantly get
                        3D visualization, XAI explanations, FAIR metadata, and blockchain provenance.
                    </p>

                    {/* Supported Engines */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {SUPPORTED_ENGINES.map((engine) => (
                            <Badge
                                key={engine.name}
                                className={`${engine.bgColor} ${engine.color} border-0 px-3 py-1.5`}
                            >
                                <Cpu className="w-3 h-3 mr-1.5" />
                                {engine.name}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {/* Drop-in Engine Client */}
                    <Card className="bg-white/5 border-purple-500/30 backdrop-blur-sm hover:bg-white/10 transition-all group">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Universal Import</h3>
                            <p className="text-slate-400 mb-4">
                                Upload CSV/JSON from any engine. Auto-detects format and maps columns automatically.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    GNINA, Vina, Glide templates
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    Custom column mapping
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    Automatic validation
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Benchmark Lab */}
                    <Card className="bg-white/5 border-blue-500/30 backdrop-blur-sm hover:bg-white/10 transition-all group">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Engine Benchmark Lab</h3>
                            <p className="text-slate-400 mb-4">
                                Compare engines on PDBbind targets. Transparent metrics: Spearman, RMSE, enrichment.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                    Standard benchmark suite
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                    Head-to-head comparison
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                    Exportable reports (PDF)
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Partner Templates */}
                    <Card className="bg-white/5 border-green-500/30 backdrop-blur-sm hover:bg-white/10 transition-all group">
                        <CardContent className="p-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Therapeutic Templates</h3>
                            <p className="text-slate-400 mb-4">
                                Pre-configured projects for oncology kinases and viral targets with disease context.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-green-400" />
                                    EGFR, BRAF, ABL1 (Oncology)
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-green-400" />
                                    CDK2, JAK2 (Cell Cycle)
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-green-400" />
                                    One-click project creation
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Value Proposition */}
                <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30 backdrop-blur-sm">
                    <CardContent className="p-8">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white mb-4">
                                    "We make ANY screening engine's output 10× more valuable."
                                </h3>
                                <p className="text-slate-300 mb-6">
                                    Platform-agnostic analysis layer. Use your preferred docking tool—we handle the rest.
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-white/5 rounded-lg">
                                        <div className="flex justify-center mb-2">
                                            <Sparkles className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <p className="text-sm text-slate-300">XAI Explanations</p>
                                    </div>
                                    <div className="text-center p-4 bg-white/5 rounded-lg">
                                        <div className="flex justify-center mb-2">
                                            <Database className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <p className="text-sm text-slate-300">FAIR Metadata</p>
                                    </div>
                                    <div className="text-center p-4 bg-white/5 rounded-lg">
                                        <div className="flex justify-center mb-2">
                                            <Shield className="w-6 h-6 text-green-400" />
                                        </div>
                                        <p className="text-sm text-slate-300">Blockchain Provenance</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Link href="/screening">
                                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 w-full">
                                        <Layers className="w-4 h-4 mr-2" />
                                        Open Screening Hub
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                                <Link href="/benchmarks/engines">
                                    <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 w-full">
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        Try Benchmark Lab
                                    </Button>
                                </Link>
                                <Link href="/screening/templates">
                                    <Button variant="outline" className="border-green-500/50 text-green-400 hover:bg-green-500/10 w-full">
                                        <Target className="w-4 h-4 mr-2" />
                                        Browse Templates
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx>{`
                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
            `}</style>
        </section>
    );
}
