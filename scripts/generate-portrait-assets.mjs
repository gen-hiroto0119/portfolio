import sharp from "sharp";

const source = "public/portfolio/thinker-ascii.webp";
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const scale = 4;
const width = Math.ceil(info.width / scale);
const height = Math.ceil(info.height / scale);
const coverage = Buffer.alloc(width * height);

// Average blue ink coverage before resizing, so individual ASCII strokes do not alias.
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    let sum = 0;
    let count = 0;
    for (let sy = y * scale; sy < Math.min((y + 1) * scale, info.height); sy++) {
      for (let sx = x * scale; sx < Math.min((x + 1) * scale, info.width); sx++) {
        const i = (sy * info.width + sx) * info.channels;
        sum += Math.max(0, data[i + 2] - (data[i] + data[i + 1]) / 2);
        count++;
      }
    }
    coverage[y * width + x] = Math.round(sum / count);
  }
}

await sharp(coverage, { raw: { width, height, channels: 1 } })
  .webp({ lossless: true })
  .toFile("public/portfolio/thinker-coverage.webp");
await sharp(source)
  .resize({ width: 768 })
  .webp({ quality: 85 })
  .toFile("public/portfolio/thinker-preview.webp");
