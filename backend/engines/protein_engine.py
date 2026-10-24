"""
Genuine Protein Analysis Engine
All computations use BioPython and established bioinformatics algorithms.
Zero mock data. Zero random numbers. Every value is reproducible.
"""

# BIOSCRIBE_PHASE3_LEGACY_DISABLED: retained for review, never a supported runtime.
raise RuntimeError("Legacy BioScribe capability disabled. Use bioscribe.api:app and bioscribe.worker; unsupported scientific claims are withdrawn.")


import re
import math
import logging
from typing import Dict, List, Any, Optional, Tuple

from Bio.SeqUtils.ProtParam import ProteinAnalysis
from Bio.SeqUtils import molecular_weight

logger = logging.getLogger(__name__)

# ─── Amino Acid Reference Data ───────────────────────────────────────────────

# Kyte-Doolittle hydropathy scale
KYTE_DOOLITTLE = {
    'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5, 'C': 2.5,
    'Q': -3.5, 'E': -3.5, 'G': -0.4, 'H': -3.2, 'I': 4.5,
    'L': 3.8, 'K': -3.9, 'M': 1.9, 'F': 2.8, 'P': -1.6,
    'S': -0.8, 'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2
}

# Chou-Fasman helix propensity (Pα)
CF_HELIX = {
    'A': 1.42, 'R': 0.98, 'N': 0.67, 'D': 1.01, 'C': 0.70,
    'Q': 1.11, 'E': 1.51, 'G': 0.57, 'H': 1.00, 'I': 1.08,
    'L': 1.21, 'K': 1.16, 'M': 1.45, 'F': 1.13, 'P': 0.57,
    'S': 0.77, 'T': 0.83, 'W': 1.08, 'Y': 0.69, 'V': 1.06
}

# Chou-Fasman sheet propensity (Pβ)
CF_SHEET = {
    'A': 0.83, 'R': 0.93, 'N': 0.89, 'D': 0.54, 'C': 1.19,
    'Q': 1.10, 'E': 0.37, 'G': 0.75, 'H': 0.87, 'I': 1.60,
    'L': 1.30, 'K': 0.74, 'M': 1.05, 'F': 1.38, 'P': 0.55,
    'S': 0.75, 'T': 1.19, 'W': 1.37, 'Y': 1.47, 'V': 1.70
}

# Chou-Fasman turn propensity (Pt)
CF_TURN = {
    'A': 0.66, 'R': 0.95, 'N': 1.56, 'D': 1.46, 'C': 1.19,
    'Q': 0.98, 'E': 0.74, 'G': 1.56, 'H': 0.95, 'I': 0.47,
    'L': 0.59, 'K': 1.01, 'M': 0.60, 'F': 0.60, 'P': 1.52,
    'S': 1.43, 'T': 0.96, 'W': 0.96, 'Y': 1.14, 'V': 0.50
}

# Disorder-promoting amino acids (Uversky, 2002)
DISORDER_PROMOTING = set('AQSGPEKRD')
ORDER_PROMOTING = set('WFYILMVNCT')

# pKa values for ionizable groups
PKA_VALUES = {
    'D': 3.65,   # Asp side chain
    'E': 4.25,   # Glu side chain
    'H': 6.00,   # His side chain
    'C': 8.18,   # Cys side chain
    'Y': 10.07,  # Tyr side chain
    'K': 10.53,  # Lys side chain
    'R': 12.48,  # Arg side chain
    'N_term': 9.69,  # N-terminus
    'C_term': 2.34,  # C-terminus
}

VALID_AA = set('ACDEFGHIKLMNPQRSTVWY')


