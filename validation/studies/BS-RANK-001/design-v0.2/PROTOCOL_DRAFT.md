# BS-RANK-001: ALDH1A1 assay-hit prioritization — protocol draft 0.2

**Status: proposed design; not frozen, preregistered, scientifically qualified or ready for confirmatory evaluation.** Date: 17 October 2026, Asia/Calcutta. This version records the user's ALDH1A1 specification and unresolved custody decisions. It supersedes the *unassigned target and utility choices* in the preparation dossier without rewriting that dossier or its evidence.

## 1. Decisions fixed for this proposed study

| Item | Specification | Status |
| --- | --- | --- |
| Target | Human ALDH1A1, UniProt P00352; verify the experimental construct before accepting records | Target chosen; construct unverified |
| Assay | PubChem AID 1030, requested version 1.1; propionaldehyde/NAD+ reaction with NADH fluorescence readout | Version retrieval discrepancy remains open |
| Claim | Better retrieval of recorded assay-positive compounds in the frozen, explicitly defined eligible population | Proposed utility claim; no demonstrated capability |
| Hit definition | Quality-controlled inhibitory concentration response, AC50 **<=10 micromolar** and maximum inhibition **>=50%** | Proposed numerical cutoffs; source-field, sign and QC mapping unapproved |
| Unknowns | Inconclusive results and unresolved optical interference remain unknown | Must not become negatives or disappear from coverage reporting |
| Decision | Select **exactly 100 distinct compounds** for independent dose-response and orthogonal confirmation | Retrospective recovery is the initial study; experimental confirmation is a later study |
| Candidate | Existing `prioritization_heuristic/1.1.0`, unchanged, ascending score | Implemented, unvalidated |
| Comparators | Descending RDKit QED and uniform random selection without replacement; same eligible population and budget | Algorithms specified below; study execution absent |
| Co-primary utility margins | At least five additional positives per 100 vs QED; at least twice the expected random hit yield | Specified by user, not estimated from data |
| Qualification gates | Both preregistered **one-sided 95% lower confidence bounds** must satisfy: precision difference **>=0.05**, enrichment **>=2.0** | Exact numerical margins specified; interval validity and power unresolved |
| Adaptation | No retrospective target switching, score/descriptor-target retuning, convenient tie-breaking or margin reduction after failure | Binding design constraint |

Positive performance would support only assay-hit prioritization in the studied population. It would not establish confirmed enzyme inhibition, selectivity, therapeutic benefit, binding affinity, safety or pharmacokinetics. QED is a comparator descriptor, not an ALDH1A1 predictor with established performance.

## 2. Reference checks actually performed

Only public target/reference-sequence and assay-description metadata were acquired. No compound structures for the study population, per-compound outcomes, LIT-PCBA labelled files, assay-result table, rankings or observed hit counts were accessed in this work. The LIT-PCBA landing page was consulted as source documentation; no download was followed. No claim is made about all historical developer exposure to public datasets.

