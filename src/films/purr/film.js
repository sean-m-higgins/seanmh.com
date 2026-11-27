// Film 05 · purr — four cats through one day, on a loop.
// Plan: seanmh.com/plans/film-purr.html (2026-11-26). Eight scenes of 15 s
// (4 bars of the 64 BPM soundtrack each), 120 s in all. Each scene is drawn
// from its own clock in seconds, so it can already be running while it fades
// in: the last 1.25 s of every scene dissolves into the next one, and the last
// scene dissolves into the first, so the loop point is just another frame of a
// dissolve. The cats move on twos; the dissolves move on ones.

import { SIZE, FPS, scratch, smooth, finish } from './kit.js';
import { sheet } from './cats.js';
import { sill } from './scene-sill.js';
import { sunpatch } from './scene-sunpatch.js';
import { balcony } from './scene-balcony.js';
import { quilt } from './scene-quilt.js';
import { rain } from './scene-rain.js';
import { box } from './scene-box.js';
import { dusk } from './scene-dusk.js';
import { night } from './scene-night.js';

const SCENES = [sill, sunpatch, balcony, quilt, rain, box, dusk, night];
const DUR = 15;
const SPAN = DUR * FPS;       // 360 frames
const XF = 30;                // dissolve, in frames (1.25 s)

const twos = (f) => Math.floor(f / 2) * 2;

function drawScene(ctx, sc, f, env) {
  ctx.save();
  sc.draw(ctx, twos(f) / FPS, env);
  ctx.restore();
}

const film = {
  slug: 'purr', title: 'purr', model: 'claude opus 5.5', year: 2026,
  fps: FPS, size: SIZE, seed: 20261126, boilEvery: 2,
  scenes: SCENES.map((sc, i) => ({
    id: sc.id,
    dur: DUR,
    draw(ctx, t, R, env) {
      if (env.look === 'cats') { sheet(ctx, env.sec); return; }
      const f = env.frame - i * SPAN;
      drawScene(ctx, sc, f, env);
      const into = f - (SPAN - XF);
      if (into >= 0) {
        // A share loop (env.loop) dissolves a scene into itself, so it has no seam.
        const next = env.loop ? sc : SCENES[(i + 1) % SCENES.length];
        const buf = scratch('dissolve');
        drawScene(buf.getContext('2d'), next, f - SPAN, env);
        ctx.save();
        ctx.globalAlpha = smooth((into + 1) / (XF + 1));
        ctx.drawImage(buf, 0, 0);
        ctx.restore();
      }
      finish(ctx);
    },
  })),
};

export default film;
