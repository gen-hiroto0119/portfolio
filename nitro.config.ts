import { defineConfig } from "nitro";
import { fileURLToPath } from "node:url";

export default defineConfig({
  builder: "rollup",
  alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  modules: ["workflow/nitro"],
  routes: { "/**": "./src/index.ts" },
  publicAssets: [
    ...["inter", "noto-sans-jp", "jetbrains-mono"].map((font) => ({
      dir: `node_modules/@fontsource-variable/${font}/files`,
      baseURL: `/fonts/${font}`,
      ignore: ["**/*.woff"],
    })),
  ],
});
