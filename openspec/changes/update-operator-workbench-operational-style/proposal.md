# Change: Update operator workbench operational style

## Why
The default operator shell and the codex-lb-inspired static sample now describe two different UI directions. Keeping the warm editorial shell alive while introducing the operational sample as a side path creates unnecessary drift:
- the backend-served default shell still presents an editorial visual contract that is no longer the intended product direction;
- the codex-lb-inspired sample has already validated the target operational tone, density, and scan-first framing;
- trying to preserve both directions would keep two competing UI contracts in the same product surface.

The visual rewrite also now depends on one backend-owned signal that the current queue summary does not project consistently: the selected orchestrator `owner` contract. If the operational queue is expected to help operators scan ownership alongside state, blocker, and next-step context, the served backend contract must expose that owner meaning canonically as a durable machine identity plus operator-facing label instead of leaving it as sample-only copy or detail-only metadata.

This change intentionally replaces the legacy editorial operator shell with the codex-lb-inspired operational style as the only supported canonical workbench UI. The rollout is allowed to be a breaking UI change, but it must preserve the approved backend-owned workflow model, route-addressable state, fail-closed interactions, and platform-owned composition boundaries.

## What Changes
- Replace the editorial operator-shell visual contract in `operator-ui-platform` with a codex-lb-inspired operational workbench contract.
- Extend the backend-owned change summary and shared web contract so queue-level payloads expose the canonical structured orchestrator `owner` contract with durable `id` and operator-facing `label`.
- Persist a tenant-level backend `defaultOwner` model so new or cold-start changes do not fall back to a generic `chief` identity and legacy owner migration does not depend on queue-time guessing alone.
- Rewrite the default backend-served shell chrome, queue, repository context, selected-change workspace, and run-inspection surfaces into one canonical operational visual system.
- Retire the preview-only shell path and legacy editorial styling once the live workbench becomes the canonical operational shell, while keeping the codex-lb sample only under `legacy/references/` as a non-shipped reference artifact until later removal.
- Rewrite affected browser proofs so they validate the new canonical shell and the structured owner contract rather than preserving legacy presentation affordances.

## Impact
- Affected specs:
  - `application-foundation`
  - `operator-ui-platform`
- Affected code:
  - `backend/app/main.py`
  - `backend/app/domain.py`
  - `backend/app/store.py`
  - `backend/app/seeds.py`
  - `backend/tests/test_web_contract_boundary.py`
  - `web/src/App.tsx`
  - `web/src/styles.css`
  - `web/src/types.ts`
  - `web/src/platform/contracts/schemas.ts`
  - `web/src/platform/workbench/*`
  - `web/src/platform/shells/*`
  - `web/src/components/*`
  - `web/e2e/*`
  - `legacy/references/operator-workbench/*`
- Assumptions:
  - Breaking visual, structural, and selector-level UI changes are allowed for the operator shell in this change.
  - Runtime transport and workflow ownership do not change, but backend and Control API contracts evolve in a bounded way to expose a structured orchestrator owner contract with durable `id` and operator-facing `label` in queue-level payloads.
  - This change does not require a live owner-session registry or subordinate worker-assignment API; runtime session lineage remains separate from the canonical owner contract.
  - The codex-lb sample may remain in the repository as a reference artifact, but it is no longer a shipped or route-addressable part of the served application.
  - The architectural invariants that remain mandatory are backend-owned state, route-addressable operator context, fail-closed command handling, compact-viewport accessibility, and composition through `web/src/platform/*`.
