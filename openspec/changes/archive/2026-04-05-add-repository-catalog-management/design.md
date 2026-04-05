## Context
The product already models each repository/workspace as a tenant boundary, and the operator shell already supports backend-owned tenant creation plus tenant-safe queue reconciliation. What is missing is a portfolio-level surface that helps an operator answer a higher-order question before entering queue work: "Which repository needs attention next?"

Today that decision is hidden behind a small tenant picker in the header. The picker works as a navigation control, but it does not scale into a management surface because it cannot show repository load, last activity, blocked work, or empty-state onboarding. A repository catalog should therefore become a first-class workbench mode, while still preserving the validated default IA of `Control Queue`, `Change Detail`, `Run Studio`, and `Chief`.

## Goals / Non-Goals
- Goals:
  - Add a dedicated repository catalog workspace for portfolio-level repository selection and onboarding.
  - Keep repository summaries backend-owned so the browser does not aggregate cross-tenant data ad hoc.
  - Preserve the existing change-centric workbench as the default operational mode after a repository is chosen.
  - Make creation of a new repository entry feel like part of catalog management rather than an isolated header dialog.
  - Keep compact/mobile behavior readable and platform-governed.
- Non-Goals:
  - Replacing the default queue/detail workbench with a generic admin dashboard.
  - Adding tenant metadata editing, archival, deletion, or undo flows.
  - Discovering repositories directly from the filesystem.
  - Introducing a second primary UI stack or CRUD framework.

## Decisions
- Decision: Repository catalog is a route-addressable workbench mode, not a transient modal.
  - The shell gains a top-level workspace mode such as `queue` and `catalog`.
  - The active tenant remains the selected repository context; the route stores both the active workspace mode and the active tenant.
  - Why: the catalog is a portfolio surface with scan, compare, and onboarding tasks. Those tasks deserve a stable workspace that can survive reload and browser navigation.

- Decision: The catalog reuses the approved platform grammar through a master-detail layout.
  - The list surface renders repository rows/cards.
  - The detail surface renders the selected repository profile, workload summary, and quick actions.
  - Why: this keeps the new surface inside the project-owned platform boundary instead of inventing a separate page grammar.

- Decision: Catalog summaries are backend-derived and intentionally compact.
  - Each repository entry includes canonical tenant metadata plus a small operator summary such as total changes, blocked changes, ready changes, last activity, and an attention state.
  - The UI may filter and search these summaries client-side, but it must not synthesize the summary by fetching every tenant queue independently.
  - Why: portfolio-level signals must remain consistent with backend-owned truth and must load predictably.

- Decision: Project creation flows into the same catalog surface.
  - The existing header shortcut remains available, but it opens the same governed authoring flow used from the catalog workspace.
  - After successful creation, the new repository becomes the active tenant, appears in the catalog immediately, and exposes an explicit next step such as `Open queue` or `Create first change`.
  - Why: a repository catalog without integrated onboarding would keep creation detached from the management model.

- Decision: Catalog mode does not replace the queue-first operational path.
  - `Control Queue` remains the default execution workspace once a repository is selected.
  - The catalog is the portfolio layer above that work, not a new home page that duplicates queue and change-detail semantics.
  - Why: the product remains change-centric; repository management exists to choose and prepare the right work context, not to turn the product into a generic repo admin.

- Decision: Compact behavior becomes stacked list plus overlay detail.
  - On narrow viewports, the catalog list remains the primary scannable surface.
  - Selecting a repository opens its profile in a platform-approved drawer/dialog path rather than forcing a cramped two-column layout.
  - Why: repository comparison is list-heavy, while profile actions need focused detail space on compact screens.

## Information Architecture

### Entry points
- Header-level workspace toggle: `Workbench` / `Repositories`
- Header shortcut: `New repository`
- Optional empty-state CTA from queue mode when only one or zero repositories exist

### Desktop layout
```text
+----------------------------------------------------------------------------------+
| Header: workspace toggle | search | New repository | New change | Run next step |
+----------------------------------------------------------------------------------+
| Quiet support rail | Repository catalog list            | Repository profile     |
|                    |                                    |                        |
| status filters     | attention pill  name              | name + repo path       |
| needs setup        | load summary    repo path         | description            |
| active             | last activity   next recommended  | workload breakdown     |
| blocked            |                                    | recent change preview   |
| idle               |                                    | actions: Open queue     |
|                    |                                    |          Create change  |
+----------------------------------------------------------------------------------+
```

### Compact layout
```text
+--------------------------------------------------+
| Header: Repositories | search | New repository   |
+--------------------------------------------------+
| Filter chips                                      |
| Repository list as stacked cards                  |
|   name                                            |
|   repo path                                       |
|   blocked / ready / active counts                 |
|   last activity                                   |
+--------------------------------------------------+
| Selecting a card opens a drawer with profile and  |
| actions: Open queue, Create first change          |
+--------------------------------------------------+
```

## Interaction Model
- Search filters the visible repository catalog without mutating backend truth.
- Status filters segment the catalog into operational slices such as `needs setup`, `active`, `blocked`, and `quiet`.
- Selecting a repository updates active tenant context through the existing tenant-safe orchestration path.
- `Open queue` exits catalog mode and returns to the change workbench for the selected repository.
- `New repository` opens a governed authoring flow with pending and error states; success selects the new repository and keeps the operator in catalog mode until they choose the next action.

## Risks / Trade-offs
- A route-addressable catalog mode increases navigation-state complexity because the shell now needs to reconcile workspace mode as well as tenant, change, run, and tab context.
  - Mitigation: keep catalog mode keyed by the same active tenant identity rather than inventing a second repository-selection concept.

- Backend-owned summary aggregation adds another contract surface that can drift from queue truth if implemented independently.
  - Mitigation: derive catalog summaries from the same store-backed tenant/change state used by queue bootstrap and cover the mapping in backend tests.

- The catalog could visually compete with the change workbench if it is over-designed or turned into a dashboard of equal-weight cards.
  - Mitigation: keep the list disciplined and editorial, with compact row/card summaries and one clear detail panel rather than a multi-card dashboard.

## Migration Plan
1. Add backend catalog summary builders and a canonical API/bootstrap contract for repository entries.
2. Extend web contracts, route state, and server-state orchestration for catalog mode and summary refresh.
3. Build repository catalog list/profile surfaces and unify project creation through that flow.
4. Add browser coverage for catalog load, creation, routing, tenant-safe switching, and compact behavior.

## Open Questions
- None blocking for the proposal. This change intentionally leaves metadata editing and tenant archival for a later follow-up if operators need deeper repository administration.
