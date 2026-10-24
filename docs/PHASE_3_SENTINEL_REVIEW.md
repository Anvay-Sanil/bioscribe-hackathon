# Phase 3 sentinel review

Review date: 16 October 2026, Asia/Calcutta. Scope: the submitted constrained public-data implementation, assessed against the accepted Phase 2 specification. This is a targeted source review and adversarial verification record, not a regulatory certification or predictive evaluation.

**Disposition: Phase 3 remains incomplete. Correct R1 and R2 in the supported molecular workflow; correct R3 before using the statistics helper for evaluation. Scientific release and sensitive-data intake remain blocked.**

All 62 files listed in `PHASE_3_VERIFICATION.json` matched their recorded SHA-256 values at review. The existing backend suite was independently rerun: **108 passed, zero failures/skips, one Starlette/AnyIO deprecation warning, in 20.95 seconds**. Passing that suite did not prevent the additional counterexamples below. The proposed corrections have not been applied to application source.

## R1 — [P1] Bind chemical identities to the persisted submission

Location: [store.py:149](E:/Bioscribe/CascadeProjects/windsurf-project/backend/bioscribe/store.py:149), with the self-consistency validator in [schemas.py:191](E:/Bioscribe/CascadeProjects/windsurf-project/backend/bioscribe/schemas.py:191).

`finish()` compares the artifact's `input_identity` against the persisted request. However, `InputIdentity` does not contain the ordered molecular input hashes. `Artifact.binding()` binds fields to the artifact's own chemical identity list. These checks do not establish that this list belongs to the submitted molecules.

Executed counterexample, using only public synthetic fixtures:

1. Submit a molecule-only request containing ethanol, `molecules=["CCO"]`.
2. Compute an artifact for benzene, `molecules=["c1ccccc1"]`, using that run ID.
3. Replace only the artifact's top-level `input_identity` with the parsed ethanol request identity.
4. Call `finish()` with the current valid attempt token.

Observed: publication returned `True`; retrieval reported `succeeded`, the ethanol request hash, and benzene chemical identity/descriptors. This demonstrates a missing defense against mismatched worker artifacts. It does not demonstrate a remote attacker acquiring a worker token, or an ordinary unmodified computation spontaneously switching compounds.

Required correction: verify molecular input count, order and hashes against the durable request before publication. Apply equivalent consistency checks when reading existing artifacts. A conforming helper is:

```python
from bioscribe.identity import digest, parse_input
from bioscribe.schemas import Artifact, RunRequest
from bioscribe.store import StoreError


def assert_artifact_request_binding(
    artifact: Artifact,
    request: RunRequest,
    stored_request_sha256: str,
) -> None:
    expected_identity = parse_input(request)
    if (
        expected_identity.request_sha256 != stored_request_sha256
        or artifact.input_identity != expected_identity
    ):
        raise StoreError("artifact_input_identity_mismatch")

    expected_hashes = [digest(smiles) for smiles in request.molecules]
    actual_hashes = [item.input_sha256 for item in artifact.chemical_identities]
    if actual_hashes != expected_hashes:
        raise StoreError("artifact_molecule_input_mismatch")
```

Integration point: inside the existing fenced publication transaction, after loading the stored request and before inserting any artifact or success state, call this helper with the parsed artifact, `RunRequest.model_validate_json(row["payload"])`, and `row["input_hash"]`. A rejection must leave the artifact unpublished; worker error handling must retain a truthful failed/retry state. Keeping both expected molecular hashes and observed chemical identities in a versioned artifact contract would also permit direct consistency checks by export consumers.

Acceptance: reject replacement, insertion, deletion and reordering of chemical identities, including zero-molecule requests receiving molecular results. Correctly bound inputs, including deliberate repeated molecules, must still succeed. Verify publication, retrieval and export behavior.

## R2 — [P1] Enforce the supported molecular language and graph domain

Location: [compute.py:67](E:/Bioscribe/CascadeProjects/windsurf-project/backend/bioscribe/compute.py:67).

Two executed inputs expose the gap:

| Input | Current result | Consequence |
| --- | --- | --- |
| `CCO C1OC1` | Identified as canonical `CCO`; ethanol descriptors and zero rule matches; complete coverage | The trailing apparent second structure becomes an unused molecule name rather than a rejected unsupported input. |
| `*CC` | Identified; molecular weight approximately `29.062 g/mol`, domain `in_domain` | A dummy atom with unspecified chemical identity is treated as supporting concrete whole-molecule descriptors. |

The single-dummy input `*` also produced molecular weight `0.0 g/mol` and a numeric prioritization heuristic. Sanitization alone does not define a concrete chemical input domain.

