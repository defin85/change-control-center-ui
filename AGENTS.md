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

- The repository is actively migrating to the new canonical operator UI and away from the deprecated `legacyWorkbench=1` route.
- Treat the new UI as the primary product path for planning, implementation, review, and verification unless a task explicitly says to work on migration scaffolding or legacy cleanup.
- Do not use the hidden legacy workbench, legacy `Run Studio`, or preview-only fallback routes as the source of truth for new UX requirements.
- Legacy UI paths may be consulted only for migration context, gap analysis, or parity checks while the new UI is being completed.
- If a task would reintroduce dependency on the legacy workbench or preserve it as a supported operator path, stop and confirm scope through OpenSpec before coding.

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
