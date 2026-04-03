## ADDED Requirements

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
The system SHALL verify critical operator UI flows through browser automation against the backend-served application entrypoint.

#### Scenario: Browser smoke runs against the real operator shell
- **WHEN** browser smoke verification is executed
- **THEN** the browser targets the backend entrypoint that exposes both Control API behavior and built UI assets
- **AND** the smoke suite exercises queue/detail navigation plus at least one persisted operator workflow such as run handling, approval resolution, or clarification persistence
- **AND** a passing frontend-only development server is not treated as sufficient evidence for backend-served UI health

### Requirement: Fail-Closed UI Readiness Drift Gate
The system SHALL provide a machine-checkable readiness gate that detects drift between documented UI verification commands, helper automation, and the repository's runnable entrypoints.

#### Scenario: UI verification instructions drift from executable commands
- **WHEN** a documented or scripted UI verification command no longer matches the actual build or test entrypoints or required artifact locations
- **THEN** the readiness gate fails explicitly
- **AND** the repository does not rely on manual review alone to keep `README`, agent instructions, and verification helpers aligned
- **AND** contributors get a clear correction path instead of a silent fallback
