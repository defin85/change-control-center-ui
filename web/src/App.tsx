import {
  OperatorWorkbenchState,
  SimpleReferenceWorkbench,
  useOperatorServerState,
} from "./platform";

import "./styles.css";

function OperatorApp() {
  const operatorServerState = useOperatorServerState();

  if (operatorServerState.state === "error") {
    return <OperatorWorkbenchState tone="error" message={operatorServerState.message} />;
  }

  if (operatorServerState.state === "loading") {
    return <OperatorWorkbenchState tone="loading" message={operatorServerState.message} />;
  }

  return <SimpleReferenceWorkbench {...operatorServerState.workbenchProps} />;
}

export default function App() {
  return <OperatorApp />;
}
