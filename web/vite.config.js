import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                // Keep the backend-served shell split into stable domains so the primary
                // entry chunk stays below Vite's warning threshold without changing runtime behavior.
                manualChunks: function (id) {
                    if (id.indexOf("node_modules/react") >= 0 || id.indexOf("node_modules/react-dom") >= 0) {
                        return "react-vendor";
                    }
                    if (id.indexOf("node_modules/@base-ui/react") >= 0) {
                        return "base-ui-vendor";
                    }
                    if (id.indexOf("node_modules/@tanstack/react-table") >= 0) {
                        return "table-vendor";
                    }
                    if (id.indexOf("node_modules/@xstate/") >= 0 || id.indexOf("node_modules/xstate") >= 0) {
                        return "workflow-vendor";
                    }
                    if (id.indexOf("/src/platform/workbench/") >= 0) {
                        return "workbench";
                    }
                    if (id.indexOf("/src/components/") >= 0) {
                        return "operator-components";
                    }
                    return undefined;
                },
            },
        },
    },
    server: {
        port: 4173,
        proxy: {
            "/api": "http://127.0.0.1:8000",
        },
    },
});
