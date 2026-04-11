# Change: Add shell bootstrap and route-state controller

## Why
The backend already owns bootstrap, tenant, repository-catalog, queue, run-list, clarification, approval, and memory contracts. The shipped shell, however, has no shared state controller that can hydrate backend-owned data, normalize route state, or fail closed when bootstrap is unavailable.

Every later functional workspace depends on one authoritative shell controller. Without it, each UI slice would reintroduce ad hoc fetch logic and fragile URL handling.

## What Changes
- Add one shared backend-owned shell bootstrap controller for tenant, workspace, query, and selection state.
- Add one route-state controller for canonical workspace and query restoration, including stale-param normalization.
- Reintroduce shared Control API and contract usage into the functional shell foundation without reviving the removed legacy workbench.
- Keep failure modes explicit when bootstrap or route hydration cannot establish valid shell state.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Affected code: `web/src/App.tsx`, `web/src/platform/contracts/*`, `web/src/platform/navigation/*`, `web/src/platform/*`, `web/e2e/*`, `backend/tests/test_web_contract_boundary.py`
- Dependencies:
  - `01-rebaseline-operator-ui-platform-after-static-reset`
