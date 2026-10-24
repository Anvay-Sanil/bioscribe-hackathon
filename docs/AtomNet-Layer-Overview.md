# AtomNet Integration Layer
## Technical Overview

**BioScribe AI Platform** | **Version 4.1.0-enterprise**

---

## Problem Statement

External AI-powered virtual screening engines like Atomwise's AtomNet produce binding affinity predictions, but:

- **No unified front-end** for visualizing and comparing results across engines
- **Black-box scores** lack explainability for medicinal chemists
- **Data silos** prevent collaboration and reproducibility
- **No audit trail** for IP protection and regulatory compliance

---

## Solution: AtomNet Integration Module

A **universal integration layer** that:

1. **Ingests** results from any virtual screening engine via standardized API
2. **Explains** predictions using surrogate models + SHAP
3. **Packages** data as FAIR-compliant RO-Crate
4. **Records** immutable hashes on blockchain
5. **Exports** partner-ready reports (PDF/CSV/JSON)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────────────────────┐
│  External       │     │                    BioScribe AI                       │
│  Screening      │     │                                                       │
│  Engines        │     │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ │
│                 │     │  │   AtomNet   │   │    XAI      │   │    FAIR     │ │
│  • AtomNet      │────▶│  │   Router    │──▶│  Surrogate  │──▶│  Metadata   │ │
│  • GNINA        │     │  │   /import   │   │  + SHAP     │   │  + RO-Crate │ │
│  • AutoDock     │     │  └─────────────┘   └─────────────┘   └─────────────┘ │
│  • Glide        │     │        │                                      │       │
│  • Internal     │     │        ▼                                      ▼       │
└─────────────────┘     │  ┌─────────────┐                      ┌─────────────┐ │
                        │  │   MongoDB   │                      │ Blockchain  │ │
                        │  │   Storage   │                      │   Hash      │ │
                        │  └─────────────┘                      └─────────────┘ │
                        │        │                                              │
                        │        ▼                                              │
                        │  ┌────────────────────────────────────────────────┐  │
                        │  │              Next.js Frontend                  │  │
                        │  │  • Project List    • 3D Viewer    • XAI Panel  │  │
                        │  │  • Ligand Table    • FAIR View    • Exports    │  │
                        │  └────────────────────────────────────────────────┘  │
                        └──────────────────────────────────────────────────────┘
```

---

## API Reference

### Import Endpoint

```
POST /api/atomnet/import
```

**Minimal Payload:**
```json
{
  "project": {
    "project_id": "egfr_screen_001",
    "target": {
      "id": "EGFR_HUMAN",
      "name": "Epidermal growth factor receptor",
      "pdb_id": "1M17"
    },
    "ligands": [
      {"ligand_id": "LIG001", "smiles": "Cc1ccc(NC(=O)c2ccccc2)cc1", "score": -9.8, "rank": 1},
      {"ligand_id": "LIG002", "smiles": "COc1ccc(NC(=O)c2cccnc2)cc1", "score": -9.2, "rank": 2}
    ]
  }
}
```

### Python Client

```python
import requests

response = requests.post(
    "http://localhost:8000/api/atomnet/import",
    json={
        "project": {
            "project_id": "my_screen",
            "target": {"id": "CDK2_HUMAN"},
            "ligands": [
                {"ligand_id": "L1", "smiles": "CCO", "score": -8.5, "rank": 1}
            ]
        }
    }
)
print(response.json())
# {"success": true, "project_id": "my_screen", "ligand_count": 1, ...}
```

### cURL

```bash
curl -X POST "http://localhost:8000/api/atomnet/import" \
  -H "Content-Type: application/json" \
  -d '{"project":{"project_id":"test","target":{"id":"ABL1"},"ligands":[{"ligand_id":"L1","smiles":"CCO","score":-8,"rank":1}]}}'
```

---

## XAI Methodology

1. **Surrogate Model Training**
   - XGBoost regressor trained on AtomNet scores
   - Features: MW, LogP, TPSA, H-bond donors/acceptors, ring counts

2. **SHAP Feature Attribution**
   - TreeExplainer for feature importance
   - Fragment-level contributions via molecular fingerprints

3. **Perturbation Analysis**
   - LIME-style functional group modifications
   - Impact estimation on binding score

4. **Contact Mapping**
   - Residue-ligand distance analysis
   - Interaction type classification (H-bond, π-π, hydrophobic)

---

## FAIR Compliance

| Principle | Implementation |
|-----------|----------------|
| **Findable** | DOI-like identifiers, rich metadata |
| **Accessible** | REST API, standard protocols |
| **Interoperable** | RO-Crate format, JSON-LD, Schema.org |
| **Reusable** | CC BY-NC 4.0 license, full provenance |

---

## Blockchain Recording

- **Hash Algorithm:** SHA-256
- **Content:** Project ID, target, ligand SMILES/scores, timestamp
- **Storage:** IPFS + Ethereum (configurable)
- **Verification:** On-chain hash comparison for integrity

---

## Current Status

| Component | Status |
|-----------|--------|
| Import API | ✅ Production-ready |
| XAI Engine | ✅ Working (mock SHAP when sklearn unavailable) |
| FAIR Metadata | ✅ RO-Crate generation |
| Blockchain | ✅ Simulated (ready for mainnet) |
| Frontend | ✅ Full UI with demo projects |
| AtomNet API | ⏳ Awaiting Atomwise credentials |

**Engine-agnostic:** Currently validated on open docking outputs; AtomNet-ready.

---

## Demo Projects

| ID | Target | Partner | Ligands | Top Score |
|----|--------|---------|---------|-----------|
| `egfr_external_screen_001` | EGFR | Novartis | 100 | -11.8 kcal/mol |
| `abl1_kinase_screen_2024q4` | ABL1 | Sanofi | 150 | -12.5 kcal/mol |
| `braf_v600e_academic_screen` | BRAF | MIT | 75 | -11.2 kcal/mol |

**Live demo:** `http://localhost:3000/atomnet`

---

## Contact

BioScribe AI | Drug Discovery Platform  
GitHub: [repo-link] | Demo: [demo-link]
