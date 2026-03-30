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
    group: ["**/api", "**/components/*", "**/platform/*", "**/platform/*/*"],
    message: "Route-level composition must go through the `./platform` barrel instead of deep feature or platform imports.",
  },
];

function getJsxAttribute(openingElement, attributeName) {
  return openingElement.attributes.find(
    (attribute) => attribute.type === "JSXAttribute" && attribute.name?.name === attributeName,
  );
}

function isBareReturn(node) {
  if (!node) {
    return false;
  }
  if (node.type === "ReturnStatement") {
    return node.argument == null;
  }
  if (node.type === "BlockStatement" && node.body.length === 1) {
    return isBareReturn(node.body[0]);
  }
  return false;
}

function hasSilentReturnGuard(body) {
  if (!body || body.type !== "BlockStatement") {
    return false;
  }

  return body.body.some((statement) => statement.type === "IfStatement" && !statement.alternate && isBareReturn(statement.consequent));
}

function findEnclosingFunctionBody(node) {
  let current = node.parent;
  while (current) {
    if (
      (current.type === "FunctionDeclaration" ||
        current.type === "FunctionExpression" ||
        current.type === "ArrowFunctionExpression") &&
      current.body?.type === "BlockStatement"
    ) {
      return current.body;
    }
    current = current.parent;
  }
  return null;
}

function resolveHandlerBody(expression, node) {
  if (expression.type === "ArrowFunctionExpression" || expression.type === "FunctionExpression") {
    return expression.body;
  }

  if (expression.type !== "Identifier") {
    return null;
  }

  const enclosingBody = findEnclosingFunctionBody(node);
  if (!enclosingBody) {
    return null;
  }

  for (const statement of enclosingBody.body) {
    if (statement.type === "FunctionDeclaration" && statement.id?.name === expression.name) {
      return statement.body;
    }

    if (statement.type !== "VariableDeclaration") {
      continue;
    }

    for (const declaration of statement.declarations) {
      if (declaration.id.type !== "Identifier" || declaration.id.name !== expression.name) {
        continue;
      }
      if (
        declaration.init?.type === "ArrowFunctionExpression" ||
        declaration.init?.type === "FunctionExpression"
      ) {
        return declaration.init.body;
      }
    }
  }

  return null;
}

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
          JSXText(node) {
            reportIfGovernancePlaceholder(node, node.value);
          },
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
    "no-silent-platform-actions": {
      meta: {
        type: "problem",
        docs: {
          description: "Block platform actions that silently return from click handlers instead of failing closed explicitly.",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            const platformAction = getJsxAttribute(node, "data-platform-action");
            const platformFoundation = getJsxAttribute(node, "data-platform-foundation");
            if (!platformAction && !platformFoundation) {
              return;
            }

            const onClick = getJsxAttribute(node, "onClick");
            if (!onClick?.value || onClick.value.type !== "JSXExpressionContainer") {
              return;
            }

            const handlerBody = resolveHandlerBody(onClick.value.expression, node);
            if (!hasSilentReturnGuard(handlerBody)) {
              return;
            }

            context.report({
              node: onClick,
              message:
                "Silent platform actions are blocked by UI governance. Disable the control explicitly or surface a governance/error state instead of returning early from the click handler.",
            });
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
      "governance/no-silent-platform-actions": "error",
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
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/**/*.{ts,tsx}", "src/platform/**/*.{ts,tsx}"],
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
