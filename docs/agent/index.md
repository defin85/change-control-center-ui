# Agent Docs Index

Этот индекс показывает, какой документ считать source of truth для каждой агентской задачи в репозитории.

## Start Here

- [README.md](/home/egor/code/change-control-center-ui/README.md) — продуктовый overview, entrypoints, launcher lifecycle и проверочные команды верхнего уровня.
- [docs/architecture/overview.md](/home/egor/code/change-control-center-ui/docs/architecture/overview.md) — короткая карта backend, sidecar, web, persistence, launcher и тестовых контуров.
- [AGENTS.md](/home/egor/code/change-control-center-ui/AGENTS.md) — корневые repo-wide правила для Codex.

## Authoritative By Topic

- Онбординг и карта кода: [docs/architecture/overview.md](/home/egor/code/change-control-center-ui/docs/architecture/overview.md)
- UI verification и backend-served smoke contract: [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md)
- Поиск по репо и подтверждение фактов: [docs/agent/search.md](/home/egor/code/change-control-center-ui/docs/agent/search.md)
- Завершение сессии, beads и push workflow: [docs/agent/session-completion.md](/home/egor/code/change-control-center-ui/docs/agent/session-completion.md)
- UI skill routing: [docs/agent/ui-skills.md](/home/egor/code/change-control-center-ui/docs/agent/ui-skills.md)
- Spec-driven changes и OpenSpec process: [openspec/AGENTS.md](/home/egor/code/change-control-center-ui/openspec/AGENTS.md)
- Product conventions и архитектурные ограничения: [openspec/project.md](/home/egor/code/change-control-center-ui/openspec/project.md)
- Operator UI platform boundary: [web/src/platform/README.md](/home/egor/code/change-control-center-ui/web/src/platform/README.md)

## Scoped Instructions

- Root-wide defaults: [AGENTS.md](/home/egor/code/change-control-center-ui/AGENTS.md)
- Backend/runtime guidance: [backend/AGENTS.md](/home/egor/code/change-control-center-ui/backend/AGENTS.md)
- Frontend/platform guidance: [web/AGENTS.md](/home/egor/code/change-control-center-ui/web/AGENTS.md)
- Launcher and verification scripts: [scripts/AGENTS.md](/home/egor/code/change-control-center-ui/scripts/AGENTS.md)
- Reference-only legacy artifacts: [legacy/AGENTS.md](/home/egor/code/change-control-center-ui/legacy/AGENTS.md)

## Repo-Owned Skills

- Repo onboarding: [.agents/skills/repo-onboarding/SKILL.md](/home/egor/code/change-control-center-ui/.agents/skills/repo-onboarding/SKILL.md)
- UI change verification: [.agents/skills/ui-change-verification/SKILL.md](/home/egor/code/change-control-center-ui/.agents/skills/ui-change-verification/SKILL.md)
- OpenSpec readiness: [.agents/skills/openspec-change-readiness/SKILL.md](/home/egor/code/change-control-center-ui/.agents/skills/openspec-change-readiness/SKILL.md)

## Quick Commands

- Launcher help: `bash ./scripts/ccc --help`
- Default UI smoke gate: `bash ./scripts/ccc verify ui-smoke`
- Platform UI gate: `bash ./scripts/ccc verify ui-platform`
- Full browser pass: `bash ./scripts/ccc verify ui-full`
- UI readiness drift check: `uv run python scripts/check_ui_readiness.py`
