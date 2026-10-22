// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { workflow } from 'workflow/astro';

// https://astro.build/config
const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  output: 'server',
  publicDir: './public',
  adapter: process.env.ASTRO_ADAPTER === 'node' ? node({ mode: 'standalone' }) : vercel({ includeFiles: [
    'public/portfolio/fonts/Geist-Regular.ttf', 'public/portfolio/approved-avatar.svg',
    'node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-500-normal.woff',
    'public/favicon.ico', 'public/icon.png',
  ] }),
  integrations: [react(), workflow()],
  vite: {
    resolve: { alias: { '@': repositoryRoot } },
    plugins: [tailwindcss(), {
      name: 'server-only-boundary', enforce: 'pre',
      resolveId(id, _importer, options) {
        if (id !== 'server-only') return;
        if (!options?.ssr) throw new Error('Server-only code cannot enter the browser bundle.');
        return '\0server-only';
      },
      load(id) { if (id === '\0server-only') return ''; },
    }],
  },
});
