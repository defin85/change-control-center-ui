# Change: Replace Repositories workspace with reference catalog

## Why
The current `Repositories` pill in the shipped simple-reference shell is only a static placeholder. That leaves the product without a canonical repository-centric workspace even though repository selection, tenant context, and catalog data already exist in the backend-owned model.

At the same time, the only richer repository catalog implementation lives in the deprecated legacy workbench path. That is the wrong authority:
- the default shipped shell does not have a real `Repositories` workspace yet;
- the legacy catalog still carries dashboard-style composition that does not match the simple reference;
- future repository UX work will stay ambiguous until one canonical catalog workspace replaces the placeholder.

## What Changes
- **BREAKING** turn `Repositories` into a real top-level operator workspace under route-addressable `workspace=catalog` instead of a static nav label.
- **BREAKING** replace the deprecated dashboard-style repository catalog surfaces with a reference-driven catalog layout as the canonical shipped path.
- Keep the repository workspace backend-owned by reusing the existing `repositoryCatalog` and tenant-selection contract; no client-only repository truth is introduced.
- Preserve route restoration, compact drawer behavior, `New repository`, `New change`, and `Open queue` actions within the new repository workspace.

## Impact
- Affected specs:
  - `operator-ui-platform`
- Affected code:
  - `web/src/App.tsx`
  - `web/src/reference/OperatorStyleSamplePage.tsx`
  - `web/src/platform/navigation/*`
  - `web/src/platform/workbench/RepositoryCatalogPanel.tsx`
  - `web/src/platform/workbench/RepositoryCatalogProfile.tsx`
  - `web/src/platform/workbench/*`
  - `web/e2e/*`
- Assumptions:
  - The shipped simple-reference shell remains the product direction for the default UI.
  - The existing `RepositoryCatalogEntry` contract is sufficient for the first canonical `Repositories` workspace pass.
  - `Runs` and `Governance` pills stay outside this change.
