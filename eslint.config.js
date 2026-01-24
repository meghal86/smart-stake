import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import noCustomCssPatterns from "./eslint-rules/no-custom-css-patterns.js";

export default tseslint.config(
  { 
    ignores: [
      "dist",
      "build",
      ".next",
      "node_modules",
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/*.cy.ts",
      "cypress/**",
      "supabase/functions/**",
      "services/guardian-relayer/**",
      "Cinematic Fintech Interface Design/**"
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "no-custom-css-patterns": {
        rules: {
          "no-custom-css-patterns": noCustomCssPatterns
        }
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "prefer-const": "warn",
      "no-case-declarations": "off",
      "react-hooks/rules-of-hooks": "warn",
      "no-custom-css-patterns/no-custom-css-patterns": ["error", {
        allowedPatterns: [
          // Allow specific design system patterns
          "bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)",
          "text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)",
          // Allow standard spacing scale
          "[pm]-(0|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)",
          // Allow standard width/height scale
          "[wh]-(0|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit)"
        ],
        bannedPatterns: [
          "style={{",
          "bg-\\[#[0-9a-fA-F]{6}\\]",
          "text-\\[#[0-9a-fA-F]{6}\\]",
          "w-\\[[0-9]+px\\]",
          "h-\\[[0-9]+px\\]",
          "p-\\[[0-9]+px\\]",
          "m-\\[[0-9]+px\\]",
          "border-\\[#[0-9a-fA-F]{6}\\]",
          "shadow-\\[[^\\]]+\\]"
        ]
      }],
    },
  }
);
