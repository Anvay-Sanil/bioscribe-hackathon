# BioScribe judging upgrade

This iteration improves the working HM-01 public-molecule demonstration. It does not assign or guarantee a judging score. **User value is explicitly untested:** no biotechnology students participated, and no time savings, satisfaction scores or productivity gains are claimed.

## Start and present

From the repository root, with the existing locked Python environment and `npm ci` installation:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File hackathon/start-demo.ps1 -Verify
```

Open `http://localhost:3000/proof`. The page contains the worked comparison and the three-minute walkthrough. For fresh runs in `/evidence`, choose **Load token file**, select `hackathon/.local/demo-token.txt`, then **Check connection**. Confirm public, non-sensitive input. The token stays in page memory and is not added to reports. Navigating away clears it.

The launcher preserves existing services. `-Verify` checks API/worker readiness and authentication, submits a small public library, retrieves its persisted export, and recomputes it. A failure is an explicit failure, never a recorded-example fallback. This invocation was verified with existing services running; a cold reboot/clean-install rehearsal was not repeated in this iteration. If another application owns a required port, the launcher does not terminate it.

## Three-minute story

Opening sentence: **“BioScribe helps students inspect molecular calculations without losing track of invalid inputs, missing evidence or how a result was produced.”** This states the intended benefit, not an established user-study result.

1. **0:00–0:40:** In Evidence Lab, load **Break the input**. Show `CCO C1OC1` and `*CC`: precise rejection, retained original row, no numeric descriptors. On `/proof`, the supplied default RDKit script's actual observations are visible alongside the policy decisions.
2. **0:40–1:20:** Show the unspecified-stereo warning and the hydrogen example. Distinguish “not computed,” “not available” and “not applicable.” No toxicity, affinity or half-life prediction is made.
3. **1:20–2:00:** Load **Three reference compounds**. Under **What changed between runs?**, open `bioscribe-ai/public/evidence-lab/budget-one-run.json`. The current budget is 2 and the earlier budget is 1. Three unique graph identities match; descriptors remain unchanged while selections expand. The package is also downloadable on `/proof`.
4. **2:00–3:00:** Check the connection and choose **Recompute & compare**. Wait for the fresh replay-match indicator and show both scientific hashes. Export the JSON package and full HTML report. A loaded package by itself does not demonstrate a fresh replay.

Answer to “Is this scientifically validated?”: **“The molecular calculations, input policies and replay behavior have software checks. The rankings have no demonstrated biological predictive value. Student benefit has not been tested.”**

Answer to “What is original here?”: **“The integration makes input identity, missing evidence and reproducibility visible in one student-facing workflow. RDKit, descriptors, hashes and provenance techniques are established tools. We have not established uniqueness against every existing product.”**

## Changes and limits by judging criterion

| Criterion | Implemented or demonstrated | Evidence still missing |
|---|---|---|
| Problem fit | Exact-input retention, explicit rejection and missingness, identity policy, frozen compound records, export and exact replay | Larger qualified reference coverage; general portability beyond tested environments |
| Technical execution | Strict exported-field metadata, graph-matched run comparison, incompatible-engine comparison withholding, connection checks, bounded import and repeatable preflight | Independent security and deployment review; broader operational failure testing |
| Novelty | Explain changed budgets, inputs, engine and snapshot without pairing different compounds; visible side-by-side worked example | Comprehensive competitor study or novel scientific algorithm; no blanket novelty claim |
| Usability/presentation | Working-tool navigation, original light purple design, token-file loading, connection feedback, three-minute route | Independent accessibility audit and participant usability results |
| Demonstrated user value | Clear intended student task and inspectable examples | **Untested, as requested. No participants or benefit metrics** |
| Demo reliability | Local analysis → persisted export → exact replay; passing build and observed browser workflow | This iteration did not repeat cold startup, clean install or tests on a second physical machine |

## What the comparison measures

