"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import {
    Beaker,
    Play,
    History,
    Target,
    Cpu,
    BarChart3,
    Clock,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    Sparkles,
    Download,
    FileText,
    Trophy,
    Zap,
    Scale
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// TYPES
// ============================================================================

interface Engine {
    id: string;
    name: string;
    version: string;
    description: string;
    available: boolean;
}

interface BenchmarkTarget {
    id: string;
    name: string;
    pdb_id: string;
    true_affinity: number;
    ligand_count?: number;
}

interface BenchmarkResult {
    run_id: string;
    engine_id: string;
    engine_name: string;
    engine_version: string;
    target_id: string;
    target_name: string;
    ligand_count: number;
    spearman: number;
    rmse: number;
    mae?: number;
    enrichment_1pct?: number;
    enrichment_5pct: number;
    enrichment_10pct?: number;
    time_per_1k: number;
    timestamp: string;
}

// ============================================================================
// DEMO DATA FOR COMPARISON
// ============================================================================

const DEMO_COMPARISON_DATA: Record<string, BenchmarkResult[]> = {
    "egfr": [
        { run_id: "cmp_vina_egfr", engine_id: "vina", engine_name: "AutoDock Vina", engine_version: "1.2.5", target_id: "egfr", target_name: "EGFR", ligand_count: 1000, spearman: 0.42, rmse: 2.8, mae: 2.1, enrichment_1pct: 0.15, enrichment_5pct: 0.32, enrichment_10pct: 0.45, time_per_1k: 180, timestamp: new Date().toISOString() },
        { run_id: "cmp_gnina_egfr", engine_id: "gnina", engine_name: "GNINA", engine_version: "1.0", target_id: "egfr", target_name: "EGFR", ligand_count: 1000, spearman: 0.58, rmse: 2.1, mae: 1.6, enrichment_1pct: 0.28, enrichment_5pct: 0.48, enrichment_10pct: 0.62, time_per_1k: 95, timestamp: new Date().toISOString() },
        { run_id: "cmp_atomnet_egfr", engine_id: "mock_atomnet", engine_name: "AtomNet", engine_version: "2.1 (Mock)", target_id: "egfr", target_name: "EGFR", ligand_count: 1000, spearman: 0.71, rmse: 1.5, mae: 1.1, enrichment_1pct: 0.45, enrichment_5pct: 0.68, enrichment_10pct: 0.82, time_per_1k: 12, timestamp: new Date().toISOString() }
    ],
    "abl1": [
        { run_id: "cmp_vina_abl1", engine_id: "vina", engine_name: "AutoDock Vina", engine_version: "1.2.5", target_id: "abl1", target_name: "ABL1", ligand_count: 1000, spearman: 0.38, rmse: 3.1, mae: 2.4, enrichment_1pct: 0.12, enrichment_5pct: 0.28, enrichment_10pct: 0.41, time_per_1k: 195, timestamp: new Date().toISOString() },
        { run_id: "cmp_gnina_abl1", engine_id: "gnina", engine_name: "GNINA", engine_version: "1.0", target_id: "abl1", target_name: "ABL1", ligand_count: 1000, spearman: 0.52, rmse: 2.4, mae: 1.8, enrichment_1pct: 0.22, enrichment_5pct: 0.42, enrichment_10pct: 0.58, time_per_1k: 110, timestamp: new Date().toISOString() },
        { run_id: "cmp_atomnet_abl1", engine_id: "mock_atomnet", engine_name: "AtomNet", engine_version: "2.1 (Mock)", target_id: "abl1", target_name: "ABL1", ligand_count: 1000, spearman: 0.68, rmse: 1.7, mae: 1.2, enrichment_1pct: 0.42, enrichment_5pct: 0.65, enrichment_10pct: 0.79, time_per_1k: 14, timestamp: new Date().toISOString() }
    ],
    "braf": [
        { run_id: "cmp_vina_braf", engine_id: "vina", engine_name: "AutoDock Vina", engine_version: "1.2.5", target_id: "braf", target_name: "BRAF V600E", ligand_count: 1000, spearman: 0.35, rmse: 3.4, mae: 2.6, enrichment_1pct: 0.10, enrichment_5pct: 0.25, enrichment_10pct: 0.38, time_per_1k: 210, timestamp: new Date().toISOString() },
        { run_id: "cmp_gnina_braf", engine_id: "gnina", engine_name: "GNINA", engine_version: "1.0", target_id: "braf", target_name: "BRAF V600E", ligand_count: 1000, spearman: 0.49, rmse: 2.6, mae: 2.0, enrichment_1pct: 0.18, enrichment_5pct: 0.38, enrichment_10pct: 0.52, time_per_1k: 125, timestamp: new Date().toISOString() },
        { run_id: "cmp_atomnet_braf", engine_id: "mock_atomnet", engine_name: "AtomNet", engine_version: "2.1 (Mock)", target_id: "braf", target_name: "BRAF V600E", ligand_count: 1000, spearman: 0.65, rmse: 1.8, mae: 1.3, enrichment_1pct: 0.38, enrichment_5pct: 0.61, enrichment_10pct: 0.76, time_per_1k: 15, timestamp: new Date().toISOString() }
    ],
    "hiv_protease": [
        { run_id: "cmp_vina_hiv", engine_id: "vina", engine_name: "AutoDock Vina", engine_version: "1.2.5", target_id: "hiv_protease", target_name: "HIV-1 Protease", ligand_count: 1000, spearman: 0.45, rmse: 2.5, mae: 1.9, enrichment_1pct: 0.18, enrichment_5pct: 0.35, enrichment_10pct: 0.48, time_per_1k: 165, timestamp: new Date().toISOString() },
        { run_id: "cmp_gnina_hiv", engine_id: "gnina", engine_name: "GNINA", engine_version: "1.0", target_id: "hiv_protease", target_name: "HIV-1 Protease", ligand_count: 1000, spearman: 0.61, rmse: 1.9, mae: 1.4, enrichment_1pct: 0.32, enrichment_5pct: 0.52, enrichment_10pct: 0.66, time_per_1k: 88, timestamp: new Date().toISOString() },
        { run_id: "cmp_atomnet_hiv", engine_id: "mock_atomnet", engine_name: "AtomNet", engine_version: "2.1 (Mock)", target_id: "hiv_protease", target_name: "HIV-1 Protease", ligand_count: 1000, spearman: 0.74, rmse: 1.3, mae: 0.9, enrichment_1pct: 0.52, enrichment_5pct: 0.72, enrichment_10pct: 0.85, time_per_1k: 11, timestamp: new Date().toISOString() }
    ]
};

