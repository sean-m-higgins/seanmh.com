// Act II · the design, in the drawing register: trailers, three, advice.
// A navy sheet, a plotter of light, measurements in dot-matrix (pixel-art.mov).
// Dimensions are Sean's: 25 ft overall, a 5 x 5 ft platform, two 10 ft slopes, 1:12.

import { pencil } from '../../lib/draw/line.js';
import { scribble } from '../../lib/draw/hand.js';
import { C, GY, SIZE, dark, piece, circle, cached, scene, doll, bar } from './kit.js';
import { WIDE, SECTIONS, deckY, sheet, plot, dm, INKB } from './parts.js';
import { caption, span, easeOut, easeInOut, lerp } from '../common.js';

const ring = (x, y, r, n = 20) => { const p = circle(x, y, r, n); return [...p, p[0]]; };
const ground = (ctx, u = 1) => plot(ctx, [[60, GY], [1020, GY]], u, { gap: 9, a: 0.6, head: false });

/** Three ways of making do with an old trailer. None of them worked. */
function oldTrailer(x, v) {
  const f = 2.1, q = (a, b) => [x + a * f, GY - b * f];
  const bed = [q(-110, 74), q(95, 74), q(95, 58), q(-110, 58), q(-110, 74)];
  const out = [bed, ring(...q(-15, 30), 30 * f), [q(95, 66), q(140, 66), q(140, 40)]];
  if (v === 0) out.push([q(-110, 74), q(-185, 0)]); // a plank: far too steep
  if (v === 1) out.push([q(-100, 74), q(-100, 160), q(85, 160), q(85, 74)], [q(-100, 160), q(-190, 0)]); // built up: too tall
  if (v === 2) out.push([q(-180, 0), q(-110, 74), q(95, 110), q(95, 74)], [q(95, 110), q(140, 110)]); // tipped: nowhere to stand
  return out;
}

export const trailers = scene('trailers', 4, (ctx, s, { env }) => {
  ctx.drawImage(cached('sheet', sheet), 0, 0);
  ground(ctx);
  const R = env.still('trailers');
  // one attempt at a time, each drawn over the ghost of the last
  [0, 1, 2].forEach((i) => {
    const x = 560, t0 = 0.15 + 1.25 * i, u = span(s, t0, t0 + 0.8), gone = span(s, t0 + 1.12, t0 + 1.4);
    if (u <= 0) return;
    const a = 0.95 - 0.82 * gone;
    oldTrailer(x, i).forEach((line, j) => plot(ctx, line, easeInOut(u), { seed: i * 10 + j, scatter: 120, a, gap: 8, size: 3.2 }));
    dm(ctx, `#${i + 1}`, 110 + i * 70, 120, 5, { a: 0.85 - 0.5 * gone });
    const o = { color: C.cream, width: 9, alpha: 0.92 * (1 - 0.85 * gone), amp: 4, taper: false };
    pencil(ctx, R, [[x - 250, GY - 330], [x + 250, GY - 20]], { ...o, upTo: easeOut(span(s, t0 + 0.84, t0 + 0.98)) });
    pencil(ctx, R, [[x + 250, GY - 330], [x - 250, GY - 20]], { ...o, upTo: easeOut(span(s, t0 + 0.98, t0 + 1.12)) });
  });
});

/** Section i as plotted lines, slid dx inches. */
function plan(i, dx) {
  const { a, b } = SECTIONS[i], P = (x, y) => WIDE(x + dx, y);
  const xa = Math.max(a, 42), ws = i < 2 ? [a + 14, b - 14] : [a + 12, b - 12];
  const ps = [[5, 60, 115], [125, 180, 235], [246, 294]][i];
  return [
    [P(a, deckY(a) + 3), P(b, deckY(b) + 3), P(b, deckY(b) - 3), P(a, deckY(a) - 3), P(a, deckY(a) + 3)],
    [P(xa, 3.5), P(b, 3.5), P(b, deckY(b) - 3)],
    ...ws.map((x) => ring(...P(x, 5.5), 5.5 * WIDE.s, 12)),
    ...ps.map((x) => [P(x, deckY(x) + 3), P(x, deckY(x) + 43)]),
    [P(ps[0] - 3, deckY(ps[0]) + 37), P(ps[ps.length - 1] + 3, deckY(ps[ps.length - 1]) + 37)],
  ];
}

