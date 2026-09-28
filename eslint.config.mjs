import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const sourceFiles = [
  "apps/web/src/**/*.{ts,tsx}",
  "packages/*/src/**/*.{ts,tsx}",
];
const testFiles = ["**/*.test.{ts,tsx}", "e2e/**/*.ts"];
const deepWorkspaceImportPattern = {
  group: ["@todo/*/*"],
  message:
    "Import from the workspace package root instead of a private module.",
};

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.gen.ts",
      "playwright-report/**",
      "test-results/**",
      "docs/**/*.html",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: sourceFiles,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      "no-duplicate-imports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "no-restricted-imports": [
        "error",
        { patterns: [deepWorkspaceImportPattern] },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      jsxA11y.flatConfigs.recommended,
    ],
    settings: {
      react: { version: "18.3" },
    },
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    files: sourceFiles,
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["packages/users/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@todo/todos",
              message: "packages/users cannot depend on packages/todos.",
            },
          ],
          patterns: [deepWorkspaceImportPattern],
        },
      ],
    },
  },
  {
    files: ["packages/todos/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@todo/users",
              message: "packages/todos cannot depend on packages/users.",
            },
          ],
          patterns: [deepWorkspaceImportPattern],
        },
      ],
    },
  },
  {
    files: ["packages/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@todo/users",
              message: "packages/shared cannot depend on feature packages.",
            },
            {
              name: "@todo/todos",
              message: "packages/shared cannot depend on feature packages.",
            },
          ],
          patterns: [deepWorkspaceImportPattern],
        },
      ],
    },
  },
  {
    files: testFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "react/display-name": "off",
    },
  },
  {
    files: ["scripts/render-study-guides.mjs"],
    rules: {
      "no-control-regex": "off",
    },
  },
);
