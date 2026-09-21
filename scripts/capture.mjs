import { chromium } from "@playwright/test";
import { mkdir, rename } from "node:fs/promises";
const root = new URL("../artifacts/", import.meta.url);
await mkdir(root, { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
const social = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  reducedMotion: "reduce",
});
await social.goto("http://127.0.0.1:4329/");
await social.evaluate(() => document.fonts.ready);
await social.addStyleTag({
  content:
    ".masthead,.chapter-rail,.inlay,.threshold-foot,.hero-note,.hero-copy .text-link,.hero-architecture figcaption{display:none}.threshold{height:630px;min-height:630px;padding:30px 50px;grid-template-columns:46% 54%;overflow:hidden}.hero-copy{padding:0}.hero-copy h1{font-size:108px}.hero-copy .eyebrow{margin-bottom:25px}.hero-architecture{margin:0 -10px 0 0}.portal svg{height:580px}",
});
await social.screenshot({
  path: new URL("../public/gaudi-social.png", import.meta.url).pathname,
});
await social.close();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: root.pathname, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:4329/");
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2200);
for (const id of [
  "structure",
  "works",
  "growth",
  "courtyard",
  "eagle",
  "light",
]) {
  await page
    .locator(`#${id}`)
    .evaluate((el) => el.scrollIntoView({ behavior: "smooth" }));
  await page.waitForTimeout(2000);
  if (id === "structure") {
    await page.locator("#sag").focus();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(60);
    }
    for (const i of [1, 2, 3, 4]) {
      await page.locator(`[data-study-go="${i}"]`).click();
      await page.waitForTimeout(1200);
    }
  }
  if (id === "works") {
    await page.locator(".exhibit summary").first().click();
    await page.waitForTimeout(1000);
  }
  if (id === "light") {
    await page.locator("#reroll").click();
    await page.waitForTimeout(1000);
  }
}
await page.waitForTimeout(1200);
const video = page.video();
await context.close();
await rename(await video.path(), new URL("walkthrough.webm", root));
await browser.close();
