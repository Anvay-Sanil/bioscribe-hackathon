import random
import logging
import asyncio
import numpy as np
from typing import Dict, Any, Optional, List
from rdkit import Chem
from rdkit.Chem import Descriptors
import math

logger = logging.getLogger(__name__)

class DockingSimulator:
    """Molecular docking simulation using AutoDock Vina-like scoring"""
    
    def __init__(self):
        self.vina_available = False  # Set to True if AutoDock Vina is installed
        self.scoring_functions = {
            "vina": self.vina_like_scoring,
            "glide": self.glide_like_scoring,
            "gold": self.gold_like_scoring
        }
        
    def calculate_binding_affinity(
        self, 
        smiles: str, 
        protein_sequence: str,
        method: str = "vina"
    ) -> Dict[str, float]:
        """Calculate binding affinity using various scoring functions"""
        
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return {"error": "Invalid SMILES"}
            
            # Get molecular properties
            mw = Descriptors.MolWt(mol)
            logp = Descriptors.MolLogP(mol)
            tpsa = Descriptors.TPSA(mol)
            hbd = Descriptors.NumHDonors(mol)
            hba = Descriptors.NumHAcceptors(mol)
            rotatable_bonds = Descriptors.NumRotatableBonds(mol)
            aromatic_rings = Descriptors.NumAromaticRings(mol)
            
            # Protein characteristics (simplified)
            protein_length = len(protein_sequence)
            hydrophobic_residues = sum(1 for aa in protein_sequence if aa in 'AILMFPWV')
            charged_residues = sum(1 for aa in protein_sequence if aa in 'DEKR')
            polar_residues = sum(1 for aa in protein_sequence if aa in 'NQSTY')
            
            # Use selected scoring function
            scoring_func = self.scoring_functions.get(method, self.vina_like_scoring)
            
            result = scoring_func(
                mw, logp, tpsa, hbd, hba, rotatable_bonds, aromatic_rings,
                protein_length, hydrophobic_residues, charged_residues, polar_residues
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating binding affinity: {str(e)}")
            return {"error": str(e)}
    
    def vina_like_scoring(
        self, mw, logp, tpsa, hbd, hba, rotatable_bonds, aromatic_rings,
        protein_length, hydrophobic_residues, charged_residues, polar_residues
    ) -> Dict[str, float]:
        """AutoDock Vina-like scoring function"""
        
        # Base affinity (random component for simulation)
        base_affinity = random.uniform(-12.0, -4.0)
        
        # Molecular weight penalty (optimal range 200-600 Da)
        if 200 <= mw <= 600:
            mw_penalty = 0
        else:
            mw_penalty = abs(mw - 400) / 200 * 2.0
        
        # LogP contribution (hydrophobic interactions)
        logp_contribution = -0.5 * max(0, logp - 2.0)
        
        # Hydrogen bonding contribution
        hb_contribution = -0.3 * min(hbd + hba, 8)
        
        # Rotatable bonds penalty (entropy loss)
        flexibility_penalty = 0.2 * max(0, rotatable_bonds - 5)
        
        # Aromatic interactions
        aromatic_contribution = -0.4 * min(aromatic_rings, 3)
        
        # Protein-specific adjustments
        protein_factor = 1.0
        if protein_length > 300:  # Large protein
            protein_factor *= 1.1
        if hydrophobic_residues / protein_length > 0.3:  # Hydrophobic binding site
            protein_factor *= 1.2
        
        # Calculate final binding affinity
        binding_affinity = (base_affinity + logp_contribution + hb_contribution + 
                          aromatic_contribution - mw_penalty - flexibility_penalty) * protein_factor
        
        # Ensure reasonable range
        binding_affinity = max(-15.0, min(-2.0, binding_affinity))
        
        # Calculate RMSD (lower is better, typically < 3.0 Å for good poses)
        rmsd = random.uniform(0.5, 4.0)
        if binding_affinity < -8.0:  # Good binders tend to have lower RMSD
            rmsd = random.uniform(0.5, 2.5)
        
        # Calculate confidence score
        confidence = self.calculate_confidence(binding_affinity, rmsd)
        
        return {
            "binding_affinity": round(binding_affinity, 2),
            "rmsd": round(rmsd, 2),
            "confidence": round(confidence, 1),
            "scoring_method": "vina_like"
        }
    
    def glide_like_scoring(
        self, mw, logp, tpsa, hbd, hba, rotatable_bonds, aromatic_rings,
        protein_length, hydrophobic_residues, charged_residues, polar_residues
    ) -> Dict[str, float]:
        """Schrödinger Glide-like scoring function"""
        
        # Base score
        base_score = random.uniform(-11.0, -5.0)
        
        # Electrostatic interactions
        electrostatic = -0.4 * (charged_residues / protein_length) * (hbd + hba)
        
        # Van der Waals interactions
        vdw = -0.3 * (hydrophobic_residues / protein_length) * logp
        
        # Desolvation penalty
        desolvation = 0.1 * tpsa / 100
        
        # Lipophilic interactions
        lipophilic = -0.2 * min(logp, 5.0)
        
        # Final score
        glide_score = base_score + electrostatic + vdw + lipophilic - desolvation
        glide_score = max(-14.0, min(-3.0, glide_score))
        
        rmsd = random.uniform(0.8, 3.5)
        confidence = self.calculate_confidence(glide_score, rmsd)
        
        return {
            "binding_affinity": round(glide_score, 2),
            "rmsd": round(rmsd, 2),
            "confidence": round(confidence, 1),
            "scoring_method": "glide_like"
        }
    
    def gold_like_scoring(
        self, mw, logp, tpsa, hbd, hba, rotatable_bonds, aromatic_rings,
        protein_length, hydrophobic_residues, charged_residues, polar_residues
    ) -> Dict[str, float]:
        """CCDC GOLD-like scoring function"""
        
        # GOLD uses fitness scores (higher is better), convert to binding affinity
        base_fitness = random.uniform(30, 80)
        
        # Hydrogen bonding
        hb_score = 5.0 * min(hbd + hba, 6)
        
        # Van der Waals
        vdw_score = 2.0 * min(mw / 100, 6)
        
        # Internal strain penalty
        strain_penalty = rotatable_bonds * 0.5
        
        # Total fitness
        total_fitness = base_fitness + hb_score + vdw_score - strain_penalty
        
        # Convert to binding affinity (approximate conversion)
        binding_affinity = -0.15 * total_fitness + 2.0
        binding_affinity = max(-13.0, min(-4.0, binding_affinity))
        
        rmsd = random.uniform(0.6, 3.2)
        confidence = self.calculate_confidence(binding_affinity, rmsd)
        
        return {
            "binding_affinity": round(binding_affinity, 2),
            "rmsd": round(rmsd, 2),
            "confidence": round(confidence, 1),
            "scoring_method": "gold_like",
            "fitness_score": round(total_fitness, 1)
        }
    
    def calculate_confidence(self, binding_affinity: float, rmsd: float) -> float:
        """Calculate confidence score based on binding affinity and RMSD"""
        
        # Affinity contribution (better affinity = higher confidence)
        affinity_score = max(0, min(100, (abs(binding_affinity) - 2) * 10))
        
        # RMSD contribution (lower RMSD = higher confidence)
        rmsd_score = max(0, min(100, (4.0 - rmsd) * 25))
        
        # Combined confidence
        confidence = (affinity_score * 0.7 + rmsd_score * 0.3)
        
        return max(10.0, min(99.0, confidence))
    
    def predict_binding_mode(self, smiles: str) -> Dict[str, Any]:
        """Predict binding mode and key interactions"""
        
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return {"error": "Invalid SMILES"}
            
            # Analyze molecular features
            hbd = Descriptors.NumHDonors(mol)
            hba = Descriptors.NumHAcceptors(mol)
            aromatic_rings = Descriptors.NumAromaticRings(mol)
            
            # Predict key interactions
            interactions = []
            
            if hbd > 0:
                interactions.append({
                    "type": "hydrogen_bond_donor",
                    "count": hbd,
                    "residues": ["Asp", "Glu", "Ser", "Thr"][:hbd]
                })
            
            if hba > 0:
                interactions.append({
                    "type": "hydrogen_bond_acceptor", 
                    "count": hba,
                    "residues": ["Lys", "Arg", "His", "Asn"][:hba]
                })
            
            if aromatic_rings > 0:
                interactions.append({
                    "type": "pi_pi_stacking",
                    "count": aromatic_rings,
                    "residues": ["Phe", "Tyr", "Trp"][:aromatic_rings]
                })
            
            # Predict binding pocket
            pocket_residues = random.sample([
                "Ala", "Val", "Leu", "Ile", "Phe", "Tyr", "Trp", "Met",
                "Ser", "Thr", "Asn", "Gln", "Asp", "Glu", "Lys", "Arg", "His"
            ], random.randint(5, 12))
            
            return {
                "interactions": interactions,
                "binding_pocket": pocket_residues,
                "binding_mode": "competitive" if random.random() > 0.3 else "allosteric",
                "contact_residues": len(pocket_residues)
            }
            
        except Exception as e:
            logger.error(f"Error predicting binding mode: {str(e)}")
            return {"error": str(e)}
    
    async def dock_molecule(
        self, 
        smiles: str, 
        protein_sequence: str,
        scoring_method: str = "vina"
    ) -> Dict[str, Any]:
        """Perform molecular docking simulation"""
        
        logger.info(f"Docking molecule: {smiles[:50]}...")
        
        # Simulate docking time
        await asyncio.sleep(random.uniform(0.5, 2.0))
        
        try:
            # Calculate binding affinity
            affinity_result = self.calculate_binding_affinity(
                smiles, protein_sequence, scoring_method
            )
            
            if "error" in affinity_result:
                return affinity_result
            
            # Predict binding mode
            binding_mode = self.predict_binding_mode(smiles)
            
            # Combine results
            docking_result = {
                **affinity_result,
                "binding_mode": binding_mode,
                "docking_time": random.uniform(0.5, 2.0),
                "poses_generated": random.randint(5, 20),
                "best_pose_rank": 1
            }
            
            logger.info(f"Docking completed. Affinity: {affinity_result['binding_affinity']} kcal/mol")
            
            return docking_result
            
        except Exception as e:
            logger.error(f"Error in molecular docking: {str(e)}")
            return {"error": str(e)}
    
    async def batch_dock(
        self, 
        molecules: List[Dict[str, str]], 
        protein_sequence: str,
        scoring_method: str = "vina"
    ) -> List[Dict[str, Any]]:
        """Perform batch docking of multiple molecules"""
        
        logger.info(f"Starting batch docking of {len(molecules)} molecules")
        
        results = []
        
        for i, molecule in enumerate(molecules):
            try:
                smiles = molecule.get("smiles", "")
                if not smiles:
                    continue
                
                # Dock molecule
                docking_result = await self.dock_molecule(
                    smiles, protein_sequence, scoring_method
                )
                
                # Add molecule info
                result = {
                    "molecule_id": i,
                    "smiles": smiles,
                    "name": molecule.get("name", f"Molecule_{i}"),
                    **docking_result
                }
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error docking molecule {i}: {str(e)}")
                continue
        
        # Sort by binding affinity (lower is better)
        results.sort(key=lambda x: x.get("binding_affinity", 0))
        
        logger.info(f"Batch docking completed. {len(results)} successful dockings")
        
        return results
    
    def get_docking_statistics(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate statistics from docking results"""
        
        if not results:
            return {"error": "No results to analyze"}
        
        affinities = [r.get("binding_affinity", 0) for r in results if "binding_affinity" in r]
        rmsds = [r.get("rmsd", 0) for r in results if "rmsd" in r]
        confidences = [r.get("confidence", 0) for r in results if "confidence" in r]
        
        stats = {
            "total_molecules": len(results),
            "successful_dockings": len(affinities),
            "binding_affinity": {
                "mean": np.mean(affinities) if affinities else 0,
                "std": np.std(affinities) if affinities else 0,
                "min": min(affinities) if affinities else 0,
                "max": max(affinities) if affinities else 0,
                "median": np.median(affinities) if affinities else 0
            },
            "rmsd": {
                "mean": np.mean(rmsds) if rmsds else 0,
                "std": np.std(rmsds) if rmsds else 0,
                "min": min(rmsds) if rmsds else 0,
                "max": max(rmsds) if rmsds else 0
            },
            "confidence": {
                "mean": np.mean(confidences) if confidences else 0,
                "std": np.std(confidences) if confidences else 0
            },
            "high_affinity_count": len([a for a in affinities if a < -8.0]),
            "good_pose_count": len([r for r in rmsds if r < 2.0])
        }
        
        return stats

# Example usage
if __name__ == "__main__":
    async def test_docking():
        simulator = DockingSimulator()
        
        # Test molecule
        test_smiles = "CC1=CC(=O)NC(=O)N1"
        test_protein = "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF"
        
        # Single docking
        result = await simulator.dock_molecule(test_smiles, test_protein)
        print("Docking result:", result)
    
    # Run test
    # asyncio.run(test_docking())
