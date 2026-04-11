# Change: Add runs workspace and run-detail handoff

## Why
Run monitoring is already available in the backend through tenant run-list and run-detail contracts, but the shipped shell has no functional run workspace or run-detail handoff. Without this surface, run execution remains operationally invisible even after queue and change detail are restored.

The next step is a dedicated runs workspace that remains tied to tenant and change context instead of reviving the removed `Run Studio` model.

## What Changes
- Add a functional top-level `Runs` workspace backed by the tenant run-list contract.
- Add run-detail rendering and explicit handoff back to the owning change.
- Preserve change-local run history while making `Runs` the cross-change operational workspace.
- Keep run routing canonical and avoid restoring the removed legacy run surface.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/App.tsx`, `web/src/platform/navigation/*`, `web/src/platform/shells/*`, `web/src/reference/OperatorStyleSamplePage.tsx`, `web/e2e/*`, `backend/tests/test_api.py`
- Dependencies:
  - `rebaseline-operator-ui-platform-after-static-reset`
  - `add-shell-bootstrap-and-route-state-controller`
  - `add-functional-tenant-queue-workspace`
  - `add-selected-change-detail-workspace`
