import { OperatorWorkbench, OperatorWorkbenchState, useOperatorServerState } from "./platform";

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

export default function App() {
  return <LiveOperatorApp />;
}
