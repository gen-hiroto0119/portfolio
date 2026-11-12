import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import { fitOgTitle } from "./title";
import { site } from "@/lib/site";

// Images are rendered during the static build, which always runs from the project root.
const file = (...path: string[]) => readFile(join(process.cwd(), ...path));
// Satori reads WOFF but not WOFF2, so the fonts come from the static Fontsource files.
const font = (pkg: string, name: string) =>
  file("node_modules/@fontsource", pkg, "files", name);

const assets = Promise.all([
  font("inter", "inter-latin-400-normal.woff"),
  font("inter", "inter-latin-500-normal.woff"),
  font("noto-sans-jp", "noto-sans-jp-japanese-400-normal.woff"),
  font("noto-sans-jp", "noto-sans-jp-japanese-500-normal.woff"),
  // The hero's Caveat subset (only the glyphs of "Hiroto Furugen"), converted to WOFF.
  // License: public/portfolio/fonts/Caveat-OFL.txt
  file("src/assets/og/Caveat-Bold-Name.woff"),
]);

// Blurred landscapes from the Figma "Prefecture blur" set, cropped to 1200×630.
const backgroundDirectory = "src/assets/og/prefectures";
const backgrounds = readdir(join(process.cwd(), backgroundDirectory)).then(
  (names) => names.filter((name) => name.endsWith(".jpg")).sort(),
);

// Hashes the slug so a post keeps the same prefecture across builds.
async function backgroundFor(slug: string) {
  const names = await backgrounds;
  let hash = 2166136261;
  for (const char of slug) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return names[(hash >>> 0) % names.length];
}

// Satori accepts element objects directly; image generation needs no React runtime.
function element(
  type: string,
  props: Record<string, unknown>,
  ...children: unknown[]
) {
  return { type, key: null, props: { ...props, children } };
}

export async function createPortfolioImage({
  title,
  label = "Blog",
  slug,
}: {
  title: string;
  label?: string;
  // Pages without a slug, such as the top page, use Tokyo.
  slug?: string;
}) {
  const [inter400, inter500, japanese400, japanese500, caveat] = await assets;
  const background = await file(
    backgroundDirectory,
    slug ? await backgroundFor(slug) : "13-tokyo.jpg",
  );
  const fitted = fitOgTitle(title);
  const svg = await satori(
    element(
      "div",
      {
        style: {
          width: 1200,
          height: 630,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 56px",
          color: "#fff",
          fontFamily: "Inter, Noto Sans JP",
          // The gradient darkens the photo enough for white text.
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.42) 100%), url(data:image/jpeg;base64,${background.toString("base64")})`,
          backgroundSize: "1200px 630px, 1200px 630px",
        },
      },
      element(
        "div",
        { style: { fontSize: 22, color: "rgba(255, 255, 255, 0.78)" } },
        label,
      ),
      element(
        "div",
        { style: { display: "flex", height: 240, alignItems: "center" } },
        element(
          "div",
          {
            style: {
              fontSize: fitted.fontSize,
              fontWeight: 500,
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
              maxWidth: 1056,
            },
          },
          fitted.text,
        ),
      ),
      element(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 8,
            height: 104,
          },
        },
        element(
          "div",
          {
            style: {
              fontFamily: "Caveat",
              fontSize: 44,
              fontWeight: 700,
              lineHeight: 1,
            },
          },
          site.name,
        ),
        element(
          "div",
          { style: { fontSize: 20, color: "rgba(255, 255, 255, 0.78)" } },
          "Product engineer · Tokyo",
        ),
      ),
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: inter400, weight: 400, style: "normal" },
        { name: "Inter", data: inter500, weight: 500, style: "normal" },
        { name: "Noto Sans JP", data: japanese400, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: japanese500, weight: 500, style: "normal" },
        { name: "Caveat", data: caveat, weight: 700, style: "normal" },
      ],
    },
  );
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
