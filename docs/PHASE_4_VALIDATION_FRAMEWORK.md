# BioScribe Phase 4 — validation framework for review

**Date:** 17 October 2026. **Disposition:** framework proposed; predictive assessment `not_assessed`; scientific release and sensitive-data intake **blocked**. This document implements the planning portion of the accepted [Phase 2 specification](PHASE_2_GAP_DIAGNOSTIC.md). It does not declare Phase 3 complete or authorize a predictive endpoint.

## 1. Baseline and delivery boundary

The reviewer closed R1–R3 for the constrained public-data workflow after independently confirming 173 backend tests, 25 client checks and 78 matching file hashes. Those are software-verification results, not measurements of scientific performance. The reviewer did not independently repeat browser, build or clean-install checks. Their earlier execution records remain in [the Phase 3 ledger](PHASE_3_VERIFICATION.json); this phase does not turn them into independently repeated checks.

This delivery adds an offline protocol checker, two machine-readable schemas, an intentionally incomplete study template, dataset/report worksheets, a test blueprint and this gate register. It changes no application code, generated v3 contract, dependency lock, historical artifact or accepted R1–R3 behavior. New-tool verification is recorded separately in [PHASE_4_VERIFICATION.json](PHASE_4_VERIFICATION.json). The accepted 78-file baseline is rechecked without rewriting it.

No empirical evaluation dataset, model, calibrated uncertainty estimator, approved numerical performance threshold, completed scientific review, or positive validation record is delivered. Public reference websites were consulted to design this protocol; their data were not downloaded into an evaluation corpus. No patient-linked or confidential data were used. No performance number is synthesized to fill an empty field.

The design separates four outcomes:

| Outcome | Evidence required | What it cannot establish |
| --- | --- | --- |
| Software correctness | Contract, identity, parser, method implementation, authorization, recovery and startup checks | Predictive utility, chemical safety or clinical validity |
| Method fidelity | Independent reference derivation, locked parameters/dependencies, reference fixtures and tolerances | Validity outside the method's demonstrated scientific scope |
| Scientific qualification for a defined claim | Suitable held-out labels, frozen protocol, measured performance/uncertainty/domain results and independent review | General safety, all endpoints, all populations or deployment clearance |
| Deployment authorization | Separate operational, security, audit, privacy and applicability evidence | Biological truth merely because infrastructure is secure |

