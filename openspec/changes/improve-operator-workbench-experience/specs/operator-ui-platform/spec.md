## ADDED Requirements

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
