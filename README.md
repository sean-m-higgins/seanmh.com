# Films — from life

Short animated films drawn entirely in code from Sean's build photos, served
as a path app at `seanmh.com/films/`. The photos are reference only and never
enter git or a deploy. Series design: `plans/films-plan.html` on `main`. Film
prompts: `prompts/` on `main`.

Status: **films-plan step 1 done** (toolkit, runtime, preview, renderer,
pipeline proof). **grain:** storyboard approved, look C chosen (etched
coloured pencil, with one photographic glass pass); scene 12 is built. The
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
| `src/films/grain/` | Film 01: `geom.js` (the table in inches, a pinhole camera, near-plane clipping), `home.js` (scene 12's geometry), `looks.js` (the three candidate looks; C is used). |
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
`env.paper` is the film's paper canvas. Draw from `t` and the frame only:
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

## Rules for films

- **Hold the shading, boil the line.** Big hatched areas use `env.still`;
  outlines and lettering use `R`.
- Boil amplitude = `wob` amplitude (1–2 px). Put intended curves in the
  points, not in `amp`.
- Reference photos stay in `~/SoftLot/MyWebsite/film-refs/` and `incoming/`.
  Never commit or deploy them.
