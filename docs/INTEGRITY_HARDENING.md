# Integrity hardening — 25 October 2026

This iteration implements the five supplied integrity corrections. It does not qualify biological predictions, user value, sensitive-data intake or production deployment.

## Contracts and compatibility

New `/lab/runs` submissions use **lab-1.1.0**. Descriptor and QED ties use the canonical graph identity SHA-256, then index. Duplicate identities still block library selection. Existing **lab-1.0.0** capsules retain their original source, reference bytes, version lock and input-text tie rule through an installed, allowlisted historical engine under `backend/provenance_lab_legacy_v1`. Uploaded source is never executed. An unavailable/mutated historical engine is rejected. The UI marks historical capsules and their spelling-dependent tie rule.

New `/v3/runs` submissions use molecular contract **3.1.0**, with molecular method versions **1.2.0**. Historical **3.0.0** artifacts have a separate reader and method registry, retain their original fields and versions, and are not upgraded when retrieved or exported. Deprecated request versions are not accepted for new computation. The URL remains `/v3`; the explicit payload contract determines the data version.

`backend/molecular_core.py` is the shared current parsing, canonical graph and descriptor authority. It rejects atom maps, dummy/query graphs, unsupported stereo/bonds, malformed syntax, names, whitespace and unsupported annotations. Descriptors are calculated from a canonical re-parse and reported at eight decimals. Stereo, isotopes, formal charge, fragments, tautomer and protonation remain explicit. Structural-alert indices in the new v3 method refer to the canonical graph. New artifacts expose the graph identity hash and bind the hash-locked installer file. Both backend and browser reject missing exported evidence metadata; construction defaults are not evidence.

## Verification scope

`backend/tests_integrity/` adds 72 seeded random-SMILES/shuffle trials across three selection budgets, 25 shared acceptance/identity/descriptor sentinel cases, three frozen ChEMBL descriptor comparisons, five formula-based molar-mass cases, historical read/replay checks, missing-metadata rejection, a real Git autocrlf round trip, transfer-import omission detection and an actual pip changed-wheel hash rejection.

The ChEMBL checks compare MW, TPSA, ALogP and QED at the source's two-decimal precision. They are independent of BioScribe's implementation but share the underlying RDKit toolkit; they are **source concordance**, not independent experimental validation. The separate formula checks use explicit H/C/N/O counts and [CIAAW 2024 abridged central atomic weights](https://ciaaw.org/abridged-atomic-weights.htm) in Decimal arithmetic, with no RDKit table or formula lookup in the expected-value calculation. They concern standard-weight molar mass, not isotope-specific exact mass. A second toolkit and biological predictive qualification remain outside this iteration.

`.gitattributes` disables automatic newline conversion throughout the source, including hashed fixtures. Existing reference bytes and recorded examples are preserved. `backend/requirements-phase3.lock` remains the historical version receipt. The separate `requirements-phase3-install.lock` contains SHA-256 hashes for all 28 pinned distributions, generated with `uv pip compile --generate-hashes --universal --only-binary :all:`. Docker, the Windows transfer installer and verification installs use `--require-hashes --only-binary=:all:`. This protects expected distribution bytes; it is not authenticated source authorship or a runtime file-tampering guarantee.

The transfer builder excludes explicit runtime paths, preserves source folders named `data`, `build`, `dist`, `out`, `env` or `coverage`, and checks all literal local imports throughout `src/` against copied bytes. `MockAIResponses.json` already existed in this checkout and is retained. The scan found one additional missing source module, `ui/alert`, which was supplied. Dynamic resolution is additionally checked by TypeScript and a clean Next build.

## One verification entry point

From a Python 3.11 environment at the repository root:

```powershell
& .\.phase3-venv\Scripts\python.exe -B scripts/verify.py
# Fresh environment / CI:
& .\.phase3-venv\Scripts\python.exe -B scripts/verify.py --install
```

The command checks the current `SOURCE_MANIFEST.json` without regenerating it, audits source imports, verifies an outer transfer manifest when present, optionally installs hash-verified Python wheels and runs `npm ci`, runs plain `pytest` against the supported suites (including Phase 4 preflight), replays recorded packages in the public and presentation demo folders, runs TypeScript, lint, all seven current client scripts, and builds Next. Extracted transfers also scan their sibling `presentation/05-demo` folder, including nested trial packages; a regression check protects that layout. `--backend-only` reports a narrower scope explicitly. Results and exact commands go under `verification-output/`.

Type checking first generates Next route types with the installed `next typegen` command, so it works without a previous build cache. The verification entry point redirects client-check receipts into its output directory and checks the source manifest again at completion. Only Next's generated `next-env.d.ts` scaffold and explicit runtime/cache paths are outside the source byte receipt; configuration, contracts, implementation, locks and frozen data remain guarded. Transfer manifests still bind every copied file.

After deliberate reviewed source changes, issue a new byte receipt with `python -B scripts/source_manifest.py --write`; verification itself never repairs its own expectations. The receipt detects correspondence errors and is not an independently protected checkpoint.

`.github/workflows/verify.yml` runs the same full command on Ubuntu with Python 3.11.9 and Node 22.20.0 for pushes, pull requests and manual dispatch. The existing remote is `https://github.com/TheFailure272/BioScribe`. No commit, push or hosted Actions execution is implied by adding the workflow locally.

Executed results, commands, remaining limitations and the frozen transfer archive are recorded in [INTEGRITY_HARDENING_VERIFICATION.json](INTEGRITY_HARDENING_VERIFICATION.json). The ZIP is unchanged after testing; its verification record is also supplied as a separate sidecar. Final documentation receipts are added to this checkout after execution and do not modify the tested ZIP. Historical verification files remain evidence of their original iterations, not fresh passes for these changes.

The final isolated Linux run verifies backend checks and every recorded replay; the full frontend install/build is verified on Windows. A hosted Ubuntu full workflow has not run. Browser interactions were not repeated. `npm ci` reported 22 vulnerabilities across installed dependencies (5 moderate, 14 high, 3 critical); exploitability assessment and remediation remain deployment gates. No automatic breaking dependency upgrades were applied. Scientific release, sensitive-data intake and deployment remain blocked, and user value remains untested.
