# Version D — Game

**Status:** Plan only. Nothing implemented. This is a scoped build spec for one new version branch; `plans/plan.html` remains the canonical project roadmap. When this is greenlit, link it from there.

---

## 1. Where this fits

The site is already a branch-per-version portfolio: each version is a standalone Astro app on its own branch, deployed to its own Cloudflare Pages project, fronted by the router Worker on `main` (`worker.js`) which assigns visitors a version via the `pv` cookie and whole-path-proxies to the chosen origin.

A game version slots into that architecture unchanged. It is not a rewrite and it does not touch the existing versions.

| | |
|---|---|
| Branch | `version/d-game` (branched from `content`, not `main`) |
| Pages project | `seanmh-game` → `seanmh-game.pages.dev` |
| Reachable at | `seanmh.com/?v=d-game` |
| In random rotation | **No**, initially — same posture as `nexus` |

Branching from `content` rather than `main` matters: `content` is the canonical source for the five files under the shared-content contract, and starting there means they are byte-identical for free.

---

## 2. Concept options

Three candidates, judged on: fun within ten seconds, whether portfolio content lives *in* the mechanic rather than bolted beside it, whether it justifies Three.js, and how much surface area it adds.

### D1 — Powder Run *(recommended)*

A snowboard descent. You start at the summit in 2016 and ride down to the present. The run **is** the career timeline: six banner gates along the mountain are the six entries in `experience.ts`, in chronological order, and the altimeter in the HUD reads out as a year rather than a number. Passing a gate slides in a card with the role, dates, and one line of detail. The run ends at a base lodge where the contact links live.

Scattered off-trail are the personality objects — a heavy bag hanging in a stand of pines, a stage rig with concert lighting, a hand-built wooden bench, a campfire, and Sunny the cat on a rock. Clip one and it pops a one-line card. They are optional and off the racing line, so they reward curiosity without taxing anyone in a hurry.

Why this one: the descent metaphor does the narrative work with no explanation, the controls are two keys, procedural low-poly terrain is exactly what Three.js is good at, and one HUD element (the altimeter-as-year) carries the entire timeline concept.

### D2 — Handshake

You are an HTTP request travelling a gateway. Each leg is an auth step — token exchange, consent, step-up — and clearing it unlocks a piece of the résumé. Thematically the sharpest fit, since OAuth and API gateway work is the actual day job. The problem is that "clear the auth checkpoint" has no obvious verb behind it; it risks being a slideshow with a progress bar. Worth keeping as a reskin of D1's engine if the run works and there is appetite for a second course.

### D3 — The Workshop

A low-poly room you orbit and click: desk, snowboard against the wall, boxing gloves, a half-finished chair, a concert poster, the cat. Each object opens a panel. Lowest risk and genuinely charming, but it is a scene, not a game — no loop, no reason to return. Good fallback if D1 fails its playability gate in Phase 1.

**Recommendation: D1.** It is the only one of the three that is fun before you know whose site it is.

---

## 3. Powder Run in detail

**Loop.** Press start → ride → six gates over roughly 60–90 seconds → base lodge → "ride again" or "read the résumé". No score, no lives, no timer.

**No fail state, deliberately.** Hitting a tree throws a spray of powder and costs speed. Nothing ends the run. This is a portfolio first: a recruiter must never be blocked from the content by a mechanic they did not ask for.

**Controls.** `A`/`D` or `←`/`→` to carve, `Space` to jump. On touch: drag anywhere horizontally, tap to jump. That is the whole input surface.

**Content mapping.** Gates are generated from `src/content/experience.ts` in chronological order, never hardcoded — when the résumé changes, the course changes:

| Altitude | Gate |
|---|---|
| Summit · 2016 | B.S. Computer Science, Loyola |
| | M.S. Software Engineering, Loyola |
| | Data Engineer, Kemper |
| | Data Scientist, R1 RCM |
| | Data Engineer, Capital One |
| Base · present | Senior Software Engineer, Capital One |

**Ending.** The lodge is a small static scene holding the headshot, email, GitHub, and LinkedIn from `site.ts`, plus links across to the other versions — which is also the honest way to hand a hurried visitor the terminal or the scroll version.

---

## 4. Tech stack

Lean, and matched to what the repo already runs.

- **Astro 7** + **Tailwind CSS 4** (CSS-first config, no `tailwind.config.js`) — identical to every other version branch.
- **three** `^0.185.1` — the same version `version/b-card` and `version/nexus` already pin.
- **TypeScript** strict, via `astro/tsconfigs/strict`. Gate is `astro check`.
- **Vite** comes with Astro. No second bundler.
- Node 22.12 (`.nvmrc`), unchanged.

