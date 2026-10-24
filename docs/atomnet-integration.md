# AtomNet Integration API

> **Universal Screening Engine Integration Endpoint**  
> Any virtual screening engine (AtomNet, GNINA, internal models) can integrate by posting to this endpoint.

## Overview

The AtomNet integration module provides a standardized API for ingesting virtual screening results from external engines. While designed for Atomwise's AtomNet, the schema is generic enough to accommodate any docking or scoring engine.

---

## Base URL

```
http://localhost:8000/api/atomnet
```

---

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/import` | POST | Import screening results |
| `/projects` | GET | List all projects |
| `/projects/{id}` | GET | Get project details |
| `/projects/{id}/xai` | POST | Generate XAI explanations |
| `/projects/{id}/fair` | GET | Get FAIR metadata |
| `/projects/{id}/blockchain` | POST | Record on blockchain |
| `/projects/{id}/reports` | GET | Export reports |

---

## POST /atomnet/import

### JSON Schema

```json
{
  "project": {
    "project_id": "string (required) - Unique identifier",
    "target": {
      "id": "string (required) - Target identifier (e.g., UniProt ID)",
      "name": "string (optional) - Human-readable name",
      "uniprot": "string (optional) - UniProt accession",
      "pdb_id": "string (optional) - PDB structure ID",
      "organism": "string (optional)",
      "sequence": "string (optional) - Amino acid sequence"
    },
    "ligands": [
      {
        "ligand_id": "string (required) - Unique ligand ID",
        "smiles": "string (required) - SMILES notation",
        "score": "float (required) - Binding score (kcal/mol)",
        "rank": "int (required) - Rank position",
        "metadata": {
          "library_id": "string (optional)",
          "batch": "string (optional)",
          "source": "string (optional)",
          "model_version": "string (optional)"
        },
        "molecular_weight": "float (optional)",
        "logp": "float (optional)",
        "tpsa": "float (optional)",
        "hbd": "int (optional)",
        "hba": "int (optional)"
      }
    ],
    "docking_poses": [
      {
        "ligand_id": "string (required)",
        "pose_id": "string (required)",
        "format": "pdb | pdbqt | mol2 | sdf",
        "data_url": "string (optional) - URL to pose file",
        "data_base64": "string (optional) - Base64 encoded pose",
        "rmsd": "float (optional)"
      }
    ],
    "partner": "string (optional) - Partner organization",
    "campaign_name": "string (optional)",
    "description": "string (optional)",
    "atomnet_version": "string (optional) - Engine version"
  },
  "trigger_xai": "bool (default: true) - Auto-generate XAI",
  "trigger_fair": "bool (default: true) - Auto-generate FAIR metadata",
  "trigger_blockchain": "bool (default: false) - Record on blockchain"
}
```

### Minimal Example

```json
{
  "project": {
    "project_id": "my_screen_001",
    "target": {
      "id": "EGFR_HUMAN",
      "name": "Epidermal growth factor receptor"
    },
    "ligands": [
      {"ligand_id": "LIG001", "smiles": "Cc1ccc(NC(=O)c2ccccc2)cc1", "score": -9.8, "rank": 1},
      {"ligand_id": "LIG002", "smiles": "COc1ccc(NC(=O)c2cccnc2)cc1", "score": -9.2, "rank": 2}
    ]
  }
}
```

---

## cURL Example

```bash
curl -X POST "http://localhost:8000/api/atomnet/import" \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "project_id": "my_screen_001",
      "target": {"id": "EGFR_HUMAN"},
      "ligands": [
        {"ligand_id": "LIG001", "smiles": "Cc1ccc(NC(=O)c2ccccc2)cc1", "score": -9.8, "rank": 1}
      ]
    }
  }'
```

### Response

```json
{
  "success": true,
  "project_id": "my_screen_001",
  "message": "Successfully imported 1 ligands for target EGFR_HUMAN",
  "ligand_count": 1,
  "timestamp": "2024-12-09T16:30:00Z",
  "xai_status": "queued",
  "fair_status": "queued"
}
```

---

## Python Client Example

```python
import requests

API_URL = "http://localhost:8000/api/atomnet"

def import_screening_results(project_id: str, target_id: str, ligands: list):
    """Import screening results from any engine"""
    payload = {
        "project": {
            "project_id": project_id,
            "target": {"id": target_id},
            "ligands": ligands
        },
        "trigger_xai": True,
        "trigger_fair": True
    }
    
    response = requests.post(f"{API_URL}/import", json=payload)
    return response.json()

# Example: Import GNINA results
gnina_results = [
    {"ligand_id": "GN001", "smiles": "CCO", "score": -8.5, "rank": 1},
    {"ligand_id": "GN002", "smiles": "CCN", "score": -7.9, "rank": 2},
]

result = import_screening_results(
    project_id="gnina_screen_001",
    target_id="CDK2_HUMAN",
    ligands=gnina_results
)
print(f"Imported: {result['ligand_count']} ligands")
```

---

## Integrating Other Engines

The endpoint accepts results from **any** virtual screening engine:

| Engine | Integration Notes |
|--------|-------------------|
| **AtomNet** | Native format, direct POST |
| **GNINA** | Convert SDF scores to JSON |
| **AutoDock Vina** | Parse PDBQT output |
| **Glide** | Convert .mae/.csv to JSON |
| **Internal Models** | Format predictions as ligands array |

### Key Requirements

1. **Unique project_id** - Identifies the screening run
2. **Target identifier** - UniProt ID preferred
3. **SMILES + Score** - Minimum per ligand
4. **Ranking** - Position in sorted results

---

## XAI Explanations

After import, generate explanations:

```bash
curl -X POST "http://localhost:8000/api/atomnet/projects/my_screen_001/xai" \
  -H "Content-Type: application/json" \
  -d '{"ligand_ids": ["LIG001", "LIG002"]}'
```

Returns:
- SHAP-based feature attributions
- Fragment contributions
- Residue contacts
- Human-readable summary

---

## FAIR Metadata & Blockchain

```bash
# Get FAIR metadata (RO-Crate format)
curl "http://localhost:8000/api/atomnet/projects/my_screen_001/fair"

# Record on blockchain (integrity hash)
curl -X POST "http://localhost:8000/api/atomnet/projects/my_screen_001/blockchain"
```

---

## Demo Projects

The API comes pre-loaded with 3 demo projects for presentations:

| Project ID | Target | Partner | Ligands |
|------------|--------|---------|---------|
| `abl1_kinase_screen_2024q4` | ABL1_HUMAN | Sanofi | 150 |
| `egfr_external_screen_001` | EGFR_HUMAN | Novartis | 100 |
| `braf_v600e_academic_screen` | BRAF_HUMAN | MIT | 75 |

Access at: `http://localhost:3000/atomnet`
