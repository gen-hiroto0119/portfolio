import { ImageResponse } from "next/og";

import { loadOgFonts } from "@/lib/og/fonts";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = "image/png";

type CreateOgImageOptions = {
  label: string;
  title: string;
};

export async function createOgImage({
  label,
  title,
}: CreateOgImageOptions): Promise<ImageResponse> {
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0A0A0B",
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            color: "#8A8782",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBlock: 40,
          }}
        >
          <div
            style={{
              fontFamily: "Noto Sans JP",
              fontSize: title.length > 30 ? 52 : 64,
              fontWeight: 400,
              color: "#EDEBE8",
              textAlign: "center",
              lineHeight: 1.25,
              maxWidth: "92%",
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: "#FF4D00",
          }}
        />
      </div>
    ),
    {
      ...ogImageSize,
      fonts: [
        {
          name: "JetBrains Mono",
          data: fonts.mono,
          style: "normal",
          weight: 400,
        },
        {
          name: "Noto Sans JP",
          data: fonts.sans,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
