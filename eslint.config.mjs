import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "node_modules/**",
    "dist/**",
    ".astro/**",
    ".vercel/**",
    "Blog Content/**",
  ]),
  ...tseslint.configs.recommended,
]);
