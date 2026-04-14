# Change: Add real runtime output and git evidence ingestion

## Why
The current backend persists real run lineage and runtime events, but much of the resulting change, git, and evidence state is still synthesized by backend transition logic. That makes the shell look functional without yet proving that it can explain what actually happened in the repository.

To support a real product test, completed runs need to produce backend-owned evidence from actual runtime completion data and managed-worktree git state, not only placeholder summaries.

## What Changes
- Normalize real runtime completion data into persisted run outcome and summary state.
- Collect git status, diff, and check artifacts from managed worktrees and store them as backend-owned evidence.
- Replace synthetic post-run placeholders with change and run state derived from ingested runtime and git artifacts.
- Surface ingested evidence and git state through selected-change and run-detail contracts.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Affected code: `backend/app/*`, `backend/sidecar/*`, `backend/tests/*`, `web/src/reference/*`, `web/e2e/*`
- Dependencies:
  - `12-add-repo-bound-run-context-and-worktree-lifecycle`

