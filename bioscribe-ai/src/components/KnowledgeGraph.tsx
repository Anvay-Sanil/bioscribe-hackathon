import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Network,
    Search,
    Dna,
    Pill,
    Target,
    Activity,
    FileText,
    TrendingUp,
    Users,
    Calendar,
    ExternalLink,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GraphNode {
    id: string;
    type: 'disease' | 'target' | 'pathway' | 'drug' | 'trial';
    name: string;
    description: string;
    metadata: Record<string, any>;
}

interface GraphEdge {
    from: string;
    to: string;
    relationship: string;
    confidence: number;
}

export function KnowledgeGraph() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

    // Mock knowledge graph data
    const nodes: GraphNode[] = [
        {
            id: 'disease-1',
            type: 'disease',
            name: 'Alzheimer\'s Disease',
            description: 'Progressive neurodegenerative disorder affecting memory and cognition',
            metadata: {
                prevalence: '6.5M (USA)',
                icd10: 'G30',
                orphanet: 'ORPHA:848'
            }
        },
        {
            id: 'target-1',
            type: 'target',
            name: 'Beta-Secretase 1 (BACE1)',
            description: 'Enzyme involved in amyloid-beta production',
            metadata: {
                uniprot: 'P56817',
                gene: 'BACE1',
                chromosome: '11q23.3'
            }
        },
        {
            id: 'pathway-1',
            type: 'pathway',
            name: 'Amyloid Processing Pathway',
            description: 'APP cleavage and Aβ generation',
            metadata: {
                kegg: 'hsa05010',
                reactome: 'R-HSA-977225'
            }
        },
        {
            id: 'drug-1',
            type: 'drug',
            name: 'Verubecestat',
            description: 'BACE1 inhibitor (failed Phase 3)',
            metadata: {
                chembl: 'CHEMBL3545289',
                mechanism: 'BACE1 inhibitor',
                status: 'Discontinued'
            }
        },
        {
            id: 'trial-1',
            type: 'trial',
            name: 'EPOCH Trial',
            description: 'Phase 3 study in mild-to-moderate AD',
            metadata: {
                nct: 'NCT01739348',
                phase: 'Phase 3',
                status: 'Terminated',
                enrollment: '1958'
            }
        },
        {
            id: 'drug-2',
            type: 'drug',
            name: 'Aducanumab',
            description: 'Monoclonal antibody targeting Aβ plaques',
            metadata: {
                chembl: 'CHEMBL4297604',
                mechanism: 'Anti-amyloid antibody',
                status: 'FDA Approved (2021)'
            }
        }
    ];

    const edges: GraphEdge[] = [
        { from: 'disease-1', to: 'target-1', relationship: 'associated_with', confidence: 0.95 },
        { from: 'target-1', to: 'pathway-1', relationship: 'participates_in', confidence: 0.98 },
        { from: 'drug-1', to: 'target-1', relationship: 'inhibits', confidence: 0.92 },
        { from: 'drug-1', to: 'trial-1', relationship: 'tested_in', confidence: 1.0 },
        { from: 'trial-1', to: 'disease-1', relationship: 'studies', confidence: 1.0 },
        { from: 'drug-2', to: 'disease-1', relationship: 'treats', confidence: 0.78 },
    ];

    const getNodeIcon = (type: string) => {
        switch (type) {
            case 'disease': return <Activity className="w-5 h-5" />;
            case 'target': return <Target className="w-5 h-5" />;
            case 'pathway': return <Network className="w-5 h-5" />;
            case 'drug': return <Pill className="w-5 h-5" />;
            case 'trial': return <FileText className="w-5 h-5" />;
            default: return <Dna className="w-5 h-5" />;
        }
    };

    const getNodeColor = (type: string) => {
        switch (type) {
            case 'disease': return 'bg-red-500 text-white';
            case 'target': return 'bg-blue-500 text-white';
            case 'pathway': return 'bg-purple-500 text-white';
            case 'drug': return 'bg-green-500 text-white';
            case 'trial': return 'bg-orange-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };

    const filteredNodes = searchQuery
        ? nodes.filter(node =>
            node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : nodes;

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Network className="w-6 h-6 text-indigo-600" />
                        Biomedical Knowledge Graph
                    </h2>
                    <p className="text-slate-500">Explore disease-target-drug-trial connections</p>
                </div>
                <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm px-4 py-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    10M+ Relationships
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
                                placeholder="Search diseases, targets, drugs, pathways, or trials..."
                                className="pl-10 h-12 text-base"
                            />
                        </div>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 px-6">
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </Button>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                        <Badge variant="outline" className="cursor-pointer hover:bg-red-50">Disease</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">Target</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-purple-50">Pathway</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-green-50">Drug</Badge>
                        <Badge variant="outline" className="cursor-pointer hover:bg-orange-50">Clinical Trial</Badge>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Node List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Knowledge Graph Entities</CardTitle>
                            <CardDescription>
                                {filteredNodes.length} entities matching your query
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {filteredNodes.map((node, idx) => (
                                    <motion.div
                                        key={node.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card
                                            className={`cursor-pointer transition-all hover:shadow-md ${selectedNode?.id === node.id ? 'border-2 border-indigo-500' : 'border'
                                                }`}
                                            onClick={() => setSelectedNode(node)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-lg ${getNodeColor(node.type)} flex items-center justify-center shrink-0`}>
                                                        {getNodeIcon(node.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-bold text-slate-900 truncate">{node.name}</h4>
                                                            <Badge variant="outline" className="text-xs capitalize">
                                                                {node.type}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-600 line-clamp-2">{node.description}</p>

                                                        {/* Connections */}
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                            <Network className="w-3 h-3" />
                                                            <span>
                                                                {edges.filter(e => e.from === node.id || e.to === node.id).length} connections
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detail Panel */}
                <div>
                    {selectedNode ? (
                        <Card className="sticky top-4">
                            <CardHeader className={`${getNodeColor(selectedNode.type)} rounded-t-lg`}>
                                <div className="flex items-center gap-3">
                                    {getNodeIcon(selectedNode.type)}
                                    <div>
                                        <CardTitle className="text-white">{selectedNode.name}</CardTitle>
                                        <CardDescription className="text-white/80 capitalize">
                                            {selectedNode.type}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                                    <p className="text-sm text-slate-600">{selectedNode.description}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Metadata</h4>
                                    <div className="space-y-2">
                                        {Object.entries(selectedNode.metadata).map(([key, value]) => (
                                            <div key={key} className="flex justify-between text-sm">
                                                <span className="text-slate-500 capitalize">{key.replace('_', ' ')}:</span>
                                                <span className="font-mono text-slate-900">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Connections</h4>
                                    <div className="space-y-2">
                                        {edges
                                            .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                                            .map((edge, idx) => {
                                                const relatedNode = nodes.find(n =>
                                                    n.id === (edge.from === selectedNode.id ? edge.to : edge.from)
                                                );
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                                        <Badge variant="outline" className={getNodeColor(relatedNode?.type || '')}>
                                                            {edge.relationship.replace('_', ' ')}
                                                        </Badge>
                                                        <ChevronRight className="w-3 h-3" />
                                                        <span className="text-slate-700">{relatedNode?.name}</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" size="sm">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View in External DB
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="sticky top-4">
                            <CardContent className="pt-6 pb-6 text-center">
                                <Network className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-400 font-medium mb-2">No entity selected</p>
                                <p className="text-sm text-slate-400">Click on an entity to view details and connections</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-red-500" />
                        <div className="text-2xl font-bold text-slate-900">12K</div>
                        <div className="text-xs text-slate-500">Diseases</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold text-slate-900">45K</div>
                        <div className="text-xs text-slate-500">Drug Targets</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Pill className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold text-slate-900">2.8M</div>
                        <div className="text-xs text-slate-500">Compounds</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                        <div className="text-2xl font-bold text-slate-900">420K</div>
                        <div className="text-xs text-slate-500">Clinical Trials</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <Network className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold text-slate-900">10M+</div>
                        <div className="text-xs text-slate-500">Relationships</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
