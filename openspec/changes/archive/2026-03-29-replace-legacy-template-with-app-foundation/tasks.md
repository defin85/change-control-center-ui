## 1. Application Skeleton
- [x] 1.1 Create a production app shell for the operator UI.
- [x] 1.2 Create the Control API service that owns `change`, `run`, `gap`, `traceability`, and `evidence` state.
- [x] 1.3 Create a dedicated Codex runtime adapter that launches or connects to `codex app-server` over `stdio` and `websocket`.
- [x] 1.4 Add persistent storage for runs, runtime events, approval requests, and evidence artifacts.
- [x] 1.5 Add tenant modeling in the dimension of repository/workspace ownership.

## 2. Legacy Template Replacement
- [x] 2.1 Port the core operator information architecture from the static prototype into the new app shell.
- [x] 2.2 Preserve `Control Queue`, `Change Detail`, `Run Studio`, and `Chief` as first-class views in the new application.
- [x] 2.3 Retire the legacy static template as the primary product entrypoint.

## 3. Runtime and Domain Flow
- [x] 3.1 Implement run creation flow that starts or forks Codex threads through `codex app-server`.
- [x] 3.2 Persist `threadId`, `turnId`, lifecycle events, and approval state for each run.
- [x] 3.3 Normalize streamed runtime events into backend-owned run status for the UI.
- [x] 3.4 Ensure the UI never talks to `codex app-server` directly.
- [x] 3.5 Make transport selection (`stdio` or `websocket`) adapter-owned configuration that does not change product API contracts.

## 4. Memory Model
- [x] 4.1 Define tenant-level repository memory that survives across changes and sessions.
- [x] 4.2 Define each change as a combined contract + working-memory object rather than a thin ticket record.
- [x] 4.3 Bootstrap each run from tenant memory, change contract, and current change working memory instead of raw thread history alone.
- [x] 4.4 Promote validated facts from runs back into change memory and, when appropriate, into tenant-level repository memory.
- [x] 4.5 Replace separately maintained bead-style task memory with a derived focus/task graph attached to the change.

## 5. Change Design Clarification Loop
- [x] 5.1 Add a planning flow where the agent can surface structured clarification questions while designing a change.
- [x] 5.2 Support 1-3 short questions per clarification round with fixed options and an optional free-form answer path.
- [x] 5.3 Persist clarification rounds and answers inside the change memory so later planning turns resume the same thread.
- [x] 5.4 Allow the planning loop to continue iteratively until the change reaches a ready-to-propose state.

## 6. Verification
- [x] 6.1 Add contract tests for the Control API and runtime adapter, including both `stdio` and `websocket` transport modes.
- [x] 6.2 Add end-to-end verification for `change -> run -> review -> approval/evidence` flow.
- [x] 6.3 Add a startup path that verifies the new app shell works without the legacy static prototype.
- [x] 6.4 Add verification that a resumed change rehydrates the same working memory and task focus in a later session.
- [x] 6.5 Add verification that clarification rounds can pause and resume change design without losing selected answers or free-form notes.
