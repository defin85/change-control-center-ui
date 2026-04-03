## Context
The operator shell already owns tenant-scoped queue and detail context, but tenant creation and change removal are missing from the backend contract and from the workbench UI. This change adds those lifecycle operations without introducing a second source of truth or bypassing the shared orchestration boundary.

## Goals
- Keep tenant creation and change deletion backend-owned.
- Preserve route and selected-context safety after destructive mutations.
- Use existing platform primitives and workflow boundaries for authoring and confirmation UI.

## Non-Goals
- Bulk deletion or archival flows.
- Editing tenant metadata after creation.
- Soft-delete or undo semantics for changes.

## Decisions
- Decision: Create tenants through a dedicated backend API returning the canonical tenant record.
  - Why: the workbench already treats tenant as backend-owned state; creation should use the same contract boundary.

- Decision: Delete changes through a dedicated backend API with cascade cleanup of child records.
  - Why: runs, approvals, clarification rounds, and evidence are backend-owned records tied to the deleted change and should not survive as orphaned rows.

- Decision: Use an explicit dialog-based form for `New project` and a separate explicit confirmation dialog for `Delete change`.
  - Why: both actions mutate backend state and need clear pending/error boundaries instead of inline accidental clicks or browser prompts.

- Decision: After change deletion, re-resolve visible selection from the current tenant queue rather than trusting stale selected context.
  - Why: this matches the existing tenant-safe orchestration model and prevents route state from pointing at a removed entity.

## Risks
- Deleting a selected change can leave stale selected run/detail context if orchestration is incomplete.
  - Mitigation: clear selected run state, refresh queue, and only rehydrate detail when the replacement selection is still valid.

- Tenant creation can create duplicate or invalid project entries if validation is weak.
  - Mitigation: require non-empty `name` and `repoPath`, and fail closed on duplicate tenant id or duplicate repo path.
