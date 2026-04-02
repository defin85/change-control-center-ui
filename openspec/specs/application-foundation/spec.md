# application-foundation Specification

## Purpose
Define the production application foundation that replaces the legacy static template with a backend-owned, tenant-scoped Change Control Center composed of a React operator UI, a product Control API, and a dedicated Codex runtime integration layer.
## Requirements
### Requirement: Production Application Skeleton
The system SHALL provide a production-oriented application skeleton composed of an operator UI, a backend Control API, and a Codex runtime integration layer.

#### Scenario: Developer starts the new application stack
- **WHEN** a developer launches the local application stack
- **THEN** the operator UI starts against a real backend entrypoint
- **AND** the backend exposes product-owned APIs for change and run data
- **AND** Codex execution is reached through a backend-owned runtime layer

### Requirement: Legacy Template Replacement
The system SHALL replace the current static prototype/template as the primary product entrypoint while preserving the existing operator workflows validated in the prototype.

#### Scenario: Operator opens the new application
- **WHEN** an operator opens the main application entrypoint
- **THEN** the operator sees the product shell rather than the legacy static template
- **AND** the workflows for `Control Queue`, `Change Detail`, `Run Studio`, and `Chief` remain available

### Requirement: Backend-Owned Change State
The system SHALL keep `change`, `run`, `gap`, `traceability`, and `evidence` as backend-owned persistent state rather than deriving product state from Codex thread history alone.

#### Scenario: Backend persists a new run
- **WHEN** an operator creates a new run for an existing change
- **THEN** the backend records the run before Codex execution starts
- **AND** the run remains addressable even if the Codex process restarts

### Requirement: Tenant-Scoped Repository Boundary
The system SHALL scope memory, changes, runs, and durable repository knowledge by tenant in the dimension of repository/workspace.

#### Scenario: Two repositories use the system
- **WHEN** the system serves two different repositories
- **THEN** each repository has its own tenant-scoped changes and memory
- **AND** one repository's change history and durable memory are not mixed into another repository's task thread

### Requirement: Change as Primary Task Thread
The system SHALL treat each change as the primary durable task thread for an agent, combining the change contract, working memory, active focus, and links to execution runs.

#### Scenario: Agent resumes a change in a later session
- **WHEN** the agent resumes work on an existing change after an earlier session ended
- **THEN** the system restores the change's contract, current understanding, and active focus
- **AND** the agent continues along the same change thread instead of reconstructing context from scattered artifacts

### Requirement: Change Memory Separates Contract from Working Context
The system SHALL separate normative change contract data from mutable working-memory data within each change.

#### Scenario: Change contains both requirements and current understanding
- **WHEN** the system stores change memory
- **THEN** accepted scope, goals, and acceptance conditions remain identifiable as contract data
- **AND** summaries, open questions, decisions, and temporary task focus remain identifiable as working-memory data

### Requirement: Run Bootstrap Uses Curated Memory
The system SHALL bootstrap each run from tenant memory, change contract, and compacted change working memory rather than relying on raw prior turn history alone.

#### Scenario: Chief starts a follow-up run
- **WHEN** the system starts a new run for an existing change
- **THEN** the runtime adapter receives a curated memory packet for that change
- **AND** the run does not require replaying the full raw execution transcript to regain task context

### Requirement: Derived Focus Replaces Parallel Bead Memory
The system SHALL allow the task graph or execution focus for a change to be derived from change memory rather than requiring a separately curated bead-style memory layer for the same work.

#### Scenario: Operator inspects next focus items for a change
- **WHEN** the operator opens a change with active work
- **THEN** the system presents current focus items and task progression derived from the change memory
- **AND** the operator is not required to maintain a second parallel task-memory artifact for that same change

### Requirement: Interactive Clarification Loop for Change Design
The system SHALL support iterative clarification rounds while a change is being designed so the agent can surface ambiguities as structured question-and-answer prompts instead of relying on free-form transcript inspection alone.

#### Scenario: Agent blocks on ambiguity during change design
- **WHEN** the agent cannot complete a sound change design without additional operator input
- **THEN** the system creates a clarification round attached to the current change
- **AND** the round contains one to three short questions for the operator
- **AND** the change remains on the same planning thread after the operator responds

### Requirement: Clarification Questions Support Options and Free-Form Input
The system SHALL allow each clarification question to present fixed answer options and, when needed, an operator-provided free-form answer path.

