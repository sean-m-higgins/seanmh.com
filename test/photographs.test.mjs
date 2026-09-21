import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { stat } from "node:fs/promises";

const assets = new URL("../src/assets/images/woodworking/", import.meta.url);
for (const [file, width, height] of [
  ["01-side-table.webp", 1200, 1600],
  ["02-shoe-rack.webp", 1200, 1600],
  ["03-desk.webp", 1600, 1221],
  ["04-coffee-table.webp", 1600, 1200],
]) {
  test(`${file} is oriented, bounded WebP without private metadata`, async () => {
    const asset = new URL(file, assets);
    const image = await sharp(asset.pathname).metadata();
    assert.equal(image.format, "webp");
    assert.equal(image.width, width);
    assert.equal(image.height, height);
    for (const tag of ["orientation", "exif", "xmp", "iptc"])
      assert.equal(image[tag], undefined);
    assert.ok((await stat(asset)).size < 800_000);
  });
}
