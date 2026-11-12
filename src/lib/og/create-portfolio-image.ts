import { readFile } from "node:fs/promises";
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
  file("public/portfolio/approved-avatar.svg"),
  // A blurred landscape from the Figma "Prefecture blur" set, cropped to 1200×630.
  file("src/assets/og/13-tokyo.jpg"),
]);

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
}: {
  title: string;
  label?: string;
}) {
  const [inter400, inter500, japanese400, japanese500, avatar, background] =
    await assets;
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
          backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.18) 0%, rgba(15, 23, 42, 0.42) 100%), url(data:image/jpeg;base64,${background.toString("base64")})`,
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
            height: 104,
            alignItems: "center",
            justifyContent: "space-between",
          },
        },
        element(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: 8 } },
          element("div", { style: { fontSize: 26 } }, site.name),
          element(
            "div",
            { style: { fontSize: 20, color: "rgba(255, 255, 255, 0.78)" } },
            "Product engineer · Tokyo",
          ),
        ),
        element("img", {
          src: `data:image/svg+xml;base64,${avatar.toString("base64")}`,
          alt: "",
          width: 104,
          height: 104,
        }),
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
      ],
    },
  );
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
