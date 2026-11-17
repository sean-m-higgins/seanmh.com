# from life — shared brief for every film

> Read this file in full before reading a film prompt (`01-…`, `02-…`, `03-…`).
> It holds everything the three films share: what the series is, the
> inspiration, the toolchain on this machine, the deliverables, the workflow
> gates, and the guardrails. The film prompt holds the story, the facts, the
> photo log, and the beats for one film.

## 1. What you are making

A series of short, silent, animated films for Sean Higgins's personal site,
seanmh.com. Each film is **drawn entirely in code** from Sean's own build
photos. The photos are reference only and never appear in the film. The series
is called **from life**, the drawing term for working from direct observation.

| # | slug | subject | kind | length |
|---|------|---------|------|--------|
| 01 | `grain` | a coffee table, built in a garage | how-to | 45–60 s |
| 02 | `gesso` | a canvas, built and then painted, in a small apartment | how-to | 45–60 s |
| 03 | `ramp` | the Eagle Scout project, a portable wheelchair ramp | story | up to 90 s |

The standing design for the series is
`/Users/seanmhiggins/SoftLot/MyWebsite/seanmh.com/plans/films-plan.html`.
**Read it.** It has the decisions already made (silent, 1080², match-cut anchor,
two registers, rationed words, signature), the render pipeline, the `/films/`
wall, and the Nexus integration. This brief adds to that plan and does not
contradict it. Where the two disagree, ask Sean.

The bar is **world-class**: a film someone stops scrolling for, and a viewer
cannot tell whether a person or a program drew it. Put your heart into it. It
must feel human-drawn, made by hand, and never like an SVG, a stock vector, or
a slideshow of tweened shapes. Every frame should be good enough to print.

## 2. The inspiration library, and what to take from each

Everything is in `/Users/seanmhiggins/SoftLot/MyWebsite/inspiration/`. You
cannot watch a `.mov` directly, so keyframe sheets (12 evenly spaced frames)
and a mid-point frame for every video are in `inspiration/_frames/`.
`_frames/stills-sheet.jpg` shows every still at once. Look at the images
yourself. These notes are a starting point, not a substitute.

| file(s) | what it is | what to take |
|---|---|---|
| `chalk1-3.jpeg` | Dense soft-pastel / chalk cityscapes at golden hour: thousands of short directional strokes, cream-pink clouds over cobalt rooftops, kites. | **The human mark.** Stroke-built colour, visible direction in every mark, warm/cool contrast. The strongest "a person drew this" reference. |
| `chalk-prompt-ex.txt` | Someone else's prompt that produced the chalk pieces. | The tone of the ask: one masterpiece, JavaScript only, human-drawn, emotion over literal content. Its note to avoid headless Chrome where possible is about memory on a laptop. See §4. |
| `layered1-4.jpeg` | Cut-paper / clay relief dioramas: stacked layers with real cast shadows, charcoal greys and cream, one molten-orange accent (sun, lava, maple). | **Depth from layers, one hot accent.** Paper grain, edge shadows, parallax between layers. |
| `pixels1-4.jpeg` | Atmospheric landscapes rendered through a fine dither / LED-mosaic grid: a lone figure on a hill, a light burst. | Ordered dithering and grid texture over soft gradients. Restraint: one figure, lots of air. |
| `stars1-4.jpeg` | Long-exposure star-trail streams, deep navy with red/white bands, one tiny figure. | Motion as streaks. Scale through a tiny figure. |
| `photo-realistic.jpeg` | A cinematic still: a parking garage, warm light shafts, two carts. | Light as the subject. Warm raking light across concrete (a garage). |
| `animated-footer.mov` | A painted pastoral landscape as a site footer. The light and time of day drift across it. | **How a film can live on the site:** a living painted scene, slow light changes, nothing demanding attention. |
| `blender-gif.mov` | A papercraft cube character holding a pencil draws a copy of itself, which comes alive. | **The making is the story.** A tool drawing the thing into being. A short, perfect loop. |
| `blender-short-movie.mov` | A ~78 s soft-3D short: cube character and black cat, warm lighting, varied sets, gentle emotion. | Pacing and warmth of a character short, scene variety, cinematic lighting. (Blender is installed; see §4.) |
| `pixel-art.mov` | An iris grows from one line into a bloom built from dotted/ASCII particles on black, with tiny HUD annotations (`X -0.04 Y 0.72`, `θ 88.2°`). | **Growth from nothing to complete**, and measurements as ornament. Fits the "drawing register" (dimensions, angles). |
| `starts-moving.mov` | Concentric particle rings rotating slowly, rust red and grey with white planets. | Hypnotic continuous motion made from millions of tiny marks. A loop with no seam. |
| `music-player.mov` | A skeuomorphic speaker device; the dot-grille reacts. | Tactile material rendering (brushed metal, perforation). |
| `video-realistic.mov` | A reeded/frosted glass shader over blurred green foliage, with a fine grid. | **Glass refraction.** Directly useful for the coffee table's glass pane. |

