import { ImageResponse } from "@vercel/og";

import geist from "../../../public/portfolio/fonts/Geist-Regular.ttf" with { type: "bytes" };
import japanese from "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-500-normal.woff" with { type: "bytes" };
import avatar from "../../../public/portfolio/approved-avatar.svg" with { type: "text" };
import { fitOgTitle } from "./title";
import { site } from "@/lib/site";

// Satori accepts element objects directly; image generation needs no React runtime.
function element(
  type: string,
  props: Record<string, unknown>,
  ...children: unknown[]
) {
  return { type, key: null, props: { ...props, children } };
}

export function createPortfolioImage({
  title,
  label = "Blog",
}: {
  title: string;
  label?: string;
}) {
  const fitted = fitOgTitle(title);
  return new ImageResponse(
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
          src: `data:image/svg+xml;base64,${Buffer.from(avatar).toString("base64")}`,
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
        {
          name: "Geist",
          data: Buffer.from(geist),
          weight: 400,
          style: "normal",
        },
        {
          name: "Noto Sans JP",
          data: Buffer.from(japanese),
          weight: 400,
          style: "normal",
        },
      ],
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
