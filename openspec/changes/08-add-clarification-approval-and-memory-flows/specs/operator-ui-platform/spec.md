## ADDED Requirements
### Requirement: Functional Clarification Approval And Memory Flows
The system SHALL expose clarification, approval, and fact-promotion workflows through functional selected-change and run surfaces.

#### Scenario: Operator resolves a clarification round for the selected change
- **WHEN** the operator creates or answers a clarification round from selected-change context
- **THEN** the shell persists that work through backend-owned clarification contracts
- **AND** historical clarification rounds remain visible without becoming silently editable again

#### Scenario: Operator resolves run approvals or promotes a durable fact
- **WHEN** the operator decides an approval from run detail or promotes a fact from selected-change context
- **THEN** the shell routes the action through backend-owned approval or promotion contracts
- **AND** the affected run, change, and tenant-memory state reconcile through the shared shell controller
