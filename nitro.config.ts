import { defineConfig } from "nitro";
import { fileURLToPath } from "node:url";

export default defineConfig({
  builder: "rollup",
  alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  modules: ["workflow/nitro"],
  routes: { "/**": "./src/index.ts" },
  publicAssets: [
    {
      dir: "node_modules/@fontsource-variable/jetbrains-mono/files",
      baseURL: "/fonts/jetbrains-mono",
      ignore: ["**/*.woff"],
    },
  ],
});
