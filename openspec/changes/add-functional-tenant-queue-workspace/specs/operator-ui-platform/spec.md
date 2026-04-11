## ADDED Requirements
### Requirement: Functional Tenant Queue Workspace
The system SHALL provide a functional tenant-scoped queue workspace backed by backend-owned change summaries.

#### Scenario: Operator opens the queue workspace for an active tenant
- **WHEN** the operator opens the default queue workspace for the active tenant
- **THEN** the shell renders backend-owned change summaries instead of static queue placeholder rows
- **AND** queue search and view filtering update the visible worklist through supported shell state
- **AND** selecting a queue row updates canonical selected-change context for downstream detail rendering

#### Scenario: Selected queue context becomes stale
- **WHEN** the active tenant or selected change context is no longer valid for the visible queue
- **THEN** the shell clears or repairs that stale context explicitly
- **AND** the shell does not fall back to a hidden legacy workbench path to recover navigation
