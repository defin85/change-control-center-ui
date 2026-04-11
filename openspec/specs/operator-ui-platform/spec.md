# operator-ui-platform Specification

## Purpose
Define the current operator UI platform truth after the selected-change rollout: approved UI foundations, project-owned composition and contract boundaries, the shared backend-owned shell bootstrap controller, the bootstrap-hydrated default route, the shipped functional `Queue` workspace on `/`, the shipped selected-change detail workspace inside that queue shell, the shipped `Repositories` workspace on `workspace=catalog`, and the governance that sequences later workspace rollout.

## Requirements
### Requirement: Single Operator UI Foundation Stack
The system SHALL standardize the React operator UI on one primitive interaction foundation, one workflow state-model layer for complex operator flows, one tabular data foundation, and one project-owned platform layer for top-level UI composition.

#### Scenario: Developer adds or maintains an operator UI surface
- **WHEN** a developer implements or updates an operator UI surface such as the shell scaffold, a catalog prototype, an authoring dialog, or a later functional workspace
- **THEN** the surface uses the approved primitive, workflow-state, table, and platform foundations for their respective roles
- **AND** the implementation does not introduce a parallel primary UI stack for the same responsibilities

### Requirement: Project-Owned Platform Composition
The system SHALL require route-level and workspace-level operator surfaces to compose through project-owned platform shells rather than directly from raw primitive or third-party page containers.

#### Scenario: Route or workspace code needs top-level composition
- **WHEN** route-level or workspace-level operator code needs shell framing, detail rendering, status treatment, or authoring entry points
- **THEN** it uses approved project-owned platform shells for those concerns
- **AND** raw primitive components remain implementation details inside the platform layer or feature internals rather than the primary route-composition mechanism

### Requirement: Shared Web Contract Boundary
The system SHALL route Control API traffic through a shared web contract boundary that centralizes request execution, response validation, error normalization, and transport or authentication failure handling.

#### Scenario: Platform-owned code invokes a Control API operation
- **WHEN** platform-owned code issues a Control API request for bootstrap, repository, tenant, change, or other operator data
- **THEN** the shared contract boundary emits normalized success or failure results for UI handling
- **AND** feature code does not duplicate low-level fetch and parsing logic
- **AND** invalid payloads are treated as contract failures instead of being silently accepted

### Requirement: Explicit Workflow State Boundaries
The system SHALL model complex operator workflow transitions through explicit workflow state boundaries instead of scattering them across ad hoc local effect chains.

#### Scenario: Platform-owned adjunct flow has multi-step transitions
- **WHEN** a platform-owned flow coordinates pending, success, and failure transitions such as repository authoring or future command execution
- **THEN** the flow uses an explicit workflow state boundary with defined transitions
- **AND** simple presentational toggles or single-field drafts are not forced into the same workflow layer when that would add unnecessary complexity

### Requirement: Shared Shell Bootstrap And Route Controller
The system SHALL manage tenant, workspace, search, queue view/filter/selected-change context, and repository-catalog filter/selection context through one shared shell bootstrap and route-state controller.

#### Scenario: Operator reloads a supported functional shell route
- **WHEN** the operator reloads a supported route with tenant, workspace, or query context
- **THEN** the shell restores that supported context through one shared controller
- **AND** unsupported or stale params are normalized away explicitly
- **AND** later feature workspaces do not each invent their own root-level fetch and URL orchestration path

### Requirement: Route-Addressable Operator Context
The system SHALL keep the shipped backend-served shell on one canonical functional route and SHALL normalize unsupported live-workbench query state away from that route while preserving supported shell context.

#### Scenario: Operator opens an old bookmarked live-shell URL
- **WHEN** the operator opens the default backend-served entrypoint with stale query params such as `legacyWorkbench`, `run`, `runSlice`, or similar removed live-shell state
- **THEN** the app hydrates the canonical functional shell route
- **AND** supported `workspace`, `tenant`, queue `view`, queue/catalog `filter`, `q`, queue `change`, and selected-change `tab` state is preserved when valid
- **AND** the browser URL is normalized to the supported shell route without those unsupported params

### Requirement: First Functional Shell Default Route
The system SHALL ship the functional tenant queue on the backend-served default route and SHALL not keep a supported hidden fallback into the removed live or legacy workbench.

#### Scenario: Operator opens the default served entrypoint
- **WHEN** the operator opens the default application entrypoint
- **THEN** the shell requests backend bootstrap data before declaring the route ready
- **AND** the default route renders backend-owned tenant queue chrome and summaries instead of the old static reference page
- **AND** the shipped route does not expose a supported toggle, bridge link, or fallback into the removed live or legacy workbench

### Requirement: Functional Repository Catalog Workspace
The system SHALL provide `Repositories` as a functional route-addressable workspace backed by the backend-owned repository catalog.

#### Scenario: Operator opens the repository catalog workspace
- **WHEN** the operator activates `Repositories` from the shell navigation or loads a supported catalog route
- **THEN** the shell renders backend-owned repository catalog entries rather than static placeholder rows
- **AND** repository selection updates active tenant context through the shared shell controller
- **AND** the workspace exposes supported handoffs for `New repository`, `New change`, and opening the selected repository's queue

#### Scenario: Operator selects a repository on a compact viewport
- **WHEN** the operator opens repository context on a compact viewport
- **THEN** the selected repository stage appears through an approved overlay or drawer interaction
- **AND** the operator can return to the same repository list context after close

### Requirement: Functional Tenant Queue Workspace
The system SHALL provide a functional tenant-scoped queue workspace backed by backend-owned change summaries.

