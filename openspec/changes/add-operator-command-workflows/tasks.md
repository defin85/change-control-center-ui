## 1. Command Wiring
- [ ] 1.1 Wire supported operator commands for `New repository`, `New change`, `Delete change`, `Run next step`, `Escalate`, and `Mark blocked by spec`.
- [ ] 1.2 Route every mutation through explicit pending and error boundaries instead of silent async behavior.

## 2. State Reconciliation
- [ ] 2.1 Reconcile queue, detail, repository, and run context after successful mutations through the shared shell controller.
- [ ] 2.2 Keep unavailable or unsupported command states fail-closed with operator-facing copy.

## 3. Proof
- [ ] 3.1 Add contract and browser coverage for command success, command failure, and post-mutation state reconciliation.
- [ ] 3.2 Run `openspec validate add-operator-command-workflows --strict --no-interactive`.
