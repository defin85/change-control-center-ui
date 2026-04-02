# Change: Update operator UI state integrity

## Why
The current operator UI platform is in place, but review of the shipped runtime path exposed several integrity defects that break the intended contract:
- successful fact promotion can fail at the shared web contract boundary because the browser narrows the canonical backend fact shape;
- cross-tenant context switches can issue stale detail requests and push the whole shell into a global error state;
- answered clarification rounds remain effectively editable from the UI and can inherit stale draft answers;
- realtime subscriptions can die after an unexpected close without making degradation explicit;
- some global header actions bypass the explicit workflow boundary used by detail, run, and clarification surfaces;
- browser conformance tests mutate shared backend state and are more order-dependent than the platform contract should allow.

These are not new product features. They are integrity repairs to the operator UI platform and the backend-owned planning/runtime flows it depends on.

## What Changes
- Add explicit integrity requirements for canonical promoted fact records and historical clarification rounds in `application-foundation`.
- Extend the operator UI platform contract with tenant-safe reconciliation, fail-closed draft scoping, explicit global command workflow boundaries, non-mutating gap inspection, realtime degradation visibility, and deterministic browser proofs.
- Define one tightly scoped implementation plan for the frontend, backend contract edges, and platform test coverage needed to repair those behaviors.
- Preserve the current IA and approved UI foundation choices; this proposal does not redesign the workbench, replace Base UI, or broaden the visual system scope.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Related changes: `add-operator-ui-platform-contract`, `add-ui-delivery-validation-contract`
- Affected code:
  - `web/src/platform/contracts/*`
  - `web/src/platform/server-state/*`
  - `web/src/platform/realtime/*`
  - `web/src/platform/workbench/*`
  - `web/src/components/ChangeDetail.tsx`
  - `web/src/components/ClarificationPanel.tsx`
  - `web/e2e/*`
  - `backend/app/main.py`
  - `backend/app/domain.py`
  - `backend/tests/*`
