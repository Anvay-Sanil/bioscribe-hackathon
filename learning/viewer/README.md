# Local learning report viewer

Open `index.html` in your browser by double-clicking it. No installation, server or backend is needed. The page reads only the JSON file you choose; there are no uploads, web requests or saved browser copies.

The conspicuous **Synthetic learning data** banner is always present. All outcome labels in these examples are invented. Displayed molecular calculations and invented-label comparisons establish no biological performance.

## Try the three saved reports

Choose **Open report JSON**, then select files from:

`E:/Bioscribe/CascadeProjects/windsurf-project/learning/exercises/budget-and-unknown/`

| File | Budget | Scored molecules | Heuristic invented positives | QED invented positives |
| --- | ---: | ---: | ---: | ---: |
| `budget-100-result.json` | 100 | 120 | 14 / 100 | 14 / 100 |
| `budget-10-result.json` | 10 | 120 | 2 / 10 | 1 / 10 |
| `budget-10-unknown-result.json` | 10 | 120 | Not assessed | Not assessed |

Load `budget-10-result.json`, then `budget-10-unknown-result.json`. The previous selections and metrics disappear immediately when the second file is selected. Once loaded, its status reads **Insufficient evidence**, both selection cards and every comparison read **Not assessed**, and all **120 scored molecules** remain in the table. `alkane-028` has an **Unknown** invented label. Scroll within the table to reach every molecule; on narrow screens, scroll it horizontally for the remaining columns.

## Search and filter the table

Use **Search molecules** to find a full or partial molecule ID or canonical SMILES. ID matching ignores case; SMILES matching is a literal, case-sensitive substring because uppercase and lowercase symbols differ. Leading and trailing search whitespace is ignored.

Choose **Invented positive**, **Invented negative** or **Unknown** from **Invented label**. Search and label filters work together. The caption reports **Showing X of 120 molecules**, where 120 is always the complete report's row count. **Clear filters** resets both controls; choosing **All labels** resets only the label filter. With no matches, the table shows an explicit empty state.

For the acceptance exercise, open `budget-10-unknown-result.json` and choose **Unknown**. Only `alkane-028` appears and the caption reads **Showing 1 of 120 molecules**. Choose **All labels** or **Clear filters** to restore **Showing 120 of 120 molecules**. All outcome comparisons remain **Not assessed** throughout.

Filtering changes only which table rows are displayed. The selection budget, scored-molecule count, both complete-report selections, invented-positive counts and outcome comparisons always describe the whole loaded report. Filtering never reranks or recalculates them. Opening another file or clearing the report resets the filters; controls are disabled while no valid report is loaded.

Every report is rendered afresh. A slower earlier read cannot overwrite the latest file, and **Clear** also cancels pending reads. Invalid or oversized files clear the old results and show an error. Text from files is displayed as text, never executable HTML.

The page accepts full `learning-replay/1.0.0` synthetic reports up to 4 MiB, with at most 128 input rows. It checks declared learning scope, coverage, unique identities, selection membership, invented-positive counts and exact metric fractions. Every displayed molecular field must have a finite value, assessment status `computed`, and the supported units and method/version below. Missing or contradictory metadata rejects the report, including reports whose outcome comparisons are unavailable.

| Field | Units | Method | Version |
| --- | --- | --- | --- |
| Molecular weight | `g/mol` | `rdkit_descriptors` | `1.1.0` |
| TPSA | `angstrom^2` | `rdkit_descriptors` | `1.1.0` |
| Heuristic | `dimensionless` | `prioritization_heuristic` | `1.1.0` |
| QED | `dimensionless` | `rdkit_qed_WEIGHT_MEAN` | `2025.03.3` |

The parser also requires the matching descriptor or unvalidated-heuristic evidence category, whole-graph coverage, no validation record, an unestablished predictive domain and input policy `plain_smiles_concrete_graph/1.1.0`. It performs no implicit unit conversion or method-version substitution.

This is a local inspection tool: these checks do not authenticate a file's origin, its molecular calculations or its hashes. Standalone failure envelopes without molecular rows are not supported reports.

Unavailable comparisons, including enrichment when all invented labels are negative, read **Not assessed**. Zero is shown only when a reported comparison was actually computed as zero.

## Verification

From the repository root:

```powershell
node --test learning/viewer/tests/report.test.cjs learning/viewer/tests/filters.test.cjs
```

All **39 automated checks passed**: the existing 29 parser/loading checks plus 10 table-filter checks. They cover all three exports, strict field metadata, unknown-label handling, combined search and label filters, case-sensitive SMILES matching, no-match views and unchanged report-level results. Current evidence is in `verification-search.json`.

The browser check uses an existing Playwright installation; no dependency or lockfile was added. On this machine:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:PLAYWRIGHT_BROWSER_CHANNEL = 'msedge'
node learning/viewer/tests/browser-check.cjs
```

All **17 current browser checks passed**, including the Unknown acceptance exercise, combined filters, unchanged report-level results, clearing stale results, mobile layout and no HTTP requests. The current runner writes results and screenshots to `verification-search/`, preserving earlier browser evidence. It ran using installed headless Edge outside the Windows command sandbox.

The **10 original browser checks** and screenshots in `verification/` remain historical evidence. `verification.json` preserves the initial source snapshot; `verification-field-contracts.json` preserves the later 29-check parser correction. Some in-app browser sessions block local-file URLs; open the HTML file in a browser that permits local files. The browser verification above was automated headless testing, not an interactive in-app rerun.

This feature changes only `learning/viewer`. Backend application code, dependency locks, saved exercise exports and the scientific study were preserved.
