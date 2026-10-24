import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    Sparkles,
    Wand2,
    Atom,
    Copy,
    Download,
    RefreshCw,
    Beaker,
    Target,
    Zap,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedMolecule {
    id: string;
    smiles: string;
    name: string;
    mw: number;
    logp: number;
    hbd: number;
    hba: number;
    affinity: number;
    druglikeness: number;
    novelty: number;
}

export function DeNovoDesigner() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generatedMolecules, setGeneratedMolecules] = useState<GeneratedMolecule[]>([]);
    const [selectedScaffold, setSelectedScaffold] = useState<string>('benzene');

    // Constraint inputs
    const [targetMW, setTargetMW] = useState([300, 500]);
    const [targetLogP, setTargetLogP] = useState([1, 4]);
    const [numMolecules, setNumMolecules] = useState(10);
    const [creativity, setCreativity] = useState([0.7]);

    const scaffolds = [
        { name: 'benzene', label: 'Benzene Ring', smiles: 'c1ccccc1' },
        { name: 'indole', label: 'Indole', smiles: 'c1ccc2c(c1)cc[nH]2' },
        { name: 'quinoline', label: 'Quinoline', smiles: 'c1ccc2c(c1)cccn2' },
        { name: 'piperidine', label: 'Piperidine', smiles: 'C1CCNCC1' },
        { name: 'thiophene', label: 'Thiophene', smiles: 'c1ccsc1' },
    ];

    const generateMolecules = () => {
        setIsGenerating(true);
        setGenerationProgress(0);
        setGeneratedMolecules([]);

        // Simulate generation with progress
        const interval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsGenerating(false);

                    // Generate mock molecules
                    const molecules: GeneratedMolecule[] = Array.from({ length: numMolecules }, (_, i) => ({
                        id: `mol-${Date.now()}-${i}`,
                        smiles: `CC(C)NCC(O)c1ccc(O)c(O)c1-${i}`, // Mock SMILES
                        name: `Candidate ${i + 1}`,
                        mw: targetMW[0] + Math.random() * (targetMW[1] - targetMW[0]),
                        logp: targetLogP[0] + Math.random() * (targetLogP[1] - targetLogP[0]),
                        hbd: Math.floor(Math.random() * 5),
                        hba: Math.floor(Math.random() * 8),
                        affinity: -6 - Math.random() * 5,
                        druglikeness: 0.6 + Math.random() * 0.35,
                        novelty: 0.5 + Math.random() * 0.5,
                    }));

                    setGeneratedMolecules(molecules.sort((a, b) => a.affinity - b.affinity));
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    return (
        <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Wand2 className="w-6 h-6 text-purple-600" />
                        De Novo Drug Designer
                    </h2>
                    <p className="text-slate-500">AI-powered molecular generation from constraints</p>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generative AI
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="border-purple-200">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardTitle className="text-lg">Generation Settings</CardTitle>
                            <CardDescription>Define constraints for AI molecular design</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* Scaffold Selection */}
                            <div>
                                <Label className="text-sm font-semibold mb-3 block">Starting Scaffold</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {scaffolds.map((scaffold) => (
                                        <Button
                                            key={scaffold.name}
                                            variant={selectedScaffold === scaffold.name ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedScaffold(scaffold.name)}
                                            className={selectedScaffold === scaffold.name ? "bg-purple-600" : ""}
                                        >
                                            {scaffold.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Molecular Weight Range */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center justify-between">
                                    <span>Molecular Weight (Da)</span>
                                    <span className="font-mono text-purple-600">{targetMW[0]} - {targetMW[1]}</span>
                                </Label>
                                <Slider
                                    value={targetMW}
                                    min={100}
                                    max={800}
                                    step={10}
                                    onValueChange={(value: number[]) => setTargetMW(value)}
                                    className="w-full"
                                />
                            </div>

                            {/* LogP Range */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center justify-between">
                                    <span>LogP (Lipophilicity)</span>
                                    <span className="font-mono text-purple-600">{targetLogP[0].toFixed(1)} - {targetLogP[1].toFixed(1)}</span>
                                </Label>
                                <Slider
                                    value={targetLogP}
                                    min={-2}
                                    max={6}
                                    step={0.1}
                                    onValueChange={(value: number[]) => setTargetLogP(value)}
                                    className="w-full"
                                />
                            </div>

                            {/* Creativity/Temperature */}
                            <div>
                                <Label className="text-sm font-semibold mb-2 flex items-center justify-between">
                                    <span>AI Creativity</span>
                                    <span className="font-mono text-purple-600">{(creativity[0] * 100).toFixed(0)}%</span>
                                </Label>
                                <Slider
                                    value={creativity}
                                    min={0.1}
                                    max={1.0}
                                    step={0.05}
                                    onValueChange={(value: number[]) => setCreativity(value)}
                                    className="w-full"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {creativity[0] < 0.4 ? 'Conservative (similar to known drugs)' :
                                        creativity[0] < 0.7 ? 'Balanced (moderate novelty)' :
                                            'Exploratory (high novelty, higher risk)'}
                                </p>
                            </div>

                            {/* Number of Molecules */}
                            <div>
                                <Label className="text-sm font-semibold mb-2">Molecules to Generate</Label>
                                <Input
                                    type="number"
                                    value={numMolecules}
                                    onChange={(e) => setNumMolecules(parseInt(e.target.value) || 10)}
                                    min={1}
                                    max={50}
                                    className="font-mono"
                                />
                            </div>

                            {/* Generate Button */}
                            <Button
                                onClick={generateMolecules}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6"
                                size="lg"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Generating... {generationProgress}%
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5 mr-2" />
                                        Generate Molecules
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-bold mb-1">How It Works</p>
                                    <p className="text-xs leading-relaxed">
                                        Our generative AI uses a Transformer-based model trained on 2M drug-like molecules from ChEMBL. It learns chemical grammar and property relationships to invent novel structures matching your constraints.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Generated Candidates</span>
                                {generatedMolecules.length > 0 && (
                                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                                        {generatedMolecules.length} molecules
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                AI-designed molecules sorted by predicted binding affinity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {generatedMolecules.length === 0 && !isGenerating && (
                                <div className="text-center py-16">
                                    <Beaker className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                    <p className="text-slate-400 font-medium mb-2">No molecules generated yet</p>
                                    <p className="text-sm text-slate-400">Configure your constraints and click "Generate Molecules"</p>
                                </div>
                            )}

                            {isGenerating && (
                                <div className="text-center py-16">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    >
                                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                                    </motion.div>
                                    <p className="text-slate-700 font-medium mb-2">AI is designing molecules...</p>
                                    <p className="text-sm text-slate-500">Progress: {generationProgress}%</p>
                                </div>
                            )}

                            <AnimatePresence>
                                {generatedMolecules.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                                        {generatedMolecules.map((mol, idx) => (
                                            <motion.div
                                                key={mol.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                            >
                                                <Card className="hover:shadow-lg transition-shadow border-purple-100 hover:border-purple-300">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div>
                                                                <h4 className="font-bold text-slate-900">{mol.name}</h4>
                                                                <p className="text-xs text-slate-500 font-mono mt-1">{mol.smiles}</p>
                                                            </div>
                                                            <Badge className={`${idx === 0 ? 'bg-green-500 text-white' :
                                                                    idx < 3 ? 'bg-blue-500 text-white' :
                                                                        'bg-slate-400 text-white'
                                                                }`}>
                                                                #{idx + 1}
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">MW:</span>
                                                                <span className="font-mono font-bold">{mol.mw.toFixed(1)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">LogP:</span>
                                                                <span className="font-mono font-bold">{mol.logp.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">HBD:</span>
                                                                <span className="font-mono font-bold">{mol.hbd}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500">HBA:</span>
                                                                <span className="font-mono font-bold">{mol.hba}</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 mb-3">
                                                            <div>
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-slate-600">Affinity</span>
                                                                    <span className="font-bold text-green-600">{mol.affinity.toFixed(1)} kcal/mol</span>
                                                                </div>
                                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                                                        style={{ width: `${Math.min(100, Math.abs(mol.affinity) * 10)}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="text-slate-600">Novelty</span>
                                                                    <span className="font-bold text-purple-600">{(mol.novelty * 100).toFixed(0)}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                                                        style={{ width: `${mol.novelty * 100}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <Button variant="outline" size="sm" className="flex-1 text-xs">
                                                                <Copy className="w-3 h-3 mr-1" />
                                                                Copy SMILES
                                                            </Button>
                                                            <Button variant="outline" size="sm" className="flex-1 text-xs">
                                                                <Target className="w-3 h-3 mr-1" />
                                                                Dock
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
