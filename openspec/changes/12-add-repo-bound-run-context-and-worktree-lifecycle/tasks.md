## 1. Repo-Bound Runtime Context
- [ ] 1.1 Extend the runtime contract with tenant repo root, resolved worktree path, and execution cwd for repo-bound runs.
- [ ] 1.2 Validate tenant repo boundaries and reject unsafe or unavailable execution context before runtime launch.

## 2. Worktree Lifecycle
- [ ] 2.1 Add deterministic worktree creation, reuse, and branch naming behavior per change and persist that lifecycle in backend-owned state.
- [ ] 2.2 Add explicit cleanup or reset semantics for stale worktrees so local product tests do not rely on manual filesystem cleanup.

## 3. Proof
- [ ] 3.1 Add runtime adapter and backend contract coverage for repo-bound execution context and worktree failure handling.
- [ ] 3.2 Run `openspec validate 12-add-repo-bound-run-context-and-worktree-lifecycle --strict --no-interactive`.

