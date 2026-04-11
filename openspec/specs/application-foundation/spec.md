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
The system SHALL replace the old filesystem-level static prototype as the primary product entrypoint while moving the shipped backend-served shell into a backend-owned functional scaffold.

#### Scenario: Operator opens the new application
- **WHEN** an operator opens the main application entrypoint
- **THEN** the operator sees the backend-served functional shell scaffold rather than the old standalone prototype/template
- **AND** the same application deployment still provides the backend-owned Control API and runtime foundation behind that shipped shell

### Requirement: Truthful Shipped Shell Baseline
The system SHALL keep the current shipped backend-served shell baseline aligned across product docs, readiness gates, and future functional rollout proposals.

#### Scenario: Contributor plans follow-up UI functionality after the shell bootstrap rollout
- **WHEN** a contributor reads repository docs, current specs, or a new UI change proposal
- **THEN** the current shipped backend-served route is described as the first functional shell scaffold hydrated from backend bootstrap data
- **AND** later interactive workspaces or workflows are presented as planned follow-up work rather than already shipped behavior
- **AND** readiness guidance does not treat removed live-shell behavior as current product truth

### Requirement: Backend-Served Shell Bootstrap Contract
The system SHALL hydrate the functional backend-served operator shell through backend-owned bootstrap data instead of client-owned sample state.

#### Scenario: Operator opens the first functional shell build
- **WHEN** the operator opens a functional backend-served shell entrypoint
- **THEN** the shell requests and validates the backend bootstrap contract before rendering functional workspace state
- **AND** tenant and repository-catalog context come from backend-owned data rather than hard-coded sample arrays
- **AND** bootstrap contract failure is surfaced explicitly instead of silently falling back to client-only shell truth

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

### Requirement: Backend-Owned Tenant Creation
The system SHALL allow operators to create a new tenant/project entry through a backend-owned API rather than requiring seed data or direct store edits.

#### Scenario: Operator creates a new project workspace
- **WHEN** the operator submits a valid new project entry
- **THEN** the backend persists and returns the canonical tenant record with its tenant id, name, repo path, and description
- **AND** the new tenant becomes available through the same bootstrap and tenant-selection contracts as seeded tenants

### Requirement: Backend-Owned Change Deletion
The system SHALL allow operators to remove a change through a backend-owned API that also cleans up backend-owned child records for that change.

#### Scenario: Operator deletes an existing change
- **WHEN** the operator confirms deletion of an existing change
- **THEN** the backend removes the change and its associated runs, approvals, clarification rounds, run events, and evidence records
- **AND** subsequent queue or detail reads do not return orphaned backend-owned records for that deleted change

### Requirement: Repo-Owned Local Runtime Launcher
The system SHALL provide one repo-owned launcher for local stack build and runtime lifecycle management across explicit `dev`, `served`, and deterministic `e2e` profiles.

#### Scenario: Contributor starts a supported local stack profile
- **WHEN** a contributor starts the local stack through the repository launcher
- **THEN** the launcher starts the processes required for the selected profile using the documented ports and health checks
- **AND** the launcher fails closed instead of silently reusing an unrelated process that already occupies a required port
- **AND** the documented local runbook points to the launcher rather than duplicating raw lifecycle commands

#### Scenario: Contributor manages the stack lifecycle after startup
- **WHEN** a contributor runs repo-owned lifecycle commands such as `stop`, `restart`, `status`, or `logs`
- **THEN** the launcher manages only repository-owned processes recorded in its runtime state directory
- **AND** the contributor can inspect process state and logs without manually finding PIDs or reconstructing command lines

### Requirement: Backend-Owned Repository Catalog Summaries
The system SHALL expose backend-owned repository catalog summaries so operators can browse tenant/workspace entries without stitching together cross-tenant state in the browser.

#### Scenario: Operator opens the repository catalog
- **WHEN** the operator requests repository catalog data from the product backend
- **THEN** the backend returns one canonical catalog entry per tenant/workspace
- **AND** each entry includes the tenant id, name, repo path, description, queue or change-load summary, and latest activity metadata derived from backend-owned state
- **AND** the browser does not need to fetch every tenant queue separately just to render a portfolio-level repository list

#### Scenario: Newly created repository appears in the catalog
- **WHEN** the operator creates a new repository workspace through the backend-owned tenant creation flow
- **THEN** the canonical tenant record becomes available through the repository catalog contract immediately
- **AND** the catalog represents the repository's empty-state workload explicitly instead of omitting the new tenant from management surfaces

### Requirement: Canonical Orchestrator Owner Contract
The system SHALL model each change `owner` as a structured backend-owned orchestrator contract with durable `id` and operator-facing `label`, and SHALL project that contract through canonical change summary and change detail contracts.

#### Scenario: Operator scans ownership in the queue
- **WHEN** the backend returns bootstrap or tenant change-list data for the operator workbench
- **THEN** each change summary includes the canonical `owner.id` and `owner.label` for the orchestrator responsible for that change
- **AND** the browser does not infer change ownership from client-only sample data, active run selection, or transient Codex session identifiers
- **AND** queue-level ownership remains tenant-scoped backend truth

#### Scenario: Operator compares queue ownership with change detail
- **WHEN** the operator opens change detail for a change that was visible in the queue
- **THEN** `owner.id` and `owner.label` in detail match the same backend-owned orchestrator contract shown in the queue summary
- **AND** queue and detail responses do not use different meanings or shapes for `owner`

#### Scenario: Orchestrator runtime session is restarted
- **WHEN** the live Codex app or CLI session backing an orchestrator is restarted, rebound, or replaced
- **THEN** the durable `owner.id` for the change remains stable
- **AND** runtime session lineage remains separate from the `owner` contract
- **AND** a session restart does not require the UI to reinterpret change ownership from transport metadata
