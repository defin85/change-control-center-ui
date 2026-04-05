# Change: Ship simple reference as default workbench

## Why
The current shipped operator workbench remains a product-specific composition that only borrows parts of the simple reference. Even after the earlier shell migration, the default experience still reads as a custom dashboard rather than as the literal simple reference that stakeholders use as the source of truth.

That mismatch is now product debt:
- contributors still see two UI directions, one shipped and one reference;
- acceptance discussions keep comparing the live shell against the simple reference and finding structural drift;
- future UI work will remain ambiguous until one direction becomes canonical.

This change intentionally supersedes the current default shell direction. The existing `OperatorWorkbench` becomes a deprecated legacy fallback, and the shipped default application entrypoint moves to a live-data implementation of the simple reference.

## What Changes
- **BREAKING** make the simple reference the shipped default operator shell instead of keeping it as reference-only guidance.
- **BREAKING** mark the current `OperatorWorkbench` as deprecated and remove it from the canonical default route, while keeping it behind a hidden internal fallback flag for short-term continuity.
- **BREAKING** replace canonical DOM structure, browser-proof surfaces, and selector assumptions with the literal simple-reference section cadence.
- Keep backend-owned route state, queue/detail context, fail-closed actions, run studio, clarifications, and required workflow tabs, but subordinate them under the simple-reference hierarchy.
- Align repository catalog mode to the same visual system so the new default shell does not coexist with an older dashboard-style catalog.

## Impact
- Affected specs:
  - `operator-ui-platform`
- Affected code:
  - `web/src/App.tsx`
  - `web/src/platform/navigation/*`
  - `web/src/platform/workbench/*`
  - `web/src/components/QueuePanel.tsx`
  - `web/src/components/ChangeDetail.tsx`
  - `web/src/components/RunStudio.tsx`
  - `web/src/styles.css`
  - `web/e2e/*`
- Assumptions:
  - The backend data contract remains authoritative and does not need a new transport or owner-model change.
  - The hidden legacy shell is temporary and non-canonical; smoke and platform proofs must target the new default shell only.
