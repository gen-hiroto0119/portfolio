import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...tseslint.configs.recommended,
  globalIgnores(['.next/**', '.astro/**', 'dist/**', '.vercel/**', 'src/pages/.well-known/workflow/**', 'test-output/**', 'Blog Content/**', '**/.obsidian/**']),
]);
