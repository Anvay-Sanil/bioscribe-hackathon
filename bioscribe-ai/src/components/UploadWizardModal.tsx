"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Upload, FileText, AlertTriangle, Check, ChevronRight, ChevronLeft,
    Loader2, Sparkles, FileSpreadsheet, CheckCircle2, XCircle,
    GripVertical, ArrowRight, Zap, Database
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// TYPES
// ============================================================================

interface FormatTemplate {
    id: string;
    name: string;
    description: string;
    format: string;
    example: string;
}

interface ColumnMapping {
    ligand_id: string;
    smiles: string;
    score: string;
    rank?: string;
    molecular_weight?: string;
    logp?: string;
}

interface DetectionResult {
    format: string;
    templateId: string;
    confidence: 'high' | 'medium' | 'low';
    mapping: ColumnMapping;
    headers: string[];
    unmappedColumns: string[];
}

interface ValidationResult {
    valid: boolean;
    warnings: string[];
    errors: string[];
    ligandCount: number;
    scoreRange: [number, number];
}

interface ParsedRow {
    [key: string]: string;
}

const COMMON_TARGETS = [
    { id: "EGFR_HUMAN", name: "EGFR - Epidermal growth factor receptor", pdb: "1M17" },
    { id: "ABL1_HUMAN", name: "ABL1 - Tyrosine-protein kinase", pdb: "2HYY" },
    { id: "BRAF_HUMAN", name: "BRAF - Serine/threonine-protein kinase", pdb: "1UWH" },
    { id: "CDK2_HUMAN", name: "CDK2 - Cyclin-dependent kinase 2", pdb: "1HCK" },
    { id: "JAK2_HUMAN", name: "JAK2 - Janus kinase 2", pdb: "3KRR" },
    { id: "custom", name: "Custom target...", pdb: "" }
];

// Column detection patterns for auto-mapping
const COLUMN_PATTERNS = {
    score: /^(score|affinity|energy|atomnet|cnn|dock|pic50|binding|docking|ki|kd|ic50)/i,
    smiles: /^(smiles|smi|structure|canonical|molecule)/i,
    id: /^(id|name|ligand|compound|mol|molecule)/i,
    rank: /^(rank|order|position)/i,
    mw: /^(mw|molecular_weight|mass|weight)/i,
    logp: /^(logp|alogp|clogp|partition)/i
};

// ============================================================================
// ANIMATED COUNTER HOOK
// ============================================================================

function useAnimatedCounter(target: number, duration: number = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        const startTime = Date.now();
        const startValue = 0;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (target - startValue) * eased);

            setCount(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        requestAnimationFrame(animate);
    }, [target, duration]);

    return count;
}

// ============================================================================
// COLUMN DETECTION
// ============================================================================

