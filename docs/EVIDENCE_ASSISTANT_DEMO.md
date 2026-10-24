# Evidence assistant: short public-data demonstration

Open [the local assistant](http://localhost:3000/evidence-assistant). Select **Open recorded example** for the labelled saved demonstration. For fresh checks, load `hackathon/.local/demo-token.txt`, confirm that the claims are public and non-sensitive, then check the connection.

Paste these seven statements:

```text
CHEMBL113 in activity 189032 has Ki = 26 uM.
CHEMBL113 in activity 189032 has Ki = 26 nM.
CHEMBL521 in activity 792824 has IC50 = 6300 nM.
CHEMBL25 in activity 189032 has Ki = 26000 nM.
QED proves that caffeine binds every protein.
Caffeine is safe.
CHEMBL113 in activity 189032 has Ki = 26000 nM but this is not true.
```

Expected behavior under this frozen snapshot:

1. The first proposition agrees with the particular 26,000 nM source record after unit conversion.
2. The second contradicts that recorded value.
3. The third abstains even though the numerical value matches: its publication status is unresolved.
4. The fourth abstains because the named molecule does not match the activity record.
5. The descriptor-to-activity inference abstains.
6. The clinical safety claim is outside scope.
7. The qualifying clause remains attached and the compound statement abstains; it cannot become a supported prefix.

Expand a citation to see its activity ID, exact field locator, excerpt, publication-status check and hash. Compare assay observations without averaging their different contexts. Export the review; its identifier links the download to the saved result. Changing a claim, credential or model option clears the previous result.

Always explain: **Research aid, not a prediction of efficacy or safety.** A verdict concerns a specific record under the current bounded grammar. It does not establish universal biological truth. The source collection is small; absence is not inactivity. General paper-passage reasoning and scientific qualification remain incomplete.

## Optional local model

From the repository root, using the existing locked environment:

```powershell
& .\.phase3-venv\Scripts\python.exe -B hackathon/prepare_evidence_model.py
& .\hackathon\start-evidence-model.ps1
Invoke-RestMethod http://127.0.0.1:8091/health
```

Wait for a ready health response before enabling the checkbox. The pinned Qwen3 4B model suggests exact statement spans only; suggestions remain unverified and cannot override record checks. This is optional for the deterministic review. It requires the separate ~2.5 GB model download and local runtime; no hosted inference service receives claims.

Reproduce the public-data API rehearsal:

```powershell
& .\.phase3-venv\Scripts\python.exe -B hackathon/check_evidence_assistant_live.py
& .\.phase3-venv\Scripts\python.exe -B hackathon/check_evidence_assistant_live.py --with-model --output docs/evidence-assistant-model-smoke.json
```

The 150 claims are a provisional development set. Blank reviewer forms and instructions are under `validation/evidence_assistant/`. Do not present draft-label agreement as verified accuracy or a baseline win. External benchmark recommendations were assessed in `EXTERNAL_BENCHMARK_REVIEW.md`; they are not imported results.
