import { FlatCompat } from "@eslint/eslintrc";
import ts from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import path from "node:path";


const compat = new FlatCompat();

const config = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "content/**/*.mdx","**/*.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["scripts/**/*.{mjs,cjs,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { process: "readonly", console: "readonly", setTimeout: "readonly", fetch: "readonly" },
    },
    rules: {
      "no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "off", "no-empty": ["error", { allowEmptyCatch: true }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
    {
  files: ["*.{ts,tsx}", "middleware.ts", "next.config.ts", "globals.d.ts", "types/**/*.d.ts"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
    // no parserOptions.project here
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
  }
},
{
  files: ["**/*.d.ts"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
    // no parserOptions.project here
  },
  rules: {
    // lightweight rules only
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
  }
},
  {
   files: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "store/**/*.{ts,tsx}",
    "types/**/*.{ts,tsx}"
  ],
    languageOptions: {
      parser, // @typescript-eslint/parser
    parserOptions: {
      project: path.join(process.cwd(), "tsconfig.eslint.json"),
      tsconfigRootDir: process.cwd()
    }
    },
    plugins: { "@typescript-eslint": ts },
    rules: {
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true, allowBoolean: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

 { files: ["**/*.d.ts"], rules: {"@typescript-eslint/no-unused-vars": "off", "no-unused-vars": "off", "@typescript-eslint/triple-slash-reference": "off" } },
];

export default config;