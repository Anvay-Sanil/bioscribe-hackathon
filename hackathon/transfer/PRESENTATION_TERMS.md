# BioScribe presentation: scientific and computational terms

Use the short definitions to prepare for questions. The “say it this way” lines are safe, concise descriptions of this project's demonstrated scope. Terms marked **proposal only** are not capabilities to present as implemented.

## The essential terms to remember

1. **Molecule:** A group of atoms connected by chemical bonds. A molecule's written representation is input to the calculation, not the physical molecule itself.
2. **SMILES:** A text notation describing a molecular graph: atoms and their bonds. BioScribe accepts a declared subset of plain SMILES, one molecule per input row.
3. **Molecular graph:** A representation with atoms as nodes and bonds as edges, plus properties such as formal charge, isotope and stereochemical specification.
4. **Valence:** The allowed bonding pattern of an atom in a chemical structure. An impossible bonding pattern may make an input invalid under the parser and chemistry rules.
5. **Stereochemistry:** The three-dimensional arrangement of atoms, especially around a stereogenic centre or double bond. Different stereoisomers can have different biology. Missing stereochemistry means the input did not specify a choice; software must not guess one.
6. **Descriptor:** A number calculated from a molecular structure, such as molecular weight or polar surface area. It describes structure according to a defined calculation; it is not an assay measurement.
7. **TPSA:** Topological polar surface area, an estimate from molecular topology of the molecule's polar surface area, usually reported in square angstroms. It is a calculated descriptor, not a measurement of membrane crossing.
8. **LogP:** A calculated estimate of partitioning between octanol and water for the represented molecular form. BioScribe's number comes from RDKit. It is not an experimentally measured value, and ionization/pH context matters for real compounds.
9. **Replay:** Re-running a saved computation from its declared inputs and compatible implementation, then comparing the resulting scientific output. BioScribe replay checks computational agreement, not whether biology agrees with the output.
10. **Evidence state:** A label explaining whether and how a value exists. `not_computed`, `not_available` and `not_applicable` mean different things and must not be replaced with zero or an empty-looking blank.
11. **Checksum/hash:** A digest that detects a difference in bytes or a defined payload. A hash alone does not identify who made the file, prove when it was made, or establish scientific truth.
12. **Scientific validation:** Testing whether predictions work for a precisely specified endpoint and intended population using appropriate independent evidence. Passing software tests is not scientific validation.

## Chemistry and molecular identity

| Term | Plain-language meaning | What it means in BioScribe |
| --- | --- | --- |
| **Atom** | A chemical element such as carbon, oxygen or nitrogen. | A vertex in the parsed graph; parser limits apply to molecule size. |
| **Bond** | A connection between two atoms, with a bond order such as single, double or aromatic. | A graph edge whose validity is checked by the chemistry toolkit. |
| **Molecular formula** | Counts of the different elements in a molecule, such as C, H and O. | Not a complete identity: isomers may share a formula but differ in connectivity or stereochemistry. |
| **Formal charge** | The integer charge assigned to an atom or molecular graph by its representation. | Preserved. BioScribe does not silently neutralize charged inputs. |
| **Fragment / salt** | A structure containing disconnected components; a salt may include a charged drug and counterion. | Fragments are preserved. The app does not silently strip salts or choose a “parent” molecule. |
| **Isotope** | An atom variant with a specified neutron count, for example deuterium. | Preserved as part of the input graph. |
| **Tautomer** | A related form that changes the positions of hydrogens and double bonds while retaining the same heavy-atom framework. | Distinct tautomers remain distinct. BioScribe does not automatically merge or pick one. |
| **Protonation state** | Whether a site has gained or lost a proton; this can depend on solution conditions such as pH. | Preserved as supplied. No pH or physiological form is inferred. |
| **Canonical SMILES** | A toolkit-generated, standardized text ordering for a molecular graph under that toolkit and version. | Useful for comparing graph representations under a declared policy; not a universal biological identity or a promise that all toolkits produce the same text. |
| **Canonical isomeric SMILES** | A canonical text form that includes represented isotopes and stereochemistry. | Used for graph identity under BioScribe's policy. It does not prove a physical sample's purity or identity. |
| **Molecular identity** | The rule used to decide whether two inputs count as the same thing for a particular task. | Must state what is preserved. Charge, salts, isotopes, stereochemistry and tautomers can change the answer. |
| **Normalization** | A deliberate transformation applied to input, such as standardizing a structure. | BioScribe records its limited declared parsing/identity policy. It does not do silent salt removal, tautomer standardization, protonation adjustment or stereochemistry completion. |
| **Sanitization** | Toolkit checks that a molecular graph follows its supported chemical rules and assigns derived graph properties. | A parsing/structure-quality step; passing it does not prove that the written structure is the intended compound in a paper or vial. |
| **Ambiguous input** | An input that does not specify enough to choose one interpretation. | Keep the ambiguity explicit; do not invent a molecule or descriptor value. |
| **Invalid input** | An input that cannot be accepted under the declared parsing rules. | BioScribe returns a diagnostic and withholds calculated descriptors for that row. It distinguishes supported failure reasons. |