RDKit explicitly documents interpreting trailing text as a molecule name by default and disabling this behavior with parser parameters. [RDKit parser documentation](https://www.rdkit.org/docs/RDKit_Book.html#reading-molecule-names).

For the currently supported plain-SMILES descriptor workflow, use an explicit parser policy and exclude unresolved/query graphs. This retains the existing atom-count limit and suppresses native input-echoing errors:

```python
from rdkit import Chem, rdBase
from bioscribe.config import LIMITS


def parse_supported_smiles(smiles: str) -> Chem.Mol | None:
    parameters = Chem.SmilesParserParams()
    parameters.parseName = False
    parameters.allowCXSMILES = False
    with rdBase.BlockLogs():
        molecule = Chem.MolFromSmiles(smiles, parameters)
    if molecule is None or not 1 <= molecule.GetNumAtoms() <= LIMITS["molecule_atoms"]:
        return None
    if any(atom.GetAtomicNum() == 0 or atom.HasQuery() for atom in molecule.GetAtoms()):
        return None
    if any(bond.HasQuery() for bond in molecule.GetBonds()):
        return None
    return molecule
```

Use the existing unsupported-input branch when this returns `None`. Document the narrower domain and version the method/input policy. This is a minimum concrete-graph guard, not evidence that all remaining chemistry lies in the validated domain of every descriptor. Do not silently strip text or replace dummy atoms. If CXSMILES or named records are added later, give them an explicit input contract and preserve their meaningful annotations.

Acceptance: the counterexamples yield unsupported input with no descriptor or heuristic values. Valid supported salts, charges, isotopes and specified/unspecified stereochemistry retain their declared policy and identity. Test trailing names, whitespace-separated structures, CXSMILES, dummy/query atoms, query bonds, empty graphs and parser failures. Successful scans and failed scans must remain distinguishable.

## R3 — [P2] Separate correlation from ranking direction

Location: [metrics.py:68](E:/Bioscribe/CascadeProjects/windsurf-project/backend/bioscribe/metrics.py:68).

Executed fixture: three unique compounds for one target, with predictions and measured Kd both `[1, 2, 3] nM`, supplied with `direction="lower"`. The helper returned Pearson `-1`, Spearman `-1`, and RMSE `0` because it negates predictions before correlation but leaves measured labels unchanged. The parameter also controls enrichment ordering, where lower Kd is legitimately ranked first.

For ordinary numerical correlation, compare the actual prediction and label vectors. Use a separately named orientation only for enrichment ranking. If an oriented association is desired, define both prediction and label transformations explicitly and identify that statistic separately. [Pearson definition](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.pearsonr.html).

Replace the correlation/sign handling with:

```python
for name, value in (
    ("pearson", correlation(x, y)),
    ("spearman", correlation(ranks(x), ranks(y))),
):
    result[name] = metric(
        value,
        "computed" if value is not None else "undefined",
        "Descriptive association only" if value is not None else "Constant vector",
    )

# Use only for enrichment ordering, leaving the existing tie policy intact.
ranking_scores = x if direction == "higher" else [-value for value in x]
ordered = sorted(zip(ranking_scores, usable), key=lambda pair: pair[0], reverse=True)
```

Acceptance: matching physical-endpoint vectors return correlation `+1` and RMSE `0` for either ranking direction; inverse vectors return `-1`. Enrichment still follows the explicitly declared ranking direction. Record the direction and metric-definition version in the metric manifest. This helper remains outside the public predictive endpoints.

## Verification scope and remaining gates

The independently rerun command, from `backend`, was:

```powershell
& ../.phase3-clean/Scripts/python.exe -B -m pytest tests_phase3 -q -p no:cacheprovider --override-ini addopts= --override-ini faulthandler_timeout=20
```

The first sandboxed full-suite attempt stalled in Windows asyncio `socketpair()` creation and was interrupted. The same suite then passed outside that restriction with approved execution. The earlier pure parser/method/contract/statistics subset also passed: 77 tests. These counts overlap and must not be added together.

The three findings above were confirmed by additional direct public-fixture probes, independently of existing test assertions. No new live browser check, clean installation, container run or scientific benchmark was performed during this review. The prior final-browser limitation remains unchanged.

The proposed Python blocks in this document were extracted and checked in isolation: eight request-binding cases (valid identities, duplicates, replacement, order, insertion and deletion), fifteen parser cases (rejections and retained supported chemistry), and four correlation/ranking combinations passed. These 27 checks exercise the proposed snippets; they do not constitute an integrated application rerun after a source correction. All 62 submitted file hashes still matched after the review checks.

The declared open gates remain open: independent live checkpoint integration, operational privacy controls, complete resource qualification, Linux/container verification, and endpoint-specific scientific validation. Their acknowledged absence is not reclassified here as a new undisclosed defect. Keeping predictive endpoints disabled, sensitive intake blocked and active audit integrity unverified is required containment.

Before resubmission: add regressions for R1–R3; apply corrections; regenerate affected schemas/method records/client artifacts; run the relevant integration and existing checks; and update the verification ledger against the resulting source. Do not overwrite historical run provenance to make old artifacts appear newly verified. These proposed corrections and their local verification do not certify clinical readiness or regulatory compliance.