#### Scenario: Operator opens the queue workspace for an active tenant
- **WHEN** the operator opens the default queue workspace for the active tenant
- **THEN** the shell renders backend-owned change summaries instead of static queue placeholder rows
- **AND** queue search and view filtering update the visible worklist through supported shell state
- **AND** selecting a queue row updates canonical selected-change context for downstream detail rendering

#### Scenario: Selected queue context becomes stale
- **WHEN** the active tenant or selected change context is no longer valid for the visible queue
- **THEN** the shell clears or repairs that stale context explicitly
- **AND** the shell does not fall back to a hidden legacy workbench path to recover navigation

### Requirement: Functional Selected Change Detail Workspace
The system SHALL provide a functional selected-change workspace backed by the backend-owned change-detail contract.

#### Scenario: Operator selects a change from the queue
- **WHEN** the operator selects a change from the active tenant queue
- **THEN** the shell loads and renders backend-owned detail data for that change
- **AND** the contextual workspace exposes overview, traceability, gaps, evidence, git, chief, and clarification history inside the supported shell
- **AND** the selected-change workspace becomes the primary working surface without redirecting into a hidden legacy shell

#### Scenario: Operator opens selected change context on a compact viewport
- **WHEN** selected-change detail is opened on a compact viewport
- **THEN** the detail stage is presented through an accessible overlay or drawer-style interaction
- **AND** closing that interaction returns the operator to the same queue context

### Requirement: Explicit Bootstrap Failure Visibility
The system SHALL surface bootstrap hydration failures explicitly instead of silently falling back to client-owned shell truth.

#### Scenario: Backend bootstrap is unavailable
- **WHEN** the shared bootstrap request fails at the transport, HTTP, or contract boundary
- **THEN** the shell renders an explicit failure state with actionable retry affordance
- **AND** the route does not silently render the old static reference or client-only placeholder truth
- **AND** the operator can distinguish hydration failure from an idle but healthy shell

### Requirement: Fail-Closed UI Governance
The system SHALL fail closed on platform-governance violations such as silent UI fallback behavior, route-level platform bypass, or introduction of a second primary design system without an approved change.

#### Scenario: Feature implementation bypasses the UI platform contract
- **WHEN** a feature attempts to bypass the approved platform layer, silently falls back to an alternate UI path, or introduces a second primary design system without an approved OpenSpec change
- **THEN** repository governance and verification gates detect the violation explicitly
- **AND** the build or validation workflow does not treat that violation as acceptable drift

### Requirement: Locale-Consistent Shell Semantics
The system SHALL keep the backend-served default operator shell semantically consistent for one configured locale.

#### Scenario: Operator loads the backend-served shell
- **WHEN** the operator opens the default backend-served entrypoint
- **THEN** the document language, default shell copy, and baseline form-field semantics align to the same configured locale
- **AND** mixed-language placeholders, labels, and metadata are not presented in the default shell unless they originate from backend-owned domain data
- **AND** basic interactive fields expose the metadata needed for browser and assistive-technology tooling to identify them reliably

### Requirement: Operational Operator Visual Hierarchy
The system SHALL present the default operator shell through a codex-lb-inspired operational visual hierarchy with restrained translucent chrome, bordered work panels, concise semantic accents, and a dominant shell scaffold that foregrounds current route context.

#### Scenario: Operator scans the default shell before opening later workspace slices
- **WHEN** the operator opens the default backend-served shell
- **THEN** the masthead, page header, shell metrics, queue navigation, worklist, and selected-change workspace follow one coherent operational visual system
- **AND** shell-level overview panels remain visually supportive rather than competing as a second dashboard
- **AND** semantic colors are reserved for actionable status, risk, and readiness signals rather than ornamental emphasis

### Requirement: Reference-Authoritative Operational Language
The system SHALL keep `legacy/references/operator-workbench` as the authoritative visual-language reference for the current functional queue, selected-change detail, and catalog shell until a later approved shell change supersedes it.

#### Scenario: Contributor compares the shell scaffold with the reference artifact
- **WHEN** a contributor compares the default backend-served shell with `legacy/references/operator-workbench`
- **THEN** the overall operational tone, masthead language, and section cadence remain recognizably aligned
- **AND** differences are limited to backend-owned hydration, explicit queue/catalog states, and approved rollout-specific copy
- **AND** a cosmetic token update without maintaining that operational language is not treated as sufficient implementation evidence

### Requirement: Operational Shell Signal Framing
The system SHALL frame shell-level operator signals through compact operational summary treatments that support decision-making without becoming a parallel dashboard.

#### Scenario: Operator scans shell-level status before choosing later work
- **WHEN** the operator opens the default shell with repository and tenant context available
- **THEN** the shell exposes compact metric, state, or sync signals in a restrained supporting layer
- **AND** those shell-level signals do not compete visually with the current queue workspace for primary operator attention
- **AND** the shell does not introduce a second equally weighted dashboard band above or beside the primary stage

### Requirement: Sequential Functional Shell Rollout Governance
The system SHALL define functional operator-shell work through an explicit ordered rollout that starts from the current queue, selected-change detail, and catalog shell baseline instead of reintroducing hidden fallback routes or undocumented parallel shells.

#### Scenario: Contributor proposes a new functional shell capability
- **WHEN** a contributor proposes runs, command, approval, clarification authoring, or realtime behavior for the operator shell
- **THEN** the proposal states where that capability fits in the ordered rollout sequence
- **AND** the proposal keeps the current shipped queue, selected-change detail, and catalog shell boundary explicit until its dependencies are delivered
- **AND** the proposal does not rely on reviving a removed legacy or hidden live-workbench route as the implementation shortcut
