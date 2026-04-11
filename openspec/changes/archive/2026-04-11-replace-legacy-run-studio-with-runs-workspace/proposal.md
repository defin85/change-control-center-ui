# Change: Replace legacy Run Studio with Runs workspace

## Why
Run-focused inspection currently depends on the deprecated `legacyWorkbench=1` path and the old `Run Studio` surface. That blocks the migration to the new canonical UI, leaves operators without a first-class run workspace in the shipped shell, and keeps the product split across supported and unsupported shell paths.

## What Changes
- **BREAKING** add a canonical tenant-scoped `Runs` workspace to the new operator UI.
- **BREAKING** remove the deprecated `legacyWorkbench=1` route and any shipped fallback that renders the old workbench.
- **BREAKING** retire legacy `Run Studio` as the user-facing run surface and replace it with new-UI run inspection and change handoff flows.
- **BREAKING** make the canonical live operator shell the default product route.
- Add a backend-owned run-list contract for scan-first run operations in the canonical shell.
- Preserve change-local run history in change detail while making top-level `Runs` the cross-change operational entrypoint inside the selected tenant.

## Impact
- Affected specs: `operator-ui-platform`, `application-foundation`
- Affected code: `web/src/App.tsx`, `web/src/platform/navigation/operatorRouteState.ts`, `web/src/platform/server-state/useOperatorServerState.ts`, `web/src/platform/workbench/*`, `web/src/reference/*`, `backend/app/main.py`, `backend/app/store.py`, `backend/tests/*`, `web/e2e/*`
