import fs from "node:fs/promises";
import path from "node:path";

const FONT_ROOT = path.join(process.cwd(), "node_modules/@fontsource");

export type OgFontData = {
  mono: Buffer;
  sans: Buffer;
};

export async function loadOgFonts(): Promise<OgFontData> {
  const [mono, sans] = await Promise.all([
    fs.readFile(
      path.join(
        FONT_ROOT,
        "jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff",
      ),
    ),
    fs.readFile(
      path.join(
        FONT_ROOT,
        "noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff",
      ),
    ),
  ]);

  return { mono, sans };
}
