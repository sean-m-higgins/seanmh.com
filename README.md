# Films — from life

Short animated films drawn entirely in code from Sean's build photos, served
as a path app at `seanmh.com/films/`. The photos are reference only and never
enter git or a deploy. Series design: `wiki/Films.md` on `main`. Film
prompts: `prompts/` on `main`.

Status: toolkit, runtime, preview, renderer and pipeline proof are done. All three films passed their storyboard and style-frame gates,
are fully animated, and have release media in `public/`: **grain** (12 scenes,
etched coloured pencil with one photographic glass pass; redrawn 2026-11-16), **gesso** (17 scenes,
impasto with raking light), and **ramp** (18 scenes, lit cut-paper relief). The
`/films/` collection and one wall page per film (step 3) are live at
`seanmh.com/films/`. **sunny** (9 scenes, a felt-and-card miniature rendered in
Blender) was released 2026-11-19 as film 04. Its design notes are in
`wiki/Films.md` on `main`.

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
20), `--poster <s>` picks the poster frame for a release, `--audio <wav>`
muxes a soundtrack into a draft or release (AAC; `--abr <kb/s>`, default 160).
`--fit <MiB>` (release) is for a film too long to fit the budget at a fixed
CRF: it renders the frames once to a near-lossless master in `renders/`, then
encodes that in two passes to the size asked for. `--master <file>` reuses a
master, so an encode can be redone without drawing the frames again.

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
| `src/films/sunny/` | Film 04, made in Blender 5.3 from Python (no `.blend` file, no hand keyframes). `cat.py` (Sunny: a mesh grown from a skeleton with the Skin modifier, a painted coat, and a puppet rig whose bones are all set by matrix each frame; he is a tripod, with no right hind leg and a bob tail, while the grey cat is built with `tripod=False`), `anim.py` (poses and three-legged gaits as pure functions: a hopping walk, a rocking canter, a gallop), `sets.py` (rooms, props, lights, the yarn signature), `scenes.py` (the nine scenes and the share loop), `film.py` (timeline, renderer, encoder). |
| `src/films/purr/` | Film 05, a five-minute loop with sound. `kit.js` (the illustration kit: ink line, cel-shade and highlight crescents cut against the scene's light, held layers, soft far/near planes, foliage, sun patches, steam, motes, grade), `cats.js` (four coats and six poses, with tapered tails, a yawn, a lifted paw and a lick; Sunny is a tripod with a bob and only uses poses that respect that), `scene-*.js` (the eighteen scenes), `film.js` (the dissolve loop), `music/` (the soundtrack in Python + numpy; see its README). |
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

## sunny — the Blender film

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
F=src/films/sunny/film.py
$B --background --factory-startup --python $F -- --sheet                 # contact sheet -> renders/sunny/sheet.jpg
$B --background --factory-startup --python $F -- --sheet feather --cols 12
$B --background --factory-startup --python $F -- --still morning:6.5     # one frame -> renders/sunny/
$B --background --factory-startup --python $F -- --scene feather         # one scene, draft MP4
$B --background --factory-startup --python $F -- --release               # all scenes -> public/sunny.mp4
$B --background --factory-startup --python $F -- --release --only lamp   # re-render one scene, reuse the rest
$B --background --factory-startup --python $F -- --loop                  # public/sunny-loop.mp4 + .gif
```

The poster is a still converted with ImageMagick:
`magick renders/sunny/morning-7.33333s.png -quality 90 webp:public/sunny-poster.webp`.

Measured 2026-11-18 on the M1:

- **Speed.** About 2 s per 1080² frame in EEVEE at 32 samples with screen-space
  ray tracing. The film is posed 12 times a second and each pose is held for two
  frames, so 62.5 s is 750 renders: about 25 minutes.
- **Size.** 6.7 MiB at CRF 20 (0.9 Mb/s). Held poses and soft, textureless
  surfaces compress far better than boiling pencil.
- **Disk.** Each scene's PNGs are encoded to `renders/sunny/<scene>.mp4` and
  deleted before the next scene starts.
- **Determinism.** Every pose is a pure function of scene time, but EEVEE is
  not bit-exact: rendering the same frame twice differs in a handful of pixels
  by at most 2 of 255 levels (PSNR 92 dB). The `--hash` check therefore
  reports DIFFERENT; compare with PSNR instead.
- **Sunny has three legs.** Every pose places `fl`, `fr` and `hl` only, with
  the hind paw near the midline (`MID_Y`). `gait()` takes the ground covered
  per cycle (`D`) and gives each paw a stance travel of `D × duty`, so planted
  paws do not slide even though the hind leg's duty differs from the front
  legs'. `renders/sunny/posesheet.py` (local) renders pose and gait test sheets.
- **The look (2026-11-19).** Sunny and the grey cat wear real fur: Blender hair
  strands over the painted coat (`Cat._fur`). Strands can only read the skin's
  colour when it is stored per face corner as byte colour, which is why
  `_paint` writes the coat that way; a per-vertex float attribute renders the
  fur red. Floors are `S.wood` (grain along the planks, polished enough to
  reflect), rugs are `S.pile` (a displaced grid), `S.haze` puts dust in the air
  so the hallway lamps and the last lamp throw visible cones, and `grade()` in
  `film.py` adds a compositor bloom and a faint vignette. `--nograde` renders
  without the compositor.
  Cost: fur is nearly free, but haze roughly doubles a scene's render time.
  The whole film now takes about 48 minutes (was 25) and is 7.5 MiB.
- **Sets are built per scene.** `S.reset()` clears the file and the scene's
  `build()` makes everything again, including the cat (under a second).

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

## purr — the loop with sound

```bash
python3 -I src/films/purr/music/render.py                     # renders/purr/music.wav (300.000 s, ~2 min to render)
npm run film:render -- purr --still 11,277                     # stills
npm run film:render -- purr --look cats --still 1              # every coat in every pose
npm run film:render -- purr --release --audio renders/purr/music.wav --abr 128 --fit 19.5 --poster 277
npm run film:render -- purr --loop sunpatch                    # share loop: the scene dissolves into itself
```

- **The first film with sound**, and the first loop. Eighteen scenes over
  300 s: 80 bars of the 64 BPM soundtrack, four bars (15 s) a scene and eight
  for the rain and for the night. `films.ts` marks it `kind: "loop"` and
  `sound: true`, so its player is not muted and has `loop`.
- **No seam.** Each scene draws from its own clock in seconds and can run
  before its start; the last 1.25 s of every scene dissolves into the next,
  already running, and the night dissolves into the dawn the same way.
  The music wraps every tail past 300 s back onto bar 1.
- **Nothing boils.** Each scene's set is drawn once (`held`) and only what
  lives moves, on twos. The dissolves move on twos as well.
- **Five minutes in 20 MiB.** At a fixed CRF 20 this film would be about
  30 MiB. Measured on the two-minute version: the dissolves were 8 % of the
  running time and 26–40 % of the bits, and keyframes another 20–30 %. So the
  dissolves went onto twos, the release is encoded in two passes to a size
  (`--fit`) with one keyframe a scene (`-g 360`), and the audio is AAC at
  128 kb/s. The release is 19.45 MiB; against the near-lossless master of
  the same frames it scores 0.991 SSIM (worst frame 0.979).
- **In time with the music.** The metronome, the kneading paws, the amp's
  needle, the taps on the pencil and the lamp going out all sit on the beat:
  scenes compute `beat = s * 64 / 60`. Change a scene's timing and the score
  together (`music/README.md`, "In time with the picture").
- **A blurred layer needs its sharp copy under it** (`soft()` in `kit.js`):
  a canvas blur fades to nothing at the frame's edge and leaves a pale fringe.
- **No text** except the credit line, written small over the night's last
  seconds.
