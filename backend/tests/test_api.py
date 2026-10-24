"""
BioScribe AI - API Integration Tests
Comprehensive testing for all API endpoints
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main_real import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health and status endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns correct information"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["version"] == "3.0.0-real"
        assert data["real_processing"] is True
        assert "documentation" in data
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "metrics" in data
        assert "services" in data
        assert data["services"]["protein_analysis"] == "operational"


class TestProteinAnalysis:
    """Test protein analysis endpoints"""
    
    def test_analyze_valid_protein(self):
        """Test protein analysis with valid sequence"""
        payload = {
            "sequence": "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL",
            "name": "Test Protein",
            "organism": "Test Organism"
        }
        response = client.post("/api/ai/analyze-protein", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "sequence" in data
        assert "molecular_properties" in data
        assert "binding_sites" in data
        assert "druggability_score" in data
        assert data["real_analysis"] is True
    
    def test_analyze_short_sequence(self):
        """Test protein analysis with too short sequence"""
        payload = {
            "sequence": "MKTA",
            "name": "Short Protein"
        }
        response = client.post("/api/ai/analyze-protein", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_analyze_invalid_sequence(self):
        """Test protein analysis with invalid characters"""
        payload = {
            "sequence": "MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL123",
            "name": "Invalid Protein"
        }
        response = client.post("/api/ai/analyze-protein", json=payload)
        # Should still work as validator cleans the sequence
        assert response.status_code in [200, 422]
    
    def test_analyze_hiv_protease(self):
        """Test with HIV protease example"""
        payload = {
            "sequence": "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
            "name": "HIV-1 Protease",
            "organism": "Human immunodeficiency virus 1"
        }
        response = client.post("/api/ai/analyze-protein", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "HIV-1 Protease"
        assert len(data["sequence"]) == 99


class TestMoleculeGeneration:
    """Test molecule generation endpoints"""
    
    def test_generate_molecules_valid(self):
        """Test molecule generation with valid input"""
        payload = {
            "sequence": "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
            "name": "HIV-1 Protease",
            "num_molecules": 5
        }
        response = client.post("/api/ai/generate-molecules", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "candidates" in data
        assert "best_candidate" in data
        assert "protein_analysis" in data
        assert len(data["candidates"]) == 5
        assert data["real_generation"] is True
    
    def test_generate_molecules_max_limit(self):
        """Test molecule generation with maximum molecules"""
        payload = {
            "sequence": "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
            "num_molecules": 10
        }
        response = client.post("/api/ai/generate-molecules", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert len(data["candidates"]) == 10
    
    def test_generate_molecules_properties(self):
        """Test that generated molecules have required properties"""
        payload = {
            "sequence": "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
            "num_molecules": 3
        }
        response = client.post("/api/ai/generate-molecules", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        for candidate in data["candidates"]:
            assert "smiles" in candidate
            assert "molecular_weight" in candidate
            assert "logp" in candidate
            assert "qed_score" in candidate
            assert "binding_affinity" in candidate
            assert candidate["real_calculation"] is True


class TestRequestValidation:
    """Test request validation and error handling"""
    
    def test_missing_required_fields(self):
        """Test API with missing required fields"""
        response = client.post("/api/ai/analyze-protein", json={})
        assert response.status_code == 422
    
    def test_invalid_num_molecules(self):
        """Test with invalid number of molecules"""
        payload = {
            "sequence": "PQITLWQRPLVTIKIGGQLKEALLDTGADDTVLEEMSLPGRWKPKMIGGIGGFIKVRQYDQILIEICGHKAIGTVLVGPTPVNIIGRNLLTQIGCTLNF",
            "num_molecules": 100  # Exceeds max limit
        }
        response = client.post("/api/ai/generate-molecules", json=payload)
        assert response.status_code == 422


class TestPerformance:
    """Test API performance"""
    
    def test_response_headers(self):
        """Test that response includes performance headers"""
        response = client.get("/api/health")
        assert "X-Process-Time" in response.headers
        assert "X-Request-ID" in response.headers
    
    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        import concurrent.futures
        
        def make_request():
            return client.get("/api/health")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in futures]
        
        assert all(r.status_code == 200 for r in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
