## 1. Application Skeleton
- [ ] 1.1 Create a production app shell for the operator UI.
- [ ] 1.2 Create the Control API service that owns `change`, `run`, `gap`, `traceability`, and `evidence` state.
- [ ] 1.3 Create a dedicated Codex runtime adapter that launches and communicates with `codex app-server`.
- [ ] 1.4 Add persistent storage for runs, runtime events, approval requests, and evidence artifacts.
- [ ] 1.5 Add tenant modeling in the dimension of repository/workspace ownership.

## 2. Legacy Template Replacement
- [ ] 2.1 Port the core operator information architecture from the static prototype into the new app shell.
- [ ] 2.2 Preserve `Control Queue`, `Change Detail`, `Run Studio`, and `Chief` as first-class views in the new application.
- [ ] 2.3 Retire the legacy static template as the primary product entrypoint.

## 3. Runtime and Domain Flow
- [ ] 3.1 Implement run creation flow that starts or forks Codex threads through `codex app-server`.
- [ ] 3.2 Persist `threadId`, `turnId`, lifecycle events, and approval state for each run.
- [ ] 3.3 Normalize streamed runtime events into backend-owned run status for the UI.
- [ ] 3.4 Ensure the UI never talks to `codex app-server` directly.

## 4. Memory Model
- [ ] 4.1 Define tenant-level repository memory that survives across changes and sessions.
- [ ] 4.2 Define each change as a combined contract + working-memory object rather than a thin ticket record.
- [ ] 4.3 Bootstrap each run from tenant memory, change contract, and current change working memory instead of raw thread history alone.
- [ ] 4.4 Promote validated facts from runs back into change memory and, when appropriate, into tenant-level repository memory.
- [ ] 4.5 Replace separately maintained bead-style task memory with a derived focus/task graph attached to the change.

## 5. Change Design Clarification Loop
- [ ] 5.1 Add a planning flow where the agent can surface structured clarification questions while designing a change.
- [ ] 5.2 Support 1-3 short questions per clarification round with fixed options and an optional free-form answer path.
- [ ] 5.3 Persist clarification rounds and answers inside the change memory so later planning turns resume the same thread.
- [ ] 5.4 Allow the planning loop to continue iteratively until the change reaches a ready-to-propose state.

## 6. Verification
- [ ] 6.1 Add contract tests for the Control API and runtime adapter.
- [ ] 6.2 Add end-to-end verification for `change -> run -> review -> approval/evidence` flow.
- [ ] 6.3 Add a startup path that verifies the new app shell works without the legacy static prototype.
- [ ] 6.4 Add verification that a resumed change rehydrates the same working memory and task focus in a later session.
- [ ] 6.5 Add verification that clarification rounds can pause and resume change design without losing selected answers or free-form notes.
