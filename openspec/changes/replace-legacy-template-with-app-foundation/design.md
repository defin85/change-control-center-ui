## Context
`Change Control Center UI` is currently a static prototype built from `index.html`, `styles.css`, and `app.js`. It models the right operator workflows, but it is still a legacy template rather than a real application. The next step is not a narrow runtime integration by itself. The next step is to replace that prototype with a production-oriented app foundation while preserving the domain model and operator flows that the prototype already validated.

The chosen application shape is:
- React/TypeScript operator frontend
- FastAPI Control API as the product backend
- Dedicated Codex runtime adapter behind the backend
- `codex app-server` as the interactive Codex execution boundary

The chosen Codex integration model is `codex app-server`, not PTY mirroring of the CLI TUI. This keeps approvals, thread history, and streamed agent events machine-readable while still allowing the broader app skeleton to stay backend-owned.

The current pain point is not only the legacy template. It is also the maintenance burden of separate artifacts for:
- stable specs
- change-local execution context
- bead/task tracking

The foundation should collapse that into a layered memory model where `change` becomes the main durable task thread for the agent.

The planning phase also needs a first-class clarification loop. When a new change is under design, the agent should be able to stop on ambiguity, ask structured questions with answer options, accept free-form clarification from the operator, and then continue designing the same change thread.

## Goals / Non-Goals
- Goals:
  - Replace the legacy static prototype with a real application skeleton.
  - Preserve the proven operator workflows and IA from the prototype.
  - Define a backend-owned domain model for `change` and `run`.
  - Define tenant scope in the dimension of repository/workspace.
  - Make `change` the primary durable task thread for an agent.
  - Support iterative clarification rounds while a change is being designed.
  - Establish clear service boundaries between frontend, backend, and Codex runtime.
  - Integrate Codex through `codex app-server` using a stable adapter boundary.
  - Preserve structured approvals, runtime events, and evidence.
  - Keep the browser isolated from direct Codex transport concerns.
- Non-Goals:
  - Fully implement every service in this change proposal.
  - Finalize every database table or migration detail.
  - Preserve the current static-file startup path as the main user path.

## Decisions
- Decision: The new product shell uses a frontend app plus backend services instead of extending the current static-file prototype.
  - Why: The prototype is useful as a UX reference, but it is the wrong structural base for persistent runtime-driven behavior.
- Decision: The current prototype views and operator IA are migrated, not discarded.
  - Why: `Control Queue`, `Change Detail`, `Run Studio`, and `Chief` already encode the product's core operator workflow.
- Decision: Tenant scope is modeled per repository/workspace.
  - Why: Memory, changes, runs, and specs must be isolated in the same dimension as the codebase the agent operates on.
- Decision: The product backend is the source of truth for `change`, `run`, `gap`, `traceability`, and `evidence`.
  - Why: Codex threads are execution context, not the product data model.
- Decision: Tenant memory is split into stable repository memory and change-scoped memory.
  - Why: Some knowledge should survive across changes, while task-specific understanding should stay attached to one change thread.
- Decision: Each change contains both a normative contract and a mutable working-memory layer.
  - Why: The agent needs one primary place for goals, scope, constraints, current understanding, open questions, and active focus.
- Decision: Bead-style task tracking is derived from change memory instead of being maintained as a parallel source of truth.
  - Why: Separate task ledgers for the same work create drift and extra operator overhead.
- Decision: Change design uses a structured clarification-round model instead of relying on free-form back-and-forth text only.
  - Why: Ambiguities need to be captured as explicit question/answer state that survives across sessions and guides later planning.
- Decision: FastAPI owns the product domain API.
  - Why: It is a pragmatic fit for backend orchestration, persistence, and API delivery.
- Decision: Codex integration goes through a dedicated runtime adapter that speaks to `codex app-server`.
  - Why: It isolates protocol churn and keeps the core backend independent from app-server transport details.
- Decision: The runtime adapter may use a separate Node/TypeScript process.
  - Why: The adapter benefits from a thin environment close to the Codex CLI and app-server protocol tooling.
- Decision: The adapter uses `stdio` transport for `codex app-server`.
  - Why: It is the default transport and the least exposed integration surface.
- Decision: A `run` maps to one Codex thread lineage.
  - Why: This keeps execution auditable and avoids one giant thread for the whole change lifecycle.
- Decision: A run is bootstrapped from tenant memory, change contract, and compacted change working memory instead of replaying all raw prior turns.
  - Why: This keeps the agent tightly attached to the task thread without forcing an ever-growing execution transcript.
- Decision: Facts discovered during runs are promoted back into change memory, and only approved stable facts are promoted into tenant-level repository memory/specs.
  - Why: This separates volatile working context from repository truth.
- Decision: The clarification UI supports short multiple-choice questions plus optional free-form operator input in each round.
  - Why: This provides enough structure for deterministic planning while preserving room for nuance when the predefined options are insufficient.
- Decision: The UI consumes normalized backend events and approval objects only.
  - Why: The browser should not own Codex auth, sandbox, filesystem, or transport behavior.

## Risks / Trade-offs
- Replacing the prototype and scaffolding the app in one change makes the scope wider.
  - Mitigation: keep the change centered on foundation only and preserve the existing IA instead of redesigning the product at the same time.
- The app foundation introduces more moving parts than the current static files.
  - Mitigation: keep boundaries explicit and keep the runtime adapter thin.
- Combining spec, memory, and task focus too aggressively can blur normative truth and noisy scratch context.
  - Mitigation: separate each change into explicit sections for contract, working memory, derived focus, and evidence.
- Clarification prompts can degrade into noisy questionnaires if the agent asks too many low-value questions.
  - Mitigation: keep each round small, require bounded question batches, and store rationale for why the round blocked planning.
- `codex app-server` is still an evolving surface.
  - Mitigation: pin Codex version and hide protocol details behind the runtime adapter.
- Run-per-thread lineage may increase the number of stored thread records.
  - Mitigation: treat that as an audit benefit and add archival later if needed.

## Migration Plan
1. Keep the current static prototype only as a migration reference.
2. Scaffold the new frontend shell and backend services.
3. Recreate the existing operator IA on top of backend-fed state.
4. Implement the runtime adapter and wire the first real run creation flow.
5. Add tenant memory, change working memory, and derived focus/task graph.
6. Add iterative clarification rounds for change design.
7. Retire the legacy static template from the main startup path.

## Open Questions
- Should the runtime adapter live as a separate Node/TypeScript sidecar or be embedded more tightly into the backend deployment?
- Which approval decisions can be auto-resolved by policy, and which must always surface in the operator UI?
- Which artifact formats should be stored as normalized evidence outputs for review and traceability?
- Which parts of tenant-level repository memory should still be exported into formal long-lived specs?
