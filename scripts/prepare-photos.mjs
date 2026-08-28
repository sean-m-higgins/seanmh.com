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
  await sharp(path.join(input, entry.name))
    .rotate()
    .resize({ width: 3200, height: 3200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(path.join(output, filename));
  process.stdout.write(`${filename}\n`);
}
