## 1. Execution Policy
- [ ] 1.1 Define backend-owned execution policy for allowed tenant repo roots, writable worktrees, and blocked destructive operations.
- [ ] 1.2 Enforce that policy at runtime launch, worktree lifecycle, and filesystem-affecting action boundaries with explicit fail-closed errors.

## 2. Guardrail UX And Audit
- [ ] 2.1 Surface guardrail state, blocked reasons, and approval requirements through the functional shell before unsafe actions proceed.
- [ ] 2.2 Record guardrail-triggered approvals, denials, and blocked attempts as backend-owned audit events linked to the relevant change or run.

## 3. Proof
- [ ] 3.1 Add runtime, backend, and browser coverage for blocked unsafe actions, approved guarded actions, and policy drift.
- [ ] 3.2 Run `openspec validate 16-add-operator-safe-execution-guardrails --strict --no-interactive`.