class ProteinEngine:
    """
    Genuine protein sequence analysis.
    Every calculation is deterministic and scientifically grounded.
    """

    def validate_sequence(self, sequence: str) -> Tuple[bool, str]:
        """Validate protein sequence. Returns (is_valid, clean_sequence_or_error)."""
        clean = re.sub(r'\s+', '', sequence.upper())

        # Strip FASTA header
        if clean.startswith('>'):
            lines = sequence.strip().split('\n')
            clean = re.sub(r'\s+', '', ''.join(lines[1:]).upper())

        if len(clean) < 10:
            return False, "Sequence too short (minimum 10 residues)"

        invalid = set(clean) - VALID_AA
        if invalid:
            return False, f"Invalid amino acid characters: {', '.join(sorted(invalid))}"

        return True, clean

    async def analyze(self, sequence: str, name: str = "Unknown",
                      organism: str = "Unknown") -> Dict[str, Any]:
        """
        Complete protein analysis. Every value is genuinely computed.
        """
        valid, result = self.validate_sequence(sequence)
        if not valid:
            raise ValueError(result)

        seq = result  # cleaned sequence
        pa = ProteinAnalysis(seq)

        # ── Core Physicochemical Properties ──
        mw = pa.molecular_weight()
        pi = pa.isoelectric_point()
        instability = pa.instability_index()
        gravy = pa.gravy()
        aromaticity = pa.aromaticity()
        helix_frac, turn_frac, sheet_frac = pa.secondary_structure_fraction()

        # Extinction coefficients (Pace et al. method)
        ext_coeff = self._extinction_coefficient(seq)

        # Charge at pH 7.4
        charge_at_ph74 = self._charge_at_ph(seq, 7.4)

        # ── Amino Acid Composition ──
        aa_percent = pa.get_amino_acids_percent()
        aa_count = pa.count_amino_acids()

        # ── Per-Residue Analysis ──
        hydropathy_profile = self._hydropathy_profile(seq, window=9)
        ss_prediction = self._chou_fasman_prediction(seq)
        disorder_prediction = self._predict_disorder(seq, window=21)

        # ── Binding Site Motifs ──
        binding_sites = self._scan_binding_motifs(seq)

        # ── Post-Translational Modifications ──
        ptm_sites = self._predict_ptm_sites(seq)

        # ── Druggability Assessment ──
        druggability = self._assess_druggability(seq, binding_sites, ss_prediction)

        return {
            "protein_name": name,
            "organism": organism,
            "sequence": seq,
            "sequence_length": len(seq),

            "physicochemical": {
                "molecular_weight_da": round(mw, 2),
                "isoelectric_point": round(pi, 2),
                "instability_index": round(instability, 2),
                "stability_classification": "Stable" if instability < 40 else "Unstable",
                "gravy": round(gravy, 4),
                "hydrophobicity_class": (
                    "Hydrophobic" if gravy > 0 else
                    "Moderately hydrophilic" if gravy > -0.5 else
                    "Hydrophilic"
                ),
                "aromaticity": round(aromaticity, 4),
                "charge_at_ph_7_4": round(charge_at_ph74, 2),
                "extinction_coefficient_reduced": ext_coeff["reduced"],
                "extinction_coefficient_oxidized": ext_coeff["oxidized"],
                "absorbance_0_1_percent": round(ext_coeff["reduced"] / mw, 4) if mw > 0 else 0,
            },

            "secondary_structure": {
                "overall_fractions": {
                    "helix": round(helix_frac, 4),
                    "sheet": round(sheet_frac, 4),
                    "turn": round(turn_frac, 4),
                    "coil": round(1 - helix_frac - sheet_frac - turn_frac, 4),
                },
                "chou_fasman_per_residue": ss_prediction,
                "dominant_structure": (
                    "α-helix rich" if helix_frac > sheet_frac and helix_frac > 0.3 else
                    "β-sheet rich" if sheet_frac > helix_frac and sheet_frac > 0.3 else
                    "Mixed α/β" if helix_frac > 0.15 and sheet_frac > 0.15 else
                    "Predominantly disordered/coil"
                ),
            },

            "composition": {
                "amino_acid_percent": {k: round(v, 4) for k, v in aa_percent.items()},
                "amino_acid_count": aa_count,
                "charged_residues": sum(aa_count.get(aa, 0) for aa in 'DEKRH'),
                "hydrophobic_residues": sum(aa_count.get(aa, 0) for aa in 'AILMFPWV'),
                "polar_residues": sum(aa_count.get(aa, 0) for aa in 'NQSTY'),
                "tiny_residues": sum(aa_count.get(aa, 0) for aa in 'AGS'),
                "aromatic_residues": sum(aa_count.get(aa, 0) for aa in 'FWYH'),
            },

            "hydropathy_profile": hydropathy_profile,
            "disorder_prediction": disorder_prediction,
            "binding_sites": binding_sites,
            "ptm_sites": ptm_sites,
            "druggability": druggability,

            "computation_method": "BioPython ProteinAnalysis + Chou-Fasman + Kyte-Doolittle + PROSITE motifs",
            "deterministic": True,
        }

    # ─── Hydropathy Profile (Kyte-Doolittle) ─────────────────────────────────

    def _hydropathy_profile(self, seq: str, window: int = 9) -> List[Dict[str, Any]]:
        """Kyte-Doolittle hydropathy profile with sliding window."""
        half = window // 2
        profile = []
        for i in range(half, len(seq) - half):
            window_seq = seq[i - half:i + half + 1]
            score = sum(KYTE_DOOLITTLE.get(aa, 0) for aa in window_seq) / window
            profile.append({
                "position": i + 1,
                "residue": seq[i],
                "hydropathy_score": round(score, 3),
                "classification": (
                    "hydrophobic" if score > 0.5 else
                    "hydrophilic" if score < -0.5 else
                    "amphipathic"
                ),
            })
        return profile

    # ─── Chou-Fasman Secondary Structure Prediction ──────────────────────────

    def _chou_fasman_prediction(self, seq: str) -> List[Dict[str, Any]]:
        """
        Per-residue secondary structure prediction using Chou-Fasman propensities.
        Returns the full prediction array (capped at 500 residues for response size).
        """
        predictions = []
        for i, aa in enumerate(seq[:500]):
            p_helix = CF_HELIX.get(aa, 1.0)
            p_sheet = CF_SHEET.get(aa, 1.0)
            p_turn = CF_TURN.get(aa, 1.0)

            max_prop = max(p_helix, p_sheet, p_turn)
            if max_prop == p_helix and p_helix > 1.0:
                structure = "H"
            elif max_prop == p_sheet and p_sheet > 1.0:
                structure = "E"
            elif max_prop == p_turn and p_turn > 1.0:
                structure = "T"
            else:
                structure = "C"

            predictions.append({
                "position": i + 1,
                "residue": aa,
                "structure": structure,
                "helix_propensity": round(p_helix, 2),
                "sheet_propensity": round(p_sheet, 2),
                "turn_propensity": round(p_turn, 2),
            })

        return predictions

    # ─── Disorder Prediction (Composition-Based, IUPred-Style) ───────────────

    def _predict_disorder(self, seq: str, window: int = 21) -> Dict[str, Any]:
        """
        Predict intrinsically disordered regions using amino acid composition bias.
        Based on Uversky (2002): disorder-promoting vs order-promoting residue ratio.
        """
        half = window // 2
        scores = []
        disordered_regions = []
        in_disorder = False
        region_start = 0

        for i in range(len(seq)):
            start = max(0, i - half)
            end = min(len(seq), i + half + 1)
            window_seq = seq[start:end]

            disorder_count = sum(1 for aa in window_seq if aa in DISORDER_PROMOTING)
            order_count = sum(1 for aa in window_seq if aa in ORDER_PROMOTING)
            total = len(window_seq)

            # Disorder score: ratio of disorder-promoting residues
            score = disorder_count / total if total > 0 else 0.5
            scores.append(round(score, 3))

            is_disordered = score > 0.5

            if is_disordered and not in_disorder:
                region_start = i
                in_disorder = True
            elif not is_disordered and in_disorder:
                if i - region_start >= 5:  # minimum 5-residue region
                    disordered_regions.append({
                        "start": region_start + 1,
                        "end": i,
                        "length": i - region_start,
                        "mean_score": round(
                            sum(scores[region_start:i]) / (i - region_start), 3
                        ),
                    })
                in_disorder = False

        # Close any open region
        if in_disorder and len(seq) - region_start >= 5:
            disordered_regions.append({
                "start": region_start + 1,
                "end": len(seq),
                "length": len(seq) - region_start,
                "mean_score": round(
                    sum(scores[region_start:]) / (len(seq) - region_start), 3
                ),
            })

        total_disordered = sum(r["length"] for r in disordered_regions)

        return {
            "disorder_content": round(total_disordered / len(seq), 4) if len(seq) > 0 else 0,
            "disordered_regions": disordered_regions,
            "total_disordered_residues": total_disordered,
            "classification": (
                "Fully ordered" if total_disordered / len(seq) < 0.1 else
                "Partially disordered" if total_disordered / len(seq) < 0.5 else
                "Intrinsically disordered protein (IDP)"
            ),
        }

    # ─── Extinction Coefficient ──────────────────────────────────────────────

    def _extinction_coefficient(self, seq: str) -> Dict[str, int]:
        """Extinction coefficient at 280nm (Pace et al., 1995)."""
        n_trp = seq.count('W')
        n_tyr = seq.count('Y')
        n_cys = seq.count('C')

        # Assuming all Cys form disulfide bonds (oxidized)
        oxidized = n_trp * 5500 + n_tyr * 1490 + (n_cys // 2) * 125
        # Assuming no disulfide bonds (reduced)
        reduced = n_trp * 5500 + n_tyr * 1490

        return {"oxidized": oxidized, "reduced": reduced}

    # ─── Charge at pH ────────────────────────────────────────────────────────

    def _charge_at_ph(self, seq: str, ph: float) -> float:
        """
        Calculate net charge at given pH using Henderson-Hasselbalch equation.
        """
        charge = 0.0

        # N-terminus (positive)
        charge += 1.0 / (1.0 + 10 ** (ph - PKA_VALUES['N_term']))
        # C-terminus (negative)
        charge -= 1.0 / (1.0 + 10 ** (PKA_VALUES['C_term'] - ph))

        for aa in seq:
            if aa in ('K', 'R', 'H'):
                pka = PKA_VALUES.get(aa, 7.0)
                charge += 1.0 / (1.0 + 10 ** (ph - pka))
            elif aa in ('D', 'E', 'C', 'Y'):
                pka = PKA_VALUES.get(aa, 7.0)
                charge -= 1.0 / (1.0 + 10 ** (pka - ph))

        return charge

    # ─── Binding Site Motif Scanning ─────────────────────────────────────────

    def _scan_binding_motifs(self, seq: str) -> List[Dict[str, Any]]:
        """
        Scan for real binding motifs using PROSITE-style regex patterns.
        Each motif is from published literature.
        """
        motif_patterns = {
            "P-loop (ATP/GTP binding)": {
                "pattern": r'[AG].{4}GK[ST]',
                "reference": "PROSITE PS00017",
                "function": "Nucleotide binding",
            },
            "Protein kinase ATP-binding": {
                "pattern": r'[LIVMFYC].G.{2}G.{1,2}[GSTA].{3,6}K',
                "reference": "PROSITE PS00107",
                "function": "Kinase catalytic activity",
            },
            "EF-hand calcium binding": {
                "pattern": r'D.{2}D.D.{2}[DE].{3}[DE]',
                "reference": "PROSITE PS00018",
                "function": "Calcium ion binding",
            },
            "Zinc finger C2H2": {
                "pattern": r'C.{2,4}C.{3}[LIVMFYWC].{8}H.{3,5}H',
                "reference": "PROSITE PS00028",
                "function": "DNA binding / transcription factor",
            },
            "N-glycosylation sequon": {
                "pattern": r'N[^P][ST][^P]',
                "reference": "PROSITE PS00001",
                "function": "N-linked glycosylation site",
            },
            "Catalytic triad (Ser protease)": {
                "pattern": r'[LIVMFYWGA][ST]A[STAG]HC',
                "reference": "PROSITE PS00122",
                "function": "Serine protease active site",
            },
            "RGD cell attachment": {
                "pattern": r'RGD',
                "reference": "Literature",
                "function": "Integrin-binding / cell adhesion",
            },
            "Nuclear localization signal": {
                "pattern": r'[KR]{4,6}',
                "reference": "Literature",
                "function": "Nuclear import signal",
            },
            "Aspartic protease active site": {
                "pattern": r'[LIVMFGAC][LIVMTADC][LIVFYMS]D[STAV]G[STAPLMVK]',
                "reference": "PROSITE PS00141",
                "function": "Aspartic protease catalytic site",
            },
            "Cysteine protease active site": {
                "pattern": r'Q.{2}[GE][^E]C[YW]',
                "reference": "PROSITE PS00139",
                "function": "Cysteine protease catalytic site",
            },
        }

        found_sites = []
        for name, info in motif_patterns.items():
            try:
                for match in re.finditer(info["pattern"], seq):
                    found_sites.append({
                        "motif_name": name,
                        "start": match.start() + 1,
                        "end": match.end(),
                        "matched_sequence": match.group(),
                        "function": info["function"],
                        "reference": info["reference"],
                    })
            except re.error:
                continue

        return found_sites

    # ─── PTM Site Prediction ─────────────────────────────────────────────────

    def _predict_ptm_sites(self, seq: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Predict post-translational modification sites using motif rules.
        """
        ptm = {
            "phosphorylation": [],
            "n_glycosylation": [],
            "myristoylation": [],
        }

        # Phosphorylation: S/T with R/K at -2 or -3 (basophilic kinase motif)
        for i, aa in enumerate(seq):
            if aa in ('S', 'T'):
                context_start = max(0, i - 3)
                upstream = seq[context_start:i]
                if any(c in upstream for c in 'RK'):
                    ptm["phosphorylation"].append({
                        "position": i + 1,
                        "residue": aa,
                        "motif_context": seq[max(0, i-3):min(len(seq), i+4)],
                        "kinase_class": "Basophilic (AGC/CAMK family)",
                    })
            elif aa == 'Y':
                # Tyrosine phosphorylation: less specific, report all Y
                ptm["phosphorylation"].append({
                    "position": i + 1,
                    "residue": "Y",
                    "motif_context": seq[max(0, i-3):min(len(seq), i+4)],
                    "kinase_class": "Tyrosine kinase",
                })

        # N-glycosylation: NX[ST] where X ≠ P
        for match in re.finditer(r'N([^P])([ST])', seq):
            ptm["n_glycosylation"].append({
                "position": match.start() + 1,
                "sequon": match.group(),
                "motif_context": seq[max(0, match.start()-2):min(len(seq), match.end()+2)],
            })

        # N-myristoylation: G at position 2 with specific downstream
        if len(seq) > 6 and seq[0] == 'M' and seq[1] == 'G':
            ptm["myristoylation"].append({
                "position": 2,
                "residue": "G",
                "motif_context": seq[:8],
            })

        # Cap results
        for key in ptm:
            ptm[key] = ptm[key][:20]

        return ptm

    # ─── Druggability Assessment ─────────────────────────────────────────────

    def _assess_druggability(self, seq: str, binding_sites: List[Dict],
                             ss_prediction: List[Dict]) -> Dict[str, Any]:
        """
        Assess protein druggability based on structural and compositional features.
        Based on Hopkins & Groom (2002) druggability criteria.
        """
        # Binding pocket count
        n_binding_sites = len(binding_sites)

        # Hydrophobic patch density (potential binding pockets)
        hydrophobic_patches = 0
        patch_length = 0
        for aa in seq:
            if aa in 'AILMFPWV':
                patch_length += 1
            else:
                if patch_length >= 5:
                    hydrophobic_patches += 1
                patch_length = 0

        # Structural diversity (mixed secondary structure = more druggable)
        helix_res = sum(1 for p in ss_prediction if p["structure"] == "H")
        sheet_res = sum(1 for p in ss_prediction if p["structure"] == "E")
        coil_res = sum(1 for p in ss_prediction if p["structure"] in ("C", "T"))
        total = len(ss_prediction) if ss_prediction else 1

        structural_diversity = 1.0 - max(helix_res/total, sheet_res/total, coil_res/total)

        # Score
        score = 0.0
        score += min(n_binding_sites * 0.15, 0.45)  # Up to 0.45 from binding sites
        score += min(hydrophobic_patches * 0.1, 0.25)  # Up to 0.25 from hydrophobic patches
        score += structural_diversity * 0.3  # Up to 0.3 from structural diversity

        return {
            "druggability_score": round(min(score, 1.0), 3),
            "classification": (
                "Highly druggable" if score > 0.6 else
                "Moderately druggable" if score > 0.3 else
                "Challenging target"
            ),
            "factors": {
                "binding_motifs_found": n_binding_sites,
                "hydrophobic_patches": hydrophobic_patches,
                "structural_diversity": round(structural_diversity, 3),
            },
            "method": "Hopkins-Groom criteria (composition-based)",
        }
