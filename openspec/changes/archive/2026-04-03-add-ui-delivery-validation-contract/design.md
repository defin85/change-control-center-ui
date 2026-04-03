## Context
The current repo already has the beginnings of a backend-served UI delivery path:
- [web/package.json](/home/egor/code/change-control-center-ui/web/package.json) defines `build` and `test:e2e`.
- [web/playwright.config.ts](/home/egor/code/change-control-center-ui/web/playwright.config.ts) launches the backend stack and points browser tests at `http://127.0.0.1:8000`.
- [backend/app/main.py](/home/egor/code/change-control-center-ui/backend/app/main.py) serves `web/dist/index.html` and `web/dist/assets` when the bundle exists.
- [README.md](/home/egor/code/change-control-center-ui/README.md) documents manual build and browser verification commands.

Those pieces are useful, but they still leave important behavior implicit:
- there is no single canonical smoke workflow for UI-affecting changes;
- the built web bundle is not yet treated as an explicit delivery contract;
- documentation and helper automation can drift because no machine-checkable readiness gate exists;
- browser verification could accidentally regress toward a frontend-only path even though the product entrypoint is backend-served.

This change captures the UI delivery and validation layer as a separate capability. It complements `add-operator-web-architecture` and `update-ui-to-control-center-parity` without mixing architectural seams, visible parity, and release verification into one proposal.

## Goals / Non-Goals
- Goals:
  - Define a canonical minimum verification workflow for UI-affecting and backend-served UI changes.
  - Make the built web bundle an explicit contract for backend-served smoke and delivery paths.
  - Keep browser smoke verification tied to the real backend product entrypoint.
  - Add a fail-closed readiness gate for drift between documented commands, helper automation, and runtime artifact expectations.
  - Preserve a fast local development loop while making smoke and delivery checks explicit.
- Non-Goals:
  - Redefine visible UI parity or information architecture already covered by `update-ui-to-control-center-parity`.
  - Redefine frontend composition, routing, or server-state seams already covered by `add-operator-web-architecture`.
  - Introduce a new design system, token policy, or broad CSS governance in this change.
  - Require every backend development run to fail when `web/dist` is absent; the stricter contract applies to backend-served smoke and delivery paths.

## Decisions
- Decision: Separate the fast frontend development path from the backend-served smoke and delivery path.
  - Why: `npm run dev` must stay lightweight, but the product entrypoint that operators and Playwright validate is the backend-served shell.

- Decision: Define one canonical smoke workflow that starts from a fresh web build.
  - Why: the smoke contract should prove that current sources can still produce the backend-served UI artifact rather than relying on a previously built bundle.

- Decision: Keep browser smoke attached to the backend entrypoint instead of a frontend-only dev server.
  - Why: operator UI health depends on asset serving and Control API behavior together, not on isolated component rendering.

- Decision: Add a machine-checkable readiness gate for command and artifact drift.
  - Why: the repository currently depends on humans keeping `README`, agent instructions, and runnable commands in sync.

- Decision: Fail closed on missing delivery artifacts or verification drift.
  - Why: silent fallback would hide broken backend-served UI paths and weaken confidence in release readiness.

## Risks / Trade-offs
- The default smoke path will be slower because it starts from a fresh build.
  - Mitigation: keep the fast dev loop unchanged and reserve the smoke path for UI-affecting or backend-served UI changes.

- A readiness gate can turn into busywork if it tries to validate too much prose.
  - Mitigation: limit the first version to authoritative commands, artifact paths, and required verification surfaces.

- Browser smoke that boots the real backend stack can be brittle if setup remains ad hoc.
  - Mitigation: centralize the smoke workflow in one documented path and align helper automation with the same commands.

- The new contract could overlap conceptually with existing e2e coverage.
  - Mitigation: treat this change as the rule for how smoke is run and validated, not as a separate duplicate test suite.

## Migration Plan
1. Document the canonical UI verification workflow and its default smoke path.
2. Add a readiness gate that checks documented commands and required artifact assumptions.
3. Tighten the backend-served UI path so smoke and delivery checks require a current built bundle.
4. Keep Playwright smoke tied to the backend entrypoint and cover minimal operator-critical flows there.
5. Let parity and frontend-architecture implementation build on top of this delivery and verification contract.

## Open Questions
- None blocking. Assumption: the first readiness gate may validate a narrow set of authoritative commands and artifact paths rather than attempting to parse every repository document.