function detectColumns(headers: string[]): DetectionResult {
    const mapping: ColumnMapping = {
        ligand_id: headers[0] || 'id',
        smiles: headers[1] || 'smiles',
        score: headers[2] || 'score'
    };

    const unmappedColumns: string[] = [];
    let matchCount = 0;

    headers.forEach((header, index) => {
        const headerLower = header.toLowerCase().trim();

        if (COLUMN_PATTERNS.score.test(headerLower)) {
            mapping.score = header;
            matchCount++;
        } else if (COLUMN_PATTERNS.smiles.test(headerLower)) {
            mapping.smiles = header;
            matchCount++;
        } else if (COLUMN_PATTERNS.id.test(headerLower)) {
            mapping.ligand_id = header;
            matchCount++;
        } else if (COLUMN_PATTERNS.rank.test(headerLower)) {
            mapping.rank = header;
        } else if (COLUMN_PATTERNS.mw.test(headerLower)) {
            mapping.molecular_weight = header;
        } else if (COLUMN_PATTERNS.logp.test(headerLower)) {
            mapping.logp = header;
        } else {
            unmappedColumns.push(header);
        }
    });

    // Determine template based on headers
    let templateId = 'generic_csv';
    const headerStr = headers.join(',').toLowerCase();

    if (headerStr.includes('atomnet') || headerStr.includes('molecule_id')) {
        templateId = 'atomnet';
    } else if (headerStr.includes('cnnaffinity') || headerStr.includes('cnnscore')) {
        templateId = 'gnina';
    } else if (headerStr.includes('affinity') && headerStr.includes('rmsd')) {
        templateId = 'vina';
    }

    // Confidence based on how many core columns were detected
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (matchCount >= 3) confidence = 'high';
    else if (matchCount >= 2) confidence = 'medium';

    return {
        format: 'csv',
        templateId,
        confidence,
        mapping,
        headers,
        unmappedColumns
    };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UploadWizardModal() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Step 1: File Selection
    const [file, setFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState("");

    // Step 2: Detection & Mapping
    const [detection, setDetection] = useState<DetectionResult | null>(null);
    const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
    const [templates, setTemplates] = useState<FormatTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");

    // Editable mapping
    const [mapping, setMapping] = useState<ColumnMapping | null>(null);

    // Step 3: Target Selection
    const [targetId, setTargetId] = useState("");
    const [customTargetId, setCustomTargetId] = useState("");
    const [customTargetName, setCustomTargetName] = useState("");
    const [customPdbId, setCustomPdbId] = useState("");
    const [partner, setPartner] = useState("");

    // Step 4: Validation & Upload
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [result, setResult] = useState<any>(null);
    const [parsingProgress, setParsingProgress] = useState(0);

    // Animated counter for ligand count
    const animatedLigandCount = useAnimatedCounter(validation?.ligandCount || 0, 1500);

    // =========================================================================
    // DRAG AND DROP HANDLERS
    // =========================================================================

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            await processFile(droppedFile);
        }
    }, []);

    // =========================================================================
    // FILE PROCESSING
    // =========================================================================

    const processFile = async (selectedFile: File) => {
        setFile(selectedFile);
        setLoading(true);

        try {
            const content = await selectedFile.text();
            setFileContent(content);

            // Parse CSV headers and first 5 rows for preview
            const lines = content.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            const preview: ParsedRow[] = [];
            for (let i = 1; i < Math.min(6, lines.length); i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row: ParsedRow = {};
                headers.forEach((h, idx) => {
                    row[h] = values[idx] || '';
                });
                preview.push(row);
            }
            setPreviewRows(preview);

            // Auto-detect columns
            const detected = detectColumns(headers);
            setDetection(detected);
            setMapping(detected.mapping);

            // Count lines for quick validation
            const lineCount = lines.length - 1; // Exclude header
            setValidation({
                valid: lineCount >= 5,
                warnings: lineCount < 50 ? ['Low ligand count for typical screening'] : [],
                errors: [],
                ligandCount: lineCount,
                scoreRange: [0, 0] // Will be updated after full parse
            });

            // Fetch templates
            if (templates.length === 0) {
                try {
                    const resp = await fetch(`${API_BASE}/api/atomnet/format-templates`);
                    const data = await resp.json();
                    setTemplates(data.templates || []);
                } catch {
                    setTemplates([
                        { id: "atomnet", name: "AtomNet CSV", description: "Atomwise output", format: "csv", example: "molecule_id,smiles,atomnet_score" },
                        { id: "gnina", name: "GNINA CSV", description: "GNINA docking", format: "csv", example: "name,smiles,CNNaffinity" },
                        { id: "vina", name: "Vina CSV", description: "AutoDock Vina", format: "csv", example: "ligand,smiles,affinity" },
                        { id: "generic_csv", name: "Generic CSV", description: "Standard format", format: "csv", example: "id,smiles,score" }
                    ]);
                }
            }

            // Auto-advance to step 2
            setStep(2);
        } catch (err) {
            console.error('File processing error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            await processFile(selected);
        }
    };

    // =========================================================================
    // COLUMN MAPPING UPDATE
    // =========================================================================

    const updateMapping = (field: keyof ColumnMapping, value: string) => {
        if (mapping) {
            setMapping({ ...mapping, [field]: value });
        }
    };

    // =========================================================================
    // UPLOAD HANDLER
    // =========================================================================

    const handleUpload = async () => {
        setLoading(true);
        setParsingProgress(0);

        // Simulate parsing progress
        const progressInterval = setInterval(() => {
            setParsingProgress(prev => Math.min(prev + Math.random() * 15, 95));
        }, 100);

        try {
            const target = COMMON_TARGETS.find(t => t.id === targetId);
            const isCustom = targetId === "custom";

            const payload = {
                content: fileContent,
                filename: file?.name || "upload.csv",
                target_id: isCustom ? customTargetId : targetId,
                target_name: isCustom ? customTargetName : target?.name,
                target_pdb_id: isCustom ? customPdbId : target?.pdb,
                partner: partner || undefined,
                template_id: selectedTemplate || detection?.templateId,
                custom_mapping: mapping
            };

            const resp = await fetch(`${API_BASE}/api/atomnet/upload-file`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await resp.json();

            clearInterval(progressInterval);
            setParsingProgress(100);

            setResult(data);

            if (data.success) {
                // Update validation with actual count
                setValidation(prev => prev ? {
                    ...prev,
                    ligandCount: data.ligand_count,
                    scoreRange: data.score_range || prev.scoreRange
                } : null);
                setStep(4);
            } else {
                setValidation(prev => prev ? {
                    ...prev,
                    valid: false,
                    errors: [data.message]
                } : null);
            }
        } catch (e) {
            clearInterval(progressInterval);
            setResult({ success: false, message: "Upload failed: " + (e as Error).message });
        } finally {
            setLoading(false);
        }
    };

    const handleViewProject = () => {
        if (result?.project_id) {
            setOpen(false);
            router.push(`/atomnet/${result.project_id}`);
        }
    };

    const resetWizard = () => {
        setStep(1);
        setFile(null);
        setFileContent("");
        setDetection(null);
        setPreviewRows([]);
        setMapping(null);
        setTargetId("");
        setCustomTargetId("");
        setCustomTargetName("");
        setCustomPdbId("");
        setPartner("");
        setSelectedTemplate("");
        setValidation(null);
        setResult(null);
        setParsingProgress(0);
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    const getConfidenceBadge = () => {
        if (!detection) return null;

        const configs = {
            high: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: CheckCircle2, label: "High Confidence" },
            medium: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", icon: AlertTriangle, label: "Medium - Please Verify" },
            low: { color: "bg-red-500/20 text-red-400 border-red-500/50", icon: XCircle, label: "Low - Manual Mapping Required" }
        };

        const config = configs[detection.confidence];
        const Icon = config.icon;

        return (
            <Badge variant="outline" className={`${config.color} flex items-center gap-1.5`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

    const getTemplateLabel = () => {
        const templateLabels: Record<string, string> = {
            atomnet: "AtomNet Format",
            gnina: "GNINA Format",
            vina: "AutoDock Vina",
            generic_csv: "Generic CSV"
        };
        return detection ? templateLabels[detection.templateId] || detection.templateId : "";
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetWizard(); }}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Engine Output
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-purple-500/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-purple-400" />
                        Import Screening Results
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Drop-in ingestion from any engine (AtomNet, GNINA, Vina, etc.)
                    </DialogDescription>
                </DialogHeader>

                {/* Progress indicator */}
                <div className="flex items-center gap-2 my-4">
                    {[
                        { num: 1, label: "File" },
                        { num: 2, label: "Mapping" },
                        { num: 3, label: "Target" },
                        { num: 4, label: "Done" }
                    ].map((s, idx) => (
                        <div key={s.num} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s.num
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                                </div>
                                <span className={`text-xs mt-1 ${step >= s.num ? 'text-purple-400' : 'text-slate-500'}`}>
                                    {s.label}
                                </span>
                            </div>
                            {idx < 3 && (
                                <div className={`w-12 h-0.5 mx-1 ${step > s.num ? 'bg-purple-600' : 'bg-slate-700'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ============================================================ */}
                {/* Step 1: File Selection with Drag & Drop */}
                {/* ============================================================ */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div
                            ref={dropZoneRef}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${isDragging
                                    ? 'border-purple-500 bg-purple-500/10 scale-[1.02]'
                                    : 'border-slate-600 hover:border-purple-500/50 hover:bg-slate-800/50'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".csv,.json,.txt,.tsv"
                                className="hidden"
                            />
                            {loading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                                    <p className="text-slate-300">Processing file...</p>
                                </div>
                            ) : (
                                <div className="text-slate-400">
                                    <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium text-white mb-2">
                                        Drop your CSV file here
                                    </p>
                                    <p className="text-sm">or click to browse</p>
                                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                                        <Badge variant="outline" className="border-slate-600 text-slate-400">AtomNet</Badge>
                                        <Badge variant="outline" className="border-slate-600 text-slate-400">GNINA</Badge>
                                        <Badge variant="outline" className="border-slate-600 text-slate-400">Vina</Badge>
                                        <Badge variant="outline" className="border-slate-600 text-slate-400">CSV</Badge>
                                        <Badge variant="outline" className="border-slate-600 text-slate-400">JSON</Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* Step 2: Column Detection & Mapping */}
                {/* ============================================================ */}
                {step === 2 && detection && (
                    <div className="space-y-4">
                        {/* Detection Result Banner */}
                        <Card className={`${detection.confidence === 'high'
                                ? 'bg-green-900/20 border-green-500/30'
                                : detection.confidence === 'medium'
                                    ? 'bg-yellow-900/20 border-yellow-500/30'
                                    : 'bg-red-900/20 border-red-500/30'
                            }`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Zap className={`w-5 h-5 ${detection.confidence === 'high' ? 'text-green-400' :
                                                detection.confidence === 'medium' ? 'text-yellow-400' : 'text-red-400'
                                            }`} />
                                        <div>
                                            <p className="font-medium text-white">
                                                Format Detected: <span className="text-purple-400">{getTemplateLabel()}</span>
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                {file?.name} • {validation?.ligandCount.toLocaleString()} rows
                                            </p>
                                        </div>
                                    </div>
                                    {getConfidenceBadge()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Column Mapping */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Column Mapping</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs text-slate-400">ID Column</Label>
                                    <Select value={mapping?.ligand_id} onValueChange={(v) => updateMapping('ligand_id', v)}>
                                        <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700">
                                            {detection.headers.map(h => (
                                                <SelectItem key={h} value={h} className="text-white">{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-400">SMILES Column</Label>
                                    <Select value={mapping?.smiles} onValueChange={(v) => updateMapping('smiles', v)}>
                                        <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700">
                                            {detection.headers.map(h => (
                                                <SelectItem key={h} value={h} className="text-white">{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-400">Score Column</Label>
                                    <Select value={mapping?.score} onValueChange={(v) => updateMapping('score', v)}>
                                        <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700">
                                            {detection.headers.map(h => (
                                                <SelectItem key={h} value={h} className="text-white">{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Data Preview Table */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Data Preview (First 5 Rows)</Label>
                            <div className="border border-slate-700 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-800/50 border-slate-700">
                                            {detection.headers.slice(0, 5).map((h) => (
                                                <TableHead key={h} className={`text-xs ${h === mapping?.ligand_id || h === mapping?.smiles || h === mapping?.score
                                                        ? 'text-purple-400 font-medium'
                                                        : 'text-slate-400'
                                                    }`}>
                                                    {h}
                                                    {h === mapping?.ligand_id && <Badge className="ml-1 text-[10px] bg-purple-500/20 text-purple-400">ID</Badge>}
                                                    {h === mapping?.smiles && <Badge className="ml-1 text-[10px] bg-blue-500/20 text-blue-400">SMILES</Badge>}
                                                    {h === mapping?.score && <Badge className="ml-1 text-[10px] bg-green-500/20 text-green-400">Score</Badge>}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewRows.map((row, idx) => (
                                            <TableRow key={idx} className="border-slate-700">
                                                {detection.headers.slice(0, 5).map((h) => (
                                                    <TableCell key={h} className="text-xs text-slate-300 py-2 font-mono max-w-[150px] truncate">
                                                        {row[h]}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)} className="border-slate-600">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button onClick={() => setStep(3)} className="bg-purple-600 hover:bg-purple-500">
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* Step 3: Target Selection */}
                {/* ============================================================ */}
                {step === 3 && (
                    <div className="space-y-4">
                        {/* Instant validation banner */}
                        <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-purple-500/20 rounded-full">
                                        <Database className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-bold text-white">
                                                {animatedLigandCount.toLocaleString()}
                                            </span>
                                            <span className="text-slate-400">ligands loaded</span>
                                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            Ready to import • {file?.name}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div>
                            <Label>Target Protein</Label>
                            <Select value={targetId} onValueChange={setTargetId}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                                    <SelectValue placeholder="Select target..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {COMMON_TARGETS.map((t) => (
                                        <SelectItem key={t.id} value={t.id} className="text-white">
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {targetId === "custom" && (
                            <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
                                <div>
                                    <Label>Target ID</Label>
                                    <Input
                                        placeholder="e.g., EGFR_HUMAN"
                                        value={customTargetId}
                                        onChange={(e) => setCustomTargetId(e.target.value)}
                                        className="bg-slate-800 border-slate-700 mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>Target Name (optional)</Label>
                                    <Input
                                        placeholder="e.g., Epidermal growth factor receptor"
                                        value={customTargetName}
                                        onChange={(e) => setCustomTargetName(e.target.value)}
                                        className="bg-slate-800 border-slate-700 mt-1"
                                    />
                                </div>
                                <div>
                                    <Label>PDB ID (optional)</Label>
                                    <Input
                                        placeholder="e.g., 1M17"
                                        value={customPdbId}
                                        onChange={(e) => setCustomPdbId(e.target.value)}
                                        className="bg-slate-800 border-slate-700 mt-1"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Partner (optional)</Label>
                            <Input
                                placeholder="e.g., Novartis, Internal"
                                value={partner}
                                onChange={(e) => setPartner(e.target.value)}
                                className="bg-slate-800 border-slate-700 mt-1"
                            />
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(2)} className="border-slate-600">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!targetId || (targetId === "custom" && !customTargetId) || loading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing... {Math.round(parsingProgress)}%
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Create Project
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Progress Bar */}
                        {loading && (
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                                    style={{ width: `${parsingProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================================ */}
                {/* Step 4: Success */}
                {/* ============================================================ */}
                {step === 4 && result?.success && (
                    <div className="space-y-4">
                        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
                            <CardContent className="p-6 text-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Import Successful!</h3>
                                <p className="text-slate-300 mb-4">{result.message}</p>

                                <div className="flex flex-wrap justify-center gap-2">
                                    <Badge className="bg-purple-500/20 text-purple-400 text-lg px-4 py-1">
                                        {result.ligand_count?.toLocaleString()} ligands
                                    </Badge>
                                    {result.score_range && (
                                        <Badge className="bg-green-500/20 text-green-400 text-lg px-4 py-1">
                                            Scores: {result.score_range[0]?.toFixed(1)} to {result.score_range[1]?.toFixed(1)}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-center gap-3 pt-4">
                            <Button variant="outline" onClick={resetWizard} className="border-slate-600">
                                Import Another
                            </Button>
                            <Button
                                onClick={handleViewProject}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                            >
                                View Project <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {step === 4 && result && !result.success && (
                    <div className="space-y-4">
                        <Card className="bg-red-900/30 border-red-500/30">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-red-400">Import Failed</p>
                                        <p className="text-sm text-slate-300 mt-1">{result.message}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(3)} className="border-slate-600">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
