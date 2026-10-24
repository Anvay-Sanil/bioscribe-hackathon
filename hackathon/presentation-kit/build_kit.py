"""Assemble a curated presentation source pack; does not edit application code."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
KIT = ROOT / "output/BioScribe-Hackathon-PPT-Kit-2026-10-24"
DECK = Path("C:/Users/User/Downloads/Problem_Statements_hypn.pptx")
ZIP = KIT.with_suffix(".zip")


def write(name, content):
    path = KIT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


COPIES = {
    "02-official-problem/Problem_Statements_hypn.pptx": DECK,
    "03-visuals/historical/experiment-challenges.jpg": ROOT / "hackathon/experiment-challenges/challenges.jpg",
    "03-visuals/historical/replay-proof.jpg": ROOT / "hackathon/evidence-lab/replay-proof.jpg",
    "03-visuals/historical/run-comparison.jpg": ROOT / "hackathon/judging-upgrade/run-changes.jpg",
    "04-evidence/latest-feature/VERIFICATION.json": ROOT / "hackathon/experiment-challenges/VERIFICATION.json",
    "04-evidence/latest-feature/live-checks.json": ROOT / "hackathon/experiment-challenges/live-checks.json",
    "04-evidence/latest-feature/browser-checks.json": ROOT / "hackathon/experiment-challenges/browser-checks.json",
    "04-evidence/latest-feature/software-checks.json": ROOT / "hackathon/experiment-challenges/software-checks.json",
    "04-evidence/earlier-backend/VERIFICATION.json": ROOT / "hackathon/evidence-lab/VERIFICATION.json",
    "04-evidence/earlier-backend/all-backend-tests.xml": ROOT / "hackathon/evidence-lab/all-backend-tests.xml",
    "04-evidence/earlier-backend/linux-tests.xml": ROOT / "hackathon/evidence-lab/linux-tests.xml",
    "04-evidence/earlier-backend/portability.json": ROOT / "hackathon/evidence-lab/portability.json",
    "04-evidence/worked-comparison/VERIFICATION.json": ROOT / "hackathon/judging-upgrade/VERIFICATION.json",
    "04-evidence/worked-comparison/comparison-tests.xml": ROOT / "hackathon/judging-upgrade/comparison-tests.xml",
    "04-evidence/worked-comparison/observations.json": ROOT / "bioscribe-ai/src/lib/phase3/worked-comparison.json",
    "05-demo/reference-run.json": ROOT / "bioscribe-ai/public/evidence-lab/reference-run.json",
    "05-demo/challenge-run.json": ROOT / "bioscribe-ai/public/evidence-lab/challenge-run.json",
    "05-demo/challenge-source-run.json": ROOT / "bioscribe-ai/public/evidence-lab/challenge-source-run.json",
    "05-demo/budget-one-run.json": ROOT / "bioscribe-ai/public/evidence-lab/budget-one-run.json",
    "05-demo/recorded-challenge-capsule.json": ROOT / "hackathon/experiment-challenges/browser-capsule.json",
    "05-demo/full-report.html": ROOT / "hackathon/evidence-lab/full-report.html",
    "06-technical/IMPLEMENTATION.md": ROOT / "hackathon/evidence-lab/IMPLEMENTATION.md",
    "06-technical/EXPERIMENT_CHALLENGES.md": ROOT / "hackathon/experiment-challenges/README.md",
    "06-technical/LabPackage.schema.json": ROOT / "bioscribe-ai/src/lib/phase3/LabPackage.schema.json",
    "06-technical/requirements-phase3.lock": ROOT / "backend/requirements-phase3.lock",
    "06-technical/frontend-package.json": ROOT / "bioscribe-ai/package.json",
    "06-technical/schema-source.py": ROOT / "backend/provenance_lab/schemas.py",
    "06-technical/engine-source.py": ROOT / "backend/provenance_lab/engine.py",
    "07-roadmap/RESEARCH_AND_ROADMAP.md": ROOT / "docs/innovation-audit-2026-10-24/RESEARCH_AND_ROADMAP.md",
    "07-roadmap/probe-results.json": ROOT / "docs/innovation-audit-2026-10-24/probe-results.json",
    "07-roadmap/probe.py": ROOT / "docs/innovation-audit-2026-10-24/probe.py",
    "07-roadmap/source-inventory.json": ROOT / "docs/innovation-audit-2026-10-24/source-inventory.json",
    "07-roadmap/inventory.py": ROOT / "docs/innovation-audit-2026-10-24/inventory.py",
}
for source in sorted((ROOT / "backend/provenance_lab/references").glob("*.json")):
    COPIES["06-technical/frozen-references/" + source.name] = source

TEXT = {
"00-START-HERE.md": """
# BioScribe hackathon presentation source pack

Prepared 24 October 2026 for HM-01, ProvenanceLab, Health & MedTech.

This is the source material for producing your PowerPoint, not a finished BioScribe deck. The included PPTX is the organisers' official problem-statement deck.

## Fastest way to make the presentation

1. Read `01-story/MASTER_BRIEF.md` and `01-story/SLIDE_CONTENT.md`.
2. Use `01-story/PPT_GENERATION_PROMPT.txt` in your presentation tool, attaching the brief, slide content, screenshot index, selected screenshots and claim ledger.
3. Use `01-story/SPEAKER_NOTES.md` for a suggested five-minute pitch. This is an editorial recommendation, not an official time limit.
4. Follow `03-visuals/ASSET_INDEX.md` and `BRAND_GUIDE.md`. Screenshots are real app captures, with dates and recorded-versus-live context.
5. Rehearse with `05-demo/DEMO_SCRIPT.md` and `01-story/JUDGE_QA.md`.
6. Fill `TEAM_DETAILS_TO_FILL.md`. The presenter's name, institution, public repository and public demo URL were not supplied.

