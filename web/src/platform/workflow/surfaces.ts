export type WorkflowSurfaceDescriptor = {
  id: "run-execution" | "approval-resolution" | "clarification-rounds";
  label: string;
  entrypoint: string;
  backendEntities: string[];
  currentEntrypoints: string[];
  reason: string;
  boundaryStatus: "implemented";
  boundaryOwner: string;
};

export const WORKFLOW_SURFACES: WorkflowSurfaceDescriptor[] = [
  {
    id: "run-execution",
    label: "Run execution and selected run context",
    entrypoint: "Change Detail actions -> Run next step / Open run studio",
    backendEntities: ["change", "run", "runtime events", "evidence"],
    currentEntrypoints: [
      "web/src/components/ChangeDetail.tsx",
      "web/src/components/RunStudio.tsx",
      "web/src/platform/server-state/useOperatorServerState.ts",
    ],
    reason:
      "Selected run context mutates across run creation, run selection, runtime-event refresh, and detail reconciliation. This is a multi-step operator flow rather than a presentational toggle.",
    boundaryStatus: "implemented",
    boundaryOwner: "web/src/platform/workflow/useAsyncWorkflowCommandMachine.ts",
  },
  {
    id: "approval-resolution",
    label: "Approval resolution from run inspection",
    entrypoint: "Run Studio approvals list",
    backendEntities: ["approval", "run", "runtime events"],
    currentEntrypoints: [
      "web/src/components/RunStudio.tsx",
      "web/src/platform/server-state/useOperatorServerState.ts",
    ],
    reason:
      "Approval decisions transition through pending, accepted, and declined states while coordinating optimistic UI, backend mutation, and refreshed run detail. The transitions need explicit state ownership.",
    boundaryStatus: "implemented",
    boundaryOwner: "web/src/platform/workflow/useAsyncWorkflowCommandMachine.ts",
  },
  {
    id: "clarification-rounds",
    label: "Clarification round generation and answer submission",
    entrypoint: "Change Detail -> Clarifications",
    backendEntities: ["clarification rounds", "change detail", "tenant memory"],
    currentEntrypoints: [
      "web/src/components/ClarificationPanel.tsx",
      "web/src/components/ChangeDetail.tsx",
      "web/src/platform/server-state/useOperatorServerState.ts",
    ],
    reason:
      "Clarification authoring already spans round creation, option selection, optional freeform notes, answer submission, and persisted reload recovery. That is workflow state, not simple local form state.",
    boundaryStatus: "implemented",
    boundaryOwner: "web/src/platform/workflow/useAsyncWorkflowCommandMachine.ts",
  },
];

export const PRESENTATIONAL_STATE_SURFACES = [
  {
    label: "Queue slice, search text, and selected view/filter",
    currentEntrypoints: [
      "web/src/platform/navigation/operatorRouteState.ts",
      "web/src/platform/server-state/filtering.ts",
    ],
    reason: "These values shape navigation context and filtering, but they do not encode multi-step workflow transitions.",
  },
  {
    label: "Selected change tab and inspector visibility",
    currentEntrypoints: ["web/src/components/ChangeDetail.tsx", "web/src/components/InspectorPanel.tsx"],
    reason: "These are presentational workspace controls and should stay out of the workflow machine layer.",
  },
] as const;
