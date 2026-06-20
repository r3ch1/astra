// Configuração ESLint (flat config) única do monorepo Astra.
//
// Os blocos abaixo aplicam REGRAS DIFERENTES POR ÁREA do projeto, casadas por
// glob de path:
//   • base   — todo .ts/.tsx (proíbe `any`, conforme CLAUDE.md)
//   • Node   — apps/api + packages/* (globals de Node, sem DOM)
//   • React  — apps/web (globals de browser + regras de React/Hooks)
//
// Como é flat config, o ESLint resolve este arquivo a partir do cwd para cima,
// então tanto `pnpm lint` na raiz quanto `eslint --fix` no lint-staged usam
// estas regras.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "packages/calculator/target/**",
      // Nunca lintar artefatos gerados (ver Regras Críticas no CLAUDE.md).
      "packages/calculator/src/generated/**",
    ],
  },

  // ── Base: todo TypeScript ─────────────────────────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // CLAUDE.md: "TypeScript strict — sem `any`".
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // ── Área Node: API + pacotes compartilhados ───────────────────────────
  {
    files: ["apps/api/**/*.ts", "packages/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // ── Área React: web ───────────────────────────────────────────────────
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // React 17+/Next: JSX runtime automático, não precisa importar React.
      "react/react-in-jsx-scope": "off",
    },
  },
);
