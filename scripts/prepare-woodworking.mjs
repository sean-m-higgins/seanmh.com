import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";

// Format conversion only: preserve composition/color, orient pixels, strip metadata.
// Originals in incoming/ are never modified. Astro makes responsive AVIF/WebP output.
const root = new URL("../", import.meta.url);
const destination = new URL("src/assets/images/woodworking/", root);
await mkdir(destination, { recursive: true });
const sources = [
  ["1-side-table.JPG", "01-side-table.webp"],
  ["2-shoe-rack.JPG", "02-shoe-rack.webp"],
  ["3-desk.jpeg", "03-desk.webp"],
  ["4-coffee-table.jpeg", "04-coffee-table.webp"],
];
const report = [];
for (const [original, asset] of sources) {
  const source = new URL(`incoming/${original}`, root);
  const output = new URL(asset, destination);
  const info = await sharp(source.pathname)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88, effort: 6 })
    .toFile(output.pathname);
  const metadata = await sharp(output.pathname).metadata();
  if (metadata.exif || metadata.xmp || metadata.iptc || metadata.orientation) {
    throw new Error(`Unexpected metadata in ${asset}`);
  }
  report.push({
    asset,
    originalBytes: (await stat(source)).size,
    bytes: info.size,
    width: info.width,
    height: info.height,
  });
}
console.log(JSON.stringify(report, null, 2));
