import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "node_modules/**",
    ".output/**",
    ".vercel/**",
    "Blog Content/**",
  ]),
  ...tseslint.configs.recommended,
]);
