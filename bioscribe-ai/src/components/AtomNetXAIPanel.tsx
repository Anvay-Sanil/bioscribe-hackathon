"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Sparkles,
    Target,
    Beaker,
    TrendingUp,
    TrendingDown,
    Lightbulb,
    BarChart3,
    Atom,
    Link2,
    Info,
    Zap,
    ArrowUp,
    ArrowDown,
    CheckCircle2,
    ChevronRight
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface XAIExplanation {
    ligand_id: string;
    fragment_contributions: { fragment_name: string; contribution: number }[];
    residue_contacts: {
        residue_name: string;
        residue_number: number;
        interaction_type: string;
        distance: number
    }[];
    explanation_summary: string;
    confidence: number;
}

interface AtomNetXAIPanelProps {
    xaiData: XAIExplanation | null;
    ligandScores?: number[];
    selectedScore?: number;
    rank?: number;
    totalLigands?: number;
}

// ============================================================================
// PLAIN ENGLISH GENERATOR
// ============================================================================

function generatePlainEnglishExplanation(
    xaiData: XAIExplanation,
    rank?: number,
    totalLigands?: number
): {
    summaryText: string;
    keyInsights: string[];
    topReasons: { reason: string; impact: 'high' | 'medium' | 'low'; value: number }[];
    comparisonText: string;
} {
    // Get top contributors (sorted by absolute contribution)
    const sortedContribs = [...xaiData.fragment_contributions]
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
        .slice(0, 5);

    // Get key interactions from residue contacts
    const interactionsByType = xaiData.residue_contacts.reduce((acc, contact) => {
        const type = contact.interaction_type.toLowerCase();
        if (!acc[type]) acc[type] = [];
        acc[type].push(contact);
        return acc;
    }, {} as Record<string, typeof xaiData.residue_contacts>);

    // Fragment name to plain English mapping
    const fragmentNameMap: Record<string, string> = {
        'aromatic_ring': 'aromatic ring',
        'amide_bond': 'amide group',
        'sulfonamide': 'sulfonamide group',
        'carboxylic_acid': 'carboxylic acid',
        'hydroxyl': 'hydroxyl group',
        'amino_group': 'amino group',
        'halogen': 'halogen substituent',
        'methyl': 'methyl group',
        'ethyl': 'ethyl chain',
        'phenyl': 'phenyl ring',
        'pyridine': 'pyridine ring',
        'imidazole': 'imidazole moiety',
        'benzene': 'benzene ring',
        'carbonyl': 'carbonyl group',
        'ether': 'ether linkage',
        'ester': 'ester group',
        'ketone': 'ketone group',
        'nitrile': 'nitrile group',
        'hydrophobic': 'hydrophobic region'
    };

    const getFragmentName = (name: string) => {
        const key = name.toLowerCase().replace(/[^a-z_]/g, '');
        return fragmentNameMap[key] || name.replace(/_/g, ' ').toLowerCase();
    };

    // Interaction type to plain English
    const interactionNameMap: Record<string, string> = {
        'hydrogen_bond': 'hydrogen bonds with',
        'h_bond': 'hydrogen bonds with',
        'hbond': 'hydrogen bonds with',
        'pi_stacking': 'forms π-stacking with',
        'pi_stack': 'forms π-stacking with',
        'hydrophobic': 'has hydrophobic contact with',
        'salt_bridge': 'forms a salt bridge with',
        'cation_pi': 'has cation-π interaction with',
        'halogen_bond': 'forms a halogen bond with',
        'van_der_waals': 'has van der Waals contact with',
        'electrostatic': 'has electrostatic interaction with'
    };

    // Build the summary text
    const topPositive = sortedContribs.filter(c => c.contribution > 0).slice(0, 2);
    const topNegative = sortedContribs.filter(c => c.contribution < 0).slice(0, 1);

    let summaryParts: string[] = [];

    if (topPositive.length > 0) {
        const positiveDesc = topPositive.map(c => {
            const fragName = getFragmentName(c.fragment_name);
            // Find related interaction
            const relatedContact = xaiData.residue_contacts.find(r =>
                r.residue_name && Math.abs(r.distance) < 4.0
            );
            if (relatedContact) {
                const interactionVerb = interactionNameMap[relatedContact.interaction_type.toLowerCase()] ||
                    `interacts with`;
                return `its ${fragName} ${interactionVerb} ${relatedContact.residue_name}${relatedContact.residue_number}`;
            }
            return `its ${fragName} contributes favorably to binding`;
        });
        summaryParts.push(positiveDesc.join(', and '));
    }

    if (topNegative.length > 0) {
        const negDesc = topNegative.map(c =>
            `the ${getFragmentName(c.fragment_name)} causes slight steric clash`
        );
        summaryParts.push(negDesc.join(', '));
    }

    const rankText = rank && totalLigands
        ? `This compound ranks #${rank} out of ${totalLigands.toLocaleString()}`
        : `This compound scores well`;

    const summaryText = summaryParts.length > 0
        ? `${rankText} because ${summaryParts.join('. Additionally, ')}.`
        : xaiData.explanation_summary || `${rankText} based on favorable molecular interactions.`;

    // Generate key insights (badges)
    const keyInsights: string[] = [];

    if (interactionsByType['pi_stacking'] || interactionsByType['pi_stack']) {
        keyInsights.push('Strong π-stacking');
    }
    if (interactionsByType['hydrogen_bond'] || interactionsByType['h_bond'] || interactionsByType['hbond']) {
        keyInsights.push('Good H-bonding');
    }
    if (interactionsByType['hydrophobic']?.length > 2) {
        keyInsights.push('Optimal hydrophobics');
    }
    if (interactionsByType['salt_bridge']) {
        keyInsights.push('Salt bridge');
    }
    if (sortedContribs.filter(c => c.contribution > 0).length >= 3) {
        keyInsights.push('Multiple favorable contacts');
    }
    if (xaiData.confidence > 0.8) {
        keyInsights.push('High confidence');
    }

    // Top reasons for waterfall
    const topReasons = sortedContribs.slice(0, 5).map(c => ({
        reason: getFragmentName(c.fragment_name),
        impact: Math.abs(c.contribution) > 2 ? 'high' as const :
            Math.abs(c.contribution) > 1 ? 'medium' as const : 'low' as const,
        value: c.contribution
    }));

    // Comparison text
    const percentile = rank && totalLigands
        ? Math.round((1 - rank / totalLigands) * 100)
        : null;
    const comparisonText = percentile !== null
        ? `Ranks higher than ${percentile}% of screened compounds`
        : 'Among top scoring compounds';

    return { summaryText, keyInsights, topReasons, comparisonText };
}

