"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import AtomNetXAIPanel from "@/components/AtomNetXAIPanel";
import { AtomNet3DViewer } from "@/components/AtomNet3DViewer";
import {
    Atom,
    ArrowLeft,
    Download,
    FileJson,
    FileSpreadsheet,
    FileText,
    Beaker,
    Target,
    Sparkles,
    Shield,
    Database,
    ChevronDown,
    ChevronUp,
    Eye,
    Info,
    Dna,
    Zap,
    Link2,
    BarChart3
} from "lucide-react";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LigandData {
    ligand_id: string;
    smiles: string;
    score: number;
    rank: number;
    molecular_weight?: number;
    logp?: number;
    tpsa?: number;
    hbd?: number;
    hba?: number;
}

interface XAIExplanation {
    ligand_id: string;
    fragment_contributions: { fragment_name: string; contribution: number }[];
    residue_contacts: { residue_name: string; residue_number: number; interaction_type: string; distance: number }[];
    explanation_summary: string;
    confidence: number;
}

interface ProjectData {
    project_id: string;
    target: {
        id: string;
        name?: string;
        uniprot?: string;
        pdb_id?: string;
        sequence?: string;
    };
    ligands: LigandData[];
    metadata: {
        partner?: string;
        atomnet_version?: string;
        imported_at: string;
    };
    status: {
        xai_generated: boolean;
        fair_generated: boolean;
        blockchain_recorded: boolean;
    };
}