Explicitly **not** using:

- **react-three-fiber** — it would drag React into an Astro site that has none, for a single canvas.
- **A physics engine** (Rapier, cannon-es) — roughly a megabyte of WASM to do what kinematic movement plus AABB checks against a flat array of obstacle positions does in a few dozen lines.
- **glTF models or textures** — all geometry is generated in code. Low-poly, flat-shaded, vertex-coloured. This is the main lever that keeps the bundle small and the load instant.
- **A backend** — no scores, no leaderboard, no persistence. Nothing to run, nothing to secure.

---

## 5. Project structure

```
src/
  components/
    GameCanvas.astro       canvas element + island bootstrap
    StartScreen.astro      title, one-line how-to-play, start button
    Hud.astro              altimeter/year, gate cards, skip link
    Lodge.astro            end-of-run contact panel
  content/
    game.ts                gate copy derived from experience.ts, easter-egg copy
  scripts/game/
    main.ts                bootstrap, RAF loop, resize, pause on hidden
    scene.ts               renderer, camera, lights, fog
    terrain.ts             procedural heightfield + mesh
    rider.ts               player state, carve, jump, collision response
    course.ts              gate placement from content, decoration between gates
    props.ts               InstancedMesh trees/rocks, easter-egg objects
    input.ts               keyboard, pointer, touch
    hud.ts                 DOM binding for the HUD
  pages/
    index.astro            SSG portfolio content + canvas overlay
```

Everything else — `BaseLayout.astro`, `VersionSwitcher.astro`, `src/styles/`, `src/content/site.ts`, `experience.ts` — comes across from `content` unchanged.

---

## 6. UI approach

**The HUD is DOM, not WebGL.** Text rendered in the canvas is blurry, expensive, and invisible to screen readers. Tailwind-styled elements layered over the canvas are sharp at any DPR, free to animate, and accessible by default. The canvas draws the world; HTML draws everything you read.

Visual direction stays inside the existing design system: `--color-accent` `#6366f1` on a dark `#0a0a0a` base, Inter for UI, JetBrains Mono for the altimeter readout. The mountain itself is a cool desaturated palette so the indigo accent stays the only saturated colour on screen — gates, the active card, and the cursor all read as one family.

The start screen is one line of instruction and one button. No settings menu, no tutorial.

---

## 7. Routing and hosting

**Cloudflare Pages project.** New git-connected project `seanmh-game` on branch `version/d-game`, build command `npm run build`, output directory `dist/`. Same shape as every other version. No Wrangler deploys — Pages owns it.

**Router Worker (`worker.js` on `main`).** Add the origin to `ROUTABLE` but *not* to `VERSIONS`, mirroring exactly how `NEXUS` is handled today:

```js
const GAME = { name: 'd-game', origin: 'https://seanmh-game.pages.dev' };
const ROUTABLE = [...VERSIONS, NEXUS, GAME];
```

That makes it reachable via `?v=d-game` and sticky through the `pv` cookie, while `pickVersion()` never assigns it at random. Deployed with `npx wrangler deploy` from `main`.

**Local dev.** `scripts/dev-proxy.mjs` mirrors the Worker on port 8787 and must get a matching entry (port 4324). `plans/plan.html` already flags this file drifting from `worker.js` as a P0 — do not add to the drift.

**Tests.** `test/worker.test.js` gets two cases alongside the existing ten: `?v=d-game` proxies to the game origin, and d-game never appears across a large number of `pickVersion()` draws.

**Rotation, later.** If it holds up, move it from `ROUTABLE`-only into `VERSIONS` at a low weight and rebalance the others to 100. That is a one-line change and a deliberate second decision, not part of this build.

---

## 8. Shared-content contract

