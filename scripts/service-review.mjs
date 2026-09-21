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
    await expect(page.locator(".wood-order")).toHaveText([
      "The freshman piece",
      "The sophomore piece",
      "The junior piece",
      "The senior piece",
    ]);
    await expect(page.locator(".primary-nav a")).toHaveText([
      "Work",
      "Craft",
      "Art",
      "Service",
    ]);
    assert.deepEqual(
      await page
        .locator(".primary-nav a")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
      ["#works", "#growth", "#courtyard", "#eagle"],
    );
    await expect(
      page.getByRole("link", { name: "Return to the Nexus" }),
    ).toHaveAttribute("href", "/?v=nexus");
    const widths = [];
    for (const width of [1440, 768, 540, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      for (const [label, id] of [
        ["Work", "works"],
        ["Craft", "growth"],
        ["Art", "courtyard"],
        ["Service", "eagle"],
      ]) {
        await page
          .locator(".primary-nav")
          .getByRole("link", { name: label, exact: true })
          .click();
        assert.equal(new URL(page.url()).hash, `#${id}`);
        assert.ok(
          await page
            .locator(`#${id}`)
            .evaluate(
              (section) =>
                section.getBoundingClientRect().top >= 0 &&
                section.getBoundingClientRect().top < 200,
            ),
        );
      }
      const navFits = await page.locator(".masthead").evaluate((header) => {
        const box = header.getBoundingClientRect();
        const logo = header.querySelector(".wordmark").getBoundingClientRect();
        const links = [...header.querySelectorAll(".primary-nav a")].map(
          (link) => link.getBoundingClientRect(),
        );
        return links.every(
          (link) =>
            link.left >= box.left &&
            link.right <= box.right + 1 &&
            link.top >= box.top &&
            link.bottom <= box.bottom + 1 &&
            (link.left >= logo.right || link.top >= logo.bottom),
        );
      });
      assert.ok(navFits, `Header collision at ${width}px`);
      const nexusFits = await page
        .getByRole("link", { name: "Return to the Nexus" })
        .evaluate((link) => {
          const control = link.getBoundingClientRect();
          const header = link.closest(".masthead").getBoundingClientRect();
          return (
            control.width > 0 &&
            control.height >= 40 &&
            control.left >= header.left &&
            control.right <= header.right + 1 &&
            control.top >= header.top &&
            control.bottom <= header.bottom + 1
          );
        });
      assert.ok(nexusFits, `Nexus return control does not fit at ${width}px`);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page
        .locator(".masthead")
        .screenshot({ path: `artifacts/service-${name}-${width}-nav.png` });
      await page
        .locator("#eagle")
        .screenshot({ path: `artifacts/service-${name}-${width}-eagle.png` });
      widths.push({ width, navFits });
    }
    await expect(page.locator('[data-ramp-part="metal-deck"]')).toHaveCount(1);
    await expect(
      page.locator('[data-ramp-part="square-platform"]'),
    ).toHaveCount(1);
    await expect(page.locator('[data-ramp-part="wheeled-base"]')).toHaveCount(
      1,
    );
    await expect(page.locator("[data-platform-railing]")).toHaveCount(2);
    await expect(page.locator('[data-platform-railing="end"]')).toHaveCount(1);
    await expect(page.locator('[data-platform-railing="right"]')).toHaveCount(1);
    const violations = (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations;
    assert.deepEqual(violations, []);
    assert.deepEqual(errors, []);
    reports.push({ engine: name, errors, violations, widths });
  } finally {
    await browser.close();
  }
}
await writeFile(
  "artifacts/service-verification.json",
  JSON.stringify(reports, null, 2),
);
console.log(JSON.stringify(reports, null, 2));
