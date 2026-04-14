# ui-delivery-validation Specification

## Purpose
Define the backend-served UI delivery and verification contract for the bootstrap-hydrated shell baseline, including the shipped functional tenant queue on `/`, the shipped repository catalog workspace, artifact delivery, browser smoke tiers, and fail-closed readiness alignment.
## Requirements
### Requirement: Canonical UI Verification Workflow
The system SHALL publish one canonical verification workflow for UI-affecting or backend-served UI changes, including a default smoke path and explicitly separate deeper validation tiers.

#### Scenario: Contributor needs minimum proof for a UI-integrated change
- **WHEN** a contributor needs the minimum required verification for a UI-affecting or backend-served UI change
- **THEN** the repository provides one documented smoke path to follow
- **AND** the smoke path identifies the minimum required commands instead of forcing contributors to infer them from scattered docs
- **AND** heavier manual or extended validation paths remain documented separately from the default smoke path

### Requirement: Backend-Served UI Artifact Contract
The system SHALL treat the built web bundle as an explicit artifact for backend-served operator UI delivery and smoke verification.

#### Scenario: Smoke or delivery uses the backend product entrypoint
- **WHEN** the backend-served operator shell is started for smoke verification or release-style delivery
- **THEN** the verification or startup path ensures the current web build output exists before the UI is declared healthy
- **AND** the backend product entrypoint serves the built `index.html` and static assets from that artifact
- **AND** missing build output causes an explicit failure rather than silently passing through a frontend-only or partial shell path

### Requirement: Backend-Entrypoint Operator Browser Smoke
The system SHALL verify critical shipped-shell behavior through browser automation against the backend-served application entrypoint.

#### Scenario: Browser smoke runs against the real shipped shell
- **WHEN** browser smoke verification is executed
- **THEN** the browser targets the backend entrypoint that exposes both Control API behavior and built UI assets
- **AND** the smoke suite proves the functional shell hydrates through backend bootstrap on the default route and then renders backend-owned tenant queue summaries
- **AND** the smoke suite proves the functional repository catalog route restores backend-owned search/filter/selection context while unsupported live-workbench params are normalized away
- **AND** a passing frontend-only development server is not treated as sufficient evidence for backend-served UI health

### Requirement: Platform Functional-Shell Browser Gate
The system SHALL keep a deeper platform browser gate for shell-governance and delivery invariants beyond the default smoke suite.

#### Scenario: Contributor verifies a platform or backend-served shell change
- **WHEN** the operator UI platform gate is executed
- **THEN** the platform suite proves bootstrap failure handling is explicit and fail-closed
- **AND** the platform suite proves queue selected-change handoff, stale-selection repair, filtering, and tenant switching on the shipped default workspace
- **AND** the platform suite proves repository selection, compact detail behavior, and queue handoff on the shipped catalog workspace
- **AND** a passing smoke suite alone is not treated as sufficient evidence for platform integrity
- **AND** deeper shell proofs remain routed through repo-owned verification entrypoints rather than ad hoc browser commands

### Requirement: Fail-Closed UI Readiness Drift Gate
The system SHALL provide a machine-checkable readiness gate that detects drift between documented UI verification commands, helper automation, and the repository's runnable entrypoints.

#### Scenario: UI verification instructions drift from executable commands
- **WHEN** a documented or scripted UI verification command no longer matches the actual build or test entrypoints or required artifact locations
- **THEN** the readiness gate fails explicitly
- **AND** the repository does not rely on manual review alone to keep `README`, agent instructions, and verification helpers aligned
- **AND** contributors get a clear correction path instead of a silent fallback

### Requirement: Functional Shell Proof Pack
The system SHALL provide a deterministic verification pack for the functional backend-served operator shell.

#### Scenario: Contributor verifies a functional shell change
- **WHEN** a contributor runs the canonical UI verification workflow after the functional shell has been restored
- **THEN** the verification tiers prove backend-served functional catalog, queue, selected-change, run, command, collaboration, and realtime behavior through repo-owned entrypoints
- **AND** the repository does not treat static-only smoke evidence as sufficient proof for the richer functional shell
- **AND** readiness docs, helper automation, and launcher entrypoints stay aligned with the same verification matrix

