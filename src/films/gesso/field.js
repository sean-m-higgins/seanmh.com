// The wildflower field: the film's finished painting, after Sean's own piece
// (reference only; nothing is traced). It is a list of marks in the order a
// painter would lay them.
//
// A mark is a stroke { pts, c, w } or a blob { x, y, rx, ry, rot, c }, in
// canvas units (720 × 540, the 4:3 of a 3 ft × 4 ft canvas). The order is
// Sean's: grass, dots, stems, sky, flowers, clouds, butterflies. `thick` is paint
// body, 0..1. `g` groups marks that belong to one flower, so a bloom can open
// as one gesture.

import { mul32, rd } from '../../lib/draw/rng.js';
import { mix } from '../../lib/draw/color.js';

export const W = 720, H = 540, HORIZON = 176;

// The paint box, from the colours of the real painting (brightened: the
// reference photo was taken in lamplight).
export const OIL = {
  blue: [44, 104, 192], deep: [28, 60, 124], yellow: [244, 196, 36], red: [214, 50, 42],
  green: [34, 100, 82], orange: [238, 134, 34], pink: [240, 126, 118], white: [249, 246, 236],
  dark: [36, 26, 30], tan: [196, 160, 110],
};
const O = OIL;

/** Where the butterflies sit in the painting: x, y, heading. */
export const FLIES = [[150, 300, 0.5], [560, 76, -0.3], [646, 316, 0.4], [146, 446, -0.5]];

/** A butterfly as marks: two orange wings edged dark, and a body. open (0..1) is how far the wings are spread. */
export function fly(x, y, a, open = 1, s = 1) {
  const out = [];
  for (const d of [-1, 1]) {
    const wa = a + d * 0.95, k = 0.25 + 0.75 * open;
    out.push({ k: 'blob', x: x + Math.cos(wa) * 12 * s * k, y: y + Math.sin(wa) * 12 * s * k, rx: 15 * s * k, ry: 10 * s, rot: wa, c: OIL.dark, thick: 0.8 });
    out.push({ k: 'blob', x: x + Math.cos(wa) * 11 * s * k, y: y + Math.sin(wa) * 11 * s * k, rx: 11 * s * k, ry: 6.5 * s, rot: wa, c: OIL.orange, thick: 0.95 });
  }
  out.push({ k: 'stroke', pts: [[x - Math.sin(a) * 9 * s, y + Math.cos(a) * 9 * s], [x + Math.sin(a) * 9 * s, y - Math.cos(a) * 9 * s]], c: OIL.dark, w: 3 * s, thick: 0.9 });
  return out;
}

/** The big blooms, where a pencil guess sits before they are painted: x, y, r. */
export const BIG = [];

