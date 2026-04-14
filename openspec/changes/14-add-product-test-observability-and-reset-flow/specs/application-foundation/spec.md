## ADDED Requirements
### Requirement: Product-Test Tenant Reset And Import
The system SHALL provide a backend-owned way to reset and repopulate approved product-test tenant state.

#### Scenario: Operator prepares a fresh product-test cycle
- **WHEN** the operator or approved test automation requests a reset for a designated product-test tenant or repository
- **THEN** the backend rebuilds that tenant's change, run, evidence, approval, and clarification state to a known baseline
- **AND** the reset does not require direct database edits or manual filesystem cleanup
- **AND** the operation is rejected for non-approved tenant contexts

