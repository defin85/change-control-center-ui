## MODIFIED Requirements
### Requirement: Route-Addressable Operator Context
The system SHALL keep active operator context in route-addressable navigation state so the UI can restore queue, repository catalog, runs workspace, selected change, selected run, active workspace context, and operator filters after reload or browser navigation.

#### Scenario: Operator reloads while using the canonical shell
- **WHEN** the operator has queue, catalog, or runs context open in the canonical shell
- **AND** the operator reloads the page or returns through browser navigation
- **THEN** the shell restores the same active workspace, tenant, selected change, selected run, and operator filters from navigation state
- **AND** the default route does not require an internal legacy-shell flag to reach the canonical live workspace

### Requirement: Workflow-Oriented Operator Workbench Surfaces
The system SHALL expose workflow-oriented operator workbench surfaces through the canonical operator UI rather than through a hidden legacy fallback.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport
- **THEN** the shell renders the live canonical operator workbench
- **AND** the top-level workspace navigation exposes `Workbench`, `Repositories`, and `Runs`
- **AND** queue, change, and run workflows do not require the deprecated legacy workbench path
- **AND** the app does not expose a supported route toggle into the removed legacy shell

#### Scenario: Operator inspects a selected change
- **WHEN** a change is inspected through the canonical workbench
- **THEN** the contextual workspace still provides tabs for `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, `Chief`, and `Clarifications`
- **AND** the contextual workspace still exposes actions for `Run next step`, `Open runs`, `Escalate`, and `Mark blocked by spec`
- **AND** run-focused inspection routes through the canonical shell instead of a legacy-only `Run Studio` surface

### Requirement: Operational Operator Visual Hierarchy
The system SHALL present the default operator workbench through a codex-lb-inspired operational visual hierarchy with restrained translucent chrome, bordered work panels, concise semantic accents, and a clearly dominant selected-change workspace.

#### Scenario: Operator drills into run inspection from the operational shell
- **WHEN** the operator opens the `Runs` workspace or selects a run from change detail
- **THEN** the run-focused surface remains available without turning the shell into a second competing dashboard
- **AND** the run surface shares the same operational visual system as the surrounding shell
- **AND** raw runtime payloads remain visually demoted behind higher-signal operational context

### Requirement: Single Canonical Operational Shell
The system SHALL ship one canonical live operator shell and SHALL remove deprecated route toggles or fallback shells from supported product navigation.

#### Scenario: Operator opens the default served entrypoint
- **WHEN** the operator opens the default application entrypoint
- **THEN** the operator receives the canonical live operator shell directly
- **AND** the default route does not render a static preview or deprecated workbench fallback
- **AND** supported navigation state does not include `legacyWorkbench=1` or an equivalent compatibility toggle

## ADDED Requirements
### Requirement: Route-Addressable Runs Workspace
The system SHALL provide a tenant-scoped top-level `Runs` workspace in the canonical operator UI for cross-change run monitoring and inspection.

#### Scenario: Operator opens the runs workspace
- **WHEN** the operator selects `Runs` from the top-level workspace navigation
- **THEN** the shell sets route state to `workspace=runs`
- **AND** the shell preserves the active tenant context and operator search or filter context where still valid
- **AND** the runs workspace restores after reload or browser navigation without requiring a legacy route

### Requirement: Scan-Optimized Runs Workspace Surface
The system SHALL present tenant-scoped runs as a scan-optimized operational worklist rather than as a payload-first inspection dump.

#### Scenario: Operator scans runs that need attention
- **WHEN** the active tenant has multiple recent runs
- **THEN** the runs workspace defaults to an attention-first slice that surfaces running, failed, approval-blocked, or otherwise operator-relevant runs before full history
- **AND** each run row exposes run identity, linked change identity, run kind, concise status, outcome or next-step context, and recent activity in a small number of readable regions
- **AND** the workspace still offers an explicit way to switch into fuller history without leaving the canonical shell

#### Scenario: Operator uses the runs workspace on a compact viewport
- **WHEN** the operator opens the runs workspace on a compact viewport
- **THEN** the run list remains readable as stacked rows or cards
- **AND** selecting a run opens its detail through a platform-approved overlay, drawer, or paired-stage path
- **AND** the compact runs workspace does not depend on horizontal overflow as the primary interaction mode

### Requirement: Canonical Run Detail Handoff
The system SHALL keep selected run inspection tied to backend-owned change context even when the operator enters from the top-level runs workspace.

#### Scenario: Operator selects a run from the runs workspace
- **WHEN** the operator selects a run in the top-level runs workspace
- **THEN** the shell reveals a selected run detail stage with linked change identity, approvals, evidence or events, and normalized run artifacts
- **AND** the run detail stage provides an explicit handoff back to the owning change
- **AND** choosing that handoff restores canonical change context through route-addressable state instead of redirecting into a legacy-only run surface

## REMOVED Requirements
### Requirement: Shipped Static Reference Preview Default Shell
**Reason**: The product is migrating to a live canonical UI and should not keep a static preview route as the default operator shell.
**Migration**: Render the canonical live operator shell from the default route and keep any retained reference artifacts outside the shipped product path.

### Requirement: Hidden Legacy Workbench Fallback
**Reason**: New canonical run inspection must not depend on a deprecated hidden workbench route.
**Migration**: Replace remaining legacy-only run workflows with the canonical `Runs` workspace and new-UI change handoff, then delete the fallback path in the same change.
