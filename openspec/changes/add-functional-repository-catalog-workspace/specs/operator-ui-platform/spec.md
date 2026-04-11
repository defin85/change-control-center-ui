## ADDED Requirements
### Requirement: Functional Repository Catalog Workspace
The system SHALL provide `Repositories` as a functional route-addressable workspace backed by the backend-owned repository catalog.

#### Scenario: Operator opens the repository catalog workspace
- **WHEN** the operator activates `Repositories` from the shell navigation or loads a supported catalog route
- **THEN** the shell renders backend-owned repository catalog entries rather than static placeholder rows
- **AND** repository selection updates active tenant context through the shared shell controller
- **AND** the workspace exposes supported handoffs for `New repository`, `New change`, and opening the selected repository's queue

#### Scenario: Operator selects a repository on a compact viewport
- **WHEN** the operator opens repository context on a compact viewport
- **THEN** the selected repository stage appears through an approved overlay or drawer interaction
- **AND** the operator can return to the same repository list context after close
