"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Play, 
  Settings, 
  CheckCircle, 
  Loader2,
  Zap,
  Award,
  BarChart3
} from "lucide-react";
import { ProteinData, DrugCandidate } from "../BioScribeWorkflow";
import Advanced3DVisualization from "../Advanced3DVisualization";

interface DockingTabProps {
  candidates?: DrugCandidate[];
  proteinData?: ProteinData;
  onDocking: (results: any) => void;
  isProcessing: boolean;
  results?: any;
}

// Genuine affinity scoring via the backend API
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function DockingTab({ candidates, proteinData, onDocking, isProcessing, results }: DockingTabProps) {
  const [scoringError, setScoringError] = useState<string | null>(null);
  const [realTimeResults, setRealTimeResults] = useState<any>(null);

  const handleStartDocking = async () => {
    console.log('Starting genuine affinity scoring...');
    setScoringError(null);
    
    if (!candidates || !proteinData) {
      console.error('Missing candidates or protein data');
      return;
    }

    try {
      // Call genuine affinity scoring endpoint
      const response = await fetch(`${API_BASE}/api/affinity/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: proteinData.sequence,
          name: proteinData.name || 'Unknown Protein',
          organism: proteinData.organism || 'Unknown',
          num_candidates: candidates.length
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Affinity scoring failed: ${response.status} - ${errorText}`);
      }

      const apiResult = await response.json();
      console.log('Genuine affinity results:', apiResult);
      setRealTimeResults(apiResult);

      // Map genuine API response to the component's expected shape
      const scoredCandidates = (apiResult.data?.scored_candidates || []).map((sc: any, index: number) => ({
        name: sc.candidate_id || `Candidate-${index + 1}`,
        smiles: sc.canonical_smiles,
        bindingAffinity: sc.affinity_prediction?.predicted_affinity_kcal_mol || 0,
        confidence: (sc.affinity_prediction?.confidence || 0) * 100,
        molecularWeight: sc.properties?.molecular_weight || 0,
        qed: sc.properties?.qed || 0,
        logP: sc.properties?.logP || 0,
        method: sc.affinity_prediction?.method || 'empirical_descriptor',
        interactions: (sc.predicted_interactions || []).map((pi: any) => ({
          type: pi.type,
          residue: pi.description,
          distance: 0
        })),
        rmsd: 0, // Not applicable for descriptor-based scoring
        poses: 1 // Descriptor-based scoring doesn't generate poses
      })).sort((a: any, b: any) => a.bindingAffinity - b.bindingAffinity);

      const bestCandidate = scoredCandidates[0];

      onDocking({
        method: apiResult.data?.scoring_method || 'empirical_descriptor',
        candidates: scoredCandidates,
        bestCandidate: bestCandidate,
        statistics: {
          totalCandidates: scoredCandidates.length,
          highAffinityCandidates: scoredCandidates.filter((c: any) => c.bindingAffinity < -8.0).length,
          averageAffinity: scoredCandidates.length > 0
            ? scoredCandidates.reduce((sum: number, c: any) => sum + c.bindingAffinity, 0) / scoredCandidates.length
            : 0,
          averageRMSD: 0 // Not applicable
        }
      });
    } catch (error) {
      console.error('Affinity scoring failed:', error);
      setScoringError(error instanceof Error ? error.message : 'Affinity scoring failed. Is the backend running?');
    }
  };

  const getAffinityColor = (affinity: number) => {
    if (affinity < -10) return "text-green-600 bg-green-50";
    if (affinity < -8) return "text-blue-600 bg-blue-50";
    if (affinity < -6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getRMSDColor = (rmsd: number) => {
    if (rmsd < 2.0) return "text-green-600";
    if (rmsd < 3.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getAffinityLabel = (affinity: number) => {
    if (affinity < -10) return "Excellent";
    if (affinity < -8) return "Good";
    if (affinity < -6) return "Moderate";
    return "Weak";
  };

  if (!candidates || candidates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Drug Candidates Required</h3>
            <p className="text-muted-foreground">
              Please generate drug candidates in the previous step to perform docking simulation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidates Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Affinity Scoring
          </CardTitle>
          <CardDescription>
            Predict binding affinity for generated drug candidates using empirical QSAR descriptors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Candidates</div>
              <div className="text-2xl font-bold text-primary">{candidates.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg Molecular Weight</div>
              <div className="text-2xl font-bold text-secondary">
                {(candidates.reduce((sum, c) => sum + c.molecularWeight, 0) / candidates.length).toFixed(0)} Da
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg QED Score</div>
              <div className="text-2xl font-bold text-accent">
                {(candidates.reduce((sum, c) => sum + c.qed, 0) / candidates.length).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Method Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Affinity Scoring Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Empirical Descriptor-Based QSAR Scoring</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Predicts binding affinity using molecular descriptor heuristics (MW, LogP, TPSA, HBD/HBA) 
              scored against protein target complementarity. This is <strong>not</strong> 3D physics-based docking.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Deterministic &amp; reproducible</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Ligand efficiency (Hopkins LE)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Protein-aware complementarity</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Interaction type prediction</span>
              </div>
            </div>
          </div>

          {scoringError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-1">Scoring Error</h4>
              <p className="text-sm text-red-600">{scoringError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Docking Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Affinity Scoring Results
            </CardTitle>
            <CardDescription>
              Binding affinity predictions ranked by descriptor-based QSAR score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Best Candidate Highlight */}
            {results.bestCandidate && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg mb-6 border border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-5 h-5 text-green-600" />
                      <h4 className="font-bold text-green-800">Best Candidate</h4>
                    </div>
                    <h3 className="text-lg font-bold">{results.bestCandidate.name}</h3>
                    <p className="text-sm text-muted-foreground molecular-formula">
                      {results.bestCandidate.smiles}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Rank #1
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Binding Affinity:</span>
                    <div className="font-bold text-green-600">
                      {results.bestCandidate.bindingAffinity.toFixed(1)} kcal/mol
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RMSD:</span>
                    <div className="font-bold text-green-600">
                      {results.bestCandidate.rmsd.toFixed(1)} Å
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence:</span>
                    <div className="font-bold text-green-600">
                      {results.bestCandidate.confidence.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Poses:</span>
                    <div className="font-bold text-green-600">
                      {results.bestCandidate.poses}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Results */}
            <div className="space-y-3">
              {results.candidates.map((candidate: any, index: number) => (
                <motion.div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{candidate.name}</h4>
                      <p className="text-sm text-muted-foreground molecular-formula">
                        {candidate.smiles}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Badge 
                        variant="outline" 
                        className={getAffinityColor(candidate.bindingAffinity)}
                      >
                        {getAffinityLabel(candidate.bindingAffinity)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Affinity:</span>
                      <div className="font-medium">
                        {candidate.bindingAffinity.toFixed(1)} kcal/mol
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">RMSD:</span>
                      <div className={`font-medium ${getRMSDColor(candidate.rmsd)}`}>
                        {candidate.rmsd.toFixed(1)} Å
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>
                      <div className="font-medium">{candidate.confidence.toFixed(0)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Poses:</span>
                      <div className="font-medium">{candidate.poses}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Interactions:</span>
                      <div className="font-medium">{candidate.interactions.length}</div>
                    </div>
                  </div>

                  {/* Key Interactions */}
                  {candidate.interactions.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">Key Interactions:</div>
                      <div className="flex flex-wrap gap-2">
                        {candidate.interactions.map((interaction: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {interaction.type} - {interaction.residue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Statistics */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Docking Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {results.statistics.highAffinityCandidates}
                  </div>
                  <div className="text-muted-foreground">High Affinity (&lt; -8.0)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {results.statistics.averageAffinity.toFixed(1)}
                  </div>
                  <div className="text-muted-foreground">Avg Affinity (kcal/mol)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {results.statistics.averageRMSD.toFixed(1)}
                  </div>
                  <div className="text-muted-foreground">Avg RMSD (Å)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-4">
                    {results.statistics.totalCandidates}
                  </div>
                  <div className="text-muted-foreground">Total Docked</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleStartDocking}
          disabled={isProcessing}
          size="lg"
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Affinity Scoring...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Affinity Scoring
            </>
          )}
        </Button>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium">Running empirical affinity scoring...</span>
              </div>
              <Progress value={45} className="h-2" />
              <div className="text-sm text-muted-foreground">
                • Computing molecular descriptors (MW, LogP, TPSA, HBD/HBA)<br/>
                • Evaluating protein-ligand complementarity<br/>
                • Calculating ligand efficiency<br/>
                • Ranking candidates by predicted affinity
              </div>
              <div className="text-xs text-muted-foreground">
                Typically completes in under 30 seconds
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced 3D Visualization */}
      {realTimeResults && (
        <Advanced3DVisualization
          proteinData={proteinData}
          ligandData={candidates?.[0]}
          dockingResults={realTimeResults}
          interactionData={realTimeResults.interaction_analysis}
        />
      )}
    </div>
  );
}
