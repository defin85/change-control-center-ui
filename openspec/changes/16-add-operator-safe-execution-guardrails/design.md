## Context
The shipped foundation can launch runs and is moving toward repo-bound execution, but it still lacks explicit safety policy around where execution may happen and which actions are too risky to run silently. Product testing on real repositories requires a policy layer that explains and blocks unsafe behavior before runtime starts.

## Goals / Non-Goals
- Goals:
  - Make execution policy backend-owned and auditable.
  - Reject unsafe repo, path, and operation combinations before work begins.
  - Surface guardrail outcomes clearly in the operator shell.
- Non-Goals:
  - Full multi-user authorization or tenant role management.
  - Remote secret management or enterprise policy distribution.

## Decisions
- Decision: treat repo boundary, worktree safety, and destructive-operation gating as backend-owned policy rather than UI hints.
  - Alternatives considered: browser-side warnings only; rejected because they are bypassable and not auditable.
- Decision: blocked actions fail before runtime launch or filesystem mutation.
  - Alternatives considered: start the run and ask the sidecar to self-police; rejected because partial side effects could already occur.
- Decision: guarded approvals and denials are stored as audit events on the same change or run lineage.
  - Alternatives considered: write only to process logs; rejected because product review needs queryable audit state.

## Risks / Trade-offs
- Stricter policy will block some convenient local experiments.
- Policy drift between backend and sidecar boundaries could create confusing failures if not source-tested aggressively.

## Migration Plan
1. Define canonical execution-policy inputs and outcomes.
2. Enforce policy before worktree allocation and runtime launch.
3. Surface the resulting blocked, guarded, and approved states through shell workflows.
4. Add audit and verification coverage for denied and approved paths.

## Open Questions
- Which operations need explicit approval versus unconditional blocking in the first rollout.
- Whether policy should be global, tenant-scoped, or both for the initial product-test phase.

