# 🧬 BioScribe AI

**Current supported implementation: Phase 3 public-data descriptor workflow. Scientific release and sensitive-data intake remain blocked.**

Use [the Phase 3 implementation and verification record](docs/PHASE_3_IMPLEMENTATION.md) for startup, schemas, tests and unresolved gates. The authoritative backend is `bioscribe.api:app`, with `bioscribe.worker` and persisted runs. Unsupported legacy API modules fail explicitly; legacy UI routes are disabled and their page sources are preserved in `bioscribe-ai/legacy-ui/`.

The material below is historical prototype documentation. It does not establish current capabilities, scientific validity, deployment readiness or regulatory compliance.

> ## 🏆 AI Healthcare & Life Sciences Hackathon Edition
> **Built for responsible AI in healthcare with explainability, safety, and scientific rigor.**

**Historical prototype description — not a production-readiness statement**

BioScribe AI is an enterprise-level web platform that transforms protein sequences into potential drug candidates using AI-powered molecular modeling and docking simulation. Built with industry best practices for researchers, students, and biotech professionals.

[![Hackathon](https://img.shields.io/badge/hackathon-2024-orange.svg)](https://github.com)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js 15](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)

---

## ⚠️ Important Disclaimers

### Limitations
- **For Research Use Only** - Not intended for clinical diagnostic or therapeutic decisions
- **Predictions Require Validation** - All AI-generated predictions must be validated through laboratory experiments
- **No FDA Approval** - This platform is not FDA-approved for clinical use
- **Accuracy Limitations** - AI models have inherent limitations and may produce incorrect predictions

### Data Sources
- **Synthetic Data Only** - All demonstration data is synthetically generated
- **Public Databases** - Protein sequences from UniProt (public domain)
- **No Patient Data** - No real patient or clinical data is used in this application
- **FAIR Compliant** - Follows FAIR data principles (Findable, Accessible, Interoperable, Reusable)

---

## 🚀 New: Industry-Grade Enhancements

✨ **Production-Ready Features:**
- 🏗️ Structured logging & monitoring
- 🔒 Advanced error handling & validation
- 📊 Performance metrics & health checks
- 🐳 Docker support & automation scripts
- 🧪 Comprehensive test suite
- 📚 Complete documentation (7 guides)

## ✨ Features

### 🎯 Core Modules

1. **Protein Target Module**
   - FASTA sequence input and validation
   - Protein property analysis (MW, pI, hydrophobicity)
   - UniProt database integration
   - Binding site prediction

2. **AI-Powered Drug Generator**
   - HuggingFace transformers (ChemBERTa, MolT5)
   - RDKit molecular property calculation
   - Drug-likeness filtering (Lipinski Rule of 5)
   - SMILES generation and optimization

3. **Molecular Docking Simulation**
   - AutoDock Vina integration
   - Binding affinity prediction (-15 to -2 kcal/mol)
   - RMSD calculation and pose ranking
   - Interaction analysis

4. **3D Visualization System**
   - Interactive molecular viewer
   - Protein ribbon structures
   - Ligand ball-and-stick models
   - Dynamic binding animations

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- **Python 3.11+** - [Download](https://www.python.org/downloads/) (✅ Check "Add to PATH")
- **Node.js 18+** - [Download](https://nodejs.org/)

### Automated Setup (Recommended)

```powershell
# Run automated setup
.\setup.ps1

# Start backend (Terminal 1)
.\start-backend.ps1

# Start frontend (Terminal 2)
.\start-frontend.ps1

# Open browser
# http://localhost:3000
```

### Alternative: Docker

```powershell
docker-compose up --build
# Access at http://localhost:3000
```

**📚 Detailed guides:** See `QUICK_START.md` or `INSTALLATION.md`

## 🏗️ Architecture

### Frontend Stack
- **Next.js 15** with TypeScript & React 19
- **TailwindCSS 4** + **Shadcn/UI** components
- **Framer Motion** for animations
- **3Dmol.js** for molecular visualization
- **Lucide React** for icons

### Backend Stack (Industry-Grade)
- **FastAPI** with async support & structured logging
- **BioPython** for protein analysis
- **RDKit** for molecular calculations (optional)
- **PyTorch & Transformers** for AI models (optional)
- **MongoDB** with in-memory fallback
- **Pydantic V2** for validation

### Production Features
- ✅ Global exception handling
- ✅ Request/response logging
- ✅ Performance metrics
- ✅ Health monitoring
- ✅ Input validation
- ✅ Docker support

## 🧪 Usage Workflow

1. **Input Protein Sequence**
   - Paste FASTA sequence or select example proteins
   - Automatic validation and analysis
   - Binding site prediction

2. **Generate Drug Candidates**
   - AI-powered molecular generation
   - Drug-likeness filtering
   - Property calculation (MW, LogP, TPSA, QED)

3. **Docking Simulation**
   - Binding affinity prediction
   - Pose generation and ranking
   - Interaction analysis

4. **3D Visualization**
   - Interactive molecular viewer
   - Binding site highlighting
   - Export capabilities

## 📊 Example Output

```json
{
  "protein": "SARS-CoV-2 Main Protease",
  "sequence_length": 306,
  "candidates": [
    {
      "smiles": "CC1=CC(=O)NC(=O)N1",
      "name": "BioAromine-001",
      "logP": 2.1,
      "mw": 253.2,
      "binding_affinity": -9.6,
      "rmsd": 1.7,
      "confidence": 91.3
    }
  ],
  "best_candidate": "CC1=CC(=O)NC(=O)N1",
  "timestamp": "2025-10-08T14:30:00"
}
```

## 🎨 Design System

### Color Palette
- **Deep Blue**: `#0B1E3D` (Primary)
- **Aqua Blue**: `#69B3E7` (Secondary)
- **White**: `#FFFFFF` (Background)

### Typography
- **Headers**: Inter (Professional)
- **Code/Sequences**: JetBrains Mono (Scientific)

## 🔧 Development

### Project Structure

```
bioscribe-ai/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn/UI components
│   │   └── tabs/           # Workflow tab components
│   └── lib/                # Utilities
├── backend/
│   ├── models/             # AI and analysis models
│   ├── database/           # MongoDB integration
│   └── main.py            # FastAPI application
└── README.md
```

### Key Components

- `BioScribeWorkflow.tsx`: Main workflow orchestrator
- `ProteinInputTab.tsx`: Protein sequence input and analysis
- `DrugGenerationTab.tsx`: AI-powered drug candidate generation
- `DockingTab.tsx`: Molecular docking simulation
- `VisualizationTab.tsx`: 3D molecular visualization

## 🧬 Scientific Accuracy

BioScribe AI implements scientifically valid approaches:

- **Protein Analysis**: BioPython-based property calculations
- **Drug Generation**: Transformer-based molecular design
- **Docking**: AutoDock Vina scoring functions
- **Visualization**: Industry-standard molecular representations

## 🚀 Deployment

### Docker (Recommended)
```powershell
docker-compose up --build -d
```

### Cloud Deployment
- **Frontend:** Vercel, Netlify
- **Backend:** Railway, Render, AWS
- **Database:** MongoDB Atlas

### Manual Deployment
See `deploy.md` for detailed instructions.

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
- **[INSTALLATION.md](INSTALLATION.md)** - Detailed installation steps
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[ENHANCEMENTS.md](ENHANCEMENTS.md)** - Industry-grade features
- **[UPGRADE_SUMMARY.md](UPGRADE_SUMMARY.md)** - Enhancement summary
- **API Docs:** http://localhost:8000/docs (after starting)

## 🧪 Testing

```powershell
cd backend
pytest tests/ -v
```

**Test Coverage:**
- ✅ API endpoints
- ✅ Protein analysis
- ✅ Molecule generation
- ✅ Input validation
- ✅ Error handling

---

## 🎯 Production Readiness

✅ **Code Quality**
- Structured logging
- Error handling
- Input validation
- Type hints

✅ **Monitoring**
- Health checks
- Performance metrics
- Error tracking
- Uptime monitoring

✅ **Security**
- Input sanitization
- CORS configuration
- Secret management
- Validation

✅ **Testing**
- Unit tests
- Integration tests
- API tests
- Performance tests

✅ **Deployment**
- Docker support
- Environment configs
- Automation scripts
- Cloud-ready

---

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pytest tests/ -v`
5. Submit a pull request

## 📞 Support

- **Quick Start:** See `QUICK_START.md`
- **Issues:** Open a GitHub issue
- **Documentation:** Check comprehensive guides
- **API Docs:** http://localhost:8000/docs

---

## 🏆 What Makes This Industry-Grade?

- 🏗️ **Production Architecture** - Structured logging, error handling, monitoring
- 🔒 **Enterprise Security** - Input validation, CORS, secret management
- 📊 **Observability** - Health checks, metrics, performance tracking
- 🧪 **Quality Assurance** - Comprehensive test suite
- 🐳 **DevOps Ready** - Docker, automation scripts, CI/CD ready
- 📚 **Complete Docs** - 7 detailed guides covering everything

---

**Built with ❤️ for the biotech community**

*🧬 Transforming protein sequences into life-saving drugs through AI*

**Now with enterprise-level reliability and industry-grade architecture!**
