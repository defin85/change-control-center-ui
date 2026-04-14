## ADDED Requirements
### Requirement: Functional Review Acceptance Workspace Behavior
The system SHALL expose finding-driven review, targeted fix, acceptance, and reopen actions through the selected-change workspace.

#### Scenario: Operator resolves review findings
- **WHEN** the operator reviews a change with persisted findings
- **THEN** the shell presents unresolved findings, targeted follow-up actions, and acceptance or reopen controls from backend-owned state
- **AND** the shell shows explicit pending, blocked, and no-findings states instead of generic placeholder copy

