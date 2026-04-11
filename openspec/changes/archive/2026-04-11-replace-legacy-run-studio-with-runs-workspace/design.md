## Context
The repository is migrating away from the deprecated hidden legacy workbench and toward a new canonical operator UI. Today run inspection still depends on old `Run Studio` behavior and a `legacyWorkbench=1` route, while the new UI has no top-level run-focused workspace of its own.

Operators still need to answer a real operational question that does not fit inside one selected change: which runs currently need attention? That question belongs in the new UI, not in the legacy shell.

## Goals / Non-Goals
- Goals:
  - Introduce a canonical run-focused workspace in the new UI.
  - Keep run state backend-owned and route-restorable.
  - Preserve change-centric workflow while making cross-change run monitoring possible inside the selected tenant.
  - Remove legacy `Run Studio` and the `legacyWorkbench=1` path from supported product flows in the same change.
  - Make the canonical live shell the only shipped operator route.
- Non-Goals:
  - No cross-tenant global run aggregation in v1.
  - No raw transcript browser or transport-level debugging console beyond normalized run data.
  - No compatibility promise for legacy workbench bookmarks or internal shell flags after this change lands.

## Decisions
- Decision: `Runs` becomes a top-level canonical workspace.
  - Canonical route is `workspace=runs`.
  - The workspace remains tenant-scoped, like the queue and repository catalog.

- Decision: The deprecated legacy workbench route is deleted in the same change.
  - `legacyWorkbench=1` is no longer a supported route-state flag.
  - The shipped app no longer branches into the old workbench for compatibility or comparison.
  - Any retained reference artifacts stay outside the supported product route.

- Decision: The default run slice is attention-first.
  - The initial list emphasizes runs that are `running`, `failed`, blocked on approval, or otherwise still operationally relevant.
  - Operators can switch to full history without leaving the workspace.

- Decision: The layout is list-first with a quiet run-detail stage.
  - The left side is a scan-first run worklist.
  - The right side is a selected run detail stage that keeps payload-heavy artifacts visually subordinate.
  - The detail stage must keep the owning change visible and provide a direct handoff back into change context.

- Decision: Change detail keeps local run history.
  - The `Runs` tab inside change detail remains the change-scoped history view.
  - Top-level `Runs` answers a different question: which runs across the active tenant need operator attention right now?

- Decision: Backend adds a canonical run list endpoint.
  - The new UI must not synthesize a global run list by scraping change-detail payloads client-side.
  - The backend provides newest-first run records plus the linked change metadata needed for scanning and handoff.

## Risks / Trade-offs
- A top-level run workspace can pull attention away from change context.
  - Mitigation: keep the workspace attention-first, tenant-scoped, and strongly linked back to the owning change.

- A full-history run list can become noisy quickly.
  - Mitigation: default to an attention slice and keep full history as an explicit operator choice.

- Removing the legacy route in the same patch increases browser-proof and docs churn.
  - Mitigation: treat route deletion as part of the acceptance surface and update routing, docs, and browser proofs together.

## Migration Plan
1. Add a backend-owned run list contract and tests.
2. Add `workspace=runs` route state and canonical new-UI navigation.
3. Build the new runs workspace and selected run detail stage.
4. Remove `legacyWorkbench=1` route handling, preview-only default-route branching, and shipped links into the deprecated shell.
5. Rewire change-detail run handoff so it targets canonical run inspection instead of legacy `Run Studio`.
6. Update browser proofs, docs, and verification gates so the canonical live shell is the only supported operator path.
