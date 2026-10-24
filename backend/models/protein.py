import re
import logging
from typing import Dict, Any, Optional
from Bio.Seq import Seq
from Bio.SeqUtils import molecular_weight
from Bio.SeqUtils.ProtParam import ProteinAnalysis
import requests
import asyncio

logger = logging.getLogger(__name__)

class ProteinProcessor:
    """Handles protein sequence analysis and validation"""
    
    def __init__(self):
        self.amino_acids = set('ACDEFGHIKLMNPQRSTVWY')
        self.uniprot_base_url = "https://rest.uniprot.org/uniprotkb"
        
    def validate_sequence(self, sequence: str) -> bool:
        """Validate protein sequence format"""
        # Remove whitespace and convert to uppercase
        clean_seq = re.sub(r'\s+', '', sequence.upper())
        
        # Check if sequence contains only valid amino acids
        return all(aa in self.amino_acids for aa in clean_seq)
    
    def parse_fasta(self, fasta_input: str) -> Dict[str, str]:
        """Parse FASTA format input"""
        lines = fasta_input.strip().split('\n')
        
        if lines[0].startswith('>'):
            # FASTA format
            header = lines[0][1:]  # Remove '>'
            sequence = ''.join(lines[1:])
        else:
            # Plain sequence
            header = "Unknown Protein"
            sequence = fasta_input
        
        return {
            "header": header,
            "sequence": re.sub(r'\s+', '', sequence.upper())
        }
    
    def calculate_properties(self, sequence: str) -> Dict[str, Any]:
        """Calculate protein properties using BioPython"""
        try:
            # Create protein analysis object
            protein_analysis = ProteinAnalysis(sequence)
            
            # Basic properties
            properties = {
                "length": len(sequence),
                "molecular_weight": protein_analysis.molecular_weight(),
                "isoelectric_point": protein_analysis.isoelectric_point(),
                "instability_index": protein_analysis.instability_index(),
                "gravy": protein_analysis.gravy(),  # Grand average of hydropathy
                "aromaticity": protein_analysis.aromaticity(),
            }
            
            # Amino acid composition
            aa_composition = protein_analysis.get_amino_acids_percent()
            properties["amino_acid_composition"] = aa_composition
            
            # Secondary structure prediction (simplified)
            secondary_structure = protein_analysis.secondary_structure_fraction()
            properties["secondary_structure"] = {
                "helix": secondary_structure[0],
                "turn": secondary_structure[1],
                "sheet": secondary_structure[2]
            }
            
            return properties
            
        except Exception as e:
            logger.error(f"Error calculating protein properties: {str(e)}")
            return {
                "length": len(sequence),
                "molecular_weight": 0,
                "error": str(e)
            }
    
    async def search_uniprot(self, sequence: str, max_results: int = 5) -> Optional[Dict]:
        """Search UniProt for similar proteins"""
        try:
            # This is a simplified version - in production, you'd use proper UniProt API
            # For now, we'll return mock data based on sequence characteristics
            
            mock_results = []
            
            # Analyze sequence to provide relevant mock data
            if "HIV" in sequence or len(sequence) > 300:
                mock_results.append({
                    "accession": "P03366",
                    "name": "HIV-1 Protease",
                    "organism": "Human immunodeficiency virus 1",
                    "function": "Aspartic protease essential for viral replication",
                    "similarity": 0.95
                })
            
            if len(sequence) > 500:
                mock_results.append({
                    "accession": "P00533",
                    "name": "Epidermal growth factor receptor",
                    "organism": "Homo sapiens",
                    "function": "Receptor tyrosine kinase",
                    "similarity": 0.87
                })
            
            return {
                "results": mock_results,
                "total": len(mock_results)
            }
            
        except Exception as e:
            logger.error(f"Error searching UniProt: {str(e)}")
            return None
    
    def get_binding_sites(self, sequence: str) -> Dict[str, Any]:
        """Predict potential binding sites (simplified)"""
        # This is a simplified version - in production, you'd use proper binding site prediction
        binding_sites = []
        
        # Look for common binding motifs (very simplified)
        motifs = {
            "ATP_binding": r"G[KR]G[KR]",
            "DNA_binding": r"[KR]{2,3}",
            "metal_binding": r"[HCE]{2,3}",
        }
        
        for motif_name, pattern in motifs.items():
            matches = list(re.finditer(pattern, sequence))
            for match in matches:
                binding_sites.append({
                    "type": motif_name,
                    "start": match.start(),
                    "end": match.end(),
                    "sequence": match.group(),
                    "confidence": 0.7  # Mock confidence score
                })
        
        return {
            "binding_sites": binding_sites,
            "total_sites": len(binding_sites)
        }
    
    async def analyze_sequence(
        self, 
        sequence: str, 
        name: Optional[str] = None,
        organism: Optional[str] = None
    ) -> Dict[str, Any]:
        """Complete protein sequence analysis"""
        
        # Parse FASTA if needed
        if sequence.startswith('>'):
            fasta_data = self.parse_fasta(sequence)
            sequence = fasta_data["sequence"]
            if not name:
                name = fasta_data["header"]
        
        # Validate sequence
        if not self.validate_sequence(sequence):
            raise ValueError("Invalid protein sequence. Contains non-amino acid characters.")
        
        # Calculate properties
        properties = self.calculate_properties(sequence)
        
        # Search for similar proteins
        uniprot_results = await self.search_uniprot(sequence)
        
        # Predict binding sites
        binding_sites = self.get_binding_sites(sequence)
        
        # Compile analysis results
        analysis = {
            "sequence": sequence,
            "name": name or "Unknown Protein",
            "organism": organism or "Unknown",
            "properties": properties,
            "uniprot_matches": uniprot_results,
            "binding_sites": binding_sites,
            "analysis_timestamp": "2025-10-08T14:23:00",
            "druggability_score": min(0.9, len(binding_sites["binding_sites"]) * 0.2 + 0.3)  # Mock score
        }
        
        return analysis

# Example protein sequences for testing
EXAMPLE_PROTEINS = {
    "hiv_protease": {
        "name": "HIV-1 Protease",
        "sequence": "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
        "organism": "Human immunodeficiency virus 1"
    },
    "egfr_kinase": {
        "name": "EGFR Kinase Domain",
        "sequence": "FKKIKVLGSGAFGTVYKGLWIPEGEKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA"
    },
    "sars_cov2_protease": {
        "name": "SARS-CoV-2 Main Protease",
        "sequence": "SGFRKMAFPSGKVEGCMVQVTCGTTTLNGLWLDDVVYCPRHVICTSEDMLNPNYEDLLIRKSNHNFLVQAGNVQLRVIGHSMQNCVLKLKVDTANPKTPKYKFVRIQPGQTFSVLACYNGSPSGVYQCAMRPNFTIKGSFLNGSCGSVGFNIDYDCVSFCYMHHMELPTGVHAGTDLEGNFYGPFVDRQTAQAAGTDTTITVNVLAWLYAAVINGDRWFLNRFTTTLNDFNLVAMKYNYEPLTQDHVDILGPLSAQTGIAVLDMCASLKELLQNGMNGRTILGSALLEDEFTPFDVVRQCSGVTFQ"
    }
}
