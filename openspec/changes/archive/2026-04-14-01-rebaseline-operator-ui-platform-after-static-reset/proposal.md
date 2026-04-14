# Change: Rebaseline operator UI platform after static reset

## Why
The repository now ships a static codex-lb-derived shell on the backend-served default route, while the current OpenSpec surface still mixes shipped truth with planned interactive workbench behavior. That makes future UI changes ambiguous and risks implementing against acceptance criteria that no longer describe the product honestly.

Before rebuilding functional UI capability, the repository needs one explicit baseline that distinguishes what ships today from what is only planned for later rollout.

## What Changes
- Rebaseline the shipped-vs-planned operator UI contract after the static-shell reset.
- Add rollout-governance requirements so future functional shell changes land in an explicit sequence instead of reviving hidden fallback routes.
- Align docs, readiness expectations, and proposal authority around the current static shipped shell.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Affected code: `README.md`, `docs/architecture/overview.md`, `docs/agent/verification.md`, `backend/tests/test_ui_workflow_contract.py`
- Dependencies: none; this is the sequencing gate for later functional UI changes.
