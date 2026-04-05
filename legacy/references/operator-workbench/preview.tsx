import React from "react";
import ReactDOM from "react-dom/client";

import { OperatorStyleSamplePage } from "./OperatorStyleSamplePage";

declare global {
  interface Window {
    __CCC_LIVE_WORKBENCH_URL__?: string;
  }
}

window.__CCC_LIVE_WORKBENCH_URL__ = "http://127.0.0.1:8000/";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OperatorStyleSamplePage />
  </React.StrictMode>,
);
