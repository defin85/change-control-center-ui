# Change: Add operator UI platform contract

## Why
The repository now has three different UI concerns moving in parallel:
- `update-ui-to-control-center-parity` restores missing operator-facing surfaces and visual density.
- `add-operator-web-architecture` defines how routing, server-state orchestration, API contracts, and realtime refresh should be structured.
- `add-ui-delivery-validation-contract` defines how the built UI is verified and delivered through the backend entrypoint.

What is still missing is a platform-level contract for how operator UI surfaces are allowed to be built in the first place.

The current web app is still effectively handwritten from raw React state, custom CSS, and bespoke page composition:
- [web/src/App.tsx](/home/egor/code/change-control-center-ui/web/src/App.tsx) mixes product workflow state, layout composition, websocket refresh, mutations, and page-level rendering in one root component.
- [web/src/api.ts](/home/egor/code/change-control-center-ui/web/src/api.ts) is a raw request wrapper with no UI-platform boundary.
- The repository has no agreed primitive foundation, no canonical page shells, no explicit workflow-state modeling layer, and no governance that prevents ad hoc fallback-heavy UI composition or a second primary design system from appearing later.

We discussed whether to adopt a CRUD/admin meta-framework or a heavier enterprise UI kit. The product does not fit that shape cleanly: it is a workflow-oriented operator workbench with queue, detail, run, approval, clarification, and evidence surfaces, not a generic resource admin. The missing value is therefore not another off-the-shelf page framework, but a repository-owned platform contract that keeps the UI predictable while still leaving room for controlled customization.

## What Changes
- Define a dedicated `operator-ui-platform` capability for workflow-oriented operator UI construction.
- Standardize the React operator UI on one primitive foundation, one workflow state-model layer for complex operator flows, one tabular data foundation, and one project-owned platform layer for route and workspace composition.
- Define canonical platform shells for workspace, master-detail, detail panels, and authoring flows so page-level composition does not happen directly from raw primitive components.
- Define where explicit workflow state models are required and where simpler local UI state remains acceptable.
- Define governance rules that prohibit a second primary design system, silent UI fallback behavior, and route-level bypass of the platform layer without an approved change.
- Preserve scope boundaries: this change does not redefine visible parity goals, backend-owned truth, or UI delivery verification; it constrains how those future surfaces are built.

## Impact
- Affected specs: `operator-ui-platform`
- Related changes: `update-ui-to-control-center-parity`, `add-operator-web-architecture`, `add-ui-delivery-validation-contract`
- Affected code: future `web/package.json` dependency and script policy, future `web/src/platform/*` and `web/src/features/*` boundaries, `web/src/App.tsx`, `web/src/components/*`, `web/src/styles.css`, future lint/import-boundary configuration, and future browser conformance coverage for platform governance