## Folder map

- `01-story`: master brief, ten-slide content, speaker notes, generation prompt, Q&A and claim/evidence ledger.
- `02-official-problem`: original organisers' deck and exact HM-01 slide text.
- `03-visuals`: current screenshots, historical verification screenshots, captions, brand guidance and editable Mermaid diagram sources.
- `04-evidence`: scoped historical software, integration, browser and portability results. These were not rerun while assembling the pack.
- `05-demo`: recorded public examples, a recorded challenge capsule, HTML export and demo instructions.
- `06-technical`: architecture and selected scientific contract/source excerpts, dependencies and six frozen compound reference records.
- `07-roadmap`: proposed developments and audit probes, clearly separated from implemented features.
- `FILE_MANIFEST.json`: file hashes and source correspondence; `PACKAGE_CHECKS.json`: packaging checks only.

## Important context for the author

BioScribe's supported pitch is reproducible molecular analysis and evidence checks. It does not currently provide validated affinity, toxicity, half-life or clinical predictions. Student benefit is untested. Decision Stability Explorer and automatic Counterexample Finder are proposals, not available features. Earlier screenshots and test results retain their original scope; opening a recorded export is not a fresh computation.

This curated pack contains no credential files, environment files, databases, patient data or ALDH1A1 study outcomes. It is not a standalone runtime or a full source-code submission. Run the demo from the original project workspace. No sharing link or externally hosted demo is invented.
""",
"TEAM_DETAILS_TO_FILL.md": """
# Presenter details to complete

