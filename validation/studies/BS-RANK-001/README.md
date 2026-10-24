# BS-RANK-001 — candidate dossier and study-design prerequisites

Date: 17 October 2026. Status: **preparation only; not a completed protocol**.

The reviewer accepted the Phase 4 framework for study design and independently confirmed 45 software checks, the incomplete template's exit 2, 15 Phase 4 hashes and 78 Phase 3 hashes. Scientific validation is incomplete. This dossier preserves the accepted implementation and prepares a possible first ranking study; it does not select an assay, acquire an evaluation cohort, assign reviewers or authorize unblinding.

## Implemented candidate proposed for the first study

`prioritization_heuristic/1.1.0` is already implemented in `backend/bioscribe/compute.py` and registered in `backend/bioscribe/registry.py`:

```text
score = abs(MW - 350) / 350 + abs(TPSA - 75) / 75
ranking direction = lower first
```

MW is RDKit `Descriptors.MolWt` in g/mol; TPSA is `rdMolDescriptors.CalcTPSA` in square angstroms; the resulting score is dimensionless. RDKit is pinned to 2025.3.3. The molecular input policy is `plain_smiles_concrete_graph/1.1.0`: no trimming, names, CXSMILES, whitespace/control characters, dummy/query atoms or query bonds; retain fragments, charge, isotopes and stereochemical specification. Accepted graphs are bounded at 256 atoms; the application separately bounds each SMILES string at 2,048 characters and submissions at 16 molecules. Any study batching must preserve these checks and account for every input and failure.

The candidate has no target or assay input and no training routine in the active implementation. The historical empirical basis for the descriptor targets 350 and 75 is not documented as a validated optimization. This is **not** a claim that no developer ever saw relevant data. Development exposure must be declared in the eventual study record. Neither target specificity nor useful ranking performance can be inferred from the formula.

The only proposed claim class is **ranking utility within a precisely defined assay population**. Affinity prediction, physical-energy units, toxicity, safety, pharmacokinetics and calibrated uncertainty remain outside this candidate. The study must be allowed to conclude that the heuristic is useless or worse than its comparators.

`candidate.json` records the method and input-policy metadata copied from the accepted registry. `method-source/` preserves the accepted Python package and lock bytes; `source-manifest.json` binds the copied files to their original accepted hashes. These are reproducibility snapshots, not authenticated authorship, preregistration or independently protected custody.

## Required decisions before this becomes a protocol

| Decision | Information still required | Why this cannot be supplied by a software default |
| --- | --- | --- |
| Target and endpoint | Exact target/construct/version/organism, measurement type, assay conditions and definition of a useful hit | The candidate has no target; picking whichever assay gives attractive results would select the outcome after inspection. |
| Intended decision and population | Which molecules would actually be offered for selection, selection budget, users and experimental action | Enrichment in a literature-selected cohort need not represent hit discovery in an intended screening population. |
| Minimum useful improvement | Minimum additional confirmed hits or other scientific benefit at the chosen budget; tolerable loss, coverage and subgroup requirements | Statistical significance alone cannot determine operational usefulness. |
| Independent study roles | Scientific owner, statistical reviewer and data custodian, with conflicts/access responsibilities | An assistant cannot appoint an independent reviewer or attest that a person's review occurred. |
| Protected custody | Actual store/service, administrator, access policy, timestamped receipt mechanism and holdout release authority | A local directory, local hash or private filename is not the accepted independent trust boundary. |

Two clarification requests are pending: the first bundles target/endpoint, intended decision and minimum useful improvement; the second asks for the independent roles and protected repository. Answers need not contain credentials or secrets.

No arbitrary numerical threshold or sample size is adopted here. Once the intended budget `k` and minimum useful additional hits `m` are justified, `m/k` provides an interpretable candidate absolute hit-rate improvement for review. It is not automatically an accepted margin. Precision/power still depends on expected prevalence, comparator performance, dependence/cluster structure, exclusions and abstention. These inputs must come from appropriate development/pilot evidence or explicit conservative planning assumptions, never exposed confirmatory outcomes.

## Dataset acquisition preparation — metadata only

The source documentation was inspected, but no measurement table, compound cohort, empirical labels or holdout was downloaded or analysed in this preparation.

