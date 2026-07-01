import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Console: usar logger en vez de console.{error|warn|log}
      "no-console": "warn",

      // Any: desalentar pero no bloquear
      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],

      // Require: permitir en archivos de configuración y assets estáticos
      "@typescript-eslint/no-require-imports": ["error", { allow: ["^.*\\.(png|jpg|jpeg|gif|svg|webp)$"] }],

      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // No-unused-vars
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      // Prefer const
      "prefer-const": "warn",
    },
  },
  {
    files: ["src/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".expo/",
      "android/",
      "ios/",
      "*.config.*",
      "jest.setup.ts",
    ],
  },
];