Also read `/Users/seanmhiggins/SoftLot/MyWebsite/seanmh.com/.inspiration`,
entry 1 (Kengo Works: the films `dew` and `answer`, which are this series'
model) and the hand-drawn toolkit spec (`mul32`, `wob`, `chaikin`,
`hatchFill`, `aword`, `tornPath`) plus "Principles carried out of these sites".
Cite the entry or principle a decision echoes.

## 3. The series grammar (from films-plan.html, summarised)

- **Frame.** 1080×1080, 24 fps, drawn on twos (the line "boils" by reseeding
  `wob` every second frame). Silent.
- **The anchor.** One element holds a fixed screen position for the whole film;
  every cut is a match cut on it. Each film prompt proposes one.
- **Two registers.** *Bench* scenes: warm, top-down or three-quarter, textured,
  showing the making. *Drawing* scenes: navy/blueprint diagrams carrying
  measurements, cut lists, angles, plans.
- **One look per film, one shared toolkit.** Each film prompt recommends a look
  drawn from §2. Style frames decide it (see §6).
- **Palette.** Eight "pens" per film on a cream paper ground, with a hue in the
  near-black and the white (never `#000` / `#fff`). One accent, rationed.
- **Words.** At most 12 real words per film, lowercase, at most four per
  caption. How-to captions are step verbs (*measure twice*, *clamp and wait*).
  Everything else that looks like writing is `aword` scribble. Dimensions may
  appear as drawn callouts.
- **Shape.** The last frame rhymes with the first. Decide the final image
  first, then build backwards to it.
- **Signature.** The last frame signs itself in hand lettering:
  `<title> · <your model name and version> · <year>`. Credit the model that
  actually drew it.
- **Film and page split the job.** The film carries sequence and feeling; the
  page under it carries the recipe (materials, tools, steps).

## 4. This machine and its toolchain (verified 2026-11-13)

- Apple M1, 16 GB RAM, macOS 27. **Disk is tight: about 24 GB free.** Never
  write a whole film's PNG frames to disk; pipe frames straight into ffmpeg.
  Keep drafts in a gitignored `renders/` and delete superseded drafts.
- Node 22.23.2 and npm 10.9.8 via asdf (`.tool-versions` at `MyWebsite/`).
  `~/.zprofile` puts `~/.asdf/shims` first on `PATH` because a stale npm
  7.7.6 still sits in `/usr/local/bin`. If `npm -v` ever prints 7.x, call
  `~/.asdf/shims/npm` directly.
- **ffmpeg 9.0.2** (Homebrew) with libx264, libx265, SVT-AV1, libaom, VP9,
  ProRes, VideoToolbox (no WebP encoder: write WebP with ImageMagick, `magick in.png -quality 90 webp:out.webp`); filters `palettegen`, `paletteuse`,
  `xfade`, `zscale`, `drawtext`.
