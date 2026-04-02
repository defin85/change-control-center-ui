# operator-ui-platform Specification

## Purpose
Define the canonical operator UI platform contract for approved foundations, platform-owned composition shells, route-addressable operator context, shared data and contract boundaries, workflow state ownership, and fail-closed UI governance.
## Requirements
### Requirement: Single Operator UI Foundation Stack
The system SHALL standardize the React operator UI on one primitive interaction foundation, one workflow state-model layer for complex operator flows, one tabular data foundation, and one project-owned platform layer for top-level UI composition.

#### Scenario: Developer adds a new operator surface
- **WHEN** a developer implements a new operator surface such as queue, change detail, run inspection, approval handling, or clarification authoring
- **THEN** the surface uses the approved primitive, workflow-state, table, and platform foundations for their respective roles
- **AND** the implementation does not introduce a parallel primary UI stack for the same responsibilities

### Requirement: Project-Owned Platform Composition
The system SHALL require route-level and workspace-level operator surfaces to compose through project-owned platform shells rather than directly from raw primitive or third-party page containers.

#### Scenario: Route page needs a master-detail or authoring surface
- **WHEN** a route-level or workspace-level operator surface needs master-detail layout, detail rendering, or authoring entry points
- **THEN** it uses approved project-owned platform shells for those concerns
- **AND** raw primitive components remain implementation details inside the platform layer or feature internals rather than the primary route-composition mechanism

### Requirement: Route-Addressable Operator Context
The system SHALL keep active operator context in route-addressable navigation state so the UI can restore queue, selected change, selected run, and active workspace context after reload or browser navigation.

#### Scenario: Operator reloads while inspecting a selected run
- **WHEN** the operator has a queue slice, selected change, selected run, and active workspace open
- **AND** the operator reloads the page or returns through browser navigation
- **THEN** the shell restores the same operator context from navigation state
- **AND** the restored context is rehydrated from backend responses rather than client-only cached truth

### Requirement: Shared Web Contract Boundary
The system SHALL route Control API traffic through a shared web contract boundary that centralizes request execution, response validation, error normalization, and transport or authentication failure handling.

#### Scenario: Backend contract or transport failure occurs
- **WHEN** feature code invokes a Control API operation and the request fails at the network, HTTP, or response-contract layer
- **THEN** the shared contract boundary emits a normalized failure for UI handling
- **AND** feature components do not duplicate low-level fetch and parsing logic
- **AND** invalid payloads are treated as contract failures instead of being silently accepted

### Requirement: Shared Operator Data and Realtime Orchestration
The system SHALL manage backend-owned queue, change, run, approval, and clarification entities through shared server-state orchestration and realtime reconciliation boundaries rather than duplicating those entities in ad hoc root-component state.

#### Scenario: Operator triggers a mutation that changes selected work
- **WHEN** the operator runs a command or approval action that changes queue, change detail, run detail, or clarification state
- **THEN** the affected surfaces reconcile through shared invalidation or update rules
- **AND** the selected context is preserved when the backend still considers it valid
- **AND** the frontend does not create a separate durable source of truth for the mutated entities

#### Scenario: Tenant event arrives while operator inspects selected change context
- **WHEN** a realtime tenant event indicates that queue, change detail, run detail, or clarification data changed
- **THEN** the shared realtime boundary triggers targeted cache updates or invalidations for the affected surfaces
- **AND** the operator retains selected change and run context when that context remains valid in backend state
- **AND** realtime handling does not require each feature to open its own independent subscription path

### Requirement: Explicit Workflow State Boundaries
The system SHALL model complex operator workflow transitions through explicit workflow state boundaries instead of scattering them across ad hoc local effect chains.

#### Scenario: Operator flow has multi-step state transitions
- **WHEN** a surface coordinates workflow-heavy transitions such as run execution, approval resolution, clarification rounds, or similar operator state progressions
- **THEN** the surface uses an explicit workflow state boundary with defined transitions
- **AND** simple presentational toggles or single-field drafts are not forced into the same workflow layer when that would add unnecessary complexity

### Requirement: Workflow-Oriented Operator Workbench Surfaces
The system SHALL expose a workflow-oriented operator workbench shell with the primary surfaces and actions required to inspect and advance change-driven work.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport
- **THEN** the shell shows search and global actions
- **AND** the shell shows queue and signal summaries together with queue and filter context
- **AND** the shell shows a control queue, an inspector surface, and a detail workspace in one operator workbench
- **AND** all visible product data comes from backend-owned state rather than static client-only mock state

#### Scenario: Operator inspects a selected change
- **WHEN** a change is selected in the control queue
- **THEN** the detail workspace provides tabs for `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, `Chief`, and `Clarifications`
- **AND** the detail header exposes actions for `Run next step`, `Open run studio`, `Escalate`, and `Mark blocked by spec`
- **AND** those actions operate through backend-owned commands and normalized state transitions

#### Scenario: Operator opens run studio from change detail
- **WHEN** the operator opens run studio from the selected change context
- **THEN** the shell enters a dedicated run-inspection surface linked to the selected run
- **AND** the operator can return to change detail without losing the selected change context
- **AND** run lineage, approvals, evidence, and clarification context remain available from backend-owned data

### Requirement: Governed Operator Authoring and Responsive Detail Flows
The system SHALL provide canonical platform-approved entry points for operator authoring and responsive detail workflows.

#### Scenario: Narrow viewport opens a detail or edit flow
- **WHEN** an operator opens a detail-adjacent edit or authoring flow on a narrow viewport
- **THEN** the workflow degrades through a platform-approved overlay or drawer-style path rather than treating horizontal overflow as the primary interaction mode
- **AND** feature code does not invent a separate primary authoring path outside the approved platform shells

### Requirement: Fail-Closed UI Governance
The system SHALL fail closed on platform-governance violations such as silent UI fallback behavior, route-level platform bypass, or introduction of a second primary design system without an approved change.

#### Scenario: Feature implementation bypasses the UI platform contract
- **WHEN** a feature attempts to bypass the approved platform layer, silently falls back to an alternate UI path, or introduces a second primary design system without an approved OpenSpec change
- **THEN** repository governance and verification gates detect the violation explicitly
- **AND** the build or validation workflow does not treat that violation as acceptable drift
