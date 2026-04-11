## ADDED Requirements
### Requirement: Backend-Served Shell Bootstrap Contract
The system SHALL hydrate the functional backend-served operator shell through backend-owned bootstrap data instead of client-owned sample state.

#### Scenario: Operator opens the first functional shell build
- **WHEN** the operator opens a functional backend-served shell entrypoint
- **THEN** the shell requests and validates the backend bootstrap contract before rendering functional workspace state
- **AND** tenant and repository-catalog context come from backend-owned data rather than hard-coded sample arrays
- **AND** bootstrap contract failure is surfaced explicitly instead of silently falling back to client-only shell truth
