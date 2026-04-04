## ADDED Requirements

### Requirement: Route-Addressable Repository Catalog Workspace
The system SHALL provide a route-addressable repository catalog workspace alongside the existing change workbench so operators can manage repository context without losing navigation continuity.

#### Scenario: Operator reloads while the repository catalog is open
- **WHEN** the operator is viewing the repository catalog for an active tenant and reloads the page or returns through browser navigation
- **THEN** the shell restores the catalog workspace mode from navigation state
- **AND** the active tenant rehydrates from backend-owned data rather than client-only cached truth
- **AND** the operator can continue into the selected repository's queue without manually reconstructing context

### Requirement: Scan-Optimized Repository Catalog Surface
The system SHALL present repository catalog entries as a scan-optimized management surface that helps operators compare repository attention and workload quickly.

#### Scenario: Operator scans a portfolio with multiple repositories
- **WHEN** the operator opens the repository catalog with several repository entries available
- **THEN** each entry exposes repository identity, repo path, concise workload signals, and recent activity in a small number of readable row or card regions
- **AND** the catalog keeps the currently selected repository profile and next-step actions visible without turning the surface into a dashboard of equally weighted summary cards
- **AND** the operator can filter or search the catalog without losing the backend-owned repository signals needed for comparison

#### Scenario: Operator uses the repository catalog on a compact viewport
- **WHEN** the operator opens the repository catalog on a compact viewport
- **THEN** the list remains readable as stacked repository cards or rows
- **AND** selecting a repository opens its profile and actions through a platform-approved overlay or drawer path
- **AND** the compact catalog does not depend on horizontal overflow as the primary interaction model

### Requirement: Governed Repository Catalog Authoring Flow
The system SHALL route repository creation and repository selection from the catalog through explicit platform-owned pending and error boundaries.

#### Scenario: Operator creates a repository from catalog management
- **WHEN** the operator invokes `New repository` from the catalog workspace or its header shortcut and submits valid repository metadata
- **THEN** the shell uses one governed authoring flow with explicit pending and error states
- **AND** a successful submission refreshes the catalog through shared server-state orchestration and selects the new repository as the active tenant
- **AND** the resulting repository profile exposes an explicit next action such as opening the queue or creating the first change instead of leaving the operator in an ambiguous empty state
