## 1. Foundation Baseline
Dependency note: `1.1` and `1.2` define the baseline that later platform and governance work must enforce.

- [ ] 1.1 Standardize the frontend stack on one primitive foundation, one workflow state-model layer for complex operator flows, and one tabular data foundation.
- [ ] 1.2 Document the role boundaries for those foundations so route pages and features do not treat them as interchangeable UI kits.

## 2. Platform Layer
Dependency note: `2.1` depends on `1.1`; `2.2` and `2.3` depend on the canonical shells from `2.1`.

- [ ] 2.1 Introduce a project-owned `platform` layer with canonical workspace, master-detail, detail, status, and authoring shells.
- [ ] 2.2 Route and workspace surfaces through the platform layer instead of composing directly from raw primitive components.
- [ ] 2.3 Define responsive master-detail behavior so narrow viewports degrade to platform-approved list-and-overlay flows rather than horizontal overflow as the primary mode.

## 3. Workflow State Modeling
Parallel note: `3.1` can proceed alongside `2.1` once the dependency baseline is in place.

- [ ] 3.1 Identify workflow-heavy surfaces that require explicit state models, starting with run execution, approvals, and clarifications.
- [ ] 3.2 Move those workflow surfaces behind explicit state-model boundaries while keeping simple presentational state out of the workflow layer.

## 4. Governance and Validation
Dependency note: `4.1` through `4.3` depend on the platform boundaries from sections `1` and `2`.

- [ ] 4.1 Add lint or import-boundary rules that fail when route-level or workspace-level code bypasses the project-owned platform layer.
- [ ] 4.2 Add governance rules that prohibit a second primary design system or silent UI fallback paths without an approved OpenSpec change.
- [ ] 4.3 Add browser-level conformance checks that prove key operator surfaces still render through the approved platform shells.

## 5. Validation
- [ ] 5.1 Run `npm run lint` in `web/`.
- [ ] 5.2 Run `npm run build` in `web/`.
- [ ] 5.3 Run `npm run test:e2e` in `web/`.
- [ ] 5.4 Run the platform-conformance browser gate introduced by this change.
