## 1. Shared Realtime Boundary
- [x] 1.1 Integrate the shared tenant realtime boundary into the functional shell controller.
- [x] 1.2 Reconcile queue, detail, run, approval, and clarification state from tenant events through one invalidation/update path.

## 2. Degradation Handling
- [x] 2.1 Surface explicit degraded realtime state and supported recovery behavior when the websocket path fails.
- [x] 2.2 Guard against stale refresh responses overwriting newer shell state.

## 3. Proof
- [x] 3.1 Add browser coverage for realtime reconciliation, degradation visibility, and stale-response protection.
- [x] 3.2 Run `openspec validate 09-add-realtime-reconciliation-and-degradation-visibility --strict --no-interactive`.
