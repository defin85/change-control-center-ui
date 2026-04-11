# Change: Restore static reference as default shell

## Why
The intended codex-lb-derived reference for this repository is the shipped static shell, not the later live workbench route. The current default entrypoint no longer matches that reference, and the repository still carries product and proof assumptions from the abandoned live-shell direction.

This change restores the exact static reference as the only supported backend-served shell and removes shipped live or legacy bridge behavior from the default application path.

## What Changes
- **BREAKING** render the static reference shell from the default backend-served route again.
- **BREAKING** remove shipped links, route toggles, and URL-state affordances that imply a supported live or legacy workbench fallback.
- Normalize stale live-shell query state away from the shipped route so old bookmarks land on the canonical static shell.
- Rewrite browser proofs and repo docs so they describe the static default shell honestly.

## Impact
- Affected specs: `operator-ui-platform`, `application-foundation`
- Affected code: `web/src/App.tsx`, `web/src/reference/*`, `web/e2e/*`, `README.md`, `docs/architecture/overview.md`
- Assumptions:
  - The backend-owned foundation stack remains in the repository, but it is no longer the shipped default UI path.
  - This change intentionally supersedes the previously attempted live-shell default direction.
