## ADDED Requirements

### Requirement: Canonical Repositories Workspace
The system SHALL expose `Repositories` as a canonical route-addressable operator workspace under `workspace=catalog` instead of treating it as static navigation chrome.

#### Scenario: Operator opens the repository workspace on desktop
- **WHEN** the operator activates the `Repositories` workspace or loads a route with `workspace=catalog`
- **THEN** the shell renders a repository-focused page flow with a page header, utility bar, compact metrics row, repository worklist, and selected repository stage
- **AND** all visible repository data comes from backend-owned catalog and tenant state
- **AND** the canonical shipped path does not rely on deprecated legacy-workbench catalog wrappers

#### Scenario: Operator selects a repository from the catalog
- **WHEN** the operator selects a repository from the worklist
- **THEN** the shell updates the active tenant through shared orchestration
- **AND** the selected repository stage surfaces the repository note, current pressure, featured change handoff, and the next canonical action for that repository
- **AND** the operator can move into queue work for the same repository without losing backend-owned tenant context

### Requirement: Scan-Optimized Repository Worklist
The system SHALL present repository catalog entries as a scan-optimized worklist that emphasizes the few signals most useful for deciding where repository attention should move next.

#### Scenario: Operator scans a portfolio slice with many repositories
- **WHEN** the visible repository slice contains many repositories with repetitive descriptive text
- **THEN** each repository row still highlights attention state, path, current load, last activity, next recommendation, and featured change context
- **AND** the list does not force every catalog field into equal-weight dashboard cards or wide table columns
- **AND** operators can distinguish one repository from another without reading a long repeated narrative in every row

### Requirement: Responsive Repository Selection Workspace
The system SHALL adapt the selected repository stage into an approved compact overlay path on narrow viewports instead of treating desktop side-by-side layout as the only usable interaction mode.

#### Scenario: Operator selects a repository on a compact viewport
- **WHEN** the operator opens repository context on a compact viewport
- **THEN** the selected repository stage appears through a platform-approved drawer or dialog interaction
- **AND** focus moves into the active repository stage and can return to the same repository list context after close
- **AND** the compact presentation preserves the same backend-owned repository signals and primary actions as the desktop stage

## MODIFIED Requirements

### Requirement: Route-Addressable Operator Context
The system SHALL keep active operator context in route-addressable navigation state so the UI can restore queue, selected change, selected run, active workspace context, and repository workspace context after reload or browser navigation.

#### Scenario: Operator reloads while inspecting the repository workspace
- **WHEN** the operator is on `workspace=catalog` with a tenant, search query, or catalog filter selected
- **AND** the operator reloads the page or returns through browser navigation
- **THEN** the shell restores the same repository workspace context from navigation state
- **AND** the selected repository stage rehydrates from backend-owned tenant and catalog responses rather than client-only cached truth
