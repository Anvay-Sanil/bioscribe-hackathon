"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Dna, 
  Zap, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Sparkles,
  Target,
  Microscope,
  FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import type { AICompletePipelineRequest } from '@/lib/api';

interface AIWorkflowProps {
  proteinSequence?: string;
  proteinName?: string;
  organism?: string;
  onComplete?: (results: any) => void;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

export function AIEnhancedWorkflow({ 
  proteinSequence, 
  proteinName, 
  organism, 
  onComplete 
}: AIWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [aiHealthy, setAiHealthy] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [results, setResults] = useState<any>(null);

  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'ai_analysis',
      title: 'AI Protein Analysis',
      description: 'Advanced protein embedding and structural analysis using ESM-2',
      icon: <Brain className="w-5 h-5" />,
      status: 'pending',
      progress: 0
    },
    {
      id: 'ai_generation',
      title: 'AI Molecule Generation',
      description: 'Generate drug candidates using ChemGPT and MolT5 models',
      icon: <Sparkles className="w-5 h-5" />,
      status: 'pending',
      progress: 0
    },
    {
      id: 'ai_docking',
      title: 'AI-Enhanced Docking',
      description: 'Advanced binding affinity prediction with interaction analysis',
      icon: <Target className="w-5 h-5" />,
      status: 'pending',
      progress: 0
    },
    {
      id: 'visualization',
      title: '3D Visualization',
      description: 'Interactive molecular visualization with binding analysis',
      icon: <Eye className="w-5 h-5" />,
      status: 'pending',
      progress: 0
    }
  ]);

  // Check AI system health on mount
  useEffect(() => {
    checkAIHealth();
  }, []);

  const checkAIHealth = async () => {
    try {
      const health = await api.checkAIHealth();
      setAiHealthy(health.status === 'healthy');
    } catch (error) {
      console.error('AI health check failed:', error);
      setAiHealthy(false);
    }
  };

  const updateStepStatus = (stepId: string, status: WorkflowStep['status'], progress: number = 0, result?: any, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, result, error }
        : step
    ));
  };

  const runAIWorkflow = async () => {
    if (!proteinSequence) {
      alert('Please provide a protein sequence');
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);

    try {
      // Prepare request
      const request: AICompletePipelineRequest = {
        sequence: proteinSequence,
        name: proteinName,
        organism: organism,
        num_molecules: 10,
        num_poses: 5
      };

      // Step 1: AI Protein Analysis
      updateStepStatus('ai_analysis', 'running', 25);
      setCurrentStep(0);

      // Step 2: AI Molecule Generation  
      updateStepStatus('ai_analysis', 'running', 50);
      updateStepStatus('ai_generation', 'running', 25);
      setCurrentStep(1);

      // Step 3: AI-Enhanced Docking
      updateStepStatus('ai_analysis', 'running', 75);
      updateStepStatus('ai_generation', 'running', 50);
      updateStepStatus('ai_docking', 'running', 25);
      setCurrentStep(2);

      // Execute complete AI pipeline
      updateStepStatus('ai_analysis', 'completed', 100);
      updateStepStatus('ai_generation', 'running', 75);
      updateStepStatus('ai_docking', 'running', 50);

      const pipelineResult = await api.aiCompletePipeline(request);

      // Complete all steps
      updateStepStatus('ai_generation', 'completed', 100, pipelineResult.ai_generation);
      updateStepStatus('ai_docking', 'completed', 100, pipelineResult.ai_docking);
      updateStepStatus('visualization', 'completed', 100);
      setCurrentStep(3);

      setSessionId(pipelineResult.session_id);
      setResults(pipelineResult);

      if (onComplete) {
        onComplete(pipelineResult);
      }

    } catch (error) {
      console.error('AI workflow failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Mark current step as error
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        updateStepStatus(currentStepId, 'error', 0, undefined, errorMessage);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getStepStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                AI-Enhanced Drug Discovery Pipeline
              </CardTitle>
              <CardDescription>
                Production-grade AI system with HuggingFace models and advanced docking
              </CardDescription>
            </div>
            <Badge variant={aiHealthy ? "default" : "destructive"}>
              {aiHealthy ? "AI System Online" : "AI System Offline"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!aiHealthy && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                AI system is not fully available. The workflow will use fallback methods.
                For full AI capabilities, ensure HuggingFace API key is configured.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Progress</CardTitle>
          <CardDescription>
            Advanced AI pipeline processing your protein sequence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center space-x-4 p-4 rounded-lg border ${
                  currentStep === index && isRunning ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className={`flex-shrink-0 ${getStepStatusColor(step.status)}`}>
                  {step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {step.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getStepStatusIcon(step.status)}
                      <span className="text-xs text-gray-500">
                        {step.progress}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-1">
                    {step.description}
                  </p>
                  
                  {step.status === 'running' && (
                    <Progress value={step.progress} className="mt-2" />
                  )}
                  
                  {step.error && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{step.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={runAIWorkflow}
              disabled={isRunning || !proteinSequence}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running AI Pipeline...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Start AI-Enhanced Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Preview */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-green-600" />
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  Session ID: {sessionId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="protein">Protein</TabsTrigger>
                    <TabsTrigger value="molecules">Molecules</TabsTrigger>
                    <TabsTrigger value="docking">Docking</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {results.ai_generation?.total_candidates || 0}
                        </div>
                        <div className="text-sm text-gray-600">Candidates Generated</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {results.ai_docking?.docking_results?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Successful Dockings</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {results.ai_docking?.best_pose?.binding_affinity || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Best Affinity (kcal/mol)</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(results.processing_time || 0)}s
                        </div>
                        <div className="text-sm text-gray-600">Processing Time</div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="protein" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Sequence Properties</h4>
                        <div className="space-y-2 text-sm">
                          <div>Length: {results.ai_generation?.protein_analysis?.sequence_length}</div>
                          <div>MW: {results.ai_generation?.protein_analysis?.molecular_weight?.toFixed(1)} Da</div>
                          <div>Hydrophobicity: {results.ai_generation?.protein_analysis?.hydrophobicity?.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">AI Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div>Embedding Dim: {results.ai_generation?.protein_analysis?.embedding_dim}</div>
                          <div>Druggability: {results.ai_docking?.protein_analysis?.druggability_score?.toFixed(2)}</div>
                          <div>Binding Sites: {results.ai_docking?.protein_analysis?.binding_sites?.length || 0}</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="molecules" className="space-y-4">
                    <div className="space-y-3">
                      {results.ai_generation?.candidates?.slice(0, 5).map((candidate: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{candidate.name}</h4>
                              <p className="text-sm text-gray-600 font-mono">{candidate.smiles}</p>
                            </div>
                            <Badge variant="outline">
                              QED: {candidate.qed?.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                            <div>MW: {candidate.molecular_weight?.toFixed(1)} Da</div>
                            <div>LogP: {candidate.logP?.toFixed(1)}</div>
                            <div>TPSA: {candidate.tpsa?.toFixed(0)} Ų</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="docking" className="space-y-4">
                    <div className="space-y-3">
                      {results.ai_docking?.docking_results?.slice(0, 3).map((result: any, index: number) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{result.candidate_name}</h4>
                              <p className="text-sm text-gray-600">
                                Binding Mode: {result.binding_mode}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {result.best_pose?.binding_affinity} kcal/mol
                              </div>
                              <div className="text-sm text-gray-500">
                                Confidence: {Math.round(result.best_pose?.confidence * 100)}%
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {result.interaction_sites?.map((site: any, siteIndex: number) => (
                              <Badge key={siteIndex} variant="secondary" className="text-xs">
                                {site.residue_name}{site.residue_number}: {site.interaction_type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
