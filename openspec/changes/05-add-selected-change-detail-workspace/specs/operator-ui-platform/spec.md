## ADDED Requirements
### Requirement: Functional Selected Change Detail Workspace
The system SHALL provide a functional selected-change workspace backed by the backend-owned change-detail contract.

#### Scenario: Operator selects a change from the queue
- **WHEN** the operator selects a change from the active tenant queue
- **THEN** the shell loads and renders backend-owned detail data for that change
- **AND** the contextual workspace exposes overview, traceability, gaps, evidence, git, chief, and clarification history inside the supported shell
- **AND** the selected-change workspace becomes the primary working surface without redirecting into a hidden legacy shell

#### Scenario: Operator opens selected change context on a compact viewport
- **WHEN** selected-change detail is opened on a compact viewport
- **THEN** the detail stage is presented through an accessible overlay or drawer-style interaction
- **AND** closing that interaction returns the operator to the same queue context
