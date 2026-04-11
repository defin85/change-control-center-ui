## MODIFIED Requirements
### Requirement: Legacy Template Replacement
The system SHALL replace the old filesystem-level static prototype as the primary product entrypoint while allowing the shipped backend-served shell itself to remain a static reference composition.

#### Scenario: Operator opens the new application
- **WHEN** an operator opens the main application entrypoint
- **THEN** the operator sees the backend-served static reference shell rather than the old standalone prototype/template
- **AND** the same application deployment still provides the backend-owned Control API and runtime foundation behind that shipped shell
