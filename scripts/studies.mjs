import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const root = new URL("../artifacts/studies/", import.meta.url);
await mkdir(root, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const studies = {
  daylight: "",
  axial:
    ".threshold{display:flex;flex-direction:column;text-align:center}.hero-copy{padding:15px 0 0}.hero-copy h1{font-size:90px}.hero-copy h1 br{display:none}.hero-note{margin:15px 0 0}.hero-architecture{width:540px;margin:-20px auto 0}.portal svg{max-height:530px}.threshold-foot{width:100%}.exhibit-grid{column-gap:35px}.exhibit:nth-child(even){margin-top:0}.courtyard-heading{max-width:none;justify-content:center;gap:100px}.courtyard-layout{grid-template-columns:1fr;max-width:800px;margin:auto}.courtyard-copy{max-width:500px;margin:40px auto}",
  nocturne:
    ".threshold,.courtyard{background:#153c3f;color:#eee1bb}.threshold em,.courtyard em{color:#b0bea0}.hero-note,.courtyard-copy>p:not(.lead){color:#c9cfb6}.threshold .text-link,.courtyard .text-link{border-color:#ccc5a5}.hero-architecture{filter:saturate(1.35)}.exhibit-art{border-radius:50% 50% 0 0}.exhibit-consent .exhibit-art{background:#bd7f50}",
};
for (const [name, css] of Object.entries(studies)) {
  await page.goto("http://127.0.0.1:4329/");
  await page.evaluate(() => document.fonts.ready);
  if (css) await page.addStyleTag({ content: css });
  for (const id of ["threshold", "works", "courtyard"])
    await page
      .locator(`#${id}`)
      .screenshot({ path: new URL(`${name}-${id}.png`, root).pathname });
}
await browser.close();
