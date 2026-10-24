# BS-RANK-001: ALDH1A1 protocol amendment — draft 0.3

**Blocked design record. Not frozen, preregistered, evaluated or scientifically qualified.** Amendment date: 17 October 2026, Asia/Calcutta. No study outcomes or candidate rankings were accessed for this amendment. No application code, accepted validation framework, dependency lock or prior evidence record is changed.

This prospective amendment adopts **PubChem AID 1030, version 2, revision 1** for the proposed study and makes the initial analysis a **descriptive fixed-library replay**. It preserves the separate confidence-bound qualification requirements. It does not authorize data acquisition, outcome access, scoring, freeze, preregistration or release.

The preserved [draft 0.2](../design-v0.2/PROTOCOL_DRAFT.md) supplies the candidate, parser, QED implementation, tie-break, source-curation and custody details. This amendment takes precedence where 0.2 requests assay 1.1, mandates a paired scaffold-cluster interval before defining inference, or leaves the initial analysis mode unspecified. Its proposed unknown-label alternatives are narrowed here: complete descriptive replay requires fully adjudicated labels for the declared fixed library. No partial-identification analysis is authorized by this draft. All other unresolved gates remain unresolved.

## 1. Prospective assay-version decision

The user authorized either authentication of historical 1.1 or explicit prospective adoption of verified 2.1. This amendment selects the latter **before any outcome access in this study work**. Historical 1.1 remains unauthenticated; it is neither relabelled nor treated as equivalent to 2.1. The reason for adoption is the returned metadata identity, not observed performance. The version decision is recorded locally for review; it is not an independently protected receipt or approval by the still-unappointed scientific owner.

Both retained description responses identify `aid.id=1030`, `aid.version=2`, `revision=1`. This includes the response requested with `?version=1.1`. The identity comes from returned objects, not the requested URL. Both payloads have SHA256:

`fd6fbc1c65c0957b1a737d33c1fa8e6bf89e81eaf103437ac53d64bb1902e2c9`

