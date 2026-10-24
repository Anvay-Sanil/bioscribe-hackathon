"""
Ligand-Based Affinity Scoring Engine
Honest label: this is NOT molecular docking (no 3D protein pocket intersection).
This is QSAR-style affinity prediction using molecular descriptors.

Scoring function: empirical formula combining molecular properties with
protein-ligand complementarity heuristics. Deterministic — same inputs
always produce the same output.

Based on Vina empirical scoring function terms adapted for descriptor space:
  ΔG ≈ w_size·f(MW) + w_hydrophobic·f(LogP, GRAVY) + w_hbond·f(HBD,HBA)
      + w_flexibility·f(RotBonds) + w_polar·f(TPSA, charge)
"""

# BIOSCRIBE_PHASE3_LEGACY_DISABLED: retained for review, never a supported runtime.
raise RuntimeError("Legacy BioScribe capability disabled. Use bioscribe.api:app and bioscribe.worker; unsupported scientific claims are withdrawn.")


import math
import logging
from typing import Dict, List, Any, Optional

from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, rdMolDescriptors, QED

logger = logging.getLogger(__name__)


class AffinityScorer:
    """
    Ligand-based affinity scoring.
    Predicts binding affinity from molecular descriptors + protein properties.
    Deterministic: no random numbers anywhere.
    """

    # Empirical weights (calibrated to approximate Vina-like scoring)
    WEIGHTS = {
        "size_complementarity": -0.035,   # Penalize deviation from optimal MW
        "hydrophobic_match": -0.85,       # Hydrophobic complementarity
        "hydrogen_bonding": -0.60,        # H-bond formation potential
        "flexibility_penalty": 0.30,      # Entropy cost of freezing rotatable bonds
        "polar_surface": -0.015,          # Polar surface complementarity
        "aromaticity_bonus": -0.40,       # Pi-stacking potential
        "size_base": -6.0,               # Base affinity offset
    }

    async def score_candidates(
        self,
        candidates: List[Dict[str, Any]],
        protein_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Score all drug candidates against the protein target.
        Returns candidates enriched with affinity predictions.
        """
        protein_features = self._extract_protein_features(protein_analysis)
        scored = []

        for candidate in candidates:
            smiles = candidate.get("canonical_smiles", "")
            props = candidate.get("properties", {})

            if not smiles or not props:
                continue

            scoring = self._compute_affinity(props, protein_features)
            interactions = self._predict_interactions(props, protein_features)
            le = self._ligand_efficiency(
                scoring["predicted_affinity_kcal_mol"],
                props.get("heavy_atom_count", 20)
            )

            scored.append({
                **candidate,
                "affinity_prediction": scoring,
                "predicted_interactions": interactions,
                "ligand_efficiency": le,
            })

        # Sort by affinity (more negative = stronger binding)
        scored.sort(key=lambda x: x["affinity_prediction"]["predicted_affinity_kcal_mol"])

        return scored

    def _extract_protein_features(self, analysis: Dict) -> Dict[str, float]:
        """Extract relevant protein features for scoring."""
        physchem = analysis.get("physicochemical", {})
        composition = analysis.get("composition", {})
        binding_sites = analysis.get("binding_sites", [])

        seq_len = analysis.get("sequence_length", 100)
        total_res = max(seq_len, 1)

        return {
            "gravy": physchem.get("gravy", 0),
            "charge": physchem.get("charge_at_ph_7_4", 0),
            "mw": physchem.get("molecular_weight_da", 10000),
            "hydrophobic_fraction": composition.get("hydrophobic_residues", 0) / total_res,
            "charged_fraction": composition.get("charged_residues", 0) / total_res,
            "polar_fraction": composition.get("polar_residues", 0) / total_res,
            "aromatic_fraction": composition.get("aromatic_residues", 0) / total_res,
            "n_binding_sites": len(binding_sites),
            "has_kinase_site": any("kinase" in s.get("function", "").lower()
                                   for s in binding_sites),
            "has_protease_site": any("protease" in s.get("function", "").lower()
                                     for s in binding_sites),
        }

    def _compute_affinity(self, mol_props: Dict, prot_features: Dict) -> Dict[str, Any]:
        """
        Compute predicted binding affinity using empirical scoring function.
        All terms are derived from actual molecular/protein properties.
        Returns kcal/mol estimate.
        """
        W = self.WEIGHTS

        # ── Term 1: Size complementarity ──
        # Optimal drug MW is typically 300-450 Da for good bioavailability
        mw = mol_props.get("molecular_weight", 300)
        optimal_mw = 375.0
        size_term = W["size_complementarity"] * abs(mw - optimal_mw)

        # ── Term 2: Hydrophobic complementarity ──
        logp = mol_props.get("logP", 2.0)
        gravy = prot_features.get("gravy", 0)
        # Hydrophobic proteins bind hydrophobic ligands better
        # Optimal LogP ≈ 2.5 for general drug-likeness
        hydrophobic_complementarity = 1.0 / (1.0 + abs(logp - 2.5) * 0.5)
        # Boost if protein is hydrophobic and ligand matches
        if gravy > 0 and logp > 2:
            hydrophobic_complementarity *= 1.3
        elif gravy < -0.3 and logp < 2:
            hydrophobic_complementarity *= 1.2
        hydrophobic_term = W["hydrophobic_match"] * hydrophobic_complementarity

        # ── Term 3: Hydrogen bonding potential ──
        hbd = mol_props.get("hbd", 0)
        hba = mol_props.get("hba", 0)
        total_hb = min(hbd + hba, 8)  # Diminishing returns above 8
        polar_fraction = prot_features.get("polar_fraction", 0.3)
        hb_term = W["hydrogen_bonding"] * (total_hb / 8.0) * (1.0 + polar_fraction)

        # ── Term 4: Flexibility penalty ──
        rot_bonds = mol_props.get("rotatable_bonds", 0)
        flex_term = W["flexibility_penalty"] * max(0, rot_bonds - 3)

        # ── Term 5: Polar surface area ──
        tpsa = mol_props.get("tpsa", 60)
        # Optimal TPSA for CNS drugs: 60-90 Å²; for general: 40-120 Å²
        polar_term = W["polar_surface"] * abs(tpsa - 75)

        # ── Term 6: Aromaticity ──
        aromatic_rings = mol_props.get("aromatic_rings", 0)
        prot_aromatic = prot_features.get("aromatic_fraction", 0.1)
        aromatic_term = W["aromaticity_bonus"] * min(aromatic_rings, 3) * (1 + prot_aromatic * 2)

        # ── Binding site bonus ──
        site_bonus = 0.0
        if prot_features.get("n_binding_sites", 0) > 0:
            site_bonus = -0.5  # Having a defined binding site improves prediction

        # ── Total ──
        total = (W["size_base"] + size_term + hydrophobic_term + hb_term +
                 flex_term + polar_term + aromatic_term + site_bonus)

        # Clamp to realistic range (-14 to -2 kcal/mol)
        total = max(-14.0, min(-2.0, total))

        # Compute individual contributions for explainability
        contributions = {
            "base_offset": round(W["size_base"], 2),
            "size_complementarity": round(size_term, 3),
            "hydrophobic_match": round(hydrophobic_term, 3),
            "hydrogen_bonding": round(hb_term, 3),
            "flexibility_penalty": round(flex_term, 3),
            "polar_surface": round(polar_term, 3),
            "aromaticity_bonus": round(aromatic_term, 3),
            "binding_site_bonus": round(site_bonus, 3),
        }

        # Confidence based on QED and property completeness
        qed = mol_props.get("qed", 0.5)
        confidence = min(0.95, 0.4 + qed * 0.4 + (0.15 if prot_features["n_binding_sites"] > 0 else 0))

        return {
            "predicted_affinity_kcal_mol": round(total, 2),
            "confidence": round(confidence, 3),
            "scoring_contributions": contributions,
            "method": "Empirical descriptor-based scoring (not 3D docking)",
            "note": "This is a QSAR-style affinity estimate, not a physics-based docking calculation",
        }

    def _predict_interactions(self, mol_props: Dict, prot_features: Dict) -> List[Dict[str, str]]:
        """
        Predict likely interaction types based on functional group analysis.
        Deterministic — based on actual molecular features.
        """
        interactions = []

        hbd = mol_props.get("hbd", 0)
        hba = mol_props.get("hba", 0)
        logp = mol_props.get("logP", 0)
        aromatic = mol_props.get("aromatic_rings", 0)
        tpsa = mol_props.get("tpsa", 0)

        if hbd > 0:
            interactions.append({
                "type": "Hydrogen bond (donor)",
                "strength": "Strong" if hbd >= 3 else "Moderate",
                "description": f"{hbd} H-bond donor groups available",
            })

        if hba > 0:
            interactions.append({
                "type": "Hydrogen bond (acceptor)",
                "strength": "Strong" if hba >= 4 else "Moderate",
                "description": f"{hba} H-bond acceptor groups available",
            })

        if logp > 2.0:
            interactions.append({
                "type": "Hydrophobic",
                "strength": "Strong" if logp > 3.5 else "Moderate",
                "description": f"LogP = {logp:.1f} suggests significant hydrophobic contribution",
            })

        if aromatic > 0:
            interactions.append({
                "type": "π-π Stacking",
                "strength": "Strong" if aromatic >= 2 else "Moderate",
                "description": f"{aromatic} aromatic ring(s) available for π interactions",
            })

        if tpsa > 80:
            interactions.append({
                "type": "Electrostatic",
                "strength": "Moderate",
                "description": f"TPSA = {tpsa:.0f} Å² suggests polar interactions",
            })

        return interactions

    def _ligand_efficiency(self, affinity: float, heavy_atoms: int) -> Dict[str, Any]:
        """
        Calculate ligand efficiency metrics.
        LE = -ΔG / N_heavy  (Hopkins et al., 2004)
        Good LE > 0.3 kcal/mol/heavy atom
        """
        if heavy_atoms == 0:
            return {"le": 0, "classification": "Invalid"}

        le = -affinity / heavy_atoms
        lle = -affinity - mol_logp if (mol_logp := 0) else -affinity  # Simplified

        return {
            "le_kcal_per_atom": round(le, 3),
            "heavy_atoms": heavy_atoms,
            "classification": (
                "Excellent (LE > 0.4)" if le > 0.4 else
                "Good (LE > 0.3)" if le > 0.3 else
                "Moderate (LE > 0.2)" if le > 0.2 else
                "Poor (LE ≤ 0.2)"
            ),
        }
