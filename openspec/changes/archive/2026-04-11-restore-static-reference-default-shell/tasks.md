## 1. Specification
- [x] 1.1 Update `operator-ui-platform` so the shipped backend-served shell is the static reference again and no supported live or legacy fallback route remains.
- [x] 1.2 Update `application-foundation` so the default entrypoint no longer promises shipped live workflow surfaces.

## 2. Shipped UI
- [x] 2.1 Switch `web/src/App.tsx` to render the static reference shell as the default backend-served route.
- [x] 2.2 Remove shipped live-workbench bridge affordances and normalize unsupported live-shell query params away from the default route.

## 3. Proof And Docs
- [x] 3.1 Rewrite browser proofs so smoke and platform coverage validate the static shipped shell instead of the live workbench.
- [x] 3.2 Update repo docs that currently claim the default shipped route is the live canonical workbench.
- [x] 3.3 Run `openspec validate restore-static-reference-default-shell --strict --no-interactive`.
- [x] 3.4 Run `bash ./scripts/ccc verify ui-smoke`.
- [x] 3.5 Run `bash ./scripts/ccc verify ui-platform`.
