import { assign, fromPromise, setup, useMachine } from "../foundation/state";

type WorkflowCommandRequest = {
  label: string;
  execute: () => Promise<void>;
};

type WorkflowCommandContext = {
  activeLabel: string | null;
  error: string | null;
  execute: (() => Promise<void>) | null;
};

const asyncWorkflowCommandMachine = setup({
  types: {
    context: {} as WorkflowCommandContext,
    events: {} as
      | { type: "RUN"; label: string; execute: () => Promise<void> }
      | { type: "RESET" },
  },
  actors: {
    executeCommand: fromPromise(async ({ input }: { input: { execute: () => Promise<void> } }) => {
      await input.execute();
    }),
  },
}).createMachine({
  context: {
    activeLabel: null,
    error: null,
    execute: null,
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        RUN: {
          target: "running",
          actions: assign({
            activeLabel: ({ event }) => event.label,
            error: null,
            execute: ({ event }) => event.execute,
          }),
        },
      },
    },
    running: {
      invoke: {
        src: "executeCommand",
        input: ({ context }) => ({ execute: context.execute ?? (async () => undefined) }),
        onDone: {
          target: "idle",
          actions: assign({
            activeLabel: null,
            error: null,
            execute: null,
          }),
        },
        onError: {
          target: "failed",
          actions: assign({
            activeLabel: null,
            error: ({ event }) => resolveWorkflowError(event.error),
            execute: null,
          }),
        },
      },
    },
    failed: {
      on: {
        RUN: {
          target: "running",
          actions: assign({
            activeLabel: ({ event }) => event.label,
            error: null,
            execute: ({ event }) => event.execute,
          }),
        },
        RESET: {
          target: "idle",
          actions: assign({
            activeLabel: null,
            error: null,
            execute: null,
          }),
        },
      },
    },
  },
});

export function useAsyncWorkflowCommandMachine() {
  const [snapshot, send] = useMachine(asyncWorkflowCommandMachine);

  return {
    activeLabel: snapshot.context.activeLabel,
    error: snapshot.context.error,
    isPending: snapshot.matches("running"),
    runCommand(request: WorkflowCommandRequest) {
      send({ type: "RUN", ...request });
    },
    clearError() {
      send({ type: "RESET" });
    },
  };
}

function resolveWorkflowError(reason: unknown) {
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }

  return "Operator workflow command failed.";
}
