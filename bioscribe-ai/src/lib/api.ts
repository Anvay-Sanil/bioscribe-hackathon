/**
 * BioScribe AI — Genuine API Client
 * 
 * Connects to the real computation backend. No mock data generators.
 * Every response comes from actual BioPython/RDKit computation.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Request Types ──────────────────────────────────────────────────────────

export interface ProteinAnalysisRequest {
  sequence: string;
  name?: string;
  organism?: string;
}

export interface DrugGenerationRequest {
  sequence: string;
  name?: string;
  organism?: string;
  num_candidates?: number;
  target_properties?: Record<string, number>;
}

export interface CompletePipelineRequest {
  sequence: string;
  name?: string;
  organism?: string;
  num_candidates?: number;
}

export interface SMILESInput {
  smiles: string;
}

export interface BatchSMILESInput {
  smiles_list: string[];
}

// ─── Response Types ─────────────────────────────────────────────────────────

export interface PhysicochemicalProperties {
  molecular_weight_da: number;
  isoelectric_point: number;
  instability_index: number;
  stability_classification: string;
  gravy: number;
  hydrophobicity_class: string;
  aromaticity: number;
  charge_at_ph_7_4: number;
  extinction_coefficient_reduced: number;
  extinction_coefficient_oxidized: number;
  absorbance_0_1_percent: number;
}

export interface SecondaryStructure {
  overall_fractions: {
    helix: number;
    sheet: number;
    turn: number;
    coil: number;
  };
  chou_fasman_per_residue: Array<{
    position: number;
    residue: string;
    structure: string;
    helix_propensity: number;
    sheet_propensity: number;
    turn_propensity: number;
  }>;
  dominant_structure: string;
}

export interface BindingSite {
  motif_name: string;
  start: number;
  end: number;
  matched_sequence: string;
  function: string;
  reference: string;
}

export interface ProteinAnalysisResult {
  protein_name: string;
  organism: string;
  sequence: string;
  sequence_length: number;
  physicochemical: PhysicochemicalProperties;
  secondary_structure: SecondaryStructure;
  composition: Record<string, any>;
  hydropathy_profile: Array<{ position: number; residue: string; hydropathy_score: number; classification: string }>;
  disorder_prediction: {
    disorder_content: number;
    disordered_regions: Array<{ start: number; end: number; length: number; mean_score: number }>;
    classification: string;
  };
  binding_sites: BindingSite[];
  ptm_sites: Record<string, any[]>;
  druggability: {
    druggability_score: number;
    classification: string;
    factors: Record<string, any>;
    method: string;
  };
  computation_method: string;
  deterministic: boolean;
}

export interface MoleculeProperties {
  molecular_weight: number;
  logP: number;
  tpsa: number;
  hbd: number;
  hba: number;
  rotatable_bonds: number;
  aromatic_rings: number;
  heavy_atom_count: number;
  ring_count: number;
  qed: number;
  lipinski_violations: number;
  lipinski_compliant: boolean;
  veber_compliant: boolean;
  sa_score: number;
  pains_alert: boolean;
  molecular_formula: string;
}

export interface DrugCandidate {
  candidate_id: string;
  rank: number;
  canonical_smiles: string;
  generation_method: string;
  base_scaffold: string;
  target_class: string;
  properties: MoleculeProperties;
  affinity_prediction?: {
    predicted_affinity_kcal_mol: number;
    confidence: number;
    scoring_contributions: Record<string, number>;
    method: string;
    note: string;
  };
  predicted_interactions?: Array<{
    type: string;
    strength: string;
    description: string;
  }>;
  ligand_efficiency?: {
    le_kcal_per_atom: number;
    heavy_atoms: number;
    classification: string;
  };
  admet?: Record<string, any>;
}

export interface PipelineResult {
  pipeline_id: string;
  protein_name: string;
  organism: string;
  sequence_length: number;
  protein_analysis: ProteinAnalysisResult;
  candidates: DrugCandidate[];
  summary: {
    total_candidates: number;
    best_candidate: string | null;
    best_affinity_kcal_mol: number | null;
    lipinski_compliant_count: number;
    elapsed_seconds: number;
  };
  methods: Record<string, string>;
  honest_disclaimers: string[];
  timestamp: string;
  deterministic: boolean;
}

// ─── API Client ─────────────────────────────────────────────────────────────

class BioScribeAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        typeof errorData.detail === 'string'
          ? errorData.detail
          : errorData.detail?.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  }

  // ─── Health & Status ──────────────────────────────────────────────────

  async healthCheck() {
    return this.request<{ status: string; timestamp: string; engines_ready: boolean }>('/health');
  }

  async getStatus() {
    return this.request<{
      name: string;
      version: string;
      status: string;
      engines: Record<string, string>;
      mock_data: boolean;
      deterministic: boolean;
    }>('/');
  }

  // ─── Protein Analysis ─────────────────────────────────────────────────

  async analyzeProtein(data: ProteinAnalysisRequest) {
    return this.request<{ status: string; data: ProteinAnalysisResult }>('/api/protein/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ─── Drug Generation ──────────────────────────────────────────────────

  async generateDrugs(data: DrugGenerationRequest) {
    return this.request<{
      status: string;
      data: {
        candidates: DrugCandidate[];
        generation_statistics: Record<string, any>;
        design_guidance: Record<string, any>;
        computation_method: string;
      };
    }>('/api/drugs/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ─── Affinity Scoring ─────────────────────────────────────────────────

  async scoreAffinity(data: DrugGenerationRequest) {
    return this.request<{
      status: string;
      data: {
        scored_candidates: DrugCandidate[];
        protein_name: string;
        scoring_method: string;
      };
    }>('/api/affinity/score', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ─── ADMET Prediction ─────────────────────────────────────────────────

  async predictADMET(smiles: string) {
    return this.request<{ status: string; data: Record<string, any> }>('/api/admet/predict', {
      method: 'POST',
      body: JSON.stringify({ smiles }),
    });
  }

  async predictADMETBatch(smilesList: string[]) {
    return this.request<{ status: string; data: any[] }>('/api/admet/predict-batch', {
      method: 'POST',
      body: JSON.stringify({ smiles_list: smilesList }),
    });
  }

  // ─── Molecule Validation ──────────────────────────────────────────────

  async validateMolecule(smiles: string) {
    return this.request<{
      status: string;
      data: { valid: boolean; canonical_smiles: string; properties: MoleculeProperties };
    }>('/api/molecule/validate', {
      method: 'POST',
      body: JSON.stringify({ smiles }),
    });
  }

  // ─── Complete Pipeline ────────────────────────────────────────────────

  async runCompletePipeline(data: CompletePipelineRequest) {
    return this.request<{ status: string; results: PipelineResult }>('/api/pipeline/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// ─── Singleton & Helpers ────────────────────────────────────────────────────

export const apiClient = new BioScribeAPI();

export const BioScribeHelpers = {
  /** Check if the genuine backend is reachable */
  async isApiAvailable(): Promise<boolean> {
    try {
      await apiClient.healthCheck();
      return true;
    } catch {
      return false;
    }
  },

  /** Format API errors for UI display */
  formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  /** Validate protein sequence (client-side, matching backend rules) */
  validateProteinSequence(sequence: string): { isValid: boolean; error?: string } {
    // Strip FASTA header
    let clean = sequence.trim();
    if (clean.startsWith('>')) {
      const lines = clean.split('\n');
      clean = lines.slice(1).join('');
    }
    clean = clean.replace(/\s+/g, '').toUpperCase();

    if (clean.length < 10) {
      return { isValid: false, error: 'Sequence too short (minimum 10 amino acids)' };
    }

    const validAminoAcids = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
    if (!validAminoAcids.test(clean)) {
      const invalid = clean.split('').filter(c => !'ACDEFGHIKLMNPQRSTVWY'.includes(c));
      return { isValid: false, error: `Invalid characters: ${[...new Set(invalid)].join(', ')}` };
    }

    return { isValid: true };
  },

  /**
   * Example protein sequences for quick testing.
   * These are real, published sequences.
   */
  exampleSequences: {
    "HIV-1 Protease": {
      sequence: "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
      organism: "HIV-1",
      description: "99 residues, aspartyl protease, antiviral drug target"
    },
    "Human Insulin": {
      sequence: "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN",
      organism: "Homo sapiens",
      description: "110 residues, peptide hormone, diabetes target"
    },
    "EGFR Kinase Domain": {
      sequence: "FKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPYGCLLDHVRENRGRLGSQDLLNWCMQIAKGMSYLEDVRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIHQFSLAVEGGIYTDIQQRKEGLHHLPALEGQYQDRDSESFIRDCELLSQPELEQ",
      organism: "Homo sapiens",
      description: "298 residues, receptor tyrosine kinase, cancer drug target"
    },
    "SARS-CoV-2 Main Protease": {
      sequence: "SGFRKMAFPSGKVEGCMVQVTCGTTTLNGLWLDDVVYCPRHVICTSEDMLNPNYEDLLIRKSNHNFLVQAGNVQLRVIGHSMQNCVLKLKVDTANPKTPKYKFVRIQPGQTFSVLACYNGSPSGVYQCAMRPNFTIKGSFLNGSCGSVGFNIDYDCVSSFCYMHHMELPTGVHAGTDLEGNFYGPFVDRQTAQAAGTDTTITVNVLAWLYAAVINGDRWFLNRFTTTLNDFNLVAMKYNYEPLTQDHVDILGPLSAQTGIAVLDMCASLKELLQNGMNGRTILGSALLEDEFTPFDVVRQCSGVTFQ",
      organism: "SARS-CoV-2",
      description: "306 residues, cysteine protease, COVID-19 drug target"
    },
  } as Record<string, { sequence: string; organism: string; description: string }>,
};

export default apiClient;
export const api = apiClient;
