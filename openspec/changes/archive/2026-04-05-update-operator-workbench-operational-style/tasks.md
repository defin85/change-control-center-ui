## 1. Spec
- [x] 1.1 Replace the editorial operator-shell visual contract in `operator-ui-platform` with canonical operational-shell requirements and explicitly retire the legacy editorial shell.
- [x] 1.2 Extend `application-foundation` so backend-owned change summary and detail contracts define `owner` as one structured backend-owned contract with durable orchestrator `id` and operator-facing `label` rather than transient session metadata or an overloaded display string.

## 2. Implementation
- [x] 2.1 Extend backend change-summary projection and shared web contract schemas so bootstrap, tenant change-list, and change-detail payloads expose the same canonical structured orchestrator `owner` contract with `id` and `label`.
- [x] 2.2 Rework the default backend-served workbench chrome, global actions, and shell signal framing into the codex-lb-inspired operational visual system.
- [x] 2.3 Rework queue and repository-context surfaces into dense scan-first operational worklists without preserving the legacy editorial layout and while rendering backend-owned ownership consistently.
- [x] 2.4 Rework selected-change detail and run-inspection surfaces into the same operational visual language while preserving backend-owned workflow semantics, route restoration, fail-closed actions, and compact-viewport accessibility.
- [x] 2.5 Remove the preview-only route from the served app and keep the codex-lb sample, if retained, only as a non-shipped reference artifact once the live workbench is the canonical operational shell.
- [x] 2.6 Rewrite affected browser proofs and backend contract-boundary proofs for the canonical operational shell and the structured owner contract, including queue/detail owner parity.

## 3. Verification
- [x] 3.1 Run `uv run pytest backend/tests -q`.
- [x] 3.2 Run `bash ./scripts/ccc verify ui-smoke`.
- [x] 3.3 Run `bash ./scripts/ccc verify ui-platform`.
- [x] 3.4 Run `uv run python scripts/check_ui_readiness.py` if UI verification entrypoints, scripts, or readiness docs change.
- [x] 3.5 Run `openspec validate update-operator-workbench-operational-style --strict --no-interactive`.
