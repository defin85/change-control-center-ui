## Context
The default shell now follows the simple reference visually, but the `Repositories` pill does not open a real workspace. Repository-focused interaction still lives in legacy-oriented catalog components that were designed for the deprecated workbench and are not authoritative in the shipped shell.

This change establishes a single canonical repository workspace for the simple-reference product direction. The goal is not to add more dashboard chrome. The goal is to give operators one calm, scan-first place to answer a narrow question: which repository should receive attention next?

## Goals
- Make `Repositories` a real route-addressable workspace in the shipped shell.
- Reuse the simple-reference visual language without copying legacy dashboard wrappers forward.
- Keep repository selection, tenant context, and authoring actions backend-owned and route-restorable.
- Preserve compact drawer behavior for the selected repository stage.
- Keep the repository workspace operationally focused: list first, selected repository second, no change-detail sprawl.

## Non-Goals
- No new backend entity model or repository analytics contract.
- No attempt to turn `Repositories` into a second change-detail workbench.
- No new `Runs` or `Governance` workspace in this change.
- No client-only synthetic repository health, scores, or charts beyond what can be derived from existing catalog data.

## Decisions
- Decision: `Repositories` is a top-level workspace, not a section inside `Workbench`.
  - The canonical route is `workspace=catalog`.
  - The `Repositories` pill navigates into that workspace instead of acting as static chrome.

- Decision: The desktop layout is a reference-driven paired stage.
  - Top of page: masthead, page header, utility bar, and one compact metrics row.
  - Main stage: a scan-first repository worklist on the left and a selected repository stage on the right.
  - The selected repository stage is quiet and operational. It does not embed full change detail, run studio, or other workflow-heavy surfaces.

- Decision: The worklist is list-first, not card-grid-first.
  - Operators need to compare many repositories quickly.
  - Each row surfaces only the most useful signals from `RepositoryCatalogEntry`: attention state, path, load, last activity, next recommendation, and featured change handoff.
  - Equal-weight dashboard cards are not the canonical list representation.

- Decision: The selected repository stage controls the next move.
  - Primary action is `Open queue` when changes already exist, otherwise `Create first change`.
  - Secondary action is `New change`.
  - The stage also shows repository note, pressure summary, and featured change handoff.

- Decision: Compact viewport keeps the current platform direction.
  - The repository list remains visible.
  - The selected repository stage opens through an approved drawer/dialog path instead of a second standalone route.

- Decision: Existing backend contracts are reused as-is for v1.
  - `repositoryCatalog`, tenant selection, search query, and filter state remain the shared source for this workspace.
  - If later UX work needs richer repository data, that must happen through a separate backend-aware change.

## Layout Model
```text
Masthead
Repository Portfolio header
Utility bar: search + filters + New repository
Metrics row: repositories / active load / blocked repos / cold starts
Main paired stage:
  left  -> repository worklist
  right -> selected repository stage
Status/footer strip
```

## Interaction Model
- Open `Repositories`:
  - sets `workspace=catalog`
  - preserves `tenant`, `filter`, and `q` when already present
- Select repository from the list:
  - updates tenant context through shared orchestration
  - restores the selected stage after reload via route state
- `Open queue`:
  - moves to `workspace=queue` for the selected tenant
- `New repository`:
  - reuses governed repository authoring flow
- `New change`:
  - reuses governed change authoring flow scoped to the selected tenant

## Risks / Trade-offs
- Reusing current catalog data limits how rich the repository stage can be.
  - Mitigation: keep the workspace intentionally narrow and avoid fake analytics.

- A card-heavy reference interpretation would look attractive but reduce scan speed.
  - Mitigation: keep cards for the selected stage and metrics only; use a disciplined list for the worklist itself.

- The deprecated legacy catalog may continue to drift if contributors keep touching it.
  - Mitigation: make the new `Repositories` workspace the canonical proof target and keep the legacy path non-authoritative.

## Validation Strategy
- Rewrite browser proofs so `workspace=catalog` becomes a canonical tested workspace.
- Cover desktop route load, repository selection, route restoration, compact drawer behavior, and queue handoff.
- Validate the OpenSpec change strictly before implementation starts.
