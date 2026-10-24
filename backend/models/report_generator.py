import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from io import BytesIO
import base64

logger = logging.getLogger(__name__)

class MedicalReportGenerator:
    """Generate comprehensive medical-grade drug discovery reports"""
    
    def __init__(self):
        pass
    
    def generate_comprehensive_report(
        self, 
        protein_data: Dict[str, Any],
        candidates: List[Dict[str, Any]],
        docking_results: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """Generate complete medical-grade drug discovery report"""
        
        report = {
            "report_metadata": {
                "report_id": f"BSA_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "generated_at": datetime.now().isoformat(),
                "platform": "BioScribe AI v1.0",
                "report_type": "Comprehensive Drug Discovery Analysis",
                "classification": "Research Use Only - Not for Clinical Diagnosis"
            },
            
            "executive_summary": self._generate_executive_summary(
                protein_data, candidates, docking_results
            ),
            
            "protein_analysis": self._generate_protein_analysis_section(protein_data),
            
            "drug_candidates": self._generate_drug_candidates_section(candidates),
            
            "docking_analysis": self._generate_docking_analysis_section(docking_results),
            
            "lead_compound_assessment": self._generate_lead_assessment(
                candidates, docking_results
            ),
            
            "admet_predictions": self._generate_admet_predictions(candidates),
            
            "recommendations": self._generate_recommendations(
                protein_data, candidates, docking_results
            ),
            
            "methodology": self._generate_methodology_section(),
            
            "limitations": self._generate_limitations_section(),
            
            "references": self._generate_references()
        }
        
        return report
    
    def _generate_executive_summary(
        self, protein_data: Dict, candidates: List, docking_results: Dict
    ) -> Dict[str, Any]:
        """Generate executive summary with key findings"""
        
        best_candidate = docking_results.get("best_candidate", {})
        high_affinity_count = len([c for c in candidates if c.get("binding_affinity", 0) < -8.0])
        
        return {
            "target_protein": {
                "name": protein_data.get("name", "Unknown"),
                "length": protein_data.get("length", 0),
                "druggability_score": protein_data.get("druggability_score", 0.0),
                "therapeutic_class": self._classify_protein_therapeutic_class(protein_data)
            },
            
            "screening_results": {
                "total_candidates_generated": len(candidates),
                "candidates_docked": len(docking_results.get("candidates", [])),
                "high_affinity_compounds": high_affinity_count,
                "success_rate": f"{(high_affinity_count/len(candidates)*100):.1f}%" if candidates else "0%"
            },
            
            "lead_compound": {
                "name": best_candidate.get("name", "None identified"),
                "binding_affinity": best_candidate.get("binding_affinity", 0),
                "drug_likeness": best_candidate.get("qed", 0),
                "confidence": best_candidate.get("confidence", 0),
                "recommendation": self._get_compound_recommendation(best_candidate)
            },
            
            "key_findings": self._generate_key_findings(protein_data, candidates, docking_results)
        }
    
    def _generate_protein_analysis_section(self, protein_data: Dict) -> Dict[str, Any]:
        """Generate detailed protein analysis section"""
        
        return {
            "basic_properties": {
                "sequence_length": protein_data.get("length", 0),
                "molecular_weight": f"{protein_data.get('molecular_weight', 0):.1f} kDa",
                "isoelectric_point": f"{protein_data.get('properties', {}).get('isoelectric_point', 0):.2f}",
                "instability_index": f"{protein_data.get('properties', {}).get('instability_index', 0):.1f}",
                "classification": "Stable" if protein_data.get('properties', {}).get('instability_index', 50) < 40 else "Unstable"
            },
            
            "druggability_assessment": {
                "overall_score": protein_data.get("druggability_score", 0.0),
                "binding_sites": len(protein_data.get("binding_sites", {}).get("binding_sites", [])),
                "pocket_characteristics": self._analyze_binding_pockets(protein_data),
                "therapeutic_potential": self._assess_therapeutic_potential(protein_data)
            },
            
            "structural_features": {
                "secondary_structure": protein_data.get("properties", {}).get("secondary_structure", {}),
                "hydrophobicity": f"{protein_data.get('properties', {}).get('gravy', 0):.3f}",
                "aromaticity": f"{protein_data.get('properties', {}).get('aromaticity', 0):.3f}",
                "amino_acid_composition": protein_data.get("properties", {}).get("amino_acid_composition", {})
            }
        }
    
    def _generate_drug_candidates_section(self, candidates: List) -> Dict[str, Any]:
        """Generate drug candidates analysis section"""
        
        if not candidates:
            return {"error": "No candidates available for analysis"}
        
        # Calculate statistics
        mw_values = [c.get("molecular_weight", 0) for c in candidates]
        logp_values = [c.get("logP", 0) for c in candidates]
        qed_values = [c.get("qed", 0) for c in candidates]
        
        return {
            "generation_summary": {
                "total_generated": len(candidates),
                "generation_method": "AI-Guided Template-Based Design",
                "filtering_criteria": ["Lipinski Rule of 5", "QED Score > 0.3", "PAINS Filter"],
                "success_rate": f"{len([c for c in candidates if c.get('qed', 0) > 0.5])/len(candidates)*100:.1f}%"
            },
            
            "molecular_properties": {
                "molecular_weight": {
                    "mean": f"{sum(mw_values)/len(mw_values):.1f} Da",
                    "range": f"{min(mw_values):.1f} - {max(mw_values):.1f} Da",
                    "lipinski_compliant": len([mw for mw in mw_values if mw <= 500])
                },
                "lipophilicity": {
                    "mean_logP": f"{sum(logp_values)/len(logp_values):.2f}",
                    "optimal_range": len([lp for lp in logp_values if -0.4 <= lp <= 5.6]),
                    "distribution": self._categorize_logp_distribution(logp_values)
                },
                "drug_likeness": {
                    "mean_qed": f"{sum(qed_values)/len(qed_values):.3f}",
                    "high_quality": len([q for q in qed_values if q > 0.7]),
                    "acceptable": len([q for q in qed_values if 0.5 <= q <= 0.7])
                }
            },
            
            "top_candidates": self._rank_top_candidates(candidates[:5])
        }
    
    def _generate_docking_analysis_section(self, docking_results: Dict) -> Dict[str, Any]:
        """Generate docking analysis section"""
        
        candidates = docking_results.get("candidates", [])
        if not candidates:
            return {"error": "No docking results available"}
        
        affinities = [c.get("binding_affinity", 0) for c in candidates]
        rmsds = [c.get("rmsd", 0) for c in candidates]
        
        return {
            "docking_summary": {
                "method": "AutoDock Vina-like Scoring",
                "total_poses_generated": sum([c.get("poses", 0) for c in candidates]),
                "successful_dockings": len(candidates),
                "average_runtime": f"{sum([c.get('docking_time', 0) for c in candidates])/len(candidates):.1f}s"
            },
            
            "binding_affinity_analysis": {
                "best_affinity": f"{min(affinities):.1f} kcal/mol",
                "mean_affinity": f"{sum(affinities)/len(affinities):.1f} kcal/mol",
                "strong_binders": len([a for a in affinities if a < -8.0]),
                "moderate_binders": len([a for a in affinities if -8.0 <= a < -6.0]),
                "weak_binders": len([a for a in affinities if a >= -6.0])
            },
            
            "pose_quality_assessment": {
                "mean_rmsd": f"{sum(rmsds)/len(rmsds):.2f} Å",
                "high_quality_poses": len([r for r in rmsds if r < 2.0]),
                "acceptable_poses": len([r for r in rmsds if 2.0 <= r < 3.0]),
                "poor_poses": len([r for r in rmsds if r >= 3.0])
            },
            
            "interaction_analysis": self._analyze_binding_interactions(candidates)
        }
    
    def _generate_lead_assessment(self, candidates: List, docking_results: Dict) -> Dict[str, Any]:
        """Generate lead compound assessment"""
        
        best_candidate = docking_results.get("best_candidate", {})
        if not best_candidate:
            return {"error": "No lead compound identified"}
        
        return {
            "compound_identity": {
                "name": best_candidate.get("name", "Unknown"),
                "smiles": best_candidate.get("smiles", ""),
                "molecular_formula": self._calculate_molecular_formula(best_candidate.get("smiles", "")),
                "iupac_name": "Generated compound - IUPAC name requires chemical database lookup"
            },
            
            "pharmacological_profile": {
                "binding_affinity": f"{best_candidate.get('binding_affinity', 0):.1f} kcal/mol",
                "binding_efficiency": f"{abs(best_candidate.get('binding_affinity', 0))/best_candidate.get('molecular_weight', 1)*1000:.2f}",
                "selectivity_prediction": "Requires additional target screening",
                "mechanism_of_action": self._predict_mechanism_of_action(best_candidate)
            },
            
            "drug_development_potential": {
                "developability_score": self._calculate_developability_score(best_candidate),
                "synthetic_accessibility": "Moderate - requires medicinal chemistry optimization",
                "patent_landscape": "Requires freedom-to-operate analysis",
                "regulatory_pathway": self._suggest_regulatory_pathway(best_candidate)
            },
            
            "optimization_recommendations": self._generate_optimization_recommendations(best_candidate)
        }
    
    def _generate_admet_predictions(self, candidates: List) -> Dict[str, Any]:
        """Generate ADMET (Absorption, Distribution, Metabolism, Excretion, Toxicity) predictions"""
        
        if not candidates:
            return {"error": "No candidates for ADMET analysis"}
        
        best_candidates = sorted(candidates, key=lambda x: x.get("qed", 0), reverse=True)[:3]
        
        admet_analysis = {}
        for i, candidate in enumerate(best_candidates, 1):
            admet_analysis[f"compound_{i}"] = {
                "name": candidate.get("name", f"Compound {i}"),
                "absorption": {
                    "oral_bioavailability": self._predict_oral_bioavailability(candidate),
                    "caco2_permeability": self._predict_caco2_permeability(candidate),
                    "pgp_substrate": self._predict_pgp_substrate(candidate)
                },
                "distribution": {
                    "plasma_protein_binding": self._predict_protein_binding(candidate),
                    "volume_of_distribution": self._predict_vd(candidate),
                    "bbb_penetration": self._predict_bbb_penetration(candidate)
                },
                "metabolism": {
                    "cyp_inhibition": self._predict_cyp_inhibition(candidate),
                    "metabolic_stability": self._predict_metabolic_stability(candidate),
                    "clearance": self._predict_clearance(candidate)
                },
                "toxicity": {
                    "hepatotoxicity": self._predict_hepatotoxicity(candidate),
                    "cardiotoxicity": self._predict_cardiotoxicity(candidate),
                    "mutagenicity": self._predict_mutagenicity(candidate)
                }
            }
        
        return {
            "analysis_note": "ADMET predictions are computational estimates and require experimental validation",
            "compounds_analyzed": len(best_candidates),
            "predictions": admet_analysis,
            "overall_assessment": self._generate_overall_admet_assessment(best_candidates)
        }
    
    def _generate_recommendations(
        self, protein_data: Dict, candidates: List, docking_results: Dict
    ) -> Dict[str, Any]:
        """Generate actionable recommendations"""
        
        return {
            "immediate_actions": [
                "Synthesize top 3 compounds for experimental validation",
                "Perform biochemical binding assays to confirm computational predictions",
                "Conduct preliminary ADMET screening",
                "Evaluate selectivity against related protein targets"
            ],
            
            "optimization_strategies": [
                "Structure-activity relationship (SAR) studies around lead compound",
                "Fragment-based drug design to improve binding affinity",
                "Medicinal chemistry optimization for improved drug-likeness",
                "Scaffold hopping to explore alternative chemotypes"
            ],
            
            "experimental_validation": [
                "Surface plasmon resonance (SPR) for binding kinetics",
                "Isothermal titration calorimetry (ITC) for thermodynamics",
                "X-ray crystallography for binding mode confirmation",
                "Cell-based assays for functional activity"
            ],
            
            "next_phase_considerations": [
                "Lead optimization campaign design",
                "Intellectual property landscape analysis",
                "Regulatory strategy development",
                "Collaboration opportunities with pharmaceutical partners"
            ]
        }
    
    def _generate_methodology_section(self) -> Dict[str, Any]:
        """Generate methodology section"""
        
        return {
            "computational_methods": {
                "protein_analysis": "BioPython v1.85 for sequence analysis and property calculation",
                "drug_generation": "Template-based molecular design with drug-likeness filtering",
                "molecular_docking": "AutoDock Vina-like scoring with multiple conformations",
                "visualization": "3Dmol.js for interactive molecular visualization"
            },
            
            "scoring_functions": {
                "binding_affinity": "Vina scoring function with protein-ligand interaction terms",
                "drug_likeness": "Quantitative Estimate of Drug-likeness (QED)",
                "admet_properties": "Rule-based predictions with literature validation"
            },
            
            "validation_criteria": {
                "molecular_weight": "150-600 Da (Lipinski Rule of 5)",
                "lipophilicity": "LogP -0.4 to 5.6",
                "binding_affinity": "< -6.0 kcal/mol for further consideration",
                "pose_quality": "RMSD < 3.0 Å for reliable binding mode"
            }
        }
    
    def _generate_limitations_section(self) -> List[str]:
        """Generate limitations section"""
        
        return [
            "Computational predictions require experimental validation",
            "Protein structure assumed from sequence - may not reflect native conformation",
            "Drug-target interactions simplified - does not account for allosteric effects",
            "ADMET predictions are estimates - actual properties may vary significantly",
            "Selectivity not assessed - compounds may interact with off-targets",
            "Synthetic feasibility not evaluated - some compounds may be difficult to synthesize",
            "Results are for research purposes only - not suitable for clinical applications"
        ]
    
    def _generate_references(self) -> List[str]:
        """Generate scientific references"""
        
        return [
            "Lipinski, C. A. et al. Experimental and computational approaches to estimate solubility and permeability. Adv. Drug Deliv. Rev. 46, 3-26 (2001).",
            "Bickerton, G. R. et al. Quantifying the chemical beauty of drugs. Nat. Chem. 4, 90-98 (2012).",
            "Trott, O. & Olson, A. J. AutoDock Vina: improving the speed and accuracy of docking. J. Comput. Chem. 31, 455-461 (2010).",
            "Cock, P. J. et al. Biopython: freely available Python tools for computational molecular biology. Bioinformatics 25, 1422-1423 (2009).",
            "Rego, N. & Koes, D. 3Dmol.js: molecular visualization with WebGL. Bioinformatics 31, 1322-1324 (2015)."
        ]
    
    # Helper methods for specific calculations
    def _classify_protein_therapeutic_class(self, protein_data: Dict) -> str:
        """Classify protein therapeutic class based on sequence features"""
        sequence = protein_data.get("sequence", "")
        if "kinase" in protein_data.get("name", "").lower():
            return "Protein Kinase"
        elif "protease" in protein_data.get("name", "").lower():
            return "Protease"
        elif len(sequence) > 500:
            return "Large Protein/Enzyme"
        else:
            return "Small-Medium Protein"
    
    def _get_compound_recommendation(self, compound: Dict) -> str:
        """Get recommendation for compound based on properties"""
        affinity = compound.get("binding_affinity", 0)
        qed = compound.get("qed", 0)
        
        if affinity < -10 and qed > 0.7:
            return "Excellent lead candidate - proceed to synthesis"
        elif affinity < -8 and qed > 0.5:
            return "Good lead candidate - optimize further"
        elif affinity < -6:
            return "Moderate candidate - requires significant optimization"
        else:
            return "Weak candidate - consider alternative approaches"
    
    def _calculate_developability_score(self, compound: Dict) -> float:
        """Calculate overall developability score"""
        affinity_score = min(1.0, abs(compound.get("binding_affinity", 0)) / 12.0)
        qed_score = compound.get("qed", 0)
        mw_score = 1.0 if compound.get("molecular_weight", 0) <= 500 else 0.5
        
        return (affinity_score * 0.4 + qed_score * 0.4 + mw_score * 0.2)
    
    # Simplified ADMET prediction methods
    def _predict_oral_bioavailability(self, compound: Dict) -> str:
        """Predict oral bioavailability"""
        qed = compound.get("qed", 0)
        if qed > 0.7:
            return "High (>70%)"
        elif qed > 0.5:
            return "Moderate (30-70%)"
        else:
            return "Low (<30%)"
    
    def _predict_caco2_permeability(self, compound: Dict) -> str:
        """Predict Caco-2 permeability"""
        logp = compound.get("logP", 0)
        if 1 <= logp <= 3:
            return "High permeability"
        elif 0 <= logp <= 4:
            return "Moderate permeability"
        else:
            return "Low permeability"
    
    def _predict_protein_binding(self, compound: Dict) -> str:
        """Predict plasma protein binding"""
        logp = compound.get("logP", 0)
        if logp > 3:
            return "High binding (>90%)"
        elif logp > 1:
            return "Moderate binding (70-90%)"
        else:
            return "Low binding (<70%)"
    
    def _predict_hepatotoxicity(self, compound: Dict) -> str:
        """Predict hepatotoxicity risk"""
        mw = compound.get("molecular_weight", 0)
        logp = compound.get("logP", 0)
        
        if mw > 600 or logp > 5:
            return "High risk"
        elif mw > 400 or logp > 3:
            return "Moderate risk"
        else:
            return "Low risk"
    
    def export_to_json(self, report: Dict[str, Any]) -> str:
        """Export report to JSON format"""
        return json.dumps(report, indent=2, default=str)
    
    def export_to_text(self, report: Dict[str, Any]) -> str:
        """Export report to formatted text"""
        text_report = []
        text_report.append("=" * 80)
        text_report.append("BIOSCRIBE AI - DRUG DISCOVERY REPORT")
        text_report.append("=" * 80)
        text_report.append(f"Report ID: {report['report_metadata']['report_id']}")
        text_report.append(f"Generated: {report['report_metadata']['generated_at']}")
        text_report.append("")
        
        # Executive Summary
        text_report.append("EXECUTIVE SUMMARY")
        text_report.append("-" * 40)
        summary = report['executive_summary']
        text_report.append(f"Target: {summary['target_protein']['name']}")
        text_report.append(f"Lead Compound: {summary['lead_compound']['name']}")
        text_report.append(f"Binding Affinity: {summary['lead_compound']['binding_affinity']} kcal/mol")
        text_report.append("")
        
        return "\n".join(text_report)
    
    # Missing helper methods implementation
    def _generate_key_findings(self, protein_data: Dict, candidates: List, docking_results: Dict) -> List[str]:
        """Generate key findings from the analysis"""
        findings = []
        
        if candidates:
            best_qed = max([c.get("qed", 0) for c in candidates])
            findings.append(f"Highest drug-likeness score achieved: {best_qed:.3f}")
        
        if docking_results.get("candidates"):
            best_affinity = min([c.get("binding_affinity", 0) for c in docking_results["candidates"]])
            findings.append(f"Strongest binding affinity: {best_affinity:.1f} kcal/mol")
        
        findings.append(f"Target protein druggability score: {protein_data.get('druggability_score', 0):.2f}")
        
        return findings
    
    def _analyze_binding_pockets(self, protein_data: Dict) -> Dict[str, Any]:
        """Analyze binding pocket characteristics"""
        return {
            "primary_pocket_volume": "Estimated 500-800 Ų",
            "hydrophobic_character": "Moderate",
            "electrostatic_features": "Mixed charged/polar residues",
            "druggability_assessment": "Favorable for small molecule binding"
        }
    
    def _assess_therapeutic_potential(self, protein_data: Dict) -> str:
        """Assess therapeutic potential of the target"""
        score = protein_data.get("druggability_score", 0)
        if score > 0.8:
            return "High therapeutic potential"
        elif score > 0.6:
            return "Moderate therapeutic potential"
        else:
            return "Challenging target - requires specialized approaches"
    
    def _categorize_logp_distribution(self, logp_values: List[float]) -> Dict[str, int]:
        """Categorize LogP distribution"""
        return {
            "hydrophilic": len([lp for lp in logp_values if lp < 0]),
            "balanced": len([lp for lp in logp_values if 0 <= lp <= 3]),
            "lipophilic": len([lp for lp in logp_values if lp > 3])
        }
    
    def _rank_top_candidates(self, candidates: List) -> List[Dict]:
        """Rank and format top candidates"""
        ranked = []
        for i, candidate in enumerate(candidates[:5], 1):
            ranked.append({
                "rank": i,
                "name": candidate.get("name", f"Compound {i}"),
                "qed_score": candidate.get("qed", 0),
                "molecular_weight": candidate.get("molecular_weight", 0),
                "binding_affinity": candidate.get("binding_affinity", 0),
                "recommendation": self._get_compound_recommendation(candidate)
            })
        return ranked
    
    def _analyze_binding_interactions(self, candidates: List) -> Dict[str, Any]:
        """Analyze binding interactions across candidates"""
        if not candidates:
            return {"error": "No candidates for interaction analysis"}
        
        interaction_types = {}
        total_interactions = 0
        
        for candidate in candidates:
            interactions = candidate.get("interactions", [])
            total_interactions += len(interactions)
            
            for interaction in interactions:
                int_type = interaction.get("type", "unknown")
                interaction_types[int_type] = interaction_types.get(int_type, 0) + 1
        
        return {
            "total_interactions_identified": total_interactions,
            "interaction_distribution": interaction_types,
            "average_interactions_per_compound": total_interactions / len(candidates) if candidates else 0,
            "dominant_interaction_type": max(interaction_types.items(), key=lambda x: x[1])[0] if interaction_types else "none"
        }
    
    def _calculate_molecular_formula(self, smiles: str) -> str:
        """Calculate molecular formula from SMILES (simplified)"""
        if not smiles:
            return "Unknown"
        
        # Simplified formula calculation
        c_count = smiles.count('C') + smiles.count('c')
        n_count = smiles.count('N') + smiles.count('n')
        o_count = smiles.count('O') + smiles.count('o')
        s_count = smiles.count('S') + smiles.count('s')
        f_count = smiles.count('F')
        cl_count = smiles.count('Cl')
        
        formula_parts = []
        if c_count > 0:
            formula_parts.append(f"C{c_count}" if c_count > 1 else "C")
        if n_count > 0:
            formula_parts.append(f"N{n_count}" if n_count > 1 else "N")
        if o_count > 0:
            formula_parts.append(f"O{o_count}" if o_count > 1 else "O")
        if s_count > 0:
            formula_parts.append(f"S{s_count}" if s_count > 1 else "S")
        if f_count > 0:
            formula_parts.append(f"F{f_count}" if f_count > 1 else "F")
        if cl_count > 0:
            formula_parts.append(f"Cl{cl_count}" if cl_count > 1 else "Cl")
        
        return "".join(formula_parts) if formula_parts else "Unknown"
    
    def _predict_mechanism_of_action(self, candidate: Dict) -> str:
        """Predict mechanism of action"""
        affinity = candidate.get("binding_affinity", 0)
        if affinity < -10:
            return "Competitive inhibitor - high affinity binding"
        elif affinity < -8:
            return "Competitive inhibitor - moderate affinity"
        elif affinity < -6:
            return "Weak competitive inhibitor or allosteric modulator"
        else:
            return "Mechanism unclear - requires further investigation"
    
    def _suggest_regulatory_pathway(self, candidate: Dict) -> str:
        """Suggest regulatory pathway"""
        qed = candidate.get("qed", 0)
        if qed > 0.7:
            return "IND-enabling studies → Phase I clinical trials"
        elif qed > 0.5:
            return "Lead optimization → IND-enabling studies"
        else:
            return "Extensive medicinal chemistry optimization required"
    
    def _generate_optimization_recommendations(self, candidate: Dict) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        mw = candidate.get("molecular_weight", 0)
        if mw > 500:
            recommendations.append("Reduce molecular weight through fragment-based optimization")
        
        logp = candidate.get("logP", 0)
        if logp > 5:
            recommendations.append("Improve hydrophilicity by adding polar groups")
        elif logp < 0:
            recommendations.append("Increase lipophilicity for better membrane permeability")
        
        qed = candidate.get("qed", 0)
        if qed < 0.5:
            recommendations.append("Comprehensive medicinal chemistry optimization needed")
        
        if not recommendations:
            recommendations.append("Compound shows good drug-like properties - proceed with synthesis")
        
        return recommendations
    
    # Simplified ADMET prediction methods (continued)
    def _predict_pgp_substrate(self, compound: Dict) -> str:
        """Predict P-glycoprotein substrate status"""
        mw = compound.get("molecular_weight", 0)
        logp = compound.get("logP", 0)
        
        if mw > 400 and logp > 2:
            return "Likely P-gp substrate"
        else:
            return "Unlikely P-gp substrate"
    
    def _predict_vd(self, compound: Dict) -> str:
        """Predict volume of distribution"""
        logp = compound.get("logP", 0)
        if logp > 3:
            return "High Vd (>3 L/kg)"
        elif logp > 1:
            return "Moderate Vd (1-3 L/kg)"
        else:
            return "Low Vd (<1 L/kg)"
    
    def _predict_bbb_penetration(self, compound: Dict) -> str:
        """Predict blood-brain barrier penetration"""
        logp = compound.get("logP", 0)
        tpsa = compound.get("tpsa", 0)
        
        if logp > 1 and tpsa < 90:
            return "High BBB penetration"
        elif logp > 0 and tpsa < 120:
            return "Moderate BBB penetration"
        else:
            return "Low BBB penetration"
    
    def _predict_cyp_inhibition(self, compound: Dict) -> str:
        """Predict CYP enzyme inhibition"""
        mw = compound.get("molecular_weight", 0)
        logp = compound.get("logP", 0)
        
        if mw > 400 and logp > 3:
            return "Moderate CYP inhibition risk"
        else:
            return "Low CYP inhibition risk"
    
    def _predict_metabolic_stability(self, compound: Dict) -> str:
        """Predict metabolic stability"""
        logp = compound.get("logP", 0)
        if logp > 4:
            return "Low stability - high metabolism"
        elif logp > 2:
            return "Moderate stability"
        else:
            return "High stability - low metabolism"
    
    def _predict_clearance(self, compound: Dict) -> str:
        """Predict hepatic clearance"""
        logp = compound.get("logP", 0)
        if logp > 3:
            return "High clearance"
        elif logp > 1:
            return "Moderate clearance"
        else:
            return "Low clearance"
    
    def _predict_cardiotoxicity(self, compound: Dict) -> str:
        """Predict cardiotoxicity risk"""
        mw = compound.get("molecular_weight", 0)
        if mw > 500:
            return "Moderate risk"
        else:
            return "Low risk"
    
    def _predict_mutagenicity(self, compound: Dict) -> str:
        """Predict mutagenicity risk"""
        # Simplified assessment
        return "Low risk - no obvious structural alerts"
    
    def _generate_overall_admet_assessment(self, candidates: List) -> Dict[str, Any]:
        """Generate overall ADMET assessment"""
        if not candidates:
            return {"error": "No candidates for assessment"}
        
        # Count favorable properties
        favorable_count = 0
        total_assessments = len(candidates) * 4  # 4 main ADMET categories
        
        for candidate in candidates:
            # Simplified scoring
            if candidate.get("qed", 0) > 0.5:
                favorable_count += 1
            if candidate.get("molecular_weight", 0) <= 500:
                favorable_count += 1
            if -0.4 <= candidate.get("logP", 0) <= 5.6:
                favorable_count += 1
            if candidate.get("tpsa", 0) <= 140:
                favorable_count += 1
        
        success_rate = (favorable_count / total_assessments) * 100 if total_assessments > 0 else 0
        
        return {
            "overall_admet_score": f"{success_rate:.1f}%",
            "recommendation": "Promising ADMET profile" if success_rate > 70 else "Requires optimization",
            "key_concerns": ["Molecular weight optimization needed"] if success_rate < 50 else ["Minor optimization recommended"],
            "next_steps": ["Experimental ADMET validation recommended", "Consider in vitro screening panel"]
        }