#### Scenario: Operator answers a clarification round
- **WHEN** the operator receives a clarification question
- **THEN** the operator can choose from the offered options
- **AND** the operator can provide additional free-form input when the question or round allows it
- **AND** the selected option and free-form note are stored as part of the change memory

### Requirement: Clarification State Persists Across Sessions
The system SHALL persist clarification rounds and answers as part of the change state so change design can pause and resume without losing ambiguity resolution history.

#### Scenario: Change design resumes after interruption
- **WHEN** a change returns to planning after a session break
- **THEN** the system restores prior clarification rounds and their answers
- **AND** later planning turns can use those answers without asking the same resolved question again

### Requirement: Codex App-Server Runtime Integration
The system SHALL integrate interactive Codex execution through `codex app-server` via a runtime adapter that supports both `stdio` and `websocket` transports instead of relying on PTY mirroring of the terminal UI as the primary execution interface.

#### Scenario: Runtime adapter starts an interactive session
- **WHEN** the backend requests a Codex-backed run using the default local transport
- **THEN** the runtime adapter launches or connects to `codex app-server`
- **AND** the adapter can exchange structured protocol messages over `stdio`
- **AND** the adapter exchanges structured protocol messages rather than parsing terminal text

#### Scenario: Deployment selects websocket transport
- **WHEN** the deployment config selects `websocket` transport for `codex app-server`
- **THEN** the runtime adapter connects to the configured `ws://` endpoint for interactive Codex execution
- **AND** the backend-owned run, approval, and event contracts remain the same as in `stdio` mode
- **AND** the adapter exchanges structured protocol messages rather than parsing terminal text

### Requirement: Run-to-Thread Lineage
The system SHALL map each run to a distinct Codex thread lineage and persist the corresponding Codex identifiers for audit and resume behavior.

#### Scenario: Backend creates a follow-up run
- **WHEN** the system creates a targeted review or fix run
- **THEN** the backend stores the associated `threadId` and `turnId`
- **AND** the run may fork from a previous run lineage instead of appending all work to one long-lived thread

### Requirement: Structured Runtime Event Capture
The system SHALL persist structured runtime events, approval requests, and terminally relevant run outputs in a normalized form that the product UI can query.

#### Scenario: Codex requests approval
- **WHEN** `codex app-server` emits an approval request during a run
- **THEN** the backend stores the request as a first-class approval record linked to the run
- **AND** the UI can render the pending decision without reading raw transport frames

### Requirement: Memory Promotion Across Sessions
The system SHALL promote validated facts from execution runs back into change memory and, when approved as durable knowledge, into tenant-level repository memory.

#### Scenario: Review run discovers a durable repository fact
- **WHEN** a run produces a validated fact that remains relevant beyond the current run
- **THEN** the system stores that fact in the change memory
- **AND** the system can promote it to tenant-level repository memory after approval or acceptance

### Requirement: UI Uses Backend-Normalized Runtime State
The system SHALL require the browser UI to read run status, approvals, and evidence from the product backend rather than connecting directly to `codex app-server`.

#### Scenario: UI renders a running change
- **WHEN** an operator opens the detail view for a running change
- **THEN** the UI loads normalized run state from the backend
- **AND** the browser does not require direct access to Codex transport credentials or process endpoints

### Requirement: Canonical Promoted Fact Records
The system SHALL treat a promoted tenant-memory fact as a canonical persisted record and return that canonical record shape from promotion mutations and subsequent backend reads.

#### Scenario: Operator promotes a durable fact from a change
- **WHEN** the operator promotes a validated fact from change memory into tenant memory
- **THEN** the backend persists and returns the fact with its persisted identity, tenant scope, title, body, and approval status
- **AND** later change-detail or tenant-memory reads expose the same canonical fact record fields
- **AND** the browser contract boundary does not reject the successful promotion response because it narrows backend-owned fact metadata

### Requirement: Historical Clarification Round Integrity
The system SHALL keep answered clarification rounds as historical records and accept new clarification submissions only for the currently open round.

#### Scenario: Operator revisits a change after answering a clarification round
- **WHEN** the operator opens a change that already has one or more answered clarification rounds
- **THEN** the answered rounds remain visible as historical planning evidence
- **AND** those answered rounds are not presented as editable or submittable operator forms
- **AND** a later open clarification round starts with a clean draft state rather than silently inheriting answers from an earlier round

