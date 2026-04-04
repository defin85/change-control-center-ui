# Project Context

## Purpose
Change Control Center is an internal operator console for change-driven software delivery. The primary entity is a `change`, not a kanban card. The product is designed to help an operator or chief agent manage planning, execution, review, clarification, and evidence collection around a single change thread.

The current goal of the repository is to replace the legacy static prototype with a production-oriented foundation:
- a backend-owned product API,
- a React operator UI,
- a dedicated runtime sidecar for `codex app-server`,
- persistent tenant-scoped state for changes, runs, evidence, clarifications, and memory.

## Tech Stack
- Backend: Python 3.12, FastAPI, Uvicorn, HTTPX, websockets
- Backend persistence: SQLite for the current foundation stage
- Runtime integration: dedicated FastAPI sidecar that talks to `codex app-server`
- Runtime transports: `stdio` and `websocket`
- Frontend: React 19, TypeScript 5, Vite 8
- Browser testing: Playwright
- Backend testing: pytest
- Spec workflow: OpenSpec

## Project Conventions

### Code Style
- Prefer small, focused modules with one responsibility per file.
- Keep backend domain logic pure where possible; keep I/O, DB access, and runtime transport at boundaries.
- Use explicit, JSON-serializable structures for product state and runtime contracts.
- Preserve ASCII by default unless a file already requires Unicode.
- Prefer descriptive names that reflect the domain: `tenant`, `change`, `run`, `clarification`, `evidence`, `focus graph`.
- Do not introduce silent fallback behavior for runtime, approvals, or persistence. Fail closed when correctness is unclear.
- Keep UI code thin: presentation and user actions belong in the frontend, but product truth belongs in the backend.

### Architecture Patterns
- The browser UI is never the source of truth. Backend state owns `tenant`, `change`, `run`, `approval`, `evidence`, and clarification history.
- Each repository or workspace is a tenant boundary. Memory and run history must not bleed across tenants.
- A `change` is the primary durable task thread. It contains:
  - contract data: goal, scope, acceptance criteria, constraints
  - working memory: summary, open questions, decisions, promoted facts, active focus
  - links to execution runs and derived focus items
- Each `run` maps to a Codex thread lineage and stores `threadId` and `turnId`.
- Runs are bootstrapped from curated memory packets, not by replaying raw prior transcripts.
- The runtime boundary is split in two:
  - `backend/app/*` owns product APIs and orchestration
  - `backend/sidecar/*` owns transport-specific communication with `codex app-server`
- The backend talks to the runtime sidecar over an internal HTTP contract. The UI never connects directly to Codex transport endpoints.
- The sidecar must support both `stdio` and `websocket` transports without changing product-facing backend contracts.
- Legacy prototype artifacts live under `legacy/prototype/` or in git history and are reference-only, not the primary application path.

### Testing Strategy
- For behavior changes in backend APIs or runtime integration, prefer test-first where practical.
- Maintain explicit traceability for mandatory behavior: Requirement -> Code -> Test.
- Backend contract tests live under `backend/tests/` and should cover:
  - bootstrap and query endpoints
  - run creation and lineage persistence
  - clarification round persistence
  - tenant-memory promotion
  - sidecar transport behavior
- Frontend browser coverage lives in `web/e2e/` and should exercise critical operator flows against the real backend entrypoint.
- Minimum relevant verification for changes in this repo:
  - `uv run pytest backend/tests -q`
  - `bash ./scripts/ccc verify ui-smoke` when UI behavior or integration paths change

### Git Workflow
- Use OpenSpec as the planning gate for new features, architectural changes, breaking API changes, and new capabilities.
- Read `openspec/project.md`, active changes, and affected specs before implementing behavior changes.
- Prefer branches and OpenSpec change IDs that reflect the actual change scope in kebab-case.
- Do not implement an unapproved OpenSpec proposal.
- Keep implementation aligned with the approved change and update `tasks.md` so it reflects reality.
- Avoid mixing unrelated refactors with feature work unless the refactor is required by the approved change.

## Domain Context
- `Tenant`: repository/workspace boundary. A tenant usually maps to one repo under management.
- `Change`: the main unit of work and the durable planning/execution thread.
- `Change Contract`: normative intent for a change, including goal, scope, acceptance criteria, and constraints.
- `Change Memory`: mutable working context for the same change, including summary, questions, decisions, facts, and active focus.
- `Focus Graph`: current actionable focus items derived from change memory, gaps, and clarifications.
- `Run`: one execution step for a change, backed by Codex runtime lineage and normalized event storage.
- `Clarification Round`: a structured question/answer loop used during planning when the agent needs operator input.
- `Evidence`: durable artifacts or proof collected from runs and surfaced in the operator UI.
- `Chief`: the orchestration perspective that decides what the next run should be and how findings affect change state.

## Important Constraints
- Backend-owned state is authoritative; do not derive product truth from frontend state or raw Codex transcripts alone.
- UI must read normalized state from the backend and must not require direct access to `codex app-server`.
- Runtime transport choice (`stdio` vs `websocket`) is an internal deployment concern behind the sidecar boundary.
- `websocket` transport for `codex app-server` is more volatile/experimental than `stdio`; keep transport-specific handling isolated in the sidecar.
- Keep tenant isolation strict. Facts, runs, clarifications, and evidence must remain scoped to the owning tenant and change.
- Keep contract data clearly separated from mutable working memory inside each change.
- Preserve the validated operator IA: `Control Queue`, `Change Detail`, `Run Studio`, and `Chief`.

## External Dependencies
- `codex app-server` is the execution backend for interactive runs. The sidecar speaks structured JSON-RPC-style messages to it over `stdio` or `websocket`.
- OpenSpec is the source of truth for planned changes and capability deltas.
- SQLite is the current persistence layer for the application foundation stage.
- Playwright is the primary browser-level acceptance test tool.
- Legacy prototype references remain under `legacy/prototype/` or in git history and should not be treated as the active product architecture.
