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
The system SHALL keep active operator context in route-addressable navigation state so the UI can restore queue, selected change, selected run, active workspace context, and explicit hidden-shell choice after reload or browser navigation.

#### Scenario: Operator reloads while using the hidden legacy shell
- **WHEN** the operator has selected queue or detail context open through the internal legacy-shell fallback
- **AND** the operator reloads the page or returns through browser navigation
- **THEN** the shell restores the same operator context together with the explicit legacy-shell choice from navigation state
- **AND** the default route still resolves to the simple-reference shell when that flag is absent

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
The system SHALL expose workflow-oriented operator workbench surfaces through the hidden legacy fallback while the default route remains the shipped simple-reference preview.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport without the internal legacy-shell flag
- **THEN** the shell shows the static simple-reference preview instead of the live workflow workbench
- **AND** the deprecated live workflow workbench is not rendered unless the internal legacy-shell flag is present

#### Scenario: Operator inspects a selected change
- **WHEN** a change is inspected through the hidden legacy workbench path
- **THEN** the contextual workspace still provides tabs for `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, `Chief`, and `Clarifications`
- **AND** the contextual workspace still exposes actions for `Run next step`, `Open run studio`, `Escalate`, and `Mark blocked by spec`
- **AND** those workflow surfaces remain available only in the hidden live workbench rather than on the default static preview route

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

### Requirement: Focused Operator Shell Hierarchy
The system SHALL keep route-level operator context visible without letting summary chrome compete visually with the selected-change workspace.

#### Scenario: Operator opens the main shell with a selected change on desktop
- **WHEN** the operator opens the default desktop shell while a change is selected
- **THEN** repository, slice, and queue context remain visible in a quieter supporting layer
- **AND** the selected-change workspace reads as the obvious primary working surface
- **AND** shell-level summaries do not repeat the same selected-change state through multiple equally prominent blocks

### Requirement: Scan-Optimized Queue Worklist
The system SHALL present the control queue through a reference-parity toolbar and compact row cadence that optimize scanning without separate queue dashboard chrome.

#### Scenario: Operator scans a repetitive draft-heavy queue slice
- **WHEN** many visible queue rows share similar draft or low-signal state
- **THEN** queue-level search, slice, and filter context remain available inside the queue section itself
- **AND** each row consolidates title or summary, concise metadata, state, blocker, and next-step context into a small number of readable row regions
- **AND** the operator does not need a separate context-chip band or equally weighted multi-column dashboard frame to understand the current queue slice

#### Scenario: Operator compares queue rows before opening one change
- **WHEN** the operator scans several candidate queue rows before choosing the next change
- **THEN** repetitive rows remain distinguishable through their compact state, blocker, owner, and next-step signals
- **AND** the queue emphasizes the worklist itself instead of competing with it through surrounding summary chrome of similar visual weight

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

### Requirement: Governed Project Authoring Entry Point
The system SHALL provide a governed header-level authoring flow for creating a new tenant/project from the operator shell.

#### Scenario: Operator creates a new project from the header
- **WHEN** the operator invokes `New project` from the workbench header
- **THEN** the shell presents an explicit authoring flow with pending and error boundaries
- **AND** a successful submission updates tenant selection through the shared server-state orchestration path
- **AND** the shell does not rely on browser prompt dialogs or client-only mock state

### Requirement: Explicit Confirmed Change Deletion Flow
The system SHALL provide an explicit destructive-action flow for deleting the selected change from the detail workspace.

#### Scenario: Operator deletes the selected change
- **WHEN** the operator invokes `Delete change` from the selected change workspace and confirms the action
- **THEN** the shell routes the deletion through a backend-owned command with explicit pending and error state
- **AND** the queue, selected change context, and selected run context reconcile through the shared orchestration boundary after deletion
- **AND** the shell does not leave route or workspace state pointing at a deleted change

### Requirement: Route-Addressable Repository Catalog Workspace
The system SHALL provide a route-addressable repository catalog workspace alongside the existing change workbench so operators can manage repository context without losing navigation continuity.

#### Scenario: Operator reloads while the repository catalog is open
- **WHEN** the operator is viewing the repository catalog for an active tenant and reloads the page or returns through browser navigation
- **THEN** the shell restores the catalog workspace mode from navigation state
- **AND** the active tenant rehydrates from backend-owned data rather than client-only cached truth
- **AND** the operator can continue into the selected repository's queue without manually reconstructing context

### Requirement: Scan-Optimized Repository Catalog Surface
The system SHALL present repository catalog entries as a scan-optimized management surface that helps operators compare repository attention and workload quickly.

#### Scenario: Operator scans a portfolio with multiple repositories
- **WHEN** the operator opens the repository catalog with several repository entries available
- **THEN** each entry exposes repository identity, repo path, concise workload signals, and recent activity in a small number of readable row or card regions
- **AND** the catalog keeps the currently selected repository profile and next-step actions visible without turning the surface into a dashboard of equally weighted summary cards
- **AND** the operator can filter or search the catalog without losing the backend-owned repository signals needed for comparison

#### Scenario: Operator uses the repository catalog on a compact viewport
- **WHEN** the operator opens the repository catalog on a compact viewport
- **THEN** the list remains readable as stacked repository cards or rows
- **AND** selecting a repository opens its profile and actions through a platform-approved overlay or drawer path
- **AND** the compact catalog does not depend on horizontal overflow as the primary interaction model

### Requirement: Governed Repository Catalog Authoring Flow
The system SHALL route repository creation and repository selection from the catalog through explicit platform-owned pending and error boundaries.

#### Scenario: Operator creates a repository from catalog management
- **WHEN** the operator invokes `New repository` from the catalog workspace or its header shortcut and submits valid repository metadata
- **THEN** the shell uses one governed authoring flow with explicit pending and error states
- **AND** a successful submission refreshes the catalog through shared server-state orchestration and selects the new repository as the active tenant
- **AND** the resulting repository profile exposes an explicit next action such as opening the queue or creating the first change instead of leaving the operator in an ambiguous empty state

### Requirement: Operational Operator Visual Hierarchy
The system SHALL present the default operator workbench through a codex-lb-inspired operational visual hierarchy with restrained translucent chrome, bordered work panels, concise semantic accents, and a clearly dominant selected-change workspace.

#### Scenario: Operator opens the canonical shell on desktop
- **WHEN** the operator opens the default backend-served desktop shell
- **THEN** the selected-change workspace reads as the primary action surface
- **AND** shell chrome, repository context, search, and summary signals are framed through compact supporting surfaces rather than a document-like hero treatment
- **AND** the shell does not preserve the legacy editorial visual contract as a parallel or fallback presentation mode

#### Scenario: Operator scans the control queue in the operational shell
- **WHEN** the operator scans the queue for the next change to inspect
- **THEN** queue rows read as a disciplined operational worklist optimized for scanning state, blocker, orchestrator owner label, and next-step context
- **AND** concise status treatments, compact metadata, and bordered row or panel framing make repetitive queue slices easier to scan
- **AND** queue context remains visible without repeating the same information through multiple equally prominent summary blocks

#### Scenario: Operator drills into run inspection from the operational shell
- **WHEN** the operator opens run studio from the selected change context
- **THEN** the run-inspection surface remains available without overtaking the selected-change workspace as a second competing dashboard
- **AND** the run surface shares the same operational visual system as the surrounding shell
- **AND** raw runtime payloads remain visually demoted behind higher-signal operational context

### Requirement: Single Canonical Operational Shell
The system SHALL ship one canonical backend-served operator shell in the operational style and SHALL retire preview-only or editorial shell variants from the default application entrypoint.

#### Scenario: Operator opens the default served entrypoint
- **WHEN** the operator opens the backend-served default application entrypoint
- **THEN** the operator receives the canonical operational shell directly
- **AND** the default entrypoint does not depend on a preview-only route or opt-in visual mode to reach the approved shell
- **AND** the served application does not keep the retired editorial shell as a supported fallback
- **AND** any retained static sample remains a non-shipped reference artifact outside the default served application path

### Requirement: Operational Shell Signal Framing
The system SHALL frame shell-level operator signals through compact operational summary treatments that support decision-making without becoming a parallel dashboard.

#### Scenario: Operator scans shell-level status before choosing work
- **WHEN** the operator opens the default workbench with repository and queue context available
- **THEN** the shell exposes compact metric, state, or sync signals in a restrained supporting layer
- **AND** semantic colors are reserved for actionable status, risk, and approval state rather than ornamental emphasis
- **AND** those shell-level signals do not compete visually with the selected-change workspace for primary operator attention

### Requirement: Reference-Authoritative Default Workbench Composition
The system SHALL treat `legacy/references/operator-workbench` as the authoritative visual and structural reference for the default desktop queue workspace until another approved OpenSpec change supersedes it.

#### Scenario: Operator opens the default desktop queue workspace
- **WHEN** the operator opens the backend-served default application entrypoint in queue mode on a desktop viewport
- **THEN** the shell follows the reference-parity section cadence of masthead, compact overview metrics, supporting repository overview, and one paired live-queue plus selected-change stage
- **AND** the shell does not insert a separate permanent rail, standalone summary strip, or other parallel dashboard layer between those primary sections
- **AND** differences from the reference are limited to backend-owned live data and approved workflow affordances

#### Scenario: Contributor compares the live shell with the reference artifact
- **WHEN** a contributor compares the default desktop queue workspace with `legacy/references/operator-workbench`
- **THEN** the overall composition, dominant surfaces, and section hierarchy are recognizably the same
- **AND** a cosmetic token or background update without structural parity is not treated as sufficient implementation evidence

### Requirement: Legacy Dashboard Chrome Removal
The system SHALL retire the current intermediate dashboard chrome from the canonical desktop queue workspace and SHALL re-express any required context inside the simpler reference-parity sections.

#### Scenario: Canonical desktop queue workspace renders supporting context
- **WHEN** the canonical desktop queue workspace renders repository, slice, or queue context
- **THEN** that context appears inside the masthead, overview, repository, queue, or selected-change sections of the reference-parity shell
- **AND** the canonical queue workspace does not rely on a separate permanent operator rail, summary strip, or queue-context dashboard band as first-class structural layers

### Requirement: Shipped Static Reference Preview Default Shell
The system SHALL ship the exact simple reference as the default backend-served shell, even when that default route is a static preview rather than a live-data operator workbench.

#### Scenario: Operator opens the default backend-served route
- **WHEN** the operator opens the default application entrypoint without an internal legacy-shell flag
- **THEN** the shell renders the literal simple-reference cadence of masthead, page header, metrics, supporting overview panels, repositories, and the preview queue plus selected-change stage
- **AND** the default route may render static preview copy and arrays from the shipped reference component
- **AND** the default route does not render the deprecated legacy workbench shell

### Requirement: Hidden Legacy Workbench Fallback
The system SHALL keep the previous workbench available only as a hidden deprecated fallback while the default route remains the shipped static reference preview.

#### Scenario: Internal route explicitly requests the deprecated shell
- **WHEN** navigation state includes the internal legacy-shell flag
- **THEN** the app may render the deprecated legacy workbench shell for compatibility or comparison
- **AND** reload and browser history preserve that explicit shell choice
- **AND** the shipped reference page may still expose a controlled link into that hidden live workbench path

