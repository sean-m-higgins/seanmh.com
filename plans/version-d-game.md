# Version D — Game

**Status:** Plan only. Nothing implemented. This is a scoped build spec for one new version branch; `plans/plan.html` remains the canonical project roadmap.

**Revised.** The first draft built the game around the résumé — gates as a career timeline. That is out. The portfolio lives in the other three versions and does not need a fourth telling of it. This is a game: fun first, replayable, chasing a high score, escalating until it kills you. The only portfolio content here is a link in the corner.

---

## 1. Where this fits

The site is already a branch-per-version portfolio: each version is a standalone Astro app on its own branch, deployed to its own Cloudflare Pages project, fronted by the router Worker on `main` (`worker.js`) which assigns visitors a version via the `pv` cookie and whole-path-proxies to the chosen origin.

A game version slots into that architecture unchanged. It does not touch the existing versions.

| | |
|---|---|
| Branch | `version/d-game` (branched from `content`) |
| Pages project | `seanmh-game` → `seanmh-game.pages.dev` |
| Reachable at | `seanmh.com/?v=d-game` |
| In random rotation | **No** — same posture as `nexus` |

---

## 2. What the brief actually demands

Everything below is judged against four things, in this order:

1. **Fun inside three seconds.** No tutorial, no premise to absorb. You should understand it before you have finished reading the one line of instruction.
2. **A high score you want to beat.** Not a completion, not an ending. A number, a personal best, and a visible gap between them.
3. **Escalation built into the mechanic**, not bolted on as a difficulty slider. The game should get harder because of something you can feel happening, not because a variable went up.
4. **Instant restart.** One key, no menu, under 200 ms. Retry friction is the single largest determinant of whether a high-score game gets played twice.

A corollary that shapes the whole design: **playing safe must lose.** If the optimal strategy is caution, the skill ceiling is a plateau and nobody chases a score. Every concept below is checked against that.

---

## 3. Concept options

### D1 — Endless Descent *(recommended)*

*Reworked from the first draft's Powder Run, with the career gates stripped out and an actual arcade loop in their place.*

An infinite procedural mountain. You snowboard down it. Your base speed ramps continuously and never resets, so the run is always ending — the only question is how far you get.

Three things make it a scoring game rather than a dodging game:

- **Near-misses build a multiplier.** Shave past a tree inside a tight radius and the multiplier ticks up, with a snap of powder and a sound. It decays if you stop taking risks. This is the "safe play loses" enforcement — the racing line and the scoring line are deliberately not the same line.
- **Air tricks.** Hit a lip, rotate mid-air, land clean, bank a bonus scaled to rotation. Land dirty and you eat the crash.
- **The avalanche.** A wall of snow behind you, always closing. Crashing does not kill you — it costs speed and dumps your multiplier — but the avalanche is the thing that catches you while you are slow. Crashes matter because of the chase, not because of a life counter. And the gap tightens over time regardless, so every run ends.

Score = distance travelled × the multiplier you sustained. Runs land in the 30–90 second band.

Why this one: the escalation is speed, which you feel rather than read; the risk/reward is spatial and instant; procedural low-poly terrain is what Three.js is best at with no assets at all; and it is not a clone of anything specific.

### D2 — Orbit *(strong alternate)*

You are a small craft in an endless procedural starfield. You are always orbiting *something*. One input — press to release, press to capture the next body — and the whole game is timing your release so the slingshot flings you further into the field rather than into a sun.

Escalation: bodies get smaller and further apart, orbital speeds climb, and hazards start appearing between them. Score is distance. Chaining releases at the perfect tangent gives a combo multiplier, so again, the greedy line and the safe line diverge.

Visually the strongest of the set — dark field, bloom, one accent colour, orbital trails — and the closest to "nice clean modern UI" as an aesthetic rather than a coat of paint. The cost is that a slingshot needs real tuning before it feels good, and there is a two-second "what am I doing" beat that the descent does not have.

### D3 — Tumble *(safest, lowest ceiling)*

