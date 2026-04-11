# Change: Add operator command workflows

## Why
Once queue, detail, and runs are readable, the shell still lacks the operator actions that make those surfaces useful: creating tenants and changes, deleting changes, escalating, blocking by spec, and starting the next run. The backend already owns those mutations, but the shipped shell has no interactive command boundaries.

This change restores command workflows through explicit pending and error handling instead of ad hoc clicks or hidden legacy fallbacks.

## What Changes
- Wire supported operator mutations from the functional shell into backend-owned command contracts.
- Add explicit pending, success, and error boundaries for header, queue, detail, and run-adjacent commands.
- Reconcile shell state after mutations through the shared shell controller rather than client-owned duplicate truth.
- Keep unavailable commands fail-closed and operator-facing.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/App.tsx`, `web/src/platform/workflow/useAsyncWorkflowCommandMachine.ts`, `web/src/platform/workbench/RepositoryAuthoringDialog.tsx`, `web/src/reference/*`, `web/e2e/*`, `backend/tests/test_api.py`
- Dependencies:
  - `rebaseline-operator-ui-platform-after-static-reset`
  - `add-shell-bootstrap-and-route-state-controller`
  - `add-functional-repository-catalog-workspace`
  - `add-functional-tenant-queue-workspace`
  - `add-selected-change-detail-workspace`
  - `add-runs-workspace-and-run-detail-handoff`
