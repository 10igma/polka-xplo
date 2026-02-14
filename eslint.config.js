import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  // ── Global ignores ──────────────────────────────────────────────────
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/coverage/**",
      "packages/web/next.config.js",
      "packages/web/postcss.config.cjs",
      "packages/web/tailwind.config.ts",
      "packages/web/next-env.d.ts",
    ],
  },

  // ── Base JS rules ───────────────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript rules (all .ts/.tsx) ─────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Project-wide overrides ──────────────────────────────────────────
  {
    rules: {
      // Allow _ prefixed unused vars (common pattern for intentional ignores)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Warn on explicit `any` — prefer `unknown` with type guards
      "@typescript-eslint/no-explicit-any": "warn",
      // Require `const` for values that are never reassigned
      "prefer-const": "warn",
      // No console.log in library code (warn, not error — consoles are fine in indexer main)
      "no-console": "off",
    },
  },

  // ── React / Next.js ─────────────────────────────────────────────────
  {
    files: ["packages/web/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // ── Test files: relax rules ─────────────────────────────────────────
  {
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // ── Prettier must be last (disables formatting rules) ───────────────
  eslintConfigPrettier,
);