OECD's assessment framework distinguishes model, prediction and combined-result assessment. We adopt that separation; the presence of a reference or a registry entry supplies neither empirical evidence nor regulatory acceptance. These are BioScribe's proposed gates, informed by the [OECD second-edition framework](https://www.oecd.org/en/publications/q-sar-assessment-framework-guidance-for-the-regulatory-assessment-of-quantitative-structure-activity-relationship-models-and-predictions-second-edition_bbdac345-en.html).

## 2. Claim inventory: validate only what is actually computed

Current authoritative behavior is in `backend/bioscribe/registry.py`, `compute.py`, `schemas.py` and `metrics.py`. The offline checker is outside that runtime.

| Current output | Current interpretation | Appropriate validation track | Claims that remain unavailable |
| --- | --- | --- | --- |
| Sequence length | Count of accepted normalized residues | Independent counting and source-coordinate reconciliation | Correct accession, organism or biological function inferred from a count |
| Three protein group fractions | Overlapping composition descriptors | Independent counts using pinned group definitions and denominator | Structural occupancy, inferred coil, dominant structure or disorder |
| PS00107 matches | Locations matching a pinned pattern and matching policy | Pattern fidelity first; separately study any proposed biological classifier | Kinase activity, binding pocket or ATP affinity inferred from a match |
| RDKit molecular weight, calculated logP, TPSA, aromatic fraction | Specified computations on the accepted whole graph | Descriptor implementation/reference fidelity with identity preservation | Measured partition coefficient, solubility, toxicity or exposure |
| Limited SMARTS observations | Matched atom sets in an enumerated, completed scan | Expert-labelled graph fixtures and rule fidelity | Safe/unsafe, basicity, Ames or hERG status from presence/absence of a match |
| Descriptor-distance heuristic | Dimensionless, target-independent and unvalidated | Formula fidelity; a separately scoped ranking-utility study if proposed | kcal/mol, Kd, Ki, affinity, calibrated confidence or general utility |
| Notes, frameshift, ESOL, affinity, ADMET/PK, synthesis, secondary structure | Unsupported/null or review-only, as applicable | No predictive study can run until a separately implemented candidate exists | Any positive scientific assertion about these endpoints |

Calculated logP can be checked against its algorithm without validating experimental logP accuracy. A future physical-property claim needs its own experimental endpoint study. Likewise, correct SMARTS matching does not validate a toxicity classifier. The currently accepted chemistry policy is graph eligibility, not an applicability-domain model.

**Track A — reference fidelity.** Expand reference coverage only where justified; do not relabel Phase 3 implementation checks as missing Phase 4 predictive work. Use independently derived expected values, not a second call into the same tested function. Preserve exact source release, snapshot/hash, fixture derivation and reviewer. Integer counts and indices require exact agreement; composition/aromatic fractions use independently calculated rational values with absolute tolerance `1e-12` and zero relative tolerance. Each other floating descriptor needs its own justified tolerance before its fixture is accepted; no universal decimal tolerance is assigned to every RDKit descriptor. All mandatory golden fixtures must pass, with zero skipped cases or unexplained discrepancies.

The corpus includes leucine overlap and distinct helix/turn/sheet groups; PS00107 allowed/excluded residues, both variable-span edges, overlapping starts, coordinate conventions and real versioned sequences; chemical atom-order variants mapped back to graph identity, stereochemistry, isotopes, charges, fragments, unsupported/query/dummy graphs and zero/positive/failed scans. Existing R1–R3 counterexamples remain regression fixtures. Unsupported inputs must abstain, not generate a reference value.

**Track B — scientific performance.** An independently labelled biological question is a different study. PROSITE lists true/false-positive hits and false-negative sequences against a specified UniProtKB release; those are useful for a pinned reference reproduction, not automatically an independent prospective BioScribe test set. Pattern-derived annotations cannot serve as independent truth for that same pattern. Separate per-hit and per-sequence denominators, partial sequences and unknown annotations. Any new classifier requires explicit experimental/curated label evidence and family-separated assessment. Do not copy the live site's precision/recall into BioScribe results. [PROSITE PS00107](https://prosite.expasy.org/PS00107).

**Track C — utility.** A claim that ranking saves experiments requires a specified selection budget, a relevant comparator and an independently evaluated outcome. Retrospective ranking alone does not demonstrate prospective hit confirmation or synthesis feasibility. A future prospective study must freeze candidate selection before blinded assays; include assay controls, independent confirmations, failures and the full selection denominator.

## 3. Preregistered protocol and custody

Each study gets one immutable `protocol_id/version` per claim, endpoint and intended population. Before any confirmatory test-label access, the scientific owner and an independent statistical reviewer must approve the following substantive content. The offline checker verifies only part of its structure.

1. **Claim:** exact intended decision, users, target/construct/accession and sequence version, organism/taxon, assay type and conditions, output units, supported chemical/biological inputs, prohibited uses and error consequences.
2. **Method:** code and model-weight digests, algorithm and dependency versions, all transforms/parameters, input identity policy, training data membership or disclosure limitation, model-selection history and stochastic settings. A seed alone is not a reproducibility guarantee; record repeat runs and numerical variability where relevant.
3. **Data:** provenance, permitted use, acquisition query/date/release, full source-to-curated mapping, eligibility, duplicate/replicate/censoring policies, quality exclusions and reference-label adjudication.
4. **Design:** independent sampling unit, split strategy and identifiers, fitting/tuning/calibration/test separation, comparators, primary and secondary analyses, subgroups, missingness/abstention analysis, sample-size justification and precision/power targets.
5. **Acceptance:** actual finite numerical primary thresholds, direction, measurement scale, confidence-bound rule, interval method, multiplicity handling and a rationale based on assay uncertainty and the intended use. An empty threshold blocks study freeze; it cannot be filled after seeing test results.
6. **Domain:** versioned operational rules with numerical cutoffs where appropriate, fitted using development data only; biological/assay limits; what causes in-domain, outside-domain or unknown; abstention and challenge-set policy.
7. **Custody:** named owners, conflicts, blinded label access, independent protocol/prediction receipts, unblinding authorization, deviations, repeat-study policy and retention. No person is appointed or recorded as having approved this delivery.

Freeze protocol, code/model, datasets, split membership, domain rules and analysis plan together. Obtain an authenticated timestamped receipt at the independently protected boundary before prediction evaluation/unblinding. Record label-access events. A local SHA256 or commit timestamp cannot prove preregistration, blindness or authorship. Current live audit checkpoint integration remains open; a future study requires an actual independently protected study repository or checkpoint service and documented custody. This requirement is not satisfied by the offline tool's matching hashes.

After unblinding, changes become deviations or a new study version. Reusing an exposed holdout can support exploratory analysis, not a fresh confirmatory claim. Repeated submissions to a hidden evaluation service also leak information; limit access and record all attempts. Pretraining membership uncertainty must be disclosed and may prevent an independence claim; temporal data alone cannot prove an opaque pretrained model never encountered related records.

## 4. Dataset and label acceptance

Use [dataset-manifest.template.json](../validation/phase4/dataset-manifest.template.json) as the curation worksheet. It is a draft, not evidence of an acquired dataset. Maintain row-level immutable provenance, including:

| Record group | Required fields and reconciliation |
| --- | --- |
| Source | Dataset/release/query/retrieval date, license, original record/assay/document ID, stable primary reference, source payload hash and source location |
| Biological identity | Target accession/version, exact construct/sequence hash, isoform/mutation/tag information, organism/taxon, assay system, relevant conditions and missing-context flags |
| Chemical identity | Original representation/hash, accepted graph identity, canonical representation/version, stereo/charge/isotope/salt/tautomer policies and transformation history; assay material identity where known |
| Label | Endpoint, raw value and unit, relation (`=`, `<`, `>`, interval), normalized value/unit, transformation, assay date, replicate/uncertainty, control/QC evidence, positive/negative/unknown definition |
| Decisions | Include/exclude/unresolved with reason, curator, independent adjudication, duplicate/source lineage cluster, unit of analysis, split and leakage-group memberships |

Reconcile `retrieved = excluded + unresolved + included`, then account for aggregation from records to unique analysis units. Publish a flow table with counts and reasons. Unresolved records are not negatives. No missing, failed, unavailable or censored measurement may be filled by a model or a random value and called ground truth. Preserve the original measurement even when a justified normalized representation is used.

ChEMBL standardizes activity types/units and records validity and possible-duplicate flags; its data may still require task-specific adjudication. A common pChEMBL scale does not make Kd, Ki, IC50 and cellular responses the same endpoint. Inspect the originating assay and document, including repeat/import lineage across databases. [ChEMBL curation and quality](https://pmc.ncbi.nlm.nih.gov/articles/PMC4607714/). BindingDB includes several measurement types and imported sources, so a second database is not necessarily an independent replication. [BindingDB source and endpoint filters](https://bindingdb.org/rwd/bind/as.jsp).

| Proposed claim | Candidate reference source; suitability still requires review | Non-negotiable restrictions |
| --- | --- | --- |
| Target-specific Kd | Versioned BindingDB/ChEMBL subset traced to original binding assays | Fix construct/species/assay context; Kd only unless a separately justified task is defined. Do not pool Ki/IC50 or compare docking energies directly to nM. |
| Ames mutagenicity | Traceable bacterial reverse-mutation assay records and original reports | Preserve strain, metabolic activation, dose, cytotoxicity/control results and equivocal outcomes; explicitly define any compound-level aggregation. Neither generic toxicity labels nor absent SMARTS are assay negatives. [OECD Test 471](https://www.oecd.org/en/publications/test-no-471-bacterial-reverse-mutation-test_9789264071247-en.html). |
| hERG inhibition | Traceable assay-specific electrophysiology data or separately scoped binding data | Do not mix modalities without justification; fix endpoint/threshold/conditions. hERG inhibition does not itself establish clinical arrhythmia risk. |
| Half-life or clearance | Public, eligible PK studies with species, route, formulation, dose and estimation context | Separate endpoints and units; terminal half-life is not microsomal stability. Do not import patient-level records under this public-data protocol. |
| Solubility / ESOL | Original method/descriptor definitions and independently justified solubility measurements | First establish method fidelity; specify aqueous/kinetic/thermodynamic context, pH, temperature, material form and log-molar transformation. A familiar dataset name is not acceptance. |
| Protein functional classification | Versioned sequence/annotation records with evidence supporting the exact function | Exclude circular annotation from the evaluated method; preserve unknowns and partials; cluster homologues; do not infer activity from structural similarity alone. |
| Future extraction | Licensed public source documents, source spans and independently adjudicated entity/relation labels | No patient notes; document/family/source-separated holdout; versioned ontology identifiers, negation/temporality/species and source support. |

For continuous labels, the existing helper accepts exact relations and excludes censored rows. That is a defined subset, not a universal solution: report its selection bias. If censoring is material to the intended population, predeclare and implement an appropriate censored-data analysis before qualification. Replicate conflicts require a context-aware aggregation/adjudication policy; never select the replicate nearest the prediction. Missing assay conditions can force exclusion or a narrower claim.

## 5. Splits, leakage and applicability domain

Random row splitting is insufficient when repeated compounds, analog series, homologous proteins, shared publications or repeated assays occur. Split at the independent unit dictated by the intended generalization:

- Deduplicate source lineages before splitting, including duplicated measurements imported across databases. Preserve stereochemical distinctions in assay labels while conservatively grouping related representations to prevent leakage. Do not merge labels just because compounds share a parent or tautomer group.
- For new chemistry, group analog series/scaffolds and assess nearest-neighbour similarity across splits using pinned fingerprint/cluster definitions and cutoffs. Scaffold separation alone does not certify independence. For new targets, use sequence/family clusters with specified alignment coverage/identity and consider both ligand and protein similarity. For new laboratories or future experiments, add source/lab or time holdouts appropriate to that claim.
- Fit feature selection, normalization, imputers, domain rules and model hyperparameters on development partitions. Reserve calibration data separately if uncertainty/probability calibration is claimed. Do not use external-test labels to tune any of these.
- Freeze train/tune/calibration/external-test/challenge membership. Publish overlap counts, cluster sizes, similarity distributions and temporal cutoffs. Required disjoint dimensions are study-specific; choosing only convenient group keys does not satisfy review.

MoleculeNet illustrates that split design materially affects molecular benchmark interpretation; its benchmark membership is not a qualification certificate for BioScribe. [MoleculeNet primary paper](https://pubs.rsc.org/cs/content/articlelanding/2018/sc/c7sc02664a).

The supplied split checker enforces uniqueness and separation **only for declared entity/group IDs**. It does not calculate chemical scaffolds, sequence homology, chronology, label provenance or real independence. Every external-test unit must meet the study's declared group policy. Missing development membership blocks its preflight; a candidate with unavailable training membership needs an explicitly reviewed alternative design and tool revision, not invented training rows.

Domain rules must cover chemical representation, physicochemical/similarity limits, target/organism/assay scope and model-specific exclusions. Validate in-domain performance, boundary behaviour and deliberately out-of-domain challenges separately. A parseable molecule is not automatically in-domain. Unknown or outside-domain predictions abstain. Report accepted fraction and error at that fraction, together with all rejected/failed input counts; a model cannot pass by abstaining on every difficult case. Thresholds for acceptable coverage and subgroup performance must be fixed before unblinding.

## 6. Metrics, intervals and numerical acceptance

Every reported metric binds to a protocol, endpoint/units, dataset and split hashes, model/method version, population, numerator/denominator, exclusions, point estimate, interval, interval method and status. Undefined metrics remain null with a reason; no NaN, infinity, zero substitute or random fallback. Report the same measurement scale for predictions and labels.

| Task | Required primary decision design | Secondary diagnostics / relevant baselines |
| --- | --- | --- |
| Regression, e.g. one Kd endpoint | Predeclared upper confidence bound on MAE or RMSE in the selected scale; paired comparator margin; coverage and subgroup gates | Bias, residual quantiles, error by assay/series/domain; Pearson/Spearman with intervals. Development-only mean/median and justified simple descriptor or similarity baseline. Correlation alone cannot pass regression accuracy. |
| Ranking utility | Predeclared lower bound on enrichment or confirmed hit-rate at an operational selection budget, compared on the same pool; coverage gate | Precision/recall at selection, tie counts and population prevalence, paired baseline difference. Random selection and relevant simple ranking baselines; held-out assays, not heuristic-generated labels. |
| Binary assay endpoint | Predeclared lower sensitivity bound and specificity/false-positive constraint at a development-fixed decision threshold, with adequate positive/negative counts | Confusion matrix, precision/PPV and prevalence, PR curve with named estimator (average precision is not trapezoidal PR-AUC), ROC-AUC, Brier/log loss if probabilities exist. Constant-prevalence and task-relevant baselines. Accuracy alone cannot pass an imbalanced task. |
| Prediction intervals/probabilities | Separate calibration and coverage/error gates; interval width or sharpness constraint | Coverage by domain/subgroup, reliability plots, calibration intercept/slope where estimable, proper scoring rules. A wide interval that covers everything is not sufficient. Model confidence is not validated by QED or motif presence. |
| Future entity/relation extraction | Adjudicated exact span/identifier precision and recall, source-support and abstention gates | Per-entity and macro/micro results, relation/negation/unit/species errors, document-clustered intervals, retrieval recall@k/MRR under a fixed corpus/query set; structured hallucination review. A citation's existence is not evidence it supports the assertion. |

**Numerical semantics inherited from R3.** Pearson/Spearman use original declared prediction and label vectors, regardless of ranking direction. Spearman uses average ranks for ties. Constant vectors make correlation undefined. RMSE uses compatible endpoint/units only. For pKd, convert `Kd[nM]` to `-log10(Kd[nM] * 1e-9)` for both predictions and labels, requiring strictly positive values; this is a predeclared endpoint transformation, not an enrichment-sort sign change. A dimensionless heuristic gets no Kd RMSE.

For enrichment, `EF = (a_selected/n_selected)/(a_eligible/n_eligible)`. Define activity and direction before evaluation; require labels for the eligible population or use a separately justified missing-label design. Zero total actives makes EF undefined. The current helper includes the whole cutoff tie group: record requested and actual selection counts. If the real experimental budget is exactly k, this tie-expanded metric cannot stand in for an exactly-k study. Preregister a reproducible label-independent tie-break or expected selection analysis, implement/test it separately, and retain both interpretations. Never break ties using labels.

**Sampling and intervals.** The helper's three-pair minimum is only a computational guard. It is not a scientifically adequate sample size. The statistical plan must justify independent units/clusters, expected prevalence, positive/negative counts, assay variance, target interval width or power for a meaningful comparator difference, attrition/abstention and multiplicity. Use a planning simulation or analytic calculation based on independent pilot/development evidence, not held-out outcomes. Include sensitivity analysis for uncertain planning assumptions. Synthetic planning simulations may inform design, but are never empirical performance evidence.

Use binomial intervals such as Wilson or exact methods for independent proportions; boundary cases with few events require particular care. Do not count correlated assay replicates as independent trials. [NIST proportion-interval guidance](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm). For correlated datasets, use the preregistered cluster or hierarchical resampling unit; preserve paired predictions when comparing models. Record interval level, one/two-sided convention, algorithm, random seed, resample count and invalid-resample frequency. Do not silently discard undefined bootstrap replicates or report degenerate intervals from too few independent groups. Inadequate support yields `insufficient_evidence`. Multiplicity across models/endpoints/subgroups needs a predefined control or a single confirmatory primary claim; exploratory findings stay labelled exploratory.

**Threshold register at this submission:** all empirical thresholds, sample sizes, domain cutoffs and baseline margins are **unassigned**. No candidate endpoint or acceptable assay error has been approved, so assigning generic values such as “95% accuracy” would manufacture a standard. Each future primary gate must contain an actual number, its units, the conservative bound (`lower >= threshold` or `upper <= threshold`), rationale and planned population. CI level, class support, coverage and subgroup criteria must also be fixed. A successful protocol lint does not judge whether those numbers are sensible. Missing or unjustified thresholds block freeze and confirmatory evaluation; they do not become waived gates.

## 7. Evaluation pipeline and records

The following is the required execution sequence for a future scientific study. Only the preliminary protocol checker is implemented in this delivery.

| Stage | Inputs → outputs | Failure / release rule |
| --- | --- | --- |
| P4-01 Claim and candidate | Claim inventory + candidate method → scoped protocol | No candidate, defined endpoint or justified thresholds: `not_assessed`; no prediction run |
| P4-02 Data qualification | Sources + curation rules → immutable data manifest, row ledger, adjudication and flow counts | Unknown provenance, unsuitable task, unresolved identity/labels or inadequate rights: block qualification |
| P4-03 Split and domain review | Curated units + development history → frozen splits, leakage report, domain definition | Undisclosed contamination, unreviewed domain or inadequate independent units: block confirmatory status |
| P4-04 Preregistration | Protocol + full bundle + independent approvals → protected timestamped receipt | Local hashes alone, missing approvals or exposed holdout: no preregistration claim |
| P4-05 Blinded execution | Locked candidate + eligible held-out inputs → input-bound predictions and explicit abstentions/failures | Mismatched inputs, versions or output hashes: invalidate run, never repair labels to match |
| P4-06 Unblind and score | Prediction receipt + authorised label release → reproducible statistics and intervals | Insufficient class/count support, undefined primary metric, invalid uncertainty analysis or missing outputs: inconclusive, not pass |
| P4-07 Independent replication | Bundle + independent evaluator → matching score/decision within predeclared numerical tolerances | Unexplained discrepancy or non-reconstructable environment: not qualified |
| P4-08 Scientific review | Full results + deviations + limitations → scoped review disposition | Missed primary gate: failed for claim; insufficient evidence: inconclusive; neither is validated |
| P4-09 Runtime installation | Approved scoped record + separate runtime lifecycle implementation → per-output lookup/expiry/revocation/domain enforcement | Currently unavailable. A paper report cannot enable v3 predictions. |
| P4-10 Deployment | Scientific scope + all applicable Phase 3 deployment evidence → separately authorised deployment | Privacy/audit/security/operational blocks remain independent vetoes |

The evaluator must join by immutable analysis-unit and input hashes, not row order. Reject duplicate, omitted, unexpected or altered predictions; preserve requested order for presentation separately. Account for every test unit as predicted, abstained or execution-failed. Compute conditional performance on the prespecified evaluable/domain population and publish the full-population coverage/attrition; implement any failure penalty only if predeclared. Freeze and hash predictions before unblinding labels. Store every model/baseline/seed result and deviation, including failed experiments.

Use [evaluation-report.template.json](../validation/phase4/evaluation-report.template.json) as the review worksheet. It starts `not_run`, with null measured values and no validation record. Its fields are a proposed report contract, **not yet an enforced runtime schema**. Final record requirements include protocol and dataset/split/model digests, assay endpoint, domain version, labels/predictions receipts, all counts, metric definitions and intervals, baseline differences, subgroup/domain/uncertainty results, primary-gate decisions, reproduction evidence, deviations, reviewers/conflicts and remaining risks. Its decision states are `not_run`, `insufficient_evidence`, `failed_for_claim`, `meets_predeclared_criteria_pending_review` and, only after real independent review, a narrowly scoped qualification record. None implies deployment permission.

Future runtime integration must bind each output to the exact validation record, method/model/preprocessing versions, input identity, endpoint/units, domain decision, supported population, review validity and expiry/revocation state. Mixed evidence stays mixed. A completed job or reviewer signature cannot upgrade every field. Revoking a record must stop new qualified claims and visibly annotate affected historical evidence without rewriting original artifacts. Changed weights, code, preprocessing, dataset, reference release or domain rules require impact review and potentially a new evaluation; historical evidence is never silently upgraded. The v3 schema currently permits no positive validation record and remains unchanged.

## 8. Human review and source verification

Two independent curators should label a preregistered sample, all ambiguous/conflicting cases and all scientifically consequential errors, with a third adjudicator where needed. Define the sampling fraction/count and escalation rules before review; report agreement and disagreement causes, not just a consensus percentage. Blinding to model output prevents adjudicating labels to favour predictions. Record qualifications, conflicts, dates and authenticated decisions; review does not substitute for endpoint validation.

Reference lookup verifies identity or supporting evidence only to its stated scope. Resolve accessions to exact versions and sequence hashes; compare organism and construct. Retrieve the referenced assay/table/figure and record its evidence span and units. PubMed is a bibliographic index: a matching title or abstract link does not validate an extracted result. Missing/inaccessible/contradictory source evidence means unresolved, not confirmed. External lookup destinations and data transfer need approval under the data policy; no source text is transmitted by the supplied offline checker.

If LLM extraction is implemented later, outputs begin as `unverified_extraction`, with source offsets, transformations, ontology mapping candidates and uncertainty/abstention reasons. Validate against source spans and adjudicated labels; isolate document instructions from executable workflow instructions. Evaluate negation, hedging, units, entities, species, OCR corruption, irrelevant text, conflicting studies and unsupported assertions. Measure retrieval separately from extraction and factual support. Structured schema compliance alone cannot establish truth. Notes remain review-only and extraction disabled now.

## 9. Automated test blueprint and implementation status

Existing Phase 3 contract/parser/method/authorization/recovery checks remain with their implementation. Do not defer open Phase 3 controls to this phase or sum overlapping counts into a new scientific score.

| Test module / track | Required fixtures and acceptance | Status now |
| --- | --- | --- |
| `validation/phase4/tests/test_preflight.py` | Missing fields/numbers, optimistic bound, unknown release fields, synthetic provenance, hash substitution, path escape, split identity/count/cluster leakage, impossible counts; complete declarations still cannot release | Implemented; separate results in Phase 4 ledger |
| Existing `backend/tests_phase3` and client contract checks | Accepted R1–R3, no unsupported safety outputs, per-field evidence, identity, ties/undefined metrics, recovery and authorization | 173/25 independently confirmed by reviewer; not rerun here |
| Proposed `test_reference_corpus.py` | Independently curated golden corpus, source snapshot versions, coordinate/atom mapping, justified per-descriptor tolerances, no circular oracle | Existing limited fixtures retained; expanded corpus/review not delivered |
| Proposed `test_dataset_curation.py` | Wrong endpoints/units/constructs, duplicates across sources, conflicting replicates, missing vs negative, censoring, flow reconciliation, transformed identity | Requires real curation implementation and its own passing checks |
| Proposed `test_leakage_and_domain.py` | Actual scaffold/series/homology/source/time derivation; held-out fit sentinel; domain inside/boundary/outside/unknown; contamination challenges | Only declared-ID checks implemented; derivation and empirical domain studies absent |
| Proposed `test_evaluation_binding.py` | Prediction/label join mismatches, missing/extra/duplicate units, altered receipts, unsupported status, persisted reproduction | Not implemented; no predictive evaluator exists |
| Proposed `test_inference_and_intervals.py` | Hand-derived statistics, paired comparisons, constants/ties/zero classes, clustered resampling, undefined replicates, censoring analysis, extreme residuals, multiplicity | Current descriptive helper retained; extended inferential engine absent |
| Proposed `test_calibration_and_coverage.py` | Frozen calibration data, known synthetic calibration failures, broad useless intervals, abstention selection, subgroup insufficiency and domain shift | Not implemented; synthetic tests would verify software only |
| Proposed `test_qualification_lifecycle.py` | No global upgrade, endpoint mismatch, revoked/expired records, wrong method/domain/version, mixed fields, API/UI/export consistency and historical annotation | Not implemented; positive v3 validation records remain forbidden |
| Independent reproduction / prospective study | Rebuild locked environment, rerun same frozen study, compare outputs and decisions; independently confirm selected experiments if utility claimed | No scientific study executed |

New evaluator or lifecycle code must ship with its own implementation tests before use. No planned test or skipped mandatory test counts as a pass. Avoid treating a mirror implementation as an independent oracle. Continuous integration can run software checks on synthetic public fixtures; it must not silently refresh scientific labels or reevaluate a hidden holdout on every commit.

## 10. Supplied preflight: exact scope and use

Source: [contracts.py](../validation/phase4/contracts.py), [preflight.py](../validation/phase4/preflight.py). Schemas: [protocol.schema.json](../validation/phase4/protocol.schema.json), [split.schema.json](../validation/phase4/split.schema.json). These version `phase4-protocol/1.0.0` and `phase4-split/1.0.0`; they do not replace API contract 3.0.0. The two worksheet JSON files are intentionally not validated by these schemas.

The checker rejects missing/unknown schema fields, non-finite/incorrectly typed thresholds, favourable CI-bound comparisons, duplicate primary gates, heuristic-as-endpoint claims, unit mismatch for regression, impossible declared sample counts, synthetic provenance, artifact hash mismatch and unsafe file paths. Regression, binary classification and ranking are separate task types: probabilities can have a different scale from binary labels, and classification requires declared support for both classes. It parses declared split IDs and checks their uniqueness, dataset binding, required group presence/separation, minimum external-test units/groups and disclosed development membership. It reads public local metadata only, with a 1 MiB protocol limit, 32 MiB per referenced artifact and 100,000 split-row limit. It never trains, fetches, scores a model, alters the registry, or opens an application service. Extraction/reference-fidelity studies use the written protocol; the supplied schema is limited to those three quantitative study types.

These limits are tool input bounds, not scientifically adequate dataset sizes or production capacity claims. Hash equality attests file correspondence only. Except for the split manifest, referenced files are checked as opaque bytes: curation quality, labels, class counts, model contents, real cluster derivation, temporal leakage, threshold reasonableness, authorship and independent custody require the remaining pipeline and expert review. A caller can lie in declarations; the tool deliberately returns `structural_checks_passed_review_required`, never approved or validated. This is a preflight, not the full future scientific evaluator.

From the repository root in PowerShell, using the unchanged Phase 3 locked environment:

```powershell
& .phase3-clean/Scripts/python.exe -B -m pytest validation/phase4/tests -q -p no:cacheprovider --junitxml=docs/phase4-verification.xml
& .phase3-clean/Scripts/python.exe -B -m validation.phase4.preflight validation/phase4/study.template.json --bundle-root validation/phase4
```

The second command is expected to exit **2**, with `status=blocked`, `scientific_assessment=not_assessed` and both release/intake blocked. Nulls are intentional unresolved decisions, not defaults. A complete hypothetical bundle can exit 0 only for structural checks; this still requires independent review and does not satisfy scientific gates. Test fixtures that exercise this path are expressly synthetic and cannot be used as study evidence. Exact observed results and artifact hashes are in the separate verification ledger.

## 11. Gate-by-gate disposition for the next review

| Gate / accepted requirement | Current disposition | Evidence needed to change it |
| --- | --- | --- |
| R1–R3 constrained workflow | Closed by reviewer; preserved | No further revision requested; retain baseline/regression evidence |
| F1/F4 experiment and label identity in future scientific evaluations | Design specified; future evaluator absent | End-to-end source/curation/prediction binding with real study inputs and independent reproduction |
| F2 predictive endpoint/utility validity | **Blocked / not assessed** | Candidate, defined intended use, justified empirical labels, preregistered thresholds/sample plan, held-out results and independent review |
| F2 toxicity/PK and confidence containment | Existing null/unassessed behavior retained | Separate endpoint-specific and uncertainty qualification; no extrapolation from limited alerts or descriptors |
| F3 fidelity vs validity | Distinction enforced by existing runtime and proposed protocol | Independent corpus/derivations for any expanded method; ESOL still disabled until fidelity and subsequent predictive studies exist |
| F3/F4 composition/notes/frameshift | Existing restrictions retained | No new structural interpretation; extraction/reference-aware algorithms need separate implementation and scoped studies |
| F5 truthful metrics and datasets | Descriptive helper accepted; prospective design provided | Empirical provenance, suitability, complete counts, validated inferential implementation, thresholds and independent performance record |
| Per-output positive validation registry/lifecycle | **Not implemented; blocked** | Versioned scoped records, revocation/expiry/domain lookup and mixed-evidence API/UI/export checks; separate implementation review |
| F6 independent audit boundary and recovery | **Open Phase 3 gate** | Live event-receipt integration, independent administration/key custody, fresh trusted checkpoints, deletion/reorder/reconstruction/rollback and honest recovery at that boundary |
| F6 sensitive-data intake and deployment | **Blocked** | Transport/storage/backups, managed identity/ACLs/keys, retention/deletion/legal holds, network egress/destinations and operational evidence |
| Regulatory scope | **Undetermined** | Responsible owners' HIPAA relationship, FDA function/intended-use and applicable Part 11 record decisions; no new compliance claim here |
| Full resource/fault/capacity suite | **Open Phase 3 gate** | Below/at/above every bound, network/slow-request/cancellation/fault checks, OS resource controls and measured deployment capacity |
| Linux/container, vulnerabilities, backup/disaster recovery | **Open deployment gates** | Qualified target platform/image/locks, security review and recovery drills; Windows results do not transfer automatically |
| Browser/build/clean-install independent repetition | Not independently repeated in the latest user review or here | Preserve earlier author evidence; obtain independent repetition if required for deployment acceptance |
| Phase 4 scientific completion | **Not achieved** | P4-01 through P4-08 study evidence; P4-09/10 separately before any runtime release |

**Next review scope:** examine the proposed claim taxonomy, dataset acceptance rules, statistical plan requirements, preflight limitations and gate dispositions. Approval of this framework would authorize a protocol design process, not an unperformed study, a model qualification or deployment. Scientific release and sensitive-data intake remain blocked.
