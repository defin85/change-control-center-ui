## 1. Clarifications
- [x] 1.1 Add clarification round generation and answer submission flows to selected-change context.
- [x] 1.2 Preserve clarification history and fail closed on stale round or empty-answer state.

## 2. Approvals And Memory
- [x] 2.1 Add approval decision flows inside run detail.
- [x] 2.2 Add fact-promotion flows from selected-change context into tenant memory with explicit pending and error handling.

## 3. Proof
- [x] 3.1 Add contract and browser coverage for clarification history, approval decisions, and tenant-memory promotion.
- [x] 3.2 Run `openspec validate 08-add-clarification-approval-and-memory-flows --strict --no-interactive`.