`scripts/check-shared.mjs` enforces that `src/content/site.ts`, `src/content/experience.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, and `src/styles/transitions.css` are byte-identical across the version branches. Two consequences:

1. **The game reads content, it does not restate it.** Course gates derive from `experience.ts` at build time. No copy of the résumé lives in game code.
2. **Adding a switcher entry is a five-branch operation.** The glyph for the game version (suggest `△`, alongside `∿` scroll, `▣` card, `❯` terminal) goes into `VersionSwitcher.astro` on `content` first, then cherry-picks into `a-scroll`, `b-card`, `c-terminal`, `nexus`, and `d-game`. `check-shared.mjs` also needs `version/d-game` added to its branch list, and it requires a git worktree per branch to run.

`transitions.css` should gain a `vt-game-in` flavour keyframe so arriving at the game gets its own cross-document transition, the way the terminal has its CRT power-on — same cherry-pick path.

---

## 9. Performance budget

Numbers to build against, not to discover afterwards.

- **Under 250 KB gzipped** for the game chunk. Tree-shaken three core is around 150 KB; the rest is the game.
- **Under 30 KB** for the initial shell. The game bundle is dynamically imported behind the start button, so the landing page paints instantly and a visitor who never presses start never downloads it.
- **60 fps on a mid-range 2021 phone.** Under 80 draw calls and under 150k triangles — achievable because trees and rocks are `InstancedMesh` and the terrain is one geometry.
- **No shadow maps.** A hemisphere plus directional light with fake contact-shadow decals looks right on flat-shaded low-poly and costs nothing.
- `antialias: false`, device pixel ratio capped at 2 (1.5 on mobile), `powerPreference: 'high-performance'`.
- RAF paused on `document.hidden`.

The course is finite — summit to base — so there is no chunk-streaming or object-pooling machinery to build. The whole world is authored once at start.

---

## 10. Accessibility, SEO, and fallbacks

This is a job-seeking portfolio, so an empty `<canvas>` in the DOM is not acceptable.

- **The page is a real portfolio page.** `index.astro` statically renders the full bio, experience, and contact content into `<main>`. The canvas sits over it as an `aria-hidden` overlay. Crawlers and screen readers get the résumé; everyone else gets the mountain.
- **A persistent "Skip →" link**, always visible, top right, dropping straight to the text content. One click, from anywhere in the run.
- **`prefers-reduced-motion`** opens the static portfolio by default and offers the game as an explicit opt-in — consistent with the existing kill switch in `transitions.css`.
- **No WebGL, or context lost** → the static portfolio, silently.
- **Keyboard-complete.** The full run is playable on the keyboard, and the gate content is reachable by Tab in the DOM regardless.

---

## 11. Phases

**P0 · Route before gameplay.** Branch `version/d-game` from `content`, add three, ship a blank resizing canvas, create the Pages project, add the Worker and dev-proxy entries, confirm `seanmh.com/?v=d-game` reaches it end to end. Prove the plumbing while there is nothing to debug.

**P1 · A slope worth riding.** Terrain, follow camera, carve, jump, collision feel. No content, no HUD, no art. **This is the kill gate**: if it is not fun with grey boxes on a grey hill, fall back to D3 rather than decorating a mechanic that does not work.

**P2 · The course.** Gates generated from `experience.ts`, altimeter reading as a year, gate cards sliding in on pass.

**P3 · The mountain.** Instanced trees and rocks, the personality objects, snow, fog, the palette.

**P4 · The lodge.** End-of-run panel, contact links, cross-links to the other versions, ride-again.

**P5 · Polish.** Start screen, HUD typography, motion tuning, the `VersionSwitcher` entry and `vt-game-in` transition — both via the cherry-pick path in §8.

**P6 · Hardening.** Hit the perf budget, mobile pass, accessibility and fallback paths, the two Worker tests, `astro check`, `npm audit --omit=dev`.

**P7 · Optional.** Add to the random rotation at low weight. Capture a screenshot for the Hall of Versions that `plans/plan.html` already has queued at P2.

---

## 12. Risks

- **A plan cannot make something fun.** P1 exists to find that out cheaply, before any content or art is invested.
- **A recruiter randomly assigned a game.** Mitigated by keeping it out of rotation and by the always-visible skip link.
- **Mobile performance.** Mitigated by the budget in §9 and by having no textures, no shadows, and no physics engine to blow it.
- **Five-branch cherry-picks** for shared files are the most likely source of a broken `check:shared`. Do the switcher work in a single commit on `content`.
- **Scope creep** into physics, audio design, leaderboards, or multiplayer. All out of scope. There is no backend and there should not be one.

---

## 13. Open questions

1. Permanently hidden like Nexus, or eventually in the rotation?
2. Third-person rider or first-person? Third-person reads better and makes the carve legible — assumed unless told otherwise.
3. Any appetite for sound? Assumed muted by default with a single toggle, if at all.
4. Coexist with Nexus, or absorb it? Assumed coexist — Nexus is a portal world, this is a run, and they do different jobs.
