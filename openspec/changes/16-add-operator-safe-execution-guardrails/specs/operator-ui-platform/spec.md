## ADDED Requirements
### Requirement: Functional Guardrail Visibility For Risky Execution
The system SHALL surface execution guardrails, blocked reasons, and approval requirements through the functional shell.

#### Scenario: Operator attempts a guarded action
- **WHEN** the operator triggers an action that is blocked or requires approval under execution policy
- **THEN** the shell shows the specific guardrail reason and supported next step
- **AND** the UI does not degrade into generic transport failure copy or silent no-op behavior