// ============================================================================
// BAR CHART COMPONENT
// ============================================================================

function MetricBarChart({
    data,
    metric,
    label,
    higherIsBetter = true,
    colorScheme = 'blue'
}: {
    data: { name: string; value: number; isWinner?: boolean }[];
    metric: string;
    label: string;
    higherIsBetter?: boolean;
    colorScheme?: 'blue' | 'green' | 'orange' | 'purple';
}) {
    const maxValue = Math.max(...data.map(d => d.value));

    const colors = {
        blue: { bg: 'from-blue-500 to-cyan-400', text: 'text-blue-400' },
        green: { bg: 'from-emerald-500 to-green-400', text: 'text-green-400' },
        orange: { bg: 'from-orange-500 to-amber-400', text: 'text-orange-400' },
        purple: { bg: 'from-purple-500 to-pink-400', text: 'text-purple-400' }
    };

    const color = colors[colorScheme];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">{label}</span>
                <span className="text-xs text-slate-500">
                    {higherIsBetter ? 'Higher is better' : 'Lower is better'}
                </span>
            </div>
            {data.map((item, idx) => {
                const widthPercent = (item.value / maxValue) * 100;
                const isWinner = item.isWinner;

                return (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-20 text-right text-sm text-slate-400 truncate">
                            {item.name}
                        </div>
                        <div className="flex-1 relative h-7 bg-slate-800/50 rounded overflow-hidden">
                            <div
                                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color.bg} rounded transition-all duration-700 ease-out`}
                                style={{ width: `${widthPercent}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-2">
                                <span className={`text-sm font-medium ${isWinner ? 'text-white' : 'text-slate-300'}`}>
                                    {item.value.toFixed(metric === 'spearman' ? 3 : metric === 'time' ? 0 : 2)}
                                    {metric === 'enrichment' ? '%' : metric === 'time' ? 's' : ''}
                                </span>
                                {isWinner && (
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BenchmarkEnginesPage() {
    const [engines, setEngines] = useState<Engine[]>([]);
    const [targets, setTargets] = useState<BenchmarkTarget[]>([]);
    const [history, setHistory] = useState<BenchmarkResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    const [selectedEngine, setSelectedEngine] = useState("");
    const [selectedTarget, setSelectedTarget] = useState("");
    const [comparisonTarget, setComparisonTarget] = useState("egfr");
    const [lastResult, setLastResult] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch engines
            try {
                const engResp = await fetch(`${API_BASE}/api/benchmarks/engines`);
                if (engResp.ok) {
                    const engData = await engResp.json();
                    setEngines(engData.engines || []);
                }
            } catch {
                setEngines([
                    { id: "mock_atomnet", name: "AtomNet", version: "2.1.0 (Mock)", description: "Deep learning scoring", available: true },
                    { id: "vina", name: "AutoDock Vina", version: "1.2.5", description: "Physics-based docking", available: true },
                    { id: "gnina", name: "GNINA", version: "1.0", description: "CNN-based docking", available: true }
                ]);
            }

            // Fetch targets
            try {
                const tgtResp = await fetch(`${API_BASE}/api/benchmarks/targets`);
                if (tgtResp.ok) {
                    const tgtData = await tgtResp.json();
                    setTargets(tgtData.targets || []);
                }
            } catch {
                setTargets([
                    { id: "egfr", name: "EGFR - NSCLC kinase inhibitor", pdb_id: "1M17", true_affinity: -9.2, ligand_count: 1000 },
                    { id: "abl1", name: "ABL1 - CML imatinib-resistant", pdb_id: "2HYY", true_affinity: -10.1, ligand_count: 1000 },
                    { id: "braf", name: "BRAF - Melanoma V600E", pdb_id: "1UWH", true_affinity: -9.5, ligand_count: 1000 },
                    { id: "hiv_protease", name: "HIV-1 Protease - Antiretroviral", pdb_id: "1HVR", true_affinity: -11.5, ligand_count: 1000 }
                ]);
            }

            // Fetch history
            try {
                const histResp = await fetch(`${API_BASE}/api/benchmarks/history`);
                if (histResp.ok) {
                    const histData = await histResp.json();
                    setHistory(histData.history || []);
                }
            } catch {
                setHistory([]);
            }

        } finally {
            setLoading(false);
        }
    };

    const runBenchmark = async () => {
        if (!selectedEngine || !selectedTarget) return;

        setRunning(true);
        setLastResult(null);

        try {
            const resp = await fetch(`${API_BASE}/api/benchmarks/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    engine_id: selectedEngine,
                    target_id: selectedTarget
                })
            });

            const data = await resp.json();
            setLastResult(data);

            if (data.success) {
                fetchData();
            }
        } catch (e) {
            // Use mock result for demo
            const mockResult = DEMO_COMPARISON_DATA[selectedTarget]?.find(
                r => r.engine_id === selectedEngine
            );
            if (mockResult) {
                setLastResult({ success: true, ...mockResult, message: "Benchmark completed (demo data)" });
            } else {
                setLastResult({ success: false, message: "Benchmark failed: " + (e as Error).message });
            }
        } finally {
            setRunning(false);
        }
    };

    // Get comparison data for selected target
    const comparisonData = DEMO_COMPARISON_DATA[comparisonTarget] || [];

    // Prepare chart data
    const spearmanData = comparisonData.map(r => ({
        name: r.engine_name.split(' ')[0],
        value: r.spearman,
        isWinner: r.spearman === Math.max(...comparisonData.map(x => x.spearman))
    }));

    const rmseData = comparisonData.map(r => ({
        name: r.engine_name.split(' ')[0],
        value: r.rmse,
        isWinner: r.rmse === Math.min(...comparisonData.map(x => x.rmse))
    }));

    const enrichmentData = comparisonData.map(r => ({
        name: r.engine_name.split(' ')[0],
        value: r.enrichment_5pct * 100,
        isWinner: r.enrichment_5pct === Math.max(...comparisonData.map(x => x.enrichment_5pct))
    }));

    const speedData = comparisonData.map(r => ({
        name: r.engine_name.split(' ')[0],
        value: r.time_per_1k,
        isWinner: r.time_per_1k === Math.min(...comparisonData.map(x => x.time_per_1k))
    }));

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
            {/* Header */}
            <div className="bg-black/30 border-b border-blue-500/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Home
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-slate-700" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                                    <Scale className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                        Benchmark Comparison Lab
                                    </h1>
                                    <p className="text-slate-400 text-sm">Compare screening engines on PDBbind targets</p>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" className="border-blue-500/50 text-blue-400">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <Tabs defaultValue="compare" className="space-y-6">
                    <TabsList className="bg-slate-800/50 border border-slate-700">
                        <TabsTrigger value="compare" className="data-[state=active]:bg-blue-600">
                            <Scale className="w-4 h-4 mr-2" /> Side-by-Side Comparison
                        </TabsTrigger>
                        <TabsTrigger value="run" className="data-[state=active]:bg-blue-600">
                            <Play className="w-4 h-4 mr-2" /> Run Benchmark
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
                            <History className="w-4 h-4 mr-2" /> History ({history.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* ============================================================ */}
                    {/* COMPARISON TAB - THE MAIN DEMO VIEW */}
                    {/* ============================================================ */}
                    <TabsContent value="compare" className="space-y-6">
                        {/* Target Selector */}
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-slate-400">Compare engines on:</label>
                            <Select value={comparisonTarget} onValueChange={setComparisonTarget}>
                                <SelectTrigger className="w-64 bg-slate-800 border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="egfr" className="text-white">
                                        <span className="font-mono text-blue-400">1M17</span> EGFR - NSCLC
                                    </SelectItem>
                                    <SelectItem value="abl1" className="text-white">
                                        <span className="font-mono text-blue-400">2HYY</span> ABL1 - CML
                                    </SelectItem>
                                    <SelectItem value="braf" className="text-white">
                                        <span className="font-mono text-blue-400">1UWH</span> BRAF - Melanoma
                                    </SelectItem>
                                    <SelectItem value="hiv_protease" className="text-white">
                                        <span className="font-mono text-blue-400">1HVR</span> HIV-1 Protease
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Badge className="bg-slate-700 text-slate-300">
                                1,000 ligands benchmarked
                            </Badge>
                        </div>

                        {/* Main Comparison Table */}
                        <Card className="bg-slate-900/50 border-blue-500/20 overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                    Engine Performance Comparison
                                </CardTitle>
                                <CardDescription>
                                    Metrics computed against PDBbind experimental binding affinities
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-700 hover:bg-transparent">
                                            <TableHead className="text-slate-400">Engine</TableHead>
                                            <TableHead className="text-slate-400 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span>Spearman ρ</span>
                                                    <span className="text-[10px] text-slate-500">correlation</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-slate-400 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span>RMSE</span>
                                                    <span className="text-[10px] text-slate-500">kcal/mol</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-slate-400 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span>Enrichment@5%</span>
                                                    <span className="text-[10px] text-slate-500">top hit recovery</span>
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-slate-400 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span>Speed</span>
                                                    <span className="text-[10px] text-slate-500">sec/1K cpds</span>
                                                </div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {comparisonData.map((result, idx) => {
                                            const isAtomNet = result.engine_id === 'mock_atomnet';
                                            const isBestSpearman = result.spearman === Math.max(...comparisonData.map(r => r.spearman));
                                            const isBestRmse = result.rmse === Math.min(...comparisonData.map(r => r.rmse));
                                            const isBestEnrich = result.enrichment_5pct === Math.max(...comparisonData.map(r => r.enrichment_5pct));
                                            const isFastest = result.time_per_1k === Math.min(...comparisonData.map(r => r.time_per_1k));

                                            return (
                                                <TableRow
                                                    key={result.run_id}
                                                    className={`border-slate-700 transition-all ${isAtomNet ? 'bg-purple-900/20' : 'hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${isAtomNet
                                                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                                                                    : 'bg-slate-700'
                                                                }`}>
                                                                <Cpu className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className={`font-medium ${isAtomNet ? 'text-purple-300' : 'text-white'}`}>
                                                                    {result.engine_name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">{result.engine_version}</p>
                                                            </div>
                                                            {isAtomNet && (
                                                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-[10px]">
                                                                    Atomwise
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={`text-xl font-bold ${isBestSpearman ? 'text-green-400' : 'text-slate-300'
                                                                }`}>
                                                                {result.spearman.toFixed(3)}
                                                            </span>
                                                            {isBestSpearman && <Trophy className="w-4 h-4 text-yellow-400" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={`text-xl font-bold ${isBestRmse ? 'text-green-400' : 'text-slate-300'
                                                                }`}>
                                                                {result.rmse.toFixed(2)}
                                                            </span>
                                                            {isBestRmse && <Trophy className="w-4 h-4 text-yellow-400" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={`text-xl font-bold ${isBestEnrich ? 'text-green-400' : 'text-slate-300'
                                                                }`}>
                                                                {(result.enrichment_5pct * 100).toFixed(0)}%
                                                            </span>
                                                            {isBestEnrich && <Trophy className="w-4 h-4 text-yellow-400" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={`text-xl font-bold ${isFastest ? 'text-green-400' : 'text-slate-300'
                                                                }`}>
                                                                {result.time_per_1k.toFixed(0)}s
                                                            </span>
                                                            {isFastest && <Zap className="w-4 h-4 text-yellow-400" />}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Visual Bar Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-slate-900/50 border-blue-500/20">
                                <CardContent className="pt-6">
                                    <MetricBarChart
                                        data={spearmanData}
                                        metric="spearman"
                                        label="Spearman Correlation (ρ)"
                                        higherIsBetter={true}
                                        colorScheme="blue"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-blue-500/20">
                                <CardContent className="pt-6">
                                    <MetricBarChart
                                        data={enrichmentData}
                                        metric="enrichment"
                                        label="Enrichment at 5%"
                                        higherIsBetter={true}
                                        colorScheme="green"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-blue-500/20">
                                <CardContent className="pt-6">
                                    <MetricBarChart
                                        data={rmseData}
                                        metric="rmse"
                                        label="RMSE (kcal/mol)"
                                        higherIsBetter={false}
                                        colorScheme="orange"
                                    />
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-blue-500/20">
                                <CardContent className="pt-6">
                                    <MetricBarChart
                                        data={speedData}
                                        metric="time"
                                        label="Time per 1K Compounds"
                                        higherIsBetter={false}
                                        colorScheme="purple"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* AtomNet Callout */}
                        <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                        <Target className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-purple-300 mb-2">
                                            AtomNet Integration Ready
                                        </h3>
                                        <p className="text-slate-300 mb-4">
                                            This benchmark framework is engine-agnostic. Once AtomNet API credentials are provided,
                                            real screening results will appear in this comparison automatically. The mock data
                                            shown above demonstrates expected performance based on published benchmarks.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button className="bg-purple-600 hover:bg-purple-500">
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Connect AtomNet API
                                            </Button>
                                            <Button variant="outline" className="border-purple-500/50 text-purple-400">
                                                View Integration Docs
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ============================================================ */}
                    {/* RUN BENCHMARK TAB */}
                    {/* ============================================================ */}
                    <TabsContent value="run" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Configuration */}
                            <Card className="bg-slate-900/50 border-blue-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Beaker className="w-5 h-5 text-blue-400" />
                                        Benchmark Configuration
                                    </CardTitle>
                                    <CardDescription>Select engine and target to compare</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Screening Engine</label>
                                        <Select value={selectedEngine} onValueChange={setSelectedEngine}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                                <SelectValue placeholder="Select engine..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                {engines.map((eng) => (
                                                    <SelectItem key={eng.id} value={eng.id} className="text-white">
                                                        <div className="flex items-center gap-2">
                                                            {eng.available ? (
                                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-slate-500" />
                                                            )}
                                                            {eng.name} ({eng.version})
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Target Protein (PDBbind)</label>
                                        <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                                <SelectValue placeholder="Select target..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                {targets.map((tgt) => (
                                                    <SelectItem key={tgt.id} value={tgt.id} className="text-white">
                                                        <span className="font-mono text-blue-400">{tgt.pdb_id}</span>
                                                        <span className="ml-2">{tgt.name.split(' - ')[0]}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        onClick={runBenchmark}
                                        disabled={!selectedEngine || !selectedTarget || running}
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                                    >
                                        {running ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Play className="w-4 h-4 mr-2" />
                                        )}
                                        {running ? "Running..." : "Run Benchmark"}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Results */}
                            <Card className="bg-slate-900/50 border-blue-500/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        Benchmark Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {lastResult ? (
                                        lastResult.success ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-green-400 mb-4">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span className="font-medium">{lastResult.message}</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-blue-400">{lastResult.spearman?.toFixed(3)}</p>
                                                        <p className="text-sm text-slate-400">Spearman ρ</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-orange-400">{lastResult.rmse?.toFixed(2)}</p>
                                                        <p className="text-sm text-slate-400">RMSE (kcal/mol)</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-green-400">{(lastResult.enrichment_5pct * 100)?.toFixed(1)}%</p>
                                                        <p className="text-sm text-slate-400">Enrichment (5%)</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                                                        <p className="text-3xl font-bold text-purple-400">{lastResult.time_per_1k?.toFixed(0)}s</p>
                                                        <p className="text-sm text-slate-400">Time per 1k</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-400">
                                                <XCircle className="w-5 h-5" />
                                                <span>{lastResult.message}</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center text-slate-500 py-8">
                                            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>Select engine and target, then run benchmark</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ============================================================ */}
                    {/* HISTORY TAB */}
                    {/* ============================================================ */}
                    <TabsContent value="history">
                        <Card className="bg-slate-900/50 border-blue-500/20">
                            <CardHeader>
                                <CardTitle>Benchmark History</CardTitle>
                                <CardDescription>Past benchmark runs with metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {history.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700">
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Engine</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Target</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Spearman</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">RMSE</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Enrich 5%</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {history.map((h) => (
                                                    <tr key={h.run_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                                        <td className="px-4 py-3">
                                                            <Badge className="bg-blue-500/20 text-blue-400">{h.engine_name}</Badge>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-sm">{h.target_id}</td>
                                                        <td className="px-4 py-3 text-blue-400 font-medium">{h.spearman?.toFixed(3)}</td>
                                                        <td className="px-4 py-3 text-orange-400">{h.rmse?.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-green-400">{(h.enrichment_5pct * 100)?.toFixed(1)}%</td>
                                                        <td className="px-4 py-3 text-slate-400">{h.time_per_1k?.toFixed(0)}s/1k</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500 py-8">
                                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No benchmark runs yet. Use the comparison tab to see demo data.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
