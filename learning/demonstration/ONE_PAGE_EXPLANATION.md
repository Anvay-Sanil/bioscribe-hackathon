# From input to an honest report

**BioScribe local learning demonstration - synthetic learning data**

**Input -> Molecular calculations -> Ranking -> Saved report -> Viewer**

**Input.** The example library contains 120 straight-chain alkanes, identified by SMILES and molecule IDs. Every outcome label is invented: a chain length divisible by seven is labelled true. The unknown-label example replaces one true label with null. These labels are software fixtures, not assay measurements.

**Molecular calculations.** The strict parser accepts concrete molecular graphs. RDKit calculates molecular weight in g/mol, TPSA in square angstroms, and QED. These are graph-derived quantities and a calculated score; they do not establish experimental activity, affinity or safety.

**Ranking.** The handwritten heuristic orders molecules by ascending `abs(MW-350)/350 + abs(TPSA-75)/75`; the comparator orders by descending QED. Each uses a deterministic, label-independent tie-break and selects exactly the requested budget. Invented labels do not determine either order. This heuristic is unvalidated.

**Saved report.** JSON preserves molecular rows, identities, scores, field metadata, coverage and conditional comparisons. Changing the budget changes selection length, not molecular calculations. Unknown labels leave all calculations available; this exercise withholds selections and aggregate comparisons and reports insufficient evidence. Unknown never becomes negative.

**Viewer.** The local page checks finite values, assessment status, units, method/version and evidence metadata before display. It makes no web requests. Search and invented-label filters change table visibility only; report-level results stay fixed. Invalid metadata rejects the report and clears previous results.

| Demonstration | What appears |
| --- | --- |
| Budget 100 -> 10 | Both score 120; invented positives are 14/100 vs 14/100, then 2/10 vs 1/10 (heuristic vs QED). |
| One unknown label | All 120 remain scored; selections and comparisons read Not assessed. |
| Search alkane-028, then clear | Showing 1 of 120 molecules -> Showing 120 of 120 molecules; comparisons stay Not assessed. |
| Contradictory status or units | Rejection, with previous values cleared. |

**What this demonstrates:** molecular calculations can succeed while outcome comparisons remain unavailable. This is evidence of software behavior with invented labels, not biological performance. The separate scientific-validation study is unchanged.
