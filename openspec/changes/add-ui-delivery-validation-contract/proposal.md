# Change: Add UI delivery and validation contract

## Why
The repository already has the core pieces of a real operator UI delivery path, but they are still implicit rather than governed by an explicit product contract:
- `web/package.json` exposes `build` and `test:e2e`, but there is no canonical default smoke path for UI-affecting changes.
- `backend/app/main.py` serves `web/dist` when it exists, but the built bundle is still treated as an implementation detail instead of a validated delivery artifact.
- `web/playwright.config.ts` already targets the backend entrypoint, yet that backend-served browser path is not captured as a repository requirement and can drift from documentation or helper automation.
- The repo has no fail-closed readiness gate that keeps UI verification commands, artifact expectations, and operator instructions aligned.

We also reviewed a comparable repository that standardizes UI asset delivery, browser smoke verification, and documentation drift checks as first-class contracts rather than tribal knowledge. That pattern is useful here, but it should land as a separate change from operator UI parity and frontend architecture.

## What Changes
- Define a dedicated `ui-delivery-validation` capability for the operator UI.
- Define one canonical UI verification workflow with a default smoke path and clearly separate deeper validation tiers.
- Define the built web bundle as an explicit backend-served artifact for smoke and delivery paths.
- Define browser smoke verification against the backend-served operator entrypoint rather than a frontend-only development server.
- Define a fail-closed readiness drift gate for UI verification commands, required artifacts, and operator instructions.
- Preserve scope boundaries: this change does not redefine visible parity goals, React composition architecture, or the design-system layer.

## Impact
- Affected specs: `ui-delivery-validation`
- Related changes: `replace-legacy-template-with-app-foundation`, `update-ui-to-control-center-parity`, `add-operator-web-architecture`
- Affected code: `README.md`, `AGENTS.md`, future `docs/agent/*` or `scripts/*` verification helpers, `web/package.json`, `web/playwright.config.ts`, `web/e2e/*`, `backend/app/main.py`, and `backend/tests/*`
