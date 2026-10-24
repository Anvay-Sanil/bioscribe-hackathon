# BioScribe: a three-minute local demonstration

**Opening line:** "This is a local software-learning project. The molecules are example structures and every outcome label is invented. I will show how the program keeps calculations, selections and outcome comparisons distinct."

Open `E:/Bioscribe/CascadeProjects/windsurf-project/learning/viewer/index.html` in a browser that permits local files. Use **Open report JSON** for each file. Some in-app browser sessions block local-file URLs; this guide does not require the in-app browser.

The three accepted reports are in `E:/Bioscribe/CascadeProjects/windsurf-project/learning/exercises/budget-and-unknown/`. The deliberately contradictory fixtures are in this demonstration's `fixtures/` folder. Keep the **Synthetic learning data** banner visible.

| Step | What to do | What to show and say |
| --- | --- | --- |
| 1. Change the budget (45 seconds) | Open `budget-100-result.json`, then `budget-10-result.json`. | Both score 120 molecules. Each method selects exactly 100, then 10. Invented positives change from 14/100 for both methods to 2/10 for the heuristic and 1/10 for QED. "The budget changes how many molecules we select. It does not change their calculated scores. These counts describe invented labels." |
| 2. Introduce uncertainty (35 seconds) | Open `budget-10-unknown-result.json`. | Status becomes **Insufficient evidence**. Previous selections and comparisons disappear and read **Not assessed**. All 120 scored molecules remain. "One invented label is unknown. The program can calculate molecular properties without knowing an outcome. This exercise withholds selections and aggregate comparisons instead of treating unknown as negative." |
| 3. Inspect one molecule (30 seconds) | Search for `alkane-028`. Optionally choose **Unknown**. Then click **Clear filters**. | Show **Showing 1 of 120 molecules**, the **Unknown** label, and then **Showing 120 of 120 molecules**. Comparisons remain **Not assessed** throughout. "Filtering changes table visibility. It does not change the report's selection, counts or comparison population." |
| 4. Reject contradictory metadata (50 seconds) | Reload the valid budget-10 report. Open `fixtures/invalid-heuristic-status.json`. Reload the valid report and open `fixtures/invalid-molecular-weight-units.json`. | Each invalid file shows an error and clears the previous report. First: a numeric heuristic says `not_assessed`. Second: molecular weight says `kg/mol` while the supported contract and column use `g/mol`. "A number is not enough. Its status, units, method and version must agree before display. The viewer rejects these fixtures; it performs no silent conversion." |

**Closing line:** "The flow is input, molecular calculations, ranking, saved report, then viewer. Calculated descriptors and scores are not experimental activity. Invented labels exercise software behavior. Missing or contradictory evidence stays unavailable."

The one-page explanation is `E:/Bioscribe/CascadeProjects/windsurf-project/output/pdf/bioscribe-project-demonstration.pdf`; its editable text is `ONE_PAGE_EXPLANATION.md` beside this guide.

## Rehearsal evidence

`rehearse.cjs` follows this exact flow using the saved exports and both invalid fixtures. It checks the actual viewer, saves screenshots to `evidence/`, and verifies that each invalid fixture differs from the valid budget-10 report in exactly its declared field. Fixture filenames and `fixtures/manifest.json` explicitly identify them as invalid software tests. Their inherited identities are not new or authenticated runs.

With an existing Playwright installation, from the repository root:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:PLAYWRIGHT_BROWSER_CHANNEL = 'msedge'
node learning/demonstration/rehearse.cjs
```

This is an automated headless rehearsal, not a recording of a human presentation or an interactive in-app rerun. No application, viewer, dependency-lock, accepted-export or scientific-study changes are required.
