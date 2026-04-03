## 1. Accessible Narrow-Viewport Detail Workspace
Dependency note: this section should land after or alongside the shell changes from `add-operator-ui-platform-contract`; if `update-operator-ui-state-integrity` is modifying the same workspace boundary, rebase on that final ownership instead of duplicating logic.

- [x] 1.1 Update the platform detail workspace so compact-view detail flows use real dialog/drawer semantics, including focus entry, focus containment, inert or hidden background content, and explicit close behavior.
- [x] 1.2 Add browser coverage for opening and closing the selected-change workspace on a narrow viewport and proving that focus stays inside the active workspace while it is open.

## 2. Compact Data Presentation
Dependency note: section `2` depends on the compact-view workspace behavior from section `1`.

- [x] 2.1 Rework control-queue rows and detail tabular sections so compact viewports render labeled, readable field/value presentations instead of unlabeled collapsed column stacks.
- [x] 2.2 Preserve desktop data parity while introducing the compact layout and cover the queue and detail variants with backend-served browser assertions.

## 3. Contextual Action Hierarchy
Dependency note: section `3` depends on the selected-change workspace behavior from section `1` and can be implemented in parallel with section `2`.

- [x] 3.1 Establish one contextual primary action for the selected change and demote duplicate global entrypoints while a change is in focus.
- [x] 3.2 Reduce redundant status/action competition across the header, queue summaries, inspector, and detail header only where needed to keep the selected-change path obvious.

## 4. Locale And Shell Semantics Alignment
Dependency note: section `4` can proceed after the affected shells and forms in sections `1` through `3` are stable enough to avoid churn in labels and metadata.

- [x] 4.1 Align document language, default shell copy, and basic form-field semantics to one coherent backend-served locale contract.
- [x] 4.2 Add regression coverage for shell metadata and form semantics on the backend-served entrypoint.

## 5. Validation
- [x] 5.1 Run `cd /home/egor/code/change-control-center-ui && uv run pytest backend/tests -q`.
- [x] 5.2 Run `cd /home/egor/code/change-control-center-ui/web && npm run build`.
- [x] 5.3 Run `cd /home/egor/code/change-control-center-ui/web && npm run test:e2e`.
- [x] 5.4 Run `cd /home/egor/code/change-control-center-ui/web && npm run lint`.
- [x] 5.5 Run `cd /home/egor/code/change-control-center-ui/web && npm run test:e2e:platform`.
