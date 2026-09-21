import { chromium, firefox, webkit, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const root = new URL("../artifacts/", import.meta.url);
await mkdir(root, { recursive: true });
const url = process.env.GAUDI_URL || "http://127.0.0.1:4329/";
const chosen = process.argv
  .find((a) => a.startsWith("--engine="))
  ?.split("=")[1];
const engines = chosen
  ? Object.fromEntries(
      Object.entries({ chromium, firefox, webkit }).filter(
        ([key]) => key === chosen,
      ),
    )
  : process.argv.includes("--all")
    ? { chromium, firefox, webkit }
    : { chromium };
const results = [];
for (const [name, engine] of Object.entries(engines)) {
  let browser;
  try {
    browser = await engine.launch(
      name === "chromium"
        ? {
            channel: "chrome",
            args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
          }
        : {},
    );
  } catch (error) {
    const failure = { engine: name, launchError: String(error) };
    results.push(failure);
    await writeFile(
      new URL(`verification-${name}.json`, root),
      JSON.stringify(failure, null, 2),
    );
    continue;
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: new URL(`${name}-desktop.png`, root).pathname,
    fullPage: true,
  });
  await page.screenshot({
    path: new URL(`${name}-threshold.png`, root).pathname,
  });
  for (const room of [
    "structure",
    "works",
    "growth",
    "courtyard",
    "eagle",
    "light",
  ])
    await page
      .locator(`#${room}`)
      .screenshot({ path: new URL(`${name}-${room}.png`, root).pathname });
  const violations = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
  ).violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  }));
  await page.locator("#sag").focus();
  const before = await page.locator("#chain-arch").getAttribute("d");
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => page.locator("#chain-arch").getAttribute("d"))
    .not.toBe(before);
  const changed =
    before !== (await page.locator("#chain-arch").getAttribute("d"));
  const studies = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [i, id] of [
    "chain",
    "branch",
    "ruled",
    "light",
    "fragments",
  ].entries()) {
    await page.locator(`[data-study-go="${i}"]`).click();
    await expect(page.locator(`[data-study-go="${i}"]`)).toHaveAttribute(
      "aria-current",
      "true",
    );
    const control = page.locator(`[data-study-input="${id}"]`);
    await control.focus();
    const before = await page.locator(`[data-study-art="${id}"]`).innerHTML();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => page.locator(`[data-study-art="${id}"]`).innerHTML())
      .not.toBe(before);
    studies.push({
      id,
      changed:
        before !== (await page.locator(`[data-study-art="${id}"]`).innerHTML()),
      active:
        (await page
          .locator(`[data-study-go="${i}"]`)
          .getAttribute("aria-current")) === "true",
    });
    await control.evaluate((el) => el.blur());
    await page
      .locator(`#study-${id}`)
      .screenshot({ path: new URL(`${name}-study-${id}.png`, root).pathname });
  }
  await page.locator("#study-track").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#study-count")).toHaveText("01 / 05");
  const carouselHome =
    (await page.locator("#study-count").textContent()) === "01 / 05";
  const pageY = await page.evaluate(() => scrollY);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#study-count")).toHaveText("02 / 05");
  const carouselKeyboard =
    (await page.locator("#study-count").textContent()) === "02 / 05" &&
    Math.abs(pageY - (await page.evaluate(() => scrollY))) < 2;
  const collections = {
    woodworking: await page.locator("[data-wood-project]").count(),
    art: await page.locator("[data-art-piece]").count(),
    sunny: await page.locator(".sunny-tail").count(),
    eagle: await page.locator("#eagle").count(),
    resume: await page.locator(".career-entry,.portrait-note").count(),
    rooms: await page.locator("[data-room]").count(),
  };
  await page.selectOption("#mosaic-motif", "spiral");
  await page.selectOption("#mosaic-glaze", "rose");
  await page.selectOption("#mosaic-form", "arch");
  const customTiles = await page.locator("#mosaic-tiles").innerHTML();
  const customMask = await page.locator("#tile-clip path").getAttribute("d");
  const customURL = page.url();
  await page.reload();
  await page.waitForTimeout(200);
  const optionsReproducible =
    customTiles === (await page.locator("#mosaic-tiles").innerHTML()) &&
    customMask === (await page.locator("#tile-clip path").getAttribute("d")) &&
    (await page.locator("#mosaic-motif").inputValue()) === "spiral" &&
    (await page.locator("#mosaic-glaze").inputValue()) === "rose" &&
    (await page.locator("#mosaic-form").inputValue()) === "arch";
  const customDownload = page.waitForEvent("download");
  await page.locator("#save-tile").click();
  const customFile = await customDownload;
  await customFile.saveAs(new URL(`${name}-custom-tile.png`, root).pathname);
  const exportNamesChoices = customFile
    .suggestedFilename()
    .includes("spiral-rose-arch");
  if (name === "chromium") {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.locator("#copy-tile").click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    if (copied !== customURL)
      errors.push("Clipboard address does not reproduce selected mosaic");
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator("#reroll").click();
  const generated = await page.locator("#mosaic-tiles").innerHTML();
  const address = page.url();
  await page.reload();
  await page.waitForTimeout(300);
  const reproducible =
    generated === (await page.locator("#mosaic-tiles").innerHTML());
  const download = page.waitForEvent("download");
  await page.locator("#save-tile").click();
  await (await download).saveAs(new URL(`${name}-tile.png`, root).pathname);
  const widths = [];
  for (const width of [360, 720, 768, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.activeElement?.blur());
    await page.screenshot({
      path: new URL(`${name}-${width}.png`, root).pathname,
      fullPage: true,
    });
    if (width === 360) {
      await page.locator("#threshold").screenshot({
        path: new URL(`${name}-mobile-threshold.png`, root).pathname,
      });
      await page.locator("#light").screenshot({
        path: new URL(`${name}-mobile-light.png`, root).pathname,
      });
    }
    widths.push({
      width,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reducedCanvas = await page
    .locator("#lightwell")
    .evaluate((el) => getComputedStyle(el).display);
  const fallback = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 800 },
  });
  await fallback.goto(url);
  const noJS = {
    headings: await fallback.locator("h1,h2").count(),
    links: await fallback.locator("a[href]").count(),
    hiddenControls: await fallback.locator(".enhancement:visible").count(),
  };
  const noGL = await browser.newPage();
  await noGL.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return orig.call(this, type, ...args);
    };
  });
  await noGL.goto(url);
  await noGL.waitForTimeout(600);
  const webglFallback = await noGL.locator(".portal svg").isVisible();
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const touch = await touchContext.newPage();
  await touch.goto(url);
  await touch.waitForTimeout(600);
  const touchLightDeferred = await touch.evaluate(
    () =>
      !performance
        .getEntriesByType("resource")
        .some((r) => r.name.includes("/lightwell.")),
  );
  results.push({
    engine: name,
    errors,
    violations,
    chainChanged: changed,
    seedReproducible: reproducible,
    studies,
    carouselHome,
    carouselKeyboard,
    collections,
    optionsReproducible,
    exportNamesChoices,
    address,
    widths,
    reducedCanvas,
    noJS,
    webglFallback,
    touchLightDeferred,
  });
  await writeFile(
    new URL(`verification-${name}.json`, root),
    JSON.stringify(results.at(-1), null, 2),
  );
  await browser.close();
}
await writeFile(
  new URL("verification.json", root),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
if (
  results.some(
    (r) =>
      r.launchError ||
      r.errors.length ||
      r.violations.length ||
      !r.chainChanged ||
      !r.seedReproducible ||
      !r.optionsReproducible ||
      !r.exportNamesChoices ||
      !r.carouselHome ||
      !r.carouselKeyboard ||
      r.studies.some((s) => !s.changed || !s.active) ||
      r.collections.woodworking !== 4 ||
      r.collections.art !== 7 ||
      r.collections.sunny !== 1 ||
      r.collections.eagle !== 1 ||
      r.collections.resume !== 0 ||
      r.collections.rooms !== 7 ||
      r.widths.some((w) => w.overflow) ||
      !r.webglFallback ||
      !r.touchLightDeferred,
  )
)
  process.exitCode = 1;
