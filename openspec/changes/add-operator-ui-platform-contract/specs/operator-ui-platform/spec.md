## ADDED Requirements

### Requirement: Single Operator UI Foundation Stack
The system SHALL standardize the React operator UI on one primitive interaction foundation, one workflow state-model layer for complex operator flows, one tabular data foundation, and one project-owned platform layer for top-level UI composition.

#### Scenario: Developer adds a new operator surface
- **WHEN** a developer implements a new operator surface such as queue, change detail, run inspection, approval handling, or clarification authoring
- **THEN** the surface uses the approved primitive, workflow-state, table, and platform foundations for their respective roles
- **AND** the implementation does not introduce a parallel primary UI stack for the same responsibilities

### Requirement: Project-Owned Platform Composition
The system SHALL require route-level and workspace-level operator surfaces to compose through project-owned platform shells rather than directly from raw primitive or third-party page containers.

#### Scenario: Route page needs a master-detail or authoring surface
- **WHEN** a route-level or workspace-level operator surface needs master-detail layout, detail rendering, or authoring entry points
- **THEN** it uses approved project-owned platform shells for those concerns
- **AND** raw primitive components remain implementation details inside the platform layer or feature internals rather than the primary route-composition mechanism

### Requirement: Explicit Workflow State Boundaries
The system SHALL model complex operator workflow transitions through explicit workflow state boundaries instead of scattering them across ad hoc local effect chains.

#### Scenario: Operator flow has multi-step state transitions
- **WHEN** a surface coordinates workflow-heavy transitions such as run execution, approval resolution, clarification rounds, or similar operator state progressions
- **THEN** the surface uses an explicit workflow state boundary with defined transitions
- **AND** simple presentational toggles or single-field drafts are not forced into the same workflow layer when that would add unnecessary complexity

### Requirement: Governed Operator Authoring and Responsive Detail Flows
The system SHALL provide canonical platform-approved entry points for operator authoring and responsive detail workflows.

#### Scenario: Narrow viewport opens a detail or edit flow
- **WHEN** an operator opens a detail-adjacent edit or authoring flow on a narrow viewport
- **THEN** the workflow degrades through a platform-approved overlay or drawer-style path rather than treating horizontal overflow as the primary interaction mode
- **AND** feature code does not invent a separate primary authoring path outside the approved platform shells

### Requirement: Fail-Closed UI Governance
The system SHALL fail closed on platform-governance violations such as silent UI fallback behavior, route-level platform bypass, or introduction of a second primary design system without an approved change.

#### Scenario: Feature implementation bypasses the UI platform contract
- **WHEN** a feature attempts to bypass the approved platform layer, silently falls back to an alternate UI path, or introduces a second primary design system without an approved OpenSpec change
- **THEN** repository governance and verification gates detect the violation explicitly
- **AND** the build or validation workflow does not treat that violation as acceptable drift
