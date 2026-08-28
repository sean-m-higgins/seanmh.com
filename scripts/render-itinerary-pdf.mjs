#!/usr/bin/env node
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const root = process.cwd();
const input = path.join(root, "public", "norway-2026", "downloads", "norway-2026-pretrip.html");
const output = path.join(root, "public", "norway-2026", "downloads", "norway-2026-pretrip.pdf");
const candidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].filter(Boolean);

let browser;
for (const candidate of candidates) {
  try { await access(candidate); browser = candidate; break; } catch { /* try next */ }
}
if (!browser) throw new Error("Set CHROME_BIN to a Chrome/Chromium executable to render the PDF.");

await mkdir(path.dirname(output), { recursive: true });
const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${output}`,
  new URL(`file://${input}`).href,
];

await new Promise((resolve, reject) => {
  const child = spawn(browser, args, { stdio: "inherit" });
  child.once("error", reject);
  child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Chrome exited with ${code}`)));
});
process.stdout.write(`${path.relative(root, output)}\n`);
