import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto("http://127.0.0.1:4329/");
  await page.evaluate(() => document.fonts.ready);
  for (const [i, id] of [
    "chain",
    "branch",
    "ruled",
    "light",
    "fragments",
  ].entries()) {
    await page.locator(`[data-study-go="${i}"]`).click();
    await expect(page.locator("#study-count")).toHaveText(`0${i + 1} / 05`);
    const control = page.locator(`[data-study-input="${id}"]`);
    await control.focus();
    const drawing = page.locator(`[data-study-art="${id}"]`);
    const before = await drawing.innerHTML();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => drawing.innerHTML()).not.toBe(before);
    await control.evaluate((el) => el.blur());
    await page
      .locator(`#study-${id}`)
      .screenshot({ path: `artifacts/review-study-${id}.png` });
  }
  await page.locator("#study-track").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#study-count")).toHaveText("01 / 05");
  const pageY = await page.evaluate(() => scrollY);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#study-count")).toHaveText("02 / 05");
  assert.ok(
    Math.abs(pageY - (await page.evaluate(() => scrollY))) < 2,
    "Carousel changed vertical position",
  );
  await page.evaluate(() => document.activeElement?.blur());
  const layouts = [];
  for (const width of [1440, 768, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator("#courtyard").scrollIntoViewIfNeeded();
    const overlaps = await page
      .locator(".canvas-frame")
      .evaluateAll((frames) => {
        const boxes = frames.map((frame) => frame.getBoundingClientRect());
        return boxes.flatMap((a, i) =>
          boxes
            .slice(i + 1)
            .flatMap((b, j) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
                ? [[i + 1, i + j + 2]]
                : [],
            ),
        );
      });
    assert.deepEqual(overlaps, [], `Overlapping art frames at ${width}px`);
    for (const room of ["structure", "growth", "courtyard", "eagle", "light"]) {
      await page
        .locator(`#${room}`)
        .screenshot({ path: `artifacts/review-${width}-${room}.png` });
    }
    layouts.push({ width, frameOverlaps: overlaps.length });
  }
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto("http://127.0.0.1:4329/");
  await noJS.locator("#study-track").evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  await expect
    .poll(() => noJS.locator("#study-track").evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  assert.equal(await noJS.locator(".study-slide").count(), 5);
  console.log(
    JSON.stringify(
      { studiesRespond: true, noJSCarouselScrollable: true, layouts },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
