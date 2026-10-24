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
