import { OperatorWorkbench, OperatorWorkbenchState, useOperatorServerState } from "./platform";

import "./styles.css";

export default function App() {
  const operatorServerState = useOperatorServerState();

  if (operatorServerState.state === "error") {
    return <OperatorWorkbenchState tone="error" message={operatorServerState.message} />;
  }

  if (operatorServerState.state === "loading") {
    return <OperatorWorkbenchState tone="loading" message={operatorServerState.message} />;
  }

  return <OperatorWorkbench {...operatorServerState.workbenchProps} />;
}
