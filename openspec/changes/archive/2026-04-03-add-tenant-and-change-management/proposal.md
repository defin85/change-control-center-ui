# Change: Add tenant creation and change deletion management

## Why
The current operator shell can switch between existing tenants and create new changes, but it cannot create a new project/tenant or remove a change that is no longer relevant. That leaves two basic lifecycle operations outside the product shell and forces operators back to seed data or direct store manipulation.

## What Changes
- Add backend-owned tenant creation for new project/workspace entries.
- Add backend-owned change deletion with cascade cleanup of runs, approvals, evidence, and clarifications.
- Add operator UI flows for `New project` and `Delete change`.
- Keep tenant routing, queue selection, and realtime reconciliation fail-closed when the selected change is deleted or the active tenant switches to a newly created project.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Affected code: `backend/app/*`, `backend/tests/*`, `web/src/*`, `web/e2e/*`
