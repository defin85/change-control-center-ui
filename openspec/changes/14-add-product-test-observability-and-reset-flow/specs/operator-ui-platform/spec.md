## ADDED Requirements
### Requirement: Functional Product-Test Diagnostics And Reset Surface
The system SHALL expose product-test reset and runtime diagnostics through explicit operator-facing shell surfaces.

#### Scenario: Operator debugs a failed product test
- **WHEN** runtime launch, evidence collection, or reset fails during a product-test session
- **THEN** the shell exposes the relevant failure status, last diagnostics, and supported recovery actions
- **AND** the operator does not need to inspect raw server logs first just to understand the visible product state

