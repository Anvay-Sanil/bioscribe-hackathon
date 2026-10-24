'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Play, Download, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BatchJob {
    id: string;
    name: string;
    operation: string;
    status: 'queued' | 'running' | 'complete' | 'failed';
    progress: number;
    totalItems: number;
    processedItems: number;
    results?: any[];
    createdAt: Date;
}

export default function BatchPage() {
    const [jobs, setJobs] = useState<BatchJob[]>([
        {
            id: 'job-001',
            name: 'ADMET_Screen_Library_A.csv',
            operation: 'ADMET Prediction',
            status: 'complete',
            progress: 100,
            totalItems: 5000,
            processedItems: 5000,
            createdAt: new Date(Date.now() - 3600000),
            results: []
        },
        {
            id: 'job-002',
            name: 'Docking_KRAS_Inhibitors.sdf',
            operation: 'Molecular Docking',
            status: 'running',
            progress: 67,
            totalItems: 1200,
            processedItems: 804,
            createdAt: new Date(Date.now() - 1800000)
        },
        {
            id: 'job-003',
            name: 'Novel_Molecules_Generation.csv',
            operation: 'Molecule Generation',
            status: 'queued',
            progress: 0,
            totalItems: 10000,
            processedItems: 0,
            createdAt: new Date()
        }
    ]);

    const [selectedOperation, setSelectedOperation] = useState('admet');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const operations = [
        { id: 'admet', label: 'ADMET Prediction', description: 'Predict absorption, distribution, metabolism, excretion, toxicity' },
        { id: 'docking', label: 'Molecular Docking', description: 'Dock molecules to target protein' },
        { id: 'generation', label: 'Molecule Generation', description: 'Generate novel molecules based on parameters' },
        { id: 'target-discovery', label: 'Target Discovery', description: 'Find drug targets for indication' }
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.csv') || file.name.endsWith('.sdf'))) {
            setUploadedFile(file);
        }
    };

    const startBatchJob = () => {
        if (!uploadedFile) return;

        const newJob: BatchJob = {
            id: `job-${Date.now()}`,
            name: uploadedFile.name,
            operation: operations.find(op => op.id === selectedOperation)?.label || '',
            status: 'queued',
            progress: 0,
            totalItems: Math.floor(Math.random() * 10000) + 1000,
            processedItems: 0,
            createdAt: new Date()
        };

        setJobs([newJob, ...jobs]);
        setUploadedFile(null);

        // Simulate job processing
        setTimeout(() => {
            setJobs(prev => prev.map(j =>
                j.id === newJob.id ? { ...j, status: 'running' as const } : j
            ));
        }, 2000);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'complete': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
            case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'running': return <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />;
            case 'queued': return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete': return 'bg-emerald-50 border-emerald-200';
            case 'failed': return 'bg-red-50 border-red-200';
            case 'running': return 'bg-violet-50 border-violet-200';
            case 'queued': return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-12">
            <div className="max-w-7xl mx-auto px-8">
                <div className="mb-12">
                    <h1 className="text-5xl font-light text-slate-900 mb-2">Batch Processing</h1>
                    <p className="text-xl font-light text-slate-600">Process thousands of molecules at scale</p>
                </div>

                {/* Upload Section */}
                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl font-light">Start New Batch Job</CardTitle>
                        <CardDescription>Upload CSV or SDF file with up to 100,000 molecules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* File Upload */}
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-violet-300 rounded-2xl p-12 text-center hover:border-violet-400 transition-colors cursor-pointer bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50"
                        >
                            <input
                                type="file"
                                accept=".csv,.sdf"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                {uploadedFile ? (
                                    <div>
                                        <FileText className="w-16 h-16 text-violet-600 mx-auto mb-4" />
                                        <div className="text-2xl font-light text-slate-900 mb-2">{uploadedFile.name}</div>
                                        <div className="text-sm text-slate-600">{(uploadedFile.size / 1024).toFixed(2)} KB</div>
                                    </div>
                                ) : (
                                    <div>
                                        <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <div className="text-2xl font-light text-slate-600 mb-2">Drop file here or click to browse</div>
                                        <div className="text-sm text-slate-500">Supports CSV and SDF formats</div>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Operation Selection */}
                        <div>
                            <label className="block text-sm font-light text-slate-600 mb-3">Select Operation</label>
                            <div className="grid grid-cols-2 gap-4">
                                {operations.map((op) => (
                                    <button
                                        key={op.id}
                                        onClick={() => setSelectedOperation(op.id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedOperation === op.id
                                                ? 'border-violet-600 bg-violet-50'
                                                : 'border-slate-200 bg-white hover:border-violet-300'
                                            }`}
                                    >
                                        <div className="font-normal text-slate-900 mb-1">{op.label}</div>
                                        <div className="text-sm font-light text-slate-600">{op.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={startBatchJob}
                            disabled={!uploadedFile}
                            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                        >
                            <Play className="w-5 h-5" />
                            Start Batch Job
                        </button>
                    </CardContent>
                </Card>

                {/* Job Queue */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-light text-slate-900">Job Queue</h2>

                    <AnimatePresence>
                        {jobs.map((job) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <Card className={`border-2 ${getStatusColor(job.status)} backdrop-blur-sm`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(job.status)}
                                                <div>
                                                    <div className="font-normal text-slate-900">{job.name}</div>
                                                    <div className="text-sm font-light text-slate-600">{job.operation}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-full bg-white/50 text-sm text-slate-600 capitalize">
                                                    {job.status}
                                                </span>
                                                {job.status === 'complete' && (
                                                    <button className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors flex items-center gap-2">
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {job.status !== 'queued' && (
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-light text-slate-600">
                                                        {job.processedItems.toLocaleString()} / {job.totalItems.toLocaleString()} molecules
                                                    </span>
                                                    <span className="font-mono text-violet-600">{job.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${job.progress}%` }}
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {job.status === 'queued' && (
                                            <div className="text-sm font-light text-slate-600">
                                                Waiting in queue... Estimated start time: 2 minutes
                                            </div>
                                        )}

                                        <div className="mt-3 text-xs text-slate-500">
                                            Started {job.createdAt.toLocaleTimeString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
