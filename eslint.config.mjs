import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  globalIgnores([
    ".next/**",
    ".output/**",
    ".nitro/**",
    "dist/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/.obsidian/**",
    "postcss.config.js",
  ]),
]);
