## MODIFIED Requirements
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

### Requirement: Single Canonical Operational Shell
The system SHALL ship one canonical static reference shell on the backend-served default route and SHALL not keep a supported live-shell fallback in product navigation.

#### Scenario: Operator opens the default served entrypoint
- **WHEN** the operator opens the default application entrypoint
- **THEN** the operator receives the static reference shell directly
- **AND** the default route does not depend on bootstrap, queue, run, or repository live-shell state to render
- **AND** supported navigation state does not include `legacyWorkbench=1`, `workspace=runs`, or an equivalent live-shell compatibility toggle

### Requirement: Shipped Static Reference Preview Default Shell
The system SHALL ship the exact simple reference as the default backend-served shell and SHALL treat it as the only supported shipped operator route.

#### Scenario: Operator opens the default backend-served route
- **WHEN** the operator opens the default application entrypoint
- **THEN** the shell renders the literal simple-reference cadence of masthead, page header, metrics, supporting overview panels, repositories, and the preview queue plus selected-change stage
- **AND** the shell may render static copy and arrays from the shipped reference component
- **AND** the shell does not expose a user-facing link into a live workbench path

## REMOVED Requirements
### Requirement: Hidden Legacy Workbench Fallback
**Reason**: The shipped route no longer supports any live or legacy fallback shell.
**Migration**: Normalize stale route params to the static default shell and remove shipped bridge links into hidden workbench paths.
