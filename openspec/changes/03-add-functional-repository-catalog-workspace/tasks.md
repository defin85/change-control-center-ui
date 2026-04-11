## 1. Workspace Wiring
- [ ] 1.1 Turn `Repositories` into a supported route-addressable workspace in the shared shell controller.
- [ ] 1.2 Render the repository catalog from backend-owned data instead of static sample content.

## 2. Operator Flows
- [ ] 2.1 Wire repository selection, repository-focused detail, and queue handoff through backend-owned tenant state.
- [ ] 2.2 Wire `New repository` and `New change` entrypoints inside the catalog workspace with explicit pending and error handling.

## 3. Proof
- [ ] 3.1 Add browser coverage for catalog hydration, repository selection, compact behavior, and queue handoff.
- [ ] 3.2 Run `openspec validate 03-add-functional-repository-catalog-workspace --strict --no-interactive`.
