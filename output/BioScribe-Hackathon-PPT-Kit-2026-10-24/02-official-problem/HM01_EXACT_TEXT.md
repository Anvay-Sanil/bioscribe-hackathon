# Official slide 16, exact text

Source: Problem_Statements_hypn.pptx, supplied by the user.

HM-01

Track 04 · Health & MedTech

ProvenanceLab — Reproducible Molecule Analysis with Evidence Checks

PROBLEM STATEMENT

How might we help biotechnology students analyse and compare molecules reproducibly while clearly identifying invalid inputs and missing evidence? Build a pipeline that validates molecular inputs precisely, computes and compares properties, never silently fills missing values, and can reproduce any previous run exactly.

EXPLANATION

SMILES copied from papers may be broken (impossible valence), ambiguous (missing stereochemistry) or different forms of the same molecule (salts, charged forms, tautomers). Toolkit and library versions can give different property values, and spreadsheets may fill gaps silently.

Teams must download frozen PubChem and ChEMBL snapshots so analyses don't depend on live services, and build their own test set of broken and challenging inputs.

KEY CHALLENGES

Classifying invalid inputs precisely, not just “invalid”

Determining when two inputs are the same molecule

Producing identical results across reruns and machines

Distinguishing “not computed”, “not available” and “not applicable”