One-button 3D tower stacker. Blocks swing in on a crane; tap to drop; overhang gets sliced off and the block gets narrower. Escalation: faster swing, wind, drift. Score is height.

Instantly understood, genuinely addictive, perfect on mobile, and the least work of anything here. The problem is that it is a well-known formula and the skill ceiling is thin — you get good at it in ten minutes and there is nowhere further to go. Listed because it is the honest low-risk answer if the other two fail to feel good.

### D4 — Conduit

A tunnel flyer. You fly down a procedural tube, walls and gates rushing at you, speed climbing. Pure reflex, escalates naturally, trivially readable. This is the reskin target for D1's engine if there is ever appetite for a second mode — the terrain generator and the chase logic transfer almost directly. On its own it is thinner than the descent: no trick system, no risk/reward, just dodge.

*(Previously D2 "Handshake" — the you-are-an-HTTP-request framing — is folded into this one. The premise was doing work the mechanic could not back up.)*

### D5 — Prism

Endless waves of a laser-routing puzzle: rotate mirrors on a grid to hit every target before the wave timer expires, with each wave adding a mirror, a splitter, or a colour. Score is waves cleared. Refraction and bloom in 3D look superb.

Kept in the doc as the one non-reflex option, but not recommended: procedural puzzle generation that stays fair and interesting is genuinely hard, the "fun in three seconds" test is a stretch for a puzzle, and it is the most work of anything listed.

### Rejected — The Workshop

The first draft's clickable low-poly room. It has no loop and no score, so it fails the brief outright. Recorded here so it does not get re-proposed.

### At a glance

| | Grasp | Score ceiling | Escalation | Build cost | Clone risk |
|---|---|---|---|---|---|
| **D1 Descent** | instant | high | speed + closing avalanche | medium | low |
| D2 Orbit | ~2s | high | spacing + hazards | medium-high | low |
| D3 Tumble | instant | low | swing speed + wind | low | **high** |
| D4 Conduit | instant | medium | speed + density | low-medium | medium |
| D5 Prism | slow | medium | wave complexity | high | low |

**Recommendation: D1.** It is the only option that scores well on all four brief criteria at once, and its engine gives D4 nearly for free later. **D2 is the pick if you would rather have the more distinctive-looking thing** and accept more tuning risk.

---

## 4. Endless Descent in detail

**Loop.** Title → one line of instruction → ride → die → score, personal best, delta → `R` to restart. There is no menu between a death and the next run.

**Controls.** `A`/`D` or `←`/`→` to carve, `Space` to jump, hold a direction in the air to rotate. On touch: drag to carve, tap to jump. That is the entire input surface.

**Escalation, all three at once:**

| | |
|---|---|
| Base speed | Ramps continuously from the first second, never resets, no cap |
| Obstacle density | Climbs with distance; tree spacing tightens toward the racing line |
| Avalanche gap | Shrinks on a slower curve, so late runs have no margin for a crash |

**Failure.** One state: the avalanche catches you. Crashing is a setback — speed loss, multiplier reset, a second of recovery — not an ending. This keeps the pressure continuous instead of binary and means a bad moment does not immediately end the session.

**Scoring.**

```
score = floor(distance) × sustained_multiplier
multiplier:  1.0 base
            +0.1 per near-miss, capped around 8×
            ×    trick bonus scaled by clean rotation
            decays ~0.2/s when not earning
            resets to 1.0 on crash
```

The multiplier decay is the load-bearing number in the whole design. Too fast and the game is stressful; too slow and cruising the empty middle of the slope is optimal. Expect this to be the single most-tuned value in the build.

**Target curve.** Median first run around 25 seconds. By run ten, around 60. A good player, three minutes. The ceiling should be a horizon, not a wall.

---

## 5. Score, seeds, and the leaderboard

**Seed every run.** A seeded PRNG driving all terrain and obstacle generation, chosen at run start and kept in the run record. This is cheap to do on day one and effectively impossible to retrofit, and it unlocks three things: reproducible bug reports, ghost replays, and server-side score verification.