| Candidate source route | Verified acquisition detail | Still needed before suitability or freezing can be claimed |
| --- | --- | --- |
| BindingDB archived release | The official download page recommends its long-term archive for a fixed referencable version and distinguishes article-curated data from imports. It distributes assay text separately, using reaction-set-to-entry/assay mappings. | Choose an archive/release after the study scope is set; retain measurement, mapping and assay-description files together; verify license, raw hashes, target/construct and original assay evidence. No cohort or sample count has been established. |
| ChEMBL versioned release | Official documentation describes database/structure/sequence releases, assay-to-target confidence and standardized activity fields. | Select a compatible release and exact endpoint subset; review original assays, validity flags, source lineage and transformations. Target-mapping confidence is not uncertainty calibration or a label-quality guarantee. |

Sources consulted: [BindingDB download documentation](https://www.bindingdb.org/rwd/bind/chemsearch/marvin/Download.jsp), [ChEMBL downloads](https://chembl.gitbook.io/chembl-interface-documentation/downloads), [ChEMBL assay/activity documentation](https://chembl.gitbook.io/chembl-interface-documentation/frequently-asked-questions/chembl-data-questions). The page descriptions establish acquisition mechanics, not biological suitability. No release number is silently chosen from a mutable “latest” URL.

If the intended decision is prospective hit discovery, a cohort selected for publication because compounds were already potent can produce selection bias. A sufficiently complete assay series or screen with traceable tested negatives may be preferable; whether one exists for the chosen endpoint is unresolved. Missing or unmeasured compounds cannot be relabelled inactive to create a balanced dataset.

## Analyses to complete after scope and custody are established

1. The custodian acquires and hashes the chosen release and original source evidence. Curators reconcile identifiers, assay context, units/relations, repeated measurements, invalid or unresolved labels and exclusions. Source adjudication and agreement must actually occur; planned review is not completed review.
2. An audited curation process derives duplicate/source-lineage groups and the study-relevant chemical series/scaffold or similarity groups from actual structures. Group algorithms/cutoffs and any temporal/source constraints are fixed before confirmatory scoring. A group column filled with unique IDs does not constitute leakage analysis.
3. Define development/design and protected test partitions from those actual relationships. The candidate is fixed and needs no invented training examples; any development partition is for label-policy, domain and study planning. Record the absence of parameter fitting explicitly. Held-out labels remain inaccessible to the candidate-evaluation workflow until approved release.
4. Freeze the selection and tie policy, activity definition, comparators and domain/abstention rules. Candidates for comparator review include random selection and the fixed single-descriptor components; these are proposals, not already implemented study selectors. A scientific owner must determine the relevant operational comparator.
5. Use development or justified pilot information to calculate numerical sample-size/precision requirements and conservative confidence-bound rules. Predeclare paired comparator margins, eligible-population coverage, subgroup support/performance requirements and multiplicity handling. Insufficient data leads to an inconclusive study, not reduced thresholds after inspection.
6. Complete all protocol fields and seven artifact bindings, independently review the substance, obtain a protected preregistration receipt, then permit blinded execution. Add and test any needed evaluation/selection/interval code separately; the existing descriptive metric helper and structural preflight are not the full study evaluator.

The framework's separate model/prediction assessments remain in force, consistent with the [OECD assessment framework](https://www.oecd.org/en/publications/q-sar-assessment-framework-guidance-for-the-regulatory-assessment-of-quantitative-structure-activity-relationship-models-and-predictions-second-edition_bbdac345-en.html). A ranking study cannot create a physical affinity prediction record.

## Current completion record

| Required element for the next scientific review | Status in this dossier |
| --- | --- |
| Implemented candidate | Identified and source snapshot preserved; use in the first study is proposed |
| Precise endpoint/population/assay/decision | Awaiting scientific scope input |
| Frozen empirical dataset and actual source adjudication | Absent |
| Actual leakage analysis and independent sampling units | Absent; depends on the selected cohort |
| Protected holdout custody and independent roles | Awaiting actual assignments and infrastructure |
| Exact justified thresholds, intervals, sample size, comparator margins, coverage and subgroup rules | Unassigned; dependent on scope and planning evidence |
| Completed, reviewed, preregistered protocol | Not achieved |
| Confirmatory evaluation | Not run |

This preparation is not submitted as the requested completed-protocol review. It records the available candidate and the missing decisions needed to produce that deliverable. Application code, accepted framework files, schemas, locks and their ledgers remain unchanged. Scientific release, sensitive-data intake and existing deployment gates remain blocked.
