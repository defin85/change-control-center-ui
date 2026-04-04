---
name: ui-change-verification
description: Repo-owned workflow для проверки UI-affecting и backend-served UI изменений в Change Control Center. Используй, когда задача затрагивает operator UI, Playwright smoke, launcher verification path или доставку web artifact.
---

# UI Change Verification

## Use When

- Изменение трогает operator UI.
- Меняется backend-served shell, `web/dist`, Playwright smoke или launcher verification commands.
- Нужно быстро понять, какой gate обязателен: smoke, platform или full.

## Workflow

1. Прочитай [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).
2. Для обычного UI change используй `bash ./scripts/ccc verify ui-smoke`.
3. Если изменение затрагивает operator UI platform contract, используй `bash ./scripts/ccc verify ui-platform`.
4. Если нужен расширенный browser pass, добавь `bash ./scripts/ccc verify ui-full`.
5. После изменений в launcher/docs/Playwright прогоняй `uv run python scripts/check_ui_readiness.py`.

## Report

- Какой verification tier был нужен
- Какие команды запускались
- Что именно доказывает пройденный gate
