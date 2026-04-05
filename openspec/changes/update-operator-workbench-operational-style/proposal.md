# Change: Update operator workbench operational style

## Why
The default operator shell and the codex-lb-inspired static sample now describe two different UI directions. Keeping the warm editorial shell alive while introducing the operational sample as a side path creates unnecessary drift:
- the backend-served default shell still presents an editorial visual contract that is no longer the intended product direction;
- the codex-lb-inspired sample has already validated the target operational tone, density, and scan-first framing;
- trying to preserve both directions would keep two competing UI contracts in the same product surface.

This change intentionally replaces the legacy editorial operator shell with the codex-lb-inspired operational style as the only supported canonical workbench UI. The rollout is allowed to be a breaking UI change, but it must preserve the approved backend-owned workflow model, route-addressable state, fail-closed interactions, and platform-owned composition boundaries.

## What Changes
- Replace the editorial operator-shell visual contract in `operator-ui-platform` with a codex-lb-inspired operational workbench contract.
- Rewrite the default backend-served shell chrome, queue, repository context, selected-change workspace, and run-inspection surfaces into one canonical operational visual system.
- Retire the preview-only shell path and legacy editorial styling once the live workbench becomes the canonical operational shell.
- Rewrite affected browser proofs so they validate the new canonical shell rather than preserving legacy presentation affordances.

## Impact
- Affected specs:
  - `operator-ui-platform`
- Affected code:
  - `web/src/App.tsx`
  - `web/src/styles.css`
  - `web/src/platform/workbench/*`
  - `web/src/platform/shells/*`
  - `web/src/components/*`
  - `web/e2e/*`
- Assumptions:
  - Breaking visual, structural, and selector-level UI changes are allowed for the operator shell in this change.
  - Backend and Control API contracts do not change.
  - The architectural invariants that remain mandatory are backend-owned state, route-addressable operator context, fail-closed command handling, compact-viewport accessibility, and composition through `web/src/platform/*`.
