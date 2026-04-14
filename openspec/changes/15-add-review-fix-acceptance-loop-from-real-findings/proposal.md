# Change: Add review-fix-acceptance loop from real findings

## Why
Once the product can execute inside a real repository and ingest real evidence, the remaining gap is decision quality. The current review, fix, and finish loop still relies heavily on synthetic state transitions, so it cannot yet prove that the operator is iterating on real findings toward a defensible acceptance decision.

For a meaningful product test, the system needs a finding-driven loop where review outcomes, targeted fixes, re-review, and acceptance all stay attached to the same change thread.

## What Changes
- Normalize real review findings and unresolved gaps from runtime and git evidence.
- Drive targeted fix and re-review context from persisted findings instead of placeholder loop state.
- Add explicit accept, reopen, and targeted-fix actions tied to backend-owned proof state.
- Surface the finding-driven loop through the selected-change workspace.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`
- Affected code: `backend/app/*`, `backend/tests/*`, `web/src/reference/*`, `web/src/platform/*`, `web/e2e/*`
- Dependencies:
  - `13-add-real-runtime-output-and-git-evidence-ingestion`

