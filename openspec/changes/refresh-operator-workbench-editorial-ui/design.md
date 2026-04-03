## Context
The current shell uses the same soft card treatment for almost every layer: top summary, navigation, queue, detail, and run inspection. That flattens visual hierarchy and creates an "everything is equally important" feel. Queue rows also read more like stacked content cards than an operational worklist.

## Goals
- Establish one dominant action surface for the selected change.
- Make supporting surfaces quieter and easier to scan.
- Preserve the existing queue/detail/run workflow model and route-addressable state.
- Keep the shell light, trustworthy, and editorial rather than dashboard-like.

## Non-Goals
- No backend or API changes.
- No new product features such as pagination or saved filters.
- No change to compact-view drawer semantics.

## Decisions
- Decision: Shift to a restrained editorial visual system.
  - Use a single light neutral base with one dark accent.
  - Restrict semantic colors to state signaling and destructive affordances.

- Decision: Reduce card repetition instead of adding more ornamental variation.
  - The redesign should remove visual containers where possible, not swap one decorative container for another.

- Decision: Treat queue as a worklist first and a card stack second.
  - Rows stay clickable and responsive, but visual density should favor scanning over decoration.

- Decision: Demote run studio visually relative to change detail.
  - The run surface stays in-context, but it should feel like a drill-down tool rather than a second primary dashboard.

## Risks / Trade-offs
- Existing browser proofs that rely on visible labels or counts may need adjustment.
- A quieter UI can accidentally become too plain if hierarchy is removed without strengthening typography and spacing.

## Migration Plan
1. Introduce the editorial visual requirement in `operator-ui-platform`.
2. Refactor shell styling and light structural markup for header, status strip, rail, queue, detail workspace, and run studio.
3. Update browser proofs to validate the new presentation without changing workflow semantics.
