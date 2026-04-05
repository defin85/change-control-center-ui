import { useEffect } from "react";
import {
  OperatorWorkbench,
  OperatorWorkbenchState,
  useOperatorServerState,
} from "./platform";
import { OperatorStyleSamplePage } from "./reference/OperatorStyleSamplePage";

import "./styles.css";

function LegacyOperatorApp() {
  const operatorServerState = useOperatorServerState();

  if (operatorServerState.state === "error") {
    return <OperatorWorkbenchState tone="error" message={operatorServerState.message} />;
  }

  if (operatorServerState.state === "loading") {
    return <OperatorWorkbenchState tone="loading" message={operatorServerState.message} />;
  }

  return <OperatorWorkbench {...operatorServerState.workbenchProps} />;
}

function DefaultReferenceApp() {
  useEffect(() => {
    const hostWindow = window as typeof window & { __CCC_LIVE_WORKBENCH_URL__?: string };
    hostWindow.__CCC_LIVE_WORKBENCH_URL__ = `${window.location.pathname}?legacyWorkbench=1`;

    return () => {
      delete hostWindow.__CCC_LIVE_WORKBENCH_URL__;
    };
  }, []);

  return <OperatorStyleSamplePage />;
}

export default function App() {
  const routeParams = new URLSearchParams(window.location.search);
  const legacyWorkbenchEnabled = routeParams.get("legacyWorkbench") === "1" || routeParams.get("legacyWorkbench") === "true";

  if (legacyWorkbenchEnabled) {
    return <LegacyOperatorApp />;
  }

  return <DefaultReferenceApp />;
}
