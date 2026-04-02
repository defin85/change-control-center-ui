## ADDED Requirements

### Requirement: Canonical Promoted Fact Records
The system SHALL treat a promoted tenant-memory fact as a canonical persisted record and return that canonical record shape from promotion mutations and subsequent backend reads.

#### Scenario: Operator promotes a durable fact from a change
- **WHEN** the operator promotes a validated fact from change memory into tenant memory
- **THEN** the backend persists and returns the fact with its persisted identity, tenant scope, title, body, and approval status
- **AND** later change-detail or tenant-memory reads expose the same canonical fact record fields
- **AND** the browser contract boundary does not reject the successful promotion response because it narrows backend-owned fact metadata

### Requirement: Historical Clarification Round Integrity
The system SHALL keep answered clarification rounds as historical records and accept new clarification submissions only for the currently open round.

#### Scenario: Operator revisits a change after answering a clarification round
- **WHEN** the operator opens a change that already has one or more answered clarification rounds
- **THEN** the answered rounds remain visible as historical planning evidence
- **AND** those answered rounds are not presented as editable or submittable operator forms
- **AND** a later open clarification round starts with a clean draft state rather than silently inheriting answers from an earlier round
