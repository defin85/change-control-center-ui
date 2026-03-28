# Change Control Center UI

Статичный `desktop-first` prototype для управления change-driven разработкой без kanban-метафоры. Основная сущность здесь не карточка, а `change` с явной прослеживаемостью по `runs`, `gaps`, `traceability` и `evidence`.

## Что внутри

- `Control Queue` вместо доски: плотная очередь change с `next action`, blocker и gap-сигналами
- `Change Detail` с вкладками `Overview`, `Traceability`, `Runs`, `Gaps`, `Evidence`, `Git`, `Chief`
- отдельный `Run Studio` режим внутри detail-pane для просмотра выбранного run и запуска follow-up действий
- mock `chief-orchestrator` state machine:
  - `draft`
  - `approved`
  - `executing`
  - `review_pending`
  - `gap_fixing`
  - `ready_for_acceptance`
  - `done`
  - `blocked_by_spec`
  - `escalated`
- demo-данные по сущностям:
  - `Change`
  - `Requirement`
  - `Run`
  - `Gap`
  - `EvidenceArtifact`
- интерактивные actions на чистом HTML/CSS/JS:
  - `Run next step`
  - `Create targeted fix run`
  - `Close after verification`
  - `Escalate`
  - `Mark blocked by spec`

## Demo workflow

В prototype уже зашиты несколько сценариев:

- `ch-142`: активный review loop с recurring fingerprint и открытыми mandatory gaps
- `ch-143`: первый apply-run, после которого chief может породить review findings
- `ch-145`: change, остановленный в `blocked_by_spec`
- `ch-146`: чистый happy path из `approved` в execution loop

Поведение chief смоделировано детерминированно:

- `approved` запускает apply-run
- `executing` переводится в review
- `review_pending` порождает targeted fix или escalation при recurring fingerprint
- `ready_for_acceptance` можно закрыть только без обязательных open gaps
- repeated high-severity finding ведет в `escalated` или `blocked_by_spec`

## Структура файлов

- `index.html` — общий shell, queue, detail workspace
- `styles.css` — визуальная система и layout для queue, inspector, chief-pane, run studio
- `app.js` — demo model, state machine, rendering, mock actions

## Запуск

```bash
cd /home/egor/code/change-control-center-ui
python -m http.server 4173
```

После этого откройте `http://127.0.0.1:4173`.

Можно открыть и `index.html` напрямую, но через локальный HTTP сервер поведение ближе к реальному режиму эксплуатации.