The [unversioned-request snapshot](../design-v0.2/references/pubchem-AID1030-description.json), [1.1-request/2.1-response snapshot](../design-v0.2/references/pubchem-requested-v1.1-returned-v2.1-description.json), and their acquisition records remain unchanged. These are description/field metadata, not result rows. The live [PubChem description endpoint](https://pubchem.ncbi.nlm.nih.gov/rest/pug/assay/aid/1030/description/JSON) is a source locator; the retained bytes determine the observed identity.

**What is established:** the proposed assay metadata identity is now explicitly 2.1. **What is outstanding:** an authorized custodian must bind the eventual raw outcome release, result schema, source records and integrity evidence to that identity. A future unversioned response or URL parameter cannot substitute for checking the returned release. Different versions must not be pooled or silently substituted. An unavailable matching release is a blocking condition requiring an explicit prospective amendment, not an automatic fallback.

The proposed context remains propionaldehyde-dependent NAD+ reduction measured by NADH fluorescence. The retained 2.1 description reports 100 mM HEPES pH 7.5, 0.01% Tween 20, NAD+ 1 mM, propionaldehyde 80 micromolar, enzyme 50 nM, 15-minute room-temperature preincubation and fluorescence readings immediately and after 20 minutes at excitation 360/emission 450 nm. Preserve all source conditions and controls; these metadata observations do not verify actual assay execution, construct, material identity or suitability for the proposed label rule. See the retained source protocol and [PubChem field definitions](https://pubchem.ncbi.nlm.nih.gov/rest/pug/assay/aid/1030/description/JSON).

## 2. Target, endpoint and implemented candidate

The target is human ALDH1A1, UniProt P00352, taxon 9606. P00352 sequence version 2 and the assay-description accession AAP35567.1 have matching 501-residue reference sequences in the retained snapshots. Their normalized sequence SHA256 is `3643038221afeedeeb244b74f19a4aba11f4c038262b9d8460260d2b476ded7f`.

This establishes **reference correspondence only**. Experimental protein sequence/construct, tags, mutations, expression and preparation records, material/lot lineage and relevant quality evidence still need source documentation and scientific-owner review. A matching database accession or sequence is insufficient. [UniProt snapshot](../design-v0.2/references/uniprot-P00352.json), [NCBI snapshot](../design-v0.2/references/NCBI-AAP35567.1.fasta).

The proposed positive label remains a quality-controlled inhibitory concentration response with **AC50 <=10 micromolar AND maximum inhibition >=50%**. These are study cutoffs, not established source labels. Potency units, sign convention, extrapolated fits, fitted `Efficacy` versus observed `Max_Response`, curve quality, optical interference, source QC and conflicting records require source-level adjudication. Neither absolute-value conversion nor substituting fitted efficacy for observed maximum inhibition is approved. Inconclusive results and unresolved optical interference remain unknown.

The existing candidate remains `prioritization_heuristic/1.1.0`, ordered ascending:

```text
score = abs(MW - 350) / 350 + abs(TPSA - 75) / 75
```

It is an implemented, dimensionless, target-independent, scientifically unvalidated descriptor-distance heuristic. There is no demonstrated ALDH1A1 capability. The unchanged parser is `plain_smiles_concrete_graph/1.1.0`; its strict graph and resource limits apply. No constants, parser, score direction, target or utility margin may be retuned to rescue a result. The retained [source manifest](../source-manifest.json) and dependency lock identify the candidate.

Use the same eligible pool and **exactly 100 distinct compounds** for ascending candidate score and descending RDKit 2025.3.3 `QED.qed(..., w=QED.WEIGHT_MEAN)`. Preserve draft 0.2's canonical-identity hash tie-break, full score precision and prohibition on tie expansion, label-dependent tie-breaking and late replacement. The QED source hash and weights are carried forward in `design-decisions.json`. These study selector/evaluator rules remain **specified, not implemented or tested**. Existing generic metric helpers must not be represented as an implementation of this exact-budget study.

## 3. Initial analysis: descriptive fixed-library replay

The analysis universe is **one explicitly declared fixed library**, not a sample asserted to represent all ALDH1A1 chemistry or future libraries. Its identity, eligibility, material-to-compound mapping, deduplication and replicate policy must be approved and frozen before scoring or analyst outcome access. No empirical library is currently acquired or qualified.

Complete replay requires N >=100 unique eligible compounds, successful candidate and QED computation for every member under the predeclared policy, and an adjudicated binary label for **every** member. Unknowns must be counted and reported in the curation record. They cannot be imputed as negative, silently excluded, or removed separately from each method's top 100. A scientifically justified restricted cohort, if proposed, needs its own explicit membership, attrition and intended-use scope before freeze. Any unknown remaining in the declared library makes the complete replay `insufficient_evidence`; a partial-information analysis would need a separate prospective design. A=0 permits descriptive zero-hit counts but leaves enrichment undefined and its operational comparison unmet.

After all prerequisites are satisfied, let H and Q be the exact-100 candidate and QED selections from that same library. Let N be library size, A its total assay positives, h the positives in H, q the positives in Q, and o the number of compounds shared by H and Q. Preserve selected identities, selection and label hashes, scoring versions, exclusion counts and label-adjudication provenance.

| Quantity | Exact fixed-library expression | Interpretation |
| --- | --- | --- |
| Candidate hits / precision | h; h/100 | Recorded positives selected by the candidate |
| QED hits / precision | q; q/100 | Recorded positives selected by QED |
| Additional hits / precision difference | h-q; (h-q)/100 | Paired comparison within the same library |
| Uniform random expected hits / precision | 100*A/N; A/N | Expectation over all uniformly chosen 100-subsets, without replacement |
| Enrichment over expected random | (h/100)/(A/N) = h*N/(100*A), for A>0 | Exact ratio to the random-selection expectation |
| Selection overlap | o, with 0 <=o<=100 | Describes shared compounds; does not create an inferential sample |

Retain integer counts and rational numerators/denominators; decimal displays must not alter comparisons. The point comparison to QED is met iff **h-q >=5**, equivalent to difference >=0.05. The enrichment point comparison is met iff **h*N >=200*A**, with A>0, equivalent to enrichment >=2.0. Report each as `met`, `not_met` or `undefined` only after an eligible complete replay; the current template is `not_run`. Even if both are met, the conclusion is only **“operational point margins met in this fixed library, conditional on the adjudicated labels.”** It is not scientific qualification and cannot update runtime evidence status.

When all labels are observed, these quantities are exact conditional on those labels and identities. They do not require compound-sampling confidence intervals. This does not imply biological truth or error-free labels: measurement variability, optical interference, construct uncertainty, mislabelling, coverage errors and source processing remain distinct uncertainties. The [Census Bureau's sampling/nonsampling distinction](https://www.census.gov/programs-surveys/nonemployer-statistics/technical-documentation/methodology.html) supports this general distinction; it is not evidence validating this assay or this design.

No bootstrap, confidence interval, p-value, zero-width interval or “100% confidence” will be attached to the fixed-library counts as a substitute for a measurement or sampling model. Uniform random selection has a hypergeometric distribution, conditional on N and A; its variability describes a random selection policy, not uncertainty in the observed deterministic H/Q selections. A chosen random draw is not the enrichment denominator. No random draw or simulation is needed to compute the expectation.

The intended future experimental decision remains selection of 100 compounds for independent dose-response and orthogonal confirmation. A retrospective descriptive replay does not perform those experiments or establish confirmed enzyme inhibition, selectivity, therapeutic usefulness, affinity, toxicity or pharmacokinetics.

## 4. Inferential qualification remains a separate, unmet requirement

The two existing gates are preserved without numerical or evidentiary relaxation:

| Qualification requirement | Bound and threshold | Current result |
| --- | --- | --- |
| Improvement over QED | One-sided 95% lower confidence bound on precision difference >=0.05 | Bound null; `not_assessed`; gate unmet |
| Improvement over random expectation | One-sided 95% lower confidence bound on enrichment >=2.0 | Bound null; `not_assessed`; gate unmet |

Both gates would have to pass. Two marginal 95% bounds are not asserted to form a simultaneous 95% confidence region. An eventual decision procedure and any multiplicity requirements require statistical review. Operational point comparisons cannot satisfy these gates, including when an exact conditional point value is far above the threshold. Execution success, reviewer approval of this design or completion of descriptive reporting cannot upgrade the candidate or its outputs to validated status.

The statistical reviewer must first define and justify the **inferential population and estimand**, the **sampling and/or measurement model**, actual independent units and dependence, then the **interval procedure, calibration and power/sample-size plan**. A paired scaffold-cluster method is no longer mandated before that definition. Clustering is a possible dependence treatment only if justified for the selected population and model; a scaffold alone proves neither independence nor exchangeability.

Any later procedure must address the shared selection pool, H/Q overlap, exact-100 rule, prevalence denominator, ranking cutoff, unknown outcomes and relevant chemical/assay dependencies. It must explain whether quantities are conditional on a fixed library or generalized over a defined population. A measurement model needs supporting replication/error information; it cannot be inferred from record counts. Power must target the joint qualification decision under justified alternatives, not treat a budget of 100 as a sufficient sample-size argument. Numerical coverage and subgroup requirements, independent support and multiplicity rules remain unassigned. No interval, model, power target or minimum sample count is invented here.

These choices must be resolved and protected before confirmatory outcome access. A descriptive replay would expose outcomes: that library cannot subsequently be represented as an untouched holdout for an inference plan chosen after seeing its results. Any later confirmatory claim needs documented prior exposure and a prospectively protected evaluation design. Descriptive analysis is not an alternate path around custody or qualification.

## 5. Prerequisites and acceptance record

| Gate | Evidence needed | Status in 0.3 |
| --- | --- | --- |
| Proposed assay-version choice | Explicit prospective 2.1 decision linked to returned metadata objects | Recorded here; metadata identity verified; no outcome release accepted |
| Raw data/version binding | Authorized source release, returned identity, schema, hashes and source lineage matching 2.1 | Unmet; no result rows acquired |
| Experimental construct | Source construct/material evidence and scientific-owner suitability review | Unmet; reference correspondence only |
| Label mapping and adjudication | Version-specific fields, units, inhibition sign, QC, assay limitations, conflicts, replicates and unknown policy | Unmet |
| Dataset qualification | Defined eligible universe, source-level curation, all attrition, actual leakage/exposure/dependence analysis and scoped population | Unmet; LIT-PCBA remains only a candidate source |
| Named appointments | Names, affiliations, conflicts and explicit acceptance for independent custodian, scientific owner and statistical reviewer | Unmet; no nominees documented |
| Protected custody | Identified institution-approved store/admin outside developer/service privileges; tested permissions, access logs, retained versions and protected timestamped receipts | Unmet; local files/hashes are not independent custody |
| Replay implementation | Tested exact-100 selector, identity binding, comparator, unknown/failed-run handling and conditional metric reporting | Unmet; specification only |
| Inferential definition and procedure | Reviewed population, model, units, interval calibration, power and fixed numerical coverage/subgroup rules | Unmet; not required for exact descriptive arithmetic, still required for qualification |
| Qualification results | Both specified one-sided lower bounds and all applicable acceptance gates satisfied under the frozen reviewed plan | Not assessed; gates unmet |
| Freeze and preregistration | Completed reviewed protocol, protected dataset/prediction receipts and documented custody before authorized unblinding | Blocked |
| Scientific release, sensitive intake, deployment | Existing Phase 2–4 release and operational requirements | Blocked; no gate waived |

Source curators and reviewers must also assess study suitability and actual prior developer exposure; the absence of a model-training routine is not evidence of no leakage. No outcome-bearing data may be acquired here to solve those gates before custody is established. Public label availability does not make an analyst blind.

## 6. Deliverables and scope of verification

- `design-decisions.json`: proposed choices, separate descriptive/inferential status and null unresolved evidence. A design worksheet, not a runtime schema or approval record.
- `protocol.draft.json`: version 0.3 draft in the accepted qualification schema's field structure. Both primary confidence-bound gates are unchanged from 0.2; unresolved fields remain null. It intentionally fails preflight.
- `descriptive-report.template.json`: unpopulated worksheet for later conditional reporting, with exact-count/rational slots and a separate unmet qualification section. No study evaluator or runtime enforcement is implied.
- `VERIFICATION.md`, `preflight-result.json` and `verification.json`: reproducible offline checks and local byte correspondence, with explicit limits.

The accepted preflight remains a structural check, not a validator of this descriptive worksheet, a biological adjudicator or an inferential evaluator. Its existing schema is not weakened or filled with fictitious training/sampling metadata to obtain a passing result. The 0.2 draft and all accepted Phase 3/4 and preparation records remain intact. Scientific assessment remains `not_assessed`; all blocked actions remain blocked.
