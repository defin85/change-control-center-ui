## ADDED Requirements

### Requirement: Control Center Shell Parity
The system SHALL present the new operator shell with the same primary control surfaces that the legacy control center template exposed, while continuing to run on the real backend-owned application stack.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport
- **THEN** the shell shows a topbar with search and global actions
- **AND** the shell shows a hero ribbon with queue and signal summaries
- **AND** the shell shows a left-side view/filter rail, the control queue, an inspector panel, and a detail workspace in the same overall operator-console structure as the legacy template
- **AND** all visible product data comes from backend-owned state rather than static client-only mock state

### Requirement: Queue Navigation and Filter Parity
The system SHALL restore the queue navigation and filtering surfaces validated in the legacy control center template.

#### Scenario: Operator navigates queue views
- **WHEN** the operator switches between queue views or applies queue-level filters
- **THEN** the shell exposes saved-view style navigation and filter controls equivalent to the legacy control center
- **AND** the queue updates within the same operator shell without losing the current backend-owned change context

### Requirement: Inspector Panel Parity
The system SHALL provide an inspector panel for the currently selected change, equivalent in purpose and density to the legacy control center inspector.

#### Scenario: Operator selects a change from the queue
- **WHEN** the operator selects a change in the control queue
- **THEN** the shell shows inspector metrics for the selected change
- **AND** the inspector shows next-best-action, blocker context, and chief policy summary
- **AND** the operator can clear the selection and return the inspector to its idle state

### Requirement: Detail Workspace Surface Parity
The system SHALL restore the detail workspace tabs and operator actions that were available in the legacy control center template.

#### Scenario: Operator inspects a selected change
- **WHEN** a change is selected in the control queue
- **THEN** the detail workspace provides tabs for `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, and `Chief`
- **AND** the detail header exposes actions for `Run next step`, `Open run studio`, `Escalate`, and `Mark blocked by spec`
- **AND** those actions operate through backend-owned commands and normalized state transitions

### Requirement: Run Studio Entry Parity
The system SHALL preserve the dedicated run-inspection workflow while making it reachable through the same operator path as the legacy control center.

#### Scenario: Operator opens run studio from change detail
- **WHEN** the operator opens run studio from the selected change context
- **THEN** the shell enters a dedicated run-inspection surface linked to the selected run
- **AND** the operator can return to change detail without losing the selected change context
- **AND** run lineage, approvals, and curated memory remain available from backend-owned data

### Requirement: Visual Console Parity
The system SHALL achieve recognizable visual parity with the legacy control center template on desktop without reverting to the legacy static implementation.

#### Scenario: Operator compares legacy and new shells
- **WHEN** the operator compares the legacy control center template with the new application shell
- **THEN** the new shell preserves the same operator-console hierarchy, panel structure, and high-density desktop layout
- **AND** the new shell does not collapse the experience into a simplified card-only shell
- **AND** the new shell may modernize implementation details while remaining recognizably equivalent in visual intent and workflow framing
