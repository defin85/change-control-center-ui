## Context
`replace-operator-workbench-with-reference-layout` made the simple reference authoritative in intent, but the shipped implementation still centered its own workbench composition. The product needs a harder decision: the simple reference becomes the actual shipped shell, and the existing live shell becomes deprecated compatibility code.

This is a breaking UI migration because the default route, canonical DOM surfaces, and browser-proof expectations all move to a new shell architecture. The current workbench remains available only behind a hidden route flag so operators and contributors can temporarily compare behavior while the new shell settles.

## Goals
- Ship the simple reference as the default backend-served operator shell.
- Keep all workflow-critical capabilities available from the new shell without preserving the old dashboard hierarchy.
- Preserve route-addressable context and backend-owned truth across the new default shell and the hidden legacy fallback.
- Align repository catalog mode with the same visual system.
- Remove the old shell from canonical acceptance and smoke evidence.

## Non-Goals
- No new backend entity model, transport, or realtime architecture change.
- No attempt to preserve current DOM wrappers or selector compatibility in the default shell.
- No product-visible toggle between new and old shells.
- No return to static preview data; the shipped shell must read live backend state only.

## Decisions
- Decision: The simple reference is now a shipped product shell, not just a design authority.
  - The default route renders a live-data implementation that follows the literal section cadence and dominant surfaces of `legacy/references/operator-workbench`.
  - Differences are limited to backend-owned data, required workflow affordances, and approved accessibility/runtime adjustments.

- Decision: The current `OperatorWorkbench` is deprecated, not deleted immediately.
  - The old shell stays available only behind a hidden route-state flag such as `legacyWorkbench=1`.
  - The hidden fallback is excluded from canonical UI proofs and from visible navigation.

- Decision: Workflow affordances remain mandatory but subordinate.
  - The default selected-change stage follows the simple reference first: summary, timeline, action cluster, and operational note.
  - Heavy workflow surfaces such as tabular detail, run studio, evidence inspection, and clarification authoring remain below or behind the primary simple-reference stage instead of forcing the old equal-weight dashboard back into view.

- Decision: Repository catalog must inherit the same system.
  - Catalog mode reuses the same header, section, card, and compact-drawer language.
  - The new default UI cannot pair a simple-reference queue shell with a legacy dashboard-style catalog.

- Decision: Route-addressable hidden fallback is part of the migration contract.
  - The route layer preserves an internal legacy-shell flag so reload and browser history keep the same shell when explicitly requested.
  - The default route never sets that flag itself.

## Risks / Trade-offs
- Literal reference adoption can underfit complex workflow surfaces.
  - Mitigation: keep the reference dominant only at the shell level; preserve deep workflow capability through subordinate sections and drawers.

- Keeping a hidden fallback can prolong legacy code.
  - Mitigation: explicitly mark it deprecated in code and spec, remove it from canonical tests, and keep the new default shell as the only supported product direction.

- Proof churn will be large because DOM surfaces change.
  - Mitigation: rewrite Playwright assertions against accessibility semantics and new canonical section anchors rather than low-level class names.

## Migration Plan
1. Add a breaking `operator-ui-platform` delta that makes the shipped default route render the simple reference and demotes the current workbench to a hidden legacy fallback.
2. Extend route state so the hidden fallback can persist across reload/history without becoming a visible product toggle.
3. Implement a new shipped simple-reference workbench that maps live backend state into the reference section cadence.
4. Reposition queue/detail/catalog workflow surfaces so required capabilities remain available under the new shell without recreating the old dashboard.
5. Rewrite browser proofs and verify only the new default shell as canonical behavior.
