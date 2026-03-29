## ADDED Requirements

### Requirement: Route-Addressable Operator Context
The system SHALL keep active operator context in URL-addressable navigation state so the UI can restore the selected tenant, queue context, selected change, selected run, and active workspace after reload or back/forward navigation.

#### Scenario: Operator reloads while inspecting a selected run
- **WHEN** the operator has a tenant, queue slice, selected change, selected run, and active workspace open
- **AND** the operator reloads the page or returns through browser navigation
- **THEN** the shell restores the same operator context from navigation state
- **AND** the restored context is rehydrated from backend responses rather than client-only cached truth

### Requirement: Shared Web Contract Boundary
The system SHALL route Control API traffic through a shared web contract boundary that centralizes request execution, response validation, error normalization, and transport or authentication failure handling.

#### Scenario: Backend contract or transport failure occurs
- **WHEN** feature code invokes a Control API operation and the request fails at the network, HTTP, or response-contract layer
- **THEN** the shared contract boundary emits a normalized failure for UI handling
- **AND** feature components do not duplicate low-level fetch and parsing logic
- **AND** invalid payloads are treated as contract failures instead of being silently accepted

### Requirement: Shared Server-State Orchestration
The system SHALL manage backend-owned queue, change, run, approval, and clarification entities through a shared server-state orchestration layer rather than duplicating those entities in ad hoc root-component state.

#### Scenario: Operator triggers a mutation that changes selected work
- **WHEN** the operator runs a command or approval action that changes queue, change detail, run detail, or clarification state
- **THEN** the affected surfaces reconcile through shared invalidation or update rules
- **AND** the selected context is preserved when the backend still considers it valid
- **AND** the frontend does not create a separate durable source of truth for the mutated entities

### Requirement: Feature-Level Operator Web Composition
The system SHALL keep the root operator application shell thin by delegating queue, detail, run studio, clarification, and shared UI concerns to focused feature modules with stable interfaces.

#### Scenario: Developer changes one operator surface
- **WHEN** a developer updates queue, detail, run studio, or clarification behavior
- **THEN** the change can be isolated to the relevant feature boundary and shared contracts
- **AND** the root shell remains responsible only for high-level composition, routing, and providers
- **AND** one surface enhancement does not require broad cross-cutting edits through a monolithic root component

### Requirement: Shared Realtime Reconciliation Boundary
The system SHALL reconcile tenant event subscriptions through a shared realtime boundary that refreshes affected server-state surfaces without ad hoc chained fetch flows in the root component.

#### Scenario: Tenant event arrives while operator inspects selected change context
- **WHEN** a realtime tenant event indicates that queue, change detail, run detail, or clarification data changed
- **THEN** the shared realtime boundary triggers targeted cache updates or invalidations for the affected surfaces
- **AND** the operator retains selected change and run context when that context remains valid in backend state
- **AND** realtime handling does not require each feature to open its own independent subscription path
