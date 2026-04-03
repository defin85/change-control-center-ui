## Context
The current operator shell already uses a calmer editorial direction, but the main desktop screen still spreads attention across the header, hero ribbon, rail, queue context, detail summary, and run studio. Queue rows also remain text-heavy when many changes share near-identical draft state, and the compact detail drawer still carries too much overview content in one long vertical surface.

## Goals
- Make the selected change feel like the obvious working surface without removing route-level context.
- Improve queue scanability on repetitive low-signal rows without adding pagination or hiding required data.
- Make the compact selected-change drawer shorter and more task-focused.
- Keep governance behavior fail-closed while removing internal platform-policy phrasing from operator-facing copy.

## Non-Goals
- No backend or API changes.
- No new product features such as saved filters, pagination, or alternate navigation modes.
- No change to route-addressable queue/change/run state.

## Decisions
- Decision: Collapse shell summaries into quieter inline context rather than multiple equal-weight cards.
  - This keeps repository and queue context visible while removing competition with the selected change.

- Decision: Consolidate queue signals instead of showing every summary field as a separate first-class column.
  - Draft-heavy rows need stronger differentiation through a small number of meaningful signals, not more repeated text.

- Decision: Use progressive disclosure inside compact detail overview.
  - Narrow viewports should expose the next action and key summary first, while deeper contract and memory detail remains available on demand.

- Decision: Keep governance fail-closed in behavior, but make the copy product-facing.
  - The operator shell should describe what the user can do next, not explain internal repository governance mechanics.

## Risks / Trade-offs
- Existing browser proofs that expect exact queue headers, counts, or governance-note copy will need updates.
- Over-simplifying queue rows could hide too much context if the remaining visible signals are poorly chosen.
- Compact progressive disclosure must not make important detail impossible to reach with keyboard or assistive technology.

## Migration Plan
1. Update `operator-ui-platform` requirements for focused shell hierarchy, queue scanability, compact overview disclosure, and operator-facing governance copy.
2. Refactor workbench, queue, detail, run studio, and shared styles to reflect the tightened hierarchy.
3. Update Playwright proofs and rerun UI gates.
