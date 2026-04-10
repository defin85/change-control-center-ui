## MODIFIED Requirements
### Requirement: Legacy Template Replacement
The system SHALL replace the current static prototype/template as the primary product entrypoint while preserving the existing operator workflows in the new canonical UI.

#### Scenario: Operator opens the new application
- **WHEN** an operator opens the main application entrypoint
- **THEN** the operator sees the canonical product shell rather than the legacy static template or a legacy-only workbench fallback
- **AND** the workflows for `Control Queue`, `Change Detail`, `Runs`, and `Chief` remain available