`baseline.py` uses default RDKit parsing, canonical SMILES, molecular weight and TPSA. `build_comparison.py` executes that code and the existing frozen Evidence Lab engine on **24 deliberately selected cases**. It produces `bioscribe-ai/src/lib/phase3/worked-comparison.json`, consumed by the `/proof` page. BioScribe identifies 13 and rejects 11 under its declared input policy. These are fixture counts, not accuracy or failure rates on a real population.

The simple script correctly handles ordinary molecules and rejects several malformed graphs. It also accepts names, dummy/query graphs, empty input and some text reinterpretations that BioScribe's narrower policy rejects. It has no evidence-status or warning layer. This comparison is **not** against a named competing product, and a developer can extend the baseline with these same safeguards. It does not establish superior underlying chemistry, speed, predictive performance or user productivity.

The extra budget fixture uses the same frozen engine and source snapshot. The original reference/challenge packages, engine source bundle, dependency lock, six frozen source records and blocked scientific study were not edited by this iteration. Old verification manifests describe their original revisions; they are not attestations of this changed frontend.

## Verification performed in this iteration

| Check | Exact command | Result |
|---|---|---|
| Generate observations and budget fixture | `.\.phase3-venv\Scripts\python.exe hackathon/judging-upgrade/build_comparison.py` | 24 observations generated; no activity labels |
| Executed observations, abstention, identity and budget fixture | `.\.phase3-venv\Scripts\python.exe -m pytest hackathon/judging-upgrade/test_comparison.py -q --junitxml=hackathon/judging-upgrade/comparison-tests.xml` | **21 passed** |
| New comparison, metadata and readiness checks | `cd bioscribe-ai; node scripts/judging-upgrade-check.cjs` | **30 passed** |
| Existing Lab client regressions | `cd bioscribe-ai; node scripts/evidence-lab-check.cjs` | **35 passed** |
| Original contract client checks | `cd bioscribe-ai; npm run test:contract` | **25 passed** |
| Original hackathon client checks | `cd bioscribe-ai; npm run test:hackathon` | **23 passed** |
| TypeScript | `cd bioscribe-ai; npm run typecheck` | Exit 0 after initial type correction |
| Lint | `cd bioscribe-ai; npm run lint` | Exit 0 |
| Final production build | `cd bioscribe-ai; npm run build` | Exit 0, including types/lint; `/proof` generated; `/evidence` 210 kB first load |
| Single-command local rehearsal | `powershell -NoProfile -ExecutionPolicy Bypass -File hackathon/start-demo.ps1 -Verify` | Exit 0, six checks; receipt in `preflight-result.json` |
| Interactive browser | In-app browser actions, recorded in `browser-checks.json` | **10 observed checkpoints** |

Total client checks: **113**. The 21 Python checks are an additional suite. The historical 234 backend and 61 Linux results were not rerun and are not included in these fresh counts. No production-server browser run or new cross-OS execution is claimed.

During verification, one initial Python expectation classified `C~C` as an unsupported bond; the implementation correctly identifies it earlier as a query graph. The fixture expectation was corrected. A separate new check exposed a real import gap: output metadata with Pydantic construction defaults could be absent. The client now requires every declared output field explicitly, including method, validation status, identity policy and tie-break. It never supplies an inferred default to imported evidence. Existing accepted exports still pass.

Run comparison is a structural inspection of two checked packages, not a new scientific calculation or authenticated provenance. Rejected, duplicate and absent identities are not paired. Numeric comparisons are withheld across different engines/policies. Different values under identical declared dependencies raise an investigation warning. A freshly recomputed hash match remains a separate test.

## Unchanged release gates

Scientific validation, sensitive-data intake, protected independent custody and production deployment remain blocked. The ALDH1A1 study remains a blocked design record; no outcomes or labels were accessed. No unsupported predictive capability was enabled. A judge can assess this public-data educational software on its actual working scope, but a perfect score across all categories cannot be established by implementation checks alone.
