import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const foundationRestrictedPaths = [
  {
    name: "@base-ui/react",
    message: "Import Base UI through `src/platform/foundation/primitives.ts` instead of using it directly outside the foundation layer.",
  },
  {
    name: "@tanstack/react-table",
    message: "Import table primitives through `src/platform/foundation/table.ts` instead of using TanStack directly outside the foundation layer.",
  },
  {
    name: "xstate",
    message: "Import workflow state helpers through `src/platform/foundation/state.ts` instead of using XState directly outside the foundation layer.",
  },
  {
    name: "@xstate/react",
    message: "Import workflow React helpers through `src/platform/foundation/state.ts` instead of using `@xstate/react` directly outside the foundation layer.",
  },
];

const appBoundaryPatterns = [
  {
    group: ["./api", "./components/*", "./platform/*", "./platform/*/*"],
    message: "Route-level composition must go through the `./platform` barrel instead of deep feature or platform imports.",
  },
];

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "*.d.ts",
      "*.tsbuildinfo",
      "vite.config.d.ts",
      "vite.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/platform/foundation/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: foundationRestrictedPaths }],
    },
  },
  {
    files: ["src/App.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: foundationRestrictedPaths,
          patterns: appBoundaryPatterns,
        },
      ],
    },
  },
);
