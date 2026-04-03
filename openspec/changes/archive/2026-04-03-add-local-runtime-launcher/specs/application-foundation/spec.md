## ADDED Requirements

### Requirement: Repo-Owned Local Runtime Launcher
The system SHALL provide one repo-owned launcher for local stack build and runtime lifecycle management across explicit `dev`, `served`, and deterministic `e2e` profiles.

#### Scenario: Contributor starts a supported local stack profile
- **WHEN** a contributor starts the local stack through the repository launcher
- **THEN** the launcher starts the processes required for the selected profile using the documented ports and health checks
- **AND** the launcher fails closed instead of silently reusing an unrelated process that already occupies a required port
- **AND** the documented local runbook points to the launcher rather than duplicating raw lifecycle commands

#### Scenario: Contributor manages the stack lifecycle after startup
- **WHEN** a contributor runs repo-owned lifecycle commands such as `stop`, `restart`, `status`, or `logs`
- **THEN** the launcher manages only repository-owned processes recorded in its runtime state directory
- **AND** the contributor can inspect process state and logs without manually finding PIDs or reconstructing command lines
