"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UploadWizardModal } from "@/components/UploadWizardModal";
import AtomNetBackground from "@/components/AtomNetBackground";
import {
    Atom,
    Search,
    Plus,
    ChevronRight,
    Beaker,
    Target,
    Sparkles,
    ExternalLink,
    Shield,
    Clock,
    TrendingUp,
    Zap,
    Activity,
    BarChart3,
    ArrowUpRight
} from "lucide-react";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AtomNetProjectSummary {
    project_id: string;
    target_id: string;
    target_name: string | null;
    partner: string | null;
    ligand_count: number;
    top_score: number;
    imported_at: string;
    has_poses: boolean;
    has_xai: boolean;
    source: string;
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 1000) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        startTimeRef.current = null;
        countRef.current = 0;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

            const easeOutQuad = 1 - Math.pow(1 - progress, 3);
            countRef.current = Math.floor(easeOutQuad * end);
            setCount(countRef.current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
}

// Stat Card Component
function StatCard({
    icon: Icon,
    value,
    label,
    gradient,
    delay
}: {
    icon: React.ElementType;
    value: number | string;
    label: string;
    gradient: string;
    delay: number;
}) {
    const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const animatedValue = useAnimatedCounter(numericValue, 1500);
    const displayValue = typeof value === 'number' ? animatedValue : value;

    return (
        <div
            className="atomnet-stat-card opacity-0 animate-fade-in-up group"
            style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards' }}
        >
            <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-3xl font-bold text-white tracking-tight">
                        {typeof value === 'number' ? displayValue.toLocaleString() : value}
                    </p>
                    <p className="text-sm text-slate-400 font-medium">{label}</p>
                </div>
            </div>
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <Icon className="w-full h-full text-white" />
            </div>
        </div>
    );
}

