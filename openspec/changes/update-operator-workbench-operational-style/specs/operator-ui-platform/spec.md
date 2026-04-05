## REMOVED Requirements

### Requirement: Editorial Operator Visual Hierarchy
**Reason**: The legacy editorial shell is intentionally retired. This change replaces it with the codex-lb-inspired operational workbench as the only supported canonical visual contract.
**Migration**: The backend-served default shell, browser proofs, and served entrypoint all move to the operational shell. Legacy editorial presentation affordances and preview-only shell paths are not preserved.

## ADDED Requirements

### Requirement: Operational Operator Visual Hierarchy
The system SHALL present the default operator workbench through a codex-lb-inspired operational visual hierarchy with restrained translucent chrome, bordered work panels, concise semantic accents, and a clearly dominant selected-change workspace.

#### Scenario: Operator opens the canonical shell on desktop
- **WHEN** the operator opens the default backend-served desktop shell
- **THEN** the selected-change workspace reads as the primary action surface
- **AND** shell chrome, repository context, search, and summary signals are framed through compact supporting surfaces rather than a document-like hero treatment
- **AND** the shell does not preserve the legacy editorial visual contract as a parallel or fallback presentation mode

#### Scenario: Operator scans the control queue in the operational shell
- **WHEN** the operator scans the queue for the next change to inspect
- **THEN** queue rows read as a disciplined operational worklist optimized for scanning state, blocker, owner, and next-step context
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

### Requirement: Operational Shell Signal Framing
The system SHALL frame shell-level operator signals through compact operational summary treatments that support decision-making without becoming a parallel dashboard.

#### Scenario: Operator scans shell-level status before choosing work
- **WHEN** the operator opens the default workbench with repository and queue context available
- **THEN** the shell exposes compact metric, state, or sync signals in a restrained supporting layer
- **AND** semantic colors are reserved for actionable status, risk, and approval state rather than ornamental emphasis
- **AND** those shell-level signals do not compete visually with the selected-change workspace for primary operator attention
