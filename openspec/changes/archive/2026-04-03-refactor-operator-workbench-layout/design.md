## Context
The operator UI currently presents:
- a left rail for views and filters,
- a queue column,
- a standalone inspector column,
- and a separate detail workspace section rendered below the main workbench on desktop.

This layout creates two competing "selected change" surfaces. The inspector summarizes the active change, but all meaningful actions live in a detached detail workspace. Run studio also stays visible as a sibling panel even when no run is selected, which dilutes focus further.

## Goals
- Make change detail the primary desktop action surface once a change is selected.
- Keep queue context visible while eliminating the duplicated inspector/detail split.
- Preserve route-addressable selected change, selected run, and active tab state.
- Keep compact-viewport drawer semantics intact.

## Non-Goals
- Rework backend APIs or queue data semantics beyond what the new surface needs.
- Introduce a second operator route or modal stack for run inspection.
- Redesign the left navigation taxonomy.

## Decisions
- Decision: Use a three-pane desktop composition of rail, queue, and contextual workspace.
  - Why: this keeps queue and selected change adjacent and removes the current vertical context jump.
  - Alternative considered: keep inspector and collapse the lower workspace. Rejected because it still duplicates selected-change context and wastes width on summary-only content.

- Decision: Fold the most useful inspector signals into the contextual change workspace header/overview.
  - Why: state, next action, blocker, traceability, and chief policy are all selection-scoped facts and belong next to the actionable detail surface.

- Decision: Make run studio conditional inside the contextual workspace.
  - Why: when no run is selected, a permanently visible run-inspection panel becomes noise. The selected change should remain the dominant surface until the operator explicitly pivots into run inspection.
  - Implementation direction: keep run state route-addressable, but reveal run studio only when a run is selected or the operator explicitly opens it from change detail.

- Decision: Preserve compact-viewport drawer behavior.
  - Why: mobile and tablet interaction still need a dialog-style selected-change workspace with focus containment and explicit close behavior.

## Risks / Trade-offs
- Tests that currently assert inspector presence and a permanent empty run studio will need to be rewritten.
- The change detail surface will carry more summary content, so the header and overview need careful hierarchy to avoid becoming a wall of cards.

## Migration Plan
1. Update the OpenSpec operator workbench requirement to remove the standalone inspector from the required desktop shell.
2. Refactor platform shells so desktop uses one contextual workspace pane instead of a lower detached detail stage.
3. Merge inspector-only summary signals into the selected-change workspace.
4. Make run studio conditional and update browser proofs.
