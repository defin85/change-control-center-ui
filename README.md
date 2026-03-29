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

3. Runtime sidecar:

```bash
cd /home/egor/code/change-control-center-ui
export CCC_RUNTIME_TRANSPORT=stdio
uv run uvicorn backend.sidecar.main:create_app --factory --reload --host 127.0.0.1 --port 8010
```

Если `CCC_RUNTIME_COMMAND` не задан и transport = `stdio`, sidecar по умолчанию запускает `codex app-server --listen stdio://`.

4. Backend development mode:

```bash
cd /home/egor/code/change-control-center-ui
export CCC_RUNTIME_SIDECAR_URL=http://127.0.0.1:8010
uv run uvicorn backend.app.main:create_app --factory --reload
```

5. Frontend development mode:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run dev
```

6. Backend-served shell:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run build
cd /home/egor/code/change-control-center-ui
export CCC_RUNTIME_SIDECAR_URL=http://127.0.0.1:8010
uv run uvicorn backend.app.main:create_app --factory
```

После этого откройте `http://127.0.0.1:8000`.

Для `websocket` режима sidecar запускается с `CCC_RUNTIME_TRANSPORT=websocket` и `CCC_RUNTIME_WS_URL=ws://...`; backend продолжает смотреть только в `CCC_RUNTIME_SIDECAR_URL`.

## Что уже работает на default path

- `New change` создает backend-owned draft change и добавляет его в control queue
- `Escalate` и `Mark blocked by spec` меняют состояние change через Control API
- `Run next step` создает persisted run до старта runtime
- `Run Studio` показывает `threadId`, `turnId`, runtime events и approval records
- pending approvals принимаются или отклоняются из UI, после чего backend продолжает run и фиксирует итоговые events/evidence

## Проверки

Backend contracts:

```bash
cd /home/egor/code/change-control-center-ui
uv run pytest backend/tests -q
```

Frontend build:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run build
```

Browser e2e:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run test:e2e
```
