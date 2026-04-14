# Change: Harden functional shell proof pack

## Why
By the time the shell regains functional catalog, queue, detail, run, command, collaboration, and realtime behavior, the current smoke suite will no longer be sufficient evidence. The repository needs a deterministic proof pack that matches the richer shell and keeps docs, launcher entrypoints, and browser automation aligned.

This hardening change should land last so it can prove the real functional shell instead of protecting placeholder behavior.

## What Changes
- Expand the canonical UI verification workflow to cover the functional shell rather than only the static default shell.
- Make smoke, platform, and full browser tiers deterministic for functional queue, detail, runs, commands, collaboration, and realtime behaviors.
- Update readiness gates and docs so they track the new proof pack honestly.
- Keep launcher-driven verification as the only approved lifecycle path for backend-served UI evidence.

## Impact
- Affected specs: `ui-delivery-validation`
- Affected code: `web/e2e/*`, `backend/tests/test_ui_*`, `scripts/ccc`, `scripts/check_ui_readiness.py`, `docs/agent/verification.md`, `README.md`
- Dependencies:
  - `01-rebaseline-operator-ui-platform-after-static-reset`
  - `02-add-shell-bootstrap-and-route-state-controller`
  - `03-add-functional-repository-catalog-workspace`
  - `04-add-functional-tenant-queue-workspace`
  - `05-add-selected-change-detail-workspace`
  - `06-add-runs-workspace-and-run-detail-handoff`
  - `07-add-operator-command-workflows`
  - `08-add-clarification-approval-and-memory-flows`
  - `09-add-realtime-reconciliation-and-degradation-visibility`
