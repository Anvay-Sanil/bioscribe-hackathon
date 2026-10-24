"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Download, 
  Share2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  Zap
} from "lucide-react";

const UNIFIED_API = "http://localhost:8000/api";

export function EnterpriseWorkflow() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [selectedProtein, setSelectedProtein] = useState("");

  const exampleProteins = [
    {
      id: "hiv-protease",
      name: "HIV-1 Protease",
      sequence: "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
      organism: "HIV-1",
      description: "Viral protease essential for HIV replication"
    },
    {
      id: "egfr-kinase",
      name: "EGFR Kinase Domain",
      sequence: "FKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA",
      organism: "Homo sapiens",
      description: "Receptor tyrosine kinase involved in cell growth"
    },
    {
      id: "spike-protein",
      name: "SARS-CoV-2 Spike Protein RBD",
      sequence: "NITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNF",
      organism: "SARS-CoV-2",
      description: "Receptor binding domain for viral entry"
    }
  ];

  const getCurrentProtein = () => {
    const protein = exampleProteins.find(p => p.id === selectedProtein);
    return protein || null;
  };

  const runCompletePipeline = async () => {
    const protein = getCurrentProtein();
    
    if (!protein) {
      alert("Please select a protein target");
      return;
    }

    setLoading(true);
    setProgress(0);
    setResults(null);

    try {
      setProgress(10);

      const response = await fetch(`${UNIFIED_API}/pipeline/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: protein.sequence,
          name: protein.name,
          organism: protein.organism,
          num_candidates: 20
        })
      });

      setProgress(50);

      if (response.ok) {
        const data = await response.json();
        setProgress(100);
        setResults(data);
      } else {
        throw new Error('Pipeline failed');
      }

    } catch (error: any) {
      console.error('Pipeline error:', error);
      alert('Pipeline execution failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Drug Discovery Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered end-to-end drug discovery workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      {/* Main Workflow Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Configure Pipeline</CardTitle>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Enterprise Edition</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Target Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Protein
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {exampleProteins.map((protein) => (
                  <button
                    key={protein.id}
                    onClick={() => setSelectedProtein(protein.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedProtein === protein.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900">{protein.name}</h3>
                      {selectedProtein === protein.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{protein.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{protein.organism}</Badge>
                      <Badge variant="outline" className="text-xs">{protein.sequence.length} AA</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Estimated time: 2-5 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  disabled={loading}
                  className="border-gray-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Config
                </Button>
                <Button
                  onClick={runCompletePipeline}
                  disabled={loading || !selectedProtein}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Pipeline
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {loading && (
              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pipeline Progress</span>
                  <span className="font-medium text-gray-900">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500">
                  {progress < 20 && "Initializing pipeline..."}
                  {progress >= 20 && progress < 40 && "Analyzing protein structure..."}
                  {progress >= 40 && progress < 60 && "Generating drug candidates..."}
                  {progress >= 60 && progress < 80 && "Performing molecular docking..."}
                  {progress >= 80 && progress < 100 && "Finalizing results..."}
                  {progress === 100 && "Complete!"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && !loading && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Pipeline Results</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Candidates</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {results.total_candidates || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Generated molecules</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Best Affinity</span>
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {results.best_candidate?.binding_affinity || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">kcal/mol</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Processing Time</span>
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {results.processing_time?.toFixed(1) || '0.0'}s
                </p>
                <p className="text-xs text-gray-500 mt-1">Total duration</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-semibold text-green-600">
                  Complete
                </p>
                <p className="text-xs text-gray-500 mt-1">All steps finished</p>
              </div>
            </div>

            {/* Detailed Results Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-gray-100 border-b border-gray-200">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
                <TabsTrigger value="candidates" className="data-[state=active]:bg-white">Top Candidates</TabsTrigger>
                <TabsTrigger value="analysis" className="data-[state=active]:bg-white">Protein Analysis</TabsTrigger>
                <TabsTrigger value="blockchain" className="data-[state=active]:bg-white">Blockchain</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    {results.results?.overall_executive_summary?.key_achievements?.map((achievement: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {results.results?.overall_executive_summary?.recommendations?.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Next Steps</h4>
                    <ol className="space-y-2 text-sm text-gray-700">
                      {results.results?.overall_executive_summary?.next_steps?.map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-semibold text-blue-600">{idx + 1}.</span>
                          <span>{step.replace(/^\d+\.\s*/, '')}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="candidates" className="mt-4">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SMILES</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Affinity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">MW</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">LogP</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Drug-likeness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.candidates?.slice(0, 10).map((candidate: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{candidate.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{candidate.smiles}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{candidate.binding_affinity}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{candidate.molecular_weight}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{candidate.logp}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="outline" className={
                              candidate.drug_likeness > 0.8 ? "bg-green-50 text-green-700 border-green-200" :
                              candidate.drug_likeness > 0.6 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            }>
                              {(candidate.drug_likeness * 100).toFixed(0)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Protein Analysis Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Protein Name</p>
                      <p className="font-medium text-gray-900">{results.protein_analysis?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Organism</p>
                      <p className="font-medium text-gray-900">{results.protein_analysis?.organism}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Sequence Length</p>
                      <p className="font-medium text-gray-900">{results.protein_analysis?.length} amino acids</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Molecular Weight</p>
                      <p className="font-medium text-gray-900">
                        {results.protein_analysis?.molecular_properties?.molecular_weight?.toFixed(2)} Da
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="blockchain" className="mt-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Blockchain Record</h3>
                  {results.results?.blockchain_summary?.blockchain_record ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Experiment ID</span>
                        <span className="font-mono text-gray-900">{results.results.blockchain_summary.blockchain_record.experiment_id}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Block Number</span>
                        <span className="font-mono text-gray-900">{results.results.blockchain_summary.blockchain_record.block_number}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Transaction Hash</span>
                        <span className="font-mono text-xs text-gray-900">{results.results.blockchain_summary.blockchain_record.transaction_hash}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Status</span>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Confirmed
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">Blockchain recording not available for this session.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
