<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repo Guidance

## Start Here

- Read [docs/agent/index.md](/home/egor/code/change-control-center-ui/docs/agent/index.md) for the authoritative doc map.
- Read [docs/architecture/overview.md](/home/egor/code/change-control-center-ui/docs/architecture/overview.md) for the active architecture and entrypoints.
- Use [README.md](/home/egor/code/change-control-center-ui/README.md) for product overview and launcher basics.

## Current UI Direction

- The default backend-served UI is the first functional shell scaffold in `web/src/platform/shells/ShellBootstrapApp.tsx`.
- Treat that bootstrap-hydrated shell as the source of truth for default-route behavior, browser proofs, and backend-served UX copy unless a task explicitly says to work on later rollout slices.
- Do not assume `legacyWorkbench=1`, `change=...`, `run=...`, `tab=...`, or other pre-rollout live-workbench route state is a supported product path.
- Internal reference artifacts such as `web/src/reference/OperatorStyleSamplePage.tsx` still exist, but they are visual references rather than the default shipped route.
- If a task would restore a supported hidden fallback or skip the ordered `03..10` rollout sequence, confirm scope through OpenSpec before coding.

## Issue Tracking

- Use `bd` for all issue tracking; do not create markdown TODO lists.
- Check ready work with `bd ready --json`.
- Claim work with `bd update <id> --status in_progress --json`.
- Record discovered follow-up with `bd create ... --deps discovered-from:<parent-id> --json`.
- Use `bd vc status` and `bd vc commit` when beads VC has pending changes.

## Search And Evidence

- Follow [docs/agent/search.md](/home/egor/code/change-control-center-ui/docs/agent/search.md).
- Confirm important implementation facts in at least two sources: code plus test/spec/doc.
- Do not treat issue status, TODO lists, OpenSpec tasks, or archived plans as proof that behavior exists.

## Verification

- UI-affecting and backend-served UI work must follow [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).
- Default UI smoke gate: `bash ./scripts/ccc verify ui-smoke`
- Platform contract gate: `bash ./scripts/ccc verify ui-platform`
- UI skill routing lives in [docs/agent/ui-skills.md](/home/egor/code/change-control-center-ui/docs/agent/ui-skills.md).
- Repo-owned lifecycle and verification commands must go through [scripts/ccc](/home/egor/code/change-control-center-ui/scripts/ccc), not ad hoc inline shell fragments.

## Scoped Guidance

- Backend work: [backend/AGENTS.md](/home/egor/code/change-control-center-ui/backend/AGENTS.md)
- Frontend and Playwright work: [web/AGENTS.md](/home/egor/code/change-control-center-ui/web/AGENTS.md)
- Launcher and drift-guard work: [scripts/AGENTS.md](/home/egor/code/change-control-center-ui/scripts/AGENTS.md)
- Legacy reference artifacts: [legacy/AGENTS.md](/home/egor/code/change-control-center-ui/legacy/AGENTS.md)

## Done Means

- Follow [docs/agent/session-completion.md](/home/egor/code/change-control-center-ui/docs/agent/session-completion.md) when ending a coding session.
- Work is not done until `git push` succeeds.
