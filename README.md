# Change Control Center

Новый primary path в репо это не статический prototype, а реальный foundation stack:

- `FastAPI` backend как source of truth для `tenant`, `change`, `run`, `evidence`, `clarification rounds`
- отдельный runtime sidecar для `codex app-server` с поддержкой `stdio` и `websocket`
- `React/Vite` operator shell поверх backend-only contracts
- persistent state в `sqlite`

Legacy prototype на [index.html](/home/egor/code/change-control-center-ui/index.html), [styles.css](/home/egor/code/change-control-center-ui/styles.css) и [app.js](/home/egor/code/change-control-center-ui/app.js) оставлен как reference artifact, но больше не является основным entrypoint.

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
- `web/` — новый React/Vite shell с `Control Queue`, `Change Detail`, `Run Studio`, `Chief`, clarification flow, operator actions и approval handling

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

## Что уже работает на shipped operator path

- `New change` создает backend-owned draft change и добавляет его в control queue
- `Escalate` и `Mark blocked by spec` меняют состояние change через Control API
- `Run next step` создает persisted run до старта runtime
- `Run Studio` читает lineage, approvals, evidence и runtime events из backend-owned state
- operator approvals и clarification flows идут через тот же backend-owned shell, без frontend-only fallback path

## Проверки

Канонический source of truth для UI verification находится в [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).

Default smoke path для UI-affecting и backend-served UI изменений:

```bash
cd /home/egor/code/change-control-center-ui
uv run pytest backend/tests -q
cd /home/egor/code/change-control-center-ui/web
npm run build
npm run test:e2e
```

`npm run test:e2e` не должен заменяться frontend-only dev server path. Для manual backend-served проверки и fast dev loop используйте тот же runbook.
`npm run test:e2e` must not reuse an already running backend-served stack на `127.0.0.1:8000`: smoke path должен сам поднять backend-served lifecycle или завершиться явной ошибкой.
Playwright smoke lifecycle должен идти через repo-owned launcher `bash ./scripts/ccc`, а не через inline shell fragments или вручную поднятый stack.

Default smoke path доказывает backend-served shell health и минимальный operator flow. Более глубокая проверка platform contract, route-addressable context, run lineage и расширенных browser scenarios живет в `npm run test:e2e:platform` и `npm run test:e2e:full`.

Если изменение затрагивает operator UI platform contract, поверх default smoke path дополнительно запускайте:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run lint
npm run test:e2e:platform
```

Для расширенного browser pass поверх default smoke path используйте `npm run test:e2e:full`. Machine-checkable readiness gate запускается через `uv run python scripts/check_ui_readiness.py`.
