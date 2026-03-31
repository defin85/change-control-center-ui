## Context
The repository already has one pending change that defines the operator UI platform contract and another pending change that repairs runtime and state-integrity defects inside the shipped workbench. The remaining gaps from the latest backend-served UI audit are experience-level failures: the mobile detail overlay is not a real dialog, compact layouts preserve data but not readability, the same next-step action competes from multiple locations, and locale/semantics polish is inconsistent at the document and form boundary.

This proposal keeps the current IA (`Control Queue`, `Change Detail`, `Run Studio`, `Chief`) and the approved frontend stack. It only tightens how that IA must behave and present itself so the operator path is usable and accessible once the platform and integrity changes land.

## Goals / Non-Goals
- Goals:
  - Make narrow-viewport detail workflows behave like real modal/drawer interactions rather than visual overlays only.
  - Preserve operator readability for queue and detail data on compact viewports.
  - Make the current change's next-step action obvious instead of competing with duplicate global triggers.
  - Align shell language and form semantics with one coherent locale contract on the backend-served path.
- Non-Goals:
  - Replacing the approved UI platform stack, page shells, or backend-owned truth model.
  - Reopening the broader state-integrity fixes already covered by `update-operator-ui-state-integrity`.
  - Performing a full visual redesign or brand refresh of the workbench.
  - Introducing a full localization framework in the same step.

## Decisions
- Decision: Narrow-viewport detail workspace is a true modal/drawer interaction.
  - When the selected-change workspace opens on a compact viewport, it must expose dialog semantics, move focus into the active workspace, keep background content inert or hidden from assistive tech, and provide an explicit close path.

- Decision: Data-heavy surfaces adapt presentation, not just grid geometry.
  - Queue rows and detail tables may keep desktop tabular layouts on wide screens, but compact layouts must render rows as labeled stacks/cards or another equally readable representation that preserves field names next to values.

- Decision: Selected-change context owns the primary action.
  - When a change is selected, the detail workspace is the primary execution surface for that change.
  - Duplicate global actions may remain available, but they must be visually secondary or otherwise demoted so they do not compete with the selected-change action path.

- Decision: Locale consistency is a shell contract.
  - The backend-served operator shell needs one coherent default locale contract covering document `lang`, operator-visible copy, and baseline form-field semantics.
  - This change does not require a multi-locale system; it only forbids a mixed default shell.

- Decision: Experience fixes stay structural and testable.
  - The change focuses on semantics, hierarchy, and responsive behavior that can be proven in browser tests.
  - Subjective visual restyling only belongs here when it directly supports those structural outcomes.

## Risks / Trade-offs
- Responsive readable row layouts can increase implementation branching across queue and detail surfaces.
  - Mitigation: keep the layout switch inside shared platform or feature presentation boundaries rather than per-cell one-offs.

- Real dialog semantics on mobile can intersect with the pending integrity change because both touch detail-workspace behavior.
  - Mitigation: keep ownership clear: this change owns semantics, focus, and presentation; integrity work owns data reconciliation and command correctness.

- Action demotion can be perceived as removing global convenience if it is implemented too aggressively.
  - Mitigation: require demotion, not removal, and keep the spec focused on hierarchy rather than one exact button placement.

## Migration Plan
1. Land detail-workspace dialog semantics and compact-view rendering primitives first, because they define the accessibility baseline.
2. Rework queue and detail data presentation on compact viewports using those approved primitives.
3. Adjust global-vs-contextual action hierarchy and reduce duplicate competition in the selected-change flow.
4. Align document language, shell copy, and form semantics, then prove the behavior with browser and platform tests.

## Open Questions
- None at proposal time. The audit findings are concrete enough to define the experience contract without reopening product scope.
