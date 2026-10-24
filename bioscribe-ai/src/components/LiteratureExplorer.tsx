import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    FileText,
    Search,
    ExternalLink,
    Calendar,
    Users,
    TrendingUp,
    BookOpen,
    Scale,
    Sparkles,
    Download,
    Copy,
    Star,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Publication {
    id: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    pmid?: string;
    doi?: string;
    abstract: string;
    citations: number;
    relevance: number;
    aiSummary: string;
}

interface Patent {
    id: string;
    title: string;
    assignee: string;
    patentNumber: string;
    filingDate: string;
    status: 'Active' | 'Expired' | 'Pending';
    abstract: string;
    claims: number;
    relevance: number;
}

export function LiteratureExplorer() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTab, setSelectedTab] = useState('publications');
    const [selectedPub, setSelectedPub] = useState<Publication | null>(null);

    // Mock publications data
    const publications: Publication[] = [
        {
            id: 'pub-1',
            title: 'Structure-Based Discovery of BACE1 Inhibitors for Alzheimer\'s Disease Treatment',
            authors: ['Smith JA', 'Johnson KL', 'Williams MT'],
            journal: 'Nature Medicine',
            year: 2023,
            pmid: '36789012',
            doi: '10.1038/nm.2023.456',
            abstract: 'We report the structure-guided design and optimization of a novel series of BACE1 inhibitors with improved brain penetration and reduced off-target effects...',
            citations: 127,
            relevance: 95,
            aiSummary: 'Key Finding: Novel BACE1 inhibitor with 10-fold improved BBB permeability. Primary Innovation: Introduction of polar substituent at R2 position reduced P-gp efflux while maintaining potency (IC50 = 3.2 nM). Clinical Relevance: Addressed major failure mode of verubecestat.'
        },
        {
            id: 'pub-2',
            title: 'AI-Driven De Novo Molecular Design for Multi-Target Drug Discovery',
            authors: ['Chen Y', 'Zhang L', 'Park SH'],
            journal: 'Cell Chemical Biology',
            year: 2024,
            pmid: '37234567',
            doi: '10.1016/j.chembiol.2024.02.015',
            abstract: 'We developed a transformer-based generative model capable of designing molecules with desired multi-target profiles...',
            citations: 89,
            relevance: 88,
            aiSummary: 'Key Finding: Transformer model achieves 78% success rate in generating molecules hitting 2+ targets. Methodology: Conditional generation with property constraints (MW, LogP, QED). Validation: Synthesized 12/15 top candidates, 9 showed dual activity.'
        },
        {
            id: 'pub-3',
            title: 'Retrosynthesis Planning with Deep Reinforcement Learning',
            authors: ['Kumar R', 'Anderson E', 'Thompson BC'],
            journal: 'Science',
            year: 2023,
            pmid: '36456789',
            doi: '10.1126/science.2023.abc123',
            abstract: 'A reinforcement learning approach to retrosynthetic planning that outperforms expert chemists in route selection...',
            citations: 234,
            relevance: 82,
            aiSummary: 'Key Finding: RL agent trained on 10M reactions achieves 92% success rate vs 76% for expert chemists. Innovation: Reward function incorporates cost, yield, and step count. Impact: Reduces synthesis planning time from 2 weeks to 2 hours.'
        }
    ];

    const patents: Patent[] = [
        {
            id: 'pat-1',
            title: 'Beta-Secretase Inhibitors and Methods for Treating Alzheimer\'s Disease',
            assignee: 'Merck & Co.',
            patentNumber: 'US10,987,654',
            filingDate: '2019-03-15',
            status: 'Active',
            abstract: 'The present invention relates to novel BACE1 inhibitors comprising a heterocyclic core and methods of treating neurodegenerative diseases...',
            claims: 24,
            relevance: 91
        },
        {
            id: 'pat-2',
            title: 'AI-Based Molecular Generation System for Drug Discovery',
            assignee: 'Insilico Medicine',
            patentNumber: 'US11,234,567',
            filingDate: '2020-08-22',
            status: 'Active',
            abstract: 'Systems and methods for generating novel molecular structures using deep generative models with multi-objective optimization...',
            claims: 18,
            relevance: 85
        },
        {
            id: 'pat-3',
            title: 'Methods for Retrosynthetic Analysis Using Neural Networks',
            assignee: 'IBM Corporation',
            patentNumber: 'US10,555,321',
            filingDate: '2018-11-10',
            status: 'Active',
            abstract: 'Computer-implemented methods for determining synthesis routes using trained neural network models...',
            claims: 15,
            relevance: 79
        }
    ];

    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => setIsSearching(false), 1500);
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        Literature & Patent Explorer
                    </h2>
                    <p className="text-slate-500">Search scientific publications and patent databases with AI summarization</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-4 py-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI-Powered
                </Badge>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by compound name, target, disease, or mechanism..."
                                className="pl-10 h-12 text-base"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-blue-600 hover:bg-blue-700 px-6"
                        >
                            {isSearching ? (
                                <>
                                    <Search className="w-4 h-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Search
                                </>
                            )}
                        </Button>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">PubMed</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">Google Scholar</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">USPTO</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">EPO</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">Clinical Trials</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                    <TabsTrigger value="publications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                        <FileText className="w-4 h-4 mr-2" />
                        Publications ({publications.length})
                    </TabsTrigger>
                    <TabsTrigger value="patents" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                        <Scale className="w-4 h-4 mr-2" />
                        Patents ({patents.length})
                    </TabsTrigger>
                </TabsList>

                {/* Publications Tab */}
                <TabsContent value="publications" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="space-y-4">
                                {publications.map((pub, idx) => (
                                    <motion.div
                                        key={pub.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card
                                            className={`cursor-pointer transition-all hover:shadow-lg ${selectedPub?.id === pub.id ? 'border-2 border-blue-500' : 'border hover:border-blue-300'
                                                }`}
                                            onClick={() => setSelectedPub(pub)}
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-slate-900 mb-2 leading-snug">{pub.title}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-slate-600 mb-2">
                                                            <span className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                {pub.authors[0]} et al.
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {pub.year}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <TrendingUp className="w-4 h-4" />
                                                                {pub.citations} citations
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-blue-600 font-medium mb-2">{pub.journal}</p>
                                                    </div>
                                                    <Badge className="bg-green-500 text-white ml-3 shrink-0">
                                                        {pub.relevance}% match
                                                    </Badge>
                                                </div>

                                                {/* AI Summary */}
                                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                    <div className="flex items-start gap-2">
                                                        <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <h4 className="text-xs font-bold text-purple-900 mb-1">AI Summary</h4>
                                                            <p className="text-xs text-purple-800 leading-relaxed">{pub.aiSummary}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 mt-3">
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        PubMed
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <Copy className="w-3 h-3 mr-1" />
                                                        Copy Citation
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <Download className="w-3 h-3 mr-1" />
                                                        PDF
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Stats Sidebar */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Search Statistics</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">2.3M</div>
                                        <div className="text-xs text-slate-500">Total Publications Indexed</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">{publications.length}</div>
                                        <div className="text-xs text-slate-500">Results Found</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">89%</div>
                                        <div className="text-xs text-slate-500">Avg. Relevance Score</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-900">
                                            <p className="font-bold mb-1">AI Summary Powered by GPT-4</p>
                                            <p className="text-xs leading-relaxed">
                                                Each paper is automatically analyzed to extract key findings, methodology, and clinical relevance.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Patents Tab */}
                <TabsContent value="patents" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="space-y-4">
                                {patents.map((patent, idx) => (
                                    <motion.div
                                        key={patent.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <Card className="hover:shadow-lg transition-shadow border hover:border-indigo-300">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="font-bold text-slate-900 leading-snug">{patent.title}</h3>
                                                            <Badge className={`ml-2 text-xs ${patent.status === 'Active' ? 'bg-green-500 text-white' :
                                                                    patent.status === 'Expired' ? 'bg-red-500 text-white' :
                                                                        'bg-orange-500 text-white'
                                                                }`}>
                                                                {patent.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                                                            <span className="font-mono text-blue-600 font-bold">{patent.patentNumber}</span>
                                                            <span>{patent.assignee}</span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {patent.filingDate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-indigo-500 text-white ml-3 shrink-0">
                                                        {patent.relevance}% match
                                                    </Badge>
                                                </div>

                                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{patent.abstract}</p>

                                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="w-3 h-3" />
                                                        {patent.claims} claims
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        USPTO
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Download PDF
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-xs">
                                                        <Star className="w-3 h-3 mr-1" />
                                                        Save
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Patent Stats */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Patent Intelligence</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <div className="text-2xl font-bold text-slate-900">1.2M</div>
                                        <div className="text-xs text-slate-500">Patents Indexed (USPTO + EPO)</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-indigo-600">{patents.length}</div>
                                        <div className="text-xs text-slate-500">Relevant Patents</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">{patents.filter(p => p.status === 'Active').length}</div>
                                        <div className="text-xs text-slate-500">Active Patents</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-orange-50 border-orange-200">
                                <CardContent className="p-4">
                                    <div className="flex gap-3">
                                        <Scale className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                                        <div className="text-sm text-orange-900">
                                            <p className="font-bold mb-1">Freedom to Operate</p>
                                            <p className="text-xs leading-relaxed">
                                                Check for conflicting patents before advancing candidates to synthesis.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
