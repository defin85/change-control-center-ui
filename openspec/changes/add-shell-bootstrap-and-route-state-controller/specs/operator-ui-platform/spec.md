## ADDED Requirements
### Requirement: Shared Shell Bootstrap And Route Controller
The system SHALL manage tenant, workspace, search, and selection context through one shared shell bootstrap and route-state controller.

#### Scenario: Operator reloads a supported functional shell route
- **WHEN** the operator reloads a supported route with tenant, workspace, or query context
- **THEN** the shell restores that supported context through one shared controller
- **AND** unsupported or stale params are normalized away explicitly
- **AND** later feature workspaces do not each invent their own root-level fetch and URL orchestration path
