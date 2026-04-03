## ADDED Requirements

### Requirement: Backend-Owned Tenant Creation
The system SHALL allow operators to create a new tenant/project entry through a backend-owned API rather than requiring seed data or direct store edits.

#### Scenario: Operator creates a new project workspace
- **WHEN** the operator submits a valid new project entry
- **THEN** the backend persists and returns the canonical tenant record with its tenant id, name, repo path, and description
- **AND** the new tenant becomes available through the same bootstrap and tenant-selection contracts as seeded tenants

### Requirement: Backend-Owned Change Deletion
The system SHALL allow operators to remove a change through a backend-owned API that also cleans up backend-owned child records for that change.

#### Scenario: Operator deletes an existing change
- **WHEN** the operator confirms deletion of an existing change
- **THEN** the backend removes the change and its associated runs, approvals, clarification rounds, run events, and evidence records
- **AND** subsequent queue or detail reads do not return orphaned backend-owned records for that deleted change
