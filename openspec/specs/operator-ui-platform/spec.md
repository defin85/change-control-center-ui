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

### Requirement: Tenant-Safe Operator Context Reconciliation
The system SHALL reconcile tenant changes, browser navigation, realtime updates, and mutation-driven refreshes through shared sequencing rules that prevent stale selected context from crossing tenant boundaries or overwriting newer backend state.

#### Scenario: Operator switches tenants while a change is selected
- **WHEN** the operator switches to a different tenant while change or run context from the previous tenant is selected
- **THEN** the shell clears or invalidates stale selected change and run context before requesting detail for the next tenant
- **AND** an absent change in the newly selected tenant does not force the whole workbench into a terminal global error when queue context is still valid
- **AND** the next tenant rehydrates from its own backend-owned queue state

#### Scenario: Slower stale refresh resolves after a newer refresh
- **WHEN** two queue or detail refreshes overlap for the same workbench and the older response resolves last
- **THEN** shared orchestration ignores or cancels the stale response
- **AND** the workbench keeps the newer backend snapshot and selected context

### Requirement: Explicit Operator Command Workflow Boundaries
The system SHALL route every backend-mutating operator command, including global header actions, through an explicit pending and error boundary that uses the shared web contract normalization path.

#### Scenario: Operator triggers a global header action
- **WHEN** the operator starts `New change`, header `Run next step`, or another global mutation entrypoint from the header shell
- **THEN** the shell shows explicit pending and error state consistent with detail, run, and clarification surfaces
- **AND** transport, HTTP, and contract failures are surfaced through normalized operator-visible errors
- **AND** the command path does not rely on unhandled promise rejections or silent async failure

### Requirement: Fail-Closed Operator Draft And Clarification Context
The system SHALL scope interactive drafts to the selected change and active clarification round, and the operator shell SHALL treat historical clarification rounds as read-only.

#### Scenario: Selected change or active clarification round changes
- **WHEN** the operator changes the selected change or a new clarification round becomes the active open round
- **THEN** fact-promotion drafts and clarification answer drafts are reset or re-keyed to the new context
- **AND** selections from an earlier round do not silently become valid input for a different round
- **AND** answered clarification rounds remain visible without presenting live submission controls

### Requirement: Inspectable Gap Surfaces
The system SHALL keep gap-table rows as inspection affordances and reserve change-mutating commands for explicit actions.

#### Scenario: Operator inspects a gap row in change detail
- **WHEN** the operator clicks or focuses a gap row in the `Gaps` tab
- **THEN** the shell does not mutate the whole change as a side effect of inspection
- **AND** `Mark blocked by spec` remains an explicit change-level action with its own workflow boundary

### Requirement: Explicit Realtime Degradation Visibility
The system SHALL detect unexpected realtime subscription loss for the active tenant and either re-establish the shared subscription or surface an explicit degraded state until reconciliation is healthy again.

#### Scenario: Active tenant subscription closes unexpectedly
- **WHEN** the shared tenant realtime subscription errors or closes unexpectedly while the operator stays on the same tenant
- **THEN** the shell attempts the configured recovery path or marks realtime as degraded explicitly
- **AND** the operator is not left with a shell that appears healthy while backend-owned state is no longer reconciling
- **AND** feature surfaces do not need their own independent websocket lifecycle logic

### Requirement: Deterministic Operator Platform Proofs
The system SHALL keep platform browser conformance proofs isolated from prior mutated backend state and cover regressions in the shared operator integrity boundaries.

#### Scenario: Platform browser suite runs repeatedly or in a different order
- **WHEN** the platform browser suite is executed repeatedly, against a clean backend, or in a different test order
- **THEN** mutable scenarios do not depend on prior test-created or test-mutated entities
- **AND** the suite still proves promotion success, clarification history lock, tenant-switch integrity, realtime degradation visibility, and explicit global-command failure handling
- **AND** a passing suite is treated as evidence of current platform behavior rather than shared leftover state

### Requirement: Accessible Compact-Viewport Detail Workspace
The system SHALL treat the selected-change detail workspace as an accessible dialog or drawer interaction on compact viewports rather than as a visual overlay only.

#### Scenario: Operator opens selected change context on a narrow viewport
- **WHEN** the operator opens the selected-change workspace on a compact viewport
- **THEN** the workspace exposes dialog-style semantics for assistive technology
- **AND** focus moves into the active workspace and remains constrained to that workspace until it is closed
- **AND** background workbench content is hidden from assistive technology or otherwise made inert while the workspace is open
- **AND** the operator can close the workspace and return to the same queue context without losing selected-change state

### Requirement: Readable Compact Data Presentation
The system SHALL adapt queue and detail data-heavy surfaces into readable compact-view presentations instead of collapsing desktop columns into unlabeled vertical value stacks.

#### Scenario: Operator inspects queue or detail data on a compact viewport
- **WHEN** the operator views the control queue or a detail tabular section on a compact viewport
- **THEN** each rendered row presents field labels together with their corresponding values in a readable stacked or card-style layout
- **AND** the operator does not need to remember desktop column order to identify state, blocker, next action, or similar fields
- **AND** the compact presentation preserves the same backend-owned data content as the desktop variant

### Requirement: Contextual Primary Action Hierarchy
The system SHALL make the selected-change workspace the primary action surface for the active change and demote duplicate global entrypoints while that change is in focus.

#### Scenario: Operator has an active selected change
- **WHEN** a change is selected and its detail workspace is visible
- **THEN** the shell presents one clearly emphasized primary next-step action for that selected change within the contextual workspace
- **AND** duplicate global entrypoints for the same change action are visually secondary, disabled, or otherwise demoted so they do not compete with the contextual primary action
- **AND** supportive surfaces such as queue summaries and inspector cards do not become equally prominent action surfaces for the same next step

### Requirement: Locale-Consistent Shell Semantics
The system SHALL keep the backend-served default operator shell semantically consistent for one configured locale.

#### Scenario: Operator loads the backend-served shell
- **WHEN** the operator opens the default backend-served entrypoint
- **THEN** the document language, default shell copy, and baseline form-field semantics align to the same configured locale
- **AND** mixed-language placeholders, labels, and metadata are not presented in the default shell unless they originate from backend-owned domain data
- **AND** basic interactive fields expose the metadata needed for browser and assistive-technology tooling to identify them reliably

