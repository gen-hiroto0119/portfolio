import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { workflow } from "workflow/vite";

import { generateScopedName } from "./css-modules.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
    nitro(),
    workflow({ dirs: ["lib/publishing"] }),
  ],
  nitro: {
    routes: {
      "/**": "./src/index.ts",
    },
    rollupConfig: {
      external: ["@resvg/resvg-js", /\.node$/],
    },
    publicAssets: [
      { dir: "dist/client", maxAge: 60 * 60 * 24 * 365, baseURL: "/" },
    ],
  },
  resolve: {
    alias: { "@": root },
  },
  ssr: {
    external: ["@resvg/resvg-js"],
  },
  css: {
    modules: {
      generateScopedName,
    },
  },
});
