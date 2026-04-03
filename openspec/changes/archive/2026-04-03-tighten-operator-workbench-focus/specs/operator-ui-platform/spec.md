## ADDED Requirements
### Requirement: Focused Operator Shell Hierarchy
The system SHALL keep route-level operator context visible without letting summary chrome compete visually with the selected-change workspace.

#### Scenario: Operator opens the main shell with a selected change on desktop
- **WHEN** the operator opens the default desktop shell while a change is selected
- **THEN** repository, slice, and queue context remain visible in a quieter supporting layer
- **AND** the selected-change workspace reads as the obvious primary working surface
- **AND** shell-level summaries do not repeat the same selected-change state through multiple equally prominent blocks

### Requirement: Scan-Optimized Queue Worklist
The system SHALL present the control queue as a scan-optimized worklist that highlights the few signals most useful for choosing the next change.

#### Scenario: Operator scans a repetitive draft-heavy queue slice
- **WHEN** many visible queue rows share similar draft or low-signal state
- **THEN** each row still exposes state, blocker, and next-step context
- **AND** those signals are consolidated into a small number of readable row regions instead of forcing every summary field into its own equally weighted column
- **AND** repetitive rows remain distinguishable without requiring the operator to read long repeated phrases across every column

### Requirement: Focused Compact Detail Overview
The system SHALL adapt the compact selected-change workspace into a focused operator sheet with progressive disclosure for lower-priority overview detail.

#### Scenario: Operator opens selected change context on a narrow viewport
- **WHEN** the operator opens the selected-change workspace on a compact viewport
- **THEN** the drawer foregrounds the current state, next action, and immediate actions first
- **AND** lower-priority overview detail such as extended contract, memory, or focus-graph sections is available through explicit disclosure rather than always rendered at full height
- **AND** the resulting compact workspace avoids turning the default overview into a single long audit document

### Requirement: Operator-Facing Governance Copy
The system SHALL keep unavailable and guarded operator actions fail-closed without exposing internal repository-governance phrasing as the default product voice.

#### Scenario: Operator encounters an unavailable action or prerequisite
- **WHEN** the shell disables or gates an action because required context or product support is missing
- **THEN** the UI describes the immediate operator-facing prerequisite or unavailable state in product language
- **AND** the shell does not rely on default copy that explains internal OpenSpec, repository-governance, or implementation-contract mechanics to the operator
