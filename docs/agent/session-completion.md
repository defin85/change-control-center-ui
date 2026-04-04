# Session Completion

Этому workflow нужно следовать в конце coding-session. Работа не считается завершённой, пока `git push` не прошёл успешно.

## Required Steps

1. Завести beads issues для оставшегося follow-up work.
2. Прогнать релевантные quality gates.
3. Обновить статусы beads issues.
4. Синхронизировать и отправить изменения:

```bash
git pull --rebase
bd vc status
bd vc commit -m "Describe beads changes"
git push
git status
```

5. Очистить временное состояние, если оно появилось в ходе работы.
6. Убедиться, что локальная ветка актуальна с `origin`.
7. В handoff указать, что было сделано, какие проверки запускались и какой follow-up остался.

## UI-Affecting Work

- Канонический verification workflow живёт в [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).
- Default smoke gate: `bash ./scripts/ccc verify ui-smoke`
- Для operator UI platform contract добавьте `bash ./scripts/ccc verify ui-platform`

## Critical Rules

- Не оставляйте работу локально без `git push`.
- Не заменяйте beads markdown TODO-списками.
- Если push падает, исправляйте причину и повторяйте до успеха.
