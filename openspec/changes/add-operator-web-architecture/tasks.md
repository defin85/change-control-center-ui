## 1. Navigation Model
- [ ] 1.1 Inventory the operator context currently held in `web/src/App.tsx` and map the durable subset to URL-addressable state for tenant, queue view/filter, selected change, selected run, and active workspace.
- [ ] 1.2 Define the thin root-shell responsibilities versus feature/workspace responsibilities before any implementation refactor begins.

## 2. Web Contract Boundary
- [ ] 2.1 Define a shared request client responsibility set: request execution, response validation, normalized errors, and auth/runtime failure handling.
- [ ] 2.2 Define schema-backed contracts for bootstrap, queue, change detail, run detail, operator actions, approvals, and clarification endpoints.

## 3. Server-State Orchestration
- [ ] 3.1 Define shared query and mutation hooks for bootstrap, queue, change detail, run detail, approvals, and clarification flows.
- [ ] 3.2 Define invalidation and reconciliation rules so queue, selected change, and selected run stay consistent after mutations and live updates.

## 4. Feature Composition
- [ ] 4.1 Split the current monolithic root-shell responsibilities into focused feature boundaries for queue, detail, run studio, clarifications, and shared shell concerns.
- [ ] 4.2 Keep backend-owned entities out of ad hoc local mirrors and limit client-local state to ephemeral UI concerns.

## 5. Realtime Boundary
- [ ] 5.1 Define a shared tenant-event subscription boundary that updates or invalidates the affected server-state surfaces without feature-specific websocket logic.
- [ ] 5.2 Preserve selected operator context when live updates arrive and the backend still considers that context valid.

## 6. Verification
- [ ] 6.1 Add unit coverage for URL-state parsing, contract validation, normalized error handling, and cache reconciliation rules.
- [ ] 6.2 Update browser e2e coverage to verify reload/deep-link restoration of operator context and consistent refresh after mutations or tenant events.
- [ ] 6.3 Validate this architecture change together with `update-ui-to-control-center-parity` so parity work uses the new seams instead of extending the monolithic root component.