**Local first.** `localStorage` holds the personal best and the last few runs. The HUD shows a best-line marker and the game-over screen shows the delta — "1,240 short" is a better retry prompt than a bare number.

**Daily seed.** Everyone gets the same mountain on a given day, with a separate best. Almost free once the PRNG is seeded, and it is the single strongest replayability hook available — a reason to come back tomorrow rather than just again.

**Global leaderboard — optional, and last.** The infrastructure is already there: the router Worker on `main` has a KV binding and a rate-limited `/api/ask` to copy the shape from. A `/api/score` endpoint storing a small top-N list would work.

Two conditions before building it. First, the game has to be fun — a leaderboard on a game nobody replays is decoration. Second, it needs anti-forgery, because a public endpoint that accepts a number is a public endpoint that accepts any number: submit the seed plus a compact input log, have the Worker check the score against the theoretical maximum for that duration and seed, rate-limit by IP as `/api/ask` already does, and store three initials and a number, nothing else. Perfect verification is not the goal; making it more effort to cheat than to play is.

---

## 6. Tech stack

Lean, and matched to what the repo already runs.

- **Astro 7** + **Tailwind CSS 4** (CSS-first config) — identical to every other version branch.
- **three** `^0.185.1` — the same version `version/b-card` and `version/nexus` already pin.
- **TypeScript** strict, via `astro/tsconfigs/strict`. Gate is `astro check`.
- **Vite** comes with Astro. No second bundler.
- A ~30-line seeded PRNG and value-noise function, written in the repo. Not worth a dependency.
- Node 22.12 (`.nvmrc`), unchanged.

Explicitly **not** using:

- **react-three-fiber** — it would drag React into an Astro site that has none, for a single canvas.
- **A physics engine** (Rapier, cannon-es) — roughly a megabyte of WASM to do what kinematic movement and sphere-against-cylinder checks do in a few dozen lines. It would also make runs non-deterministic, which breaks seeding.
- **glTF models or textures** — all geometry generated in code, low-poly, flat-shaded, vertex-coloured. This is the main lever keeping the bundle small and the load instant.
- **A game framework** (Babylon, PlayCanvas, Phaser). Three plus a `requestAnimationFrame` loop is the whole requirement.

---

## 7. Project structure

```
src/
  components/
    GameCanvas.astro       canvas element + island bootstrap
    StartScreen.astro      title, one-line how-to-play, start
    Hud.astro              score, multiplier, best-line marker
    GameOver.astro         score, best, delta, R-to-restart
  scripts/game/
    main.ts                bootstrap, fixed-step loop, pause on hidden
    scene.ts               renderer, camera, lights, fog
    rng.ts                 seeded PRNG + value noise
    terrain.ts             chunked heightfield, recycled ahead of the rider
    rider.ts               carve, jump, rotation, crash recovery
    obstacles.ts           pooled InstancedMesh trees and rocks
    avalanche.ts           chase wall, gap curve, catch test
    scoring.ts             distance, near-miss detection, multiplier, decay
    input.ts               keyboard, pointer, touch
    hud.ts                 DOM binding
    storage.ts             localStorage bests, daily seed
  pages/
    index.astro            minimal shell + canvas
```

`BaseLayout.astro`, `VersionSwitcher.astro`, `src/styles/`, and `src/content/site.ts` come across from `content` unchanged.

---

## 8. UI approach

**The HUD is DOM, not WebGL.** Text rendered into the canvas is blurry, expensive, and invisible to screen readers. Tailwind elements layered over the canvas are sharp at any DPR and free to animate. The canvas draws the world; HTML draws everything you read.

Visual direction stays inside the existing design system: `--color-accent` `#6366f1` on `#0a0a0a`, Inter for UI, JetBrains Mono for the score readout. The mountain is cool and desaturated so indigo stays the only saturated colour on screen — multiplier, best-line marker, and trick popups all read as one family.

