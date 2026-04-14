## 1. Findings Model
- [ ] 1.1 Normalize review findings, affected requirements, and unresolved gaps from real run artifacts and checks.
- [ ] 1.2 Persist targeted follow-up context so later fix and re-review runs can focus on the unresolved subset.

## 2. Acceptance Loop
- [ ] 2.1 Replace synthetic review, fix, and finish transitions with explicit accept, reopen, and targeted-fix flows driven by persisted findings.
- [ ] 2.2 Surface operator controls and state transitions for accepting, reopening, or iterating on a change from the same change thread.

## 3. Proof
- [ ] 3.1 Add backend and browser coverage for finding-driven re-review, acceptance, reopen, and empty-finding edge cases.
- [ ] 3.2 Run `openspec validate 15-add-review-fix-acceptance-loop-from-real-findings --strict --no-interactive`.

