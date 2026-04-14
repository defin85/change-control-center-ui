## 1. Baseline
- [x] 1.1 Audit current specs and agent-facing docs for requirements that still imply a shipped interactive shell.
- [x] 1.2 Update OpenSpec and repo docs so the current backend-served route is described as the static shipped shell and future functional work is clearly marked as planned.

## 2. Rollout Governance
- [x] 2.1 Add explicit rollout-governance requirements that force future functional shell proposals to declare their dependency order and shipped-surface boundary.
- [x] 2.2 Verify readiness and workflow-contract checks still describe the static baseline honestly.

## 3. Validation
- [x] 3.1 Run `openspec validate 01-rebaseline-operator-ui-platform-after-static-reset --strict --no-interactive`.
