# Change: Add clarification, approval, and memory flows

## Why
The backend already supports clarification rounds, approval decisions, and tenant-memory promotion, but none of those collaborative flows are usable from the shipped shell. Without them, the UI can inspect state but still cannot support the operator loops that make the change model valuable.

This change restores collaboration workflows on top of the functional queue, detail, and run surfaces without reintroducing removed legacy components.

## What Changes
- Add operator-facing clarification round generation and answer submission in selected-change context.
- Add approval decision handling in run detail.
- Add fact-promotion flows from change detail into tenant memory.
- Keep all three flows backend-owned, explicit, and tied to the shared shell controller.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/App.tsx`, `web/src/platform/workflow/useAsyncWorkflowCommandMachine.ts`, `web/src/reference/*`, `web/e2e/*`, `backend/tests/test_api.py`, `backend/tests/test_web_contract_boundary.py`
- Dependencies:
  - `01-rebaseline-operator-ui-platform-after-static-reset`
  - `02-add-shell-bootstrap-and-route-state-controller`
  - `04-add-functional-tenant-queue-workspace`
  - `05-add-selected-change-detail-workspace`
  - `06-add-runs-workspace-and-run-detail-handoff`
  - `07-add-operator-command-workflows`
