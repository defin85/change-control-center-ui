# Change: Tighten operator workbench focus and compact flow

## Why
The editorial refresh improved the shell tone, but the current workbench still leaves too much competing chrome around the selected change. Queue scanning remains expensive on repetitive draft-heavy data, compact detail flow is still too long, and internal governance copy leaks implementation-policy language into the operator surface.

## What Changes
- Further reduce competing header, summary-strip, and queue-context weight so the selected change remains the dominant operator surface.
- Simplify queue scan density for repetitive draft-heavy work by consolidating row signals into a more focused worklist presentation.
- Shorten the compact selected-change workspace so narrow viewports feel like a focused operator sheet instead of a long audit document.
- Replace internal governance phrasing with operator-facing product copy while keeping fail-closed behavior intact.

## Impact
- Affected specs: `operator-ui-platform`
- Affected code: `web/src/platform/workbench/*`, `web/src/components/*`, `web/src/platform/shells/*`, `web/src/styles.css`, `web/e2e/*`
