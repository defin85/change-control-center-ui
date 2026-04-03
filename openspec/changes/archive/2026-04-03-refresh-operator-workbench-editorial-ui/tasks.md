## 1. Spec
- [x] 1.1 Add an operator-ui-platform requirement for restrained editorial visual hierarchy across the default operator shell.

## 2. Implementation
- [x] 2.1 Refresh the shell visual system with calmer surfaces, reduced card noise, and clearer typography.
- [x] 2.2 Restyle the queue and queue-context surfaces into a more scan-friendly worklist presentation.
- [x] 2.3 Rework change detail and run studio presentation so change detail remains dominant and run inspection feels secondary.

## 3. Verification
- [x] 3.1 Update browser proofs affected by the new shell presentation.
- [x] 3.2 Run `cd web && npm run lint`.
- [x] 3.3 Run `cd web && npm run build`.
- [x] 3.4 Run `cd web && npm run test:e2e:platform`.
- [x] 3.5 Run `cd web && npm run test:e2e`.
- [x] 3.6 Run `openspec validate refresh-operator-workbench-editorial-ui --strict --no-interactive`.
