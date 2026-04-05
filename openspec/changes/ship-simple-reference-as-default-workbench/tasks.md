## 1. Spec
- [x] 1.1 Add a breaking `operator-ui-platform` delta that makes the simple reference the shipped default operator shell and marks the current workbench as a hidden deprecated fallback.

## 2. Implementation
- [x] 2.1 Add route-state support for a hidden legacy-shell fallback and switch the default app entrypoint to the new shipped simple-reference shell.
- [x] 2.2 Build a live-data simple-reference workbench that follows the literal section cadence from `legacy/references/operator-workbench`.
- [x] 2.3 Keep required queue/detail workflow affordances, tabs, and run inspection available as subordinate surfaces under the new shell.
- [x] 2.4 Align repository catalog and compact variants to the same visual system and keep the old workbench hidden-only.
- [x] 2.5 Rewrite affected Playwright and platform proofs so canonical verification targets the new default shell only.

## 3. Verification
- [x] 3.1 Run `bash ./scripts/ccc verify ui-smoke`.
- [x] 3.2 Run `bash ./scripts/ccc verify ui-platform`.
- [x] 3.3 Run `openspec validate ship-simple-reference-as-default-workbench --strict --no-interactive`.
