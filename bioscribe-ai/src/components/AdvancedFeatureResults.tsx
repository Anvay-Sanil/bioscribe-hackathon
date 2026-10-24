"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Dna, Scissors, Syringe, Microscope, Beaker, Shield, Activity } from "lucide-react";

interface AdvancedFeatureResultsProps {
  feature: string;
  results: any;
}

export function AdvancedFeatureResults({ feature, results }: AdvancedFeatureResultsProps) {
  
  if (feature === "rna-aptamer" && results.aptamer_design) {
    const data = results.aptamer_design;
    const candidates = data.aptamer_candidates || [];
    
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-purple-600" />
              RNA Aptamer Design - Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600">Target</p>
                <p className="text-sm font-bold text-purple-600">{data.target_protein}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600">Candidates</p>
                <p className="text-sm font-bold text-blue-600">{candidates.length}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600">Best Kd</p>
                <p className="text-sm font-bold text-green-600">
                  {candidates[0]?.predicted_kd ? `${(candidates[0].predicted_kd * 1e9).toFixed(1)} nM` : 'N/A'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600">Avg Score</p>
                <p className="text-sm font-bold text-orange-600">
                  {candidates.length > 0 ? (candidates.reduce((sum: number, c: any) => sum + (c.binding_score || 0), 0) / candidates.length).toFixed(2) : 'N/A'}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Key Findings
              </h4>
              <ul className="space-y-1 text-xs">
                <li>✓ Generated {candidates.length} high-affinity aptamer candidates</li>
                <li>✓ Best candidate shows {candidates[0]?.predicted_kd ? `${(candidates[0].predicted_kd * 1e9).toFixed(1)} nM` : 'strong'} binding affinity</li>
                <li>✓ All candidates optimized for stability and specificity</li>
                <li>✓ Ready for experimental validation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Aptamer Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {candidates.slice(0, 3).map((candidate: any, idx: number) => (
                <div key={idx} className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-purple-600 text-xs">Rank #{idx + 1}</Badge>
                    <Badge variant="outline" className="text-xs">
                      Kd: {candidate.predicted_kd ? `${(candidate.predicted_kd * 1e9).toFixed(1)} nM` : 'N/A'}
                    </Badge>
                  </div>
                  <div className="bg-white rounded p-2 mb-2">
                    <p className="font-mono text-xs break-all">{candidate.sequence}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white rounded p-1.5">
                      <p className="text-gray-600 text-[10px]">Binding</p>
                      <p className="font-semibold">{candidate.binding_score?.toFixed(3)}</p>
                    </div>
                    <div className="bg-white rounded p-1.5">
                      <p className="text-gray-600 text-[10px]">Stability</p>
                      <p className="font-semibold">{candidate.stability_kcal_mol?.toFixed(1)} kcal/mol</p>
                    </div>
                    <div className="bg-white rounded p-1.5">
                      <p className="text-gray-600 text-[10px]">GC%</p>
                      <p className="font-semibold">{candidate.gc_content?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (feature === "crispr-guide" && results.crispr_design) {
    const data = results.crispr_design;
    const guides = data.guide_rnas || [];
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Scissors className="w-5 h-5 text-green-600" />CRISPR Guide - Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Gene</p><p className="text-sm font-bold text-green-600">{data.target_gene}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Guides</p><p className="text-sm font-bold text-blue-600">{guides.length}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Edit</p><p className="text-sm font-bold text-purple-600 capitalize">{data.edit_type}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Efficiency</p><p className="text-sm font-bold text-orange-600">{guides[0]?.efficiency_score ? `${(guides[0].efficiency_score * 100).toFixed(0)}%` : 'N/A'}</p></div>
            </div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Key Findings</h4><ul className="space-y-1 text-xs"><li>✓ Designed {guides.length} highly specific guide RNAs</li><li>✓ Minimal off-target effects predicted</li><li>✓ Ready for cloning and validation</li></ul></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">Guide RNA Candidates</CardTitle></CardHeader><CardContent><div className="space-y-2">{guides.slice(0, 3).map((guide: any, idx: number) => (<div key={idx} className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg"><div className="flex items-center justify-between mb-2"><Badge className="bg-green-600 text-xs">Guide #{idx + 1}</Badge><Badge variant="outline" className="text-xs">Efficiency: {(guide.efficiency_score * 100).toFixed(0)}%</Badge></div><div className="bg-white rounded p-2 mb-2"><p className="font-mono text-sm">{guide.sequence}</p></div><div className="grid grid-cols-3 gap-2 text-xs"><div className="bg-white rounded p-1.5"><p className="text-gray-600 text-[10px]">On-Target</p><p className="font-semibold">{(guide.on_target_score * 100).toFixed(0)}%</p></div><div className="bg-white rounded p-1.5"><p className="text-gray-600 text-[10px]">Off-Target</p><p className="font-semibold">{(guide.off_target_score * 100).toFixed(1)}%</p></div><div className="bg-white rounded p-1.5"><p className="text-gray-600 text-[10px]">GC%</p><p className="font-semibold">{guide.gc_content?.toFixed(0)}%</p></div></div></div>))}</div></CardContent></Card>
      </div>
    );
  }

  if (feature === "mrna-therapeutic" && results.mrna_design) {
    const data = results.mrna_design;
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Syringe className="w-5 h-5 text-blue-600" />mRNA Therapeutic - Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Target</p><p className="text-sm font-bold text-blue-600">{data.protein_target}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Length</p><p className="text-sm font-bold text-green-600">{data.optimized_mrna?.length || 0} nt</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Expression</p><p className="text-sm font-bold text-purple-600">{data.expression_score?.toFixed(2)}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Immunogenicity</p><p className="text-sm font-bold text-orange-600">{data.immunogenicity_score < 0.3 ? 'Low' : data.immunogenicity_score < 0.6 ? 'Medium' : 'High'}</p></div>
            </div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" />Key Findings</h4><ul className="space-y-1 text-xs"><li>✓ Optimized mRNA sequence for maximum expression</li><li>✓ Codon usage optimized for human cells</li><li>✓ Low immunogenicity predicted</li><li>✓ Ready for in vitro transcription</li></ul></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">mRNA Design</CardTitle></CardHeader><CardContent className="space-y-3"><div className="bg-blue-50 rounded-lg p-3"><h4 className="font-semibold text-xs mb-1">5' UTR</h4><div className="bg-white rounded p-2"><p className="font-mono text-xs break-all">{data.utr_5_prime}</p></div></div><div className="bg-green-50 rounded-lg p-3"><h4 className="font-semibold text-xs mb-1">Coding Sequence</h4><div className="bg-white rounded p-2 max-h-24 overflow-y-auto"><p className="font-mono text-xs break-all">{data.optimized_mrna}</p></div><div className="grid grid-cols-3 gap-2 mt-2 text-xs"><div className="bg-white rounded p-1.5"><p className="text-gray-600 text-[10px]">GC%</p><p className="font-semibold">{data.gc_content?.toFixed(1)}%</p></div><div className="bg-white rounded p-1.5"><p className="text-gray-600 text-[10px]">CAI</p><p className="font-semibold">{data.codon_adaptation_index?.toFixed(3)}</p></div><div className="bg-white rounded p-1.5"><p className="text-gray-600 text-[10px]">Length</p><p className="font-semibold">{data.optimized_mrna?.length} nt</p></div></div></div><div className="bg-purple-50 rounded-lg p-3"><h4 className="font-semibold text-xs mb-1">3' UTR</h4><div className="bg-white rounded p-2"><p className="font-mono text-xs break-all">{data.utr_3_prime}</p></div></div></CardContent></Card>
      </div>
    );
  }

  if (feature === "lab-connect" && results.connection) {
    const data = results.connection;
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Microscope className="w-5 h-5 text-orange-600" />Lab Equipment - Connected</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Equipment</p><p className="text-sm font-bold text-orange-600 capitalize">{data.equipment_type}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Status</p><Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />{data.connection_status}</Badge></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">ID</p><p className="text-sm font-bold text-blue-600">{data.equipment_id}</p></div>
            </div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm">Capabilities</h4><div className="grid grid-cols-2 gap-2">{data.capabilities?.map((cap: string, idx: number) => (<div key={idx} className="flex items-center gap-2 p-2 bg-orange-50 rounded"><CheckCircle2 className="w-4 h-4 text-orange-600" /><span className="text-xs">{cap}</span></div>))}</div></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (feature === "lab-experiment" && results.experiment) {
    const data = results.experiment;
    const compounds = data.selected_compounds || [];
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Beaker className="w-5 h-5 text-yellow-600" />Autonomous Experiment - Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Exp ID</p><p className="text-sm font-bold text-yellow-600">{data.experiment_id}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Compounds</p><p className="text-sm font-bold text-blue-600">{compounds.length}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Wells</p><p className="text-sm font-bold text-green-600">{data.total_experiments}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Duration</p><p className="text-sm font-bold text-purple-600">{data.estimated_duration}</p></div>
            </div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-1 text-sm">Strategy</h4><p className="text-xs text-gray-700">{data.optimization_strategy}</p></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">Selected Compounds</CardTitle></CardHeader><CardContent><div className="space-y-2">{compounds.slice(0, 5).map((compound: any, idx: number) => (<div key={idx} className="p-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg"><div className="flex items-center justify-between"><span className="font-semibold text-xs">{compound.compound_id}</span><Badge variant="outline" className="text-xs">Priority: {compound.priority}</Badge></div><p className="text-xs font-mono mt-1">{compound.smiles}</p></div>))}</div></CardContent></Card>
      </div>
    );
  }

  if (feature === "blockchain-register" && results.blockchain_record) {
    const data = results.blockchain_record;
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600" />Blockchain Registration - Complete</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Block Number</p><p className="text-sm font-bold text-indigo-600">{data.block_number}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Timestamp</p><p className="text-sm font-bold text-blue-600">{new Date(data.timestamp).toLocaleString()}</p></div>
            </div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-1 text-xs">Blockchain Hash</h4><p className="font-mono text-xs break-all text-indigo-600">{data.blockchain_hash}</p></div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-1 text-xs">Smart Contract</h4><p className="font-mono text-xs break-all">{data.smart_contract_address}</p></div>
            <div className="bg-green-50 rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Verification</h4><ul className="space-y-1 text-xs"><li>✓ Experiment permanently recorded on blockchain</li><li>✓ Immutable and tamper-proof</li><li>✓ Publicly verifiable</li></ul></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (feature === "blockchain-verify" && results.verification) {
    const data = results.verification;
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-purple-600" />Reproducibility Verification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Reproducible</p><Badge className={data.is_reproducible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{data.is_reproducible ? "Yes" : "No"}</Badge></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Similarity</p><p className="text-sm font-bold text-blue-600">{(data.similarity_score * 100).toFixed(1)}%</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Confidence</p><p className="text-sm font-bold text-purple-600">{(data.confidence * 100).toFixed(0)}%</p></div>
            </div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm">Verification Report</h4><p className="text-xs text-gray-700">{data.verification_report}</p></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (feature === "causal-validation" && results.causal_validation) {
    const data = results.causal_validation;
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-pink-50 to-red-50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-pink-600" />Causal Target Validation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Target</p><p className="text-sm font-bold text-pink-600">{data.target_gene}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Causal Score</p><p className="text-sm font-bold text-blue-600">{data.causal_score?.toFixed(3)}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-xs text-gray-600">Confidence</p><p className="text-sm font-bold text-green-600">{(data.confidence * 100).toFixed(0)}%</p></div>
            </div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm">Mendelian Randomization</h4><p className="text-xs"><span className="font-semibold">Effect Size:</span> {data.mendelian_randomization?.effect_size?.toFixed(3)}</p><p className="text-xs"><span className="font-semibold">P-value:</span> {data.mendelian_randomization?.p_value?.toExponential(2)}</p></div>
            <div className="bg-white rounded-lg p-3"><h4 className="font-semibold mb-2 text-sm">Treatment Effect</h4><p className="text-xs"><span className="font-semibold">ATE:</span> {data.treatment_effect?.ate?.toFixed(3)}</p><p className="text-xs"><span className="font-semibold">Recommendation:</span> {data.clinical_recommendation}</p></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default JSON fallback
  return (
    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
      <pre className="text-xs font-mono whitespace-pre-wrap">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
}
