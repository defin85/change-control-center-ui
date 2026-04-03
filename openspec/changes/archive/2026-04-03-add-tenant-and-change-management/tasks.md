## 1. Backend
- [x] 1.1 Add backend APIs and store support for creating a new tenant/project entry.
- [x] 1.2 Add backend APIs and store support for deleting a change with cascade cleanup of related backend-owned records.
- [x] 1.3 Emit backend events needed for queue/detail reconciliation after change deletion.

## 2. UI
- [x] 2.1 Add a header authoring flow for creating a new project/tenant.
- [x] 2.2 Add an explicit confirmed detail action for deleting the selected change.
- [x] 2.3 Update shared server-state orchestration so tenant selection, route state, and selected change/run context reconcile correctly after create/delete flows.

## 3. Validation
- [x] 3.1 Add backend coverage for tenant creation and change deletion cascade behavior.
- [x] 3.2 Add browser coverage for creating a tenant and deleting a change from the operator shell.
- [x] 3.3 Run `uv run pytest backend/tests -q`.
- [x] 3.4 Run `cd web && npm run build`.
- [x] 3.5 Run `cd web && npm run test:e2e`.
