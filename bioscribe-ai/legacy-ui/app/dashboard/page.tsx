'use client';

import React from 'react';
import Link from 'next/link';
import {
    Sparkles,
    ArrowRight,
    Clock,
    Target,
    TrendingUp,
    Atom,
    Upload,
    BarChart3,
    Beaker,
    Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const recentProjects = [
        {
            id: '1',
            name: 'Kinase Inhibitor Campaign',
            target: 'BR AF V600E',
            compounds: 247,
            lastRun: '2 hours ago',
            status: 'complete'
        },
        {
            id: '2',
            name: 'GPCR Agonist Discovery',
            target: 'GPR119',
            compounds: 189,
            lastRun: '1 day ago',
            status: 'complete'
        },
        {
            id: '3',
            name: 'Protease Screening',
            target: 'HCV NS3/4A',
            compounds: 156,
            lastRun: '3 days ago',
            status: 'running'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 container-responsive">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mb-24 text-center"
                >
                    <h1 className="text-7xl font-light text-slate-900 mb-6 leading-tight">
                        Welcome back,<br />Dr. Sanil
                    </h1>
                    <p className="text-2xl font-light text-slate-600 mb-12">
                        Ready to discover your next breakthrough?
                    </p>

                    {/* Main CTA Card */}
                    <Link href="/pipeline/new">
                        <motion.div
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="group relative inline-block"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-all duration-500" />
                            <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-12 py-8 rounded-3xl shadow-2xl shadow-violet-500/50 group-hover:shadow-violet-500/70">
                                <div className="flex items-center justify-center gap-4">
                                    <Sparkles className="w-8 h-8" />
                                    <div className="text-left">
                                        <div className="text-3xl font-light mb-1">Start New Discovery</div>
                                        <div className="text-lg font-light text-violet-100">Complete analysis pipeline</div>
                                    </div>
                                    <ArrowRight className="w-7 h-7 ml-4 group-hover:translate-x-2 transition-transform duration-400" />
                                </div>
                            </div>
                        </motion.div>
                    </Link>

                    {/* AtomNet Integration Quick Access */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-12">
                        <Link href="/atomnet">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="bg-purple-500/10 border border-purple-300/30 rounded-2xl p-5 hover:bg-purple-500/20 transition-colors group"
                            >
                                <Atom className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                                <div className="font-medium text-slate-800">AtomNet Mode</div>
                                <div className="text-sm text-slate-600">Import & analyze results</div>
                            </motion.div>
                        </Link>
                        <Link href="/atomnet/templates">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="bg-green-500/10 border border-green-300/30 rounded-2xl p-5 hover:bg-green-500/20 transition-colors group"
                            >
                                <Target className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                                <div className="font-medium text-slate-800">Templates</div>
                                <div className="text-sm text-slate-600">EGFR, BRAF, HIV & more</div>
                            </motion.div>
                        </Link>
                        <Link href="/benchmarks/engines">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="bg-blue-500/10 border border-blue-300/30 rounded-2xl p-5 hover:bg-blue-500/20 transition-colors group"
                            >
                                <BarChart3 className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                                <div className="font-medium text-slate-800">Benchmark Lab</div>
                                <div className="text-sm text-slate-600">Compare engines</div>
                            </motion.div>
                        </Link>
                        <Link href="/screen">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="bg-orange-500/10 border border-orange-300/30 rounded-2xl p-5 hover:bg-orange-500/20 transition-colors group"
                            >
                                <Beaker className="w-8 h-8 text-orange-600 mb-3 group-hover:scale-110 transition-transform" />
                                <div className="font-medium text-slate-800">Virtual Screen</div>
                                <div className="text-sm text-slate-600">Run HTS campaigns</div>
                            </motion.div>
                        </Link>
                        <Link href="/clinical-safety">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                className="bg-red-500/10 border border-red-300/30 rounded-2xl p-5 hover:bg-red-500/20 transition-colors group relative overflow-hidden"
                            >
                                <div className="absolute top-2 right-2">
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full animate-pulse">NEW</span>
                                </div>
                                <Shield className="w-8 h-8 text-red-600 mb-3 group-hover:scale-110 transition-transform" />
                                <div className="font-medium text-slate-800">Clinical Safety</div>
                                <div className="text-sm text-slate-600">DDI, AE, PGx Suite</div>
                            </motion.div>
                        </Link>
                    </div>
                </motion.div>

                {/* Recent Projects */}
                <div className="mb-24">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-4xl font-light text-slate-900">Recent Projects</h2>
                        <Link href="/projects" className="text-violet-600 hover:text-violet-700 font-light flex items-center gap-2 transition-colors duration-300">
                            View all
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {recentProjects.map((project, idx) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: idx * 0.15, ease: "easeOut" }}
                            >
                                <Link href={`/results/${project.id}`}>
                                    <div className="group glass-premium hover-lift rounded-3xl shadow-sm overflow-hidden border border-slate-100/50">
                                        <div className="h-48 bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 flex items-center justify-center relative overflow-hidden">
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    rotate: [0, 90, 0]
                                                }}
                                                transition={{
                                                    duration: 20,
                                                    repeat: Infinity,
                                                    ease: "linear"
                                                }}
                                            />
                                            <div className="relative z-10 text-6xl font-light text-violet-300">
                                                {project.compounds}
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            <h3 className="font-normal text-xl text-slate-900 mb-3 group-hover:text-violet-600 transition-colors duration-300">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-slate-600 mb-4 font-light">
                                                <Target className="w-5 h-5" />
                                                {project.target}
                                            </div>
                                            <div className="flex items-center justify-between text-sm font-light">
                                                <span className="text-slate-500 flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4" />
                                                    {project.lastRun}
                                                </span>
                                                <span className="font-normal text-violet-600">{project.compounds} hits</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Stats Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                    className="glass-premium rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl border border-slate-100/50"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-gradient-blue mb-3">24</div>
                            <div className="text-base lg:text-lg font-light text-slate-600">Total Campaigns</div>
                        </div>
                        <div className="text-center border-y sm:border-y-0 sm:border-x border-slate-200/50 py-6 sm:py-0">
                            <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-gradient-sunset mb-3">3,247</div>
                            <div className="text-base lg:text-lg font-light text-slate-600">Compounds Analyzed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl lg:text-6xl font-light text-gradient-ocean mb-3">89</div>
                            <div className="text-base lg:text-lg font-light text-slate-600">Lead Candidates</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
