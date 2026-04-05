import {
  OperatorWorkbench,
  OperatorWorkbenchState,
  SimpleReferenceWorkbench,
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

  return operatorServerState.workbenchProps.legacyWorkbenchEnabled
    ? <OperatorWorkbench {...operatorServerState.workbenchProps} />
    : <SimpleReferenceWorkbench {...operatorServerState.workbenchProps} />;
}

export default function App() {
  return <LiveOperatorApp />;
}