## Descriptors, scores and biological evidence

| Term | Plain-language meaning | Safe explanation |
| --- | --- | --- |
| **Molecular weight (MW)** | A mass estimate calculated from a molecular formula and isotope composition, usually in g/mol. | “A computed property of the accepted structure.” It is not an activity result. |
| **Aromatic fraction** | A declared ratio of aromatic heavy atoms to all heavy atoms, where heavy atoms are non-hydrogen atoms. | When there are no heavy atoms, the denominator is zero; the value is `not_applicable`, not zero. |
| **QED** | Quantitative Estimate of Drug-likeness: a heuristic summary of several molecular descriptors, scaled to a conventional 0-to-1 range. | “A calculated drug-likeness heuristic.” It is not a probability of being a drug, safe, active or successful. |
| **Descriptor-distance score** | BioScribe's dimensionless arithmetic distance from chosen molecular-weight and TPSA reference values. | Formula: `abs(MW - 350)/350 + abs(TPSA - 75)/75`. Lower values sort first. It is an unvalidated prioritization heuristic, not an affinity or activity prediction. |
| **Ranking / shortlist** | An ordering of candidates under an explicitly named rule and selection budget. | Ranking by a score describes order under that rule; it does not establish confirmed hits. Ties use an input-hash/index rule and can be representation-sensitive. |
| **Assay** | A defined laboratory procedure that measures a biological or chemical response under specified conditions. | A descriptor calculation is not an assay. Assay version, construct and conditions matter when interpreting activity data. |
| **Endpoint** | The particular quantity or classification a study predicts or measures, under specified conditions. | There is no validated BioScribe affinity, toxicity, half-life or PK endpoint in the supported demo. |
| **AC50 (proposal only)** | The concentration at which a fitted concentration-response curve reaches half of its defined maximal effect. | Appears in the blocked ALDH1A1 study proposal, not in the working app's experimental results. Do not imply BioScribe measured or predicted it. |
| **Applicability domain** | The chemical and experimental region for which a specific model has justified evidence. | A prediction outside its supported domain should be withheld or flagged. No validated predictive model/domain is installed for the ranking heuristic. |
| **Sensitivity / specificity** | Sensitivity measures positives correctly detected; specificity measures negatives correctly rejected under a defined label threshold. | Do not derive either from parser tests or the six frozen compound identity records. |
| **Precision / recall** | Precision is the fraction of selected/predicted positives that are positive; recall is the fraction of all positives retrieved. | Need suitable, adjudicated assay labels and a defined evaluation set. The synthetic learning exercise does not provide biological precision. |
| **Enrichment** | Hit yield in a selected subset relative to a stated baseline or eligible population. | Requires real, appropriately curated labels and clearly stated denominator/comparator. No performance claim is supported by synthetic labels. |
| **Confidence / uncertainty** | A quantified description of uncertainty with a defined statistical interpretation and calibration evidence. | BioScribe does not provide calibrated predictive confidence. Do not call QED or a heuristic score “confidence.” |

## Missingness, records and provenance

