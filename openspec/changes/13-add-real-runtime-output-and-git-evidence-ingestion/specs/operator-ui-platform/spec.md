## ADDED Requirements
### Requirement: Functional Evidence And Git Surfaces Use Ingested Run Artifacts
The system SHALL render selected-change and run-detail evidence and git sections from ingested backend-owned artifacts rather than synthetic placeholder summaries.

#### Scenario: Operator inspects completed work
- **WHEN** the operator opens change detail or run detail after a completed repo-bound run
- **THEN** the shell renders backend-normalized git and evidence data collected from that run
- **AND** the operator can distinguish successful evidence collection, empty evidence, and evidence-collection failure from explicit UI state

