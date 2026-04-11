## 1. Runs Workspace
- [ ] 1.1 Add a supported `workspace=runs` functional workspace wired through the shared shell controller.
- [ ] 1.2 Render the tenant run list from backend-owned data with supported run slices and scan-first row cadence.

## 2. Run Detail
- [ ] 2.1 Render backend-owned run detail, approvals, and event context in a dedicated stage.
- [ ] 2.2 Add explicit handoff back to the owning change without redirecting into removed legacy run UI.

## 3. Proof
- [ ] 3.1 Add browser coverage for runs workspace hydration, run selection, compact behavior, and change handoff.
- [ ] 3.2 Run `openspec validate 06-add-runs-workspace-and-run-detail-handoff --strict --no-interactive`.
