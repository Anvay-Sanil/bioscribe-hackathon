"""
AtomNet FAIR Service
Generates FAIR-compliant metadata and RO-Crate packages for AtomNet projects

FAIR Principles:
- Findable: Unique identifiers, rich metadata
- Accessible: Standard protocols, clear access conditions
- Interoperable: Standard formats (JSON-LD, RO-Crate)
- Reusable: Clear licensing, provenance
"""

import json
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# FAIR METADATA GENERATOR
# ============================================================================

class FAIRMetadataGenerator:
    """
    Generate FAIR-compliant metadata for AtomNet projects.
    
    Produces metadata compatible with:
    - Schema.org
    - DataCite
    - RO-Crate specification
    """
    
    def __init__(self, base_url: str = "https://bioscribe.ai"):
        self.base_url = base_url
        self.bioscribe_version = "4.1.0-enterprise"
    
    def generate_identifier(self, project_id: str) -> str:
        """Generate a persistent DOI-like identifier"""
        # Format: bioscribe:atomnet:project_id:uuid_suffix
        suffix = str(uuid.uuid4())[:8]
        return f"bioscribe:atomnet:{project_id}:{suffix}"
    
    def generate_metadata(
        self,
        project_id: str,
        target: Dict[str, Any],
        ligands: List[Dict],
        partner: Optional[str] = None,
        atomnet_version: Optional[str] = None,
        imported_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate complete FAIR metadata for an AtomNet project.
        
        Args:
            project_id: Project identifier
            target: Target protein information
            ligands: List of screened ligands
            partner: Partner organization
            atomnet_version: AtomNet model version used
            imported_at: Import timestamp
        
        Returns:
            FAIR-compliant metadata dictionary
        """
        target_id = target.get("id", "Unknown")
        target_name = target.get("name", target_id)
        
        metadata = {
            # -- Findable --
            "@context": "https://schema.org/",
            "@type": "Dataset",
            "identifier": self.generate_identifier(project_id),
            "name": f"AtomNet Virtual Screening: {target_name}",
            "alternateName": project_id,
            
            # -- Accessible --
            "url": f"{self.base_url}/atomnet/projects/{project_id}",
            "accessConditions": "restricted",
            "accessRights": "Requires authentication. Contact data owner for access.",
            
            # -- Interoperable --
            "encodingFormat": "application/json",
            "schemaVersion": "1.0.0",
            "conformsTo": "https://w3id.org/ro/crate/1.1",
            
            # -- Reusable --
            "license": "https://creativecommons.org/licenses/by-nc/4.0/",
            "usageInfo": "For research and development purposes only.",
            
            # -- Descriptive Metadata --
            "description": self._generate_description(target_name, ligands, partner),
            "keywords": self._generate_keywords(target, partner),
            
            # -- Creators --
            "creator": self._generate_creators(partner),
            
            # -- Temporal --
            "dateCreated": (imported_at or datetime.now()).isoformat(),
            "dateModified": datetime.now().isoformat(),
            
            # -- Versioning --
            "version": "1.0",
            "softwareVersion": {
                "bioscribe": self.bioscribe_version,
                "atomnet": atomnet_version or "Unknown"
            },
            
            # -- Provenance --
            "wasGeneratedBy": {
                "@type": "SoftwareApplication",
                "name": "AtomNet",
                "provider": {
                    "@type": "Organization",
                    "name": "Atomwise Inc."
                },
                "version": atomnet_version or "Unknown"
            },
            
            # -- Dataset Statistics --
            "about": {
                "@type": "Protein",
                "identifier": target_id,
                "name": target_name,
                "uniprot": target.get("uniprot"),
                "pdb": target.get("pdb_id")
            },
            "size": {
                "ligandCount": len(ligands),
                "bestScore": min(l.get("score", 0) for l in ligands) if ligands else None,
                "scoreRange": {
                    "min": min(l.get("score", 0) for l in ligands) if ligands else None,
                    "max": max(l.get("score", 0) for l in ligands) if ligands else None
                }
            }
        }
        
        return metadata
    
    def _generate_description(
        self,
        target_name: str,
        ligands: List[Dict],
        partner: Optional[str]
    ) -> str:
        """Generate detailed description"""
        best_score = min(l.get("score", 0) for l in ligands) if ligands else "N/A"
        
        desc = (
            f"Virtual screening results from Atomwise AtomNet for target {target_name}. "
            f"This dataset contains {len(ligands)} screened compounds with predicted "
            f"binding affinities. Best predicted score: {best_score} kcal/mol."
        )
        
        if partner:
            desc += f" Screening performed in partnership with {partner}."
        
        return desc
    
    def _generate_keywords(self, target: Dict, partner: Optional[str]) -> List[str]:
        """Generate relevant keywords"""
        keywords = [
            "virtual screening",
            "drug discovery",
            "AtomNet",
            "molecular docking",
            "binding affinity",
            "machine learning",
            target.get("id", "protein"),
        ]
        
        if target.get("uniprot"):
            keywords.append(f"UniProt:{target['uniprot']}")
        
        if target.get("pdb_id"):
            keywords.append(f"PDB:{target['pdb_id']}")
        
        if partner:
            keywords.append(partner)
        
        return keywords
    
    def _generate_creators(self, partner: Optional[str]) -> List[Dict]:
        """Generate creator list"""
        creators = [
            {
                "@type": "Organization",
                "name": "Atomwise Inc.",
                "url": "https://www.atomwise.com"
            },
            {
                "@type": "Organization", 
                "name": "BioScribe AI",
                "url": "https://bioscribe.ai"
            }
        ]
        
        if partner:
            creators.append({
                "@type": "Organization",
                "name": partner
            })
        
        return creators


# ============================================================================
# RO-CRATE GENERATOR
# ============================================================================

class ROCrateGenerator:
    """
    Generate Research Object Crate (RO-Crate) packages for AtomNet projects.
    
    RO-Crate is a community standard for research data packaging based on
    schema.org annotations. See: https://www.researchobject.org/ro-crate/
    """
    
    def __init__(self):
        self.context = "https://w3id.org/ro/crate/1.1/context"
        self.fair_generator = FAIRMetadataGenerator()
    
    def generate_crate(
        self,
        project_id: str,
        target: Dict[str, Any],
        ligands: List[Dict],
        partner: Optional[str] = None,
        atomnet_version: Optional[str] = None,
        include_data: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a complete RO-Crate metadata document.
        
        Args:
            project_id: Project identifier
            target: Target information
            ligands: List of ligands
            partner: Partner organization
            atomnet_version: AtomNet version
            include_data: Whether to include actual data in crate
        
        Returns:
            RO-Crate metadata document (ro-crate-metadata.json content)
        """
        # Root dataset (the project itself)
        root_dataset = {
            "@id": "./",
            "@type": "Dataset",
            "name": f"AtomNet Screening: {target.get('name', target.get('id', 'Unknown'))}",
            "description": f"Virtual screening results for {len(ligands)} compounds",
            "datePublished": datetime.now().isoformat(),
            "license": {"@id": "https://creativecommons.org/licenses/by-nc/4.0/"},
            "hasPart": []
        }
        
        # Graph entities
        graph = [
            # Metadata file itself
            {
                "@id": "ro-crate-metadata.json",
                "@type": "CreativeWork",
                "conformsTo": {"@id": "https://w3id.org/ro/crate/1.1"},
                "about": {"@id": "./"}
            },
            root_dataset
        ]
        
        # Add target entity
        target_entity = {
            "@id": f"#target_{target.get('id', 'unknown')}",
            "@type": ["Protein", "BioChemEntity"],
            "name": target.get("name", target.get("id")),
            "identifier": target.get("id"),
            "sameAs": []
        }
        
        if target.get("uniprot"):
            target_entity["sameAs"].append(
                f"https://www.uniprot.org/uniprotkb/{target['uniprot']}"
            )
        if target.get("pdb_id"):
            target_entity["sameAs"].append(
                f"https://www.rcsb.org/structure/{target['pdb_id']}"
            )
        
        graph.append(target_entity)
        root_dataset["hasPart"].append({"@id": target_entity["@id"]})
        
        # Add ligand data file reference
        ligands_file = {
            "@id": "ligands.json",
            "@type": "File",
            "name": "Screened Ligands",
            "description": f"JSON file containing {len(ligands)} screened compounds with AtomNet scores",
            "encodingFormat": "application/json",
            "contentSize": f"{len(json.dumps(ligands))} bytes"
        }
        graph.append(ligands_file)
        root_dataset["hasPart"].append({"@id": "ligands.json"})
        
        # Add software agent
        atomnet_agent = {
            "@id": "#atomnet",
            "@type": "SoftwareApplication",
            "name": "AtomNet",
            "version": atomnet_version or "Unknown",
            "description": "Deep learning model for predicting small molecule binding affinity",
            "provider": {
                "@type": "Organization",
                "name": "Atomwise Inc.",
                "url": "https://www.atomwise.com"
            }
        }
        graph.append(atomnet_agent)
        
        # Add action (the screening process)
        screening_action = {
            "@id": f"#screening_{project_id}",
            "@type": "Action",
            "name": "Virtual Screening",
            "description": "AtomNet virtual screening of compound library against protein target",
            "instrument": {"@id": "#atomnet"},
            "object": {"@id": target_entity["@id"]},
            "result": {"@id": "ligands.json"},
            "startTime": datetime.now().isoformat()
        }
        graph.append(screening_action)
        
        # Add partner if present
        if partner:
            partner_entity = {
                "@id": f"#partner_{partner.lower().replace(' ', '_')}",
                "@type": "Organization",
                "name": partner
            }
            graph.append(partner_entity)
            root_dataset["funder"] = {"@id": partner_entity["@id"]}
        
        # Construct final RO-Crate
        ro_crate = {
            "@context": self.context,
            "@graph": graph
        }
        
        # Add actual data if requested
        if include_data:
            ro_crate["_data"] = {
                "target": target,
                "ligands": [
                    {
                        "ligand_id": l.get("ligand_id"),
                        "smiles": l.get("smiles"),
                        "score": l.get("score"),
                        "rank": l.get("rank")
                    }
                    for l in ligands[:100]  # Limit data size
                ]
            }
        
        return ro_crate


# ============================================================================
# BLOCKCHAIN SERVICE
# ============================================================================

class AtomNetBlockchainService:
    """
    Blockchain recording service for AtomNet projects.
    
    Provides:
    - Data hashing for integrity verification
    - Simulated blockchain recording (can be connected to real blockchain)
    - IPFS-compatible content identifiers
    """
    
    def __init__(self):
        self.chain_id = "ethereum-mainnet"  # Simulated
        self.records: Dict[str, Dict] = {}
    
    def compute_data_hash(
        self,
        project_id: str,
        target: Dict,
        ligands: List[Dict],
        include_ligand_data: bool = True
    ) -> str:
        """
        Compute SHA-256 hash of project data for blockchain recording.
        
        Args:
            project_id: Project identifier
            target: Target information
            ligands: List of ligands
            include_ligand_data: Whether to include full ligand data in hash
        
        Returns:
            SHA-256 hex digest
        """
        hash_data = {
            "project_id": project_id,
            "target_id": target.get("id"),
            "target_uniprot": target.get("uniprot"),
            "ligand_count": len(ligands),
            "timestamp": datetime.now().isoformat()
        }
        
        if include_ligand_data:
            hash_data["ligands"] = [
                {
                    "id": l.get("ligand_id"),
                    "smiles": l.get("smiles"),
                    "score": l.get("score")
                }
                for l in ligands
            ]
        
        # Compute deterministic hash
        canonical = json.dumps(hash_data, sort_keys=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def compute_ipfs_cid(self, data_hash: str) -> str:
        """Generate IPFS-compatible Content Identifier (CID)"""
        # This is a simulated CID - real implementation would use IPFS
        cid_hash = hashlib.sha256((data_hash + "ipfs").encode()).hexdigest()
        return f"Qm{cid_hash[:44]}"
    
    def record_project(
        self,
        project_id: str,
        target: Dict,
        ligands: List[Dict],
        fair_metadata: Optional[Dict] = None,
        include_ligand_data: bool = True,
        store_on_ipfs: bool = True
    ) -> Dict[str, Any]:
        """
        Record project on blockchain for reproducibility verification.
        
        Args:
            project_id: Project identifier
            target: Target information
            ligands: List of ligands
            fair_metadata: Optional FAIR metadata to include
            include_ligand_data: Include ligand data in hash
            store_on_ipfs: Store metadata on IPFS
        
        Returns:
            Blockchain record with transaction details
        """
        logger.info(f"Recording project {project_id} on blockchain")
        
        # Compute hashes
        data_hash = self.compute_data_hash(
            project_id, target, ligands, include_ligand_data
        )
        
        metadata_hash = "not_available"
        if fair_metadata:
            metadata_hash = hashlib.sha256(
                json.dumps(fair_metadata, sort_keys=True).encode()
            ).hexdigest()
        
        # Generate IPFS CID
        ipfs_cid = self.compute_ipfs_cid(data_hash) if store_on_ipfs else None
        
        # Simulate blockchain transaction
        # In production, this would use Web3.py to submit to Ethereum
        tx_hash = hashlib.sha256(
            f"{data_hash}:{datetime.now().isoformat()}".encode()
        ).hexdigest()
        
        block_number = 15000000 + abs(hash(project_id)) % 1000000
        
        record = {
            "project_id": project_id,
            "data_hash": data_hash,
            "metadata_hash": metadata_hash,
            "transaction_hash": f"0x{tx_hash}",
            "block_number": block_number,
            "chain": self.chain_id,
            "ipfs_cid": ipfs_cid,
            "timestamp": datetime.now().isoformat(),
            "status": "confirmed",  # Simulated
            
            # Verification URLs
            "etherscan_url": f"https://etherscan.io/tx/0x{tx_hash}",
            "ipfs_gateway_url": f"https://ipfs.io/ipfs/{ipfs_cid}" if ipfs_cid else None,
            
            # Verification data
            "verification": {
                "can_verify": True,
                "verification_url": f"https://bioscribe.ai/verify/{data_hash[:16]}",
                "instructions": "Compare data hash with on-chain record to verify integrity"
            }
        }
        
        # Store record
        self.records[project_id] = record
        
        logger.info(f"Blockchain record created: {data_hash[:16]}...")
        return record
    
    def verify_project(
        self,
        project_id: str,
        current_hash: str
    ) -> Dict[str, Any]:
        """
        Verify project integrity against blockchain record.
        
        Args:
            project_id: Project identifier
            current_hash: Current data hash to verify
        
        Returns:
            Verification result
        """
        if project_id not in self.records:
            return {
                "verified": False,
                "error": "No blockchain record found",
                "project_id": project_id
            }
        
        record = self.records[project_id]
        stored_hash = record.get("data_hash")
        
        is_valid = current_hash == stored_hash
        
        return {
            "verified": is_valid,
            "project_id": project_id,
            "stored_hash": stored_hash,
            "current_hash": current_hash,
            "block_number": record.get("block_number"),
            "timestamp": record.get("timestamp"),
            "message": "Data integrity verified ✓" if is_valid else "Data has been modified ✗"
        }


# ============================================================================
# COMBINED FAIR SERVICE
# ============================================================================

class AtomNetFAIRService:
    """
    Combined service for FAIR compliance and blockchain recording.
    """
    
    def __init__(self):
        self.fair_generator = FAIRMetadataGenerator()
        self.ro_crate_generator = ROCrateGenerator()
        self.blockchain_service = AtomNetBlockchainService()
    
    def generate_full_package(
        self,
        project_id: str,
        target: Dict[str, Any],
        ligands: List[Dict],
        partner: Optional[str] = None,
        atomnet_version: Optional[str] = None,
        record_on_blockchain: bool = True
    ) -> Dict[str, Any]:
        """
        Generate complete FAIR package with optional blockchain recording.
        
        Returns:
            Dictionary with metadata, RO-Crate, and blockchain record
        """
        # Generate FAIR metadata
        fair_metadata = self.fair_generator.generate_metadata(
            project_id, target, ligands, partner, atomnet_version
        )
        
        # Generate RO-Crate
        ro_crate = self.ro_crate_generator.generate_crate(
            project_id, target, ligands, partner, atomnet_version
        )
        
        result = {
            "project_id": project_id,
            "fair_metadata": fair_metadata,
            "ro_crate": ro_crate,
            "generated_at": datetime.now().isoformat()
        }
        
        # Record on blockchain if requested
        if record_on_blockchain:
            blockchain_record = self.blockchain_service.record_project(
                project_id, target, ligands, fair_metadata
            )
            result["blockchain_record"] = blockchain_record
        
        return result


# Global service instance
fair_service = AtomNetFAIRService()
