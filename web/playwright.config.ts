import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:8000",
    headless: true,
  },
  webServer: {
    command:
      "bash -lc 'export CCC_DB_PATH=$(mktemp -u /tmp/ccc-e2e-XXXX.db); export CCC_DATA_DIR=/tmp; export CCC_RUNTIME_TRANSPORT=stdio; export CCC_RUNTIME_COMMAND=\".venv/bin/python backend/tests/fake_stdio_app_server.py\"; export CCC_RUNTIME_SIDECAR_URL=http://127.0.0.1:8010; .venv/bin/python -m uvicorn backend.sidecar.main:create_app --factory --host 127.0.0.1 --port 8010 >/tmp/ccc-sidecar.log 2>&1 & sidecar=$!; trap \"kill $sidecar\" EXIT; until curl -fsS http://127.0.0.1:8010/healthz >/dev/null; do sleep 0.2; done; uv run uvicorn backend.app.main:create_app --factory --host 127.0.0.1 --port 8000'",
    cwd: "..",
    url: "http://127.0.0.1:8000/api/bootstrap",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
