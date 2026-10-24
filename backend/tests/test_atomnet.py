"""
AtomNet API Integration Tests
Comprehensive testing for AtomNet integration endpoints
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main_enterprise import app

client = TestClient(app)


# ============================================================================
# SAMPLE TEST DATA
# ============================================================================

VALID_ATOMNET_PROJECT = {
    "project": {
        "project_id": "test_abl1_20231201",
        "target": {
            "id": "ABL1_HUMAN",
            "name": "Tyrosine-protein kinase ABL1",
            "uniprot": "P00519",
            "pdb_id": "2HYY",
            "sequence": "MGLPNSSSGSKWRPKSGNKKKKEKQQEKERDRFHPLQNQRQILNALSRQHSAYQLNSKNTFHCEEMGPPTTRHGGNPTIIHKYVPSIQHNIPVIPSSAVSIGQTEIQLSDLLVRQLSSLQPPSKGSFKLWAHGGLPVRGRLERLKGRGFRGDIRGLPQGRYNNPFSAIREGDSLVCTIKAKVLDLNNAIKRVNCGFFQTNKYLYTVLVPVLQEPVKYPLVNLSQHDPLRMLNSSLTIQLLPNHIQYQAPWFSVLEAELTSQLAPQVLALYNLIIDLPVTTPQVKHAILNLILESGRLVKRFGFEDQLRNLGPPSKLQSMLKQLERQQLLLQEMTTFFQPEEYNKEISKFAVVHPMRSKLLQLLLTGLRPGSGQPKQGRLQHMQSQQQLQRMLPPPPKTTRKLL"
        },
        "ligands": [
            {
                "ligand_id": "LIG001",
                "smiles": "CC(=O)Oc1ccccc1C(=O)O",
                "score": -9.8,
                "rank": 1,
                "metadata": {
                    "library_id": "enamine_2025",
                    "batch": "A",
                    "source": "AtomNet"
                }
            },
            {
                "ligand_id": "LIG002",
                "smiles": "Cc1ccc(NC(=O)c2ccccc2)cc1",
                "score": -9.2,
                "rank": 2,
                "metadata": {
                    "library_id": "enamine_2025",
                    "batch": "A",
                    "source": "AtomNet"
                }
            },
            {
                "ligand_id": "LIG003",
                "smiles": "c1ccc2c(c1)ccc3ccccc32",
                "score": -8.7,
                "rank": 3,
                "metadata": {
                    "library_id": "enamine_2025",
                    "batch": "B",
                    "source": "AtomNet"
                }
            }
        ],
        "docking_poses": [
            {
                "ligand_id": "LIG001",
                "pose_id": "LIG001_P1",
                "format": "pdbqt",
                "data_url": "s3://test-bucket/poses/LIG001_P1.pdbqt"
            }
        ],
        "partner": "Test Partner",
        "campaign_name": "Test Campaign",
        "atomnet_version": "AtomNet v2.0"
    },
    "trigger_xai": True,
    "trigger_fair": True,
    "trigger_blockchain": False
}


class TestAtomNetImport:
    """Test AtomNet import endpoint"""
    
    def test_import_valid_project(self):
        """Test importing a valid AtomNet project"""
        response = client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["project_id"] == "test_abl1_20231201"
        assert data["ligand_count"] == 3
        assert "timestamp" in data
    
    def test_import_empty_ligands(self):
        """Test that import fails with empty ligands list"""
        invalid_project = {
            "project": {
                "project_id": "test_empty",
                "target": {
                    "id": "TEST_TARGET"
                },
                "ligands": []
            }
        }
        response = client.post("/api/atomnet/import", json=invalid_project)
        assert response.status_code == 422  # Validation error
    
    def test_import_invalid_smiles(self):
        """Test that import validates SMILES"""
        invalid_project = {
            "project": {
                "project_id": "test_invalid_smiles",
                "target": {"id": "TEST"},
                "ligands": [
                    {
                        "ligand_id": "LIG001",
                        "smiles": "",  # Empty SMILES
                        "score": -9.0,
                        "rank": 1
                    }
                ]
            }
        }
        response = client.post("/api/atomnet/import", json=invalid_project)
        assert response.status_code == 422


class TestAtomNetProjects:
    """Test AtomNet project listing and retrieval"""
    
    def test_list_projects(self):
        """Test listing all AtomNet projects"""
        # First import a project
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        # Then list
        response = client.get("/api/atomnet/projects")
        assert response.status_code == 200
        data = response.json()
        
        assert "projects" in data
        assert "total_count" in data
        assert isinstance(data["projects"], list)
    
    def test_get_project_details(self):
        """Test retrieving a specific project"""
        # Import first
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        # Get project
        response = client.get("/api/atomnet/projects/test_abl1_20231201")
        assert response.status_code == 200
        data = response.json()
        
        assert data["project_id"] == "test_abl1_20231201"
        assert "target" in data
        assert "ligands" in data
        assert len(data["ligands"]) == 3
        assert data["target"]["id"] == "ABL1_HUMAN"
    
    def test_get_nonexistent_project(self):
        """Test that fetching non-existent project returns 404"""
        response = client.get("/api/atomnet/projects/nonexistent_project")
        assert response.status_code == 404


class TestAtomNetXAI:
    """Test AtomNet XAI explanation generation"""
    
    def test_generate_xai_explanations(self):
        """Test generating XAI explanations for ligands"""
        # Import project first
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        # Generate XAI
        response = client.post(
            "/api/atomnet/projects/test_abl1_20231201/xai",
            json={"ligand_ids": ["LIG001", "LIG002"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["project_id"] == "test_abl1_20231201"
        assert "explanations" in data
        assert data["surrogate_trained"] is True
    
    def test_xai_explanation_content(self):
        """Test that XAI explanations contain expected fields"""
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        response = client.post(
            "/api/atomnet/projects/test_abl1_20231201/xai",
            json={"ligand_ids": ["LIG001"]}
        )
        data = response.json()
        
        assert len(data["explanations"]) >= 1
        explanation = data["explanations"][0]
        
        assert "ligand_id" in explanation
        assert "fragment_contributions" in explanation
        assert "residue_contacts" in explanation
        assert "explanation_summary" in explanation
        assert "confidence" in explanation


class TestAtomNetFAIR:
    """Test FAIR metadata generation"""
    
    def test_get_fair_metadata(self):
        """Test generating FAIR metadata for a project"""
        # Import project
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        # Get FAIR metadata
        response = client.get("/api/atomnet/projects/test_abl1_20231201/fair")
        assert response.status_code == 200
        data = response.json()
        
        assert "identifier" in data
        assert "title" in data
        assert "creators" in data
        assert "description" in data
        assert "AtomNet" in data["title"]


class TestAtomNetBlockchain:
    """Test blockchain recording"""
    
    def test_record_on_blockchain(self):
        """Test recording project on blockchain"""
        # Import project
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        # Record on blockchain
        response = client.post(
            "/api/atomnet/projects/test_abl1_20231201/blockchain",
            json={"include_ligand_data": True}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "data_hash" in data
        assert "transaction_hash" in data
        assert "project_id" in data
        assert len(data["data_hash"]) == 64  # SHA256 hex


class TestAtomNetReports:
    """Test report generation"""
    
    def test_get_json_report(self):
        """Test JSON report generation"""
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        response = client.get("/api/atomnet/projects/test_abl1_20231201/reports?format=json")
        assert response.status_code == 200
        data = response.json()
        
        assert "reports" in data
        assert "json" in data["reports"]
    
    def test_get_csv_report(self):
        """Test CSV report generation"""
        client.post("/api/atomnet/import", json=VALID_ATOMNET_PROJECT)
        
        response = client.get("/api/atomnet/projects/test_abl1_20231201/reports?format=csv")
        assert response.status_code == 200
        data = response.json()
        
        assert "reports" in data
        assert "csv" in data["reports"]
        assert "LIG001" in data["reports"]["csv"]


class TestHealthCheck:
    """Test health check includes AtomNet"""
    
    def test_atomnet_in_health(self):
        """Test that AtomNet appears in health check"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert "services" in data
        assert "atomnet_integration" in data["services"]
        assert data["services"]["atomnet_integration"] == "operational"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
