# Change: Add operator web architecture

## Why
The current React operator UI proves that backend-owned change state, runtime lineage, and clarification flows can render through the new application stack. But the frontend orchestration is still concentrated in a single root component: [web/src/App.tsx](/home/egor/code/change-control-center-ui/web/src/App.tsx) currently owns bootstrap loading, queue filtering, selection state, detail fetching, run-detail fetching, websocket refresh, mutation flows, and toast/error handling in one place.

That shape was acceptable for the first foundation pass, but it will not scale cleanly into the already-open `update-ui-to-control-center-parity` change. The parity work adds more operator surfaces, filters, detail states, and context transitions. If we continue extending the current root-component pattern, we will grow a larger client-owned orchestration layer and make backend-owned truth harder to preserve.

We also reviewed a comparable Vite/React operator dashboard that keeps the app shell thin, centralizes HTTP contract handling, separates server state from client UI state, and persists operator context in URL-addressable state. Those patterns are directly relevant here and should be captured as a separate architectural change before or alongside parity implementation.

## What Changes
- Define a separate frontend application-architecture capability for the React operator UI.
- Define a route-aware operator shell that preserves selected tenant, queue context, selected change, selected run, and workspace transitions across reload and back/forward navigation.
- Define a shared web contract boundary for request execution, response validation, error normalization, and transport/auth failure handling.
- Define a shared server-state orchestration model for queue, change detail, run detail, approvals, and clarification surfaces so backend-owned entities are not mirrored ad hoc in the root component.
- Define feature-level composition boundaries that keep the root app shell thin and move queue, detail, run studio, and clarification logic behind focused modules.
- Define a shared realtime subscription boundary for tenant events so live updates reconcile through one cache/update path instead of chained fetch logic inside the root shell.
- Preserve current operator IA and backend-owned truth. This change does not replace or broaden the visible parity scope already described in `update-ui-to-control-center-parity`.

## Impact
- Affected specs: `operator-web-architecture`
- Related changes: `update-ui-to-control-center-parity`, `replace-legacy-template-with-app-foundation`
- Affected code: `web/src/App.tsx`, `web/src/api.ts`, `web/src/components/*`, `web/src/types.ts`, `web/package.json`, `web/e2e/*`, and backend query contracts only where new frontend seams reveal missing normalized projections
