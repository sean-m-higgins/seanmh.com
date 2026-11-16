# Films — from life

Short animated films drawn entirely in code from Sean's build photos, served
as a path app at `seanmh.com/films/`. The photos are reference only and never
enter git or a deploy. Series design: `plans/films-plan.html` on `main`. Film
prompts: `prompts/` on `main`.

Status: **films-plan step 1 done** (toolkit, runtime, preview, renderer,
pipeline proof). All three films passed their storyboard and style-frame gates,
are fully animated, and have release media in `public/`: **grain** (12 scenes,
etched coloured pencil with one photographic glass pass; redrawn 2026-11-16), **gesso** (17 scenes,
impasto with raking light), and **ramp** (18 scenes, lit cut-paper relief). The
`/films/` wall (step 3) is not built yet. The Astro pages are still the
`content` baseline.

## Commands

Node ≥ 22.12 (see `.nvmrc`).

```bash
npm test                                   # toolkit + runtime unit tests
npm run film:preview                       # stage at http://127.0.0.1:4340/tools/stage.html?film=<slug>
npm run film:render -- <slug>              # draft  -> renders/<slug>.mp4
npm run film:render -- <slug> --still 3,12 # stills -> renders/<slug>-<t>s.png
npm run film:render -- <slug> --hash 0,60  # determinism check
npm run film:render -- <slug> --release    # public/<slug>.mp4 + -poster.webp + .vtt, 20 MiB budget enforced
npm run film:render -- <slug> --loop <id>  # one scene, seamless -> public/<slug>-loop.mp4 + -loop.gif (720 px)
npm run check && npm run build             # the Astro site
```

Draft options: `--from <s> --to <s>` renders a range, `--crf <n>` (default
20), `--poster <s>` picks the poster frame for a release.

## Layout

| path | what |
|---|---|
| `src/lib/draw/` | The hand-drawn toolkit: `rng` (mul32, fbm), `line` (wob, chaikin, pencil, box, arc), `fill` (hatchFill, pastelFill), `hand` (single-stroke alphabet, aword, scribble), `paper`, `color`. |
| `src/films/runtime.js` | Deterministic runtime: timeline, frame → scene, boil on twos, chapters / VTT. |
| `src/films/common.js` | Easing, caption, signature. |
| `src/films/<slug>/film.js` | One module per film. `test` is the pipeline proof. |
| `src/films/grain/` | Film 01. Redrawn 2026-11-16 on a pencil engine that works from light. `kit.js` (the engine: a tonal painting laid down through pencil strokes that follow each form, cast shadows, a line layer with hidden-line removal, a held background per scene), `geom.js` (camera, boxes, cylinders), `table.js` (the table as solids, materials), `props.js` (carpenter's pencil, glove, dust), `scenesA–C.js` and `home.js` (the 12 scenes), `film.js`. |
| `src/films/ramp/` | Film 03. Cut-paper relief, lit. `kit.js` (the paper piece, light, sparks, the jointed puppet, scenes on twos), `parts.js` (the ramp in inches, wheelchair, horse, ATV, trailer, sets, the plotter and dot-matrix), `weld.js` (scene 9), `scenesA–E.js` (the other 17), `film.js` (scene list). |
| `src/films/gesso/` | Film 02. `paint.js` (paint with body: every stroke lays colour and height, then `light()` rakes a lamp across the height map), `field.js` and `painting.js` (the wildflower painting as an ordered list of marks), `kit.js` and `parts.js` (the apartment, tools, people and shared scene helpers), `scenes1–3.js` (all 17 scenes), `film.js` (scene list). |
| `tools/stage.html` | Preview (scrubber, frame counter, `?t=`) and the page the renderer drives. |
| `scripts/film-server.mjs` | Localhost static server; also serves `/refs/` from `~/SoftLot/MyWebsite/film-refs`. |
| `scripts/render-film.mjs` | One headless Chrome over CDP → PNG frames piped into ffmpeg. No dependencies. |
| `incoming/` | Gitignored: storyboards and anything that shows reference photos. |
| `renders/` | Gitignored drafts. Only release renders are committed, to `public/`. |

## Film module contract

```js
export default {
  slug, title, model, year, fps: 24, size: 1080, seed,
  boilEvery: 2,                   // optional; 2 = drawn on twos
  scenes: [{ id, dur, step?, draw(ctx, t, R, env) }],
};
```

`t` runs 0..1 through the scene. `R` is the boiling generator, reseeded every
`boilEvery` frames. `env.still(key)` returns a generator that never boils.
`env.paper` is the film's paper canvas. `env.loop` is set for a loop render: a looping scene holds anything that would leave a seam. Draw from `t` and the frame only:
no `Date`, no `Math.random`, no `requestAnimationFrame`.

## Measured facts (pipeline proof, 2026-11-14)

- **Deterministic.** The same frame hashes identically on the same page and
  on a fresh page.
- **Speed.** About 6.3 frames/s on the M1, so a 60 s film takes about 4 min.
- **Plays.** H.264 High, yuv420p, `+faststart`. It played to the end in
  Chrome's `<video>` and decoded in AVFoundation (Safari's decoder).
- **Budget.** With dense hatching *boiling*: 2.9 Mb/s, ≈ 21.5 MiB per 60 s,
  over budget. With shading *held* (`env.still`) and only lines and lettering
  boiling: 0.95 Mb/s, ≈ 6.9 MiB per 60 s at CRF 20. R2 is not needed.
- **CRF.** CRF 26 visibly smears paper tooth and line grain; keep 20–22.
- **Colour.** 4:2:0 chroma subsampling greys out hue in 1 px lines at any
  CRF. Put colour in masses (hatched areas, washes), not hairlines.
- **A real film costs more than the proof.** grain (53 s, 12 scenes, look C,
  CRF 20): 15.2 MiB, 2.4 Mb/s, about **17 MiB per minute**. Scene peaks: the
  lumber rack (4.4 Mb/s, about 16 boiling outlines at once) and the closing
  push-in (3.4 Mb/s; a zoom moves every pixel). An 85–90 s film at this
  density would exceed the 20 MiB budget, so it needs fewer boiling outlines,
  `boilEvery: 3`, or CRF 22.
- **Render time grows with the drawing.** grain renders at about 1.2 frames/s
  (17 min for 53 s), against 6.3 frames/s for the sparse proof.
  The redrawn grain (55.5 s) is 16.9 MiB (2.5 Mb/s) and renders at about
  2.8 frames/s (8 min), because each scene's background is drawn once and held.
- **Dense paint can still compress well when it holds.** gesso (74 s, 17
  scenes, CRF 20) is 12.6 MiB (1.4 Mb/s); the impasto shading stays fixed while
  the drawn marks move.

## Rules for films

- **Hold the shading, boil the line.** Big hatched areas use `env.still`;
  outlines and lettering use `R`.
- Boil amplitude = `wob` amplitude (1–2 px). Put intended curves in the
  points, not in `amp`.
- Reference photos stay in `~/SoftLot/MyWebsite/film-refs/` and `incoming/`.
  Never commit or deploy them.
- **ramp is the cheap way to make a long film.** It moves on twos like
  stop-motion (`scene()` in `ramp/kit.js` holds time for two frames), and
  nothing boils, so every second frame is a duplicate: 89 s at CRF 20 came
  to about 14 MiB (1.3 Mb/s).
- **A cache that sets a light must leave it as it found it.** `cached()` only
  runs its builder the first time, so module state the builder changes
  (`setLight` / `noLight`) differs between the first frame and every later
  one. Reset the light after drawing a cached layer, and run `--hash`.
