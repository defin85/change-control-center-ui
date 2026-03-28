# Change: Update UI to control center parity

## Why
The new application foundation is now structurally correct: it runs against a real backend, keeps product state server-owned, and integrates Codex through a dedicated sidecar. But the current React shell still falls short of the legacy control center template that originally validated the operator workflow.

Compared with the legacy template, the current UI is missing or under-represents several operator-critical surfaces:
- top-level search and global command placement,
- the saved-view and filter rail,
- the inspector panel,
- detail tabs for `Traceability`, `Gaps`, and `Git`,
- explicit detail actions such as `Open run studio`, `Escalate`, and `Mark blocked by spec`,
- the dense visual hierarchy and desktop-first operator-console layout of the original control center.

We need a focused follow-up change that brings the new UI to functional and visual parity with the old control center template without reverting to static prototype architecture or reintroducing client-owned truth.

## What Changes
- Bring the React operator shell to functional parity with the legacy control center template.
- Restore the missing operator surfaces: topbar controls, hero ribbon, view rail, filter controls, queue actions, inspector, and the full detail workspace.
- Restore the missing detail tabs and operator actions validated in the legacy template.
- Bring the new UI to visual parity with the legacy operator console on desktop: layout density, panel structure, hierarchy, and action placement.
- Extend backend-fed UI contracts only where required to support parity surfaces; keep backend-owned state and runtime boundaries unchanged.
- Preserve new foundation capabilities already introduced in the real app, including tenant scoping, backend-owned run lineage, and clarification flow.

## Impact
- Affected specs: `operator-ui-parity`
- Related specs: `application-foundation`
- Affected code: `web/src/*`, `web/e2e/*`, backend query/summary endpoints as needed, legacy reference files `index.html`, `styles.css`, and `app.js`
