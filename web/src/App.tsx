import {
  OperatorStyleSamplePage,
  OperatorWorkbench,
  OperatorWorkbenchState,
  useOperatorServerState,
} from "./platform";

import "./styles.css";

function LiveOperatorApp() {
  const operatorServerState = useOperatorServerState();

  if (operatorServerState.state === "error") {
    return <OperatorWorkbenchState tone="error" message={operatorServerState.message} />;
  }

  if (operatorServerState.state === "loading") {
    return <OperatorWorkbenchState tone="loading" message={operatorServerState.message} />;
  }

  return <OperatorWorkbench {...operatorServerState.workbenchProps} />;
}

function isStyleSampleEnabled(search: string) {
  const params = new URLSearchParams(search);
  return params.get("preview") === "codex-lb";
}

export default function App() {
  if (isStyleSampleEnabled(window.location.search)) {
    return <OperatorStyleSamplePage />;
  }

  return <LiveOperatorApp />;
}