**Target reference.** The retained UniProt record identifies P00352 as human ALDH1A1, taxon 9606, entry version 234, sequence version 2, release 2026_03. The reference sequence is 501 residues. NCBI accession AAP35567.1, named in the retrieved assay description, has an exactly matching 501-residue sequence; both normalized sequences have SHA256 `3643038221afeedeeb244b74f19a4aba11f4c038262b9d8460260d2b476ded7f`. This proves correspondence between the downloaded reference sequences, **not the experimental construct, protein preparation, tags, mutations, purity or lot identity**. [UniProt reference](https://rest.uniprot.org/uniprotkb/P00352.json), [NCBI reference sequence](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=AAP35567.1&rettype=fasta&retmode=text).

**Version discrepancy.** Both the unversioned PubChem description request and the request with `?version=1.1` returned an object declaring `aid.id=1030`, `aid.version=2`, `revision=1`. The response name was the qHTS ALDH1A1 inhibition assay. The URL parameter is not proof that historical version 1.1 was returned. The retrieved bytes are retained as **returned version 2/revision 1 metadata**, not accepted as version 1.1. The official REST specification demonstrates a version parameter for assay records, but this observation does not establish that the description operation honours it. Do not fetch a full result-bearing record while holdout access remains blocked merely to resolve this discrepancy. [Requested study version](https://pubchem.ncbi.nlm.nih.gov/bioassay/1030/version/1.1), [REST specification](https://pubchem.ncbi.nlm.nih.gov/pcfe/docs/markdown/pug-rest.md).

The returned 2.1 description reports HEPES pH 7.5 with Tween 20, NAD+ and propionaldehyde, ALDH1A1 enzyme, incubation and kinetic fluorescence measurements. Exact concentrations/timings/wavelengths are preserved in the metadata snapshot; they are **not yet approved experimental conditions for the requested 1.1 study**. Version 1.1 must be obtained and authenticated by the custodian, or a separately reviewed prospective amendment must explicitly choose a different version before outcomes are exposed. The target and numerical utility margins cannot be switched to rescue performance. [Retrieved assay description](https://pubchem.ncbi.nlm.nih.gov/rest/pug/assay/aid/1030/description/JSON).

**Label mapping is not trivial.** The returned description separately defines `Potency`, fitted `Efficacy`, `Max_Response`, curve quality, excluded titration points and background fluorescence. It also warns that potency can include extrapolated AC50s. A fitted efficacy is not automatically the observed maximum inhibition. An inhibitory sign convention cannot be inferred by applying an absolute value. The curator must establish the historical-version fields, micromolar conversion, activity-to-inhibition transform, direction, fit quality, concentration coverage, optical-interference handling and independent controls before labels are accepted. No numeric R2 cutoff or curve-class whitelist has been invented here. [Retrieved field definitions](https://pubchem.ncbi.nlm.nih.gov/rest/pug/assay/aid/1030/description/JSON).

## 3. Candidate, comparator and exact-budget policy

The candidate source and lock snapshots remain those in `../method-source/` and `../source-manifest.json`. The score is `abs(MW-350)/350 + abs(TPSA-75)/75`, where the inputs are the pinned RDKit molecular-weight and TPSA computations. Do not fit the constants to ALDH1A1 data or transform this value into affinity units.

Use `plain_smiles_concrete_graph/1.1.0` and the existing input/resource limits. Preserve charge, fragments, isotopes, specified/unspecified stereochemistry and tautomer representation. Deduplication must reconcile assay substances and exact accepted chemical identities without merging conflicting measurements or erasing material distinctions. The final sampling unit and replicate policy remain subject to curation review.

**QED implementation specification.** Use RDKit 2025.3.3, `rdkit.Chem.QED.qed(mol, w=QED.WEIGHT_MEAN)` on the same accepted graph. The inspected local implementation has mean weights `(0.66, 0.46, 0.05, 0.61, 0.06, 0.65, 0.48, 0.95)` in `(MW, ALOGP, HBA, HBD, PSA, ROTB, AROM, ALERTS)` order. Its source digest is recorded in `design-decisions.json`. This selects the pinned RDKit implementation; it does not assert numerical identity with every historical QED implementation. [RDKit QED documentation](https://www.rdkit.org/docs/source/rdkit.Chem.QED.html).

**Tie-break proposal, fixed before any study scoring.** For each unique accepted chemical identity, compute `entity_sha256 = SHA256(UTF8(canonical_isomeric_SMILES))` using the pinned RDKit representation. Then compute `tie_key = SHA256(ASCII("BS-RANK-001/tie/v1") || 0x00 || ASCII(entity_sha256))`. Sort candidate rows by `(unrounded_score ascending, tie_key ascending, entity_sha256 ascending)` and QED rows by `(unrounded_QED descending, tie_key ascending, entity_sha256 ascending)`. Reject duplicate identity keys and unequal canonical strings sharing a digest; reconcile duplicate assay records before constructing selection units. Do not use outcome, curve class, potency, activity score, file order or positive/negative source filename in tie-breaking. No seed shopping, score rounding, epsilon ties or tie expansion is allowed. Exactly 100 distinct eligible compounds must be returned, or selection fails.

The same frozen pool applies to both algorithms and the random comparator. Label-independent parse or descriptor failures must be accounted for before the pool is frozen. A late candidate/QED failure cannot trigger separate complete-case pools or silent replacement after outcome access; the run becomes incomplete pending the predeclared failure policy. This proposal still needs a tested study selector and evaluator; it does not change the existing helper's tie-expanded enrichment semantics.

**Uniform random comparator.** Conditional on a complete frozen library with N compounds and A positives, a uniform 100-subset without replacement has expected hits `100*A/N`. Use that expectation for the co-primary enrichment denominator. Do not choose a lucky or unlucky random subset as the baseline. Its randomization distribution is hypergeometric with variance `100*(A/N)*(1-A/N)*(N-100)/(N-1)` for N>1. This distribution describes random-selection variability; it is not a confidence interval for the deterministic heuristic or its QED difference. If illustrative random selections are later generated, their RNG, seed schedule and all repetitions must be fixed before label access and remain secondary.

## 4. Empirical cohort and protected holdout

The empirical dataset is **not acquired or frozen**. LIT-PCBA's ALDH1 collection is only a candidate starting point; its provenance, assay-version correspondence, processing, structure identity and labels must be reconciled with raw source records before acceptance. Do not substitute LIT-PCBA active/inactive labels for the specified AC50/maximum-inhibition/QC definition. [LIT-PCBA source site](https://lab.drugdesign.unistra.fr/datasets/lit-pcba/).

The appointed custodian must retain immutable source payloads, records, assay version and result-schema mapping; preserve SID/CID/material lineage; reconcile contradictory or repeated records; and publish counts of all screened, structurally eligible, excluded, adjudicated and unknown units. No synthetic negatives, untested compounds or imputed model labels are permitted. Scientific and statistical reviewers must approve whether assay follow-up selection and publication create a population bias relative to the intended use.

Unknown labels are not zero. Population membership and label availability must be recorded separately. The draft does **not** authorize dropping unknowns and recomputing each method's top 100 after outcome access. Before freeze, reviewers must choose and justify either a clearly scoped adjudicated-cohort estimand with full attrition disclosure, or an analysis retaining unknowns with conservative identification bounds. If missing-label handling cannot support the primary gates, report `insufficient_evidence`. Do not silently divide by the number of known outcomes instead of 100.

Actual leakage analysis must be derived from structures and source lineage: exact chemical duplicates, alternate representations/materials, scaffold/series relationships, shared source/assay/plate information where available and development exposure. Group derivation, fingerprint/scaffold definition, similarity cutoffs, transitive grouping and acyclic-structure handling must be versioned and checked before use. A scaffold label alone is not an independent sampling unit; shared assay and other non-structural dependence require consideration. No grouping algorithm/cutoff or empirical independent-cluster count is approved yet.

The candidate has no training routine. Development/design data, if needed for QC rules or statistical planning, must be identified honestly as such and kept separate from the protected confirmatory cohort; do not invent a training population to satisfy the preflight. Any actual design/test split requires documented structural/source separation. All confirmatory outcomes stay with the appointed custodian until protocol and prediction receipts exist.

## 5. Statistical analysis plan: fixed margins and unresolved inference

Let H and Q be the two exactly-100 selections from the same frozen eligible pool. With fully adjudicated binary labels, let `h = sum(y_i for i in H)`, `q = sum(y_i for i in Q)` and `A = sum(y_i over the pool)`.

```text
precision_heuristic = h / 100
precision_QED      = q / 100
delta_precision    = (h - q) / 100
random_expectation = 100 * A / N
enrichment         = (h / 100) / (A / N)
```

Both co-primary criteria must pass: `LCB_one_sided_95(delta_precision) >= 0.05` **and** `LCB_one_sided_95(enrichment) >= 2.0`. Enrichment is undefined if A=0; fewer than 100 eligible unique compounds makes selection undefined. Neither case passes. A point difference of exactly five hits is not by itself evidence that its lower confidence bound clears five hits. Both margins are unchanged even if the heuristic underperforms.

**Finite-population distinction.** If labels for the entire frozen library are observed, h, q and A are deterministic census quantities conditional on that library. No random sampling of compounds occurred in H or Q. Adding a bootstrap does not create design-based uncertainty about those exact quantities. The requested confidence bounds require an explicit inferential population or measurement model, such as performance across future similarly sampled chemical-series libraries; that would require justified exchangeability and an appropriately restricted claim. This additional inferential scope is **not approved in this draft**. Random-selection variability cannot be recycled as the heuristic's confidence interval.

**Paired cluster-aware method gate.** The final statistical reviewer must lock an interval construction compatible with that estimand and the actual independent units. It must preserve H/Q overlap, use the same resampling or weighting realization for both algorithms, propagate uncertainty in population prevalence where appropriate, retain exactly-100 selection semantics, and address selection near the ranking cutoff. Resampling the two top lists independently or treating every compound as independent is unacceptable. Simply copying a scaffold multiple times and treating repeated molecules as distinct selections changes the operational experiment; such a bootstrap needs explicit estimand and calibration justification. Generic percentile-bootstrap output is not a validated confidence bound.

Before accepting an interval procedure, use analytic arguments and/or synthetic design simulations to assess null-boundary type-I error, one-sided coverage, rare positives, strongly uneven cluster sizes, highly correlated series, H/Q overlap, ties, unknown outcomes and insufficient support. Synthetic simulations are methodology checks, not ALDH1A1 empirical performance. Record all scenario assumptions, replicates, Monte Carlo uncertainty, seeds and failures; specify how undefined replicates lead to an inconclusive result. The interval method, resampling scheme, implementation and minimum cluster support remain null until reviewed.

The joint claim requires both components to pass. A proposed intersection-union decision rule can test each component at one-sided alpha 0.05 without claiming that two marginal intervals have simultaneous 95% coverage; its validity depends on valid component tests and no post hoc selection of endpoint/method. Any additional confirmatory subgroup claims or adaptive analyses need their own multiplicity policy. This is a design proposal for statistical review, not a completed calibration result.

**Power and sample size.** The selection budget 100 is fixed; it does not determine N, the number of independent series, assay replicates, expected positives or power. Plan the probability of passing *both* margins under a scientifically justified alternative strictly beyond the boundary, using development/pilot information or explicitly justified sensitivity scenarios. Account for H/Q selection overlap, series correlation, selection-pool size, prevalence, unknowns and assay noise. At the null boundary, passing probability should be controlled, not targeted as high power. No minimum N, independent-cluster count, target power, or accepted planning scenario is fabricated here.

**Coverage and subgroups.** Report structural eligibility, successful scoring, label adjudication and selection coverage separately. Exactly 100/100 selected compounds is an execution requirement, not a scientific coverage threshold. Numerical minimum usable-population coverage, maximum unknown fraction, subgroup definitions/support and subgroup acceptance margins remain unresolved. They must be justified and fixed before unblinding; they cannot be waived because the overall result looks favourable. Any subgroup exploration after unblinding is explicitly exploratory.

## 6. Custody, review and blocked actions

The user confirmed that no appointments or protected repository are documented. All of the following remain unresolved, with no fabricated names or approval flags:

| Role or control | Required evidence |
| --- | --- |
| Independent data custodian | Name, affiliation, conflicts, explicit acceptance; authority over labels, dataset freeze, unblinding and access records independent of score development |
| Scientific owner | Name, affiliation, conflicts, explicit acceptance; responsibility for construct/assay suitability, label adjudication and interpretation |
| Statistical reviewer | Name, affiliation, conflicts, explicit acceptance; independence from score development and responsibility for inference, power and acceptance rules |
| Protected repository | Actual location, administrator and verified institutional approval; administration outside developer/service privileges, separate label permissions, protected timestamped receipts, version retention and access logging |

Before freeze, demonstrate authorized access, denied developer/service label access, logging, retained version/receipt integrity and rollback/deletion detection at the declared boundary. Record the scope and failure modes; the current local workspace and checkpoint reference implementation do not satisfy this requirement. Public availability of source labels does not prove analyst blinding; exposure and access controls must be documented honestly.

Protocol freeze, confirmatory label access, scoring against test outcomes, unblinding, preregistration claims, runtime predictive activation, scientific release and sensitive-data intake remain blocked. This local design record fixes the proposed choices for review but is not a trusted timestamped preregistration.

## 7. Review disposition

| Element | Disposition |
| --- | --- |
| Target, budget, candidate and comparators | Specified from user response; source/QED implementation metadata inspected |
| AC50/inhibition cutoffs and two utility margins | Recorded exactly; not inferred from test results |
| Label-independent tie-break | Fully specified proposal; study implementation/tests still required |
| UniProt and assay-target reference correspondence | Exact reference-sequence match verified; actual construct still unresolved |
| Requested assay version 1.1 | Not verified; both description requests returned metadata identifying 2.1 |
| Frozen empirical dataset, source adjudication and actual leakage analysis | Absent |
| Inferential population, paired cluster interval and power | Unresolved; finite-library issue must be resolved explicitly |
| Coverage/subgroup numerical gates | Unassigned |
| Named reviewers/custodian and protected repository | Unresolved, as confirmed by user |
| Completed preregistered protocol / scientific qualification | Not achieved |

`protocol.draft.json` uses the accepted protocol schema's field structure but intentionally leaves unsupported requirements null. It must fail preflight, not masquerade as a complete study through placeholder prose. `design-decisions.json` records more detailed proposed choices and blockers; it is a design worksheet, not a runtime validation record. Verification records distinguish metadata/identity checks from software tests and scientific evaluation. The accepted Phase 3 and Phase 4 files and the earlier preparation dossier remain unchanged.
