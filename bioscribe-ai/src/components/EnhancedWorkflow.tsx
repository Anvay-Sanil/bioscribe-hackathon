"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  Cpu, 
  Database, 
  GitBranch,
  TrendingUp,
  CheckCircle,
  Loader2,
  Sparkles,
  Layers,
  Users
} from "lucide-react";

const ENHANCED_API_URL = "http://localhost:8001/api/v2";

export function EnhancedWorkflow() {
  const [activeTab, setActiveTab] = useState("protein");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  // Enhanced Protein Prediction
  const runEnhancedProteinPrediction = async () => {
    setLoading(true);
    setProgress(10);
    
    try {
      const response = await fetch(`${ENHANCED_API_URL}/protein/predict-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
          name: "HIV-1 Protease",
          organism: "HIV-1"
        })
      });
      
      setProgress(50);
      const data = await response.json();
      setProgress(100);
      setResults({ type: 'protein', data });
      
    } catch (error) {
      console.error('Enhanced prediction failed:', error);
      setResults({ type: 'error', message: 'Check if enhanced API is running on port 8001' });
    } finally {
      setLoading(false);
    }
  };

  // Multi-Model Drug Generation
  const runMultiModelGeneration = async () => {
    setLoading(true);
    setProgress(10);
    
    try {
      const response = await fetch(`${ENHANCED_API_URL}/drugs/multi-model-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protein_sequence: "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
          num_candidates: 20,
          diversity_weight: 0.3
        })
      });
      
      setProgress(50);
      const data = await response.json();
      setProgress(100);
      setResults({ type: 'drugs', data });
      
    } catch (error) {
      console.error('Multi-model generation failed:', error);
      setResults({ type: 'error', message: 'Check if enhanced API is running on port 8001' });
    } finally {
      setLoading(false);
    }
  };

  // Complete Pipeline
  const runCompletePipeline = async () => {
    setLoading(true);
    setProgress(10);
    
    try {
      const response = await fetch(`${ENHANCED_API_URL}/workflows/complete-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
          name: "HIV-1 Protease",
          num_candidates: 20
        })
      });
      
      setProgress(50);
      const data = await response.json();
      setProgress(100);
      setResults({ type: 'pipeline', data });
      
    } catch (error) {
      console.error('Pipeline failed:', error);
      setResults({ type: 'error', message: 'Check if enhanced API is running on port 8001' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            BioScribe AI v2.0 - Enhanced Platform
          </CardTitle>
          <p className="text-blue-100 mt-2">
            Multi-model AI • High-throughput processing • Collaborative workflows
          </p>
        </CardHeader>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200 hover:border-blue-400 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="w-5 h-5 text-blue-600" />
              5 AI Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline">GPT-Molecular</Badge>
              <Badge variant="outline">BERT-Optimizer</Badge>
              <Badge variant="outline">T5-Translator</Badge>
              <Badge variant="outline">VAE-Generator</Badge>
              <Badge variant="outline">RL-Optimizer</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-green-600" />
              High-Throughput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Parallel Workers:</span>
                <span className="font-bold">8</span>
              </div>
              <div className="flex justify-between">
                <span>Batch Processing:</span>
                <span className="font-bold">✓</span>
              </div>
              <div className="flex justify-between">
                <span>Virtual Screening:</span>
                <span className="font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 hover:border-purple-400 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-purple-600" />
              Collaboration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>Version Control</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Dataset Sharing</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Project Forking</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="protein">Enhanced Protein</TabsTrigger>
              <TabsTrigger value="drugs">Multi-Model Drugs</TabsTrigger>
              <TabsTrigger value="pipeline">Complete Pipeline</TabsTrigger>
            </TabsList>

            <TabsContent value="protein" className="space-y-4">
              <Card className="bg-blue-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Enhanced Protein Structure Prediction</h3>
                  <ul className="space-y-2 text-sm mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Secondary structure prediction
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Disorder region detection
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Binding site prediction
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      PTM site prediction
                    </li>
                  </ul>
                  <Button 
                    onClick={runEnhancedProteinPrediction}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Run Enhanced Prediction
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="drugs" className="space-y-4">
              <Card className="bg-green-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Multi-Model Drug Generation</h3>
                  <ul className="space-y-2 text-sm mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      5 AI models (GPT, BERT, T5, VAE, RL)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Ensemble predictions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Diversity filtering
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Property optimization
                    </li>
                  </ul>
                  <Button 
                    onClick={runMultiModelGeneration}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4 mr-2" />
                        Generate with 5 Models
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4">
              <Card className="bg-purple-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Complete Drug Discovery Pipeline</h3>
                  <ul className="space-y-2 text-sm mb-4">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Step 1: Enhanced protein prediction
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Step 2: Multi-model drug generation
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Step 3: High-throughput docking
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Step 4: Result analysis & ranking
                    </li>
                  </ul>
                  <Button 
                    onClick={runCompletePipeline}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running Pipeline...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Run Complete Pipeline
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Progress Bar */}
          {loading && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-2 text-center">
                Processing with enhanced AI models...
              </p>
            </div>
          )}

          {/* Results Display */}
          {results && !loading && (
            <Card className="mt-4 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Enhanced Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.type === 'error' ? (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-600 font-semibold">Error:</p>
                    <p className="text-sm">{results.message}</p>
                    <p className="text-xs mt-2 text-gray-600">
                      Make sure the enhanced API is running: py -3.13 api_enhanced.py
                    </p>
                  </div>
                ) : (
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(results.data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* API Status */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enhanced API Status</p>
              <p className="text-xs text-gray-600">http://localhost:8001/api/v2</p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700">
              v2.0 Enhanced
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