// ============================================================================
// WATERFALL CHART COMPONENT
// ============================================================================

function WaterfallChart({ contributions }: { contributions: { reason: string; impact: string; value: number }[] }) {
    const maxValue = Math.max(...contributions.map(c => Math.abs(c.value)), 1);

    return (
        <div className="space-y-2">
            {contributions.map((item, idx) => {
                const isPositive = item.value > 0;
                const widthPercent = (Math.abs(item.value) / maxValue) * 100;

                return (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-32 text-right text-sm text-slate-300 truncate capitalize">
                            {item.reason}
                        </div>
                        <div className="flex-1 relative h-6 flex items-center">
                            {/* Center line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />

                            {/* Bar */}
                            <div
                                className={`absolute h-5 rounded transition-all duration-500 ${isPositive
                                        ? 'left-1/2 bg-gradient-to-r from-emerald-500 to-green-400'
                                        : 'right-1/2 bg-gradient-to-l from-red-500 to-rose-400'
                                    }`}
                                style={{
                                    width: `${widthPercent / 2}%`,
                                    animationDelay: `${idx * 100}ms`
                                }}
                            />

                            {/* Value label */}
                            <span className={`absolute text-xs font-medium ${isPositive
                                    ? 'left-[52%] text-green-400'
                                    : 'right-[52%] text-red-400'
                                }`}>
                                {isPositive ? '+' : ''}{item.value.toFixed(1)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// CONFIDENCE GAUGE COMPONENT
// ============================================================================

function ConfidenceGauge({ confidence }: { confidence: number }) {
    const percentage = Math.round(confidence * 100);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (confidence * circumference);

    const getColor = () => {
        if (confidence >= 0.8) return { stroke: 'url(#gaugeGradientHigh)', text: 'text-green-400' };
        if (confidence >= 0.6) return { stroke: 'url(#gaugeGradientMedium)', text: 'text-yellow-400' };
        return { stroke: 'url(#gaugeGradientLow)', text: 'text-red-400' };
    };

    const colors = getColor();

    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <defs>
                    <linearGradient id="gaugeGradientHigh" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="gaugeGradientMedium" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <linearGradient id="gaugeGradientLow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                    <filter id="gaugeGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background circle */}
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="6"
                />

                {/* Progress circle */}
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    filter="url(#gaugeGlow)"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${colors.text}`}>{percentage}%</span>
                <span className="text-[10px] text-slate-400">Confidence</span>
            </div>
        </div>
    );
}

// ============================================================================
// SCORE HISTOGRAM
// ============================================================================

function ScoreHistogram({ scores, selectedScore }: { scores: number[], selectedScore?: number }) {
    if (!scores || scores.length === 0) return null;

    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const binCount = 12;
    const binWidth = (max - min) / binCount;

    const bins: { range: string, count: number, min: number, max: number }[] = [];
    for (let i = 0; i < binCount; i++) {
        const binMin = min + i * binWidth;
        const binMax = min + (i + 1) * binWidth;
        const count = scores.filter(s => s >= binMin && (i === binCount - 1 ? s <= binMax : s < binMax)).length;
        bins.push({
            range: `${binMin.toFixed(1)}`,
            count,
            min: binMin,
            max: binMax
        });
    }

    const maxCount = Math.max(...bins.map(b => b.count));
    const selectedBinIndex = selectedScore
        ? bins.findIndex(b => selectedScore >= b.min && selectedScore < b.max)
        : -1;

    return (
        <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    Score Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex items-end gap-1 h-20">
                    {bins.map((bin, i) => {
                        const height = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
                        const isSelected = i === selectedBinIndex;

                        return (
                            <div
                                key={i}
                                className="flex-1 flex flex-col items-center group relative"
                            >
                                <div
                                    className={`w-full rounded-t transition-all duration-300 ${isSelected
                                            ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-lg shadow-purple-500/30'
                                            : 'bg-slate-600 hover:bg-slate-500'
                                        }`}
                                    style={{
                                        height: `${height}%`,
                                        minHeight: bin.count > 0 ? '4px' : '0',
                                        animationDelay: `${i * 30}ms`
                                    }}
                                />

                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                    {bin.count} compounds @ {bin.range}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>{min.toFixed(1)}</span>
                    <span>kcal/mol</span>
                    <span>{max.toFixed(1)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// RESIDUE CONTACTS PANEL
// ============================================================================

function ResidueContactsPanel({ contacts }: { contacts: XAIExplanation['residue_contacts'] }) {
    const interactionIcons: Record<string, string> = {
        'hydrogen_bond': '🔗',
        'h_bond': '🔗',
        'hbond': '🔗',
        'pi_stacking': '⚛️',
        'pi_stack': '⚛️',
        'hydrophobic': '💧',
        'salt_bridge': '⚡',
        'cation_pi': '➕',
        'electrostatic': '⚡',
        'van_der_waals': '○'
    };

    const getIcon = (type: string) => interactionIcons[type.toLowerCase()] || '•';

    const getDistanceColor = (distance: number) => {
        if (distance < 2.5) return 'text-green-400';
        if (distance < 3.5) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-pink-400" />
                    Key Binding Interactions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {contacts.slice(0, 6).map((contact, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-700/50"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getIcon(contact.interaction_type)}</span>
                                <div>
                                    <span className="font-mono text-white text-sm">
                                        {contact.residue_name}{contact.residue_number}
                                    </span>
                                    <p className="text-xs text-slate-400 capitalize">
                                        {contact.interaction_type.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </div>
                            <Badge className={`${getDistanceColor(contact.distance)} bg-transparent border-current`}>
                                {contact.distance.toFixed(1)}Å
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AtomNetXAIPanel({
    xaiData,
    ligandScores,
    selectedScore,
    rank,
    totalLigands
}: AtomNetXAIPanelProps) {
    const [activeTab, setActiveTab] = useState('summary');

    if (!xaiData) {
        return (
            <Card className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="p-8 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400 opacity-50" />
                    <p className="text-slate-400">Select a ligand to view XAI explanation</p>
                    <p className="text-xs text-slate-500 mt-2">Click on any row in the ligands table</p>
                </CardContent>
            </Card>
        );
    }

    const explanation = generatePlainEnglishExplanation(xaiData, rank, totalLigands);

    return (
        <div className="space-y-4">
            {/* Main Summary Card - "Why this scored #1" */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30 overflow-hidden">
                <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                        {/* Confidence Gauge */}
                        <ConfidenceGauge confidence={xaiData.confidence} />

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5 text-yellow-400" />
                                <span className="font-bold text-white text-lg">{xaiData.ligand_id}</span>
                                {rank && (
                                    <Badge className="bg-purple-500/30 text-purple-300 border-purple-500/50">
                                        Rank #{rank}
                                    </Badge>
                                )}
                            </div>

                            {/* Plain English Explanation */}
                            <p className="text-slate-200 leading-relaxed mb-4">
                                {explanation.summaryText}
                            </p>

                            {/* Key Insight Badges */}
                            {explanation.keyInsights.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {explanation.keyInsights.map((insight, i) => (
                                        <Badge
                                            key={i}
                                            className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                                        >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {insight}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comparison Text */}
                    <div className="mt-4 pt-4 border-t border-purple-500/20 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">{explanation.comparisonText}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for detailed views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-800/50 border border-slate-700">
                    <TabsTrigger value="summary" className="data-[state=active]:bg-purple-600">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Breakdown
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="data-[state=active]:bg-purple-600">
                        <Link2 className="w-4 h-4 mr-1" />
                        Contacts
                    </TabsTrigger>
                    <TabsTrigger value="distribution" className="data-[state=active]:bg-purple-600">
                        <Target className="w-4 h-4 mr-1" />
                        Distribution
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4">
                    {/* Waterfall Chart */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                Contribution Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <WaterfallChart contributions={explanation.topReasons} />

                            {/* Net score */}
                            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                                <span className="text-sm text-slate-400">Net Binding Score:</span>
                                <span className="text-lg font-bold text-white">
                                    {selectedScore?.toFixed(1) || xaiData.fragment_contributions.reduce((sum, c) => sum + c.contribution, 0).toFixed(1)} kcal/mol
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-4">
                    <ResidueContactsPanel contacts={xaiData.residue_contacts} />
                </TabsContent>

                <TabsContent value="distribution" className="mt-4">
                    {ligandScores && ligandScores.length > 0 ? (
                        <ScoreHistogram scores={ligandScores} selectedScore={selectedScore} />
                    ) : (
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardContent className="p-8 text-center">
                                <Info className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                                <p className="text-slate-400">Score distribution not available</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
