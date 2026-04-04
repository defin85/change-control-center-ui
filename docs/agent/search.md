# Search Playbook

Используйте этот порядок поиска, чтобы быстро собрать доказательства и не засорять контекст.

## Search Order

1. `mcp__claude_context__search_code`, если доступен в среде
2. `rg`
3. `rg --files`
4. Точечные чтения файлов

`rlm-tools` используйте только как exploratory sidecar и всегда подтверждайте важные факты прямым чтением кода, тестов или docs.

## First Pass Checklist

1. Формулируйте первый запрос как `component + action + context`.
2. Делайте первый проход узким: `limit 6-10` или эквивалентный scope.
3. Ставьте `extensionFilter` рано:
   - backend/scripts: `.py`, `.sh`
   - web/Playwright: `.ts`, `.tsx`, `.css`
   - agent docs/specs/runbooks: `.md`
4. Сужайте область рано до `backend/`, `web/`, `scripts/`, `docs/agent/`, `openspec/`, `README.md`, `AGENTS.md`.
5. Для semantic search используйте корень `/home/egor/code/change-control-center-ui/`.
6. Подтверждайте важные факты минимум в двух источниках: код + тест/spec/doc.
7. Не считайте plans, TODO/checklists, issue status или OpenSpec task state доказательством реализации.

## OpenSpec Work

- Для OpenSpec-driven задач сначала открывайте [openspec/AGENTS.md](/home/egor/code/change-control-center-ui/openspec/AGENTS.md).
- Полнотекстовый `rg` по `openspec/` используйте как fallback, а не как primary authority.
