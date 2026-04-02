## 1. Foundation Baseline
Dependency note: `1.1` and `1.2` define the baseline that later platform and governance work must enforce.

- [x] 1.1 Standardize the frontend stack on one primitive foundation, one workflow state-model layer for complex operator flows, and one tabular data foundation.
- [x] 1.2 Document the role boundaries for those foundations so route pages and features do not treat them as interchangeable UI kits.

## 2. Platform Layer and Workbench Surfaces
Dependency note: `2.1` depends on `1.1`; `2.2` through `2.4` depend on the canonical shells from `2.1`.

- [x] 2.1 Introduce a project-owned `platform` layer with canonical workspace, master-detail, detail, run-inspection, status, and authoring shells.
- [x] 2.2 Route and workspace surfaces through the platform layer instead of composing directly from raw primitive components.
- [x] 2.3 Implement the required operator workbench surface set through the platform layer: search and global actions, queue and filter context, inspector, detail workspace, and run-inspection entry.
- [x] 2.4 Define responsive master-detail behavior so narrow viewports degrade to platform-approved list-and-overlay flows rather than horizontal overflow as the primary mode.

## 3. Architecture Boundaries Inside the Platform
Dependency note: `3.1` through `3.4` depend on the platform boundaries from sections `1` and `2`.

- [x] 3.1 Keep active operator context in route-addressable state so queue, selected change, selected run, and active workspace survive reload and navigation.
- [x] 3.2 Add a shared web contract boundary for request execution, response validation, error normalization, and contract-failure handling.
- [x] 3.3 Move backend-owned queue, change, run, approval, and clarification entities behind a shared server-state orchestration layer.
- [x] 3.4 Reconcile tenant events through a shared realtime boundary instead of root-component fetch chains.

## 4. Workflow State Modeling
Parallel note: `4.1` can proceed alongside `2.1` once the dependency baseline is in place.

- [x] 4.1 Identify workflow-heavy surfaces that require explicit state models, starting with run execution, approvals, and clarifications.
- [x] 4.2 Move those workflow surfaces behind explicit state-model boundaries while keeping simple presentational state out of the workflow layer.

## 5. Governance and Validation
Dependency note: `5.1` through `5.3` depend on the platform boundaries from sections `1` through `3`.

- [x] 5.1 Add lint or import-boundary rules that fail when route-level or workspace-level code bypasses the project-owned platform layer.
- [x] 5.2 Add governance rules that prohibit a second primary design system or silent UI fallback paths without an approved OpenSpec change.
- [x] 5.3 Add browser-level conformance checks that prove key operator surfaces still render through the approved platform shells and preserve operator context across navigation.

## 6. Validation
- [x] 6.1 Run `npm run lint` in `web/`.
- [x] 6.2 Run `npm run build` in `web/`.
- [x] 6.3 Run `npm run test:e2e` in `web/`.
- [x] 6.4 Run the platform-conformance browser gate introduced by this change.