- Presenter/team name: [ADD]
- Institution and course, if desired: [ADD]
- Hackathon name and date: [ADD exact official wording]
- Problem: HM-01, ProvenanceLab, Track 04 Health & MedTech
- Public repository URL: [ADD only after confirming the intended public repository]
- Public demo URL: [ADD only if deployed and working; localhost is not a public link]
- Contact, if desired: [ADD]
- Required slide count/time limit: [CHECK organisers; this pack suggests 10 slides / 5 minutes]
- Pre-existing work, AI assistance and third-party libraries: [DISCLOSE according to the event's actual rules]

Leave unknown details as visible placeholders during drafting. Remove unused placeholders before submission. Do not make up names, affiliations, testimonials, prizes or URLs.
""",
"01-story/MASTER_BRIEF.md": """
# BioScribe: Molecular Evidence Lab

## Positioning

**One line:** BioScribe helps biotechnology students inspect molecular inputs, compare calculated properties and reproduce saved experiments with explicit evidence checks.

**Problem statement:** HM-01 ProvenanceLab in Track 04 Health & MedTech. The official brief asks for precise validation, explicit molecular identity, frozen PubChem/ChEMBL snapshots, no silent filling of missing values and reproducible runs across environments. Exact text is in `02-official-problem/HM01_EXACT_TEXT.md`, slide 16 of the supplied deck.

## User problem

Students copy molecular strings from papers and websites. A broken string, an unresolved atom or a different representation can change what the software processes. A numerical result may look authoritative even when evidence is missing. Later, the inputs, library versions and calculation context can be lost. This is the intended use case, not a measured prevalence or participant finding.

## Implemented solution

The Evidence Lab preserves each original input, applies a declared plain-SMILES policy, reports specific diagnostics, identifies canonical isomeric graphs and computes molecular descriptors. It retains unsupported rows and separates `not_computed`, `not_available` and `not_applicable`. It compares QED and a descriptor-distance ordering under a saved budget. Both are unvalidated as biological ranking methods.

Authenticated local jobs are stored with owner scope and run identifiers. A bounded worker computes offline. Exports include inputs, results, reference bytes and source/dependency identities. A replay uses the matching trusted engine to recompute the declared scientific payload and compare hashes. An imported source bundle is never executed.

Six frozen records represent three compounds: aspirin, caffeine and acetaminophen, each from PubChem and ChEMBL. These are small local identity snapshots, not complete database releases or assay validation datasets. Example 3D conformers are illustrative calculations, not experimental structures or docking poses.

## Strongest demo

Experiment Challenges recomputes a control and applies six deliberate changes: row order, equivalent spelling, duplicate insertion, a broken input, budget change and a forged numerical value. The forgery changes a molecular weight and rebuilds the checksum; fresh replay must still reject it. An exported capsule preserves the recorded checks. Opening a capsule later does not rerun its jobs or authenticate its authorship.

## Architecture and stack

Next.js 15.5.4 / React 19.1.0 / TypeScript UI; Python 3.11; FastAPI 0.115.12; Pydantic 2.11.7; RDKit 2025.03.3; SQLite jobs; bounded subprocess worker; locked dependencies; local 3Dmol renderer. Biopython 1.83 supports the separate sequence-descriptor workflow. The core HM-01 workflow does not rely on an LLM.

## Evidence available

- Latest feature record: 147 client software checks, seven real local jobs covering six expected behaviours, 11 browser checkpoints, successful build/type/lint checks.
- Earlier engine record: 234 Windows backend tests and 61 Linux tests. The Linux count overlaps the Lab subset and must not be added as unique test coverage.
- Two saved packages reproduced exact declared scientific hashes in Windows and Linux environments on the same physical host.
- A 24-case worked comparison against a supplied simple RDKit script is curated and descriptive, not a representative benchmark or competitor evaluation.

These are recorded results from their respective iterations. They are not a new verification run performed for this presentation pack, and none establishes biological predictive accuracy.

## Differentiation and limits

The project integrates identity, missing evidence, reproducibility and deliberate challenges in one student-facing workflow. RDKit, molecular validation, hashes and provenance are established techniques. Global uniqueness is not established. Intended student benefits are inspectability and learning; no usability study, time-saving metric or adoption evidence exists.

Current constraints include 1–16 molecules per Lab run, three reference compounds, matching-runtime replay, example-only conformers and no second-physical-machine verification. Scientific release, sensitive-data intake and production deployment remain blocked. The local educational prototype is working within its declared public-data scope.

## Roadmap, not implemented

First align received-artifact completeness across backend and browser and version any changed tie policy. Next build an automatic Counterexample Finder, then a Decision Stability Explorer. The current audit found that equivalent spelling can change a tied selection through the raw-input hash tie-break. This is a documented limitation and a motivating example, not a finished stability feature.

Future work may connect conclusions to source dependencies and suggest which missing fact would resolve a decision disagreement. These are research proposals, not validated capabilities or promises of unprecedented novelty.
""",
"01-story/SLIDE_CONTENT.md": """
# Suggested 10-slide deck

Suggested duration: five minutes, plus questions. The official deck does not provide a general HM-01 duration or scoring rubric. The MathWorks rubric belongs to its own challenge.

## Slide 1 — BioScribe

**Molecular Evidence Lab**

Reproducible molecule analysis with evidence checks

HM-01 ProvenanceLab | [Presenter/team] | [Institution, optional]

Visual: `03-visuals/current/evidence-overview.jpg`, or a clean editable wordmark using the brand guide.

## Slide 2 — The student’s problem

- Copied molecular strings can be malformed or ambiguous.
- A different representation can change what gets calculated.
- Missing evidence and lost calculation context make results hard to trust.

Footer: Intended student use case from the official problem statement; prevalence and user benefit not measured.

Visual: a native text example, `CCO C1OC1`, alongside the real invalid-input screenshot.

## Slide 3 — A traceable molecular workflow

Preserve input → Validate graph → Compute descriptors → Compare → Export and replay

- Original rows remain visible.
- Every reported quantity has an evidence state.
- Saved runs link the submitted library to its outputs.

Visual: redraw `03-visuals/current-workflow.mmd` as a simple editable diagram.

## Slide 4 — Missing evidence stays explicit

| State | Example |
| --- | --- |
| Not computed | Rejected molecular input |
| Not available | No validated toxicity model |
| Not applicable | Heavy-atom fraction with zero heavy atoms |

Footer: A successful calculation does not establish biological activity or safety.

Visual: current missing-evidence screenshot, with its hydrogen-input caption.

## Slide 5 — The result includes its calculation context

- Original input and molecular graph identities
- Six frozen reference records covering three compounds
- Method, dependency and result fingerprints
- Matching-engine replay and complete exports

Footer: Exact equality refers to the declared scientific payload at eight-decimal reporting precision. Historical runtime availability is required.

Visual: `03-visuals/historical/replay-proof.jpg`, captioned as an earlier recorded replay.

## Slide 6 — Challenge the experiment

Shuffle the library. Change the spelling. Plant a duplicate. Break an input. Change the budget. Forge a number.

**A rebuilt checksum does not make a changed result agree with fresh computation.**

Footer: Six bounded software challenges; no biological qualification or authenticated authorship.

Visual: `03-visuals/historical/experiment-challenges.jpg`. Explain that it records a previous local execution.

## Slide 7 — How it works

Next.js / React interface → FastAPI + strict schemas → SQLite jobs → bounded RDKit worker → checked exports

- Local public-data workflow
- Frozen references and locked dependencies
- Unsupported predictions remain unassessed

Visual: `03-visuals/architecture.mmd` as editable diagram. Keep detailed version numbers in notes.

## Slide 8 — Recorded verification evidence

| Latest feature iteration | Recorded result |
| --- | --- |
| Client software checks | 147 passed |
| Local integration | 7 jobs; 6 expected behaviours observed |
| Browser checkpoints | 11 passed |
| Build, types and lint | Passed |

Footer: Recorded 24 October 2026; not rerun for this deck. Software behaviour, not biological accuracy. Earlier Windows/Linux checks are separate appendix evidence.

Optional note: two packages matched across Windows/Linux on one physical host. Do not claim universal cross-machine reproducibility.

## Slide 9 — Scope and intended value

**Available:** input diagnostics, descriptors, explicit evidence states, saved runs, replay and experiment challenges.

**Still untested or limited:** student benefit, broader reference coverage, independent-machine reproduction and production deployment.

Footer: No validated affinity, toxicity or pharmacokinetic predictions. Rankings are unvalidated biological heuristics.

Visual: real current aspirin conformer, captioned “Illustrative computed conformer; example library only.” Do not use a predictive-performance chart.

## Slide 10 — Next development

**Proposed: explain what would change a decision.**

- Automatically find a small reproducible counterexample.
- Show which selections depend on declared assumptions.
- Identify the missing fact needed to resolve disagreement.

Footer: Roadmap only. These features are not implemented. Student benefit and global novelty remain unestablished.

Closing line: BioScribe makes the input, evidence and computation inspectable alongside the result.

[Verified repository/demo link, if supplied] · [Presenter details]

## Optional appendix material

Use the claim ledger for precise test scope, JUDGE_QA for difficult questions, official slide 16 for requirements, and the audit for the tied-ranking limitation. Do not add appendices if the event imposes a fixed total slide count.
""",
"01-story/SPEAKER_NOTES.md": """
# Suggested five-minute speaker notes

The timings are suggested pacing, not the organiser's requirement. Read naturally and shorten to fit your speaking speed.

## 1 — BioScribe — 15 seconds

BioScribe is our Molecular Evidence Lab for ProvenanceLab. It helps biotechnology students inspect molecular inputs, compare calculated properties and reproduce a saved experiment while keeping missing evidence visible.

## 2 — The problem — 30 seconds

Students often begin with a molecular string copied from somewhere else. The string might be broken, contain extra text or leave stereochemistry unspecified. A program may still produce a number, but that does not tell the student whether the intended molecule was processed. The problem statement asks us to make that uncertainty and the calculation context explicit.

## 3 — Workflow — 30 seconds

We preserve the original input, validate it under a declared policy and compute descriptors only for supported graphs. Every original row remains visible. Comparisons and exports belong to a persisted run, so the displayed result can be traced to the submitted library. Rejected rows do not quietly disappear from a shortlist.

## 4 — Missing evidence — 30 seconds

These three labels mean different things. Not computed means the calculation did not run, for example because the input was rejected. Not available means the relevant evidence or validated model is absent. Not applicable means a quantity is undefined for that input. A blank is not silently replaced with a reassuring value.

## 5 — Reproducibility — 35 seconds

The export includes the request, scientific result, frozen references and the source and dependency identities. A fresh replay recomputes using the matching trusted engine and compares the scientific payload. A checksum alone only establishes internal consistency. Replay asks a stronger computational question, but it still does not prove that a biological claim is true.

## 6 — Experiment Challenges — 45 seconds

Our most distinctive interaction lets a student challenge a saved experiment. BioScribe recomputes a control and performs six deliberate perturbations. The strongest example changes a molecular weight and rebuilds the result checksum. Fresh replay rejects the modified result because it does not agree with the computation. The displayed screenshot records an earlier execution; a live run is available when the local services are ready. The capsule preserves the evidence but does not authenticate authorship.

## 7 — Architecture — 30 seconds

The React interface talks to a FastAPI service with strict schemas. Owner-scoped SQLite records preserve jobs and run IDs. A bounded subprocess worker computes with the pinned RDKit environment and local reference files. The computational path does not depend on an LLM or a live chemical database. Unsupported predictive endpoints stay unassessed.

## 8 — Verification — 30 seconds

The latest feature record reports 147 passing client checks, seven real jobs covering six expected behaviours and 11 browser checkpoints. Build, type and lint checks also passed. Earlier checks cover the backend and Windows/Linux replay on one host. These are scoped software results, not claims of predictive accuracy, universal portability or a fresh suite run for this presentation.

## 9 — Scope — 30 seconds

The working product is a public-data educational prototype. Its intended value is to make errors and evidence understandable. We have not yet tested that benefit with students. The reference snapshot and example conformer library are small. We do not claim validated drug activity, safety, clinical use or production readiness.

## 10 — Roadmap — 25 seconds

Our next direction is to explain what would change a decision. An audit found that changing only a molecular spelling can change a tied selection under the current input-hash tie-break, even though the descriptors remain unchanged. We propose automatically finding such counterexamples, showing assumption-sensitive selections and identifying what missing information would resolve them. Those features remain roadmap work.

## Thirty-second fallback pitch

BioScribe addresses ProvenanceLab with an inspectable molecular workflow: precise input diagnostics, explicit missing-evidence states, frozen references and replayable results. Its Experiment Challenges deliberately perturb saved runs, including changing a number and rebuilding its checksum, to check whether fresh computation catches the discrepancy. It is a working educational prototype with recorded software checks. Biological prediction and student benefit remain unvalidated.
""",
"01-story/PPT_GENERATION_PROMPT.txt": """
Create a polished, editable 16:9 PowerPoint for BioScribe, submitted to HM-01 ProvenanceLab under Health & MedTech.

Use this source pack as the factual boundary. Start with MASTER_BRIEF.md, SLIDE_CONTENT.md, CLAIMS_AND_EVIDENCE.md, ASSET_INDEX.md and BRAND_GUIDE.md. Use exactly the suggested ten slides unless I supply a different organiser requirement. Use SPEAKER_NOTES.md as a five-minute pacing draft. Put detailed source references in speaker notes and keep essential limitations visible on the relevant slide.

Use BioScribe's light white/lavender appearance with restrained violet/fuchsia accents, large typography and real product screenshots. Prefer one clear visual idea per slide. Use supplied Mermaid files as the specification for native editable architecture/workflow diagrams. Do not generate fictitious UI, invented charts or scientific performance metrics. Preserve screenshot aspect ratios and all evidence labels needed to interpret them. Historical verification screenshots must be identified as recorded demonstrations.

Tell a concrete story: the student's input/evidence problem, the implemented workflow, explicit missingness, replay, Experiment Challenges, architecture, scoped verification evidence, current limitations and proposed next development. Lead with the forged-number challenge as the main demonstration. Explain why recomputation adds evidence beyond a checksum.

Current capabilities include descriptors, graph identity, saved local jobs, frozen compound records, exports, replay and six experiment challenges. Automatic Counterexample Finder, Decision Stability Explorer and evidence-dependency features are proposed only. Never show these as implemented. User benefit is untested. Do not claim global novelty, validated affinity/toxicity/half-life, production readiness, clinical usefulness or guaranteed hackathon success.

Use 147 client checks, seven jobs/six expected behaviours and 11 browser checkpoints only with their recorded iteration/date and scope. Do not add overlapping historical counts or convert software checks into accuracy. Six reference records cover three compounds, not entire PubChem or ChEMBL datasets. Windows/Linux replay was on one physical host. Imported capsules do not represent fresh execution or authenticated authorship.

Keep presenter/team/institution/repository placeholders until I supply real details. The included Problem_Statements_hypn.pptx is the organisers' source deck, not a BioScribe presentation template. Do not borrow the MATLAB-specific judging rubric for HM-01. Final output should be a PowerPoint with editable text and diagrams and complete speaker notes.
""",
"01-story/CLAIMS_AND_EVIDENCE.md": """
# Claim ledger for slide authors

All paths here are relative to the pack root. “Recorded” means earlier verification, not a new test execution while packaging.

| Slide claim | Evidence | Scope / wording restriction |
| --- | --- | --- |
| HM-01 asks for precise validation, identity, frozen snapshots and reproducibility | `02-official-problem/HM01_EXACT_TEXT.md`; official slide 16 | No general HM-01 scoring rubric or time limit is provided in this deck. |
| Supported graph descriptors and explicit missingness | `06-technical/schema-source.py`, `engine-source.py`, `IMPLEMENTATION.md` | Computed descriptors are not experimental measurements or validated predictions. |
| Six frozen records, three compounds | `06-technical/frozen-references/snapshot.json` | Identity correspondence only; a small retrieval snapshot, not full database releases. |
| Exact replay | `04-evidence/earlier-backend/portability.json` and example packages | Declared eight-decimal payload with matching trusted runtime. Two OS environments on one physical host. |
| 147 passing client checks | `04-evidence/latest-feature/VERIFICATION.json` | Recorded 2026-10-24; 34 new + 113 existing. Not biological accuracy. |
| Seven real local jobs, six expected behaviours | `04-evidence/latest-feature/live-checks.json` | One control plus six trials. Bounded selected examples; not universal invariance. |
| 11 browser checkpoints | `04-evidence/latest-feature/browser-checks.json` | Earlier observed browser behaviour. No participant study. |
| Build/types/lint passed | `04-evidence/latest-feature/VERIFICATION.json` | Earlier iteration. Full backend and Linux suites not repeated in that iteration. |
| 234 Windows backend checks | `04-evidence/earlier-backend/all-backend-tests.xml` and `VERIFICATION.json` | Recorded 2026-10-23. Historical, not rerun for this pack. |
| 61 Linux checks | `04-evidence/earlier-backend/linux-tests.xml` | Overlapping Lab subset in another environment. Do not sum as distinct new tests. |
| 24-case worked comparison | `04-evidence/worked-comparison/observations.json` | Curated default-RDKit example, not a representative benchmark or competitor evaluation. |
| Computed 3D conformers | Current screenshot and `06-technical/IMPLEMENTATION.md` | Example library, not arbitrary-input generation, experimental geometry or docking. |
| Equivalent spelling can change a tied selection | `07-roadmap/probe-results.json` | Observed current tie policy. Same graph identities/descriptors; not a numerical descriptor error. |
| Automatic witness search and stability explorer | `07-roadmap/RESEARCH_AND_ROADMAP.md` | PROPOSED, not implemented. |
| Student usefulness | No participant evidence | Intended benefit only; explicitly untested. |
| Globally novel / first ever | No exhaustive prior-art evidence | Do not claim. Existing curation/provenance/testing tools are acknowledged. |

## Avoid these unsupported claims

“AI discovers drugs”, “predicts binding affinity”, “confirms safety”, “validated synthesis”, “clinical-grade”, “HIPAA compliant”, “FDA approved”, “100% accurate”, “works on every machine”, “saves students X hours”, “first in the world”, “10/10 guaranteed”.

Use “working local public-data educational prototype”, “calculated descriptors”, “recorded software checks”, “bounded challenge”, “matching-runtime replay”, and “proposed development” where appropriate.

Checksums establish consistency. Fresh recomputation tests computational agreement. Signatures would address authorship under a defined trust policy. None alone establishes biological validity.
""",
"01-story/JUDGE_QA.md": """
# Judge questions and defensible answers

**What exactly did you build?** A local molecular evidence workflow that validates inputs, reports calculated properties with explicit evidence states, persists runs and exports packages that can be recomputed.

**What is your strongest feature?** Experiment Challenges. It checks expected behaviour under deliberate changes and detects a numerical forgery even after the result checksum is rebuilt, by fresh recomputation.

**Is it AI?** The supported HM-01 computation uses deterministic cheminformatics and typed validation, not an LLM. The work is in the evidence contract and workflow. The historical project name does not make the current pipeline an AI predictor.

**Does it discover drugs or predict toxicity?** No. QED and descriptor distance are calculated/unvalidated orderings. Affinity, toxicity and pharmacokinetic predictions remain unavailable and unassessed.

**Why use this instead of RDKit?** RDKit supplies the chemistry primitives. BioScribe adds a student-facing workflow for input policy, missingness, run identity, frozen evidence, controlled challenges and portable reports. A developer could assemble similar safeguards; uniqueness is not established.

**What is new compared with ChemAudit or other curation tools?** The intended differentiation is a focused workflow for challenging one's saved experiment and handing over the precise evidence. Validation and standardisation are established. We have not proved that the exact integration is unique.

**What do the test counts prove?** Tested software behaviour under specified fixtures and environments. They do not prove biological accuracy, broad domain coverage or user productivity.

**Can it reproduce results on any machine?** Recorded packages matched in Windows and Linux environments on one physical host. The matching trusted runtime must be available. Another physical machine and other architectures remain to be tested.

**How much PubChem/ChEMBL data is frozen?** Six identity records for three compounds. We preserve raw bytes, IDs, retrieval information and hashes. This is deliberately small and not a full database mirror.

**Why retain rejected rows?** Dropping them can silently change the population being compared. The current workflow keeps them visible and withholds the affected selection.

**Can you trust a report just because its checksum matches?** No. A checksum can be rebuilt after a change. Fresh computation asks whether the recorded result agrees with the declared method. Authenticated authorship is a different trust requirement.

**What is an honest known limitation?** A tied selection can depend on raw SMILES spelling because of the current input-hash tie-break. This is documented, reproduced and motivates versioned tie handling and decision-stability work. Another audit finding is different backend/browser handling of omitted constant metadata.

**Have students tested it?** No. Student value is explicitly untested. Intended educational benefits should be evaluated rather than asserted.

**What is next?** A bounded Counterexample Finder, followed by a Decision Stability Explorer and evidence-dependency rules. These are proposals.

**Is this ready for confidential or clinical data?** No. The demonstrated scope is public, non-sensitive local work. Scientific release, sensitive intake and production deployment gates remain blocked.
""",
"03-visuals/BRAND_GUIDE.md": """
# Presentation visual guidance

Use the original light BioScribe appearance: white and pale lavender surfaces, violet/fuchsia accents, generous spacing and dark slate text. These colours are drawn from the current workbench CSS:

- Background: `#EDE9FE`, `#FAF5FF`, `#FAE8FF`
- Primary violet: `#7C3AED`
- Secondary fuchsia: `#C026D3`
- Dark text: `#0F172A`
- Secondary text: `#475569`
- White: `#FFFFFF`

Suggested slide format: 16:9; titles 32–40 pt, body 20–26 pt, concise evidence labels at a legible size. Use a readily available sans-serif such as Aptos or Arial. The deck typography is a recommendation, not a claim about the application's installed font.

Use an editable BioScribe wordmark. The app uses a Lucide DNA icon in a gradient tile; no standalone official logo image was found. Do not substitute stock OpenAI/Next/Vercel logos as BioScribe branding. If reusing Lucide artwork, preserve its licence attribution.

Use one major visual per slide. Portrait screenshots work beside short explanatory text; do not stretch them to widescreen or erase their warning labels. Do not add fake clinical scans, docking poses or implied assay charts. No generated artwork is needed to explain the working product.
""",
"03-visuals/ASSET_INDEX.md": """
# Screenshot captions and suggested use

The current screenshots were captured from the actual running UI on 24 October 2026 using its normal viewport. They show recorded examples; no new scientific job was executed to create them. The historical screenshots are untouched earlier verification assets. Do not present any still image as a current live execution.

| File | What it shows | Suggested slide and caption |
| --- | --- | --- |
| `current/evidence-overview.jpg` | Current Evidence Lab heading and input workflow | Slide 1/3: “BioScribe Evidence Lab; current interface, recorded example.” |
| `current/invalid-input.jpg` | `CCO C1OC1` rejected as whitespace/control; numeric descriptors withheld | Slide 2/4: “Original input retained; unsupported text is not silently interpreted as ethanol.” |
| `current/missing-evidence.jpg` | Hydrogen example's aromatic heavy-atom fraction is not applicable | Slide 4: “Zero denominator produces not applicable; no placeholder numeric fraction.” |
| `current/aspirin-3d.jpg` | Actual illustrative aspirin conformer in the current UI | Slide 9: “Computed example conformer; not an experimental structure or docking pose.” |
| `historical/replay-proof.jpg` | Earlier recorded successful replay screen | Slide 5: “Recorded local replay verification, 23 October 2026; not freshly executed for this deck.” |
| `historical/experiment-challenges.jpg` | Earlier six expected challenge behaviours observed | Slide 6: “Recorded challenge execution, 24 October 2026; bounded software checks.” |
| `historical/run-comparison.jpg` | Earlier identity-matched run comparison | Optional appendix: “Recorded run comparison; a comparison alone is not fresh recomputation.” |

Screenshot warning labels and interpretation captions are part of the evidence. Some screenshots are tall/narrow and include the development-server badge. Preserve aspect ratio; avoid enlarging until text becomes blurry. File dimensions are listed in `visual-assets.json` after packaging.

Editable diagram sources: `architecture.mmd`, `current-workflow.mmd`, `proposed-decision-workflow.mmd`. The last is roadmap-only. They are text specifications for native shapes, not rendered evidence screenshots.
""",
"03-visuals/current-workflow.mmd": """
flowchart LR
    A[Original SMILES rows] --> B[Strict parsing and graph identity]
    B --> C[Calculated descriptors and evidence states]
    C --> D[Fixed-budget descriptor comparison]
    D --> E[Saved report and replay package]
    E --> F[Matching-engine recomputation]
    F --> G[Declared scientific payload comparison]
""",
"03-visuals/architecture.mmd": """
flowchart TD
    UI[Next.js and React interface] --> API[FastAPI and strict schemas]
    API --> DB[Owner-scoped SQLite jobs]
    DB --> W[Bounded subprocess worker]
    REF[Frozen local PubChem and ChEMBL records] --> W
    ENV[Approved source and dependency bundle] --> W
    W --> R[RDKit descriptors and typed evidence]
    R --> DB
    DB --> UI
    UI --> EXP[HTML report and JSON package]
    EXP --> REP[Fresh replay with matching trusted engine]
""",
"03-visuals/proposed-decision-workflow.mmd": """
flowchart LR
    A[PROPOSED: preserved molecular inputs] --> B[Declared interpretation scenarios]
    B --> C[Selections under each scenario]
    C --> D[Stable and conditional membership]
    D --> E[Minimal reproducible counterexample]
    E --> F[Missing fact that resolves disagreement]
""",
"05-demo/DEMO_SCRIPT.md": """
# Live and recorded demonstration

## Prepare in the original project workspace

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File hackathon/start-demo.ps1 -Verify
```

Open `http://localhost:3000/proof` or `/evidence`. This pack is not the application runtime. The local access token is intentionally not included. In the app, load your existing local token file privately and check the connection. Do not show the token contents on a projector. Confirm public, non-sensitive inputs.

## Three-minute primary demo

1. **0:00–0:40:** Load “Break the input”; select `CCO C1OC1` or `*CC`. Show the original row, diagnostic and absent numeric descriptors.
2. **0:40–1:10:** Show the three distinct missing-evidence states. For `[H][H]`, the heavy-atom fraction is undefined, not zero.
3. **1:10–1:40:** Load three reference compounds; show the preserved identities and frozen source records. Show QED/descriptor comparison as unvalidated orderings.
4. **1:40–2:30:** Recompute the reference package and wait for the fresh match indicator. Export the JSON package and HTML report.
5. **2:30–3:00:** Explain Experiment Challenges with its recorded capsule or screenshot. For a longer slot, load the challenge-ready library and execute the suite live. The suite permits up to four minutes, so do not promise it will finish in thirty seconds.

## Local example files

- `reference-run.json`: three public reference compounds.
- `challenge-run.json`: 12 records covering malformed inputs, identity and missingness.
- `challenge-source-run.json`: four accepted records suitable for all six experiment challenges.
- `budget-one-run.json`: compare against the reference run at budget two.
- `recorded-challenge-capsule.json`: previously executed browser suite; opening it is recorded evidence, not new jobs.
- `full-report.html`: existing complete human-readable export, usable offline as a fallback.

## If the live service fails

State that fresh execution is unavailable. Open the recorded export or HTML report and identify it as a recorded example. Explain the previously recorded verification and its scope. Do not swap a recorded result into the story as if the failed live run succeeded.

The unknown-label learning exercise uses invented labels and belongs to a separate teaching workflow. It is optional; do not use its hit counts as experimental evidence in this pitch.
""",
"06-technical/ARCHITECTURE_NOTES.md": """
# Architecture notes for technical slides

Supported application composition: `backend/bioscribe/api.py` installs both the existing `/v3` API and the `/lab` extension. The two contracts retain their own versions. The Lab's authoritative Python schema and engine excerpts are copied here for reference; they are not a runnable standalone project.

1. UI submits plain molecular strings and budget under `lab-1.0.0`.
2. Authentication and owner scope protect local job access.
3. SQLite persists the request with UUID run ID, idempotency, lease and retry state.
4. A bounded child process computes against local frozen records and pinned dependencies.
5. Evidence records carry method, units, availability, domain, coverage and assessment status.
6. Publication and retrieval bind the output to submitted input count/order/identity.
7. A replay package contains original request, result, source text, dependency lock and references. Uploaded source text is evidence only and is not executed.
8. Fresh replay requires the matching installed trusted bundle and compares the declared scientific payload hash.

Current Lab limits: 1–16 records, up to 2,048 characters each and 256 parsed atoms, 30-second worker computation bound, at most two attempts, queue bound 32. These are conservative workstation limits, not measured production capacity.

Distance heuristic: `abs(MW - 350)/350 + abs(TPSA - 75)/75`, dimensionless, ascending. QED comparator sorts descending. Current ties use original input hash then index. Neither ranking is validated for a target/assay. The audit documents representation-sensitive ties.

Example conformers use RDKit ETKDGv3 and UFF with a recorded seed. The current viewer selects matching precomputed examples, rather than generating all submitted molecules.

Selected files are supplied to explain the design. Paths referenced by copied historical documentation refer to the original repository unless a corresponding pack-relative file is listed in the claim ledger. The original repository is needed to execute scripts or tests.
""",
"07-roadmap/ROADMAP_ONLY.md": """
# Proposed work only

The source audit proposes an automatic Counterexample Finder, Decision Stability Explorer, evidence-dependency rules, clarification guidance, identity lenses, controlled change attribution, independent replay exchange and a public challenge corpus. These are not implemented features in this presentation pack.

The strongest next step is a bounded Counterexample Finder connected to decision stability. The audit's existing witness shows a tied selection changing after an equivalent SMILES spelling change. Both graphs and all descriptors stay unchanged. A future version must preserve the historical policy rather than silently changing past evidence.

The backend/browser metadata-completeness difference is another unresolved audit finding. It did not demonstrate fabricated numerical results or biological validation.

The detailed audit includes primary-source prior art and acceptance criteria. Its scripts and inventory refer to the original repository layout and are not standalone executables from this pack. No ALDH1A1 study files or outcomes are included.
""",
"01-story/SOURCES_AND_ATTRIBUTION.md": """
# Sources and attribution

The organiser's deck was supplied by the user. HM-01 is slide 16. Preserve the original file in `02-official-problem`; the extracted text is an exact convenience copy. The deck's MathWorks rubric is not an HM-01 rubric.

Product screenshots are unedited captures of BioScribe's own interface. Current/historical contexts and suggested captions are recorded in the visual index. Source data are public compound-identity responses retained in the project's frozen snapshot, with source identifiers, URLs and hashes.

Core dependencies and prior art, for speaker-note references:

- RDKit: https://www.rdkit.org/ — chemistry primitives, descriptors and conformers; pin-specific behaviour is governed by the installed project version and fixtures.
- ChEMBL Structure Pipeline: https://github.com/chembl/ChEMBL_Structure_Pipeline — existing structure checking/standardisation.
- ChemAudit: https://github.com/Kohulan/ChemAudit — existing chemical validation and diagnostics.
- W3C PROV: https://www.w3.org/TR/prov-overview/ — established provenance concepts.
- Workflow Run RO-Crate: https://www.researchobject.org/workflow-run-crate/profiles/ — established workflow-run provenance formats.
- Delta debugging: https://www.st.cs.uni-saarland.de/dd/ddusage.php3 — established failure minimisation.
- Specification curve analysis: https://doi.org/10.1038/s41562-020-0912-z — established analysis-choice sensitivity work.

Prior-art sources were researched for the 24 October audit; they were not re-benchmarked during presentation packaging. The exact integration's global novelty is not established. Preserve third-party licence obligations when redistributing code/data/assets. This pack does not confer additional rights to third-party material.
"""
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    KIT.mkdir(parents=True, exist_ok=True)
    for target, source in COPIES.items():
        if not source.is_file():
            raise FileNotFoundError(source)
        destination = KIT / target
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
    for name, content in TEXT.items():
        write(name, content)
    write("01-story/MASTER_BRIEF.txt", TEXT["01-story/MASTER_BRIEF.md"])
    with zipfile.ZipFile(DECK) as archive:
        slide = ET.fromstring(archive.read("ppt/slides/slide16.xml"))
    ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
    paragraphs = ["".join(p.itertext()) for p in []]  # paragraph text extracted below
    paragraphs = ["".join(t.text or "" for t in p.findall(".//a:t", ns)) for p in slide.findall(".//a:p", ns)]
    official = "\n\n".join(p for p in paragraphs if p)
    assert "ProvenanceLab" in official and "frozen PubChem and ChEMBL" in official
    write("02-official-problem/HM01_EXACT_TEXT.md", "# Official slide 16, exact text\n\nSource: Problem_Statements_hypn.pptx, supplied by the user.\n\n" + official)
    # The consolidated text is convenient for tools which accept one attachment.
    combined = "\n\n".join("\n" + "=" * 60 + "\n" + name + "\n\n" + TEXT[name].strip() for name in ["01-story/MASTER_BRIEF.md", "01-story/SLIDE_CONTENT.md", "01-story/SPEAKER_NOTES.md", "01-story/CLAIMS_AND_EVIDENCE.md", "03-visuals/ASSET_INDEX.md", "03-visuals/BRAND_GUIDE.md", "01-story/JUDGE_QA.md"])
    write("ALL_PRESENTATION_CONTENT.txt", combined)

    # Inspect dimensions without altering any screenshot pixels.
    from PIL import Image
    visual = []
    for path in sorted((KIT / "03-visuals").rglob("*.jpg")):
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            visual.append({"path": path.relative_to(KIT).as_posix(), "width": im.width, "height": im.height, "format": im.format})
    assert len(visual) == 7
    write("03-visuals/visual-assets.json", json.dumps(visual, indent=2))

    # Check claim counts against the copied records rather than invent totals.
    latest = json.loads((KIT / "04-evidence/latest-feature/VERIFICATION.json").read_text())
    assert latest["total_client_checks"] == 147 and latest["browser_checkpoints"] == 11
    assert latest["live_integration"]["jobs"] == 7 and latest["live_integration"]["expected_behaviors"] == 6
    historical = json.loads((KIT / "04-evidence/earlier-backend/VERIFICATION.json").read_text())
    assert historical["backend_windows"]["tests"] == 234 and historical["backend_linux"]["tests"] == 61
    snapshot = json.loads((KIT / "06-technical/frozen-references/snapshot.json").read_text())
    assert len(snapshot["records"]) == 6
    for path in KIT.rglob("*.json"):
        json.loads(path.read_text(encoding="utf-8-sig"))
    # The only copied .txt documents contain prose, never local credentials.
    forbidden = {".env", "demo-token.txt", "principals.json", "runs.sqlite3"}
    assert not any(p.name in forbidden or ".local" in p.parts or p.suffix in {".db", ".sqlite", ".sqlite3", ".pem", ".key"} for p in KIT.rglob("*") if p.is_file())
    secret_hits = []
    for path in KIT.rglob("*"):
        if path.is_file() and path.suffix in {".txt", ".md", ".json", ".py", ".html", ".xml"}:
            if re.search(r"Bearer\s+[A-Za-z0-9_-]{32,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----", path.read_text(encoding="utf-8-sig")):
                secret_hits.append(path.relative_to(KIT).as_posix())
    assert not secret_hits, "Potential credentials in selected pack content"
    copied_ok = all(sha((KIT / target).read_bytes()) == sha(source.read_bytes()) for target, source in COPIES.items())
    assert copied_ok
    write("PACKAGE_CHECKS.json", json.dumps({"created_utc": datetime.now(timezone.utc).isoformat(), "scope": "Presentation source-pack checks only; application suites not rerun", "copied_source_files": len(COPIES), "copy_hashes_match": copied_ok, "screenshots_verified": len(visual), "json_documents_parse": True, "recorded_counts_match_source": True, "credential_filename_check": "passed", "credential_pattern_check": "passed", "private_runtime_or_study_outcomes_included": False, "new_computation_jobs": 0}, indent=2))
    manifest = []
    for path in sorted(KIT.rglob("*")):
        if path.is_file() and path.name != "FILE_MANIFEST.json":
            name = path.relative_to(KIT).as_posix()
            manifest.append({"path": name, "bytes": path.stat().st_size, "sha256": sha(path.read_bytes()), "source": COPIES[name].relative_to(ROOT).as_posix() if name in COPIES and COPIES[name].is_relative_to(ROOT) else "user-supplied official deck" if name in COPIES else "prepared for this presentation pack"})
    write("FILE_MANIFEST.json", json.dumps({"scope": "Packaging integrity, not authenticated authorship or scientific validation", "files": manifest}, indent=2))
    with zipfile.ZipFile(ZIP, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(KIT.rglob("*")):
            if path.is_file():
                archive.write(path, KIT.name + "/" + path.relative_to(KIT).as_posix())
    with zipfile.ZipFile(ZIP) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(manifest) + 1
        for item in manifest:
            assert sha(archive.read(KIT.name + "/" + item["path"])) == item["sha256"]
    print(json.dumps({"folder": str(KIT), "zip": str(ZIP), "files": len(manifest) + 1, "bytes": ZIP.stat().st_size, "screenshots": len(visual), "copied_sources": len(COPIES), "archive_verified": True}, indent=2))


if __name__ == "__main__":
    main()
