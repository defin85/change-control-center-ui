# Change: Replace operator workbench with reference layout

## Why
The shipped workbench still does not match the simple reference in `legacy/references/operator-workbench`. The current implementation moved the product toward a lighter operational look, but it kept the previous layered shell structure:
- a separate masthead and summary band;
- a permanent rail-style repository context;
- a queue panel with extra context chips and governance chrome;
- a heavy detail workspace that still reads like a dashboard rather than the focused paired stage shown in the reference.

That means the product now has a partial visual migration instead of a true shell replacement. The result is misleading for operators and for future contributors: the reference says one thing, while the shipped UI still behaves like the older layout with different colors.

This follow-up change is intentionally a breaking UI replacement. It treats the simple reference as the authoritative layout target for the default desktop queue workspace and replaces the current half-migrated shell rather than polishing it further.

## What Changes
- **BREAKING** replace the current default desktop queue-workspace layout with a reference-parity shell derived from `legacy/references/operator-workbench`.
- **BREAKING** remove the current layered chrome pattern from the canonical queue workspace, including separate rail/dashboard-like summary structure, and fold required context into the reference-style page flow.
- **BREAKING** rewrite DOM structure, selectors, and browser-proof assumptions for the new canonical shell.
- Preserve backend-owned data, route-addressable operator context, compact-viewport accessibility, fail-closed actions, and required workflow surfaces while adapting them into the simpler reference composition.
- Keep the reference preview outside the shipped app path as a non-product artifact.

## Impact
- Affected specs:
  - `operator-ui-platform`
- Affected code:
  - `web/src/platform/workbench/WorkbenchHeader.tsx`
  - `web/src/platform/workbench/WorkbenchStatusStrip.tsx`
  - `web/src/platform/workbench/OperatorWorkbench.tsx`
  - `web/src/components/QueuePanel.tsx`
  - `web/src/components/ChangeDetail.tsx`
  - `web/src/components/RunStudio.tsx`
  - `web/src/platform/shells/*`
  - `web/src/styles.css`
  - `web/e2e/*`
  - `legacy/references/operator-workbench/*`
- Assumptions:
  - This change is UI-breaking by design and may remove current DOM hierarchy, class hooks, and selector affordances tied to the half-migrated shell.
  - The canonical backend `owner` contract and backend-owned workflow model from `update-operator-workbench-operational-style` remain valid and do not need another contract rewrite here.
  - The default desktop queue workspace is the primary migration target; repository catalog and compact flows stay supported but must align visually with the same simpler system rather than preserving the old dashboard chrome.
