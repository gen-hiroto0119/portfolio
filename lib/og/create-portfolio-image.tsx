/* eslint-disable @next/next/no-img-element */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { ogImageSize } from "@/lib/og/create-og-image";
import { fitOgTitle } from "@/lib/og/title";
import { site } from "@/lib/site";

async function loadAssets() {
  const [geist, japanese, avatar] = await Promise.all([
    readFile(join(process.cwd(), "public/portfolio/fonts/Geist-Regular.ttf")),
    readFile(join(process.cwd(), "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-500-normal.woff")),
    readFile(join(process.cwd(), "public/portfolio/approved-avatar.svg")),
  ]);
  return { geist, japanese, avatar: `data:image/svg+xml;base64,${avatar.toString("base64")}` };
}

export async function createPortfolioImage({ title, label = "Blog", noStore = false }: { title: string; label?: string; noStore?: boolean }) {
  const assets = await loadAssets();
  const fitted = fitOgTitle(title);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px 56px", color: "#171717", fontFamily: "Geist, Noto Sans JP", backgroundImage: "linear-gradient(115deg, #f9fdff 0%, #ebf7ff 38%, #cce7fb 72%, #e2d9f7 100%)" }}>
      <div style={{ fontSize: 22, color: "#7c7c7c" }}>{label}</div>
      <div style={{ display: "flex", height: 240, alignItems: "center" }}>
        <div style={{ fontSize: fitted.fontSize, lineHeight: 1.4, wordBreak: "break-word", maxWidth: 1056 }}>{fitted.text}</div>
      </div>
      <div style={{ display: "flex", height: 104, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 26 }}>{site.name}</div>
          <div style={{ fontSize: 20, color: "#7c7c7c" }}>Product engineer · Tokyo</div>
        </div>
        <img src={assets.avatar} alt="" width={104} height={104} />
      </div>
    </div>,
    {
      ...ogImageSize,
      fonts: [
        { name: "Geist", data: assets.geist, weight: 400, style: "normal" },
        { name: "Noto Sans JP", data: assets.japanese, weight: 400, style: "normal" },
      ],
      ...(noStore ? { headers: { "Cache-Control": "private, no-store, max-age=0" } } : {}),
    },
  );
}
