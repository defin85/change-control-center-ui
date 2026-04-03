## 1. Spec
- [x] 1.1 Update `operator-ui-platform` requirements for tighter shell hierarchy, more focused queue scanability, and compact detail disclosure.
- [x] 1.2 Update the governance-copy requirement so fail-closed behavior remains but operator-facing copy avoids internal implementation-policy language.

## 2. Implementation
- [x] 2.1 Reduce competing header, status-strip, and queue-context weight around the selected-change workspace.
- [x] 2.2 Simplify queue row presentation so repetitive draft-heavy rows are easier to scan.
- [x] 2.3 Shorten compact detail flow with progressive disclosure for lower-priority overview sections.
- [x] 2.4 Rewrite governance and unavailable-state copy into operator-facing language without weakening fail-closed behavior.

## 3. Verification
- [x] 3.1 Update Playwright proofs for the tightened hierarchy, queue presentation, and compact detail flow.
- [x] 3.2 Run `cd web && npm run lint`.
- [x] 3.3 Run `cd web && npm run build`.
- [x] 3.4 Run `cd web && npm run test:e2e:platform`.
- [x] 3.5 Run `cd web && npm run test:e2e`.
- [x] 3.6 Run `openspec validate tighten-operator-workbench-focus --strict --no-interactive`.
