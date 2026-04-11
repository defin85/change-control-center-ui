## Context
The repository has drifted between two incompatible UI contracts:
- the original codex-lb-derived static reference shell;
- a later live canonical shell direction with route-addressable workbench state and a top-level runs workspace.

The user-requested direction is to ship the static reference again and stop exposing any live or legacy bridge from the backend-served default route.

## Goals / Non-Goals
- Goals:
  - Make the static reference shell the only shipped backend-served UI route.
  - Remove shipped links and route-state affordances that suggest live or legacy workbench access.
  - Keep browser proofs and docs aligned with the actual shipped shell.
- Non-Goals:
  - No new live operator workflow capabilities.
  - No backend contract expansion for the shipped shell.
  - No broad deletion of foundation code that remains internal and non-routable.

## Decisions
- Decision: `App.tsx` renders the static reference shell directly.
  - The shipped route does not wait for bootstrap, queue, or run data.
  - Control API failures do not block rendering of the default shell because the shipped shell is static.

- Decision: Unsupported query state is normalized away on load.
  - Stale params such as `legacyWorkbench`, `workspace`, `runSlice`, `change`, `run`, and similar live-shell state are not part of the supported shipped route.
  - The default shell replaces those params with the canonical bare entry URL.

- Decision: The static shell keeps the reference composition but loses live-bridge affordances.
  - The shell may retain the codex-lb tone and section cadence.
  - User-facing links or copy that promise a live workbench path are removed.

- Decision: Foundation modules may remain internal for now.
  - This patch removes shipped entrypoints and proofs for the live shell.
  - It does not need to delete every internal module in the same change as long as no supported route exposes them.

## Risks / Trade-offs
- The repository still contains live-shell code that is no longer shipped.
  - Mitigation: remove supported routing into it and update proofs so the shipped contract is unambiguous.

- Existing docs and tests strongly assume the live shell.
  - Mitigation: rewrite the shipped-route browser suite and top-level docs in the same patch.

- Old bookmarks can carry stale route params.
  - Mitigation: normalize unsupported query state away on load instead of silently honoring it.

## Migration Plan
1. Add spec deltas that re-establish the static shell as the shipped default and remove supported live fallback behavior.
2. Switch `App.tsx` to the static reference shell and strip unsupported query params.
3. Remove live-bridge affordances from the static reference page.
4. Rewrite backend-served browser proofs and top-level docs to the new shipped contract.
5. Validate the OpenSpec change and repo-owned UI gates.
