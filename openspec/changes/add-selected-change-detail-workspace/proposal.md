# Change: Add selected change detail workspace

## Why
The queue becomes useful only after the operator can open one change and inspect its contract, memory, traceability, gaps, evidence, git state, and chief context. The backend already exposes that detail contract, but the shipped shell has no live selected-change stage.

Restoring selected-change detail gives the codex-lb shell a real primary working surface without reintroducing the deleted legacy detail implementation.

## What Changes
- Add a functional selected-change workspace fed by the backend change-detail contract.
- Restore contextual tabs and staged detail rendering inside the codex-lb shell language.
- Preserve compact viewport overlay behavior for selected-change context.
- Keep detail rendering backend-owned and fail closed on stale or missing change-detail state.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/App.tsx`, `web/src/reference/OperatorStyleSamplePage.tsx`, `web/src/platform/shells/*`, `web/src/platform/workbench/types.ts`, `web/e2e/*`, `backend/tests/test_web_contract_boundary.py`
- Dependencies:
  - `rebaseline-operator-ui-platform-after-static-reset`
  - `add-shell-bootstrap-and-route-state-controller`
  - `add-functional-tenant-queue-workspace`
