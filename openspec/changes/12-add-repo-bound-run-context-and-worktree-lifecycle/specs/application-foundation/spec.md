## ADDED Requirements
### Requirement: Repo-Bound Run Execution Context
The system SHALL launch each change run with an explicit tenant-repo and worktree execution context instead of running without repository binding.

#### Scenario: Chief starts a run for a real tenant repository
- **WHEN** the operator starts a run for a tenant with a valid repo path
- **THEN** the backend resolves and persists the repo root, worktree path, branch, and execution cwd for that run
- **AND** the runtime sidecar receives that execution context alongside the curated memory packet
- **AND** the run does not depend on an implicit process cwd or manually prepared shell state

### Requirement: Managed Worktree Lifecycle For Change Runs
The system SHALL manage worktree creation, reuse, and teardown as backend-owned lifecycle instead of leaving change worktrees as implicit placeholders.

#### Scenario: Change starts its first repo-bound execution
- **WHEN** the backend launches the first repo-bound run for a change
- **THEN** the backend creates or assigns the change's managed worktree and branch according to a deterministic policy
- **AND** later runs for the same change can reuse that managed worktree when valid
- **AND** failure to create or validate the worktree is surfaced explicitly before runtime execution starts
