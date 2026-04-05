import { useEffect } from "react";
import {
  OperatorWorkbench,
  OperatorWorkbenchState,
  readOperatorRouteState,
  useOperatorServerState,
} from "./platform";
import { OperatorStyleSamplePage } from "./reference/OperatorStyleSamplePage";
import { ReferenceRepositoryCatalogPage } from "./reference/ReferenceRepositoryCatalogPage";

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

function RepositoryCatalogApp() {
  const operatorServerState = useOperatorServerState();

  if (operatorServerState.state === "error") {
    return <OperatorWorkbenchState tone="error" message={operatorServerState.message} />;
  }

  if (operatorServerState.state === "loading") {
    return <OperatorWorkbenchState tone="loading" message={operatorServerState.message} />;
  }

  return <ReferenceRepositoryCatalogPage {...operatorServerState.workbenchProps} />;
}

export default function App() {
  const routeState = readOperatorRouteState(window.location.search);

  if (routeState.legacyWorkbench) {
    return <LegacyOperatorApp />;
  }

  if (routeState.workspaceMode === "catalog") {
    return <RepositoryCatalogApp />;
  }

  return <DefaultReferenceApp />;
}
