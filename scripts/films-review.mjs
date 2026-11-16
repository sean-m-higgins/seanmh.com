import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome'});
try {
 const activeContext = await browser.newContext(); const page = await activeContext.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4329/');
 for (const width of [375,768,1440]) {
  await page.setViewportSize({width,height:900});
  for (const slug of ['grain','gesso','ramp']) {
   const video=page.locator(`video[poster*="${slug}"]`);
   await video.scrollIntoViewIfNeeded();
   await expect.poll(()=>video.evaluate(v=>!v.paused && v.currentTime>0)).toBe(true);
   await expect(page.locator(`a[href="https://www.seanmh.com/films/${slug}/"]`)).toBeVisible();
   await video.locator('..').screenshot({path:`artifacts/film-${slug}-${width}.png`});
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 const video=page.locator('video').last();
 await video.evaluate(v=>v.pause());
 await page.waitForTimeout(300);
 assert(await video.evaluate(v=>v.paused));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.reload();
 await video.scrollIntoViewIfNeeded();
 assert(await video.evaluate(v=>v.paused));
 assert.equal((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze()).violations.length,0);
 const context=await browser.newContext({javaScriptEnabled:false});
 const staticPage=await context.newPage(); await staticPage.goto('http://127.0.0.1:4329/');
 assert.equal(await staticPage.locator('video[controls]').count(),3);
 assert.equal(await staticPage.locator('a[href^="https://www.seanmh.com/films/"]').count(),3);
 assert.deepEqual(errors,[]);
 console.log('PASS: three widths, three playing loops, links, pause, reduced motion, no-JS, overflow, axe, page errors');
} finally { await browser.close(); }
