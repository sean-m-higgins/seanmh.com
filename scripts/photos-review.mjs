import { chromium, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const reports = [];
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch(
    name === "chromium" ? { channel: "chrome" } : {},
  );
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4329/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("[data-wood-project] h3")).toHaveText([
      "Side table",
      "Shoe rack",
      "Desk",
      "Coffee table",
    ]);
    await expect(page.locator("[data-wood-project] picture")).toHaveCount(4);
    await expect(page.locator(".wood-placeholder")).toHaveCount(0);
    await expect(page.locator(".canvas-frame")).toHaveCount(7);
    await expect(page.locator(".frame-mat,.picture-frame")).toHaveCount(0);
    const layouts = [];
    for (const width of [1440, 768, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const photo of await page.locator(".wood-photo img").all()) {
        await photo.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            photo.evaluate((el) => el.complete && el.naturalWidth > 0),
          )
          .toBe(true);
      }
      const photos = await page
        .locator(".wood-photo img")
        .evaluateAll((images) =>
          images.map((img) => ({
            alt: img.alt,
            source: img.currentSrc,
            loading: img.loading,
            ratioError: Math.abs(
              img.width / img.height - img.naturalWidth / img.naturalHeight,
            ),
          })),
        );
      assert.ok(
        photos.every(
          (img) => img.alt && img.loading === "lazy" && img.ratioError < 0.02,
        ),
      );
      const frames = await page.locator(".canvas-frame").evaluateAll((frames) =>
        frames.map((frame) => {
          const rect = frame.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          };
        }),
      );
      for (const [i, a] of frames.entries())
        for (const b of frames.slice(i + 1)) {
          assert.ok(
            Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 1 ||
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1,
            `Overlapping frames at ${width}px`,
          );
        }
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      for (const room of ["growth", "courtyard"]) {
        await page
          .locator(`#${room}`)
          .screenshot({
            path: `artifacts/photos-${name}-${width}-${room}.png`,
          });
      }
      layouts.push({ width, photos });
    }
    const violations = (
      await new AxeBuilder({ page })
        .include("#growth")
        .include("#courtyard")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations;
    assert.deepEqual(violations, []);
    assert.deepEqual(errors, []);
    reports.push({ engine: name, errors, violations, layouts });
  } finally {
    await browser.close();
  }
}
await writeFile(
  "artifacts/photos-verification.json",
  JSON.stringify(reports, null, 2),
);
console.log(JSON.stringify(reports, null, 2));
