## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Workflow-Oriented Operator Workbench Surfaces
The system SHALL expose a workflow-oriented operator workbench shell whose default desktop queue workspace follows the reference-authoritative page flow while preserving the primary surfaces and actions required to inspect and advance change-driven work.

#### Scenario: Operator opens the main shell on desktop
- **WHEN** the operator opens the main application entrypoint on a desktop viewport
- **THEN** the shell shows masthead-level search and global actions
- **AND** the shell shows compact overview and repository context in supporting sections rather than through a separate dashboard shell
- **AND** the shell shows a paired live queue and contextual selected-change workspace in the same reference-parity page flow
- **AND** all visible product data comes from backend-owned state rather than static client-only mock state

#### Scenario: Operator inspects a selected change
- **WHEN** a change is selected in the control queue
- **THEN** the selected-change workspace remains the dominant pane in the paired queue and detail stage
- **AND** the contextual workspace still provides tabs for `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, `Chief`, and `Clarifications`
- **AND** the contextual workspace still exposes actions for `Run next step`, `Open run studio`, `Escalate`, and `Mark blocked by spec`
- **AND** auxiliary workflow surfaces do not force the old equal-weight dashboard structure to remain in place

#### Scenario: Operator opens run studio from change detail
- **WHEN** the operator opens run studio from the selected change context or selects a run from the `Runs` tab
- **THEN** the run-inspection surface remains available as a subordinate workflow surface linked to the selected run
- **AND** the operator can return focus to change detail without losing the selected change context
- **AND** run lineage, approvals, evidence, and clarification context remain available from backend-owned data

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
