'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, TrendingUp, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Paper {
    title: string;
    authors: string;
    journal: string;
    year: number;
    pmid: string;
    abstract: string;
    relevance_score: number;
    key_findings: string[];
}

export default function LiteraturePage() {
    const [searchQuery, setSearchQuery] = useState('KRAS G12C inhibitors');
    const [papers, setPapers] = useState<Paper[]>([
        {
            title: 'Covalent KRAS G12C inhibitors: From hit to clinical candidate',
            authors: 'Fell JB, Fischer JP, Baer BR, et al.',
            journal: 'Journal of Medicinal Chemistry',
            year: 2020,
            pmid: '32356976',
            abstract: 'KRAS G12C is one of the most common oncogenic drivers in lung cancer. Here we describe the discovery and optimization of covalent KRAS G12C inhibitors...',
            relevance_score: 0.95,
            key_findings: [
                'Covalent binding to Cys12 provides selectivity',
                'Switch II pocket targeting identified through screening',
                'Lead compound shows 90% tumor growth inhibition in vivo'
            ]
        },
        {
            title: 'Structural basis of KRAS G12C selectivity in small molecule inhibitors',
            authors: 'Canon J, Rex K, Saiki AY, et al.',
            journal: 'Nature',
            year: 2019,
            pmid: '31666701',
            abstract: 'KRAS mutations are the most common oncogenic driver in cancer. The KRAS G12C mutation creates a druggable cysteine residue...',
            relevance_score: 0.92,
            key_findings: [
                'Crystal structure reveals covalent binding mode',
                'G12C-specific interactions with Switch II pocket',
                'Clinical efficacy demonstrated in Phase I trials'
            ]
        },
        {
            title: 'Sotorasib: First KRAS G12C inhibitor for the treatment of lung cancer',
            authors: 'Hong DS, Fakih MG, Strickler JH, et al.',
            journal: 'Nature Reviews Drug Discovery',
            year: 2021,
            pmid: '33837297',
            abstract: 'Sotorasib is the first FDA-approved inhibitor targeting KRAS G12C, representing a breakthrough in oncology drug development...',
            relevance_score: 0.89,
            key_findings: [
                'FDA approval for NSCLC in May 2021',
                '37.1% objective response rate in CodeBreaK 100 trial',
                'Median duration of response: 11.1 months'
            ]
        }
    ]);

    const searchLiterature = () => {
        // In real implementation, this would call PubMed API
        console.log('Searching for:', searchQuery);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100 py-12">
            <div className="max-w-7xl mx-auto px-8">
                <div className="mb-12">
                    <h1 className="text-5xl font-light text-slate-900 mb-2">Literature Search</h1>
                    <p className="text-xl font-light text-slate-600">Stay current with latest research and patents</p>
                </div>

                {/* Search */}
                <Card className="mb-8 border-none shadow-2xl bg-white/60 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-lg"
                                    placeholder="Search for targets, compounds, diseases..."
                                />
                            </div>
                            <button
                                onClick={searchLiterature}
                                className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-light shadow-lg hover:shadow-xl transition-all"
                            >
                                Search PubMed
                            </button>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button className="px-4 py-2 rounded-lg bg-violet-100 text-violet-700 text-sm hover:bg-violet-200 transition-colors">
                                Last 30 days
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors">
                                Last year
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors">
                                Clinical trials
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors">
                                Patents
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-light text-slate-900">
                            Found {papers.length} papers
                        </h2>
                        <button className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-white transition-colors">
                            Sort by: Relevance
                        </button>
                    </div>

                    <div className="space-y-6">
                        {papers.map((paper, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="border-none shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <CardTitle className="text-2xl font-light flex-1 pr-4">
                                                {paper.title}
                                            </CardTitle>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-mono ${paper.relevance_score > 0.9 ? 'bg-emerald-100 text-emerald-700' :
                                                        paper.relevance_score > 0.8 ? 'bg-violet-100 text-violet-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {(paper.relevance_score * 100).toFixed(0)}% match
                                                </span>
                                                <a
                                                    href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
                                                >
                                                    PMID: {paper.pmid}
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </div>
                                        <CardDescription className="text-base">
                                            {paper.authors} · {paper.journal} ({paper.year})
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-slate-700 font-light mb-4 leading-relaxed">
                                            {paper.abstract}
                                        </p>

                                        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <TrendingUp className="w-5 h-5 text-violet-600" />
                                                <span className="font-normal text-slate-900">Key Findings</span>
                                            </div>
                                            <ul className="space-y-2">
                                                {paper.key_findings.map((finding, fidx) => (
                                                    <li key={fidx} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <span className="text-violet-600 mt-0.5">•</span>
                                                        <span>{finding}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-700 transition-colors flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" />
                                                Save to Workspace
                                            </button>
                                            <button className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-white transition-colors flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Export Citation
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
