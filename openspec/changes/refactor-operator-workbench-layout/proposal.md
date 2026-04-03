# Change: Refactor operator workbench layout

## Why
The current operator workbench splits the selected-change flow across an inspector column and a separate lower detail workspace. That forces the operator to re-orient after selection, duplicates context, and makes the always-visible run studio compete with the primary change workflow.

## What Changes
- Refactor the desktop operator workbench so the selected change detail becomes the primary right-hand workspace adjacent to the queue.
- Demote the standalone inspector surface from the primary desktop shell and move its useful summary signals into the contextual change workspace.
- Make run studio contextual to the selected change and selected run instead of a permanently competing surface.
- Update compact-viewport behavior, automated proofs, and platform documentation to match the new workbench contract.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/platform/shells/*`, `web/src/platform/workbench/*`, `web/src/components/*`, `web/e2e/*`
