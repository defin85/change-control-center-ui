## Context
The shipped shell can launch runs through the backend and sidecar, but the runtime contract still lacks repository execution context. Change git metadata is mostly placeholder state, so the system cannot yet prove that a run executed inside the tenant repository it claims to manage.

## Goals / Non-Goals
- Goals:
  - Bind every repo-backed run to an explicit repo root and managed worktree.
  - Keep worktree lifecycle backend-owned and deterministic.
  - Reject unsafe repo or path conditions before runtime launch.
- Non-Goals:
  - Full git evidence ingestion from completed runs.
  - Acceptance or review workflows driven by real findings.

## Decisions
- Decision: extend the runtime contract with repo-root, worktree-path, branch, and execution-cwd metadata.
  - Alternatives considered: infer cwd from sidecar process state; rejected because it is implicit and hard to audit.
- Decision: backend owns worktree allocation and validation before the sidecar starts runtime execution.
  - Alternatives considered: let the sidecar create worktrees; rejected because product state and filesystem state would diverge across boundaries.
- Decision: worktree reset remains explicit rather than automatic on every run.
  - Alternatives considered: recreate the worktree for every run; rejected because it increases churn and weakens iterative product testing.

## Risks / Trade-offs
- Git worktree management introduces platform-specific failure modes around missing repos, dirty state, and concurrent use.
- Strict path validation can block previously permissive local experiments, but that is preferable to silent execution in the wrong repository.

## Migration Plan
1. Extend persisted run and change state with canonical repo-bound execution metadata.
2. Add backend validation and worktree allocation before runtime launch.
3. Pass the resolved execution context through the sidecar boundary.
4. Add reset or cleanup support for stale local product-test worktrees.

## Open Questions
- Whether cleanup should prune only worktree directories or also remove orphaned branches.
- Whether one change should allow multiple concurrent worktrees or stay single-worktree for the first rollout.

