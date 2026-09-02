#!/usr/bin/env node
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const input = path.resolve(process.argv[2] || "incoming/norway-2026");
const output = path.resolve(process.argv[3] || "src/assets/trips/norway-2026");
const root = path.resolve(process.cwd());

if (!output.startsWith(`${root}${path.sep}`) || output === root) {
  throw new Error("Output must be a specific directory inside this worktree.");
}

await mkdir(output, { recursive: true });
const files = (await readdir(input, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(avif|heic|jpeg|jpg|png|tif|tiff|webp)$/i.test(entry.name));

// The edit order lives in a numeric filename prefix, and readdir returns
// neither that order nor any other reliable one — plain sorting would read
// "10IMG" before "1IMG" and shuffle the sequence. Order by that leading number,
// falling back to the name for files that carry none.
const leadingNumber = (name) => {
  const match = /^\d+/.exec(name);
  return match ? Number(match[0]) : Infinity;
};
files.sort((a, b) =>
  leadingNumber(a.name) - leadingNumber(b.name) || a.name.localeCompare(b.name));

if (files.length === 0) throw new Error(`No supported photographs found in ${input}`);

for (const [index, entry] of files.entries()) {
  const slug = entry.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const filename = `${String(index + 1).padStart(2, "0")}-${slug || "frame"}.jpg`;
  // rotate() honors the source orientation, then drops all metadata because
  // withMetadata() is deliberately never called.
  //
  // 2400 is the master size because these files are committed and git keeps
  // every version forever. The gallery's widest derivative is 1800, so this
  // leaves headroom for a larger slot later without carrying twice what any
  // page can serve. The archive of record is the original, not this copy.
  await sharp(path.join(input, entry.name))
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(path.join(output, filename));
  process.stdout.write(`${filename}\n`);
}
