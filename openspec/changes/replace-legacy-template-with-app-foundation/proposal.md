# Change: Replace legacy template with app foundation

## Why
The project currently exists as a static single-page prototype that acts as a legacy template for the future product shape, but not as a real application. We need one change that establishes the actual application skeleton, preserves the operator workflows already proven in the prototype, and retires the legacy static template as the primary product entrypoint.

`codex app-server` remains important, but only as one part of the execution architecture. The larger goal is to create a real app foundation with a backend, persistent state, runtime integration, and a frontend shell that can grow without dragging the prototype structure forward.

The same change should also reduce maintenance overhead from separately curating specification documents and a parallel task-memory layer. We want the primary unit of work to be a tenant-scoped `change` that carries both its normative contract and its durable working memory, so the agent stays attached to one task thread over time instead of reconstructing context from scattered artifacts.

## What Changes
- Add the first production-oriented application skeleton for `Change Control Center`.
- Replace the legacy static prototype/template as the primary app entrypoint.
- Preserve and migrate the core operator workflows: `Control Queue`, `Change Detail`, `Run Studio`, and `Chief`.
- Define a backend-owned domain model for `change`, `run`, `gap`, `traceability`, and `evidence`.
- Define tenant scope in the dimension of repository/workspace.
- Define `change` as the primary task thread that carries contract, working memory, and derived execution focus.
- Define `codex app-server` as the interactive Codex runtime boundary behind a dedicated adapter with both `stdio` and `websocket` transport support.
- Add an interactive clarification loop for change design with structured question/answer rounds.
- Require the UI to consume normalized backend state instead of connecting to Codex transports directly.
- Reduce reliance on separately maintained spec and bead-style memory artifacts for the same unit of work.

## Impact
- Affected specs: `application-foundation`
- Affected code: future frontend shell, future backend service, future runtime adapter, current prototype files `index.html`, `styles.css`, and `app.js`
