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
