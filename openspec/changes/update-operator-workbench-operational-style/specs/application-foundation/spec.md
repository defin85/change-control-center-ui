## ADDED Requirements

### Requirement: Canonical Orchestrator Owner Contract
The system SHALL model each change `owner` as a structured backend-owned orchestrator contract with durable `id` and operator-facing `label`, and SHALL project that contract through canonical change summary and change detail contracts.

#### Scenario: Operator scans ownership in the queue
- **WHEN** the backend returns bootstrap or tenant change-list data for the operator workbench
- **THEN** each change summary includes the canonical `owner.id` and `owner.label` for the orchestrator responsible for that change
- **AND** the browser does not infer change ownership from client-only sample data, active run selection, or transient Codex session identifiers
- **AND** queue-level ownership remains tenant-scoped backend truth

#### Scenario: Operator compares queue ownership with change detail
- **WHEN** the operator opens change detail for a change that was visible in the queue
- **THEN** `owner.id` and `owner.label` in detail match the same backend-owned orchestrator contract shown in the queue summary
- **AND** queue and detail responses do not use different meanings or shapes for `owner`

#### Scenario: Orchestrator runtime session is restarted
- **WHEN** the live Codex app or CLI session backing an orchestrator is restarted, rebound, or replaced
- **THEN** the durable `owner.id` for the change remains stable
- **AND** runtime session lineage remains separate from the `owner` contract
- **AND** a session restart does not require the UI to reinterpret change ownership from transport metadata