export function wildflowers(seed = 1584) {
  const R = mul32(seed);
  const M = [];
  let g = 0;
  const jit = (c, k = 0.1) => mix(c, R() < 0.5 ? O.white : O.dark, R() * k);
  const stroke = (pts, c, w, thick = 0.5, part = 'flower') => M.push({ k: 'stroke', pts, c, w, thick, part, g });
  const blob = (x, y, rx, ry, rot, c, thick = 0.7, part = 'flower') => M.push({ k: 'blob', x, y, rx, ry, rot, c, thick, part, g });
  const pick = (a) => a[Math.floor(R() * a.length)];

  // Grass first: green blades pulled upward, spreading out from the very first stroke.
  stroke([[300, 432], [307, 384], [296, 322]], O.green, 9, 0.6, 'grass');
  const blades = [];
  for (let i = 0; i < 380; i++) {
    const x = rd(R, 2, W - 2), y = HORIZON + 26 + Math.pow(R(), 0.75) * (H - HORIZON - 16), l = rd(R, 26, 62), lean = rd(R, -9, 9);
    blades.push({ d: Math.hypot(x - 300, (y - 400) * 0.6) + rd(R, -40, 40), pts: [[x, y], [x + lean * 0.4, y - l * 0.5], [x + lean, Math.max(HORIZON + 2, y - l)]], c: jit(pick([O.green, O.green, O.deep, [70, 140, 110], [96, 156, 96]]), 0.18), w: rd(R, 3, 5.2) });
  }
  blades.sort((p, q) => p.d - q.d);
  blades.forEach((b_, i) => { stroke(b_.pts, b_.c, b_.w, 0.5, 'grass'); if (i % 40 === 0) g++; });
  // Hundreds of small dots, denser toward the bottom.
  const dotC = [O.red, O.blue, O.yellow, O.green, O.orange, O.pink, O.deep];
  for (let i = 0; i < 2600; i++) {
    const y = HORIZON + 2 + Math.pow(R(), 0.8) * (H - HORIZON - 2);
    blob(rd(R, 0, W), y, rd(R, 1.8, 3.6), rd(R, 2.2, 5), rd(R, -0.5, 0.5), jit(pick(dotC), 0.15), 0.55, 'dot');
    if (i % 100 === 0) g++;
  }
  // Stems with paired leaves.
  const stem = (x, y0, y1, c = O.green, n = 7) => {
    const sway = rd(R, -14, 14);
    const at = (u) => [x + sway * Math.sin(u * 2.4), y0 + (y1 - y0) * u];
    stroke([at(0), at(0.33), at(0.66), at(1)], jit(c), rd(R, 2.6, 4), 0.5, 'stem');
    for (let i = 1; i < n; i++) {
      const [px, py] = at(i / n);
      for (const s of [-1, 1]) {
        const a = -Math.PI / 2 + s * rd(R, 0.7, 1.15), l = rd(R, 9, 16);
        blob(px + Math.cos(a) * l * 0.6, py + Math.sin(a) * l * 0.6, l * 0.55, l * 0.2, a, jit(R() < 0.25 ? O.deep : c, 0.2), 0.6, 'stem');
      }
    }
  };
  for (let i = 0; i < 20; i++) {
    const x = 14 + (i + rd(R, -0.35, 0.35)) * (W - 28) / 20;
    stem(x, H + 4, rd(R, HORIZON + 30, H - 90), R() < 0.3 ? O.deep : O.green, Math.floor(rd(R, 5, 10)));
    g++;
  }
  // Then the sky: long horizontal pulls of blue, a little lighter toward the horizon.
  for (let y = -6; y < HORIZON + 6; y += 13) {
    let x = -30 + rd(R, -20, 0);
    while (x < W + 20) {
      const l = rd(R, 110, 230);
      const c = mix(jit(O.blue, 0.12), O.white, (y / HORIZON) * 0.1);
      stroke([[x, y + rd(R, -4, 4)], [x + l / 2, y + rd(R, -5, 5)], [x + l, y + rd(R, -4, 4)]], c, rd(R, 17, 24), 0.35, 'sky');
      x += l * rd(R, 0.6, 0.85);
    }
    g++;
  }

  // Flowers.
  const petals = (x, y, r, n, cs, len = 0.42, wid = 0.14, at = 0.66, a0 = rd(R, 0, 6.283)) => {
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * 6.283 + rd(R, -0.06, 0.06);
      blob(x + Math.cos(a) * r * at, y + Math.sin(a) * r * at, r * len, r * wid, a, jit(cs[i % cs.length], 0.12), 0.75);
    }
  };
  const F = {
    sunflower(x, y, r) {
      petals(x, y, r, 20, [O.yellow, mix(O.yellow, O.orange, 0.35)], 0.36, 0.11, 0.68);
      blob(x, y, r * 0.4, r * 0.4, 0, O.dark, 0.9);
      for (let i = 0; i < 7; i++) blob(x + rd(R, -1, 1) * r * 0.2, y + rd(R, -1, 1) * r * 0.2, 1.6, 1.6, 0, mix(O.dark, O.tan, 0.5), 1);
    },
    daisy(x, y, r) {
      petals(x, y, r, 13, [O.white, mix(O.white, O.blue, 0.35)], 0.4, 0.13, 0.62);
      blob(x, y, r * 0.3, r * 0.3, 0, O.orange, 0.9);
      for (let i = 0; i < 6; i++) blob(x + Math.cos(i) * r * 0.16, y + Math.sin(i) * r * 0.16, 1.5, 1.5, 0, O.dark, 1);
    },
    poppy(x, y, r) {
      petals(x, y, r, 5, [O.red, mix(O.red, O.dark, 0.12)], 0.5, 0.42, 0.42);
      blob(x, y, r * 0.2, r * 0.2, 0, R() < 0.5 ? O.pink : O.dark, 1);
    },
    mandala(x, y, r) {
      const cs = [pick([O.deep, O.red, O.blue]), O.white, pick([O.red, O.yellow, O.orange])];
      for (let j = 4; j >= 1; j--) {
        const n = 7 * j, rr = (r * j) / 4.3;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.283 + j;
          blob(x + Math.cos(a) * rr, y + Math.sin(a) * rr, r * 0.085, r * 0.07, a, jit(cs[(j + i) % 3], 0.1), 0.8);
        }
      }
      blob(x, y, r * 0.2, r * 0.2, 0, pick([O.dark, O.yellow]), 1);
    },
    rosette(x, y, r) {
      const cs = pick([[O.orange, O.red, O.yellow], [O.pink, O.red, O.white], [O.orange, O.tan, O.yellow]]);
      blob(x, y, r, r, 0, jit(cs[0]), 0.6);
      for (let j = 3; j >= 1; j--) petals(x, y, (r * j) / 3, 5 + j * 3, [cs[j % 3], cs[(j + 1) % 3]], 0.3, 0.16, 0.72, j);
      blob(x, y, r * 0.24, r * 0.24, 0, jit(cs[2]), 1);
    },
    star(x, y, r) {
      petals(x, y, r, 6, [O.pink, mix(O.pink, O.red, 0.3)], 0.5, 0.2, 0.5);
      blob(x, y, r * 0.2, r * 0.2, 0, O.orange, 1);
    },
    burst(x, y, r) {
      petals(x, y, r, 30, [O.red, mix(O.red, O.orange, 0.4)], 0.4, 0.05, 0.6);
      blob(x, y, r * 0.3, r * 0.3, 0, O.yellow, 1);
    },
    bush(x, y, r) {
      stroke([[x, y + r * 1.5], [x - 2, y + r * 0.2]], O.deep, 4, 0.5);
      for (let i = 0; i < 80; i++) {
        const a = -Math.PI / 2 + rd(R, -1.5, 1.5), d = Math.sqrt(R()) * r;
        const px = x + Math.cos(a) * d * 0.85, py = y + r * 0.3 + Math.sin(a) * d * 1.15;
        blob(px, py, rd(R, 6, 10), rd(R, 2, 3.2), a + rd(R, -0.3, 0.3), jit(pick([O.green, O.deep, O.green, O.white]), 0.15), 0.7);
      }
    },
    ball(x, y, r) {
      for (let i = 0; i < 46; i++) {
        const a = rd(R, 0, 6.283), d = Math.sqrt(R()) * r * 0.88, t = a + Math.PI / 2 + rd(R, -0.4, 0.4), l = rd(R, 9, 16);
        const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
        stroke([[px - Math.cos(t) * l, py - Math.sin(t) * l], [px + Math.cos(a) * 3, py + Math.sin(a) * 3], [px + Math.cos(t) * l, py + Math.sin(t) * l]],
          jit(pick([O.yellow, O.yellow, O.red, O.green, O.orange]), 0.1), rd(R, 5, 8), 0.8);
      }
    },
  };
  // The big ones sit where they sit in the real painting; the rest are scattered.
  const placed = [];
  const put = (kind, x, y, r) => { placed.push([x, y, r]); if (r > 25) BIG.push([x, y, r]); if (!['bush', 'ball'].includes(kind)) stem(x, y + r * 0.6, Math.min(H + 4, y + rd(R, 60, 130)), O.green, 3); F[kind](x, y, r); g++; };
  put('bush', 78, 76, 62);
  put('ball', 660, 52, 42);
  put('daisy', 172, 132, 32); put('sunflower', 244, 114, 28); put('daisy', 302, 132, 29);
  put('burst', 376, 152, 36); put('star', 236, 160, 18); put('mandala', 490, 118, 28);
  put('burst', 590, 136, 22); put('sunflower', 40, 186, 30);
  put('rosette', 524, 344, 54); put('sunflower', 310, 372, 40); put('poppy', 338, 316, 31);
  put('rosette', 108, 262, 28); put('rosette', 232, 380, 26); put('mandala', 268, 264, 34);
  put('poppy', 548, 286, 20); put('rosette', 660, 440, 30); put('sunflower', 334, 524, 34);
  const kinds = ['poppy', 'mandala', 'rosette', 'daisy', 'star', 'sunflower', 'poppy', 'burst', 'mandala'];
  for (let tries = 0; tries < 900 && placed.length < 84; tries++) {
    const r = rd(R, 10, 22), x = rd(R, 12, W - 12), y = rd(R, HORIZON + 6, H - 8);
    if (placed.some(([px, py, pr]) => Math.hypot(px - x, py - y) < (pr + r) * 0.92)) continue;
    put(pick(kinds), x, y, r);
  }
  // Clouds: white laid on thick with the knife.
  for (const [cx, cy, sx, sy] of [[272, 34, 78, 20], [96, 10, 46, 10], [684, 108, 34, 26], [470, 14, 40, 8]]) {
    for (let i = 0; i < 26; i++) {
      const a = rd(R, 0, 6.283), r = Math.sqrt(R());
      blob(cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r * sy * 0.8 + sy * 0.25 * r, rd(R, 12, 22), rd(R, 7, 12), rd(R, -0.4, 0.4), jit(O.white, 0.04), 1, 'cloud');
    }
    g++;
  }
  // Butterflies last.
  FLIES.forEach(([x, y, a], i) => { for (const m of fly(x, y, a, 1)) M.push({ ...m, part: 'fly', g, fi: i }); g++; });
  return M;
}
