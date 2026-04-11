## ADDED Requirements
### Requirement: Truthful Shipped Shell Baseline
The system SHALL keep the current shipped backend-served shell baseline aligned across product docs, readiness gates, and future functional rollout proposals.

#### Scenario: Contributor plans follow-up UI functionality after the static reset
- **WHEN** a contributor reads repository docs, current specs, or a new UI change proposal
- **THEN** the current shipped backend-served route is described as the static reference shell
- **AND** later interactive workspaces or workflows are presented as planned follow-up work rather than already shipped behavior
- **AND** readiness guidance does not treat removed live-shell behavior as current product truth
