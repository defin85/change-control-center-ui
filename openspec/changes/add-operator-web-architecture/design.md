## Context
The current web app is functionally real, but its composition is still foundation-grade rather than production-grade. The main warning signs are visible directly in the codebase:
- [web/src/App.tsx](/home/egor/code/change-control-center-ui/web/src/App.tsx) owns bootstrap loading, queue filtering, change selection, run selection, change detail fetching, run-detail fetching, websocket subscription handling, and multiple operator actions in one root component.
- [web/src/api.ts](/home/egor/code/change-control-center-ui/web/src/api.ts) exposes raw `fetch` wrappers with no response validation, normalized error shape, or shared failure policy.
- Selected change/run/view/filter context is mostly in-memory React state, so deep-linking and reload restoration remain fragile.
- The currently open parity change will add more shell surfaces and detail behaviors; without new seams it will increase root-component orchestration and cross-component coupling.

The architecture we studied in a comparable operator dashboard suggests a practical direction that fits this repo's own constraints:
- keep the app shell thin,
- centralize the HTTP contract boundary,
- separate server state from client-only preferences,
- preserve operator context in URL state,
- treat realtime updates as cache reconciliation rather than bespoke fetch chains.

This change captures those patterns as architecture requirements for this repository. It is intentionally separate from UI parity so we do not mix visible operator surfaces with the internal frontend structure needed to sustain them.

## Goals / Non-Goals
- Goals:
  - Keep backend-owned product truth intact while making the React UI easier to extend.
  - Define durable frontend seams for routing, data fetching, mutations, and realtime refresh.
  - Make the upcoming parity work implementable without growing a larger monolithic root component.
  - Preserve operator context across reload, direct navigation, and back/forward.
  - Improve contract safety and testability at the web API boundary.
- Non-Goals:
  - Redefine operator IA, visible surfaces, or desktop parity goals already covered by `update-ui-to-control-center-parity`.
  - Move product truth into the browser or introduce client-only fallback state for changes, runs, approvals, or clarifications.
  - Change the backend-to-sidecar runtime architecture.
  - Mandate pixel-level UI redesign or a new design system in this change.

## Decisions
- Decision: Make operator context route-aware and URL-addressable.
  - Why: The current in-memory-only selection model makes reload, deep-linking, and parity-era surface transitions brittle.
  - Implementation direction: Use `react-router` and stable path/search state for tenant, queue slice, selected change, selected run, and active workspace.

- Decision: Introduce a shared web contract client with runtime response validation.
  - Why: The current `fetch` helpers return unchecked JSON and force each feature to trust backend payloads blindly.
  - Implementation direction: Use a shared request client plus schema-backed contracts with Zod or an equivalent runtime validator.

- Decision: Separate server state from client-only UI state.
  - Why: Queue data, change detail, run detail, approvals, and clarification rounds are backend-owned entities and should not be mirrored ad hoc inside the root shell.
  - Implementation direction: Use a shared query/mutation orchestration layer such as TanStack Query; reserve local state for ephemeral UI-only concerns like panel toggles or input drafts.

- Decision: Keep the root shell thin and organize web code by focused operator features.
  - Why: `App.tsx` is already large enough to show that the current composition does not scale cleanly into the parity change.
  - Implementation direction: Move queue, detail, run studio, clarification, and shared shell concerns behind focused feature modules and hooks with stable interfaces.

- Decision: Treat tenant websocket events as a shared realtime boundary.
  - Why: The current root effect chains direct refresh calls for queue and selected detail. That couples live updates to one component and will worsen as more surfaces subscribe to the same truth.
  - Implementation direction: One subscription boundary should invalidate or patch shared server-state caches for affected entities while preserving current selection when still valid.

- Decision: Keep architectural requirements library-aware in design, but library-neutral in spec intent where possible.
  - Why: We want explicit engineering guidance for implementation without turning the normative spec into a vendor checklist.

## Risks / Trade-offs
- Adding router/query/schema tooling increases frontend dependency count.
  - Mitigation: keep the stack small and use each tool for one clear boundary: navigation, server state, contract validation.

- URL-backed context can become noisy or unstable if too much transient state is serialized.
  - Mitigation: only persist operator-relevant context that must survive reload or navigation.

- Realtime cache invalidation can cause stale or jumpy UI if invalidation rules are vague.
  - Mitigation: define affected entities and preservation rules explicitly for queue, selected change, selected run, and clarification surfaces.

- Architectural refactoring can be mistaken for a license to redesign the UI.
  - Mitigation: keep this change scoped to frontend structure and implementation seams; visible parity remains in the separate parity change.

- Runtime validation can surface backend contract drift that the current app silently tolerates.
  - Mitigation: treat that as a feature, not a regression, and add targeted contract fixes/tests where needed.

## Migration Plan
1. Define the stable navigation model for tenant, queue, change, run, and workspace context.
2. Introduce the shared contract client and schema-backed endpoint definitions around existing Control API calls.
3. Move bootstrap, queue, change detail, run detail, and mutation flows onto a shared server-state layer.
4. Split the root shell into focused feature boundaries and keep the root responsible only for providers, routing, and high-level composition.
5. Move websocket-driven refresh into a shared realtime boundary tied to the same server-state layer.
6. Extend tests to cover route restoration, contract validation, and live-update reconciliation.
7. Implement visible parity work on top of those seams rather than bypassing them.

## Open Questions
- None blocking. Assumption: the exact URL shape may use path segments, search params, or both, as long as operator context is stable, shareable, and restored from backend state after reload.
