# Change: Add product-test observability and reset flow

## Why
Even after runs become repo-bound and evidence becomes real, product testing will remain brittle if operators need manual database cleanup, ad hoc fixture edits, or backend log spelunking just to return the system to a known state. That turns every dogfood session into environment triage.

The product needs one repeatable reset/import/diagnostics path so a contributor can prepare, run, and recover a real product test without hidden local knowledge.

## What Changes
- Add backend-owned import and reset flows for approved product-test tenants or repositories.
- Surface runtime diagnostics, last-failure details, and reset status through the shipped shell.
- Document one repo-owned product-test runbook and verification path for preparation and recovery.
- Keep reset operations scoped and fail closed so the recovery path itself is safe to use.

## Impact
- Affected specs: `application-foundation`, `operator-ui-platform`, `ui-delivery-validation`
- Affected code: `backend/app/*`, `backend/tests/*`, `web/src/platform/*`, `web/src/reference/*`, `web/e2e/*`, `scripts/ccc`, `docs/agent/verification.md`, `README.md`
- Dependencies:
  - `11-add-change-contract-authoring-and-openspec-export`
  - `12-add-repo-bound-run-context-and-worktree-lifecycle`
  - `13-add-real-runtime-output-and-git-evidence-ingestion`