export default function AtomNetProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params);
    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLigand, setSelectedLigand] = useState<LigandData | null>(null);
    const [xaiData, setXaiData] = useState<XAIExplanation | null>(null);
    const [sortColumn, setSortColumn] = useState<"rank" | "score" | "molecular_weight">("rank");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/atomnet/projects/${projectId}`);
            if (response.ok) {
                const data = await response.json();
                setProject(data);
                if (data.ligands && data.ligands.length > 0) {
                    setSelectedLigand(data.ligands[0]);
                }
            } else {
                // Use demo data
                const demo = getDemoProject();
                setProject(demo);
                setSelectedLigand(demo.ligands[0]);
            }
        } catch (err) {
            const demo = getDemoProject();
            setProject(demo);
            setSelectedLigand(demo.ligands[0]);
        } finally {
            setLoading(false);
        }
    };

    const getDemoProject = (): ProjectData => ({
        project_id: projectId,
        target: {
            id: projectId.includes("egfr") ? "EGFR_HUMAN" : projectId.includes("braf") ? "BRAF_HUMAN" : "ABL1_HUMAN",
            name: projectId.includes("egfr") ? "Epidermal growth factor receptor" : projectId.includes("braf") ? "Serine/threonine-protein kinase B-raf" : "Tyrosine-protein kinase ABL1",
            uniprot: projectId.includes("egfr") ? "P00533" : projectId.includes("braf") ? "P15056" : "P00519",
            pdb_id: projectId.includes("egfr") ? "1M17" : projectId.includes("braf") ? "1UWH" : "2HYY",
            sequence: "MGLPNSSSGSKWRPKSGNKKKKEKQQEKERDRFHPLQNQRQILNALSRQHSAYQLNSKNTFHCEEMGPPTTRHGGNPTIIHKYVPSIQHNIPVIPSSAVSIGQTEIQLSDLLVRQLSSLQPPSKGSFKLWAHGGLPVRGRLERLKGRGFRGDIRGLPQGRYNNPFSAIREGDSLVCTIKAKVLDLNNAIKRVNCGFFQTNKYLYTVLVPVLQEPVKYPLVNLSQHDPLRMLNSSLTIQLLPNHIQYQAPWFSVLEAELTSQLAPQVLALYNLIIDLPVTTPQVKHAILNLILESGRLVKRFGFEDQLRNLGPPSKLQSMLKQLERQQLLLQEMTTFFQPEEYNKEISKFAVVHPMRSKLLQLLLTGLRPGSGQPKQGRLQHMQSQQQLQRMLPPPPKTTRKLL"
        },
        ligands: Array.from({ length: projectId.includes("egfr") ? 100 : projectId.includes("braf") ? 75 : 150 }, (_, i) => ({
            ligand_id: `${projectId.includes("egfr") ? "EGFR" : projectId.includes("braf") ? "BRAF" : "ABL1"}_${String(i + 1).padStart(5, '0')}`,
            smiles: `Cc1ccc(NC(=O)c2ccccc2)cc1${i > 0 ? 'C' : ''}`,
            score: -12.5 + (i * 0.15) + (Math.random() * 0.2),
            rank: i + 1,
            molecular_weight: 280 + (i * 5) + Math.random() * 20,
            logp: 2.5 + Math.random() * 2,
            tpsa: 50 + Math.random() * 40,
            hbd: Math.floor(Math.random() * 4),
            hba: Math.floor(Math.random() * 6) + 2
        })),
        metadata: {
            partner: projectId.includes("egfr") ? "Novartis Respiratory" : projectId.includes("braf") ? "MIT Koch Institute" : "Sanofi Oncology",
            atomnet_version: "AtomNet v2.1.0",
            imported_at: new Date().toISOString()
        },
        status: {
            xai_generated: true,
            fair_generated: true,
            blockchain_recorded: projectId.includes("abl1")
        }
    });

    const handleSort = (column: "rank" | "score" | "molecular_weight") => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const sortedLigands = project?.ligands ? [...project.ligands].sort((a, b) => {
        const aVal = a[sortColumn] || 0;
        const bVal = b[sortColumn] || 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }) : [];

    const handleExport = async (format: "json" | "csv" | "pdf") => {
        try {
            const response = await fetch(`${API_BASE}/api/atomnet/projects/${projectId}/reports?format=${format}`);
            if (response.ok) {
                const data = await response.json();
                // Download the content
                const blob = new Blob([data.reports[format] || ""], { type: `text/${format}` });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${projectId}_report.${format}`;
                a.click();
            }
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    const fetchXAI = async (ligandId: string) => {
        try {
            const response = await fetch(`${API_BASE}/api/atomnet/projects/${projectId}/xai`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ligand_ids: [ligandId] })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.explanations && data.explanations.length > 0) {
                    setXaiData(data.explanations[0]);
                }
            } else {
                // Demo XAI
                setXaiData(getDemoXAI(ligandId));
            }
        } catch (err) {
            setXaiData(getDemoXAI(ligandId));
        }
    };

    const getDemoXAI = (ligandId: string): XAIExplanation => ({
        ligand_id: ligandId,
        fragment_contributions: [
            { fragment_name: "aromatic ring", contribution: 0.35 },
            { fragment_name: "carbonyl", contribution: 0.22 },
            { fragment_name: "amine", contribution: -0.15 },
            { fragment_name: "methyl", contribution: 0.08 },
            { fragment_name: "hydroxyl", contribution: -0.05 }
        ],
        residue_contacts: [
            { residue_name: "PHE", residue_number: 317, interaction_type: "pi_pi", distance: 3.2 },
            { residue_name: "THR", residue_number: 315, interaction_type: "h_bond", distance: 2.8 },
            { residue_name: "LEU", residue_number: 248, interaction_type: "hydrophobic", distance: 3.5 },
            { residue_name: "GLU", residue_number: 286, interaction_type: "salt_bridge", distance: 3.1 },
            { residue_name: "ALA", residue_number: 269, interaction_type: "hydrophobic", distance: 3.8 }
        ],
        explanation_summary: `${ligandId} shows strong binding primarily through π-π stacking with PHE317 and hydrogen bonding with THR315. The aromatic ring system contributes significantly to binding affinity.`,
        confidence: 0.85
    });

    useEffect(() => {
        if (selectedLigand) {
            fetchXAI(selectedLigand.ligand_id);
        }
    }, [selectedLigand]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <Card className="bg-slate-900/50 border-purple-500/20 p-8 text-center">
                    <h2 className="text-xl font-bold text-white mb-4">Project Not Found</h2>
                    <Link href="/atomnet">
                        <Button variant="outline" className="border-purple-500/50 text-purple-400">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
            {/* Header */}
            <div className="bg-black/30 border-b border-purple-500/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/atomnet">
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-slate-700" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                    <Atom className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {project.target.name || project.target.id}
                                    </h1>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">
                                            {project.target.id}
                                        </Badge>
                                        {project.metadata.partner && (
                                            <>
                                                <span>•</span>
                                                <span>{project.metadata.partner}</span>
                                            </>
                                        )}
                                        <span>•</span>
                                        <span>Source: AtomNet</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-500/50 text-purple-400"
                                onClick={() => handleExport("json")}
                            >
                                <FileJson className="w-4 h-4 mr-2" />
                                JSON
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-500/50 text-purple-400"
                                onClick={() => handleExport("csv")}
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                CSV
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                                size="sm"
                                onClick={() => handleExport("pdf")}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Target Info & 3D Viewer */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Target Info */}
                        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="w-5 h-5 text-purple-400" />
                                    Target Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">UniProt</span>
                                    <span className="font-mono">{project.target.uniprot || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">PDB ID</span>
                                    <span className="font-mono">{project.target.pdb_id || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Sequence Length</span>
                                    <span>{project.target.sequence?.length || 0} aa</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">AtomNet Version</span>
                                    <span>{project.metadata.atomnet_version || "—"}</span>
                                </div>
                            </CardContent>
                        </Card>


                        {/* Interactive 3D Viewer with NGL */}
                        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Dna className="w-5 h-5 text-pink-400" />
                                    3D Structure Viewer
                                    <Badge variant="outline" className="ml-auto text-xs border-green-500/50 text-green-400">
                                        Interactive
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-sm">
                                    Click ligands to view XAI explanations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AtomNet3DViewer
                                    pdbId={project.target.pdb_id}
                                    ligands={project.ligands}
                                    selectedLigandId={selectedLigand?.ligand_id}
                                    onLigandSelect={(ligand) => setSelectedLigand(ligand)}
                                    maxLigands={5}
                                />
                                <div className="flex gap-2 mt-3">
                                    {project.target.pdb_id && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 border-slate-600 text-slate-300"
                                            onClick={() => window.open(`https://www.rcsb.org/structure/${project.target.pdb_id}`, '_blank')}
                                        >
                                            <Eye className="w-3 h-3 mr-1" /> RCSB PDB
                                        </Button>
                                    )}
                                    {project.target.uniprot && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 border-slate-600 text-slate-300"
                                            onClick={() => window.open(`https://www.uniprot.org/uniprotkb/${project.target.uniprot}`, '_blank')}
                                        >
                                            UniProt
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Badges */}
                        <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Sparkles className="w-4 h-4 text-blue-400" />
                                        XAI Explanations
                                    </span>
                                    <Badge className={project.status.xai_generated ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}>
                                        {project.status.xai_generated ? "Generated" : "Pending"}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Database className="w-4 h-4 text-purple-400" />
                                        FAIR Metadata
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-purple-400 hover:text-purple-300"
                                        onClick={async () => {
                                            try {
                                                const resp = await fetch(`${API_BASE}/api/atomnet/projects/${projectId}/fair`);
                                                const data = await resp.json();
                                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                window.open(url, '_blank');
                                            } catch (e) {
                                                alert('Demo: FAIR metadata generated (RO-Crate format)');
                                            }
                                        }}
                                    >
                                        View JSON
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Shield className="w-4 h-4 text-yellow-400" />
                                        Blockchain Record
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-yellow-400 hover:text-yellow-300"
                                        onClick={async () => {
                                            try {
                                                const resp = await fetch(`${API_BASE}/api/atomnet/projects/${projectId}/blockchain`, { method: 'POST' });
                                                const data = await resp.json();
                                                if (data.etherscan_url) {
                                                    window.open(data.etherscan_url, '_blank');
                                                }
                                            } catch (e) {
                                                // Demo: open a sample etherscan page
                                                window.open('https://etherscan.io/tx/0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''), '_blank');
                                            }
                                        }}
                                    >
                                        {project.status.blockchain_recorded ? "View TX" : "Record"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel - Ligand Table & Explanation */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-slate-800/50 border border-slate-700">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="ligands" className="data-[state=active]:bg-purple-600">
                                    Ligands ({project.ligands.length})
                                </TabsTrigger>
                                <TabsTrigger value="xai" className="data-[state=active]:bg-purple-600">
                                    XAI Explanation
                                </TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-slate-900/50 border-purple-500/20">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-4xl font-bold text-white">{project.ligands.length}</p>
                                            <p className="text-sm text-slate-400">Total Ligands</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-900/50 border-purple-500/20">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-4xl font-bold text-green-400">
                                                {project.ligands.length > 0 ? project.ligands[0].score.toFixed(1) : "—"}
                                            </p>
                                            <p className="text-sm text-slate-400">Best Score (kcal/mol)</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Top 5 Preview */}
                                <Card className="bg-slate-900/50 border-purple-500/20 mt-4">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Top 5 Hits</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {project.ligands.slice(0, 5).map((lig) => (
                                                <div
                                                    key={lig.ligand_id}
                                                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedLigand(lig);
                                                        setActiveTab("xai");
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Badge className="bg-purple-500/20 text-purple-400">#{lig.rank}</Badge>
                                                        <span className="font-mono text-sm">{lig.ligand_id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-green-400 font-bold">{lig.score.toFixed(2)} kcal/mol</span>
                                                        <Sparkles className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Ligands Tab */}
                            <TabsContent value="ligands" className="mt-4">
                                <Card className="bg-slate-900/50 border-purple-500/20">
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-700">
                                                        <th
                                                            className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                                            onClick={() => handleSort("rank")}
                                                        >
                                                            Rank {sortColumn === "rank" && (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
                                                        <th
                                                            className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                                            onClick={() => handleSort("score")}
                                                        >
                                                            Score {sortColumn === "score" && (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                                        </th>
                                                        <th
                                                            className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white"
                                                            onClick={() => handleSort("molecular_weight")}
                                                        >
                                                            MW {sortColumn === "molecular_weight" && (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">LogP</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sortedLigands.map((lig) => (
                                                        <tr
                                                            key={lig.ligand_id}
                                                            className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer ${selectedLigand?.ligand_id === lig.ligand_id ? 'bg-purple-900/30' : ''}`}
                                                            onClick={() => setSelectedLigand(lig)}
                                                        >
                                                            <td className="px-4 py-3">
                                                                <Badge className="bg-slate-700">{lig.rank}</Badge>
                                                            </td>
                                                            <td className="px-4 py-3 font-mono text-sm">{lig.ligand_id}</td>
                                                            <td className="px-4 py-3 text-green-400 font-medium">{lig.score.toFixed(2)}</td>
                                                            <td className="px-4 py-3">{lig.molecular_weight?.toFixed(1) || "—"}</td>
                                                            <td className="px-4 py-3">{lig.logp?.toFixed(2) || "—"}</td>
                                                            <td className="px-4 py-3">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedLigand(lig);
                                                                        setActiveTab("xai");
                                                                    }}
                                                                >
                                                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* XAI Tab */}
                            <TabsContent value="xai" className="mt-4">
                                <AtomNetXAIPanel
                                    xaiData={xaiData}
                                    ligandScores={project.ligands.map(l => l.score)}
                                    selectedScore={selectedLigand?.score}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
