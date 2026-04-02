## 1. Product Integrity Invariants
Dependency note: `1.1` and `1.2` define the backend-owned invariants that the UI boundary must honor before orchestration and browser proofs are updated.

- [x] 1.1 Align promoted fact responses and frontend schemas with the canonical backend fact record, including persisted identity, tenant scope, and status.
- [x] 1.2 Make answered clarification rounds historical-only and ensure new open rounds cannot inherit stale draft answers or resubmit prior selections.
- [x] 1.3 Add backend and browser regression coverage for promotion success and clarification history integrity.

## 2. Shared Operator Orchestration
Dependency note: `2.1` through `2.3` depend on the integrity invariants from section `1`.

- [x] 2.1 Sequence tenant switch, popstate, realtime, and mutation-driven refreshes so stale responses cannot overwrite newer queue/detail context.
- [x] 2.2 Clear or invalidate cross-tenant selected change/run context before requesting detail for the next tenant so the shell fails closed without collapsing into a terminal global error.
- [x] 2.3 Detect unexpected realtime subscription loss and either recover the shared tenant subscription or surface explicit degraded state for the active tenant.

## 3. Explicit Command And Draft Boundaries
Dependency note: `3.1` through `3.3` depend on the shared orchestration changes from section `2`.

- [x] 3.1 Route global header mutations through the same explicit workflow boundary and normalized error handling used by detail, run, and clarification surfaces.
- [x] 3.2 Keep `Gaps` rows non-mutating and preserve `Mark blocked by spec` as an explicit change-level action.
- [x] 3.3 Reset or re-key change-scoped fact drafts and round-scoped clarification drafts when selected change or active round changes.

## 4. Deterministic Platform Proof
Dependency note: `4.1` depends on sections `1` through `3`; `4.2` can be developed in parallel once the target regression list is agreed.

- [x] 4.1 Remove order dependence from mutable Playwright scenarios and keep platform browser proofs isolated from prior mutated backend state.
- [x] 4.2 Add platform/browser coverage for tenant-switch integrity, promotion success, historical clarification rounds, realtime degradation, and global-command workflow failures.

## 5. Validation
- [x] 5.1 Run `cd /home/egor/code/change-control-center-ui && uv run pytest backend/tests -q`.
- [x] 5.2 Run `cd /home/egor/code/change-control-center-ui/web && npm run build`.
- [x] 5.3 Run `cd /home/egor/code/change-control-center-ui/web && npm run test:e2e`.
- [x] 5.4 Run `cd /home/egor/code/change-control-center-ui/web && npm run lint`.
- [x] 5.5 Run `cd /home/egor/code/change-control-center-ui/web && npm run test:e2e:platform`.
