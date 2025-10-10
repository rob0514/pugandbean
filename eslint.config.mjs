import { FlatCompat } from "@eslint/eslintrc";
import ts from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

const compat = new FlatCompat();

const config = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "content/**/*.mdx"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    plugins: { "@typescript-eslint": ts },
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
      "no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["scripts/**/*.{mjs,cjs,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { process: "readonly", console: "readonly", setTimeout: "readonly", fetch: "readonly" },
    },
    rules: { "no-undef": "off", "no-empty": ["error", { allowEmptyCatch: true }] },
  },
  { files: ["**/*.d.ts"], rules: { "@typescript-eslint/no-unused-vars": "off", "no-unused-vars": "off", "@typescript-eslint/triple-slash-reference": "off" } },
];

export default config;