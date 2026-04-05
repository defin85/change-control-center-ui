## 1. Spec
- [x] 1.1 Add a breaking `operator-ui-platform` delta that makes the simple reference the shipped default operator shell and marks the current workbench as a hidden deprecated fallback.

## 2. Implementation
- [x] 2.1 Add route-state support for a hidden legacy-shell fallback and switch the default app entrypoint to the new shipped simple-reference shell.
- [x] 2.2 Copy the reference page into the shipped web tree and render it as the default shell without adapting it to live backend data.
- [x] 2.3 Keep the previous live operator workbench reachable only through the hidden legacy-shell fallback.

## 3. Verification
- [x] 3.1 Run `cd web && npm run lint`.
- [x] 3.2 Run `cd web && npm run build`.
- [x] 3.3 Run `openspec validate ship-static-reference-preview-as-default-shell --strict --no-interactive`.
