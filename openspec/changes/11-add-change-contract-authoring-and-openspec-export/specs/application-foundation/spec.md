## ADDED Requirements
### Requirement: Backend-Owned Change Contract Authoring
The system SHALL let operators author and persist change contract fields for a change through backend-owned mutations while keeping contract data distinct from mutable working memory.

#### Scenario: Operator prepares a draft change for real execution
- **WHEN** the operator edits goal, scope, acceptance criteria, or constraints for a change
- **THEN** the backend persists those contract fields as canonical change state
- **AND** later change-detail reads and run bootstraps return the same contract data
- **AND** mutable summaries, decisions, and clarifications remain separately identifiable as working memory

### Requirement: OpenSpec Artifact Export From Change Threads
The system SHALL export a prepared change into repo-owned OpenSpec artifacts from backend-owned change state.

#### Scenario: Operator exports a prepared change to OpenSpec
- **WHEN** the operator triggers export for a change with valid contract data
- **THEN** the backend creates the corresponding `openspec/changes/<change-id>/proposal.md`, `tasks.md`, and required spec delta scaffolds inside the tenant repository
- **AND** the exported artifact paths and resulting change id are recorded back on the change thread
- **AND** the backend does not require the operator to hand-author those initial OpenSpec files outside the product

#### Scenario: Export target conflicts with existing OpenSpec state
- **WHEN** the requested change id already exists or the required artifact paths cannot be written safely
- **THEN** the export fails explicitly without partial artifact creation
- **AND** the operator can inspect the conflict from backend-owned status rather than inferring it from missing files

