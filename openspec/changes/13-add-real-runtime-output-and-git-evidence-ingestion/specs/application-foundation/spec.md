## ADDED Requirements
### Requirement: Real Runtime Outcome Ingestion
The system SHALL derive persisted run outcome from actual runtime completion data rather than synthetic transition text alone.

#### Scenario: Repo-bound run completes
- **WHEN** a runtime-backed run completes
- **THEN** the backend stores normalized completion data, relevant outputs, and terminally relevant runtime events for that run
- **AND** the run summary and result fields reflect the ingested completion data
- **AND** follow-up state does not rely solely on hard-coded placeholder transitions

### Requirement: Git Evidence Collection From Managed Worktrees
The system SHALL collect backend-owned git evidence from the managed worktree for completed runs.

#### Scenario: Operator inspects a completed run
- **WHEN** a repo-bound run completes against a managed worktree
- **THEN** the backend captures normalized git status, diff, and check artifacts linked to that run and change
- **AND** selected-change and run-detail reads expose that evidence through backend-owned contracts
- **AND** evidence collection failures are recorded explicitly instead of being silently omitted

