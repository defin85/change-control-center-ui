## ADDED Requirements
### Requirement: Functional Runs Workspace And Run Handoff
The system SHALL provide a functional top-level runs workspace with backend-owned run detail and explicit handoff back to the owning change.

#### Scenario: Operator opens the runs workspace
- **WHEN** the operator activates `Runs` from the supported shell navigation
- **THEN** the shell renders the tenant-scoped run list from backend-owned run data
- **AND** supported run-slice state is preserved through the shared shell controller
- **AND** the operator does not need a removed legacy run route to inspect current operational work

#### Scenario: Operator selects a run from the runs workspace
- **WHEN** the operator selects a run from the tenant-scoped run list
- **THEN** the shell renders backend-owned run detail, approvals, and recent events for that run
- **AND** the run surface exposes an explicit handoff back to the owning change through canonical shell state
