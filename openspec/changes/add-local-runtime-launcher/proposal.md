# Change: Add local runtime launcher

## Why
The repository already has working local start paths for the sidecar, backend, Vite dev server, and backend-served smoke stack, but those paths are still duplicated across `README.md`, `docs/agent/verification.md`, and inline Playwright shell commands.

That duplication creates three operational problems:
- contributors have to remember different raw commands for `dev`, `backend-served`, and smoke paths;
- lifecycle operations such as `stop`, `restart`, `status`, and `logs` are ad hoc rather than repo-owned;
- verification automation can drift from the documented local runbook because the executable lifecycle lives in inline shell fragments instead of one launcher entrypoint.

## What Changes
- Add one repo-owned launcher for local build and runtime lifecycle management, invoked as `bash ./scripts/ccc ...`.
- Support explicit `dev`, `served`, and deterministic `e2e` profiles instead of one implicit mixed mode.
- Add repo-owned commands for `build`, `start`, `stop`, `restart`, `status`, and `logs`.
- Move backend-served Playwright startup to the launcher instead of keeping the lifecycle inline in `web/playwright.config.ts`.
- Update local run instructions and readiness checks so they reference the launcher rather than duplicated raw process commands.

## Impact
- Affected specs: `application-foundation`
- Related changes: `add-ui-delivery-validation-contract`
- Affected code: `scripts/*`, `README.md`, `AGENTS.md`, `docs/agent/verification.md`, `web/playwright.config.ts`, `backend/tests/*`
