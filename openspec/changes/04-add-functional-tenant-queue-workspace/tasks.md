## 1. Queue Surface
- [ ] 1.1 Render the queue workspace from backend-owned tenant change summaries instead of static sample rows.
- [ ] 1.2 Restore supported queue view and search behavior through the shared shell controller.

## 2. Selection And State
- [ ] 2.1 Wire selected-change handoff from the queue into canonical shell state.
- [ ] 2.2 Handle empty, missing, and stale selected-change context fail-closed without falling back to hidden legacy UI.

## 3. Proof
- [ ] 3.1 Add browser coverage for queue hydration, search, filtering, tenant switching, and selected-change handoff.
- [ ] 3.2 Run `openspec validate 04-add-functional-tenant-queue-workspace --strict --no-interactive`.
