# Change: Add realtime reconciliation and degradation visibility

## Why
Once the shell can read and mutate backend-owned state, it still needs a shared way to reconcile external changes and reflect websocket health. The repository already retains a tenant realtime boundary foundation, but the shipped shell does not use it.

Realtime should be added only after functional workspaces exist, so the shell can reconcile queue, detail, run, and collaboration state through one path instead of inventing per-surface subscriptions.

## What Changes
- Add one shared tenant realtime boundary to the functional shell.
- Reconcile queue, detail, run, approval, and clarification state from tenant events through the shared shell controller.
- Surface explicit degraded state and recovery behavior when realtime is unavailable.
- Guard against stale refresh responses overwriting newer shell state.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/platform/realtime/*`, `web/src/App.tsx`, `web/src/reference/*`, `web/e2e/*`, `backend/tests/test_api.py`
- Dependencies:
  - `rebaseline-operator-ui-platform-after-static-reset`
  - `add-shell-bootstrap-and-route-state-controller`
  - `add-functional-tenant-queue-workspace`
  - `add-selected-change-detail-workspace`
  - `add-runs-workspace-and-run-detail-handoff`
  - `add-operator-command-workflows`
  - `add-clarification-approval-and-memory-flows`
