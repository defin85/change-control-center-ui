## Context
The current web application proves the backend-owned operator model, but it has not yet defined a controlled UI platform shape:
- [web/src/App.tsx](/home/egor/code/change-control-center-ui/web/src/App.tsx) currently owns bootstrap loading, queue filtering, selected change and run state, websocket refresh, mutation flows, error and toast state, and top-level page composition in one file.
- [web/src/components/*](/home/egor/code/change-control-center-ui/web/src/components/ChangeDetail.tsx) are still mostly hand-built presentation islands rather than a reusable project-owned platform layer.
- [web/package.json](/home/egor/code/change-control-center-ui/web/package.json) currently depends only on React, so there is no explicit choice yet for primitive UI foundations, data-grid foundations, or workflow state modeling.

This change now serves as the primary UI proposal for the repository. It intentionally absorbs the useful parts of two earlier ideas:
- from `add-operator-web-architecture`: route-aware context, a shared web contract boundary, shared server-state orchestration, and shared realtime reconciliation;
- from `update-ui-to-control-center-parity`: the requirement that the operator shell expose search, queue, filter, inspector, detail, run-inspection, and related operator action surfaces.

What it does not absorb is the old framing that the product should be guided primarily by visual parity with the legacy template. The legacy shell remains a helpful reference artifact, but the durable contract is now a workflow-oriented operator workbench, not a promise to keep chasing template parity as a separate planning stream.

That absence creates predictable failure modes for both humans and LLM-driven implementation:
- repeated reinvention of dialogs, drawers, tabs, and form flows;
- page composition that bypasses reusable shells;
- ad hoc workflow state encoded across unrelated `useState` and `useEffect` chains;
- styling and interaction drift as each surface invents its own structure;
- future introduction of parallel UI stacks because there is no stated prohibition against them.

The product itself is also not a generic admin console. It is a workflow-oriented operator workbench whose core surfaces are queue, change detail, run inspection, approvals, clarifications, and evidence. That shape suggests a different strategy than CRUD meta-frameworks:
- use one low-level primitive foundation instead of a full opinionated admin kit;
- preserve explicit operator workbench surfaces rather than hiding them behind generic cards or resource pages;
- keep active operator context stable across reload and navigation;
- treat API contracts, server-state, and realtime refresh as platform responsibilities rather than ad hoc per-page code;
- use explicit workflow state modeling where operator transitions matter;
- use a specialized tabular foundation for dense queue/detail lists;
- keep route and workspace composition behind a repository-owned platform layer.

## Goals / Non-Goals
- Goals:
  - Define one stable UI platform contract for workflow-oriented operator surfaces.
  - Consolidate the repository's primary UI planning stream into one main change instead of overlapping UI proposals.
  - Minimize UI-library sprawl by choosing one primitive foundation and banning parallel primary design systems.
  - Make page and workspace composition predictable through project-owned platform shells.
  - Preserve the minimum operator workbench surface set without treating visual legacy parity as a separate product goal.
  - Keep route context, API boundaries, server-state orchestration, and realtime reconciliation inside the same governed platform model.
  - Require explicit state modeling for complex workflow surfaces such as run, approval, and clarification flows.
  - Leave room for controlled customization through slots and platform-approved escape hatches instead of uncontrolled raw composition.
- Non-Goals:
  - Replace React with another application framework.
  - Adopt a generic CRUD/admin meta-framework such as a resource-admin shell as the primary product architecture.
  - Freeze every visual decision or remove all room for feature-specific customization.
  - Redefine backend ownership or the separate delivery verification contract covered by `add-ui-delivery-validation-contract`.

## Decisions
- Decision: Keep React as the application runtime and avoid switching to an admin or workflow meta-framework.
  - Why: the product is a workflow workbench, not a generic resource admin, and the repository already has a working React foundation.

- Decision: Make this change the primary UI contract and absorb the previously separate web-architecture and parity streams.
  - Why: keeping those ideas separate creates planning overlap and obscures which UI contract is actually authoritative.

- Decision: Standardize on one unstyled primitive foundation rather than a full opinionated component framework.
  - Why: the project needs predictable interaction primitives without inheriting a foreign page grammar or visual system.
  - Implementation direction: use `Base UI` as the primary primitive foundation for dialog, drawer, menu, select, tabs, form, field, and toast behavior.

- Decision: Use a dedicated workflow state-model layer only where the product has real state transitions.
  - Why: approvals, clarifications, run execution, and related operator flows are more reliable when transitions are explicit rather than scattered across ad hoc effects.
  - Implementation direction: use `XState` for complex workflow surfaces, but do not require it for every simple local input or presentational toggle.

- Decision: Use a dedicated tabular foundation for dense queue and evidence surfaces.
  - Why: queue, runs, and evidence are tabular operator surfaces with sorting, density, and potential virtualization needs that should not be reimplemented from scratch.
  - Implementation direction: use `TanStack Table`, with `TanStack Virtual` only when density or scale requires it.

- Decision: Introduce a project-owned `platform` layer as the only canonical page-composition boundary.
  - Why: the real governance problem is not low-level buttons; it is uncontrolled page composition.
  - Implementation direction: route and top-level workspace surfaces compose through shells such as `WorkspacePage`, `MasterDetailShell`, `EntityDetails`, `DrawerFormShell`, and related project-owned components rather than directly through raw primitives.

- Decision: Define the operator workbench surface set as part of the same platform contract.
  - Why: the product still needs explicit guarantees about queue, inspector, detail, run-studio, and operator actions even after we stop using legacy-template parity as the main planning frame.
  - Implementation direction: the primary shell exposes search and global actions, queue and filter context, inspector, detail workspace, and dedicated run-inspection entry points through platform-approved shells.

- Decision: Absorb route context, API boundary, server-state orchestration, and realtime refresh into the platform contract.
  - Why: those seams directly shape how platform shells behave and should not live in a parallel proposal anymore.
  - Implementation direction: route state, shared web contracts, server-state caches, and realtime reconciliation become required implementation boundaries inside the platform model.

- Decision: Allow controlled escape hatches, but fail closed on silent fallback or parallel design systems.
  - Why: the platform contract must stay extensible without becoming optional.
  - Implementation direction: platform exceptions require documented slots, adapters, or an approved OpenSpec change; silent UI fallback behavior and a second primary design system are prohibited.

## Alternatives Considered
- Alternative: adopt a CRUD/admin meta-framework such as a resource-admin shell.
  - Rejected because the product's core is workflow-driven rather than resource-admin-driven.

- Alternative: adopt a full opinionated enterprise UI framework as the primary page-construction layer.
  - Rejected because it would import a foreign page grammar and make later governance depend on framework conventions instead of repository rules.

- Alternative: keep platform governance, web architecture, and visible workbench surfaces as separate top-level UI changes.
  - Rejected because the boundaries are too coupled and leave the repository with too many overlapping "main UI" proposals.

- Alternative: stay with fully custom primitives and handwritten shells.
  - Rejected because it invites exactly the fallback, stylistic drift, and reinvention problems the change is meant to prevent.

- Alternative: use multiple primitive layers and pick whichever fits a given feature.
  - Rejected because it creates the UI zoo the user wants to avoid.

## Risks / Trade-offs
- Adding `Base UI`, `XState`, and `TanStack Table` increases frontend dependency count.
  - Mitigation: keep them as the only approved foundations in their respective roles and forbid parallel replacements.

- Overusing explicit workflow state models can make simple UI harder to work with.
  - Mitigation: reserve `XState` for complex stateful operator flows, not for every button or field.

- A strict platform layer can feel slow if it does not provide enough extension points.
  - Mitigation: require platform-approved slots and wrappers so customization stays possible without bypassing governance.

- If governance is documented but not enforced, it will drift quickly.
  - Mitigation: implementation must include import-boundary linting and browser conformance checks aligned with `add-ui-delivery-validation-contract`.

## Migration Plan
1. Standardize the frontend dependency baseline around one primitive foundation, one workflow state-model layer, and one tabular data foundation.
2. Introduce a `platform` layer with canonical workspace, master-detail, detail, run-inspection, and authoring shells.
3. Move route context, shared web contracts, server-state orchestration, and realtime reconciliation behind governed platform boundaries.
4. Rebuild the operator shell around the required workbench surfaces through those platform shells.
5. Move complex workflow surfaces onto explicit state models where transitions matter.
6. Restrict route-level and workspace-level UI composition so it cannot bypass the platform layer.
7. Add validation gates that detect platform-boundary violations and browser-level conformance regressions.

## Open Questions
- None blocking. Assumption: `Base UI`, `XState`, and `TanStack Table` are the intended target stack for this change, while React remains the application runtime and no second primary UI framework is introduced.
