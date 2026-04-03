## ADDED Requirements
### Requirement: Editorial Operator Visual Hierarchy
The system SHALL present the default operator workbench through a restrained editorial visual hierarchy that keeps supporting context quiet and the selected-change workspace dominant.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main desktop shell
- **THEN** the selected-change workspace reads as the primary action surface
- **AND** summary strips, queue context, and navigation support the workflow without competing visually as equal dashboard surfaces
- **AND** the shell does not rely on repeated ornamental card treatments to distinguish every section

#### Scenario: Operator scans the control queue
- **WHEN** the operator scans the queue for the next change to inspect
- **THEN** queue rows read as a disciplined worklist optimized for scanning state, blocker, and next action
- **AND** queue context remains visible without repeating the same information through multiple equally prominent summary blocks

#### Scenario: Operator drills into run inspection
- **WHEN** the operator opens run studio from the selected change context
- **THEN** the run-inspection surface remains available without overtaking the selected-change workspace as a second competing dashboard
- **AND** raw runtime payloads are visually demoted behind higher-signal operational context
