---
name: verify-version
description: Verify a seanmh.com version branch end to end — Node check, astro check, tests, build, preview on the version's port, then look at it in a real browser (screenshots at three widths, console, reduced motion, no-JS). Use before saying any change to a version is done, before committing or pushing a version branch, and whenever asked to run, preview, test, or screenshot a version.
---

# Verify a version

Run from the version's worktree. Stop at the first failure and report it with
the output; do not paper over it.

## 1. Environment

```bash
node -v                 # must be ≥ 22.12 (h-gaudi: 22.23.2)
git branch --show-current
```

If Node is below 22, stop and say so. `~/SoftLot/MyWebsite/.tool-versions`
should pin 22.23.2 through asdf.

## 2. Static checks

```bash
npm run check           # astro check
npm test                # only where package.json has a test script
npm run build
```

Branches with tests: `e-2d-game`, `g-travel`, `h-gaudi`. On `main`, run
`npm test` and `npm run check:shared` instead; there is no Astro site.

## 3. Preview

```bash
npm run preview -- --port <port>
```

| Branch | Port | Path |
|---|---|---|
| a-scroll | 4321 | `/` |
| b-card | 4322 | `/` |
| c-terminal | 4323 | `/` |
| d-3d-game | 4324 | `/` |
| nexus | 4325 | `/` |
| e-2d-game | 4326 | `/` |
| f-blueprint | 4327 | `/systems/` |
| g-travel | 4328 | `/travel/` |
| h-gaudi | 4329 | `/` |

Run the preview in the background and stop it when you are done. To test
version switching or path routing, also start `node scripts/dev-proxy.mjs`
from the main checkout and use `http://localhost:8787`.

## 4. Look at it

Use the Playwright MCP tools (`browser_navigate`, `browser_resize`,
`browser_take_screenshot`, `browser_console_messages`,
`browser_network_requests`). Check:

1. Screenshots at 375×812, 768×1024, and 1440×900. Look at each one; name
   anything broken, clipped, overlapping, or scrolling horizontally.
2. Console: zero errors. Network: no failed requests other than `/api/*`
   endpoints that only exist behind the Worker.
3. Keyboard: Tab through the page; focus is always visible and nothing traps.
4. Reduced motion: emulate `prefers-reduced-motion: reduce` and reload;
   motion stops, content is still all there.
5. The change itself: exercise the exact thing that changed.

h-gaudi also has `@axe-core/playwright` and `lighthouse` installed; use them
there for accessibility and performance numbers.

For a deeper visual critique, hand the running URL to the `design-reviewer`
agent.

## 5. Report

Say what passed, what failed, and what you could not check (for example,
`/api/ask` needs the deployed Worker). Attach or describe the screenshots.
Do not say "done" when a step was skipped.
