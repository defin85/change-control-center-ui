export const operatorUiFoundationStack = {
  primitives: "@base-ui/react",
  workflowState: "xstate",
  workflowReact: "@xstate/react",
  table: "@tanstack/react-table",
} as const;

export type OperatorUiFoundationStack = typeof operatorUiFoundationStack;
