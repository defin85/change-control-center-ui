## 1. Shared Shell State
- [x] 1.1 Add one shared bootstrap and route-state controller for tenant, workspace, search, and selection context.
- [x] 1.2 Reintroduce shared Control API usage for the functional shell foundation without restoring the deleted legacy workbench codepath.

## 2. Canonical Route Handling
- [x] 2.1 Normalize unsupported route params fail-closed while preserving supported tenant, workspace, and query state.
- [x] 2.2 Render backend-owned shell chrome from bootstrap data so later workspaces have one hydration source.

## 3. Proof
- [x] 3.1 Add browser and contract coverage for successful bootstrap hydration, route restoration, and explicit bootstrap failure handling.
- [x] 3.2 Run `openspec validate 02-add-shell-bootstrap-and-route-state-controller --strict --no-interactive`.