The HUD is three elements and nothing else: score, multiplier, and a marker showing where your personal best sits. During play the screen is the mountain.

**Feel is a UI feature.** Screen shake on crash, a snap of chromatic aberration when the multiplier steps, camera FOV widening with speed, powder spray on a near-miss. These are the difference between a tech demo and a game, and they are cheap. Budget real time for them rather than treating them as polish that gets cut.

---

## 9. Routing and hosting

**Cloudflare Pages project.** New git-connected project `seanmh-game` on branch `version/d-game`, build `npm run build`, output `dist/`. Same shape as every other version. No Wrangler deploys — Pages owns it.

**Router Worker (`worker.js` on `main`).** Add the origin to `ROUTABLE` but *not* to `VERSIONS`, mirroring `NEXUS`:

```js
const GAME = { name: 'd-game', origin: 'https://seanmh-game.pages.dev' };
const ROUTABLE = [...VERSIONS, NEXUS, GAME];
```

Reachable via `?v=d-game`, sticky through the `pv` cookie, never randomly assigned. Deployed with `npx wrangler deploy` from `main`.

**Local dev.** `scripts/dev-proxy.mjs` mirrors the Worker on port 8787 and needs a matching entry (port 4324). `plans/plan.html` already flags this file drifting from `worker.js` as a P0 — do not add to the drift.

**Tests.** `test/worker.test.js` gets two cases alongside the existing ten: `?v=d-game` proxies to the game origin, and d-game never appears across a large number of `pickVersion()` draws. If `/api/score` is ever built, it gets the same treatment `/api/ask` already has.

**Rotation, later.** A game is a bad thing to hand a recruiter unannounced, so it stays out of `VERSIONS`. If that ever changes it is a one-line weight change and a separate decision.

---

## 10. Shared-content contract

`scripts/check-shared.mjs` enforces that `src/content/site.ts`, `src/content/experience.ts`, `src/assets/images/headshot.jpeg`, `src/components/VersionSwitcher.astro`, and `src/styles/transitions.css` stay byte-identical across the version branches. Branching from `content` gets that for free.

The game does not read `experience.ts` — that was the old design. It uses `site.ts` only, for the one corner link out to the portfolio.

**Adding the switcher glyph is a five-branch operation.** The game's glyph (suggest `△`, alongside `∿` scroll, `▣` card, `❯` terminal) goes into `VersionSwitcher.astro` on `content` first, then cherry-picks into `a-scroll`, `b-card`, `c-terminal`, `nexus`, and `d-game`. `check-shared.mjs` also needs `version/d-game` added to its branch list, and requires a git worktree per branch to run. Do it in one commit.

`transitions.css` should gain a `vt-game-in` flavour keyframe so arriving at the game gets its own cross-document transition, the way the terminal has its CRT power-on — same cherry-pick path.

---

## 11. Performance budget

Numbers to build against, not to discover afterwards.

- **Under 250 KB gzipped** for the game chunk. Tree-shaken three core is around 150 KB; the rest is the game.
- **Under 30 KB** for the initial shell. The game bundle is dynamically imported behind the start button, so the landing page paints instantly.
- **60 fps on a mid-range 2021 phone**, and framerate must not sag as distance grows — under 80 draw calls and under 150k triangles held *constant*, because terrain chunks and obstacles are recycled rather than accumulated.
- **Endless means pooling.** Terrain generates in chunks ahead of the rider and retires them behind; trees and rocks live in fixed-size `InstancedMesh` pools whose instances are repositioned, never created. Nothing is allocated in the frame loop — no `new Vector3` inside `update()` — because a garbage collection pause at speed reads as a crash you did not cause.
- **Fixed-step simulation** decoupled from render, so physics feel is identical at 60 and 120 Hz and seeded runs stay reproducible.
- **No shadow maps.** Hemisphere plus directional light with fake contact-shadow decals is right for flat-shaded low-poly and costs nothing.
- `antialias: false`, DPR capped at 2 (1.5 on mobile), `powerPreference: 'high-performance'`, RAF paused on `document.hidden`.

