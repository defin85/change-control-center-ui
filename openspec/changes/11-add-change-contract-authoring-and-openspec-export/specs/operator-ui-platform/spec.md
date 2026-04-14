## ADDED Requirements
### Requirement: Functional Change Contract Authoring And Export Surface
The system SHALL expose change-contract authoring and OpenSpec export through the selected-change workspace with explicit pending, validation, and conflict states.

#### Scenario: Operator authors contract data from selected-change context
- **WHEN** the operator opens selected-change context for a draft or planning change
- **THEN** the shell renders editable contract inputs and export-readiness cues from backend-owned state
- **AND** save and export actions show explicit pending and error boundaries
- **AND** successful export keeps the operator on the same change thread with visible artifact status