- **gifski 1.34** for high-quality GIFs (better than ffmpeg's palette GIFs).
- ImageMagick 7.1 (`magick`), `sips`, Python 3.12.
- Google Chrome (`/Applications/Google Chrome.app`). The headless
  frame-render chain was smoke-tested: canvas page → PNG → ffmpeg MP4 →
  gifski GIF. **Launching Chrome once per frame costs ~1.5 s**, about 55 min
  for a 60 s film. Use one persistent headless Chrome over CDP (Node 22 has
  a global `WebSocket`; no dependencies needed), as films-plan.html specifies.
  Run only one Chrome at a time; 16 GB is the limit.
- **Blender 5.3.0** at `/Applications/Blender.app/Contents/MacOS/Blender`
  (not on `PATH`). Verified headless with Python:
  `Blender --background --factory-startup --python script.py`. EEVEE renders
  fast on the M1. Use it for a look that needs real 3D (the
  `blender-*.mov` references, `layered*` relief with true cast shadows), or to
  render passes that the canvas film composites. Keep the default, though: a
  film drawn in JavaScript (`.inspiration` principle 5, "everything is code").
  Propose Blender at the style-frames gate, with a reason, rather than
  defaulting to it. A Blender render must still be deterministic and must
  still look hand-made.
- Not installed: Remotion, manim, exiftool. Do not install anything without
  asking Sean.
- Claude Code plugin `seanmh` (in `seanmh.com/plugin/`) provides skills
  `motion-design` (timing, easing, choreography), `site-craft`, `new-version`
  and `verify-version`. Use `motion-design` for every timing decision.

## 5. Source photos

| film | originals (never copy into git) | prepared references (read these) |
|---|---|---|
| grain | `MyWebsite/film-diy-coffee-table-pics/` (16) | `MyWebsite/film-refs/grain/` |
| gesso | `MyWebsite/film-diy-canvas-pics/` (14) | `MyWebsite/film-refs/gesso/` |
| ramp | `MyWebsite/film-eagle-project-pics/` (22), plus `wt/h-gaudi/tmp-eagle-scout-ramp.jpeg` | `MyWebsite/film-refs/ramp/` (that photo is `h-gaudi-ramp.jpg`) |

The references are auto-oriented, stripped of metadata, and at most 1568 px.
Each folder has `_contact-sheet.jpg`. The originals carry **no EXIF dates**, so
filename order is the chronology. Each film prompt includes a photo log written
from these images; check it against the photos yourself.

## 6. Workflow, with gates (do not skip a gate)

0. **If `version/i-films` does not exist yet**, do films-plan.html step 1
   first: create the branch and worktree with the `new-version` skill, build
   the drawing toolkit, the deterministic film runtime (time comes from the
   frame index, never `requestAnimationFrame`), the local preview page with a
   scrubber, and `scripts/render-film.mjs`. Prove it with the 5-second test
   film and measure the bitrate against the budget.
1. **Photo log and facts.** Check the photo log against the photos. Sean
   answered every open question on 2026-11-13; the answers are in each film
   prompt's Facts and "Facts status" sections. Ask Sean only about anything
   new you find. No fact is drawn until Sean has confirmed it.
2. **Storyboard.** Scene list with duration, register, caption (or none),
   anchor position, source photo filenames, and what moves. Write it as a
   self-contained HTML page (Sean prefers HTML for plans) with a thumbnail
   sketch per scene. **Sean approves before anything is drawn.**
3. **Style frames.** Three finished stills at full quality, each a different
   candidate look from the film prompt. Render them to PNG and show Sean side
   by side. **Sean picks before animation starts.**
4. **Build the film**, one scene at a time, previewing as you go.
5. **Self-review before showing Sean.** Render a contact sheet: one frame from
   the start, middle and end of every scene. Look at it critically. Does every
   frame look hand-made? Does the anchor hold? Are there more than 12 words?
   Does the last frame rhyme with the first? Does motion follow `motion-design`?
   Fix what fails, then show Sean.
6. **Release render** (see §7) and report sizes, durations and the checks you ran.

## 7. Deliverables and budgets

Per film, in the films worktree:

- `public/<slug>.mp4`: H.264, yuv420p, `-movflags +faststart`, 1080×1080,
  24 fps. **≤ 20 MiB** (Cloudflare Pages rejects files over 25 MiB).
  Starting point: `-c:v libx264 -preset slow -tune animation -crf 20`.
- `public/<slug>-poster.webp`: the frame that best represents the film.
- `public/<slug>.vtt`: chapters track, for the how-tos.
- **Loop:** a 4–8 s seamless excerpt for sharing and for small placements.
  Make it as `<slug>-loop.mp4` (for the web, autoplay muted) **and**
  `<slug>-loop.gif` via gifski (for places that only take GIFs). Aim for
  ≤ 8 MB at 720 px wide and report the actual size.

## 8. Guardrails

- The real photos never enter git, a deploy, or a frame of the film.
- **People:** draw them as hands, silhouettes or simplified figures, never a
  likeness. No faces from the photos. This matters most for the wheelchair
  user in the ramp photos.
- Leave out everything in photo backgrounds that is not the story: brand logos
  and product names, flags, signs, posters, licence plates, house numbers.
  Tools are drawn generically (a mitre saw, not a brand).
- No invented facts. Anything marked **(confirm)** in a film prompt must be
  confirmed by Sean before it is drawn. Imagined scenes are allowed only as
  clearly poetic moments that Sean has approved (the ramp's closing at the
  stable is approved). The coffee table's simple indoor room follows the
  story's last line and has no photo, so keep it generic.
- Commit only when Sean asks, straight to the branch you are on (no feature
  branches). Pushing a `version/*` branch deploys it: confirm first.
