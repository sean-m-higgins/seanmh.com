// Hand lettering with no font: a single-stroke lowercase alphabet drawn with
// the pencil, with a slight slant and per-letter wobble. Plus aword, the
// simulated handwriting that carries every annotation that isn't a real word
// (.inspiration principle 15: ration real words, simulate the rest).
//
// Glyph units: baseline y = 0, x-height y = -1, ascender -1.7, descender 0.7.

import { rd } from './rng.js';
import { pencil, chaikin, arc } from './line.js';

const P = (...xy) => { const o = []; for (let i = 0; i < xy.length; i += 2) o.push([xy[i], xy[i + 1]]); return o; };
const dot = (x, y) => P(x, y, x + 0.03, y + 0.02);
const bowl = (cx = 0.42) => arc(cx, -0.5, 0.42, 0.5, 0, 360, 28);

/** char -> { w: advance width, s: strokes } */
export const GLYPHS = {
  a: { w: 0.95, s: [bowl(), P(0.84, -1, 0.84, 0)] },
  b: { w: 0.9, s: [P(0, -1.7, 0, 0), bowl(0.42)] },
  c: { w: 0.85, s: [arc(0.45, -0.5, 0.45, 0.5, -40, -320, 24)] },
  d: { w: 0.95, s: [bowl(), P(0.84, -1.7, 0.84, 0)] },
  e: { w: 0.95, s: [[...P(0.05, -0.5, 0.9, -0.5), ...arc(0.45, -0.5, 0.45, 0.5, 0, -320, 24)]] },
  f: { w: 0.7, s: [[...arc(0.55, -1.4, 0.25, 0.3, -30, -180, 10), [0.3, 0]], P(0.05, -1, 0.6, -1)] },
  g: { w: 0.95, s: [bowl(), [...P(0.84, -1, 0.84, 0.35), ...arc(0.45, 0.35, 0.39, 0.32, 0, 170, 12)]] },
  h: { w: 0.85, s: [P(0, -1.7, 0, 0), [...arc(0.4, -0.55, 0.4, 0.45, 180, 360, 14), [0.8, 0]]] },
  i: { w: 0.3, s: [P(0.1, -1, 0.1, 0), dot(0.1, -1.4)] },
  j: { w: 0.45, s: [[...P(0.3, -1, 0.3, 0.4), ...arc(0.05, 0.4, 0.25, 0.3, 0, 150, 8)], dot(0.3, -1.4)] },
  k: { w: 0.8, s: [P(0, -1.7, 0, 0), P(0.7, -1, 0, -0.4, 0.75, 0)] },
  l: { w: 0.3, s: [P(0.1, -1.7, 0.1, 0)] },
  m: { w: 1.25, s: [P(0, -1, 0, 0), [...arc(0.3, -0.6, 0.3, 0.4, 180, 360, 10), [0.6, 0]], [...arc(0.9, -0.6, 0.3, 0.4, 180, 360, 10), [1.2, 0]]] },
  n: { w: 0.85, s: [P(0, -1, 0, 0), [...arc(0.38, -0.55, 0.38, 0.45, 180, 360, 14), [0.76, 0]]] },
  o: { w: 0.9, s: [arc(0.45, -0.5, 0.45, 0.5, -90, 270, 28)] },
  p: { w: 0.9, s: [P(0, -1, 0, 0.7), bowl(0.42)] },
  q: { w: 0.95, s: [bowl(), P(0.84, -1, 0.84, 0.7)] },
  r: { w: 0.6, s: [P(0, -1, 0, 0), arc(0.35, -0.55, 0.35, 0.42, 180, 300, 10)] },
  s: { w: 0.8, s: [chaikin(P(0.75, -0.88, 0.55, -1, 0.25, -1, 0.08, -0.85, 0.12, -0.62, 0.4, -0.52, 0.68, -0.4, 0.75, -0.18, 0.58, 0, 0.25, 0, 0.05, -0.12), false, 1)] },
  t: { w: 0.65, s: [P(0.3, -1.45, 0.3, -0.15, 0.38, 0, 0.6, 0), P(0.05, -1, 0.6, -1)] },
  u: { w: 0.85, s: [[...P(0, -1, 0, -0.45), ...arc(0.38, -0.45, 0.38, 0.45, 180, 0, 14)], P(0.76, -1, 0.76, 0)] },
  v: { w: 0.8, s: [P(0, -1, 0.38, 0, 0.76, -1)] },
  w: { w: 1.15, s: [P(0, -1, 0.28, 0, 0.55, -0.75, 0.82, 0, 1.1, -1)] },
  x: { w: 0.8, s: [P(0, -1, 0.75, 0), P(0.75, -1, 0, 0)] },
  y: { w: 0.8, s: [P(0, -1, 0.38, 0), P(0.76, -1, 0.3, 0.3, 0.15, 0.62, 0, 0.7)] },
  z: { w: 0.8, s: [P(0, -1, 0.75, -1, 0, 0, 0.78, 0)] },
  B: { w: 0.85, s: [P(0, -1.7, 0, 0), [[0, -1.7], ...arc(0.4, -1.3, 0.32, 0.4, -90, 90, 10), [0, -0.9]], [[0, -0.9], ...arc(0.45, -0.45, 0.37, 0.45, -90, 90, 12), [0, 0]]] },
  0: { w: 0.75, s: [arc(0.35, -0.85, 0.35, 0.85, -90, 270, 28)] },
  1: { w: 0.5, s: [P(0.1, -1.4, 0.35, -1.7, 0.35, 0)] },
  2: { w: 0.85, s: [[...arc(0.38, -1.25, 0.36, 0.42, -170, 10, 14), [0, 0], [0.78, 0]]] },
  3: { w: 0.8, s: [[...arc(0.36, -1.28, 0.34, 0.4, -160, 90, 14), ...arc(0.38, -0.45, 0.38, 0.45, -90, 160, 14)]] },
  4: { w: 0.9, s: [P(0.6, 0, 0.6, -1.7, 0, -0.5, 0.85, -0.5)] },
  5: { w: 0.8, s: [[...P(0.75, -1.7, 0.12, -1.7, 0.06, -0.95), ...arc(0.38, -0.5, 0.38, 0.5, -140, 150, 16)]] },
  6: { w: 0.8, s: [[...P(0.62, -1.65, 0.3, -1.3, 0.05, -0.55), ...arc(0.38, -0.45, 0.36, 0.45, 180, 540, 24)]] },
  7: { w: 0.8, s: [P(0, -1.7, 0.78, -1.7, 0.25, 0)] },
  8: { w: 0.8, s: [arc(0.38, -1.3, 0.3, 0.38, 90, 450, 20), arc(0.38, -0.45, 0.38, 0.45, -90, 270, 24)] },
  9: { w: 0.8, s: [arc(0.38, -1.2, 0.36, 0.45, 0, 360, 24), P(0.74, -1.2, 0.6, 0)] },
  '.': { w: 0.3, s: [dot(0.08, -0.03)] },
  ',': { w: 0.3, s: [P(0.12, -0.05, 0, 0.25)] },
  '·': { w: 0.45, s: [dot(0.15, -0.55)] },
  '-': { w: 0.6, s: [P(0.02, -0.5, 0.5, -0.5)] },
  "'": { w: 0.3, s: [P(0.12, -1.7, 0.08, -1.3)] },
  ' ': { w: 0.5, s: [] },
};