| Term | Plain-language meaning | BioScribe use |
| --- | --- | --- |
| `not_computed` | The calculation did not run or did not produce a value. | Example: invalid input. It is not zero or negative evidence. |
| `not_available` | The requested evidence/model/result is unavailable. | Example: an unsupported prediction endpoint. It is not a reassuring result. |
| `not_applicable` | The quantity has no meaningful definition for this input. | Example: a fraction with no heavy atoms in its denominator. It is not the same as missing data. |
| `not_assessed` | No qualifying assessment was performed. | Toxicity/PK and biological prediction remain explicitly unassessed. |
| **Provenance** | Information connecting a result to its inputs, methods, software and reference data. | Helps reconstruct which computation was performed. Provenance records alone do not authenticate the human author. |
| **Run ID** | A unique identifier for one submitted computational job. | Links a request, persisted job, result and export in the supported workflow. |
| **Frozen snapshot** | A fixed copy of specified records, retained with content identities so it is not fetched live at every run. | BioScribe has six identity records for three compounds from PubChem/ChEMBL. This is a tiny identity snapshot, not the entire databases and not an assay dataset. |
| **SHA-256** | A cryptographic hash function that produces a 256-bit digest, often shown as 64 hexadecimal characters. | BioScribe uses hashes to compare bytes or declared payloads. A recomputed hash can still accompany a forged result; fresh replay tests the calculation correspondence. |
| **Integrity** | Whether data match the expected bytes or recorded relationship. | Hash agreement supports integrity under a stated comparison. It does not, by itself, show who created the bytes. |
| **Authenticity / authorship** | Evidence that a particular trusted person or system created or approved a record. | Not established by an unsigned checksum or imported demo capsule. |
| **Dependency lock** | A file naming exact software-package versions used to reconstruct an environment. | The Python and frontend locks support matching installation. A lock does not prove every operating system or future machine will behave identically. |
| **Deterministic** | Same declared computation and inputs produce the same output under the same relevant implementation/environment. | State the scope. Do not broaden this to “any molecule on any machine.” |
| **Reproducible** | Another execution can repeat a result with documented inputs, methods and environment. | Recorded Windows/Linux matches were on one physical computer; a second-machine pass is not established. |
| **Replay package** | A saved bundle containing the request, result and the declared source/dependency/reference evidence needed for replay. | Uploaded source text is inspected as data and is not executed. Fresh replay needs a compatible trusted installed engine. |
| **Eight-decimal comparison** | The scientific payload is normalized at eight decimal places before hashing/comparison. | Say “the declared result payload matched at eight-decimal reporting precision,” not “bitwise identical in every floating-point detail.” |

## Computing and software architecture

| Term | Plain-language meaning | BioScribe example |
| --- | --- | --- |
| **Parser** | Software that reads text and turns it into a structured representation. | The SMILES parser applies the declared one-structure input policy and reports why unsupported text is rejected. |
| **Schema** | A formal definition of allowed fields, data types, required values and constraints. | Strict Pydantic/API schemas and browser validation make outputs follow a defined contract. |
| **Type validation** | Checking that values have the required form, such as a number being finite and its unit being correct. | Helps prevent missing metadata or a dimensionless heuristic from being presented as an energy measurement. |
| **API** | A defined interface through which software components exchange requests and responses. | Next.js UI communicates with the FastAPI service using versioned endpoints/contracts. |
| **Persisted job** | A computational request and state saved to storage, rather than existing only in one page or process's memory. | SQLite stores owner-scoped run state so a run can be retrieved or exported. |
| **Worker** | A separate process that performs queued computation. | The bounded worker computes with the pinned runtime; a UI success message alone is not proof of a successful run. |
| **Queue / concurrency** | A queue holds pending work; concurrency is how many jobs run at once. | Conservative workstation bounds control local resource use; they are not production throughput measurements. |
| **Retry / lease** | A retry is another attempt after failure. A lease temporarily records which worker owns a job. | Attempt fencing prevents a stale worker from publishing a result after its lease is superseded. |
| **Idempotency** | Repeating an identical request under a declared key does not accidentally create a different unintended effect. | Supports safe request handling. It does not mean arbitrary distinct requests are the same molecule or same run. |
| **JSON** | A structured text format for data exchanged or stored by applications. | Run exports preserve typed fields and are validated when loaded. A valid JSON document is not automatically scientifically valid. |
| **SQLite** | A file-based relational database engine. | Used for local persisted jobs; a local file is not a managed distributed or protected production database. |
| **Frontend / backend** | The frontend is the user interface; the backend handles API logic, persistence and computation. | Browser input and displayed output are checked against backend runs and run IDs. |
| **Build / typecheck / lint** | Build packages the app; typecheck checks typed code; lint catches configured code issues. | Recorded passes support code integration quality. They do not measure scientific accuracy or user value. |
| **Unit / integration / browser check** | A unit check examines one part; an integration check exercises connected parts; a browser check exercises a UI path. | Counts are tied to recorded scope and date. Counts overlap across iterations and must not be summed as unique tests. |
| **Regression test** | A saved check guarding against a previously identified bug returning. | R1 compound attribution, R2 parser reinterpretation/dummy graph and R3 correlation direction have targeted regression cases. |

