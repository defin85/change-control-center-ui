## ADDED Requirements

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
