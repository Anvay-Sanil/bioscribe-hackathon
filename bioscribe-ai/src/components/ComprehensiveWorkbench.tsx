"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Dna, 
  FlaskConical, 
  Target, 
  Eye, 
  Users,
  FileText,
  Plus,
  Trash2,
  Play,
  Download,
  Settings,
  Brain,
  Microscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProteinData {
  id: string;
  name: string;
  sequence: string;
  organism?: string;
  length: number;
  molecularWeight: number;
  analysis?: any;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

interface LigandData {
  id: string;
  name: string;
  smiles: string;
  molecularWeight: number;
  logP: number;
  qed: number;
  source: 'generated' | 'manual' | 'database';
  bindingAffinity?: number;
  confidence?: number;
}

interface TestSubject {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  condition: string;
  proteinProfile: string[];
  testResults?: any;
  status: 'pending' | 'testing' | 'completed';
}

interface StudySession {
  id: string;
  name: string;
  proteins: ProteinData[];
  ligands: LigandData[];
  testSubjects: TestSubject[];
  reports: any[];
  createdAt: Date;
  status: 'setup' | 'running' | 'completed';
}

export function ComprehensiveWorkbench() {
  const [activeTab, setActiveTab] = useState('proteins');
  const [currentSession, setCurrentSession] = useState<StudySession>({
    id: 'session_1',
    name: 'Multi-Target Drug Discovery Study',
    proteins: [
      {
        id: 'protein_1',
        name: 'CDK2',
        sequence: 'MENFQKVEKIGEGTYGVVYKARNKLTGEVVALKKIRLDTETEGVPSTAIREISLLKELNHPNIVKLLDVIHTENKLYLVFEFLHQDLKKFMDASALTGIPLPLIKSYLFQLLQGLAFCHSHRVLHRDLKPQNLLINTEGAIKLADFGLARAFGVPVRTYTHEVVTLWYRAPEILLGCKYYSTAVDIWSLGCIFAEMVTRRALFPGDSEIDQLFRIFRTLGTPDEVVWPGVTSMPDYKPSFPKWARQDFSKVVPPLDEDGRSLLSQMLHYDPNKRISAKAALAHPFFQDVTKPVPHLRL',
        organism: 'Homo sapiens',
        length: 298,
        molecularWeight: 33800,
        status: 'pending'
      },
      {
        id: 'protein_2',
        name: 'p53',
        sequence: 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD',
        organism: 'Homo sapiens',
        length: 393,
        molecularWeight: 43700,
        status: 'pending'
      }
    ],
    ligands: [],
    testSubjects: [],
    reports: [],
    createdAt: new Date(),
    status: 'setup'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);

  const addProtein = () => {
    const newProtein: ProteinData = {
      id: `protein_${Date.now()}`,
      name: `Protein ${currentSession.proteins.length + 1}`,
      sequence: '',
      length: 0,
      molecularWeight: 0,
      status: 'pending'
    };
    
    setCurrentSession(prev => ({
      ...prev,
      proteins: [...prev.proteins, newProtein]
    }));
  };

  const generateTestSubjects = (count: number = 5) => {
    const conditions = ['Healthy', 'Cancer', 'Diabetes', 'Cardiovascular', 'Neurological'];
    const names = ['Patient A', 'Patient B', 'Patient C', 'Patient D', 'Patient E'];
    
    const subjects: TestSubject[] = Array.from({ length: count }, (_, i) => ({
      id: `subject_${Date.now()}_${i}`,
      name: names[i] || `Subject ${i + 1}`,
      age: 25 + Math.floor(Math.random() * 50),
      gender: Math.random() > 0.5 ? 'female' : 'male',
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      proteinProfile: currentSession.proteins.map(p => p.id),
      status: 'pending'
    }));

    setCurrentSession(prev => ({
      ...prev,
      testSubjects: subjects
    }));
  };

  const generateLigands = async (proteinId: string, count: number = 10) => {
    setIsProcessing(true);
    setProcessingStep('Generating ligands...');
    
    // Simulate AI ligand generation
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const drugSmiles = [
      "CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)C",
      "CN1CCN(CC1)C2=CC=C(C=C2)NC(=O)C3=CC=C(C=C3)F",
      "CC1=CC=C(C=C1)C2=CC(=NN2C3=CC=C(C=C3)S(=O)(=O)N)C",
      "COC1=CC=C(C=C1)CCN2CCC(CC2)C3=CC=CC=C3",
      "CC(C)NCC(COC1=CC=CC=C1)O",
      "CN1CCC(CC1)OC2=CC=C(C=C2)C(=O)N",
      "CC1=CC=C(C=C1)C(CCN2CCCCC2)C3=CC=CC=C3",
      "COC1=CC=C(C=C1)C(=O)NCCN2CCCCC2",
      "CC(C)(C)OC(=O)NC1=CC=C(C=C1)C(=O)O",
      "CN(C)C1=CC=C(C=C1)C(=O)NC2=CC=CC=C2Cl"
    ];

    const newLigands: LigandData[] = drugSmiles.slice(0, count).map((smiles, i) => ({
      id: `ligand_${Date.now()}_${i}`,
      name: `Compound-${proteinId}-${i + 1}`,
      smiles,
      molecularWeight: 200 + Math.random() * 400,
      logP: -1 + Math.random() * 6,
      qed: 0.3 + Math.random() * 0.6,
      source: 'generated',
      bindingAffinity: -12 + Math.random() * 8,
      confidence: 0.6 + Math.random() * 0.35
    }));

    setCurrentSession(prev => ({
      ...prev,
      ligands: [...prev.ligands, ...newLigands]
    }));

    setIsProcessing(false);
    setProgress(0);
  };

  const runComprehensiveAnalysis = async () => {
    setIsProcessing(true);
    setCurrentSession(prev => ({ ...prev, status: 'running' }));

    // Step 1: Protein Analysis
    setProcessingStep('Analyzing proteins...');
    for (let i = 0; i <= 100; i += 5) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 2: Ligand Generation
    setProcessingStep('Generating ligands for all proteins...');
    for (const protein of currentSession.proteins) {
      await generateLigands(protein.id, 5);
    }

    // Step 3: Docking Analysis
    setProcessingStep('Performing molecular docking...');
    for (let i = 0; i <= 100; i += 3) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Step 4: Test Subject Analysis
    setProcessingStep('Analyzing test subjects...');
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Step 5: Generate Reports
    setProcessingStep('Generating comprehensive reports...');
    const reports = generateComprehensiveReports();
    
    setCurrentSession(prev => ({
      ...prev,
      reports,
      status: 'completed'
    }));

    setIsProcessing(false);
    setProgress(0);
    setProcessingStep('');
  };

  const generateComprehensiveReports = () => {
    return [
      {
        id: 'protein_analysis_report',
        title: 'Multi-Protein Analysis Report',
        type: 'protein_analysis',
        data: currentSession.proteins,
        generatedAt: new Date()
      },
      {
        id: 'ligand_screening_report',
        title: 'Ligand Screening Results',
        type: 'ligand_screening',
        data: currentSession.ligands,
        generatedAt: new Date()
      },
      {
        id: 'patient_analysis_report',
        title: 'Patient Cohort Analysis',
        type: 'patient_analysis',
        data: currentSession.testSubjects,
        generatedAt: new Date()
      },
      {
        id: 'comprehensive_study_report',
        title: 'Comprehensive Drug Discovery Study Report',
        type: 'comprehensive',
        data: currentSession,
        generatedAt: new Date()
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Microscope className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">BioScribe AI</h1>
                <p className="text-sm text-gray-500">Comprehensive Drug Discovery Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Brain className="w-3 h-3 mr-1" />
                Multi-Target Analysis
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {currentSession.proteins.length} Proteins
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {currentSession.ligands.length} Ligands
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={runComprehensiveAnalysis}
              disabled={isProcessing || currentSession.proteins.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Complete Analysis
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {isProcessing && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{processingStep}</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto mb-8">
            <TabsTrigger value="proteins">
              <Dna className="w-4 h-4 mr-2" />
              Proteins ({currentSession.proteins.length})
            </TabsTrigger>
            <TabsTrigger value="ligands">
              <FlaskConical className="w-4 h-4 mr-2" />
              Ligands ({currentSession.ligands.length})
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <Users className="w-4 h-4 mr-2" />
              Test Subjects ({currentSession.testSubjects.length})
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <Target className="w-4 h-4 mr-2" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Reports ({currentSession.reports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proteins" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Protein Targets</CardTitle>
                    <CardDescription>Manage multiple protein targets for drug discovery</CardDescription>
                  </div>
                  <Button onClick={addProtein} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Protein
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSession.proteins.map((protein) => (
                    <Card key={protein.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{protein.name}</CardTitle>
                          <Badge variant={protein.status === 'completed' ? 'default' : 'secondary'}>
                            {protein.status}
                          </Badge>
                        </div>
                        <CardDescription>{protein.organism}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Length:</span>
                            <span>{protein.length} AA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mol. Weight:</span>
                            <span>{protein.molecularWeight.toLocaleString()} Da</span>
                          </div>
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => generateLigands(protein.id)}
                            >
                              Generate Ligands
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ligands" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Drug Candidates & Ligands</CardTitle>
                <CardDescription>AI-generated and manually curated drug candidates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentSession.ligands.map((ligand) => (
                    <Card key={ligand.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{ligand.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {ligand.source}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs">
                          <div className="font-mono text-gray-600 break-all">
                            {ligand.smiles.substring(0, 30)}...
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>MW: {ligand.molecularWeight.toFixed(0)}</div>
                            <div>LogP: {ligand.logP.toFixed(1)}</div>
                            <div>QED: {ligand.qed.toFixed(2)}</div>
                            <div>Affinity: {ligand.bindingAffinity?.toFixed(1)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Test Subjects & Patient Cohorts</CardTitle>
                    <CardDescription>Virtual patient profiles for drug testing simulation</CardDescription>
                  </div>
                  <Button onClick={() => generateTestSubjects()} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Subjects
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSession.testSubjects.map((subject) => (
                    <Card key={subject.id} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{subject.name}</CardTitle>
                          <Badge variant={subject.status === 'completed' ? 'default' : 'secondary'}>
                            {subject.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Age:</span>
                            <span>{subject.age}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gender:</span>
                            <span className="capitalize">{subject.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Condition:</span>
                            <span>{subject.condition}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Proteins: {subject.proteinProfile.length}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentSession.proteins.length}
                  </div>
                  <div className="text-sm text-gray-600">Protein Targets</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentSession.ligands.length}
                  </div>
                  <div className="text-sm text-gray-600">Drug Candidates</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentSession.testSubjects.length}
                  </div>
                  <div className="text-sm text-gray-600">Test Subjects</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentSession.ligands.filter(l => l.bindingAffinity && l.bindingAffinity < -8).length}
                  </div>
                  <div className="text-sm text-gray-600">High Affinity Hits</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Analysis Overview</CardTitle>
                <CardDescription>Comprehensive analysis results</CardDescription>
              </CardHeader>
              <CardContent>
                {currentSession.status === 'completed' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">Analysis Complete</h3>
                      <p className="text-green-700 text-sm">
                        Successfully analyzed {currentSession.proteins.length} proteins, 
                        generated {currentSession.ligands.length} ligands, and 
                        evaluated {currentSession.testSubjects.length} test subjects.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Best Binding Affinity</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.min(...currentSession.ligands.map(l => l.bindingAffinity || 0)).toFixed(1)} kcal/mol
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900">Success Rate</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.round((currentSession.ligands.filter(l => l.bindingAffinity && l.bindingAffinity < -6).length / currentSession.ligands.length) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Run the comprehensive analysis to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scientific Reports</CardTitle>
                <CardDescription>Comprehensive analysis reports for all components</CardDescription>
              </CardHeader>
              <CardContent>
                {currentSession.reports.length > 0 ? (
                  <div className="space-y-4">
                    {currentSession.reports.map((report) => (
                      <Card key={report.id} className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          <CardDescription>
                            Generated: {report.generatedAt.toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline" className="mb-2">
                            {report.type}
                          </Badge>
                          <p className="text-sm text-gray-600">
                            Comprehensive analysis report including detailed findings, 
                            statistical analysis, and recommendations.
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No reports generated yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Complete the analysis to generate comprehensive reports
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
