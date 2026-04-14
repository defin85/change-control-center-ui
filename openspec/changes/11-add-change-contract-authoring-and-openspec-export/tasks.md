## 1. Contract Authoring
- [ ] 1.1 Add backend-owned mutations for editing change contract fields while preserving the contract-vs-memory boundary.
- [ ] 1.2 Surface selected-change authoring UI for goal, scope, acceptance criteria, constraints, and export readiness.

## 2. OpenSpec Export
- [ ] 2.1 Add a repo-aware export workflow that creates `proposal.md`, `tasks.md`, and required spec delta scaffolds for the selected change.
- [ ] 2.2 Fail closed on conflicting change ids, invalid export input, or unsafe filesystem conditions instead of partially writing artifacts.

## 3. Proof
- [ ] 3.1 Add backend and browser coverage for contract authoring, export success, and export conflict or failure handling.
- [ ] 3.2 Run `openspec validate 11-add-change-contract-authoring-and-openspec-export --strict --no-interactive`.

