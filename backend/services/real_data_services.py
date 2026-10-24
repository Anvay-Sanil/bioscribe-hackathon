"""
Real Data Services for Lab-Ready BioScribe AI
Integrates with actual databases and APIs for production use
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Any
import json
import re
from datetime import datetime
import hashlib

logger = logging.getLogger(__name__)

class UniProtService:
    """Real UniProt database integration"""
    
    BASE_URL = "https://rest.uniprot.org"
    
    async def search_protein(self, query: str) -> List[Dict[str, Any]]:
        """Search UniProt database for proteins"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/uniprotkb/search"
                params = {
                    "query": query,
                    "format": "json",
                    "size": "10"
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_uniprot_results(data.get("results", []))
                    else:
                        logger.error(f"UniProt API error: {response.status}")
                        return []
        except Exception as e:
            logger.error(f"UniProt search failed: {e}")
            return []
    
    async def get_protein_details(self, uniprot_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed protein information from UniProt"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/uniprotkb/{uniprot_id}"
                params = {"format": "json"}
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_protein_details(data)
                    else:
                        return None
        except Exception as e:
            logger.error(f"UniProt details fetch failed: {e}")
            return None
    
    def _parse_uniprot_results(self, results: List[Dict]) -> List[Dict[str, Any]]:
        """Parse UniProt search results"""
        parsed = []
        for result in results:
            try:
                parsed.append({
                    "id": result.get("primaryAccession", ""),
                    "name": result.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", "Unknown"),
                    "organism": result.get("organism", {}).get("scientificName", "Unknown"),
                    "sequence": result.get("sequence", {}).get("value", ""),
                    "length": result.get("sequence", {}).get("length", 0),
                    "mass": result.get("sequence", {}).get("molWeight", 0),
                    "gene": result.get("genes", [{}])[0].get("geneName", {}).get("value", "") if result.get("genes") else "",
                    "function": self._extract_function(result),
                    "source": "uniprot"
                })
            except Exception as e:
                logger.warning(f"Failed to parse UniProt result: {e}")
                continue
        return parsed
    
    def _parse_protein_details(self, data: Dict) -> Dict[str, Any]:
        """Parse detailed protein information"""
        return {
            "id": data.get("primaryAccession", ""),
            "name": data.get("proteinDescription", {}).get("recommendedName", {}).get("fullName", {}).get("value", "Unknown"),
            "organism": data.get("organism", {}).get("scientificName", "Unknown"),
            "sequence": data.get("sequence", {}).get("value", ""),
            "length": data.get("sequence", {}).get("length", 0),
            "mass": data.get("sequence", {}).get("molWeight", 0),
            "gene": data.get("genes", [{}])[0].get("geneName", {}).get("value", "") if data.get("genes") else "",
            "function": self._extract_function(data),
            "keywords": [kw.get("value", "") for kw in data.get("keywords", [])],
            "features": self._extract_features(data),
            "source": "uniprot"
        }
    
    def _extract_function(self, data: Dict) -> str:
        """Extract protein function description"""
        comments = data.get("comments", [])
        for comment in comments:
            if comment.get("commentType") == "FUNCTION":
                return comment.get("texts", [{}])[0].get("value", "")
        return "Function unknown"
    
    def _extract_features(self, data: Dict) -> List[Dict]:
        """Extract protein features"""
        features = []
        for feature in data.get("features", []):
            features.append({
                "type": feature.get("type", ""),
                "description": feature.get("description", ""),
                "begin": feature.get("location", {}).get("start", {}).get("value"),
                "end": feature.get("location", {}).get("end", {}).get("value")
            })
        return features


class AlphaFoldService:
    """Real AlphaFold database integration"""
    
    BASE_URL = "https://alphafold.ebi.ac.uk/api"
    
    async def get_structure_prediction(self, uniprot_id: str) -> Optional[Dict[str, Any]]:
        """Get AlphaFold structure prediction"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/prediction/{uniprot_id}"
                
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_alphafold_data(data[0] if isinstance(data, list) else data)
                    else:
                        logger.warning(f"No AlphaFold structure for {uniprot_id}")
                        return None
        except Exception as e:
            logger.error(f"AlphaFold API error: {e}")
            return None
    
    def _parse_alphafold_data(self, data: Dict) -> Dict[str, Any]:
        """Parse AlphaFold structure data"""
        return {
            "uniprot_id": data.get("uniprotAccession", ""),
            "model_version": data.get("modelCreatedDate", ""),
            "confidence_version": data.get("latestVersion", ""),
            "pdb_url": data.get("pdbUrl", ""),
            "cif_url": data.get("cifUrl", ""),
            "confidence_scores": data.get("confidenceScore", []),
            "organism": data.get("organismScientificName", ""),
            "gene": data.get("uniprotDescription", ""),
            "model_quality": self._assess_model_quality(data.get("confidenceScore", [])),
            "source": "alphafold"
        }
    
    def _assess_model_quality(self, confidence_scores: List[float]) -> str:
        """Assess overall model quality"""
        if not confidence_scores:
            return "unknown"
        
        avg_confidence = sum(confidence_scores) / len(confidence_scores)
        if avg_confidence > 90:
            return "very_high"
        elif avg_confidence > 70:
            return "confident"
        elif avg_confidence > 50:
            return "low"
        else:
            return "very_low"


class PDBService:
    """Real Protein Data Bank integration"""
    
    BASE_URL = "https://data.rcsb.org/rest/v1"
    SEARCH_URL = "https://search.rcsb.org/rcsbsearch/v2/query"
    
    async def search_structures(self, query: str) -> List[Dict[str, Any]]:
        """Search PDB for protein structures"""
        try:
            search_query = {
                "query": {
                    "type": "terminal",
                    "service": "text",
                    "parameters": {
                        "attribute": "struct.title",
                        "operator": "contains_phrase",
                        "value": query
                    }
                },
                "return_type": "entry",
                "request_options": {
                    "return_all_hits": False,
                    "results_verbosity": "minimal"
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.SEARCH_URL, json=search_query) as response:
                    if response.status == 200:
                        data = await response.json()
                        pdb_ids = [hit["identifier"] for hit in data.get("result_set", [])]
                        return await self._get_structure_details(pdb_ids[:10])
                    else:
                        return []
        except Exception as e:
            logger.error(f"PDB search failed: {e}")
            return []
    
    async def _get_structure_details(self, pdb_ids: List[str]) -> List[Dict[str, Any]]:
        """Get detailed information for PDB structures"""
        structures = []
        async with aiohttp.ClientSession() as session:
            for pdb_id in pdb_ids:
                try:
                    url = f"{self.BASE_URL}/core/entry/{pdb_id}"
                    async with session.get(url) as response:
                        if response.status == 200:
                            data = await response.json()
                            structures.append(self._parse_pdb_structure(data))
                except Exception as e:
                    logger.warning(f"Failed to get PDB details for {pdb_id}: {e}")
                    continue
        return structures
    
    def _parse_pdb_structure(self, data: Dict) -> Dict[str, Any]:
        """Parse PDB structure data"""
        return {
            "pdb_id": data.get("rcsb_id", ""),
            "title": data.get("struct", {}).get("title", ""),
            "method": data.get("exptl", [{}])[0].get("method", "") if data.get("exptl") else "",
            "resolution": data.get("rcsb_entry_info", {}).get("resolution_combined", [None])[0],
            "organism": self._extract_organism(data),
            "chains": data.get("rcsb_entry_info", {}).get("polymer_entity_count_protein", 0),
            "ligands": data.get("rcsb_entry_info", {}).get("bound_molecule_count", 0),
            "deposition_date": data.get("rcsb_accession_info", {}).get("initial_release_date", ""),
            "source": "pdb"
        }
    
    def _extract_organism(self, data: Dict) -> str:
        """Extract organism information from PDB data"""
        try:
            entity_src_gen = data.get("entity_src_gen", [])
            if entity_src_gen:
                return entity_src_gen[0].get("pdbx_gene_src_scientific_name", "Unknown")
            return "Unknown"
        except:
            return "Unknown"


class ChEMBLService:
    """Real ChEMBL database integration for drug compounds"""
    
    BASE_URL = "https://www.ebi.ac.uk/chembl/api/data"
    
    async def search_compounds(self, target_name: str) -> List[Dict[str, Any]]:
        """Search ChEMBL for compounds targeting specific proteins"""
        try:
            # First find the target
            target_id = await self._find_target(target_name)
            if not target_id:
                return []
            
            # Then find compounds for this target
            return await self._get_target_compounds(target_id)
            
        except Exception as e:
            logger.error(f"ChEMBL search failed: {e}")
            return []
    
    async def _find_target(self, target_name: str) -> Optional[str]:
        """Find ChEMBL target ID"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/target/search.json"
                params = {"q": target_name, "limit": 1}
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        targets = data.get("targets", [])
                        return targets[0].get("target_chembl_id") if targets else None
        except Exception as e:
            logger.error(f"ChEMBL target search failed: {e}")
            return None
    
    async def _get_target_compounds(self, target_id: str) -> List[Dict[str, Any]]:
        """Get compounds for a specific target"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.BASE_URL}/activity.json"
                params = {
                    "target_chembl_id": target_id,
                    "limit": 50,
                    "standard_type": "IC50"
                }
                
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_chembl_compounds(data.get("activities", []))
        except Exception as e:
            logger.error(f"ChEMBL compounds fetch failed: {e}")
            return []
    
    def _parse_chembl_compounds(self, activities: List[Dict]) -> List[Dict[str, Any]]:
        """Parse ChEMBL compound data"""
        compounds = []
        for activity in activities:
            try:
                molecule = activity.get("molecule_chembl_id", "")
                if molecule:
                    compounds.append({
                        "chembl_id": molecule,
                        "smiles": activity.get("canonical_smiles", ""),
                        "activity_value": activity.get("standard_value"),
                        "activity_unit": activity.get("standard_units", ""),
                        "activity_type": activity.get("standard_type", ""),
                        "assay_description": activity.get("assay_description", ""),
                        "source": "chembl"
                    })
            except Exception as e:
                logger.warning(f"Failed to parse ChEMBL compound: {e}")
                continue
        return compounds


class RealDataIntegrationService:
    """Main service orchestrating all real data sources"""
    
    def __init__(self):
        self.uniprot = UniProtService()
        self.alphafold = AlphaFoldService()
        self.pdb = PDBService()
        self.chembl = ChEMBLService()
    
    async def comprehensive_protein_analysis(self, query: str) -> Dict[str, Any]:
        """Perform comprehensive real-time protein analysis"""
        logger.info(f"Starting comprehensive analysis for: {query}")
        
        # Run all searches in parallel
        tasks = [
            self.uniprot.search_protein(query),
            self.pdb.search_structures(query),
        ]
        
        uniprot_results, pdb_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        if isinstance(uniprot_results, Exception):
            logger.error(f"UniProt search failed: {uniprot_results}")
            uniprot_results = []
        
        if isinstance(pdb_results, Exception):
            logger.error(f"PDB search failed: {pdb_results}")
            pdb_results = []
        
        # Get AlphaFold data for top UniProt result
        alphafold_data = None
        if uniprot_results:
            top_protein = uniprot_results[0]
            alphafold_data = await self.alphafold.get_structure_prediction(top_protein["id"])
        
        # Get ChEMBL compounds for the protein
        chembl_compounds = []
        if uniprot_results:
            chembl_compounds = await self.chembl.search_compounds(uniprot_results[0]["name"])
        
        return {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "uniprot_proteins": uniprot_results,
            "pdb_structures": pdb_results,
            "alphafold_prediction": alphafold_data,
            "known_compounds": chembl_compounds,
            "analysis_id": hashlib.md5(f"{query}_{datetime.now()}".encode()).hexdigest()[:8],
            "data_sources": ["uniprot", "pdb", "alphafold", "chembl"],
            "real_time": True
        }
    
    async def get_protein_structure_data(self, uniprot_id: str) -> Dict[str, Any]:
        """Get comprehensive structure data for a protein"""
        tasks = [
            self.uniprot.get_protein_details(uniprot_id),
            self.alphafold.get_structure_prediction(uniprot_id)
        ]
        
        protein_details, alphafold_data = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            "uniprot_id": uniprot_id,
            "protein_details": protein_details if not isinstance(protein_details, Exception) else None,
            "alphafold_prediction": alphafold_data if not isinstance(alphafold_data, Exception) else None,
            "timestamp": datetime.now().isoformat()
        }
    
    async def validate_protein_sequence(self, sequence: str) -> Dict[str, Any]:
        """Validate and analyze protein sequence"""
        # Basic validation
        valid_aa = set("ACDEFGHIKLMNPQRSTVWY")
        clean_sequence = re.sub(r'[^ACDEFGHIKLMNPQRSTVWY]', '', sequence.upper())
        
        is_valid = len(clean_sequence) > 0 and all(aa in valid_aa for aa in clean_sequence)
        
        analysis = {
            "is_valid": is_valid,
            "original_length": len(sequence),
            "clean_sequence": clean_sequence,
            "clean_length": len(clean_sequence),
            "composition": self._analyze_composition(clean_sequence) if is_valid else {},
            "molecular_weight": self._calculate_molecular_weight(clean_sequence) if is_valid else 0,
            "validation_timestamp": datetime.now().isoformat()
        }
        
        return analysis
    
    def _analyze_composition(self, sequence: str) -> Dict[str, float]:
        """Analyze amino acid composition"""
        if not sequence:
            return {}
        
        composition = {}
        for aa in "ACDEFGHIKLMNPQRSTVWY":
            count = sequence.count(aa)
            composition[aa] = round(count / len(sequence) * 100, 2)
        
        return composition
    
    def _calculate_molecular_weight(self, sequence: str) -> float:
        """Calculate molecular weight of protein sequence"""
        aa_weights = {
            'A': 89.1, 'R': 174.2, 'N': 132.1, 'D': 133.1, 'C': 121.2,
            'Q': 146.2, 'E': 147.1, 'G': 75.1, 'H': 155.2, 'I': 131.2,
            'L': 131.2, 'K': 146.2, 'M': 149.2, 'F': 165.2, 'P': 115.1,
            'S': 105.1, 'T': 119.1, 'W': 204.2, 'Y': 181.2, 'V': 117.1
        }
        
        weight = sum(aa_weights.get(aa, 0) for aa in sequence)
        # Subtract water molecules (n-1 peptide bonds)
        if len(sequence) > 1:
            weight -= (len(sequence) - 1) * 18.015
        
        return round(weight, 2)
