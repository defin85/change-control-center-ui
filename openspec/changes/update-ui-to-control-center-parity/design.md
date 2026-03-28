## Context
The repository now has a real application foundation, but the new React UI is still a simplified shell compared with the legacy control center template. The old template remains the strongest reference for the intended operator experience: it exposes queue pressure, filters, inspector state, dense detail surfaces, and direct control actions without requiring extra navigation.

The comparison against the current UI shows concrete parity gaps:
- no search field or equivalent global command placement,
- no left rail for saved views and severity/review filters,
- no inspector panel between queue and detail workspace,
- missing detail tabs: `Traceability`, `Gaps`, `Git`,
- missing detail actions: `Open run studio`, `Escalate`, `Mark blocked by spec`,
- lower information density and weaker desktop operator-console hierarchy than the legacy template.

At the same time, the new app already added real product constraints that must be preserved:
- backend-owned state and normalized run/evidence contracts,
- tenant scoping,
- dedicated runtime sidecar,
- clarification loop and run lineage surfaces.

This change should therefore restore UI parity on top of the new architecture, not by reusing or reviving the static template.

## Goals / Non-Goals
- Goals:
  - Restore the operator-facing surfaces and actions validated in the legacy control center template.
  - Bring the desktop UI to recognizable visual parity with the legacy control center.
  - Keep backend-owned state, runtime boundaries, and tenant scoping intact.
  - Reuse existing backend data where possible and extend query contracts only where parity requires new summaries or projections.
  - Preserve new foundation-only features such as clarification rounds and run lineage.
- Non-Goals:
  - Reintroduce static-prototype-only architecture or client-owned mock state.
  - Copy the legacy DOM/CSS one-to-one.
  - Redesign the product IA beyond the parity scope requested here.
  - Change the sidecar/runtime architecture or Codex transport model.

## Decisions
- Decision: Define parity as both functional and visual parity with the legacy control center template.
  - Why: The missing value is not just buttons or tabs; it is the operator-console shape and density that made the original template useful.
- Decision: Preserve the current real app architecture and treat the legacy template as a UX and information-architecture reference only.
  - Why: The goal is to close UI gaps without regressing backend-owned state and runtime boundaries.
- Decision: Keep the desktop operator console as the primary visual reference, with responsive adaptation as a secondary concern.
  - Why: The legacy control center was desktop-first and the operator workflow is still optimized for high-density desktop use.
- Decision: Restore parity surfaces explicitly instead of hoping the current generic cards can absorb them incrementally.
  - Why: The missing shell structure is concrete: topbar controls, ribbon, side rail, inspector, queue, detail workspace, and action rows.
- Decision: Reuse existing backend detail data for `traceability`, `gaps`, `git`, and `chief` where already present; add new backend-fed summaries only for surfaces the current API does not expose well enough.
  - Why: Much of the parity gap is frontend omission rather than missing domain data.
- Decision: Keep new foundation-only capabilities visible after parity work, even when the legacy template did not include them.
  - Why: Parity should be additive over the real app foundation, not a regression to the prototype's exact feature set.

## Risks / Trade-offs
- UI parity can expand into uncontrolled redesign work.
  - Mitigation: scope the change to known legacy surfaces and action paths, not to new product ideas.
- Visual parity can be interpreted as pixel-perfect cloning.
  - Mitigation: define success as recognizable operator-console parity in structure, hierarchy, and density, not byte-for-byte CSS reproduction.
- Reintroducing legacy actions can create architectural regressions if the frontend starts owning workflow state again.
  - Mitigation: all restored surfaces must remain backend-fed and command-driven.
- Inspector, filter, and queue parity may require additional backend summary data.
  - Mitigation: extend query endpoints narrowly and only when the UI cannot derive the needed summaries from existing payloads.
- Restoring dense desktop layout can hurt smaller screens if copied blindly.
  - Mitigation: preserve desktop-first density while keeping smaller breakpoints usable rather than identical.

## Migration Plan
1. Capture a parity baseline from the legacy template and map each missing surface to the current React shell.
2. Extend backend-fed UI contracts for parity summaries only where current payloads are insufficient.
3. Restore the topbar, hero ribbon, view rail, filters, queue header actions, and inspector panel.
4. Restore the full detail workspace tabs and action row.
5. Reconcile `Run Studio` entrypoints and transitions with the legacy operator workflow.
6. Apply visual parity refinements to layout, hierarchy, and density.
7. Verify parity through e2e flows and visual/manual comparison against the legacy template.

## Open Questions
- None blocking. Assumption: visual parity means recognizable operator-console parity on desktop, not a strict pixel-perfect clone of the static template.
