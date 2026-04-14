# Change: Add change contract authoring and OpenSpec export

## Why
The current product can create a backend-owned change thread, ask clarifications, and launch runs, but it still cannot author a real change contract or materialize that thread into OpenSpec artifacts. That keeps the operator flow trapped in product-local draft state instead of reaching the repository's actual planning system.

To make a product test meaningful, the operator needs to shape a real change contract, export it into `openspec/changes/<change-id>/`, and keep that exported artifact lineage attached to the same change thread.

## What Changes
- Add backend-owned authoring for change contract fields such as goal, scope, acceptance criteria, and constraints.
- Add an explicit export workflow that generates initial OpenSpec artifacts from selected-change state.
- Persist export status, artifact paths, and conflict information on the originating change thread.
- Surface contract authoring and export through the shipped selected-change workspace with explicit pending, validation, and conflict states.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Affected code: `backend/app/*`, `backend/tests/*`, `web/src/platform/*`, `web/src/reference/*`, `web/e2e/*`
- Dependencies:
  - `10-harden-functional-shell-proof-pack`

