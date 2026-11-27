// Film 05 · purr — four cats through one day, on a loop.
// Plan: seanmh.com/plans/film-purr.html. Eighteen scenes over 300 s: 80 bars
// of the 64 BPM soundtrack, four bars (15 s) a scene, and eight bars (30 s)
// for the rain and for the night. Each scene is drawn from its own clock in
// seconds, so it can already be running while it fades in: the last 1.25 s of
// every scene dissolves into the next one, and the night dissolves into the
// dawn, so the loop point is just another frame of a dissolve. Everything,
// the dissolves too, moves on twos: a five-minute film has to fit in 20 MiB.

import { SIZE, FPS, scratch, smooth, finish } from './kit.js';
import { sheet } from './cats.js';
import { dawn } from './scene-dawn.js';
import { sill } from './scene-sill.js';
import { breakfast } from './scene-breakfast.js';
import { sunpatch } from './scene-sunpatch.js';
import { balcony } from './scene-balcony.js';
import { garden } from './scene-garden.js';
import { quilt } from './scene-quilt.js';
import { piano } from './scene-piano.js';
import { fish } from './scene-fish.js';
import { rain } from './scene-rain.js';
import { box } from './scene-box.js';
import { sunset } from './scene-sunset.js';
import { dusk } from './scene-dusk.js';
import { record } from './scene-record.js';
import { stove } from './scene-stove.js';
import { desk } from './scene-desk.js';
import { house } from './scene-house.js';
import { night } from './scene-night.js';

// scene, bars. One bar is 3.75 s = 90 frames.
const ORDER = [
  [dawn, 4], [sill, 4], [breakfast, 4], [sunpatch, 4], [balcony, 4], [garden, 4], [quilt, 4], [piano, 4],
  [fish, 4], [rain, 8], [box, 4], [sunset, 4], [dusk, 4], [record, 4], [stove, 4], [desk, 4], [house, 4], [night, 8],
];
const BAR = 90;               // frames
const XF = 30;                // dissolve, in frames (1.25 s)

const twos = (f) => Math.floor(f / 2) * 2;

function drawScene(ctx, sc, f, env) {
  ctx.save();
  sc.draw(ctx, twos(f) / FPS, env);
  ctx.restore();
}

let start = 0;
const film = {
  slug: 'purr', title: 'purr', model: 'claude fable 5.2', year: 2026,
  fps: FPS, size: SIZE, seed: 20261126, boilEvery: 2,
  scenes: ORDER.map(([sc, bars], i) => {
    const span = bars * BAR, from = start;
    start += span;
    return {
      id: sc.id,
      dur: span / FPS,
      draw(ctx, t, R, env) {
        if (env.look === 'cats') { sheet(ctx, env.sec); return; }
        const f = env.frame - from;
        drawScene(ctx, sc, f, env);
        const into = twos(f) - (span - XF);
        if (into >= 0) {
          // A share loop (env.loop) dissolves a scene into itself, so it has no seam.
          const next = env.loop ? sc : ORDER[(i + 1) % ORDER.length][0];
          const buf = scratch('dissolve');
          drawScene(buf.getContext('2d'), next, f - span, env);
          ctx.save();
          ctx.globalAlpha = smooth((into + 2) / (XF + 2));
          ctx.drawImage(buf, 0, 0);
          ctx.restore();
        }
        finish(ctx);
      },
    };
  }),
};

export default film;