---

## 12. Fallbacks and accessibility

This version is a game, not a portfolio page, so it does not need to mirror the résumé — the other three versions do that and the switcher is one click away. What it does need:

- **No WebGL, or context lost** → a clean card saying so, with links to the other versions. Never a blank canvas.
- **`prefers-reduced-motion`** → the game is opt-in behind an explicit button rather than auto-starting, and the screen shake and chromatic aberration are off. Consistent with the existing kill switch in `transitions.css`.
- **Keyboard-complete.** The full game is playable on the keyboard; nothing requires a pointer.
- **A real `<title>` and meta description**, plus a persistent corner link to the portfolio. A crawler landing here should understand whose site it is and where the substance lives.
- **Colour is never the only signal** — the multiplier state reads through size and position as well as hue.

---

## 13. Phases

**P0 · Route before gameplay.** Branch `version/d-game` from `content`, add three, ship a blank resizing canvas, create the Pages project, add the Worker and dev-proxy entries, confirm `seanmh.com/?v=d-game` reaches it end to end. Prove the plumbing while there is nothing to debug.

**P1 · A slope worth riding.** Seeded terrain, chunk recycling, follow camera, carve, jump, crash recovery. Grey boxes on a grey hill. **This is the kill gate**: if the movement is not satisfying with no art, no score, and no chase, stop and reconsider the concept rather than decorating a mechanic that does not work. Nothing in P2 onward can rescue bad movement.

**P2 · The game.** Avalanche chase and gap curve, near-miss detection, multiplier and decay, air tricks, distance scoring, death and instant restart. At the end of this phase it should be a complete loop worth playing for ten minutes.

**P3 · Tuning.** Speed ramp, decay rate, near-miss radius, density curve, avalanche curve. This is not polish, it is where the game is actually made, and it deserves its own phase and a lot of playing.

**P4 · Feel and look.** Screen shake, FOV, powder spray, trick popups, the palette, instanced trees and rocks, fog. Personal best marker and game-over delta.

**P5 · Daily seed and local bests.** `localStorage`, best-line marker, daily mountain.

**P6 · Hardening.** Hit the perf budget, mobile pass, fallbacks, the two Worker tests, `astro check`, `npm audit --omit=dev`. Switcher glyph and `vt-game-in` via the cherry-pick path in §10.

**P7 · Optional, only if it earned it.** Global leaderboard with seed-and-replay verification. Ghost of your best run. A second mode reskinning the engine as D4 Conduit.

---

## 14. Risks

- **A plan cannot make something fun.** P1 exists to find that out cheaply, before any art or scoring is invested. Take the fallback seriously if it fails.
- **Tuning is the real cost**, and it is the phase most likely to be under-budgeted. The difference between this being played twice and played twenty times is P3, not P4.
- **Frame-rate decay in an endless game.** Mitigated by pooling everything and allocating nothing in the loop — but it needs measuring at five minutes in, not at ten seconds in.
- **Score forgery** if the leaderboard is ever built. Mitigated by seed-and-replay verification and by keeping it optional and last.
- **Mobile performance.** Mitigated by the budget in §11, and by having no textures, no shadows, and no physics engine.
- **Scope creep** into multiplayer, accounts, cosmetics, or a second mode before the first one is good. Out of scope.

---

## 15. Open questions

1. **D1 Descent or D2 Orbit?** Descent is the safer good game; Orbit is the better-looking one and the more novel. Assuming Descent unless told otherwise.
2. **Global leaderboard at all**, or personal best and daily seed only? Assuming local-first, with the leaderboard deferred to P7 and genuinely optional.
3. **Sound?** A high-score game gains a lot from audio feedback on the multiplier. Assuming muted by default with one toggle, built in P4 if at all.
4. **Coexist with Nexus, or absorb it?** Assuming coexist — Nexus is a portal world, this is an arcade game.
