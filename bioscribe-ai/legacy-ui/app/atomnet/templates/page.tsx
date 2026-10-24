"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Target,
    Beaker,
    Pill,
    Bug,
    Dna,
    ChevronRight,
    Sparkles,
    Loader2,
    CheckCircle2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Template {
    id: string;
    name: string;
    disease_context: string;
    therapeutic_area: string;
    target_id: string;
    pdb_id: string;
    ligand_count: number;
    clinical_drugs: string[];
    key_residues: string[];
}

const DEMO_TEMPLATES: Template[] = [
    {
        id: "egfr_nsclc",
        name: "EGFR NSCLC Kinase Inhibitor Discovery",
        disease_context: "Non-small cell lung cancer (NSCLC) - 85% of lung cancers. EGFR mutations drive ~15% of cases. Focus: overcoming T790M resistance.",
        therapeutic_area: "Oncology",
        target_id: "EGFR_HUMAN",
        pdb_id: "1M17",
        ligand_count: 3,
        clinical_drugs: ["Erlotinib", "Gefitinib", "Osimertinib", "Afatinib"],
        key_residues: ["L718", "G719", "T790", "L858"]
    },
    {
        id: "braf_melanoma",
        name: "BRAF V600E Melanoma Resistance",
        disease_context: "Metastatic melanoma - BRAF V600E mutation in ~50% of cases. Challenge: resistance via RAF dimerization.",
        therapeutic_area: "Oncology",
        target_id: "BRAF_HUMAN",
        pdb_id: "1UWH",
        ligand_count: 2,
        clinical_drugs: ["Vemurafenib", "Dabrafenib", "Encorafenib"],
        key_residues: ["G464", "V600E", "K483", "D594"]
    },
    {
        id: "abl1_cml",
        name: "ABL1 CML Imatinib-Resistant Variants",
        disease_context: "Chronic myeloid leukemia (CML) - BCR-ABL fusion drives 95% of cases. Challenge: T315I gatekeeper mutation.",
        therapeutic_area: "Oncology",
        target_id: "ABL1_HUMAN",
        pdb_id: "2HYY",
        ligand_count: 3,
        clinical_drugs: ["Imatinib", "Nilotinib", "Dasatinib", "Ponatinib"],
        key_residues: ["T315I", "E255", "Y253", "G250"]
    },
    {
        id: "hiv1_protease",
        name: "HIV-1 Protease Antiretroviral Design",
        disease_context: "HIV/AIDS - 38M people living with HIV globally. Protease inhibitors are cornerstone of HAART.",
        therapeutic_area: "Virology",
        target_id: "POL_HIV1",
        pdb_id: "1HVR",
        ligand_count: 2,
        clinical_drugs: ["Darunavir", "Atazanavir", "Lopinavir"],
        key_residues: ["D25", "G27", "I50", "V82"]
    },
    {
        id: "sars2_mpro",
        name: "SARS-CoV-2 Main Protease (MPro) COVID-19",
        disease_context: "COVID-19 pandemic - MPro is essential for viral replication. Nirmatrelvir (Paxlovid) validates target.",
        therapeutic_area: "Virology",
        target_id: "MPRO_SARS2",
        pdb_id: "6LU7",
        ligand_count: 2,
        clinical_drugs: ["Nirmatrelvir", "Ensitrelvir"],
        key_residues: ["H41", "C145", "E166", "Q189"]
    }
];

export default function AtomNetTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>(DEMO_TEMPLATES);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const resp = await fetch(`${API_BASE}/api/atomnet/templates`);
            if (resp.ok) {
                const data = await resp.json();
                if (data.templates && data.templates.length > 0) {
                    setTemplates(data.templates);
                }
            }
        } catch (e) {
            // Use demo templates
        }
    };

    const createFromTemplate = async (templateId: string) => {
        setCreating(templateId);
        try {
            const resp = await fetch(`${API_BASE}/api/atomnet/templates/${templateId}/create`, {
                method: "POST"
            });
            const data = await resp.json();

            if (data.success) {
                setSuccessId(templateId);
                setTimeout(() => {
                    router.push(`/atomnet/${data.project_id}`);
                }, 1000);
            }
        } catch (e) {
            console.error("Failed to create project:", e);
        } finally {
            setCreating(null);
        }
    };

    const oncologyTemplates = templates.filter(t => t.therapeutic_area === "Oncology");
    const virologyTemplates = templates.filter(t => t.therapeutic_area === "Virology");

    const TemplateCard = ({ template }: { template: Template }) => (
        <Card className={`bg-slate-900/50 border-purple-500/20 hover:border-purple-500/40 transition-all ${successId === template.id ? 'border-green-500/50 bg-green-900/20' : ''
            }`}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {template.therapeutic_area === "Oncology" ? (
                            <div className="p-2 bg-pink-500/20 rounded-lg">
                                <Target className="w-6 h-6 text-pink-400" />
                            </div>
                        ) : (
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Bug className="w-6 h-6 text-green-400" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-white">{template.name.split(' ').slice(0, 3).join(' ')}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                                    {template.pdb_id}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                    {template.target_id}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-slate-300 mb-4 line-clamp-2">
                    {template.disease_context}
                </p>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                        <Pill className="w-3 h-3 text-purple-400" />
                        <span className="text-slate-400">Clinical drugs:</span>
                        <span className="text-white">{template.clinical_drugs.slice(0, 2).join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <Dna className="w-3 h-3 text-pink-400" />
                        <span className="text-slate-400">Key residues:</span>
                        <span className="font-mono text-white">{template.key_residues.slice(0, 3).join(", ")}</span>
                    </div>
                </div>

                <Button
                    onClick={() => createFromTemplate(template.id)}
                    disabled={creating === template.id || successId === template.id}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                    {successId === template.id ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Created! Redirecting...
                        </>
                    ) : creating === template.id ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Use Template
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
            {/* Header */}
            <div className="bg-black/30 border-b border-purple-500/20 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/atomnet">
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to AtomNet
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-slate-700" />
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                    <Beaker className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Partner Ready Templates
                                    </h1>
                                    <p className="text-slate-400 text-sm">Pre-configured projects for key therapeutic areas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Info Card */}
                <Card className="bg-purple-900/20 border-purple-500/30 mb-8">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-purple-300">Disease-Focused Templates</p>
                                <p className="text-sm text-slate-300 mt-1">
                                    We've pre-configured workflows for oncology kinases and viral targets that align with
                                    high-value drug discovery programs. Each template includes disease context, key binding
                                    site residues, and reference compounds.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="oncology" className="space-y-6">
                    <TabsList className="bg-slate-800/50 border border-slate-700">
                        <TabsTrigger value="oncology" className="data-[state=active]:bg-pink-600">
                            <Target className="w-4 h-4 mr-2" /> Oncology ({oncologyTemplates.length})
                        </TabsTrigger>
                        <TabsTrigger value="virology" className="data-[state=active]:bg-green-600">
                            <Bug className="w-4 h-4 mr-2" /> Virology ({virologyTemplates.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="oncology">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {oncologyTemplates.map((t) => (
                                <TemplateCard key={t.id} template={t} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="virology">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {virologyTemplates.map((t) => (
                                <TemplateCard key={t.id} template={t} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
