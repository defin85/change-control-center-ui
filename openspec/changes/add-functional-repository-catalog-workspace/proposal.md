# Change: Add functional repository catalog workspace

## Why
`Repositories` is the safest first vertical slice for bringing live functionality back into the codex-lb shell. The backend already returns a canonical `repositoryCatalog`, and the reference catalog page still exists as a foundation artifact in the repository.

Turning `Repositories` into a real workspace gives the shell live tenant context, repository selection, and authoring entrypoints before the more complex queue, detail, and run surfaces are restored.

## What Changes
- Turn `Repositories` into a route-addressable functional workspace backed by the existing repository-catalog contract.
- Reuse the codex-lb-derived catalog composition instead of reviving the deleted dashboard-style legacy catalog shell.
- Wire repository selection, `New repository`, `New change`, and queue handoff through backend-owned state.
- Preserve compact viewport drawer behavior for selected repository context.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/App.tsx`, `web/src/reference/ReferenceRepositoryCatalogPage.tsx`, `web/src/platform/navigation/*`, `web/src/platform/workbench/RepositoryAuthoringDialog.tsx`, `web/src/platform/workbench/RepositoryCatalogProfile.tsx`, `web/e2e/*`
- Dependencies:
  - `rebaseline-operator-ui-platform-after-static-reset`
  - `add-shell-bootstrap-and-route-state-controller`
