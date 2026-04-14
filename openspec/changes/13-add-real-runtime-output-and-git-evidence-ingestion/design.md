## Context
The repository already persists runtime lineage and event streams, but it still synthesizes large parts of run outcome, git state, and evidence. That is enough for platform proofs, but not for a trustworthy product test where the operator needs to inspect what runtime execution actually changed or proved.

## Goals / Non-Goals
- Goals:
  - Derive run outcome and evidence from actual runtime and git artifacts.
  - Keep evidence backend-owned and queryable from change and run surfaces.
  - Preserve explicit failure state when artifact collection or normalization fails.
- Non-Goals:
  - Full acceptance workflow semantics for findings and reopen cycles.
  - Automatic OpenSpec proposal quality scoring from ingested evidence.

## Decisions
- Decision: keep runtime-result normalization in the backend product layer instead of letting the browser infer evidence from raw event streams.
  - Alternatives considered: client-side evidence shaping; rejected because it splits product truth.
- Decision: git evidence is collected from the managed worktree immediately after relevant run completion and stored in canonical backend records.
  - Alternatives considered: lazy collection only on detail read; rejected because evidence would become timing-dependent and harder to audit.
- Decision: empty evidence and evidence-collection failure are separate explicit states.
  - Alternatives considered: treat both as "no evidence"; rejected because product testing needs to distinguish a real no-op from a broken collector.

## Risks / Trade-offs
- Git collection can add latency to run finalization.
- Persisting richer evidence may require pruning or summarization rules sooner than the current lightweight demo state.

## Migration Plan
1. Normalize runtime completion payloads into persisted run outcome state.
2. Add git collectors for status, diff, and check artifacts on managed worktrees.
3. Replace synthetic change and evidence transitions with derived state.
4. Expose the canonical artifact set through selected-change and run-detail contracts.

## Open Questions
- Which git artifacts should be stored inline versus summarized and linked by path.
- Whether large diffs should be truncated in product state or only in UI rendering.

