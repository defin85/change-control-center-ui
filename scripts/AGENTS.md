# Scripts Guidance

Используйте этот файл, когда задача затрагивает `scripts/`, launcher lifecycle или drift checks.

## Source Of Truth

- [scripts/ccc](/home/egor/code/change-control-center-ui/scripts/ccc) is the repo-owned lifecycle and verification entrypoint.
- [scripts/check_ui_readiness.py](/home/egor/code/change-control-center-ui/scripts/check_ui_readiness.py) guards alignment between docs, launcher, package scripts, and Playwright.
- UI verification docs must stay aligned with [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).

## Rules

- Prefer adding repo-owned commands over new inline shell fragments in docs or automation.
- If you change UI verification commands, update the launcher, docs, readiness script, and tests in the same patch.
- Keep shell helpers fail-closed when health, artifact, or port ownership is uncertain.

## Verify

- `uv run python scripts/check_ui_readiness.py`
- `uv run pytest backend/tests -q`
