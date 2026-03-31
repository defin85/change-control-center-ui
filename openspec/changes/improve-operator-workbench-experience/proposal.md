# Change: Improve operator workbench experience

## Why
The backend-served operator shell is now functionally complete enough to audit as a real product surface, and that audit exposed a separate class of defects from the currently pending integrity work:
- the narrow-viewport detail workspace behaves like a modal visually but not semantically, so focus can remain on background controls while the overlay is open;
- queue and detail tabular surfaces collapse into unlabeled vertical stacks on compact viewports, which preserves raw data but loses operator readability;
- action hierarchy is too flat, with duplicate `Run next step` entrypoints competing between the global header and the selected-change workspace;
- document language, shell copy, and basic form semantics are inconsistent enough to undermine accessibility polish on the backend-served path.

The active `update-operator-ui-state-integrity` proposal repairs state correctness, reconciliation, and command integrity. It explicitly does not take on broader experience, accessibility, or presentation cleanup. A separate change is needed so those concerns have an explicit contract instead of remaining informal audit notes.

## What Changes
- Extend the `operator-ui-platform` capability with explicit narrow-viewport dialog semantics for the selected-change detail workspace.
- Define a compact-view presentation contract for queue and detail tabular surfaces so data-heavy operator views adapt into labeled, readable structures rather than unlabeled column collapse.
- Define a contextual action-hierarchy contract so the selected-change workspace owns the primary next-step action and duplicate global entrypoints are visually demoted while a change is in focus.
- Define a locale-consistent shell semantics contract covering document language, default shell copy, and basic form-field metadata on the backend-served UI path.
- Add one implementation and verification plan for browser, accessibility, and platform-conformance proof of those experience requirements.

## Impact
- Affected specs: `operator-ui-platform`
- Related changes:
  - `add-operator-ui-platform-contract`
  - `update-operator-ui-state-integrity`
- Affected code:
  - `web/src/platform/shells/DetailWorkspaceShell.tsx`
  - `web/src/components/QueuePanel.tsx`
  - `web/src/components/DetailTabularSection.tsx`
  - `web/src/platform/workbench/WorkbenchHeader.tsx`
  - `web/src/components/ChangeDetail.tsx`
  - `web/src/styles.css`
  - `web/index.html`
  - `web/e2e/*`
