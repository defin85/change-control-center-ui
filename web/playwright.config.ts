import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // The backend-served shell opens a full runtime stack per worker.
  // Two workers keep platform proofs deterministic without load-event timeouts.
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:8000",
    headless: true,
  },
  webServer: {
    command: "bash -lc 'bash ./scripts/ccc build web && bash ./scripts/ccc start e2e --foreground'",
    cwd: "..",
    url: "http://127.0.0.1:8000/healthz/ui-artifact",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
