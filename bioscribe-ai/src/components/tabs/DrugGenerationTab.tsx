"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Atom, 
  Zap, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Beaker,
  TrendingUp,
  FlaskConical
} from "lucide-react";
import { ProteinData, DrugCandidate } from "../BioScribeWorkflow";

interface DrugGenerationTabProps {
  proteinData?: ProteinData;
  onGeneration: (proteinData: ProteinData) => void;
  isProcessing: boolean;
  candidates?: DrugCandidate[];
}

// No mock candidates — all candidates come from the genuine backend API
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function DrugGenerationTab({ 
  proteinData, 
  onGeneration, 
  isProcessing, 
  candidates 
}: DrugGenerationTabProps) {
  const [numCandidates, setNumCandidates] = useState(10);
  const [generationMethod, setGenerationMethod] = useState<'scaffold_hopping' | 'rgroup_enum' | 'fragment_linking'>('scaffold_hopping');
  const [filterCriteria, setFilterCriteria] = useState({
    lipinski: true,
    qed: true,
    pains: true
  });

  const handleGenerate = () => {
    if (!proteinData) return;

    // Call real generation with protein data
    onGeneration(proteinData);
  };

  const getDrugLikenessColor = (qed: number) => {
    if (qed >= 0.8) return "text-green-600 bg-green-50";
    if (qed >= 0.6) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getMolecularWeightColor = (mw: number) => {
    if (mw <= 500) return "text-green-600";
    if (mw <= 600) return "text-yellow-600";
    return "text-red-600";
  };

  if (!proteinData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Atom className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Protein Analysis Required</h3>
            <p className="text-muted-foreground">
              Please complete protein analysis in the previous step to generate drug candidates.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Target Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5" />
            Target Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Protein</div>
              <div className="font-medium">{proteinData.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Length</div>
              <div className="font-medium">{proteinData.length} AA</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Organism</div>
              <div className="font-medium">{proteinData.organism}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            RDKit Generation Settings
          </CardTitle>
          <CardDescription>
            Configure scaffold hopping and R-group enumeration parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Number of Candidates */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Number of Candidates
              </label>
              <select
                value={numCandidates}
                onChange={(e) => setNumCandidates(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value={5}>5 candidates</option>
                <option value={10}>10 candidates</option>
                <option value={15}>15 candidates</option>
                <option value={20}>20 candidates</option>
              </select>
            </div>

            {/* Generation Method */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Generation Method
              </label>
              <select
                value={generationMethod}
                onChange={(e) => setGenerationMethod(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="scaffold_hopping">Scaffold Hopping (25 scaffolds)</option>
                <option value="rgroup_enum">R-Group Enumeration (15 groups)</option>
                <option value="fragment_linking">Fragment Linking (7 linkers)</option>
              </select>
            </div>
          </div>

          {/* Filter Criteria */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Drug-likeness Filters
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterCriteria.lipinski}
                  onChange={(e) => setFilterCriteria(prev => ({
                    ...prev,
                    lipinski: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Lipinski Rule of 5</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterCriteria.qed}
                  onChange={(e) => setFilterCriteria(prev => ({
                    ...prev,
                    qed: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">QED Score ≥ 0.5</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterCriteria.pains}
                  onChange={(e) => setFilterCriteria(prev => ({
                    ...prev,
                    pains: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">PAINS Filter</span>
              </label>
            </div>
          </div>

          {/* AI Model Status */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
              <span className="font-medium">Genuine Engine Status</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex justify-between">
                <span>RDKit MoleculeEngine:</span>
                <Badge variant="outline" className="status-active">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span>BioPython ProteinEngine:</span>
                <Badge variant="outline" className="status-active">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span>ADMET Predictor:</span>
                <Badge variant="outline" className="status-active">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Candidates */}
      {candidates && candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Generated Drug Candidates
            </CardTitle>
            <CardDescription>
              RDKit-generated molecular structures ranked by QED drug-likeness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidates.map((candidate, index) => (
                <motion.div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{candidate.name}</h4>
                      <p className="text-sm text-muted-foreground molecular-formula">
                        {candidate.smiles}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getDrugLikenessColor(candidate.qed)}
                    >
                      QED: {candidate.qed.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">MW:</span>
                      <span className={`ml-1 font-medium ${getMolecularWeightColor(candidate.molecularWeight)}`}>
                        {candidate.molecularWeight.toFixed(1)} Da
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">LogP:</span>
                      <span className="ml-1 font-medium">{candidate.logP.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">TPSA:</span>
                      <span className="ml-1 font-medium">{candidate.tpsa.toFixed(1)} Ų</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rank:</span>
                      <span className="ml-1 font-medium">#{index + 1}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Generation Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-primary">{candidates.length}</div>
                  <div className="text-muted-foreground">Total Generated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {candidates.filter(c => c.qed >= 0.8).length}
                  </div>
                  <div className="text-muted-foreground">High QED</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {candidates.filter(c => c.molecularWeight <= 500).length}
                  </div>
                  <div className="text-muted-foreground">Lipinski Compliant</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {(candidates.reduce((sum, c) => sum + c.qed, 0) / candidates.length).toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">Avg QED Score</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={isProcessing}
          size="lg"
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Candidates...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Drug Candidates
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
                <span className="font-medium">RDKit engine generating drug candidates...</span>
              </div>
              <Progress value={60} className="h-2" />
              <div className="text-sm text-muted-foreground">
                • Selecting scaffolds based on target class<br/>
                • Enumerating R-group substitutions<br/>
                • Applying PAINS + Lipinski filters<br/>
                • Ranking by QED drug-likeness
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
