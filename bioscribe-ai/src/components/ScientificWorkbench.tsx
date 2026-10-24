"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dna, 
  FlaskConical, 
  Target, 
  Eye, 
  Download, 
  Settings, 
  Search,
  BookOpen,
  BarChart3,
  Microscope,
  Atom,
  Zap,
  Brain,
  Database,
  FileText,
  Share2,
  Save,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MolecularViewer } from './MolecularViewer';
import { AIEnhancedWorkflow } from './AIEnhancedWorkflow';

interface ScientificWorkbenchProps {
  initialProtein?: {
    sequence: string;
    name: string;
    organism?: string;
  };
}

interface WorkbenchSession {
  id: string;
  name: string;
  protein: any;
  candidates: any[];
  dockingResults: any;
  createdAt: string;
  lastModified: string;
}

export function ScientificWorkbench({ initialProtein }: ScientificWorkbenchProps) {
  const [activeTab, setActiveTab] = useState('protein');
  const [proteinData, setProteinData] = useState(initialProtein || null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [dockingResults, setDockingResults] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [sessions, setSessions] = useState<WorkbenchSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cartoon' | 'surface' | 'sticks' | 'spheres'>('cartoon');
  const [showInteractions, setShowInteractions] = useState(true);
  const [showWater, setShowWater] = useState(false);

  // Mock session data
  useEffect(() => {
    const mockSessions: WorkbenchSession[] = [
      {
        id: 'session_1',
        name: 'Kinase Inhibitor Study',
        protein: { name: 'CDK2', sequence: 'MENFQKVEKIGEGTYGVVYKARNKLTGEVVALKKIRLDTETEGVPSTAIREISLLKELNHPNIVKLLDVIHTENKLYLVFEFLHQDLKKFMDASALTGIPLPLIKSYLFQLLQGLAFCHSHRVLHRDLKPQNLLINTEGAIKLADFGLARAFGVPVRTYTHEVVTLWYRAPEILLGCKYYSTAVDIWSLGCIFAEMVTRRALFPGDSEIDQLFRIFRTLGTPDEVVWPGVTSMPDYKPSFPKWARQDFSKVVPPLDEDGRSLLSQMLHYDPNKRISAKAALAHPFFQDVTKPVPHLRL' },
        candidates: [],
        dockingResults: null,
        createdAt: '2024-01-15T10:30:00Z',
        lastModified: '2024-01-15T14:45:00Z'
      },
      {
        id: 'session_2', 
        name: 'GPCR Modulator Design',
        protein: { name: 'β2-AR', sequence: 'MGQPGNGSAFLLAPNGSHAPDHDVTQQRDEVWVVGMGIVMSLIVLAIVFGNVLVITAIAKFERLQTVTNYFITSLACADLVMGLAVVPFGAAHILMKMWTFGNFWCEFWTSIDVLCVTASIETLCVIAVDRYFAITSPFKYQSLLTKNKARVIILMVWIVSGLTSFLPIQMHWYRATHQEAINCYANETCCDFFTNQAYAIASSIVSFYVPLVIMVFVYSRVFQEAKRQLQKIDKSEGRFHVQNLSQVEQDGRTGHGLRRSSKFCLKEHKALKTLGIIMGTFTLCWLPFFIVNIVHVIQDNLIRKEVYILLNWIGYVNSGFNPLIYCRSPDFRIAFQELLCLRRSSLKAYGNGYSSNGNTGEQSGYHVEQEKENKLLCEDLPGTEDFVGHQGTVPSDNIDSQGRNCSTNDSLL' },
        candidates: [],
        dockingResults: null,
        createdAt: '2024-01-14T09:15:00Z',
        lastModified: '2024-01-14T16:20:00Z'
      }
    ];
    setSessions(mockSessions);
  }, []);

  const handleWorkflowComplete = (results: any) => {
    if (results.ai_generation?.candidates) {
      setCandidates(results.ai_generation.candidates);
      if (results.ai_generation.candidates.length > 0) {
        setSelectedCandidate(results.ai_generation.candidates[0]);
      }
    }
    
    if (results.ai_docking) {
      setDockingResults(results.ai_docking);
    }
    
    setCurrentSession(results.session_id);
    setActiveTab('visualization');
  };

  const handleProteinSubmit = (protein: any) => {
    setProteinData(protein);
    setActiveTab('generation');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Atom className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">BioScribe AI</h1>
                <p className="text-sm text-gray-500">Scientific Workbench</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Brain className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Database className="w-3 h-3 mr-1" />
                Production Ready
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Session
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Project & Protein Details */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Project Sessions</h2>
              <Button size="sm" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSession === session.id 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentSession(session.id)}
                  >
                    <div className="font-medium text-sm">{session.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {session.protein.name} • {new Date(session.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="protein" className="text-xs">
                  <Dna className="w-3 h-3 mr-1" />
                  Protein
                </TabsTrigger>
                <TabsTrigger value="molecules" className="text-xs">
                  <FlaskConical className="w-3 h-3 mr-1" />
                  Molecules
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="protein" className="mt-4 space-y-4">
                {proteinData ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{proteinData.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {proteinData.sequence?.length} amino acids
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-xs space-y-2">
                        <div>
                          <Label className="text-xs font-medium">Sequence</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono break-all max-h-20 overflow-y-auto">
                            {proteinData.sequence?.substring(0, 100)}...
                          </div>
                        </div>
                        {proteinData.organism && (
                          <div>
                            <Label className="text-xs font-medium">Organism</Label>
                            <div className="text-xs text-gray-600">{proteinData.organism}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <Dna className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No protein loaded</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="molecules" className="mt-4">
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {candidates.length > 0 ? (
                      candidates.slice(0, 10).map((candidate, index) => (
                        <Card 
                          key={index}
                          className={`cursor-pointer transition-colors ${
                            selectedCandidate?.id === candidate.id 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-sm">{candidate.name}</div>
                              <Badge variant="outline" className="text-xs">
                                {candidate.binding_affinity?.toFixed(1)} kcal/mol
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 font-mono mb-2 truncate">
                              {candidate.smiles}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>MW: {candidate.molecular_weight?.toFixed(0)}</div>
                              <div>QED: {candidate.qed?.toFixed(2)}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No molecules generated</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 max-w-md">
                <TabsTrigger value="protein">
                  <Dna className="w-4 h-4 mr-2" />
                  Input
                </TabsTrigger>
                <TabsTrigger value="generation">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Generation
                </TabsTrigger>
                <TabsTrigger value="docking">
                  <Target className="w-4 h-4 mr-2" />
                  Docking
                </TabsTrigger>
                <TabsTrigger value="visualization">
                  <Eye className="w-4 h-4 mr-2" />
                  3D View
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="protein" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dna className="w-5 h-5 text-blue-600" />
                      Protein Input & Analysis
                    </CardTitle>
                    <CardDescription>
                      Enter your protein sequence for AI-powered drug discovery
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="protein-name">Protein Name</Label>
                        <Input
                          id="protein-name"
                          placeholder="e.g., CDK2, p53, EGFR"
                          value={proteinData?.name || ''}
                          onChange={(e) => setProteinData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="organism">Organism</Label>
                        <Input
                          id="organism"
                          placeholder="e.g., Homo sapiens"
                          value={proteinData?.organism || ''}
                          onChange={(e) => setProteinData(prev => ({ ...prev, organism: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="sequence">Protein Sequence (FASTA)</Label>
                      <Textarea
                        id="sequence"
                        placeholder="Enter protein sequence..."
                        className="min-h-32 font-mono text-sm"
                        value={proteinData?.sequence || ''}
                        onChange={(e) => setProteinData(prev => ({ ...prev, sequence: e.target.value }))}
                      />
                    </div>
                    
                    <Button 
                      onClick={() => handleProteinSubmit(proteinData)}
                      disabled={!proteinData?.sequence}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Analyze Protein & Start AI Pipeline
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="generation">
                <AIEnhancedWorkflow
                  proteinSequence={proteinData?.sequence}
                  proteinName={proteinData?.name}
                  organism={proteinData?.organism}
                  onComplete={handleWorkflowComplete}
                />
              </TabsContent>

              <TabsContent value="docking" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Docking Results & Analysis
                    </CardTitle>
                    <CardDescription>
                      AI-enhanced molecular docking with binding affinity prediction
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dockingResults ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {dockingResults.docking_results?.length || 0}
                            </div>
                            <div className="text-sm text-gray-600">Successful Dockings</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {dockingResults.best_pose?.binding_affinity || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">Best Affinity (kcal/mol)</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {Math.round((dockingResults.success_rate || 0) * 100)}%
                            </div>
                            <div className="text-sm text-gray-600">Success Rate</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium">Top Docking Results</h4>
                          {dockingResults.docking_results?.slice(0, 5).map((result: any, index: number) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{result.candidate_name}</h5>
                                  <p className="text-sm text-gray-600">
                                    Binding Mode: {result.binding_mode}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">
                                    {result.best_pose?.binding_affinity} kcal/mol
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Score: {result.composite_score}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No docking results available</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Complete the AI generation step first
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="visualization">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-purple-600" />
                        3D Molecular Visualization
                      </CardTitle>
                      <CardDescription>
                        Interactive protein-ligand complex visualization
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MolecularViewer
                        proteinData={proteinData}
                        selectedCandidate={selectedCandidate}
                        viewMode={viewMode}
                        showInteractions={showInteractions}
                        showWater={showWater}
                        onViewModeChange={(mode) => setViewMode(mode as any)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Sidebar - Analysis & Controls */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Visualization Controls</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">View Mode</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['cartoon', 'surface', 'sticks', 'spheres'].map((mode) => (
                      <Button
                        key={mode}
                        variant={viewMode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode(mode as any)}
                        className="text-xs"
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Interactions</Label>
                    <Button
                      variant={showInteractions ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowInteractions(!showInteractions)}
                    >
                      {showInteractions ? 'On' : 'Off'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Show Water</Label>
                    <Button
                      variant={showWater ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowWater(!showWater)}
                    >
                      {showWater ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Analysis Summary</h3>
              <div className="space-y-3 text-sm">
                {selectedCandidate && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium mb-2">{selectedCandidate.name}</div>
                    <div className="space-y-1 text-xs">
                      <div>MW: {selectedCandidate.molecular_weight?.toFixed(1)} Da</div>
                      <div>LogP: {selectedCandidate.logP?.toFixed(2)}</div>
                      <div>QED: {selectedCandidate.qed?.toFixed(2)}</div>
                      <div>Affinity: {selectedCandidate.binding_affinity?.toFixed(1)} kcal/mol</div>
                    </div>
                  </div>
                )}
                
                {dockingResults?.interaction_analysis && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium mb-2">Interactions</div>
                    <div className="space-y-1 text-xs">
                      <div>Success Rate: {Math.round((dockingResults.interaction_analysis.success_rate || 0) * 100)}%</div>
                      <div>Avg Affinity: {dockingResults.interaction_analysis.average_binding_affinity} kcal/mol</div>
                      <div>Best Affinity: {dockingResults.interaction_analysis.best_binding_affinity} kcal/mol</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Export & Share</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
