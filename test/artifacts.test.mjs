import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const htmlPath = new URL("../public/norway-2026/downloads/norway-2026-pretrip.html", import.meta.url);
const pdfPath = new URL("../public/norway-2026/downloads/norway-2026-pretrip.pdf", import.meta.url);

test("sanitized itinerary is self-contained and omits private planning details", async () => {
  const html = await readFile(htmlPath, "utf8");
  assert.match(html, /Sanitized archive/);
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(html, /src=["']images\//i);
  assert.doesNotMatch(html, /Salg@arcticmotor\.no/i);
  assert.doesNotMatch(html, /\$967\s+AA credit/i);
  assert.doesNotMatch(html, /PTO confirmed/i);
  assert.doesNotMatch(html, /ck-credit/i);
  assert.match(html, /data-page="checklist"/);
});

test("the committed itinerary PDF is present and structurally valid", async () => {
  const pdf = await readFile(pdfPath);
  const info = await stat(pdfPath);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(info.size > 100_000);
});
