---
name: repo-onboarding
description: Быстрый онбординг в репозиторий Change Control Center. Используй, когда нужно быстро понять active architecture, entrypoints, docs map, verification path и scoped instructions без блуждания по репо.
---

# Repo Onboarding

## Use When

- Нужно быстро понять, что является active product path.
- Нужно назвать основные entrypoints, launcher команды, verification path и authoritative docs.
- Нужно избежать чтения archive/spec noise до базового ориентирования.

## Workflow

1. Прочитай [docs/agent/index.md](/home/egor/code/change-control-center-ui/docs/agent/index.md).
2. Прочитай [docs/architecture/overview.md](/home/egor/code/change-control-center-ui/docs/architecture/overview.md).
3. Подтверди runtime и verification entrypoints через [README.md](/home/egor/code/change-control-center-ui/README.md) и [scripts/ccc](/home/egor/code/change-control-center-ui/scripts/ccc).
4. Если задача уходит в `backend/`, `web/`, `scripts/` или `legacy/`, открой соответствующий scoped `AGENTS.md`.

## Output

- Primary app path
- Key directories and entrypoints
- Canonical verification command
- Any scoped instructions the implementer must read next
