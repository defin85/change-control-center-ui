## ADDED Requirements
### Requirement: Functional Operator Command Workflows
The system SHALL expose supported backend-owned operator commands through explicit workflow boundaries in the functional shell.

#### Scenario: Operator triggers a supported mutation from the functional shell
- **WHEN** the operator invokes `New repository`, `New change`, `Delete change`, `Run next step`, `Escalate`, or `Mark blocked by spec`
- **THEN** the shell shows explicit pending and error state for that mutation
- **AND** success rehydrates the affected queue, repository, detail, or run context through shared shell state
- **AND** the shell does not rely on hidden legacy actions, silent promise failures, or client-only mock transitions
