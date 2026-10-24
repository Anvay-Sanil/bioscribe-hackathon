"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Download,
  Clock,
  Check,
  AlertCircle
} from "lucide-react";

const UNIFIED_API = "http://localhost:8000/api";

export function ProfessionalWorkflow() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [selectedProtein, setSelectedProtein] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const proteins = [
    {
      id: "hiv-protease",
      name: "HIV-1 Protease",
      sequence: "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
      organism: "HIV-1",
      length: 99
    },
    {
      id: "egfr",
      name: "EGFR Kinase",
      sequence: "FKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA",
      organism: "Human",
      length: 306
    },
    {
      id: "spike",
      name: "SARS-CoV-2 Spike RBD",
      sequence: "NITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNF",
      organism: "SARS-CoV-2",
      length: 194
    }
  ];

  const runPipeline = async () => {
    const protein = proteins.find(p => p.id === selectedProtein);
    if (!protein) {
      alert("Please select a target protein");
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
    } catch (error) {
      console.error('Error:', error);
      alert('Pipeline failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Drug Discovery Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure and execute discovery workflows</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Configuration Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Target Selection</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {proteins.map((protein) => (
                  <button
                    key={protein.id}
                    onClick={() => setSelectedProtein(protein.id)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedProtein === protein.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">{protein.name}</h3>
                      {selectedProtein === protein.id && (
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{protein.organism}</p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {protein.length} AA
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Est. 2-5 min</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    disabled={loading}
                    className="h-9 text-sm"
                  >
                    Save Config
                  </Button>
                  <Button
                    onClick={runPipeline}
                    disabled={loading || !selectedProtein}
                    className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Running
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-2" />
                        Run Pipeline
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-gray-500 mt-2">
                    {progress < 30 && "Analyzing protein structure..."}
                    {progress >= 30 && progress < 60 && "Generating candidates..."}
                    {progress >= 60 && progress < 90 && "Running docking simulations..."}
                    {progress >= 90 && "Finalizing results..."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          {results && !loading && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Candidates</p>
                  <p className="text-2xl font-semibold text-gray-900">{results.total_candidates || 0}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Best Affinity</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {results.best_candidate?.binding_affinity || 'N/A'}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Time</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {results.processing_time?.toFixed(1) || '0.0'}s
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Status</p>
                  <p className="text-2xl font-semibold text-green-600">Complete</p>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-white border border-gray-200 rounded-lg">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex px-6">
                    {['overview', 'candidates', 'analysis'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">Key Findings</h3>
                        <div className="space-y-2">
                          {results.results?.overall_executive_summary?.key_achievements?.map((item: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommendations</h4>
                          <ul className="space-y-2">
                            {results.results?.overall_executive_summary?.recommendations?.map((rec: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-gray-400">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Next Steps</h4>
                          <ol className="space-y-2">
                            {results.results?.overall_executive_summary?.next_steps?.slice(0, 5).map((step: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="font-medium text-gray-900">{idx + 1}.</span>
                                <span>{step.replace(/^\d+\.\s*/, '')}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'candidates' && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">SMILES</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Affinity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">MW</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">LogP</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {results.candidates?.slice(0, 10).map((candidate: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{candidate.id}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{candidate.smiles}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{candidate.binding_affinity}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{candidate.molecular_weight}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{candidate.logp}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                  candidate.drug_likeness > 0.8 ? "bg-green-100 text-green-700" :
                                  candidate.drug_likeness > 0.6 ? "bg-yellow-100 text-yellow-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {(candidate.drug_likeness * 100).toFixed(0)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'analysis' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Protein Properties</h4>
                        <dl className="space-y-2">
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-sm text-gray-600">Name</dt>
                            <dd className="text-sm font-medium text-gray-900">{results.protein_analysis?.name}</dd>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-sm text-gray-600">Organism</dt>
                            <dd className="text-sm font-medium text-gray-900">{results.protein_analysis?.organism}</dd>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="text-sm text-gray-600">Length</dt>
                            <dd className="text-sm font-medium text-gray-900">{results.protein_analysis?.length} AA</dd>
                          </div>
                          <div className="flex justify-between py-2">
                            <dt className="text-sm text-gray-600">Mol. Weight</dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {results.protein_analysis?.molecular_properties?.molecular_weight?.toFixed(2)} Da
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Binding Sites</h4>
                        <div className="space-y-2">
                          {results.protein_analysis?.binding_sites?.map((site: any, idx: number) => (
                            <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-900">Site {idx + 1}</span>
                                <span className="text-xs text-gray-600">Pos: {site.position}</span>
                              </div>
                              <p className="text-xs font-mono text-gray-600">{site.sequence}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
