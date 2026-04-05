import { fileURLToPath } from "node:url";

import react from "/home/egor/code/change-control-center-ui/web/node_modules/@vitejs/plugin-react/dist/index.js";

const referenceRoot = fileURLToPath(new URL(".", import.meta.url));

export default {
  root: referenceRoot,
  plugins: [react()],
  resolve: {
    alias: {
      react: "/home/egor/code/change-control-center-ui/web/node_modules/react",
      "react-dom": "/home/egor/code/change-control-center-ui/web/node_modules/react-dom",
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4174,
  },
};
