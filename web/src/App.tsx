import { useEffect } from "react";

import { OperatorStyleSamplePage } from "./reference/OperatorStyleSamplePage";

import "./styles.css";

function StaticShellApp() {
  useEffect(() => {
    if (!window.location.search) {
      return;
    }

    const normalizedUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", normalizedUrl);
  }, []);

  return <OperatorStyleSamplePage />;
}

export default function App() {
  return <StaticShellApp />;
}
