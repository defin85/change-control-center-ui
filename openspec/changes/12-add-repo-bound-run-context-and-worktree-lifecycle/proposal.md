# Change: Add repo-bound run context and worktree lifecycle

## Why
The current runtime path can launch a run through the backend and sidecar, but it still does so without a real repository execution context. `repoPath` exists on tenants, while runtime launch only carries memory packet and run kind, so product tests cannot prove that execution happens inside a managed repository workspace.

To support a real process test, every run needs an explicit repo-root and worktree context, plus deterministic worktree lifecycle rules that the backend owns instead of synthesizing as placeholder strings.

## What Changes
- Extend the backend-to-sidecar runtime contract with repo-root, worktree, and execution-cwd metadata.
- Add backend-owned worktree creation, reuse, and teardown policy per change.
- Validate tenant repo boundaries and fail closed before runtime launch when execution context is unsafe or unavailable.
- Persist real worktree lineage into backend-owned change and run state.

## Impact
- Affected specs: `application-foundation`
- Affected code: `backend/runtime_contracts.py`, `backend/app/*`, `backend/sidecar/*`, `backend/tests/*`
- Dependencies:
  - `10-harden-functional-shell-proof-pack`

