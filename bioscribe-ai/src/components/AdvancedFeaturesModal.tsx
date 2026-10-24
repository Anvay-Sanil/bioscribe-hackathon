"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedFeatureResults } from "@/components/AdvancedFeatureResults";
import { 
  X, 
  Loader2, 
  CheckCircle2,
  Download,
  Copy,
  AlertCircle
} from "lucide-react";

const UNIFIED_API = "http://localhost:8000/api";

interface AdvancedFeaturesModalProps {
  feature: string;
  onClose: () => void;
}

export function AdvancedFeaturesModal({ feature, onClose }: AdvancedFeaturesModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // RNA Aptamer Design
  const [aptamerTarget, setAptamerTarget] = useState("HIV-1 Protease");
  const [aptamerSequence, setAptamerSequence] = useState("PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF");
  const [aptamerLength, setAptamerLength] = useState(40);

  // CRISPR Guide Design
  const [crisprGene, setCrisprGene] = useState("TP53");
  const [crisprGenome, setCrisprGenome] = useState("ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCTGAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCACTGAAGACCCAGGTCCAGATGAAGCTCCCAGAATGCCAGAGGCTGCTCCCCCCGTGGCCCCTGCACCAGCAGCTCCTACACCGGCGGCCCCTGCACCAGCCCCCTCCTGGCCCCTGTCATCTTCT");
  const [crisprEditType, setCrisprEditType] = useState("knockout");

  // mRNA Therapeutic Design
  const [mrnaTarget, setMrnaTarget] = useState("Insulin");
  const [mrnaSequence, setMrnaSequence] = useState("MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN");

  // Lab Equipment
  const [equipmentType, setEquipmentType] = useState("opentrons");
  const [connectionParams, setConnectionParams] = useState({ ip: "192.168.1.100", port: 31950 });

  // Experiment Design
  const [hypothesis, setHypothesis] = useState("Test binding affinity of drug candidates");
  const [experimentBudget, setExperimentBudget] = useState(96);

  // Blockchain
  const [experimentName, setExperimentName] = useState("Drug Discovery Experiment");
  const [verifyExperimentId, setVerifyExperimentId] = useState("");

  // Causal AI
  const [targetGene, setTargetGene] = useState("EGFR");
  const [omicsData, setOmicsData] = useState({ expression: 2.5, mutation: "L858R" });

  const runFeature = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let response;

      switch (feature) {
        case "rna-aptamer":
          response = await fetch(`${UNIFIED_API}/rna/design-aptamer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_protein: aptamerTarget,
              protein_sequence: aptamerSequence,
              aptamer_length: aptamerLength
            })
          });
          break;

        case "crispr-guide":
          response = await fetch(`${UNIFIED_API}/rna/crispr-guide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_gene: crisprGene,
              genome_sequence: crisprGenome,
              edit_type: crisprEditType
            })
          });
          break;

        case "mrna-therapeutic":
          response = await fetch(`${UNIFIED_API}/rna/mrna-therapeutic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              protein_target: mrnaTarget,
              protein_sequence: mrnaSequence
            })
          });
          break;

        case "lab-connect":
          response = await fetch(`${UNIFIED_API}/lab/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              equipment_type: equipmentType,
              connection_params: connectionParams
            })
          });
          break;

        case "lab-experiment":
          response = await fetch(`${UNIFIED_API}/lab/experiment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hypothesis: { description: hypothesis },
              ai_predictions: [{ smiles: "CC(=O)Oc1ccccc1C(=O)O", predicted_affinity: -8.5 }],
              budget: experimentBudget
            })
          });
          break;

        case "blockchain-register":
          response = await fetch(`${UNIFIED_API}/blockchain/register-experiment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              experiment_data: { name: experimentName, date: new Date().toISOString() },
              protocol: { steps: ["protein_analysis", "drug_generation", "docking"] },
              results: { status: "completed", candidates: 20 }
            })
          });
          break;

        case "blockchain-verify":
          response = await fetch(`${UNIFIED_API}/blockchain/verify-reproducibility?original_experiment_id=${verifyExperimentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              protocol: { steps: ["protein_analysis", "drug_generation"] },
              results: { status: "completed" }
            })
          });
          break;

        case "causal-validation":
          response = await fetch(`${UNIFIED_API}/causal/target-validation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_gene: targetGene,
              omics_data: omicsData,
              clinical_data: null
            })
          });
          break;

        default:
          throw new Error("Unknown feature");
      }

      if (response && response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        const errorData = await response?.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(JSON.stringify(errorData));
      }

    } catch (err: any) {
      console.error('Feature error:', err);
      
      // Parse error message
      let errorMessage = 'An error occurred';
      try {
        const errorObj = JSON.parse(err.message);
        if (errorObj.detail) {
          if (typeof errorObj.detail === 'object') {
            errorMessage = `${errorObj.detail.type || 'Error'}: ${errorObj.detail.error || 'Unknown error'}`;
          } else {
            errorMessage = errorObj.detail;
          }
        }
      } catch (e) {
        errorMessage = err.message || 'An error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (feature) {
      case "rna-aptamer":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target Protein</label>
              <input
                type="text"
                value={aptamerTarget}
                onChange={(e) => setAptamerTarget(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., HIV-1 Protease"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Protein Sequence</label>
              <textarea
                value={aptamerSequence}
                onChange={(e) => setAptamerSequence(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={3}
                placeholder="Enter protein sequence..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Aptamer Length (nt)</label>
              <input
                type="number"
                value={aptamerLength}
                onChange={(e) => setAptamerLength(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                min="20"
                max="100"
              />
            </div>
          </div>
        );

      case "crispr-guide":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target Gene</label>
              <input
                type="text"
                value={crisprGene}
                onChange={(e) => setCrisprGene(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., TP53, BRCA1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Genome Sequence</label>
              <textarea
                value={crisprGenome}
                onChange={(e) => setCrisprGenome(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={3}
                placeholder="Enter genomic sequence..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Edit Type</label>
              <select
                value={crisprEditType}
                onChange={(e) => setCrisprEditType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="knockout">Knockout</option>
                <option value="knockin">Knock-in</option>
                <option value="base_edit">Base Edit</option>
                <option value="prime_edit">Prime Edit</option>
              </select>
            </div>
          </div>
        );

      case "mrna-therapeutic":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Protein Target</label>
              <input
                type="text"
                value={mrnaTarget}
                onChange={(e) => setMrnaTarget(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Insulin, Antibody"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Protein Sequence</label>
              <textarea
                value={mrnaSequence}
                onChange={(e) => setMrnaSequence(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={3}
                placeholder="Enter protein sequence..."
              />
            </div>
          </div>
        );

      case "lab-connect":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Equipment Type</label>
              <select
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="opentrons">Opentrons OT-2</option>
                <option value="hamilton">Hamilton STAR</option>
                <option value="hts_platform">HTS Platform</option>
                <option value="eln">Electronic Lab Notebook</option>
                <option value="lims">LIMS System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">IP Address</label>
              <input
                type="text"
                value={connectionParams.ip}
                onChange={(e) => setConnectionParams({...connectionParams, ip: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="192.168.1.100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Port</label>
              <input
                type="number"
                value={connectionParams.port}
                onChange={(e) => setConnectionParams({...connectionParams, port: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="31950"
              />
            </div>
          </div>
        );

      case "lab-experiment":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hypothesis</label>
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Describe your hypothesis..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Experiment Budget (wells)</label>
              <input
                type="number"
                value={experimentBudget}
                onChange={(e) => setExperimentBudget(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                min="24"
                max="384"
                step="24"
              />
            </div>
          </div>
        );

      case "blockchain-register":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Experiment Name</label>
              <input
                type="text"
                value={experimentName}
                onChange={(e) => setExperimentName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="My Drug Discovery Experiment"
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                This will create an immutable blockchain record with cryptographic hash verification.
              </p>
            </div>
          </div>
        );

      case "blockchain-verify":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Original Experiment ID</label>
              <input
                type="text"
                value={verifyExperimentId}
                onChange={(e) => setVerifyExperimentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="exp_1"
              />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Verify reproducibility by comparing with blockchain-recorded experiment.
              </p>
            </div>
          </div>
        );

      case "causal-validation":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target Gene</label>
              <input
                type="text"
                value={targetGene}
                onChange={(e) => setTargetGene(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., EGFR, KRAS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Omics Data (JSON)</label>
              <textarea
                value={JSON.stringify(omicsData, null, 2)}
                onChange={(e) => {
                  try {
                    setOmicsData(JSON.parse(e.target.value));
                  } catch {}
                }}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return <div>Unknown feature</div>;
    }
  };

  const getFeatureTitle = () => {
    const titles: Record<string, string> = {
      "rna-aptamer": "Design RNA Aptamer",
      "crispr-guide": "Design CRISPR Guide",
      "mrna-therapeutic": "Design mRNA Therapeutic",
      "lab-connect": "Connect Lab Equipment",
      "lab-experiment": "Design Autonomous Experiment",
      "blockchain-register": "Register Experiment on Blockchain",
      "blockchain-verify": "Verify Reproducibility",
      "causal-validation": "Causal Target Validation"
    };
    return titles[feature] || "Advanced Feature";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{getFeatureTitle()}</CardTitle>
              <CardDescription>Configure and run this advanced feature</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Form */}
          {renderForm()}

          {/* Run Button */}
          <Button 
            onClick={runFeature}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Run {getFeatureTitle()}
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Results
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(JSON.stringify(results, null, 2))}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>
              
              <AdvancedFeatureResults feature={feature} results={results} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