/** Width in px of `text` at x-height `size`. */
export function handWidth(text, size, track = 0.22) {
  let w = 0;
  for (const ch of text) w += ((GLYPHS[ch] ?? GLYPHS[' ']).w + track) * size;
  return Math.max(0, w - track * size);
}

/**
 * Hand-letter `text` with its baseline at (x, y) and x-height `size` px.
 * o.align: 'left' | 'center' | 'right'. o.upTo (0..1) writes it out stroke by
 * stroke. Other options pass through to pencil.
 */
export function hand(ctx, R, text, x, y, size, o = {}) {
  const { align = 'left', upTo = 1, slant = 0.12, track = 0.22, ...pen } = o;
  const total = handWidth(text, size, track);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const strokes = [];
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    const by = rd(R, -0.04, 0.04) * size, sc = rd(R, 0.96, 1.04);
    for (const s of g.s) {
      strokes.push(s.map(([gx, gy]) => [cx + gx * size * sc - gy * size * slant, y + by + gy * size * sc]));
    }
    cx += (g.w + track) * size;
  }
  const shown = upTo * strokes.length;
  strokes.forEach((s, i) => {
    pencil(ctx, R, s, {
      width: Math.max(1.2, size * 0.09), amp: size * 0.025, step: Math.max(2, size * 0.12), taper: false,
      ...pen, upTo: Math.max(0, Math.min(1, shown - i)),
    });
  });
}

/** Illegible handwriting: a wobbled zigzag that reads as annotation. Returns the end x. */
export function aword(ctx, R, x, y, h, nl, o = {}) {
  const pts = [[x, y]];
  let px = x;
  for (let i = 0; i < nl; i++) {
    px += rd(R, 0.18, 0.3) * h;
    const r = R(), k = rd(R, 0.85, 1);
    // up-strokes reach the x-height (13% an ascender); down-strokes return to the baseline (9% a descender)
    pts.push([px, i % 2 === 0 ? y - h * (r < 0.13 ? 1.7 : 1) * k : y + (r < 0.09 ? h * 0.5 : 0)]);
  }
  pencil(ctx, R, chaikin(pts, false, 1), { alpha: 0.55, width: Math.max(1, h * 0.12), amp: h * 0.04, step: 2, taper: false, ...o });
  return px;
}

/** A line of aword scribbles filling `width` px. */
export function scribble(ctx, R, x, y, width, h, o = {}) {
  let cx = x;
  while (cx < x + width - h) {
    const end = aword(ctx, R, cx, y, h, Math.floor(rd(R, 4, 11)), o);
    cx = end + h * rd(R, 0.6, 1);
  }
}
