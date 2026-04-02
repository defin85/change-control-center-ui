# Change: Add operator UI platform contract

## Why
The repository previously split UI planning across three overlapping proposals:
- `update-ui-to-control-center-parity` focused on missing operator-facing surfaces and visual density by comparing the new shell against the legacy template.
- `add-operator-web-architecture` focused on routing, server-state orchestration, API contracts, and realtime refresh structure.
- `add-ui-delivery-validation-contract` focused on build, smoke, and backend-served UI verification.

That split created too many active UI changes at once, while the first two were already drifting toward the same outcome. What is still needed is one primary UI proposal that defines both:
- how workflow-oriented operator surfaces are allowed to be built; and
- what the minimum operator workbench shape must contain.

The current web app is still effectively handwritten from raw React state, custom CSS, and bespoke page composition:
- [web/src/App.tsx](/home/egor/code/change-control-center-ui/web/src/App.tsx) mixes product workflow state, layout composition, websocket refresh, mutations, and page-level rendering in one root component.
- [web/src/api.ts](/home/egor/code/change-control-center-ui/web/src/api.ts) is a raw request wrapper with no UI-platform boundary.
- The repository has no agreed primitive foundation, no canonical page shells, no explicit workflow-state modeling layer, and no governance that prevents ad hoc fallback-heavy UI composition or a second primary design system from appearing later.

We discussed whether to adopt a CRUD/admin meta-framework or a heavier enterprise UI kit. The product does not fit that shape cleanly: it is a workflow-oriented operator workbench with queue, detail, run, approval, clarification, and evidence surfaces, not a generic resource admin. The missing value is therefore not another off-the-shelf page framework, but a repository-owned platform contract that keeps the UI predictable while still leaving room for controlled customization.

## What Changes
- Define a dedicated `operator-ui-platform` capability for workflow-oriented operator UI construction.
- Standardize the React operator UI on one primitive foundation, one workflow state-model layer for complex operator flows, one tabular data foundation, and one project-owned platform layer for route and workspace composition.
- Define the minimum operator workbench surface set for the product: search and global actions, queue and filter context, inspector and detail workspace, run inspection entry, and the operator actions required to drive change state forward.
- Define canonical platform shells for workspace, master-detail, detail panels, and authoring flows so page-level composition does not happen directly from raw primitive components.
- Absorb the previously separate architecture seams into the same platform contract: route-addressable operator context, a shared web contract boundary, shared server-state orchestration, and shared realtime reconciliation.
- Define where explicit workflow state models are required and where simpler local UI state remains acceptable.
- Define governance rules that prohibit a second primary design system, silent UI fallback behavior, and route-level bypass of the platform layer without an approved change.
- Replace legacy-template parity as the primary north star with a workflow-oriented operator workbench contract, while preserving the operator-critical surfaces validated by the legacy shell.
- Preserve scope boundaries: this change does not redefine backend-owned truth or UI delivery verification; `add-ui-delivery-validation-contract` remains the separate delivery and smoke contract.

## Impact
- Affected specs: `operator-ui-platform`
- Related changes: `add-ui-delivery-validation-contract`
- Affected code: future `web/package.json` dependency and script policy, future `web/src/platform/*` and `web/src/features/*` boundaries, `web/src/App.tsx`, `web/src/components/*`, `web/src/styles.css`, future lint/import-boundary configuration, and future browser conformance coverage for platform governance
