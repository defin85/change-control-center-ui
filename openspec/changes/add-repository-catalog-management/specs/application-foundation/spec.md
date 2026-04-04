## ADDED Requirements

### Requirement: Backend-Owned Repository Catalog Summaries
The system SHALL expose backend-owned repository catalog summaries so operators can browse tenant/workspace entries without stitching together cross-tenant state in the browser.

#### Scenario: Operator opens the repository catalog
- **WHEN** the operator requests repository catalog data from the product backend
- **THEN** the backend returns one canonical catalog entry per tenant/workspace
- **AND** each entry includes the tenant id, name, repo path, description, queue or change-load summary, and latest activity metadata derived from backend-owned state
- **AND** the browser does not need to fetch every tenant queue separately just to render a portfolio-level repository list

#### Scenario: Newly created repository appears in the catalog
- **WHEN** the operator creates a new repository workspace through the backend-owned tenant creation flow
- **THEN** the canonical tenant record becomes available through the repository catalog contract immediately
- **AND** the catalog represents the repository's empty-state workload explicitly instead of omitting the new tenant from management surfaces
