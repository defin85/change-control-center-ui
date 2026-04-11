## ADDED Requirements
### Requirement: Functional Shell Proof Pack
The system SHALL provide a deterministic verification pack for the functional backend-served operator shell.

#### Scenario: Contributor verifies a functional shell change
- **WHEN** a contributor runs the canonical UI verification workflow after the functional shell has been restored
- **THEN** the verification tiers prove backend-served functional catalog, queue, selected-change, run, command, collaboration, and realtime behavior through repo-owned entrypoints
- **AND** the repository does not treat static-only smoke evidence as sufficient proof for the richer functional shell
- **AND** readiness docs, helper automation, and launcher entrypoints stay aligned with the same verification matrix
