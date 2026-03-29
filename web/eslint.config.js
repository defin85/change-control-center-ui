import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const governancePlaceholderPatterns = [
  /will be wired/i,
  /later delivery/i,
  /intentionally left/i,
  /shell action in this pass/i,
  /temporary fallback/i,
  /mock surface/i,
  /client-only mock/i,
];

const prohibitedPrimaryUiPatterns = [
  {
    group: [
      "antd",
      "antd/*",
      "@ant-design/*",
      "@mui/*",
      "@chakra-ui/*",
      "@radix-ui/*",
      "@headlessui/react",
      "react-admin",
      "@refinedev/*",
      "@mantine/*",
      "@nextui-org/*",
      "flowbite-react",
      "primereact/*",
      "**/components/ui/*",
    ],
    message:
      "A second primary design system is blocked by governance. Extend the approved platform layer or land an OpenSpec change first.",
  },
];

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

const governancePlugin = {
  rules: {
    "no-placeholder-fallback-copy": {
      meta: {
        type: "problem",
        docs: {
          description: "Block placeholder fallback copy that hides missing product behavior behind soft messaging.",
        },
        schema: [],
      },
      create(context) {
        function reportIfGovernancePlaceholder(node, rawText) {
          const text = typeof rawText === "string" ? rawText : "";
          if (!text) {
            return;
          }

          const matchedPattern = governancePlaceholderPatterns.find((pattern) => pattern.test(text));
          if (!matchedPattern) {
            return;
          }

          context.report({
            node,
            message:
              "Placeholder fallback copy is blocked by UI governance. Disable the path explicitly or land an approved OpenSpec change.",
          });
        }

        return {
          Literal(node) {
            if (typeof node.value === "string") {
              reportIfGovernancePlaceholder(node, node.value);
            }
          },
          TemplateElement(node) {
            reportIfGovernancePlaceholder(node, node.value.raw);
          },
        };
      },
    },
  },
};

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
      governance: governancePlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "governance/no-placeholder-fallback-copy": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/platform/foundation/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: foundationRestrictedPaths,
          patterns: prohibitedPrimaryUiPatterns,
        },
      ],
    },
  },
  {
    files: [
      "src/App.tsx",
      "src/main.tsx",
      "src/**/*Page.{ts,tsx}",
      "src/**/*Route.{ts,tsx}",
      "src/**/*Entrypoint.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: foundationRestrictedPaths,
          patterns: [...appBoundaryPatterns, ...prohibitedPrimaryUiPatterns],
        },
      ],
    },
  },
);
