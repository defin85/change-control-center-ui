# Architecture Overview

## System Map

Change Control Center is a backend-owned operator console. The browser UI is never the source of truth, and the default backend-served route is currently pinned to a shipped static reference shell.

```text
Browser UI (static reference shell by default)
  -> FastAPI product backend
      -> SQLite product state
      -> runtime sidecar HTTP client
          -> FastAPI sidecar
              -> codex app-server (stdio or websocket)
```

## Primary Entry Points

- [backend/app/main.py](/home/egor/code/change-control-center-ui/backend/app/main.py) — Control API, backend-served shell startup path, health endpoints.
- [backend/app/domain.py](/home/egor/code/change-control-center-ui/backend/app/domain.py) — change-centric workflow logic, memory packet shaping, clarification handling.
- [backend/app/store.py](/home/egor/code/change-control-center-ui/backend/app/store.py) — SQLite persistence for tenants, changes, runs, evidence, approvals, clarifications.
- [backend/sidecar/main.py](/home/egor/code/change-control-center-ui/backend/sidecar/main.py) — runtime sidecar process boundary.
- [backend/sidecar/runner.py](/home/egor/code/change-control-center-ui/backend/sidecar/runner.py) — transport-specific handshake with `codex app-server`.
- [web/src/App.tsx](/home/egor/code/change-control-center-ui/web/src/App.tsx) — shipped static shell entrypoint.
- [web/src/reference/OperatorStyleSamplePage.tsx](/home/egor/code/change-control-center-ui/web/src/reference/OperatorStyleSamplePage.tsx) — codex-lb-derived default backend-served shell.
- [web/src/platform/index.ts](/home/egor/code/change-control-center-ui/web/src/platform/index.ts) — internal operator foundation and composition boundary retained in the repo.
- [scripts/ccc](/home/egor/code/change-control-center-ui/scripts/ccc) — repo-owned launcher for `dev`, `served`, `e2e` and verification entrypoints.

## Code Map

- `backend/app/*` — product APIs, orchestration, storage, backend-owned state.
- `backend/sidecar/*` — transport-specific runtime communication with `codex app-server`.
- `backend/tests/*` — backend contracts, UI governance/readiness drift checks, runtime adapter tests.
- `web/src/reference/*` — shipped static reference shell artifacts.
- `web/src/platform/*` — internal route-level shells, platform contracts, workflow boundaries, shared primitives.
- `web/src/components/*` — feature internals used by the platform shell.
- `web/e2e/*` — backend-entrypoint Playwright coverage.
- `scripts/*` — repo-owned launcher and drift guards.
- `legacy/prototype/*` — reference-only artifacts that must not be treated as the active application path.

## Runtime and Data Boundaries

- Backend owns `tenant`, `change`, `run`, `approval`, `evidence`, clarification history, and memory.
- UI reads normalized backend state and must not talk directly to Codex transport endpoints.
- Sidecar hides `stdio` vs `websocket`; transport choice is internal deployment configuration.
- Launcher profiles are the only approved local lifecycle path for backend-served UI checks.
- The default backend-served route is still the shipped static shell; functional catalog, queue, detail, runs, command, and realtime work remain sequenced follow-up changes rather than current product truth.

## Verification Map

- Default operator UI smoke: `bash ./scripts/ccc verify ui-smoke`
- Platform contract gate: `bash ./scripts/ccc verify ui-platform`
- Full browser pass: `bash ./scripts/ccc verify ui-full`
- Drift guard for docs + launcher + Playwright alignment: `uv run python scripts/check_ui_readiness.py`
- Canonical workflow details: [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md)

## Related Docs

- Repo doc index: [docs/agent/index.md](/home/egor/code/change-control-center-ui/docs/agent/index.md)
- OpenSpec conventions: [openspec/project.md](/home/egor/code/change-control-center-ui/openspec/project.md)
- UI platform policy: [web/src/platform/README.md](/home/egor/code/change-control-center-ui/web/src/platform/README.md)
