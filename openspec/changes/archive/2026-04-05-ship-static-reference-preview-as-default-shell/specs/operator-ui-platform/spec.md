## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Route-Addressable Operator Context
The system SHALL keep active operator context in route-addressable navigation state so the UI can restore queue, selected change, selected run, active workspace context, and explicit hidden-shell choice after reload or browser navigation.

#### Scenario: Operator reloads while using the hidden legacy shell
- **WHEN** the operator has selected queue or detail context open through the internal legacy-shell fallback
- **AND** the operator reloads the page or returns through browser navigation
- **THEN** the shell restores the same operator context together with the explicit legacy-shell choice from navigation state
- **AND** the default route still resolves to the simple-reference shell when that flag is absent
