## 1. Canonical Workspace Contract
- [x] 1.1 Make `Repositories` a canonical route-addressable workspace under `workspace=catalog` in the shipped shell.
- [x] 1.2 Preserve shared route state for `tenant`, `filter`, and `q` so the repository workspace restores after reload and browser navigation.
- [x] 1.3 Keep repository authoring and change authoring actions on approved backend-owned command paths.

## 2. Repositories UI
- [x] 2.1 Build a reference-driven `Repositories` page header, utility bar, and compact metrics row in the shipped simple-reference shell.
- [x] 2.2 Replace the deprecated dashboard-style repository list with a scan-first repository worklist that uses backend-owned catalog data.
- [x] 2.3 Build a selected repository stage with quiet stats, repository note, current pressure, featured change handoff, and the canonical `Open queue` / `Create first change` action.
- [x] 2.4 Preserve fail-closed empty, pending, and selection-error states without inventing client-only fallback truth.
- [x] 2.5 Preserve compact viewport behavior through a platform-approved drawer or dialog path for the selected repository stage.

## 3. Proofs And Verification
- [x] 3.1 Rewrite Playwright proofs so `workspace=catalog` is exercised as a canonical shipped workspace.
- [x] 3.2 Cover repository selection, route restoration, compact drawer behavior, and queue handoff from the selected repository stage.
- [x] 3.3 Run `bash ./scripts/ccc verify ui-smoke`.
- [x] 3.4 Run `bash ./scripts/ccc verify ui-platform`.
- [x] 3.5 Run `openspec validate replace-repositories-workspace-with-reference-catalog --strict --no-interactive`.
