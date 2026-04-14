# Change: Add operator-safe execution guardrails

## Why
Repo-bound execution is necessary for a real product test, but it also raises the cost of mistakes. Without explicit guardrails, a local or internal dogfood session could target the wrong repository, run outside the allowed path boundary, or perform risky filesystem or git operations with only generic runtime failures as feedback.

Before this product can be trusted on non-disposable repositories, execution policy needs to be backend-owned, fail closed, and visible to the operator.

## What Changes
- Define backend-owned execution policy for allowed repo boundaries, managed worktrees, and blocked destructive operations.
- Enforce that policy at worktree lifecycle, runtime launch, and follow-up action boundaries.
- Surface guardrail state, blocked reasons, and approval requirements through the functional shell.
- Persist audit events for guarded approvals, denials, and blocked attempts.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Affected code: `backend/app/*`, `backend/sidecar/*`, `backend/tests/*`, `web/src/platform/*`, `web/src/reference/*`, `web/e2e/*`
- Dependencies:
  - `12-add-repo-bound-run-context-and-worktree-lifecycle`
  - `13-add-real-runtime-output-and-git-evidence-ingestion`