function drawPlan(ctx, s, env, words = true) {
  ctx.drawImage(cached('sheet', sheet), 0, 0);
  const R = env.still('three');
  // the ground line lifts into a slope
  const e = easeInOut(span(s, 0.35, 1.4));
  const prof = [[-23, 0.4], [0, 9], [240, 29], [300, 29]].map(([x, y]) => WIDE(x, y * e));
  ground(ctx);
  const drawn = span(s, 1.3, 3.4);
  plot(ctx, prof, 1, { gap: 6, size: 3, a: 0.95 * (1 - 0.75 * drawn), head: false });
  if (s > 0.3) { const w = dm(ctx, '∠ ', 96, 560, 5, { a: 0.85 }); dm(ctx, `${(4.8 * e).toFixed(1)}°`, 96 + w, 560, 5, { a: 0.85 }); }
  // three pieces, each on its own wheels
  const close = easeInOut(span(s, 3.5, 4.4));
  [0, 1, 2].forEach((i) => {
    const u = span(s, 1.3 + 0.4 * i, 2.5 + 0.4 * i);
    if (u <= 0) return;
    plan(i, i * 13 * (1 - close)).forEach((line, j) => plot(ctx, line, easeOut(u), { seed: 40 + i * 10 + j, scatter: 150, gap: 6, size: 2.8 }));
    if (u > 0.5) dm(ctx, `#${i + 1}`, WIDE((SECTIONS[i].a + SECTIONS[i].b) / 2 + i * 13 * (1 - close), 0)[0] - 22, 516 - i * 20, 4, { a: 0.75 });
  });
  // pins through matching holes
  [120, 240].forEach((x, i) => {
    const u = span(s, 4.45 + 0.18 * i, 4.75 + 0.18 * i);
    if (u <= 0) return;
    const [px, py] = WIDE(x, deckY(x) + 3);
    plot(ctx, [[px, py - 46 + 34 * easeOut(u)], [px, py + 12]], 1, { gap: 5, size: 3.4, color: [255, 250, 235], head: false });
  });
  // what it has to be
  const tick = (x, y) => plot(ctx, [[x, y - 9], [x, y + 9]], 1, { gap: 4.5, head: false, a: 0.8 });
  const dim = (x0, x1, y, label, u) => {
    if (u <= 0) return;
    const a = WIDE(x0, 0)[0], b = WIDE(x1, 0)[0];
    plot(ctx, [[a, y], [b, y]], easeOut(u), { gap: 8, a: 0.7, head: false });
    tick(a, y); if (u >= 1) tick(b, y);
    dm(ctx, label, (a + b) / 2 - label.length * 12, y + 16, 4, { u: (u - 0.4) * 2.5 });
  };
  dim(0, 120, 836, '10′', span(s, 4.6, 5.0)); dim(120, 240, 836, '10′', span(s, 4.8, 5.2)); dim(240, 300, 836, '5′×5′', span(s, 5.0, 5.4));
  dim(0, 300, 906, '25′', span(s, 5.3, 5.9));
  if (s > 4.5) { // 1:12, and the little triangle that says so
    const u = span(s, 4.5, 5.0), [tx, ty] = [470, 400];
    plot(ctx, [[tx, ty], [tx + 240, ty], [tx + 240, ty - 20], [tx, ty]], easeOut(u), { gap: 6, head: false, a: 0.85 });
    dm(ctx, '1:12', tx + 24, ty - 110, 9, { u: (u - 0.3) * 2 });
  }
  // the materials list: not for reading
  for (let i = 0; i < 6; i++) {
    const u = span(s, 1.6 + 0.4 * i, 2.1 + 0.4 * i);
    if (u <= 0) continue;
    dm(ctx, ['12', '6', '24', '3', '8', '2'][i], 96, 104 + i * 40, 3, { a: 0.6 * u });
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 150 + 210 * u, SIZE); ctx.clip();
    scribble(ctx, R, 150, 124 + i * 40, 150 + ((i * 53) % 60), 15, { color: INKB, alpha: 0.4 });
    ctx.restore();
  }
  if (words) caption(ctx, env.still('three-cap'), 'three pieces', easeInOut(span(s, 5.6, 6.5)), SIZE, { color: C.cream, y: 1000, x: 610, scale: 0.03 });
}

export const three = scene('three', 7, (ctx, s, { env }) => drawPlan(ctx, s, env));

export const advice = scene('advice', 3, (ctx, s, { env }) => {
  ctx.drawImage(cached('plan-final', (g) => drawPlan(g, 7, env, false)), 0, 0);
  const inL = easeOut(span(s, 0.1, 0.9)), inR = easeOut(span(s, 0.25, 1.05)), reach = easeInOut(span(s, 0.9, 1.4)), back = easeInOut(span(s, 1.9, 2.5));
  const c = dark(C.navy, 0.62);
  pencil(ctx, env.still('advice'), [[770, 300], [806, 346], [884, 226]], { color: C.cream, width: 8, alpha: 0.95, amp: 2, upTo: easeOut(span(s, 1.4, 1.75)), taper: false });
  doll(ctx, { hip: [lerp(-190, 70, inL), 1060], s: 2.5, dir: 1, torso: 20, head: 14, armF: [lerp(20, 84, inL), 8], armB: [10, 20], legF: [4, -3], legB: [-4, -3] }, { color: c, h: 9 });
  const j = doll(ctx, { hip: [lerp(1290, 990, inR), 900], s: 2.5, dir: -1, torso: 16, head: 10, armF: [lerp(30, 158, reach) - 70 * back, lerp(40, 6, reach)], armB: [8, 22], legF: [4, -3], legB: [-4, -3] }, { color: dark(c, 0.25), h: 9 });
  piece(ctx, bar(j.haF, [j.haF[0] - 26, j.haF[1] - 44], 7), { color: C.cedar, h: 3, rough: 0 });
});
