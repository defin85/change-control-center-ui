## Context
This change describes the current shipped shell precisely: the default route renders the exact static reference page, and the previous live operator workbench survives only behind a hidden flag.

That means the shipped UI currently has a split responsibility model:
- the visible default shell is the literal simple reference preview;
- the real backend-owned operator workflow still exists only in the hidden legacy path;
- each path must be described honestly in spec instead of being collapsed into one inaccurate story.

## Goals
- Describe the current shipped default route honestly.
- Record that the exact simple reference is now the visible default shell.
- Record that workflow-capable operator surfaces still live behind the hidden legacy fallback.
- Preserve the hidden legacy route contract so reload and direct links continue to reach the live workbench.
- Leave OpenSpec in an archive-ready state that matches current code.

## Non-Goals
- No new backend entity model, transport, or realtime architecture change.
- No attempt to map backend-owned queue, change, run, or repository data into the default shell.
- No claim that the default route currently provides a full operator workflow.
- No attempt to redesign the default shell beyond what is already shipped.

## Decisions
- Decision: The default route is the exact copied reference page.
  - `App.tsx` renders the copied `OperatorStyleSamplePage` when `legacyWorkbench` is absent.
  - The default shell therefore serves static preview arrays, static copy, and the literal reference DOM structure.

- Decision: The current `OperatorWorkbench` is deprecated, not deleted immediately.
  - The old shell stays available only behind a hidden route-state flag such as `legacyWorkbench=1`.
  - The hidden fallback is the only shipped path that still exposes live backend-owned workflow surfaces.

- Decision: The default route and the live workbench are intentionally split.
  - The default route is presentation-first and static.
  - The hidden legacy route remains behavior-first and live-data-backed.
  - This split is an explicit current product contract until a later change replaces it.

- Decision: The default shell includes a direct affordance back into the live workbench.
  - The copied reference page receives a hidden-path URL through `window.__CCC_LIVE_WORKBENCH_URL__`.
  - The visible `Open live workbench` link is therefore a controlled bridge into the legacy workflow path.

- Decision: Route-addressable hidden fallback is part of the migration contract.
  - The route layer preserves an internal legacy-shell flag so reload and browser history keep the same shell when explicitly requested.
  - The default route never sets that flag itself.

## Risks / Trade-offs
- The shipped default route is not operational.
  - Mitigation: keep a direct visible link into the hidden legacy workbench for workflow access.

- Keeping a hidden fallback can prolong legacy code.
  - Mitigation: explicitly describe it as deprecated compatibility code and avoid pretending the static default shell has replaced it functionally.

- Proof and product semantics now drift.
  - Mitigation: keep this change scoped to truthful spec alignment only; later changes can decide whether proofs or UI should move.

## Migration Plan
1. Record the default route as an exact copied simple-reference preview shell.
2. Record the hidden legacy workbench route as the only live workflow path.
3. Archive the change once the specs and task log match current code.
