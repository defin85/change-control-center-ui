## 1. Spec
- [ ] 1.1 Replace the editorial operator-shell visual contract in `operator-ui-platform` with canonical operational-shell requirements and explicitly retire the legacy editorial shell.

## 2. Implementation
- [ ] 2.1 Rework the default backend-served workbench chrome, global actions, and shell signal framing into the codex-lb-inspired operational visual system.
- [ ] 2.2 Rework queue and repository-context surfaces into dense scan-first operational worklists without preserving the legacy editorial layout.
- [ ] 2.3 Rework selected-change detail and run-inspection surfaces into the same operational visual language while preserving backend-owned workflow semantics, route restoration, fail-closed actions, and compact-viewport accessibility.
- [ ] 2.4 Remove the preview-only route and retire legacy editorial styling once the live workbench is the canonical operational shell.
- [ ] 2.5 Rewrite affected browser proofs for the canonical operational shell and remove legacy editorial presentation assumptions.

## 3. Verification
- [ ] 3.1 Run `bash ./scripts/ccc verify ui-smoke`.
- [ ] 3.2 Run `bash ./scripts/ccc verify ui-platform`.
- [ ] 3.3 Run `uv run python scripts/check_ui_readiness.py` if UI verification entrypoints, scripts, or readiness docs change.
- [ ] 3.4 Run `openspec validate update-operator-workbench-operational-style --strict --no-interactive`.
