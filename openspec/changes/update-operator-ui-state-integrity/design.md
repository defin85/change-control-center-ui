## Context
The repository already has a pending operator UI platform contract and a separate pending UI delivery verification contract. The remaining gaps are integrity defects inside the shipped operator runtime path: stale cross-tenant selection, over-narrow contract validation, fail-open clarification history, silent realtime degradation, inconsistent command boundaries, and order-dependent browser proofs.

The goal is to repair those behaviors without reopening the broader architecture debate. The approved platform stack, workbench IA, backend-owned truth model, and backend-served verification workflow stay in place.

## Goals / Non-Goals
- Goals:
  - Keep backend-owned change, run, approval, clarification, and fact state authoritative.
  - Make shared browser-side orchestration monotonic and tenant-safe.
  - Fail closed on stale clarification/draft context and silent realtime loss.
  - Make command UX consistent across header, detail, run, and clarification entrypoints.
  - Restore deterministic browser proof for the repaired boundaries.
- Non-Goals:
  - Replacing the current UI foundation stack or redesigning the workbench IA.
  - Broad accessibility or visual-polish cleanup outside the repaired integrity paths.
  - Changing the UI delivery verification contract beyond the additional tests needed to prove these fixes.

## Decisions
- Decision: Treat promoted facts as canonical backend records end to end.
  - The browser contract will accept the same persisted fact shape that the backend stores and returns, instead of narrowing successful responses to a smaller ad hoc payload.

- Decision: Clarification history is read-only after answer submission.
  - Only the currently open round may expose live answer controls.
  - Browser draft state must be keyed to the active round and selected change so new rounds start clean.

- Decision: Shared orchestration must reject stale context rather than racing it.
  - Tenant switch, popstate restore, realtime refresh, and mutation-triggered refreshes need one sequencing model with stale-response guards.
  - Cross-tenant selected context must be invalidated before detail fetches for the next tenant begin.

- Decision: Explicit workflow boundaries apply to global mutations too.
  - Header entrypoints that create or mutate backend-owned state will use the same pending/error model already used by detail, run, and clarification surfaces.

- Decision: Realtime loss must be visible.
  - Unexpected websocket close is not a success path.
  - The shared realtime boundary must either attempt the configured recovery path for the same tenant or keep the shell in an explicit degraded state until reconciliation is healthy again.

- Decision: Inspection and mutation must remain separate affordances.
  - Gap rows stay inspectable and non-mutating.
  - Change-level mutation remains behind explicit actions such as `Mark blocked by spec`.

- Decision: Platform browser proofs must isolate mutable state.
  - The suite should not rely on previous tests having already mutated seeded backend state.
  - Integrity regressions should be proven with self-contained scenarios or resettable fixtures.

## Risks / Trade-offs
- More explicit sequencing in shared server-state logic can add implementation complexity.
  - Mitigation: keep one generation/cancellation model rather than multiple local fixes.

- Realtime recovery can become more complex than the current one-shot socket lifecycle.
  - Mitigation: allow a minimal compliant path that surfaces degraded state explicitly even before more advanced reconnect logic is added.

- Isolating browser tests may require slightly slower setup for mutable scenarios.
  - Mitigation: isolate only the mutable cases and keep smoke coverage separate from deeper platform conformance checks.

## Migration Plan
1. Repair product invariants first: canonical fact records and clarification history rules.
2. Harden shared browser orchestration and realtime degradation handling.
3. Move header mutations behind explicit workflow boundaries and remove hidden gap-row mutation.
4. Stabilize browser proofs and cover the repaired regressions.

## Open Questions
- None at proposal time. The current review findings are specific enough to scope the change without additional product clarification.
