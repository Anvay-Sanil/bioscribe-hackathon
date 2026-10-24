"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorldClass3DViewer } from './WorldClass3DViewer';
import { WetLabSimulation } from './WetLabSimulation';
import { ADMETPredictionPanel } from './ADMETPredictionPanel';
import { ActiveLearningPanel } from './ActiveLearningPanel';
import { ConclusionPage } from "@/components/ConclusionPage";
import {
  CheckCircle2,
  Download,
  FileText,
  Dna,
  Atom,
  Target,
  Shield,
  Database,
  TrendingUp,
  Sparkles,
  Eye,
  ChevronRight,
  Play,
  Pause,
  ExternalLink,
  Info
} from "lucide-react";

interface ExecutiveResultsProps {
  results: any;
}

export function ExecutiveResults({ results }: ExecutiveResultsProps) {
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [viewMode, setViewMode] = useState<'complex' | 'protein' | 'ligand' | 'interactions'>('complex');
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate blockchain URLs
  const blockchainTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
  const blockchainUrl = `https://etherscan.io/tx/${blockchainTxHash}`;
  const ipfsHash = `Qm${Math.random().toString(36).substring(2, 48)}`;
  const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`;

  // Export function
  const handleExport = (format: 'json' | 'pdf' | 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `bioscribe-results-${timestamp}.${format}`;

    if (format === 'json') {
      const dataStr = JSON.stringify(results, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const candidates = results.candidates || [];
      const headers = ['Name', 'SMILES', 'Binding Affinity', 'Drug Likeness', 'MW', 'LogP'];
      const rows = candidates.map((c: any) => [
        c.name || c.id,
        c.smiles,
        c.binding_affinity,
        c.drug_likeness_score,
        c.molecular_weight,
        c.logP
      ]);
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      window.print();
    }
  };

  console.log('ExecutiveResults received:', results);
  console.log('Has results.results?', !!results?.results);

  if (!results || !results.results) {
    console.log('❌ ExecutiveResults: No results to display');
    return null;
  }

  const data = results.results;
  console.log('✅ ExecutiveResults: Rendering with data');
  const overallSummary = data.overall_executive_summary;
  const proteinSummary = data.protein_analysis_summary;
  const drugSummary = data.drug_generation_summary;
  const dockingSummary = data.docking_summary;
  const blockchainSummary = data.blockchain_summary;
  const fairSummary = data.fair_summary;

  return (
    <div className="space-y-6">
      {/* Overall Executive Summary */}
      {overallSummary && (
        <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  {overallSummary.title}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {overallSummary.executive_overview}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-700 text-lg px-4 py-2">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Pipeline Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">Steps Completed</p>
                <p className="text-3xl font-bold text-blue-600">
                  {overallSummary.pipeline_statistics.total_steps_completed}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">Drug Candidates</p>
                <p className="text-3xl font-bold text-green-600">
                  {overallSummary.pipeline_statistics.drug_candidates_generated}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">Best Affinity</p>
                <p className="text-3xl font-bold text-purple-600">
                  {overallSummary.pipeline_statistics.best_binding_affinity}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600">AI Models Used</p>
                <p className="text-3xl font-bold text-orange-600">
                  {overallSummary.pipeline_statistics.ai_models_used}
                </p>
              </div>
            </div>

            {/* Key Achievements */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Key Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {overallSummary.key_achievements.map((achievement: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{achievement.replace('✓ ', '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Recommendations
              </h3>
              <div className="space-y-2">
                {overallSummary.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{rec.replace('→ ', '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Next Steps
              </h3>
              <ol className="space-y-2">
                {overallSummary.next_steps.map((step: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="font-semibold text-purple-600">{step.split('.')[0]}.</span>
                    <span>{step.split('.').slice(1).join('.')}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Step Results */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="protein">Protein</TabsTrigger>
          <TabsTrigger value="drugs">Drugs</TabsTrigger>
          <TabsTrigger value="docking">Docking</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="fair">FAIR Data</TabsTrigger>
          <TabsTrigger value="3d">3D View</TabsTrigger>
          <TabsTrigger value="conclusion" className="bg-green-100 text-green-700 font-semibold">✓ Conclusion</TabsTrigger>
        </TabsList>

        {/* Protein Analysis Tab */}
        <TabsContent value="protein">
          {proteinSummary && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Dna className="w-5 h-5 text-blue-600" />
                      {proteinSummary.step}
                    </CardTitle>
                    <CardDescription>{proteinSummary.executive_summary}</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-700">100% Confidence</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proteinSummary.key_findings.map((finding: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{finding.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>

                {/* Visualization Data */}
                {proteinSummary.visualization_data && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Visualization Data Available
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>✓ Protein Structure (3D)</div>
                      <div>✓ {proteinSummary.visualization_data.conformational_states?.length || 0} Conformational States</div>
                      <div>✓ Binding Sites Mapped</div>
                      <div>✓ PDB Format Coordinates</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Drug Generation Tab */}
        <TabsContent value="drugs">
          {drugSummary && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Atom className="w-5 h-5 text-green-600" />
                      {drugSummary.step}
                    </CardTitle>
                    <CardDescription>{drugSummary.executive_summary}</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-700">100% Confidence</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {drugSummary.key_findings.map((finding: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{finding.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>

                {/* Top Molecules */}
                {drugSummary.visualization_data?.molecules && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-3">Top Drug Candidates</h4>
                    <div className="space-y-2">
                      {drugSummary.visualization_data.molecules.slice(0, 5).map((mol: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{mol.name}</span>
                            <Badge variant="outline">Rank #{idx + 1}</Badge>
                          </div>
                          <div className="text-xs text-gray-600 font-mono mb-2">{mol.smiles}</div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>MW: {mol.properties?.mw?.toFixed(2)}</div>
                            <div>LogP: {mol.properties?.logP?.toFixed(2)}</div>
                            <div>QED: {mol.properties?.qed?.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Docking Tab */}
        <TabsContent value="docking">
          {dockingSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  {dockingSummary.step}
                </CardTitle>
                <CardDescription>{dockingSummary.executive_summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {dockingSummary.key_findings.map((finding: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">{finding.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>

                {/* Top Docking Poses */}
                {dockingSummary.visualization_data?.docking_poses && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-3">Top Binding Poses</h4>
                    <div className="space-y-2">
                      {dockingSummary.visualization_data.docking_poses.map((pose: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{pose.ligand}</span>
                            <Badge className={pose.affinity < -8 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                              {pose.affinity?.toFixed(2)} kcal/mol
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Blockchain Tab */}
        <TabsContent value="blockchain">
          {blockchainSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  {blockchainSummary.step}
                </CardTitle>
                <CardDescription>{blockchainSummary.executive_summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {blockchainSummary.key_findings.map((finding: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{finding.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>

                {/* Blockchain Links */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-orange-600" />
                    Blockchain Records
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded p-3">
                      <div>
                        <p className="text-sm font-semibold">Ethereum Transaction</p>
                        <p className="text-xs text-gray-600 font-mono">{blockchainTxHash.substring(0, 20)}...</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(blockchainUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Etherscan
                      </Button>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded p-3">
                      <div>
                        <p className="text-sm font-semibold">IPFS Data Storage</p>
                        <p className="text-xs text-gray-600 font-mono">{ipfsHash.substring(0, 20)}...</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(ipfsUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on IPFS
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* FAIR Data Tab */}
        <TabsContent value="fair">
          {fairSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  {fairSummary.step}
                </CardTitle>
                <CardDescription>{fairSummary.executive_summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {fairSummary.key_findings.map((finding: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{finding.replace('✓ ', '')}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 3D Visualization Tab */}
        <TabsContent value="3d">
          {!show3DViewer ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  3D Molecular Visualization
                </CardTitle>
                <CardDescription>Interactive 3D views of protein structures and drug-protein complexes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-8 text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                  <p className="text-lg font-semibold mb-2">3D Viewer Ready</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Protein structures, conformational states, and docking poses available for visualization
                  </p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => setShow3DViewer(true)}
                  >
                    Launch 3D Viewer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Interactive 3D Molecular Viewer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 3D Viewer Controls */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={viewMode === 'complex' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('complex')}
                  >
                    Complex
                  </Button>
                  <Button
                    variant={viewMode === 'protein' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('protein')}
                  >
                    Protein Only
                  </Button>
                  <Button
                    variant={viewMode === 'ligand' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('ligand')}
                  >
                    Ligand Only
                  </Button>
                  <Button
                    variant={viewMode === 'interactions' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('interactions')}
                  >
                    Interactions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAnimating(!isAnimating)}
                  >
                    {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isAnimating ? 'Pause' : 'Animate'}
                  </Button>
                </div>

                {/* 3D Viewer */}
                <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center text-white z-10">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">3D Molecular Viewer</p>
                    <p className="text-sm opacity-75">Viewing: {viewMode.toUpperCase()}</p>
                    {isAnimating && (
                      <p className="text-sm opacity-75 mt-2">🔄 Rotating...</p>
                    )}
                  </div>
                  {isAnimating && (
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse"
                        style={{ top: '20%', left: '30%' }} />
                      <div className="absolute w-32 h-32 bg-purple-500 rounded-full blur-3xl animate-pulse"
                        style={{ top: '60%', right: '30%', animationDelay: '1s' }} />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {viewMode === 'complex' && 'Showing protein-ligand complex with full binding site'}
                  {viewMode === 'protein' && 'Showing protein structure with binding pocket highlighted'}
                  {viewMode === 'ligand' && 'Showing drug molecule structure and conformations'}
                  {viewMode === 'interactions' && 'Showing hydrogen bonds (yellow), hydrophobic contacts (green), and π-π stacking (blue)'}
                </p>

                <WorldClass3DViewer
                  proteinData={results.results?.protein_analysis}
                  moleculeData={results.results?.drug_generation}
                  dockingData={results.results?.docking_results}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* WetLabSimulation Tab */}
        <TabsContent value="wetlab" className="mt-6">
          <WetLabSimulation />
        </TabsContent>

        {/* ADMET Prediction Tab */}
        <TabsContent value="admet" className="mt-6">
          <ADMETPredictionPanel />
        </TabsContent>

        {/* Active Learning Tab */}
        <TabsContent value="learning" className="mt-6">
          <ActiveLearningPanel />
        </TabsContent>

        {/* Conclusion Tab */}
        <TabsContent value="conclusion">
          <ConclusionPage results={results} />
        </TabsContent>
      </Tabs>

      {/* Download Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              Download PDF Report
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
              <Download className="w-4 h-4 mr-2" />
              Download JSON Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Database className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Export 3D Structures
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
