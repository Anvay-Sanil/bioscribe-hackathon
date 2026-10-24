# Budget and unknown-label learning exercise

All labels are invented software fixtures. These results have no biological-performance interpretation.

The original demo input and replay program were preserved. The two modified inputs and all three exported reports are saved beside this note. `comparison.json` contains exact metric fractions and the selected record identities.

| Case | Scored molecules | Selected per method | Heuristic invented positives | QED invented positives | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Original budget 100 | 120 | 100 | 14/100 | 14/100 | complete; exit 0 |
| Budget 10 | 120 | 10 | 2/10 | 1/10 | complete; exit 0 |
| Budget 10, one unknown | 120 | withheld | withheld | withheld | insufficient_evidence; exit 2 |

Changing only the budget leaves every molecular score unchanged. Each budget-10 selection is the first 10 identities in its corresponding budget-100 ranking. Precision denominators change from 100 to 10; the library still contains the same 120 molecules.

The unknown-label input changes only `alkane-028.test_label` from `true` to `null` relative to the budget-10 input. Its molecular descriptors and ranking scores remain unchanged. The report records one unknown, retains all 120 rows and returns null for `selections`, `synthetic_label_counts` and `conditional_metrics`. It neither treats the unknown as false nor removes the molecule or substitutes another one.

## The two budget-10 selections

| Rank | Heuristic record | QED record |
| ---: | --- | --- |
| 1 | alkane-025 | alkane-008 |
| 2 | alkane-024 | alkane-009 |
| 3 | alkane-026 | alkane-007 |
| 4 | alkane-023 | alkane-005 |
| 5 | alkane-027 | alkane-010 |
| 6 | alkane-022 | alkane-006 |
| 7 | alkane-028 | alkane-011 |
| 8 | alkane-021 | alkane-004 |
| 9 | alkane-029 | alkane-012 |
| 10 | alkane-020 | alkane-013 |

## Reproduce from the repository root

```powershell
& .phase3-clean/Scripts/python.exe -B -m learning.replay learning/demo-input.json
& .phase3-clean/Scripts/python.exe -B -m learning.replay learning/exercises/budget-and-unknown/budget-10-input.json
& .phase3-clean/Scripts/python.exe -B -m learning.replay learning/exercises/budget-and-unknown/budget-10-unknown-input.json
& .phase3-clean/Scripts/python.exe -B -m pytest learning/tests -q -p no:cacheprovider
```

The third replay intentionally exits 2. The software suite passed all 37 checks. Run IDs vary; the two complete selections and conditional arithmetic remain deterministic for the same input and environment.

The lesson: selection budget changes how many ranked molecules are chosen, while missing labels change which comparisons can be reported. Descriptor computation does not establish experimental activity. These runs use invented labels and do not constitute scientific validation.
