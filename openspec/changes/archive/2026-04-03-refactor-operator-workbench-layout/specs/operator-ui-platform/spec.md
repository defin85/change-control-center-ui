## MODIFIED Requirements
### Requirement: Workflow-Oriented Operator Workbench Surfaces
The system SHALL expose a workflow-oriented operator workbench shell with the primary surfaces and actions required to inspect and advance change-driven work.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport
- **THEN** the shell shows search and global actions
- **AND** the shell shows queue and signal summaries together with queue and filter context
- **AND** the shell shows a control queue and a contextual selected-change workspace in one operator workbench
- **AND** the selected-change workspace is the primary action surface for the active change instead of a separate standalone inspector plus detached lower detail stage
- **AND** all visible product data comes from backend-owned state rather than static client-only mock state

#### Scenario: Operator inspects a selected change
- **WHEN** a change is selected in the control queue
- **THEN** the contextual workspace provides tabs for `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, `Chief`, and `Clarifications`
- **AND** the contextual workspace header exposes actions for `Run next step`, `Open run studio`, `Escalate`, and `Mark blocked by spec`
- **AND** selected-change summary signals needed for decision-making remain visible without requiring a separate competing inspector surface
- **AND** those actions operate through backend-owned commands and normalized state transitions

#### Scenario: Operator opens run studio from change detail
- **WHEN** the operator opens run studio from the selected change context or selects a run from the `Runs` tab
- **THEN** the contextual workspace reveals a dedicated run-inspection surface linked to the selected run
- **AND** the operator can return focus to change detail without losing the selected change context
- **AND** run lineage, approvals, evidence, and clarification context remain available from backend-owned data
- **AND** run studio does not remain a permanently emphasized competing panel while no run is selected
