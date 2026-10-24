# Original light frontend restoration

Restored on 2026-10-22, following the user's selection of the original light interface with purple gradients, navigation menus and pipeline cards.

## Restored experience

- `/` opens `/dashboard`: the original violet/fuchsia palette, light typography, translucent cards and large discovery action.
- The original `MainNavigation` component is active again. Dropdowns support click, keyboard, Escape and outside-click dismissal; compact navigation works on narrow screens.
- The pipeline form and real run results use the same visual language.
- Workspace cards open the supported analysis form and a saved-run-ID entry point. The original fabricated recent campaigns and statistics are not restored.
- Advanced, Enterprise and AtomNet entries remain visibly unavailable. Existing disabled routes retain their middleware block.
- The current request builder, client decoder, persisted run identity, credentials, evidence metadata and export path remain in use. No backend, learning-example or scientific-study source was edited.

The preserved original page sources remain in `bioscribe-ai/legacy-ui/app/`. Copies of the files explicitly replaced or patched at the start of this restoration are in `before/`; `.gitignore` was additionally saved before its change. Next.js also reformatted `tsconfig.json` and added the development type-output directory.

## Verification

From `bioscribe-ai`:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:contract
npm.cmd run build
```

- Type checking: passed, exit 0.
- Lint: passed, exit 0. The final production build also completed its lint and type checks.
- Existing client contract checks: 25 passed, exit 0.
- Final production build: passed, exit 0; dashboard, submission and results routes generated successfully.
- The initial sandboxed lint/build attempts stalled and were interrupted. Lint and builds then ran with approved execution outside that restriction.
- An intermediate rebuild failed when the existing development server shared `.next-phase3` with the build. `next.config.ts` now separates `.next-dev` for development from `.next-phase3` for production; the subsequent production build passed. Both generated directories are ignored by Git.

Browser checks on the running local development server confirmed:

1. `/` opens the restored dashboard.
2. Compact navigation opens and its pipeline link navigates and closes the menu.
3. Molecule input type sets the declared record count to zero; two SMILES lines appear as two molecular inputs without altering their text.
4. Submission remains disabled without a token and public-data confirmation.
5. The desktop Pipeline dropdown opens and its workspace link navigates correctly.
6. Advanced entries display `Unavailable in this prototype` without linking to disabled engines.
7. Escape dismisses the desktop dropdown.
8. An invalid run ID is rejected on the dashboard.
9. A valid-format synthetic run ID opens the report access screen with no findings or export before authentication.
10. The compact dashboard has no horizontal overflow (observed content width 339, viewport width 347 CSS pixels). Desktop layout was also inspected.

The temporary desktop viewport override was reset. The restored dashboard is left open. `dashboard.jpg` shows the desktop presentation.

These are frontend checks. Backend computation, authenticated end-to-end runs, predictive performance and deployment qualification were not rerun or newly claimed. Existing scientific and sensitive-data gates remain unchanged. Earlier verification manifests describe their historical source revisions; this restoration intentionally changes frontend hashes.
