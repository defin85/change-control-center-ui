---
name: openspec-change-readiness
description: Быстрый preflight для spec-driven задач в Change Control Center. Используй, когда изменение похоже на новую capability, архитектурный сдвиг, breaking change или требует проверить OpenSpec authority перед кодингом.
---

# OpenSpec Change Readiness

## Use When

- Пользователь просит proposal, plan, spec change или большую capability.
- Изменение может потребовать OpenSpec approval gate.
- Нужно отличить bugfix/config/doc update от настоящего spec-driven change.

## Workflow

1. Открой [openspec/AGENTS.md](/home/egor/code/change-control-center-ui/openspec/AGENTS.md).
2. Прочитай [openspec/project.md](/home/egor/code/change-control-center-ui/openspec/project.md) и релевантные specs.
3. Определи, нужен ли новый change proposal или можно править напрямую.
4. Если работа уже разрешена, привяжи implementation к текущим capability docs и tasks.

## Output

- Нужен ли OpenSpec proposal
- Какие specs и changes релевантны
- Какой approval/status gate блокирует или не блокирует реализацию
