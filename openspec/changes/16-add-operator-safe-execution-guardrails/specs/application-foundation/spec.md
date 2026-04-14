## ADDED Requirements
### Requirement: Fail-Closed Execution Guardrails For Repo-Bound Runs
The system SHALL enforce backend-owned execution guardrails before repo-bound runs or filesystem-affecting actions start.

#### Scenario: Requested execution violates policy
- **WHEN** a run or follow-up action targets a repo, path, or operation outside the configured safe policy
- **THEN** the backend rejects the action before runtime execution begins
- **AND** no partial worktree or runtime session is created
- **AND** the rejection reason is stored as backend-owned audit state

### Requirement: Auditable Guardrail Decisions
The system SHALL record operator approvals or denials for guarded actions as auditable backend-owned events.

#### Scenario: Operator approves or denies a guarded action
- **WHEN** an action requires explicit operator approval under the execution policy
- **THEN** the approval or denial is stored against the relevant change or run
- **AND** later inspection can explain why the guarded action proceeded or remained blocked

