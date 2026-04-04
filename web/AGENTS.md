# Web Guidance

Используйте этот файл, когда задача затрагивает `web/`, Playwright coverage или operator UI platform contract.

## Start Here

- [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md)
- [docs/agent/ui-skills.md](/home/egor/code/change-control-center-ui/docs/agent/ui-skills.md)
- [web/src/platform/README.md](/home/egor/code/change-control-center-ui/web/src/platform/README.md)

## Boundaries

- Route-level composition goes through `web/src/platform/*`.
- Backend state is authoritative; do not invent client-only fallback truth.
- Block silent placeholder actions instead of pretending the backend contract exists.

## Entry Points

- [web/src/App.tsx](/home/egor/code/change-control-center-ui/web/src/App.tsx)
- [web/src/platform/index.ts](/home/egor/code/change-control-center-ui/web/src/platform/index.ts)
- [web/playwright.config.ts](/home/egor/code/change-control-center-ui/web/playwright.config.ts)
- [web/e2e/app.spec.ts](/home/egor/code/change-control-center-ui/web/e2e/app.spec.ts)

## Verify

- Default UI smoke: `bash ./scripts/ccc verify ui-smoke`
- Platform contract changes: `bash ./scripts/ccc verify ui-platform`
- Full browser pass when needed: `bash ./scripts/ccc verify ui-full`
- If a task matches a repo-owned UI skill profile, follow [docs/agent/ui-skills.md](/home/egor/code/change-control-center-ui/docs/agent/ui-skills.md)
