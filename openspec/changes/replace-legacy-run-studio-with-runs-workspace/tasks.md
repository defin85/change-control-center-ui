## 1. Specification
- [x] 1.1 Update `operator-ui-platform` so the canonical shell exposes a top-level `Runs` workspace, removes `legacyWorkbench=1`, and no longer depends on legacy `Run Studio` for primary run inspection.
- [x] 1.2 Update `application-foundation` so preserved operator workflows reflect `Runs` in the new canonical UI instead of legacy `Run Studio`.

## 2. Backend contracts
- [x] 2.1 Add a backend-owned tenant-scoped run list endpoint with newest-first ordering and linked change metadata for scanning.
- [x] 2.2 Add or update backend tests for run-list filtering, ordering, and change handoff fields.

## 3. Canonical UI
- [x] 3.1 Add `workspace=runs` to route-addressable operator navigation and top-level shell navigation.
- [x] 3.2 Build the new-UI runs workspace with attention-first default filtering and a selected run detail stage.
- [x] 3.3 Remove `legacyWorkbench=1` route handling, shipped fallback branching, and links into the deprecated shell.
- [x] 3.4 Make the canonical live operator shell the default product route.
- [x] 3.5 Rewire change-detail run handoff so canonical run inspection no longer depends on legacy `Run Studio`.

## 4. Verification
- [x] 4.1 Update browser proofs for default-route behavior, route restoration, runs workspace navigation, selected run handoff, removed legacy-route behavior, and fail-closed empty states.
- [x] 4.2 Run `bash ./scripts/ccc verify ui-platform`.
- [x] 4.3 Run `openspec validate replace-legacy-run-studio-with-runs-workspace --strict --no-interactive`.
