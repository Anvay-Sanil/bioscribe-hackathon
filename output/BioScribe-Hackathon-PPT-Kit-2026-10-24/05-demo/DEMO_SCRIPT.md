# Live and recorded demonstration

## Prepare in the original project workspace

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File hackathon/start-demo.ps1 -Verify
```

Open `http://localhost:3000/proof` or `/evidence`. This pack is not the application runtime. The local access token is intentionally not included. In the app, load your existing local token file privately and check the connection. Do not show the token contents on a projector. Confirm public, non-sensitive inputs.

## Three-minute primary demo

1. **0:00–0:40:** Load “Break the input”; select `CCO C1OC1` or `*CC`. Show the original row, diagnostic and absent numeric descriptors.
2. **0:40–1:10:** Show the three distinct missing-evidence states. For `[H][H]`, the heavy-atom fraction is undefined, not zero.
3. **1:10–1:40:** Load three reference compounds; show the preserved identities and frozen source records. Show QED/descriptor comparison as unvalidated orderings.
4. **1:40–2:30:** Recompute the reference package and wait for the fresh match indicator. Export the JSON package and HTML report.
5. **2:30–3:00:** Explain Experiment Challenges with its recorded capsule or screenshot. For a longer slot, load the challenge-ready library and execute the suite live. The suite permits up to four minutes, so do not promise it will finish in thirty seconds.

## Local example files

- `reference-run.json`: three public reference compounds.
- `challenge-run.json`: 12 records covering malformed inputs, identity and missingness.
- `challenge-source-run.json`: four accepted records suitable for all six experiment challenges.
- `budget-one-run.json`: compare against the reference run at budget two.
- `recorded-challenge-capsule.json`: previously executed browser suite; opening it is recorded evidence, not new jobs.
- `full-report.html`: existing complete human-readable export, usable offline as a fallback.

## If the live service fails

State that fresh execution is unavailable. Open the recorded export or HTML report and identify it as a recorded example. Explain the previously recorded verification and its scope. Do not swap a recorded result into the story as if the failed live run succeeded.

The unknown-label learning exercise uses invented labels and belongs to a separate teaching workflow. It is optional; do not use its hit counts as experimental evidence in this pitch.
