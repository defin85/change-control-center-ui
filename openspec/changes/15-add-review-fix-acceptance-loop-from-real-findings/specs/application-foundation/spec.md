## ADDED Requirements
### Requirement: Finding-Driven Review And Fix Loop
The system SHALL drive review, targeted fix, and re-review flows from persisted findings derived from real run artifacts.

#### Scenario: Review run identifies issues
- **WHEN** a review run produces findings from real runtime or git evidence
- **THEN** the backend persists those findings as first-class records or normalized gaps linked to the originating run and affected requirements
- **AND** follow-up fix or re-review runs can target the unresolved subset instead of replaying a generic placeholder loop

### Requirement: Explicit Acceptance Decision From Persisted Proof
The system SHALL require change acceptance or reopening to be based on persisted backend-owned proof state.

#### Scenario: Operator accepts or reopens a reviewed change
- **WHEN** the operator accepts a change or sends it back for additional work
- **THEN** the decision is recorded against the current finding and evidence state
- **AND** the same change thread remains the source of truth for subsequent follow-up work
- **AND** acceptance does not depend on a synthetic run-state shortcut alone

