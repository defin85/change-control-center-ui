## 1. Spec
- [x] 1.1 Update the `operator-ui-platform` workbench requirement so desktop uses rail, queue, and a contextual selected-change workspace instead of a standalone inspector plus detached detail stage.
- [x] 1.2 Update the run-inspection requirement so run studio is contextual to the selected change and selected run instead of a permanently competing surface.

## 2. Implementation
- [x] 2.1 Refactor platform shells and workbench composition so desktop renders the selected change as the primary right-hand workspace.
- [x] 2.2 Remove or demote the standalone inspector surface and preserve its useful summaries inside the contextual detail flow.
- [x] 2.3 Make run studio conditional within the selected-change workspace while keeping route-addressable selected run context and compact drawer behavior.

## 3. Verification
- [x] 3.1 Update Playwright proofs for the new layout, contextual run studio behavior, and compact drawer workflow.
- [x] 3.2 Run `cd web && npm run lint`.
- [x] 3.3 Run `cd web && npm run test:e2e:platform`.
- [x] 3.4 Run `cd web && npm run test:e2e`.
- [x] 3.5 Run `openspec validate refactor-operator-workbench-layout --strict --no-interactive`.
