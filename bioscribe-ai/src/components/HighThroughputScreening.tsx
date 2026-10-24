import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Upload,
    Play,
    Pause,
    Download,
    Filter,
    Zap,
    Database,
    Cpu,
    Clock,
    CheckCircle2,
    TrendingDown,
    FileSpreadsheet,
    Layers,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScreeningJob {
    id: string;
    name: string;
    totalCompounds: number;
    processedCompounds: number;
    status: 'queued' | 'running' | 'paused' | 'complete' | 'failed';
    startTime?: Date;
    estimatedCompletion?: Date;
    topHits: number;
}

interface CompoundResult {
    id: string;
    smiles: string;
    name: string;
    affinity: number;
    druglikeness: number;
    rank: number;
}

export function HighThroughputScreening() {
    const [jobs, setJobs] = useState<ScreeningJob[]>([
        {
            id: 'job-1',
            name: 'ChEMBL Kinase Inhibitors',
            totalCompounds: 150000,
            processedCompounds: 127500,
            status: 'running',
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
            estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000),
            topHits: 247
        },
        {
            id: 'job-2',
            name: 'ZINC Fragment Library',
            totalCompounds: 500000,
            processedCompounds: 500000,
            status: 'complete',
            startTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
            topHits: 892
        }
    ]);

    const [selectedJob, setSelectedJob] = useState<string | null>('job-2');
    const [showResults, setShowResults] = useState(false);

    // Mock top results
    const topResults: CompoundResult[] = [
        { id: 'cmp-1', smiles: 'CC(C)Cc1ccc(cc1)C(C)C(O)=O', name: 'CHEMBL123456', affinity: -11.2, druglikeness: 0.92, rank: 1 },
        { id: 'cmp-2', smiles: 'Cc1ccc(cc1Nc2nccc(n2)c3cccnc3)NC(=O)c4ccc(cc4)CN5CCN(CC5)C', name: 'CHEMBL234567', affinity: -10.8, druglikeness: 0.88, rank: 2 },
        { id: 'cmp-3', smiles: 'CN1CCN(CC1)C(=O)Nc2ccc(cc2)Oc3ccccc3', name: 'CHEMBL345678', affinity: -10.3, druglikeness: 0.85, rank: 3 },
        { id: 'cmp-4', smiles: 'Cc1ccc(cc1)S(=O)(=O)Nc2ccc(cc2)C(=O)Nc3ccccc3', name: 'CHEMBL456789', affinity: -9.9, druglikeness: 0.91, rank: 4 },
        { id: 'cmp-5', smiles: 'COc1ccc(cc1)C(=O)Nc2ccc(cc2)S(=O)(=O)N3CCOCC3', name: 'CHEMBL567890', affinity: -9.7, druglikeness: 0.89, rank: 5 },
    ];

    const handleUpload = () => {
        const newJob: ScreeningJob = {
            id: `job-${Date.now()}`,
            name: 'Custom Upload',
            totalCompounds: 250000,
            processedCompounds: 0,
            status: 'queued',
            topHits: 0
        };
        setJobs([newJob, ...jobs]);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'bg-blue-500 text-white';
            case 'complete': return 'bg-green-500 text-white';
            case 'paused': return 'bg-orange-500 text-white';
            case 'queued': return 'bg-slate-400 text-white';
            case 'failed': return 'bg-red-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const formatTimeRemaining = (date?: Date) => {
        if (!date) return 'N/A';
        const diff = date.getTime() - Date.now();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-blue-600" />
                        High-Throughput Virtual Screening
                    </h2>
                    <p className="text-slate-500">Screen millions of compounds in parallel</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm px-4 py-2">
                    <Cpu className="w-4 h-4 mr-2" />
                    GPU-Accelerated
                </Badge>
            </div>

            {/* Upload Section */}
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 mb-2">Upload Compound Library</h3>
                            <p className="text-sm text-slate-600 mb-4">
                                Supported formats: SDF, SMILES (CSV), MOL2. Maximum: 10M compounds per job.
                            </p>
                            <div className="flex gap-3">
                                <Input type="file" accept=".sdf,.csv,.smi,.mol2" className="flex-1" />
                                <Button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload & Screen
                                </Button>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                <Database className="w-12 h-12 text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold text-blue-600">2.8M</div>
                            <div className="text-xs text-slate-500">Available Compounds</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Jobs Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Screening Jobs</CardTitle>
                            <CardDescription>Active and completed screening runs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {jobs.map((job, idx) => (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card
                                            className={`cursor-pointer transition-all ${selectedJob === job.id ? 'border-2 border-blue-500 shadow-md' : 'border hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedJob(job.id)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-900 mb-1">{job.name}</h4>
                                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                                            <span className="flex items-center gap-1">
                                                                <Database className="w-4 h-4" />
                                                                {job.totalCompounds.toLocaleString()} compounds
                                                            </span>
                                                            {job.startTime && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    Started {new Date(job.startTime).toLocaleTimeString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge className={getStatusColor(job.status)}>
                                                        {job.status.toUpperCase()}
                                                    </Badge>
                                                </div>

                                                {/* Progress Bar */}
                                                {job.status === 'running' && (
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                            <span>{job.processedCompounds.toLocaleString()} / {job.totalCompounds.toLocaleString()}</span>
                                                            <span>ETA: {formatTimeRemaining(job.estimatedCompletion)}</span>
                                                        </div>
                                                        <Progress
                                                            value={(job.processedCompounds / job.totalCompounds) * 100}
                                                            className="h-2"
                                                        />
                                                    </div>
                                                )}

                                                {/* Metrics */}
                                                <div className="flex items-center gap-4 text-sm">
                                                    {job.topHits > 0 && (
                                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                                            <TrendingDown className="w-4 h-4" />
                                                            {job.topHits} top hits ({"<"}-8 kcal/mol)
                                                        </span>
                                                    )}
                                                    {job.status === 'running' && (
                                                        <span className="text-blue-600 font-medium animate-pulse">
                                                            Processing...
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {job.status === 'complete' && (
                                                    <div className="flex gap-2 mt-3">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowResults(true);
                                                            }}
                                                        >
                                                            <FileSpreadsheet className="w-3 h-3 mr-1" />
                                                            View Results
                                                        </Button>
                                                        <Button size="sm" variant="outline">
                                                            <Download className="w-3 h-3 mr-1" />
                                                            Export CSV
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">System Capacity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-2xl font-bold text-slate-900">500K</div>
                                <div className="text-xs text-slate-500">Compounds/Hour</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">8</div>
                                <div className="text-xs text-slate-500">GPU Nodes Active</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {jobs.reduce((acc, j) => acc + j.topHits, 0)}
                                </div>
                                <div className="text-xs text-slate-500">Total Hits Identified</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-cyan-50 border-cyan-200">
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <Zap className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-cyan-900">
                                    <p className="font-bold mb-1">GPU Cluster</p>
                                    <p className="text-xs leading-relaxed">
                                        Powered by 8x NVIDIA A100 GPUs. Capable of screening 10M compounds in under 24 hours.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-orange-50 border-orange-200">
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-orange-900">
                                    <p className="font-bold mb-1">Priority Queue</p>
                                    <p className="text-xs leading-relaxed">
                                        Enterprise users get dedicated GPU allocation for sub-hour turnaround.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Results Table */}
            <AnimatePresence>
                {showResults && selectedJob === 'job-2' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Top Screening Hits</CardTitle>
                                        <CardDescription>
                                            Showing top 5 of {topResults.length} compounds with affinity {"<"} -8 kcal/mol
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" onClick={() => setShowResults(false)}>
                                        Close
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {topResults.map((result, idx) => (
                                        <motion.div
                                            key={result.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className="border-l-4 border-l-green-500">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                                            {result.rank}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h4 className="font-bold text-slate-900">{result.name}</h4>
                                                                <Badge className="bg-green-500 text-white">
                                                                    {result.affinity} kcal/mol
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs font-mono text-slate-600 mb-2">{result.smiles}</p>
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <span className="text-slate-600">
                                                                    Drug-likeness: <span className="font-bold text-purple-600">{(result.druglikeness * 100).toFixed(0)}%</span>
                                                                </span>
                                                                <Button size="sm" variant="outline" className="text-xs">
                                                                    <Download className="w-3 h-3 mr-1" />
                                                                    Export
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-xs">
                                                                    <Zap className="w-3 h-3 mr-1" />
                                                                    Dock
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
