## 1. Workspace Wiring
- [x] 1.1 Turn `Repositories` into a supported route-addressable workspace in the shared shell controller.
- [x] 1.2 Render the repository catalog from backend-owned data instead of static sample content.

## 2. Operator Flows
- [x] 2.1 Wire repository selection, repository-focused detail, and queue handoff through backend-owned tenant state.
- [x] 2.2 Wire `New repository` and `New change` entrypoints inside the catalog workspace with explicit pending and error handling.

## 3. Proof
- [x] 3.1 Add browser coverage for catalog hydration, repository selection, compact behavior, and queue handoff.
- [x] 3.2 Run `openspec validate 03-add-functional-repository-catalog-workspace --strict --no-interactive`.
