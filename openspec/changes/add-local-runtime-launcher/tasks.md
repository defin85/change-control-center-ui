## 1. Launcher
- [x] 1.1 Add a repo-owned launcher with explicit `dev`, `served`, and `e2e` profiles.
- [x] 1.2 Add repo-owned lifecycle commands for `build`, `start`, `stop`, `restart`, `status`, and `logs`.
- [x] 1.3 Make the launcher fail closed on occupied ports and manage only repo-owned PIDs and logs.

## 2. Integration
- [x] 2.1 Move backend-entrypoint Playwright startup out of inline shell and into the launcher.
- [x] 2.2 Update README and agent verification guidance to use the launcher for local run and manual backend-served paths.
- [x] 2.3 Update the UI readiness gate so it detects drift between docs, launcher-backed automation, and Playwright startup.

## 3. Validation
- [x] 3.1 Add automated coverage for the launcher-backed readiness contract.
- [x] 3.2 Run `uv run pytest backend/tests -q`.
- [x] 3.3 Run `cd web && npm run build`.
- [x] 3.4 Run `cd web && npm run test:e2e`.
- [x] 3.5 Exercise the launcher lifecycle with at least one managed start/status/stop pass.
