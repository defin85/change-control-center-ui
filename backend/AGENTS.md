# Backend Guidance

Используйте этот файл, когда задача затрагивает `backend/` или sidecar/runtime boundary.

## Source Of Truth

- Backend owns product truth for `tenant`, `change`, `run`, `approval`, `evidence`, clarification history, and memory.
- UI must consume normalized backend state and must not connect directly to Codex transport endpoints.
- Transport-specific logic stays inside `backend/sidecar/*`.

## Entry Points

- [backend/app/main.py](/home/egor/code/change-control-center-ui/backend/app/main.py)
- [backend/app/domain.py](/home/egor/code/change-control-center-ui/backend/app/domain.py)
- [backend/app/store.py](/home/egor/code/change-control-center-ui/backend/app/store.py)
- [backend/app/runtime_sidecar_client.py](/home/egor/code/change-control-center-ui/backend/app/runtime_sidecar_client.py)
- [backend/sidecar/main.py](/home/egor/code/change-control-center-ui/backend/sidecar/main.py)
- [backend/sidecar/runner.py](/home/egor/code/change-control-center-ui/backend/sidecar/runner.py)

## Verify

- Minimal backend gate: `uv run pytest backend/tests -q`
- UI-serving or launcher-adjacent backend changes: `bash ./scripts/ccc verify ui-smoke`
- Read the broader map in [docs/architecture/overview.md](/home/egor/code/change-control-center-ui/docs/architecture/overview.md)

## Constraints

- Fail closed when runtime correctness is unclear.
- Keep domain logic pure where practical and keep IO at boundaries.
- For spec-driven behavior changes, open [openspec/AGENTS.md](/home/egor/code/change-control-center-ui/openspec/AGENTS.md) before editing.
