# Change: Add repository catalog management

## Why
The current tenant/project experience is deliberately minimal: the workbench header exposes one `New project` dialog and one tenant select, while the main shell remains optimized for change-level execution. That is enough for a two-tenant seed dataset, but it breaks down once operators manage a broader portfolio of repositories:
- operators cannot scan repository load, recent activity, or blocked attention across tenants from one surface;
- repository switching is hidden inside a select control, so the system offers no readable catalog for comparing workspaces before changing context;
- project creation exists, but it is not framed as part of a governed catalog-management workflow;
- the backend already treats each repository/workspace as a tenant boundary, yet the UI does not expose that portfolio boundary as a first-class operator surface.

This proposal adds a dedicated repository catalog management flow without replacing the approved change-centric workbench. The default queue/detail path remains the main operational surface; the new catalog becomes the portfolio-level entry point for choosing which repository to work on next.

## What Changes
- Extend `application-foundation` with a backend-owned repository catalog summary contract derived from canonical tenant and change state.
- Extend `operator-ui-platform` with a route-addressable repository catalog workspace that sits alongside the existing queue/detail workbench instead of replacing it.
- Define a scan-optimized catalog list/profile layout for repository management, including search, empty-state handling, attention signals, and compact-viewport behavior.
- Move project creation into a governed catalog-management flow while preserving a lightweight header shortcut into the same authoring path.
- Keep tenant switching and catalog refresh inside the shared orchestration boundary so repository selection, queue state, and route state remain tenant-safe.

## Impact
- Affected specs:
  - `application-foundation`
  - `operator-ui-platform`
- Affected code:
  - `backend/app/main.py`
  - `backend/app/store.py`
  - `web/src/api.ts`
  - `web/src/types.ts`
  - `web/src/platform/contracts/schemas.ts`
  - `web/src/platform/navigation/operatorRouteState.ts`
  - `web/src/platform/server-state/useOperatorServerState.ts`
  - `web/src/platform/workbench/OperatorWorkbench.tsx`
  - `web/src/platform/workbench/WorkbenchHeader.tsx`
  - `web/src/components/*` or new catalog-specific platform/workbench surfaces
  - `web/e2e/*`
  - `backend/tests/*`
- Assumptions:
  - This change scopes repository catalog management to browse, search, select, and create flows.
  - Tenant metadata editing, tenant archival, and filesystem repository discovery are explicitly out of scope for this first pass.
