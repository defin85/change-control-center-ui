# Change: Add functional tenant queue workspace

## Why
After the shell can hydrate backend-owned tenant and workspace state, the next operator-critical surface is the queue. The backend already exposes canonical change summaries per tenant, but the shipped shell still presents queue content as static sample copy.

A live queue workspace is the prerequisite for meaningful change selection, prioritization, and every downstream detail or run workflow.

## What Changes
- Add a functional tenant-scoped queue workspace backed by backend-owned change summaries.
- Restore queue search, view filtering, and selected-change handoff through the shared shell controller.
- Keep the codex-lb-inspired scan-first cadence instead of reintroducing the deleted legacy queue chrome.
- Fail closed when tenant queue state or selected change context cannot be rehydrated.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/App.tsx`, `web/src/platform/navigation/*`, `web/src/platform/server-state/filtering.ts`, `web/src/reference/OperatorStyleSamplePage.tsx`, `web/e2e/*`, `backend/tests/test_api.py`
- Dependencies:
  - `rebaseline-operator-ui-platform-after-static-reset`
  - `add-shell-bootstrap-and-route-state-controller`
  - `add-functional-repository-catalog-workspace`
