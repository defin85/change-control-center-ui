## ADDED Requirements
### Requirement: Shared Realtime Reconciliation Boundary For The Functional Shell
The system SHALL reconcile functional shell state through one shared tenant realtime boundary with explicit degradation visibility.

#### Scenario: Tenant event changes visible shell state
- **WHEN** a tenant event changes queue, selected change, run detail, approval, or clarification state
- **THEN** the shell reconciles the affected state through one shared realtime boundary
- **AND** the shell preserves still-valid selected context instead of rebuilding every surface independently

#### Scenario: Realtime becomes unavailable while the operator stays on the same tenant
- **WHEN** the shared tenant realtime path errors or disconnects unexpectedly
- **THEN** the shell surfaces explicit degraded realtime state or recovery progress
- **AND** stale refresh responses do not overwrite newer shell state while recovery is in progress
