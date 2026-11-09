import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import { fitOgTitle } from "./title";
import { site } from "@/lib/site";

// Images are rendered during the static build, which always runs from the project root.
const assets = Promise.all([
  readFile(join(process.cwd(), "public/portfolio/fonts/Geist-Regular.ttf")),
  readFile(
    join(
      process.cwd(),
      "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-500-normal.woff",
    ),
  ),
  readFile(join(process.cwd(), "public/portfolio/approved-avatar.svg")),
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
  const [geist, japanese, avatar] = await assets;
  const fitted = fitOgTitle(title);
  const svg = await satori(
    element(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 56px",
          color: "#171717",
          fontFamily: "Geist, Noto Sans JP",
          backgroundImage:
            "linear-gradient(115deg, #f9fdff 0%, #ebf7ff 38%, #cce7fb 72%, #e2d9f7 100%)",
        },
      },
      element("div", { style: { fontSize: 22, color: "#7c7c7c" } }, label),
      element(
        "div",
        { style: { display: "flex", height: 240, alignItems: "center" } },
        element(
          "div",
          {
            style: {
              fontSize: fitted.fontSize,
              lineHeight: 1.4,
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
            { style: { fontSize: 20, color: "#7c7c7c" } },
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
        { name: "Geist", data: geist, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: japanese, weight: 400, style: "normal" },
      ],
    },
  );
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
