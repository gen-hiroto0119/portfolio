import sharp from 'sharp';
import fs from 'node:fs/promises';

// The same ASCII matrix is used by the plain text, SVG and PNG exports.
const rows = 24;
const columns = 43;
const glyphs = '.:+*=#%@HF';
const matrix = Array.from({ length: rows }, (_, y) =>
  Array.from({ length: columns }, (_, x) => {
    const u = x - Math.round(10 * (1 - y / (rows - 1)));
    const leftStem = u >= 0 && u < 6;
    const sharedStem = u >= 14 && u < 20;
    const topArm = y < 4 && u >= 14 && u < 32;
    const middleArm = y >= 10 && y < 14 && u >= 0 && u < 30;
    if (!(leftStem || sharedStem || topArm || middleArm)) return ' ';
    const hash = ((x * 73856093) ^ (y * 19349663)) >>> 0;
    return glyphs[hash % glyphs.length];
  }).join(''),
);

async function main() {
  await fs.writeFile('public/portfolio/hf-ascii.txt', matrix.map(line => line.trimEnd()).join('\n') + '\n');
  for (const [mode, ink, background] of [
    ['light', '#244cff', '#ffffff'],
    ['dark', '#648cff', '#191919'],
  ]) {
    const characters = matrix.flatMap((line, y) => [...line].flatMap((char, x) =>
      char === ' ' ? [] : [`<text x="${92 + x * 20}" y="${236 + y * 24}">${char}</text>`],
    )).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><title>HF ASCII monogram</title><rect width="1024" height="1024" fill="${background}"/><g fill="${ink}" font-family="Menlo,monospace" font-size="24" font-weight="700" text-anchor="middle" dominant-baseline="central">${characters}</g></svg>`;
    await fs.writeFile(`public/portfolio/hf-ascii-${mode}.svg`, svg);
    await sharp(Buffer.from(svg)).png().toFile(`public/portfolio/hf-ascii-${mode}.png`);
  }
  // Raster icons preserve the approved glyph shapes without depending on browser fonts.
  const source = 'public/portfolio/hf-ascii-dark.png';
  await sharp(source).resize(256, 256).png().toFile('app/icon.png');
  const sizes = [16, 32, 48, 64];
  const images = await Promise.all(sizes.map(size =>
    sharp(source).resize(size, size).png().toBuffer(),
  ));
  const directory = Buffer.alloc(6 + sizes.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    directory[entry] = sizes[index];
    directory[entry + 1] = sizes[index];
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(image.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  await fs.writeFile('app/favicon.ico', Buffer.concat([directory, ...images]));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
