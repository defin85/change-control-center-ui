# UI Verification Workflow

Этот документ является каноническим source of truth для UI-affected и backend-served UI изменений в репозитории.

## Когда применять

Используйте этот workflow, если изменение затрагивает хотя бы одно из условий:

- изменяет поведение operator UI;
- меняет backend-served shell или доставку `web/dist`;
- влияет на backend/frontend integration path, который использует browser smoke;
- меняет команды, скрипты или инструкции, связанные с UI build и verification.

Для выбора и автоматического применения подходящих UI-скиллов используйте [docs/agent/ui-skills.md](/home/egor/code/change-control-center-ui/docs/agent/ui-skills.md). Этот документ задаёт repo-owned routing для `critique`, `dogfood`, `frontend-design`, `adapt`, `harden`, `polish` и связанных UI-скиллов.

## Default Smoke Path

Это минимальное доказательство того, что backend-served operator UI остаётся рабочим.

Канонический repo-owned entrypoint:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc verify ui-smoke
```

Этот entrypoint последовательно запускает три шага ниже.

1. Backend contracts:

```bash
cd /home/egor/code/change-control-center-ui
uv run pytest backend/tests -q
```

2. Fresh web artifact:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run build
```

3. Backend-entrypoint browser smoke:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run test:e2e
```

## Additional Required Gates For Operator UI Platform Contract

Если изменение затрагивает `add-operator-ui-platform-contract` или другой evolution этого же operator UI platform contract, поверх default smoke path обязательны ещё две проверки:

Канонический repo-owned entrypoint:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc verify ui-platform
```

1. Platform governance lint:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run lint
```

2. Platform-conformance browser gate:

```bash
cd /home/egor/code/change-control-center-ui/web
npm run test:e2e:platform
```

## Что именно доказывает smoke path

- `npm run build` создаёт текущий backend-served artifact в `web/dist/`.
- `npm run test:e2e` запускает минимальный Playwright smoke suite через backend entrypoint `http://127.0.0.1:8000`, а не через frontend-only dev server.
- `npm run test:e2e` must not reuse an already running backend-served stack on `127.0.0.1:8000`; smoke path должен сам поднять свежий backend + artifact lifecycle или завершиться fail-closed.
- Repo-owned backend lifecycle для smoke path живёт в `bash ./scripts/ccc`, а не в inline shell fragments внутри helper automation.
- Предпочитайте repo-owned verification entrypoints `bash ./scripts/ccc verify ui-smoke`, `bash ./scripts/ccc verify ui-platform` и `bash ./scripts/ccc verify ui-full` вместо ручного воспроизведения команды по памяти.
- `npm run lint` и `npm run test:e2e:platform` обязательны дополнительно, когда change трогает operator UI platform contract.
- Browser smoke дополнительно rebuild-ит web artifact перед стартом backend stack, чтобы smoke path не зависел от старого `web/dist`.
- Расширенные shipped-shell доказательства, такие как explicit bootstrap failure handling и fail-closed route normalization, живут в `npm run test:e2e:platform` или `npm run test:e2e:full`, а не в минимальном smoke suite.
- Текущие smoke/platform suites доказывают bootstrap-hydrated shell baseline, shipped tenant `Queue` на `/` и shipped `Repositories` workspace на `workspace=catalog`; они не являются доказательством того, что full selected-change detail, runs, command, approval, clarification, или realtime shell уже полностью ship'ятся на default route.
- Smoke path считается пройденным только после всех трёх шагов.
- Уже существующий `web/dist` не считается достаточным доказательством: smoke всегда начинается с нового `npm run build`.

## Required Artifact Contract

Для backend-served smoke и delivery обязательным artifact считается:

- `web/dist/index.html`
- `web/dist/assets/*`

Если этот artifact отсутствует или устарел относительно текущих исходников, backend-served UI нельзя считать проверенным.

## Extended Validation

Эти проверки полезны, но не заменяют default smoke path.

### Manual Backend-Served Check

1. Собрать текущий web artifact:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc build web
```

2. Запустить backend-served stack:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc start served
```

3. Открыть `http://127.0.0.1:8000` и пройти нужный сценарий вручную.

4. Остановить stack:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc stop served
```

### Extended Browser Coverage

Если нужен более широкий browser pass поверх default smoke path и platform gate, запускайте полный Playwright suite отдельно:

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc verify ui-full
```

### Fast Development Loop

Этот путь годится для локальной разработки, но не считается smoke evidence для backend-served UI health.

```bash
cd /home/egor/code/change-control-center-ui
bash ./scripts/ccc start dev
```

Используйте его только вместе с launcher lifecycle из [README.md](/home/egor/code/change-control-center-ui/README.md), когда нужна быстрая итерация, а не release-style verification. Остановить stack можно через `bash ./scripts/ccc stop dev`, а логи смотреть через `bash ./scripts/ccc logs dev backend -f` или `bash ./scripts/ccc logs dev vite -f`.

## Запрещённые подмены

- Нельзя считать `npm run dev` эквивалентом backend-served smoke.
- Нельзя считать один только `npm run build` достаточной проверкой UI health.
- Нельзя считать уже поднятый вручную backend/sidecar на `127.0.0.1:8000` или `127.0.0.1:8010` допустимой заменой smoke path: `npm run test:e2e` must not reuse an already running backend-served stack.
- Нельзя дублировать backend-served smoke lifecycle в новых inline shell fragments, если тот же path уже управляется через `bash ./scripts/ccc`.
- Нельзя объявлять другой канонический verification entrypoint без синхронного обновления `scripts/ccc`, этого документа, `README.md` и readiness gate.
- Нельзя заменять этот workflow ad hoc командами без обновления этого документа, `README.md` и репозиторных инструкций.

## Readiness Gate

Machine-checkable drift gate для этого контракта:

```bash
cd /home/egor/code/change-control-center-ui
uv run python scripts/check_ui_readiness.py
```
