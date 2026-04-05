## ADDED Requirements

### Requirement: Shipped Simple-Reference Default Shell
The system SHALL ship a live-data operator shell whose default backend-served route follows the simple reference in `legacy/references/operator-workbench` as the canonical shell architecture.

#### Scenario: Operator opens the default backend-served route
- **WHEN** the operator opens the default application entrypoint without an internal legacy-shell flag
- **THEN** the shell renders the simple-reference cadence of masthead, page header, metrics, supporting overview panels, repositories, and a paired queue plus selected-change stage
- **AND** all visible product data is hydrated from backend-owned state rather than static preview arrays
- **AND** the default route does not render the deprecated legacy workbench shell

### Requirement: Hidden Legacy Workbench Fallback
The system SHALL keep the previous workbench available only as a hidden deprecated fallback while excluding it from canonical product and proof paths.

#### Scenario: Internal route explicitly requests the deprecated shell
- **WHEN** navigation state includes the internal legacy-shell flag
- **THEN** the app may render the deprecated legacy workbench shell for compatibility or comparison
- **AND** reload and browser history preserve that explicit shell choice
- **AND** visible product navigation does not advertise the fallback as a normal UI choice

#### Scenario: Canonical UI verification runs
- **WHEN** smoke or platform verification exercises the default backend-served shell
- **THEN** the proofs target the shipped simple-reference shell
- **AND** passing verification does not depend on the deprecated fallback path

## MODIFIED Requirements

### Requirement: Workflow-Oriented Operator Workbench Surfaces
The system SHALL expose a workflow-oriented operator shell whose default route uses the shipped simple-reference hierarchy while keeping the primary surfaces and actions required to inspect and advance change-driven work.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport without the internal legacy-shell flag
- **THEN** the shell shows simple-reference masthead search and global actions
- **AND** the shell shows compact metrics and overview context in the reference section flow
- **AND** the shell shows repositories and a paired queue plus contextual selected-change workspace in that same simple-reference page flow
- **AND** heavy workflow surfaces remain available without restoring the previous equal-weight dashboard shell

#### Scenario: Operator inspects a selected change
- **WHEN** a change is selected in the control queue
- **THEN** the selected-change stage first presents the simple-reference summary, operator note, timeline, and primary action cluster
- **AND** the contextual workspace still provides tabs for `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, `Chief`, and `Clarifications`
- **AND** the contextual workspace still exposes actions for `Run next step`, `Open run studio`, `Escalate`, and `Mark blocked by spec`
- **AND** those deeper workflow surfaces remain subordinate to the default simple-reference selected-change stage instead of restoring the deprecated shell composition

### Requirement: Route-Addressable Operator Context
The system SHALL keep active operator context in route-addressable navigation state so the UI can restore queue, selected change, selected run, active workspace context, and explicit hidden-shell choice after reload or browser navigation.

#### Scenario: Operator reloads while using the hidden legacy shell
- **WHEN** the operator has selected queue or detail context open through the internal legacy-shell fallback
- **AND** the operator reloads the page or returns through browser navigation
- **THEN** the shell restores the same operator context together with the explicit legacy-shell choice from navigation state
- **AND** the default route still resolves to the simple-reference shell when that flag is absent
