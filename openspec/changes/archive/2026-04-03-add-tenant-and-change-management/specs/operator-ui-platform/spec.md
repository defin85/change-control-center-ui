## ADDED Requirements

### Requirement: Governed Project Authoring Entry Point
The system SHALL provide a governed header-level authoring flow for creating a new tenant/project from the operator shell.

#### Scenario: Operator creates a new project from the header
- **WHEN** the operator invokes `New project` from the workbench header
- **THEN** the shell presents an explicit authoring flow with pending and error boundaries
- **AND** a successful submission updates tenant selection through the shared server-state orchestration path
- **AND** the shell does not rely on browser prompt dialogs or client-only mock state

### Requirement: Explicit Confirmed Change Deletion Flow
The system SHALL provide an explicit destructive-action flow for deleting the selected change from the detail workspace.

#### Scenario: Operator deletes the selected change
- **WHEN** the operator invokes `Delete change` from the selected change workspace and confirms the action
- **THEN** the shell routes the deletion through a backend-owned command with explicit pending and error state
- **AND** the queue, selected change context, and selected run context reconcile through the shared orchestration boundary after deletion
- **AND** the shell does not leave route or workspace state pointing at a deleted change
