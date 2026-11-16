// The painting as it is laid. painted(env, n) returns a transparent layer
// holding the first n marks of the wildflower field, at the anchor. It grows
// incrementally from frame to frame, and rebuilds from nothing when asked for
// fewer marks than it holds, so the result depends only on n.

import { mul32 } from '../../lib/draw/rng.js';
import { clamp } from '../common.js';
import { wildflowers } from './field.js';
import { A, SIZE, brush } from './kit.js';
import * as P from './paint.js';

export const FIELD = wildflowers();
export const ALL = FIELD.length;

/** One mark, at the anchor. grow: 0..1 (a stroke's length, a dab's size; a dab may overshoot). */
export function drawMark(L, m, grow = 1, dx = 0, dy = 0) {
  const { x, y, w, h } = A, o = { base: 0.62, thick: m.thick };
  if (m.k === 'blob') { if (m.x > -2 && m.x < w + 2 && m.y > -2 && m.y < h + 2) L.blob(x + m.x + dx, y + m.y + dy, m.rx, m.ry, m.rot, m.c, { ...o, grow }); }
  else L.stroke(m.pts.map(([px, py]) => [x + clamp(px, 0, w) + dx, y + clamp(py, 0, h) + dy]), m.c, m.w, { ...o, upTo: Math.min(1, grow) });
}
export const markRng = (env, i) => mul32((env.film.seed ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0);

let acc = null, accN = 0;
export function painted(env, n) {
  acc ??= P.makeSurface(SIZE);
  if (n < accN) { P.both(acc, (g) => g.clearRect(0, 0, SIZE, SIZE)); accN = 0; }
  for (; accN < n; accN++) drawMark(brush(acc, markRng(env, accN), env), FIELD[accN]);
  return acc;
}
