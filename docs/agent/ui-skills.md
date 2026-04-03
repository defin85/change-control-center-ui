# UI Skill Workflow

Этот документ фиксирует repo-owned policy для автоматического применения UI-ориентированных скиллов. Если UI-задача явно совпадает с профилем скилла, агент должен использовать его без отдельного запроса пользователя.

## Правило по умолчанию

- Не ждать явной команды вида "используй `frontend-design`".
- Выбирать минимальный набор скиллов, который реально нужен текущей UI-задаче.
- Не подключать скиллы ради ритуала: если задача локальная и узкая, берите только релевантный слой.
- Если пользователь явно назвал скилл, это важнее дефолтной эвристики.

## Матрица выбора

- Диагностика визуальной и UX-проблемы: `critique`
- Живой браузерный прогон, bug hunt, exploratory QA: `dogfood`
- Реализация нового UI, рефакторинг layout, заметный редизайн: `frontend-design`
- Интерфейс слишком громкий, тяжёлый или аляповатый: `quieter`
- Интерфейс перегружен и требует упрощения: `distill`
- Интерфейс слишком безопасный и без характера: `bolder`
- Нужно привести экран к существующей системе и паттернам: `normalize`
- Нужно обеспечить нормальную работу на desktop/mobile/compact: `adapt`
- Нужно закрыть overflow, empty states, ошибки, i18n, edge cases: `harden`
- Нужен финальный проход по spacing, alignment и consistency: `polish`
- Нужен системный audit по accessibility/performance/theme/responsive: `audit`
- Нужна более нормативная web-guidelines проверка: `web-design-guidelines`
- Нужны motion/micro-interactions: `animate`
- Нужна доработка copy, labels, error text, helper text: `clarify`
- Нужна более выразительная цветовая система: `colorize`
- Нужно добавить controlled delight без слома usability: `delight`
- Нужно извлечь переиспользуемые UI-паттерны: `extract`
- Нужно улучшить first-run, onboarding, empty-state introduction: `onboard`
- Нужно упростить rendering/perf path интерфейса: `optimize`

## Рекомендуемые последовательности

### 1. UX review без кодинга

- `critique`
- `dogfood`, если нужна проверка на живом UI
- `audit`, если нужен широкий standards pass

### 2. Новый UI или заметный редизайн

- `critique`
- `dogfood`, если уже есть текущая реализация
- `frontend-design`
- `adapt`
- `harden`
- `polish`

### 3. UI "слишком шумный" или "аляповатый"

- `critique`
- `quieter`
- `distill`
- `frontend-design`
- `polish`

### 4. Перед ship

- `dogfood`
- `harden`
- `polish`
- `audit`, если change крупный или высокорисковый

## Связь с verification

- Выбор и применение UI-скиллов не заменяют обязательный verification workflow.
- Для UI-affecting и backend-served UI изменений после выполнения работы используйте [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md).
- Для operator UI platform contract дополнительно обязательны `npm run lint` и `npm run test:e2e:platform`.
