# operator-ui-platform Specification

## Purpose
Define the current operator UI platform truth after the static-shell reset: approved UI foundations, project-owned composition and contract boundaries, the shipped static backend-served shell, and the governance that sequences future functional shell rollout.

## Requirements
### Requirement: Single Operator UI Foundation Stack
The system SHALL standardize the React operator UI on one primitive interaction foundation, one workflow state-model layer for complex operator flows, one tabular data foundation, and one project-owned platform layer for top-level UI composition.

#### Scenario: Developer adds or maintains an operator UI surface
- **WHEN** a developer implements or updates an operator UI surface such as a static reference artifact, catalog prototype, authoring dialog, or later functional workspace
- **THEN** the surface uses the approved primitive, workflow-state, table, and platform foundations for their respective roles
- **AND** the implementation does not introduce a parallel primary UI stack for the same responsibilities

### Requirement: Project-Owned Platform Composition
The system SHALL require route-level and workspace-level operator surfaces to compose through project-owned platform shells rather than directly from raw primitive or third-party page containers.

#### Scenario: Route or workspace code needs top-level composition
- **WHEN** route-level or workspace-level operator code needs master-detail layout, detail rendering, status treatment, or authoring entry points
- **THEN** it uses approved project-owned platform shells for those concerns
- **AND** raw primitive components remain implementation details inside the platform layer or feature internals rather than the primary route-composition mechanism

### Requirement: Shared Web Contract Boundary
The system SHALL route Control API traffic through a shared web contract boundary that centralizes request execution, response validation, error normalization, and transport or authentication failure handling.

#### Scenario: Platform-owned code invokes a Control API operation
- **WHEN** platform-owned code issues a Control API request for repository, tenant, change, or other operator data
- **THEN** the shared contract boundary emits normalized success or failure results for UI handling
- **AND** feature code does not duplicate low-level fetch and parsing logic
- **AND** invalid payloads are treated as contract failures instead of being silently accepted

### Requirement: Explicit Workflow State Boundaries
The system SHALL model complex operator workflow transitions through explicit workflow state boundaries instead of scattering them across ad hoc local effect chains.

#### Scenario: Platform-owned adjunct flow has multi-step transitions
- **WHEN** a platform-owned flow coordinates pending, success, and failure transitions such as repository authoring or future command execution
- **THEN** the flow uses an explicit workflow state boundary with defined transitions
- **AND** simple presentational toggles or single-field drafts are not forced into the same workflow layer when that would add unnecessary complexity

### Requirement: Route-Addressable Operator Context
The system SHALL keep the shipped backend-served shell on one canonical static route and SHALL normalize unsupported live-workbench query state away from that route.

#### Scenario: Operator opens an old bookmarked live-shell URL
- **WHEN** the operator opens the default backend-served entrypoint with stale query params such as `legacyWorkbench`, `workspace`, `runSlice`, `change`, `run`, or similar live-shell state
- **THEN** the app renders the canonical static reference shell
- **AND** the browser URL is normalized to the supported static entrypoint without those unsupported params

### Requirement: Workflow-Oriented Operator Workbench Surfaces
The system SHALL not expose workflow-oriented live workbench surfaces through the shipped backend-served route while the static reference shell is the canonical default.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport
- **THEN** the shell renders the static reference composition instead of a live workflow workbench
- **AND** the shipped route does not expose a supported toggle, bridge link, or fallback into the removed live or legacy workbench

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
The system SHALL present the default operator shell through a codex-lb-inspired operational visual hierarchy with restrained translucent chrome, bordered work panels, concise semantic accents, and one dominant paired queue-plus-selected-change stage.

#### Scenario: Operator scans the default shell before opening future functional work
- **WHEN** the operator opens the default backend-served shell
- **THEN** the masthead, page header, metric row, supporting overview panels, repositories section, and paired live-queue plus selected-change stage follow one coherent operational visual system
- **AND** shell-level overview panels remain visually supportive rather than competing with the paired queue-plus-selected-change stage
- **AND** semantic colors are reserved for actionable status, risk, and approval-style signals rather than ornamental emphasis

### Requirement: Single Canonical Operational Shell
The system SHALL ship one canonical static reference shell on the backend-served default route and SHALL not keep a supported live-shell fallback in product navigation.

#### Scenario: Operator opens the default served entrypoint
- **WHEN** the operator opens the default application entrypoint
- **THEN** the operator receives the static reference shell directly
- **AND** the default route does not depend on bootstrap, queue, run, or repository live-shell state to render
- **AND** supported navigation state does not include `legacyWorkbench=1`, `workspace=runs`, or an equivalent live-shell compatibility toggle

### Requirement: Shipped Static Reference Default Shell
The system SHALL ship the exact static reference shell as the default backend-served shell and SHALL treat it as the only supported shipped operator route.

#### Scenario: Operator opens the default backend-served route
- **WHEN** the operator opens the default application entrypoint
- **THEN** the shell renders the literal shipped reference cadence of masthead, page header, metrics, supporting overview panels, repositories, and the preview queue plus selected-change stage
- **AND** the shell may render static copy and arrays from the shipped reference component
- **AND** the shell does not expose a user-facing link into a live workbench path

### Requirement: Reference-Authoritative Static Shell Composition
The system SHALL treat `legacy/references/operator-workbench` as the authoritative visual and structural reference for the shipped static default shell until a later approved functional-shell change supersedes it.

#### Scenario: Contributor compares the shipped shell with the reference artifact
- **WHEN** a contributor compares the default backend-served shell with `legacy/references/operator-workbench`
- **THEN** the overall composition, dominant surfaces, and section hierarchy are recognizably the same
- **AND** differences are limited to repo-owned delivery wrappers, approved copy updates, or other explicitly shipped static-reference adjustments
- **AND** a cosmetic token or background update without structural parity is not treated as sufficient implementation evidence

### Requirement: Operational Shell Signal Framing
The system SHALL frame shell-level operator signals through compact operational summary treatments that support decision-making without becoming a parallel dashboard.

#### Scenario: Operator scans shell-level status before choosing later work
- **WHEN** the operator opens the default shell with repository and queue preview context available
- **THEN** the shell exposes compact metric, state, or sync signals in a restrained supporting layer
- **AND** those shell-level signals do not compete visually with the paired queue-plus-selected-change stage for primary operator attention
- **AND** the shell does not introduce a second equally weighted dashboard band above or beside the primary stage

### Requirement: Sequential Functional Shell Rollout Governance
The system SHALL define functional operator-shell work through an explicit ordered rollout that starts from the static shipped shell baseline instead of reintroducing hidden fallback routes or undocumented parallel shells.

#### Scenario: Contributor proposes a new functional shell capability
- **WHEN** a contributor proposes queue, detail, runs, command, or realtime behavior for the operator shell
- **THEN** the proposal states where that capability fits in the ordered rollout sequence
- **AND** the proposal keeps the current shipped static shell boundary explicit until its dependencies are delivered
- **AND** the proposal does not rely on reviving a removed legacy or hidden live-workbench route as the implementation shortcut
