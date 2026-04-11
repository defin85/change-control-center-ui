## ADDED Requirements
### Requirement: Sequential Functional Shell Rollout Governance
The system SHALL define functional operator-shell work through an explicit ordered rollout that starts from the static shipped shell baseline instead of reintroducing hidden fallback routes or undocumented parallel shells.

#### Scenario: Contributor proposes a new functional shell capability
- **WHEN** a contributor proposes queue, detail, runs, command, or realtime behavior for the operator shell
- **THEN** the proposal states where that capability fits in the ordered rollout sequence
- **AND** the proposal keeps the current shipped static shell boundary explicit until its dependencies are delivered
- **AND** the proposal does not rely on reviving a removed legacy or hidden live-workbench route as the implementation shortcut
