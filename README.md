# Change Control Center

Репо сейчас держит backend-owned foundation stack, а default backend-served UI уже переведён в bootstrap-hydrated functional shell, где default `/` шипит tenant-scoped `Queue`, `?workspace=catalog` держит живой `Repositories` workspace, а `?workspace=runs` держит tenant-scoped `Runs` workspace:

- `FastAPI` backend как source of truth для `tenant`, `change`, `run`, `evidence`, `clarification rounds`
- отдельный runtime sidecar для `codex app-server` с поддержкой `stdio` и `websocket`
- shipped `React/Vite` shell на `/` это bootstrap-hydrated queue workspace с backend-owned selected-change detail в `web/src/platform/shells/ShellBootstrapApp.tsx`, `?workspace=catalog` рендерит backend-owned repository workspace, а `?workspace=runs` рендерит backend-owned runs workspace и selected run detail
- `web/src/reference/OperatorStyleSamplePage.tsx` остаётся visual reference artifact, а не default shipped route
- persistent state в `sqlite`

Быстрый doc map для агентов и новых контрибьюторов:

- [docs/agent/index.md](/home/egor/code/change-control-center-ui/docs/agent/index.md) — authoritative map по docs, scoped instructions и repo-owned skills
- [docs/architecture/overview.md](/home/egor/code/change-control-center-ui/docs/architecture/overview.md) — короткая карта runtime, entrypoints и verification contours

Legacy prototype вынесен в [legacy/prototype/README.md](/home/egor/code/change-control-center-ui/legacy/prototype/README.md). Shipped default route больше не использует hidden legacy/live fallback path.

## UI platform baseline

- Approved operator UI foundation stack:
  - `@base-ui/react` for primitive interactions
  - `xstate` + `@xstate/react` for explicit workflow state boundaries
  - `@tanstack/react-table` for queue and other data-heavy table surfaces
  - `web/src/platform/*` for route-level and workspace-level composition
- Роли этих слоев и границы импорта зафиксированы в [web/src/platform/README.md](/home/egor/code/change-control-center-ui/web/src/platform/README.md).

## Что внутри

- `backend/app/main.py` — FastAPI Control API и backend-served startup path
- `backend/app/runtime_sidecar_client.py` — backend-side HTTP client к runtime sidecar
- `backend/app/store.py` — persistent storage для tenants, changes, runs, approvals, evidence, clarifications
- `backend/sidecar/main.py` — отдельный FastAPI sidecar для запуска `codex app-server`
- `backend/sidecar/runner.py` — transport-specific handshake с `codex app-server`
- `backend/app/domain.py` — change-centric workflow, curated memory packet, focus graph, clarification logic
- `web/` — React/Vite shell, где `web/src/platform/*` шипит current functional shell, а `web/src/reference/*` хранит visual reference artifacts и route-level compositions для rollout slices

## Локальный запуск

1. Backend dependencies:

```bash
cd /home/egor/code/change-control-center-ui
uv sync --all-groups
```

2. Frontend dependencies:

```bash
cd /home/egor/code/change-control-center-ui/web
npm install
```

3. Fast development loop:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc start dev
```

Это поднимает `sidecar:8010`, `backend --reload:8000` и `vite:4173`. Проверить состояние можно через `bash ./scripts/ccc status dev`, остановить через `bash ./scripts/ccc stop dev`.

4. Backend-served shell:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc build web
bash ./scripts/ccc start served
```

После этого откройте `http://127.0.0.1:8000`.

Для backend-served shell `web/dist/` считается обязательным build artifact, а канонический verification workflow зафиксирован в [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).

Если `CCC_RUNTIME_COMMAND` не задан и transport = `stdio`, sidecar по умолчанию запускает `codex app-server --listen stdio://`. Для `websocket` режима экспортируйте `CCC_RUNTIME_TRANSPORT=websocket` и `CCC_RUNTIME_WS_URL=ws://...` перед `bash ./scripts/ccc start dev` или `bash ./scripts/ccc start served`; backend продолжает смотреть только в `CCC_RUNTIME_SIDECAR_URL`.

Управление lifecycle остаётся у launcher:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc status all
bash ./scripts/ccc logs served backend -f
bash ./scripts/ccc stop served
bash ./scripts/ccc stop all
```

## Что сейчас шипится на default route

- `http://127.0.0.1:8000/` рендерит bootstrap-hydrated functional shell, который сначала запрашивает `/api/bootstrap`, затем tenant-scoped queue summaries через `/api/tenants/{tenant}/changes`, а для выбранного change гидрирует detail contract через `/api/tenants/{tenant}/changes/{change}`
- `http://127.0.0.1:8000/?workspace=catalog` рендерит backend-owned `Repositories` workspace с live catalog, selection, compact drawer и queue handoff
- `http://127.0.0.1:8000/?workspace=runs` рендерит backend-owned `Runs` workspace с attention/all slices, selected run detail и canonical handoff назад в owning change
- shell route поддерживает canonical `workspace`, `tenant`, queue `view`, queue/catalog `filter`, `q`, queue `change`, selected-change `tab`, runs `runSlice`, и selected `run`, а stale params вроде `legacyWorkbench=1` нормализуются fail-closed
- shipped shell больше не показывает user-facing bridge в live/legacy workbench path и не падает обратно в client-only sample truth при bootstrap failure
- shipped queue теперь включает backend-owned `Selected change` workspace с вкладками `Overview`, `Traceability`, `Gaps`, `Evidence`, `Git`, `Chief` и `Clarifications`
- `Runs` workspace читает backend-owned run list/detail, approvals и runtime events без возврата к legacy `Run Studio`
- текущая последовательность follow-up changes теперь продолжается с `07-add-operator-command-workflows` и заканчивается `10-harden-functional-shell-proof-pack`

## Проверки

Канонический source of truth для UI verification находится в [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).

Default smoke gate для UI-affecting и backend-served UI изменений:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc verify ui-smoke
```

Этот entrypoint прогоняет `uv run pytest backend/tests -q`, затем `npm run build`, затем `npm run test:e2e`. `npm run test:e2e` не должен заменяться frontend-only dev server path и не должен reuse already running backend-served stack на `127.0.0.1:8000`.

Для operator UI platform contract поверх smoke gate используйте:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc verify ui-platform
```

Для расширенного browser pass используйте:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc verify ui-full
```

Machine-checkable readiness gate запускается через `uv run python scripts/check_ui_readiness.py`.
