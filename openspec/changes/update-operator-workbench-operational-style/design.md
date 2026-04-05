## Context
The current default workbench still ships the legacy editorial shell, while the codex-lb-inspired sample demonstrates the new target direction. The product goal is no longer to make those two paths coexist. The goal is to replace the legacy shell completely and make the operational style the single supported canonical operator experience.

This is a breaking UI rewrite. It may replace legacy layout structure, class names, and browser-proof affordances that only exist to preserve the editorial presentation. It does not change runtime transport, route semantics, or workflow ownership, but it now does require a bounded backend contract evolution so the queue can render backend-owned orchestrator ownership through one structured contract instead of relying on detail-only payloads or preview-only copy.

## Goals
- Make the codex-lb-inspired operational style the only canonical backend-served operator shell.
- Remove the preview-only divergence and retire the legacy editorial shell from the default entrypoint.
- Preserve selected-change detail as the dominant action surface inside the new operational system.
- Expose a stable structured orchestrator `owner` contract through canonical queue and detail payloads so ownership can participate in scan-first workbench decisions without overloading one string field.
- Preserve backend-owned workflow semantics, route restoration, fail-closed interactions, and compact-viewport accessibility.

## Non-Goals
- No runtime transport changes or rollout of a live owner-session registry.
- No attempt to use transient Codex session identifiers as queue ownership.
- No attempt to preserve the legacy editorial shell as a supported fallback or parallel product mode.
- No expansion of product scope such as new queue filters, analytics, dashboards, or non-approved workflow capabilities.

## Decisions
- Decision: Replace the editorial shell instead of layering the new style on top of it.
  - The legacy editorial visual contract is retired by this change.
  - The default backend-served workbench becomes the only canonical operational shell.

- Decision: Preserve architecture, not legacy presentation.
  - Backend-owned state, route-addressable context, fail-closed operator actions, and platform-owned composition remain mandatory.
  - Route-level and workspace-level composition continues through the existing `platform/*` shells rather than through a second page framework or a copied static sample tree.

- Decision: Model `owner` as a structured backend-owned orchestrator contract, not as a live session id.
  - `owner.id` is the durable backend-owned logical identity responsible for orchestrating that change within the tenant boundary.
  - `owner.label` is the operator-facing display label for that orchestrator identity.
  - Restarting or rebinding a live Codex app or CLI session does not change `owner.id`, and runtime session lineage remains separate from the owner contract.

- Decision: Scope backend evolution narrowly to canonical owner projection.
  - `bootstrap`, tenant change-list summaries, and change detail must expose the same structured `owner` contract with `id` and `label`.
  - The served UI reads queue ownership from backend contracts rather than from sample data, client inference, or run-session metadata.
  - The backend tenant model persists a tenant-level `defaultOwner` used for new or cold-start changes, while the served tenant contract remains unchanged.

- Decision: Defer live session-binding metadata from this change.
  - `ownerSessionRef`, subordinate worker assignment state, and richer orchestration topology are not required to land the operational-shell rewrite.
  - If those runtime details are exposed later, they remain distinct from the durable `owner.id`.

- Decision: Keep the static sample only as a non-shipped reference artifact.
  - Reuse its visual language, density, and token direction where appropriate.
  - Do not ship the sample page, sample-only data model, or a permanent preview route as part of the canonical served app.
  - The sample may remain in the repository for comparison until a later cleanup, but it must live outside the served application path under `legacy/references/`.

- Decision: Treat queue and repository context as dense operational worklists.
  - The new shell may replace legacy row structure and ancillary summary layouts.
  - The resulting surfaces must still foreground the few signals most useful for scan-first operator decisions.

- Decision: Keep selected-change detail primary and run inspection subordinate.
  - The shell may reorganize supporting chrome aggressively.
  - The selected-change workspace still remains the dominant action surface, and run inspection must not become a competing dashboard.

- Decision: Preserve compact-viewport accessibility while replacing the visual system.
  - Detail-on-compact still behaves as an accessible dialog or drawer interaction.
  - Compact queue and detail tables still expose readable labeled field/value pairs rather than unlabeled vertical stacks.

- Decision: Rewrite browser proofs together with the breaking UI migration.
  - Legacy selectors, class hooks, and text assumptions tied only to the editorial shell are not preserved by default.
  - The new canonical shell must establish a fresh stable proof surface for platform verification.

## Risks / Trade-offs
- A full visual rewrite can accidentally smuggle in a second UI stack by copying the static sample directly.
  - Mitigation: adapt the live workbench through existing platform shells and live backend-owned data instead of shipping the sample tree.

- Expanding backend scope can accidentally turn the change into a session-registry project.
  - Mitigation: keep the contract evolution limited to the canonical owner contract with `id` and `label` in queue and detail payloads.

- Breaking DOM and selector churn can create noisy browser-test failures that hide real regressions.
  - Mitigation: rewrite Playwright proofs in the same change and keep them centered on canonical platform behavior, accessibility, and workflow invariants.

- The operational style can become a generic dashboard if the shell over-weights summary chrome.
  - Mitigation: keep summary surfaces compact and clearly subordinate to selected-change detail.

- Leaving preview-only code or sample-only styling in the served app would recreate long-term drift.
  - Mitigation: remove the preview path from the served app and keep any retained sample only as a non-shipped reference artifact once the live shell matches the canonical operational contract.

## Migration Plan
1. Replace the editorial visual requirement set with an operational canonical-shell contract in `operator-ui-platform`.
2. Extend `application-foundation` and the served web contract so queue and detail payloads share the same structured orchestrator owner contract with durable `id` and operator-facing `label`.
3. Rebuild the live workbench presentation around that contract while preserving architectural invariants.
4. Remove preview-only routing from the served app and keep the codex-lb sample, if retained, only as a non-shipped reference artifact.
5. Rewrite browser proofs for the canonical operational shell and run repo-owned UI verification.