## Terms from the blocked study proposal: learn the words, keep the status clear

- **ALDH1A1:** A human enzyme named aldehyde dehydrogenase 1A1. It is the proposed target in draft study BS-RANK-001, not a validated BioScribe target.
- **UniProt accession P00352:** A reference-database identifier for ALDH1A1. A reference-sequence match does not establish the identity of a particular experimental protein construct.
- **Propionaldehyde-dependent NAD+ reduction / NADH fluorescence:** The measurement approach named in the proposed PubChem assay record. Do not present it as an experiment BioScribe ran.
- **Concentration-response:** Measurements across concentrations used to characterize how an assay signal changes with dose.
- **Orthogonal confirmation:** Checking a result with a meaningfully different assay or measurement method that can reveal artifacts of the first assay.
- **Fixed-library descriptive replay:** Calculate exact selections and hit counts for one frozen, fully labelled library. The values describe that library conditional on its adjudicated labels; they do not automatically generalize to other libraries.
- **Holdout set:** Data kept from model developers until a planned evaluation, to reduce tuning to the answers. A protected holdout and custodian are not currently established for BS-RANK-001.
- **Preregistration:** A dated study plan fixed before outcome access, including claims, analysis rules, thresholds, dataset and responsible roles. The proposed study has not been preregistered.
- **Independent statistical reviewer / data custodian:** People assigned to review methods or control test-label access. No named appointments are documented in the supplied materials.

## Pronunciation quick guide

- **SMILES:** Commonly pronounced “smiles.” It stands for *Simplified Molecular Input Line Entry System*.
- **RDKit:** Say “R-D-Kit.” It is the cheminformatics software library used for molecular parsing and descriptor calculations.
- **TPSA:** Say the letters; “T-P-S-A.”
- **QED:** Say the letters or “Q-E-D.”
- **ChEMBL:** Commonly pronounced “kemble.”
- **SHA-256:** “S-H-A two-fifty-six.”
- **ALDH1A1:** Say the letters/numbers slowly; it is fine to call it “the proposed enzyme target” after the first full name.
- **AC50:** “A-C fifty.” It is study-proposal vocabulary only for this project.

## Short answers for judges

**Are these predicted drug candidates?** No. The output includes computed descriptors and unvalidated orderings. It does not confirm hits, drug activity or safety.

**What does replay prove?** That a compatible trusted engine recomputes the saved declared payload at the stated precision. It does not show the molecule is biologically active or that an author is authenticated.

**If the hash matches, why replay?** A changed file can be given a freshly calculated matching checksum. Replaying checks whether the saved output agrees with computation from the saved inputs and declared method.

**Are salt forms or tautomers automatically treated as the same?** No. The declared policy preserves fragments, charges and distinct tautomer/protonation representations; it does not silently standardize them.

**Does passing RDKit parsing prove the real compound's identity?** No. It shows the text produced a graph accepted by the selected parser rules. Provenance to a source or physical sample is a separate evidence question.

**Is BioScribe an AI predictor?** The supported demonstration uses deterministic cheminformatics and typed validation, not a language-model prediction pipeline.

**Does it work identically on any computer?** That broad claim has not been established. Recorded Windows/Linux replay matched on one physical host under declared runtimes.

**Have you proved students benefit?** No. Student usefulness remains untested.

**Which terms should you avoid using as product claims?** “Validated affinity,” “confirmed safety,” “clinical-grade,” “AI drug discovery,” “100% accurate,” “works on every machine,” “first ever” and “preregistered ALDH1A1 study.”
