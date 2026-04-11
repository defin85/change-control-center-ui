# Operator UI Platform

`web/src/platform` is the only approved top-level UI composition boundary for the operator shell.

## Foundation roles

- `@base-ui/react`
  - Purpose: primitive interaction building blocks such as dialogs, drawers, popovers, menus, tabs, fields, and form helpers.
  - Use it for: low-level behavior inside platform shells and feature internals.
  - Do not use it for: route-level page composition or as a second page framework.
- `web/src/platform/foundation/*`
  - Purpose: project-owned thin wrappers that keep missing primitives, such as multiline authoring fields, inside the approved foundation boundary instead of scattering raw controls across features.
  - Use it for: the smallest possible bridge when the approved primitive stack does not ship an exact control.
  - Do not use it for: inventing a second primitive system or bypassing `@base-ui/react` where it already provides the needed control.

- `xstate` and `@xstate/react`
  - Purpose: explicit workflow state boundaries for multi-step operator flows.
  - Use it for: command lifecycles in run execution, approvals, clarifications, and similar transition-heavy flows.
  - Do not use it for: simple presentational toggles, one-field drafts, or ordinary local component state.

- `@tanstack/react-table`
  - Purpose: tabular data modeling, row state, and rendering helpers for queue-like surfaces.
  - Use it for: operator queue, run lists, evidence lists, and other data-heavy table surfaces.
  - Do not use it for: general layout, detail panes, or non-tabular page composition.

- `web/src/platform/*`
  - Purpose: project-owned shells for workspace, master-detail, detail, run inspection, status, and authoring composition.
  - Use it for: route-level and workspace-level surfaces.
  - Do not use raw third-party containers as the primary page composition path when a platform shell is required.

## Import policy

- Route pages compose through `platform/*` first.
- Feature internals may use foundation primitives directly when the concern stays inside the feature and does not define the page shell.
- New top-level UI responsibilities must extend `platform/*`, not introduce a parallel primary design system.
- Alternate primary stacks such as `antd`, `MUI`, `Radix-first page shells`, `Chakra`, `Headless UI`, `react-admin`, or `Refine` are blocked by repository governance unless a new OpenSpec change approves them.
- Silent UI fallback paths and client-only mock surfaces are not an accepted substitute for backend-owned operator state.
- Shell actions without an approved backend contract must stay explicitly unavailable instead of pretending to work through placeholder toasts or temporary fallback copy.

## Current approved entrypoints

- `platform/foundation/primitives.ts`
- `platform/foundation/fields.tsx`
- `platform/foundation/state.ts`
- `platform/foundation/table.ts`
- `platform/foundation/stack.ts`
- `platform/contracts/controlApi.ts`
- `platform/navigation/operatorRouteState.ts`
- `platform/realtime/useTenantRealtimeBoundary.ts`
- `platform/server-state/filtering.ts`
- `platform/workflow/useAsyncWorkflowCommandMachine.ts`
- `platform/workbench/RepositoryAuthoringDialog.tsx`
- `platform/workbench/RepositoryCatalogProfile.tsx`
- `platform/index.ts`

## Workflow boundary catalog

- `platform/workflow/useAsyncWorkflowCommandMachine.ts`
  - Retained for bounded async command lifecycles inside shipped static-reference adjunct flows such as repository selection and authoring dialogs.
  - It is no longer evidence that a live operator workbench ships on the default backend-served route.
