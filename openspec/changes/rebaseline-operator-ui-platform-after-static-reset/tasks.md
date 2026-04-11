## 1. Baseline
- [ ] 1.1 Audit current specs and agent-facing docs for requirements that still imply a shipped interactive shell.
- [ ] 1.2 Update OpenSpec and repo docs so the current backend-served route is described as the static shipped shell and future functional work is clearly marked as planned.

## 2. Rollout Governance
- [ ] 2.1 Add explicit rollout-governance requirements that force future functional shell proposals to declare their dependency order and shipped-surface boundary.
- [ ] 2.2 Verify readiness and workflow-contract checks still describe the static baseline honestly.

## 3. Validation
- [ ] 3.1 Run `openspec validate rebaseline-operator-ui-platform-after-static-reset --strict --no-interactive`.
