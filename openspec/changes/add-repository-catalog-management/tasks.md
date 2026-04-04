## 1. Backend contract
- [x] 1.1 Add a backend-owned repository catalog summary response that exposes canonical tenant metadata together with operator-relevant portfolio signals derived from store state.
- [x] 1.2 Keep tenant creation wired to the same canonical catalog contract so a newly created repository appears immediately in catalog management surfaces.
- [x] 1.3 Add backend tests for catalog summaries, empty-state repository entries, and duplicate repo-path failures.

## 2. Operator UI platform
- [x] 2.1 Extend route state and shared server-state orchestration with a repository catalog workspace mode that remains tenant-safe across reload and browser navigation.
- [x] 2.2 Implement a scan-optimized repository catalog list/profile surface using approved platform shells and foundations.
- [x] 2.3 Route `New repository` through one governed authoring flow shared by the header shortcut and the catalog workspace.
- [x] 2.4 Add compact-viewport behavior that keeps repository browsing readable and opens profile/actions through a platform-approved overlay path.

## 3. Verification
- [x] 3.1 Add Playwright coverage for entering catalog mode, creating a repository, selecting a repository, and returning to the queue for that repository.
- [x] 3.2 Add Playwright coverage for route restoration and compact catalog behavior.
- [x] 3.3 Run `uv run pytest backend/tests -q`.
- [x] 3.4 Run `bash ./scripts/ccc verify ui-platform`.
