## Context
`update-operator-workbench-operational-style` replaced the old editorial direction, but the shipped desktop workbench still does not structurally match the simple reference. The current shell is best described as a restyled version of the prior layout, not as a true reference-parity implementation.

The new change therefore treats the reference artifact in `legacy/references/operator-workbench` as the authoritative desktop queue-workspace layout. This is a breaking UI change because the current live shell hierarchy, DOM structure, section cadence, and proof surfaces are expected to change materially.

## Goals
- Make the default desktop queue workspace structurally match the simple reference rather than merely reusing some of its tokens.
- Remove the layered dashboard chrome that survived the earlier migration.
- Keep selected-change detail as the dominant paired work surface next to the queue.
- Preserve backend-owned workflow semantics, route restoration, compact accessibility, and required detail capabilities.
- Keep the reference artifact non-shipped while using it as the current visual authority.

## Non-Goals
- No new backend contract, owner-model, or runtime-transport changes.
- No new product analytics, dashboard widgets, or portfolio features beyond what is already required.
- No return of the reference artifact into the shipped application path.
- No attempt to preserve current DOM selectors or intermediate layout chrome as compatibility affordances.

## Decisions
- Decision: Treat the simple reference as authoritative, not inspirational.
  - The desktop queue workspace must match the reference section cadence and dominant surfaces closely enough that side-by-side comparison shows the same shell architecture.
  - Color or spacing similarity without structural parity is not sufficient.

- Decision: Replace the current queue-mode shell structure, not just its styling.
  - The canonical queue workspace may remove the current separate rail, hero-style summary band, queue context chip block, and other intermediate chrome layers.
  - Required information from those layers may survive only if it is re-expressed inside the reference-style sections.

- Decision: Preserve workflow capability while simplifying presentation.
  - Required actions, tabs, run studio, and fail-closed states remain mandatory.
  - Those capabilities must be subordinated to the simpler reference hierarchy instead of forcing the old dashboard structure to stay alive.

- Decision: Keep repository catalog and compact flows aligned, but secondary.
  - The default desktop queue workspace is the primary visual authority.
  - Catalog mode and compact drawers must inherit the same design language and simplification direction without blocking the main shell replacement.

- Decision: Accept selector and DOM churn as part of the breaking migration.
  - Browser proofs and platform selectors must be rewritten for the new canonical shell.
  - Preserving intermediate class names or section wrappers purely for test compatibility is not a goal.

## Risks / Trade-offs
- A stricter reference match can accidentally overfit to static sample markup.
  - Mitigation: keep backend-owned data and platform boundaries intact while replacing only the layout and visual hierarchy.

- Replacing the shell structure can break a large amount of Playwright coverage at once.
  - Mitigation: treat proof rewrites as part of the same change and anchor them to canonical surfaces, accessibility semantics, and workflow invariants instead of ephemeral class names.

- Simplifying the shell can hide useful context that currently lives in separate panels.
  - Mitigation: preserve the information, but fold it into quieter reference-parity sections or subordinate disclosure rather than deleting it blindly.

- Catalog mode can lag behind the queue-workspace rewrite and recreate dual-direction UI drift.
  - Mitigation: explicitly align catalog and compact variants in the same change, even if the desktop queue shell remains the main authority.

## Migration Plan
1. Replace the operator-ui-platform desktop shell contract so the reference artifact becomes the explicit authority for default queue-workspace composition.
2. Rebuild the live desktop queue shell around the reference section order and paired queue/detail stage.
3. Rework queue and detail components so they carry the same information in the simpler reference hierarchy.
4. Align catalog mode and compact flows to the same visual system without reintroducing old dashboard chrome.
5. Rewrite browser proofs and validate the new canonical shell through the repo-owned UI gates.
