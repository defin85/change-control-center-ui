## 1. Spec
- [x] 1.1 Add a breaking `operator-ui-platform` delta that makes the simple reference the authoritative default desktop queue-workspace layout and explicitly retires the current half-migrated shell structure.

## 2. Implementation
- [x] 2.1 Replace the default desktop queue-workspace composition in `OperatorWorkbench` with the reference-parity section cadence instead of the current layered rail/summary/dashboard structure.
- [x] 2.2 Rebuild masthead, overview metrics, repository section, and the paired queue/detail stage so the shipped shell structurally matches the reference while still rendering backend-owned live data.
- [x] 2.3 Rework `QueuePanel`, `ChangeDetail`, and related supporting shells into the simpler reference hierarchy, keeping required actions, tabs, and run inspection as subordinate workflow affordances rather than equal-weight dashboard blocks.
- [x] 2.4 Align repository catalog and compact-viewport variants with the same simpler system so they do not preserve the old dashboard chrome as a parallel direction.
- [x] 2.5 Rewrite affected Playwright and platform-proof assumptions for the new canonical shell.

## 3. Verification
- [x] 3.1 Run `bash ./scripts/ccc verify ui-smoke`.
- [x] 3.2 Run `bash ./scripts/ccc verify ui-platform`.
- [x] 3.3 Not applicable: verification entrypoints, launcher behavior, and readiness docs did not change.
- [x] 3.4 Run `openspec validate replace-operator-workbench-with-reference-layout --strict --no-interactive`.
