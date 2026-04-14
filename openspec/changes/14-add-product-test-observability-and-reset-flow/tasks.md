## 1. Reset And Import Foundation
- [ ] 1.1 Add backend-owned sandbox tenant import and reset operations that rebuild a known product-test baseline without manual DB or filesystem edits.
- [ ] 1.2 Restrict reset operations to approved product-test tenants or repositories and fail closed elsewhere.

## 2. Diagnostics UX
- [ ] 2.1 Surface runtime diagnostics, last failure details, and reset status through shipped shell surfaces.
- [ ] 2.2 Keep reset and recovery behavior explicit so operators can recover product-test state without guessing hidden backend conditions.

## 3. Proof And Runbook
- [ ] 3.1 Add browser and launcher coverage for reset or import flows and runtime diagnostics on the backend-served shell.
- [ ] 3.2 Update the repo-owned product-test runbook and run `openspec validate 14-add-product-test-observability-and-reset-flow --strict --no-interactive`.

