# Change: Ship static reference preview as default shell

## Why
The repository no longer ships a live-data simple-reference workbench on the default route. Instead, the default application entrypoint now renders the exact copied simple reference as a static preview page, while the prior live operator workbench remains available only behind a hidden `legacyWorkbench=1` flag.

The existing change text is therefore inaccurate:
- it claims the default route is a live-data shell;
- it claims workflow surfaces remain available under the default simple-reference shell;
- it marks browser-proof rewrites complete even though the shipped default route is now a static preview.

This change records the factual shipped state so OpenSpec stops describing a different product than the codebase currently serves.

## What Changes
- **BREAKING** make the exact copied simple reference the default backend-served shell, even though it is a static preview rather than a live-data workbench.
- **BREAKING** keep the current `OperatorWorkbench` only behind a hidden internal fallback flag for real workflow access.
- **BREAKING** define the default route as reference-preview DOM rather than as a backend-hydrated operator workbench.
- Treat the static default route and the hidden legacy workbench as two explicit shipped paths with different responsibilities instead of pretending one shell currently does both jobs.

## Impact
- Affected specs:
  - `operator-ui-platform`
- Affected code:
  - `web/src/App.tsx`
  - `web/src/reference/*`
  - `web/src/platform/navigation/*`
  - `web/src/platform/workbench/OperatorWorkbench.tsx`
- Assumptions:
  - This change records the current shipped behavior; it does not argue that the current shipped behavior is the final product direction.
  - Follow-up changes can still replace the static default route with a real shipped workspace later.