// Project Card Component
function ProjectCard({ project, index }: { project: AtomNetProjectSummary; index: number }) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Link href={`/atomnet/${project.project_id}`}>
            <div
                className="atomnet-card rounded-xl opacity-0 animate-fade-in-up group cursor-pointer"
                style={{ animationDelay: `${0.1 + index * 0.1}s`, animationFillMode: 'forwards' }}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Animated Icon */}
                            <div className="relative">
                                <div className="p-4 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl group-hover:from-purple-500/40 group-hover:to-pink-500/40 transition-all duration-300">
                                    <Atom className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
                                </div>
                                {/* Glow effect on hover */}
                                <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors">
                                        {project.target_name || project.target_id}
                                    </h3>
                                    <Badge
                                        variant="outline"
                                        className="border-purple-500/50 text-purple-400 text-xs font-mono bg-purple-500/10"
                                    >
                                        {project.target_id}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    {project.partner && (
                                        <span className="flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="group-hover:text-slate-300 transition-colors">{project.partner}</span>
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                                        <span>{formatDate(project.imported_at)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            {/* Stats */}
                            <div className="text-center px-4 py-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-800/70 transition-colors">
                                <p className="text-2xl font-bold text-white">{project.ligand_count.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Ligands</p>
                            </div>
                            <div className="text-center px-4 py-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-800/70 transition-colors">
                                <p className="text-2xl font-bold text-green-400">{project.top_score.toFixed(1)}</p>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">kcal/mol</p>
                            </div>

                            {/* Feature Badges */}
                            <div className="flex items-center gap-2">
                                {project.has_xai && (
                                    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        XAI
                                    </Badge>
                                )}
                                {project.has_poses && (
                                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors">
                                        <Activity className="w-3 h-3 mr-1" />
                                        3D
                                    </Badge>
                                )}
                            </div>

                            {/* Arrow */}
                            <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center group-hover:bg-purple-500/20 transition-all duration-300">
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom progress bar */}
                <div className="h-1 bg-slate-800/50 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 group-hover:w-full"
                        style={{ width: '0%' }}
                    />
                </div>
            </div>
        </Link>
    );
}

export default function AtomNetPage() {
    const [projects, setProjects] = useState<AtomNetProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/atomnet/projects`);
            if (response.ok) {
                const data = await response.json();
                setProjects(data.projects || []);
            } else {
                setProjects(getDemoProjects());
            }
        } catch (err) {
            console.log("Using demo projects");
            setProjects(getDemoProjects());
        } finally {
            setLoading(false);
        }
    };

    const getDemoProjects = (): AtomNetProjectSummary[] => [
        {
            project_id: "abl1_kinase_screen_2024q4",
            target_id: "ABL1_HUMAN",
            target_name: "Tyrosine-protein kinase ABL1",
            partner: "Sanofi Oncology",
            ligand_count: 150,
            top_score: -12.5,
            imported_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            has_poses: true,
            has_xai: true,
            source: "AtomNet"
        },
        {
            project_id: "egfr_external_screen_001",
            target_id: "EGFR_HUMAN",
            target_name: "Epidermal growth factor receptor",
            partner: "Novartis Respiratory",
            ligand_count: 100,
            top_score: -11.8,
            imported_at: new Date(Date.now() - 7 * 86400000).toISOString(),
            has_poses: true,
            has_xai: true,
            source: "AtomNet"
        },
        {
            project_id: "braf_v600e_academic_screen",
            target_id: "BRAF_HUMAN",
            target_name: "Serine/threonine-protein kinase B-raf",
            partner: "MIT Koch Institute",
            ligand_count: 75,
            top_score: -11.2,
            imported_at: new Date(Date.now() - 14 * 86400000).toISOString(),
            has_poses: true,
            has_xai: false,
            source: "AtomNet"
        }
    ];

    const filteredProjects = projects.filter(p =>
        p.target_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.target_name && p.target_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.partner && p.partner.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalLigands = projects.reduce((sum, p) => sum + p.ligand_count, 0);
    const bestScore = projects.length > 0 ? Math.min(...projects.map(p => p.top_score)) : 0;
    const xaiCount = projects.filter(p => p.has_xai).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 text-white relative overflow-hidden">
            {/* Animated Background */}
            <AtomNetBackground />

            {/* Content Layer */}
            <div className="relative z-10">
                {/* Header */}
                <div className="bg-black/40 border-b border-purple-500/20 backdrop-blur-xl sticky top-0 z-20">
                    <div className="max-w-7xl mx-auto px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/30 animate-glow-pulse">
                                        <Atom className="w-8 h-8 text-white" />
                                    </div>
                                    {/* Rotating ring */}
                                    <div className="absolute -inset-1 rounded-2xl border border-purple-500/30 animate-spin" style={{ animationDuration: '10s' }} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold gradient-text-purple">
                                        AtomNet Mode
                                    </h1>
                                    <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                        External Screening Engine Integration
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge
                                    variant="outline"
                                    className="border-green-500/50 text-green-400 px-4 py-1.5 bg-green-500/10 backdrop-blur-sm"
                                >
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                                    Connected
                                </Badge>
                                <UploadWizardModal />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
                        <StatCard
                            icon={Target}
                            value={projects.length}
                            label="Active Projects"
                            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                            delay={0.1}
                        />
                        <StatCard
                            icon={Beaker}
                            value={totalLigands}
                            label="Total Ligands"
                            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                            delay={0.2}
                        />
                        <StatCard
                            icon={TrendingUp}
                            value={bestScore.toFixed(1)}
                            label="Best Score (kcal/mol)"
                            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                            delay={0.3}
                        />
                        <StatCard
                            icon={Sparkles}
                            value={xaiCount}
                            label="XAI Explained"
                            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                            delay={0.4}
                        />
                    </div>

                    {/* Quick Start Templates Section */}
                    <div className="mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
                                    <Zap className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">Quick Start Templates</h2>
                                    <p className="text-sm text-slate-400">One-click demo projects with pre-loaded data</p>
                                </div>
                            </div>
                            <Link href="/atomnet/templates">
                                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                                    View All Templates
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* EGFR Template */}
                            <Link href="/atomnet/egfr_nsclc_demo">
                                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-purple-500/20 hover:border-green-500/40 transition-all duration-300 cursor-pointer overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Target className="w-5 h-5 text-green-400" />
                                                <span className="font-semibold text-white">EGFR</span>
                                            </div>
                                            <Badge className="bg-green-500/20 text-green-400 text-xs border-0">
                                                Lung Cancer
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                            Non-small cell lung cancer target with known inhibitors (Erlotinib, Osimertinib)
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">PDB: 1M17</span>
                                            <span className="flex items-center gap-1 text-green-400 group-hover:translate-x-1 transition-transform">
                                                Start Demo <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* ABL1 Template */}
                            <Link href="/atomnet/abl1_kinase_screen_2024q4">
                                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-purple-500/20 hover:border-blue-500/40 transition-all duration-300 cursor-pointer overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Beaker className="w-5 h-5 text-blue-400" />
                                                <span className="font-semibold text-white">ABL1</span>
                                            </div>
                                            <Badge className="bg-blue-500/20 text-blue-400 text-xs border-0">
                                                Leukemia
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                            CML BCR-ABL fusion kinase with Imatinib-resistant variant data
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">PDB: 2HYY</span>
                                            <span className="flex items-center gap-1 text-blue-400 group-hover:translate-x-1 transition-transform">
                                                Start Demo <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* BRAF Template */}
                            <Link href="/atomnet/braf_v600e_academic_screen">
                                <div className="group relative p-4 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-purple-500/20 hover:border-orange-500/40 transition-all duration-300 cursor-pointer overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-orange-400" />
                                                <span className="font-semibold text-white">BRAF V600E</span>
                                            </div>
                                            <Badge className="bg-orange-500/20 text-orange-400 text-xs border-0">
                                                Melanoma
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                            Metastatic melanoma with Vemurafenib and Dabrafenib reference compounds
                                        </p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">PDB: 1UWH</span>
                                            <span className="flex items-center gap-1 text-orange-400 group-hover:translate-x-1 transition-transform">
                                                Start Demo <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        <div className="relative max-w-lg">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search projects, targets, partners..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 py-6 bg-slate-900/60 border-purple-500/30 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    {/* Projects List */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full" />
                                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
                            </div>
                            <p className="mt-4 text-slate-400">Loading projects...</p>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
                            <CardContent className="p-16 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Atom className="w-10 h-10 text-purple-500/50" />
                                </div>
                                <h3 className="text-2xl font-semibold mb-3">No Projects Found</h3>
                                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                                    {searchQuery ? "No projects match your search criteria." : "Import AtomNet results to get started with virtual screening analysis."}
                                </p>
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Import AtomNet Results
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredProjects.map((project, index) => (
                                <ProjectCard key={project.project_id} project={project} index={index} />
                            ))}
                        </div>
                    )}

                    {/* Info Banner */}
                    <div
                        className="mt-10 opacity-0 animate-fade-in-up"
                        style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
                    >
                        <Card className="bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-purple-900/40 border-purple-500/20 backdrop-blur-sm overflow-hidden">
                            <CardContent className="p-6 relative">
                                <div className="flex items-start gap-5">
                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                        <ExternalLink className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                            Atomwise Integration
                                            <Badge className="bg-purple-500/20 text-purple-300 text-xs">Enterprise</Badge>
                                        </h3>
                                        <p className="text-slate-300 text-sm leading-relaxed">
                                            AtomNet Mode allows you to import virtual screening results from Atomwise&apos;s AtomNet platform.
                                            Results are automatically processed with XAI explanations, FAIR metadata, and blockchain logging
                                            for complete reproducibility and transparency.
                                        </p>
                                    </div>
                                    <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 shrink-0">
                                        Learn More
                                        <ArrowUpRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                                {/* Decorative gradient */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

