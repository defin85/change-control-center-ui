# Change: Refresh operator workbench editorial UI

## Why
The operator shell currently feels visually noisy and overly card-driven. Important workflow surfaces compete with summary strips, helper cards, and dense decorative treatments, which makes the UI feel less trustworthy and harder to scan during real operator work.

## What Changes
- Rework the operator visual system into a quieter editorial-style interface with clearer hierarchy.
- Reduce card repetition and decorative weight across the status strip, rail, queue, detail workspace, and run studio.
- Keep the current backend-owned workflow intact while changing the presentation and emphasis of existing surfaces.
- Update browser proofs to cover the redesigned shell without weakening workflow guarantees.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/platform/workbench/*`, `web/src/components/*`, `web/src/platform/shells/*`, `web/src/styles.css`, `web/e2e/*`
