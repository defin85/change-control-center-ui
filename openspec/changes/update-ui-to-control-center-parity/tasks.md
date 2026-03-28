## 1. Parity Baseline
- [ ] 1.1 Inventory the legacy control center surfaces, actions, and detail tabs that are not yet present in the React shell.
- [ ] 1.2 Map each missing surface to either an existing backend payload, a required backend summary extension, or a frontend-only rendering gap.

## 2. Top-Level Operator Shell
- [ ] 2.1 Restore topbar parity with search, global actions, and desktop operator hierarchy.
- [ ] 2.2 Restore the hero ribbon and left-side view/filter rail from the legacy control center.
- [ ] 2.3 Restore queue header actions and align queue presentation with the legacy control-center grid and status density.

## 3. Inspector and Detail Workspace
- [ ] 3.1 Add the inspector panel with selected-change metrics, next action, blocker context, and chief policy summary.
- [ ] 3.2 Restore detail actions for `Run next step`, `Open run studio`, `Escalate`, and `Mark blocked by spec`.
- [ ] 3.3 Restore the missing detail tabs and content surfaces for `Traceability`, `Gaps`, and `Git`.
- [ ] 3.4 Preserve and reintegrate current foundation-only surfaces such as clarification flow and run lineage without degrading parity.

## 4. Backend Support
- [ ] 4.1 Extend backend query contracts only where parity surfaces need additional summary or projection data not currently exposed.
- [ ] 4.2 Keep all restored UI surfaces backed by normalized backend state and command endpoints.

## 5. Visual Parity
- [ ] 5.1 Bring the React shell to desktop visual parity with the legacy control center in panel structure, hierarchy, spacing, and information density.
- [ ] 5.2 Ensure the restored layout remains usable on narrower widths without abandoning the desktop-first operator-console model.

## 6. Verification
- [ ] 6.1 Add or update backend tests for any new summary/query contracts introduced for parity.
- [ ] 6.2 Add or update browser e2e coverage for restored queue, inspector, detail tabs, run-studio entry, and operator actions.
- [ ] 6.3 Perform parity verification against the legacy template for both functional surfaces and visual layout before closing the change.
