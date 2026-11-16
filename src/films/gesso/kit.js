// The scene kit for gesso. Look C (impasto, lit) was chosen at gate 3; the
// other two candidates survive only as stills in incoming/gesso/style-frames.
//
// A scene draws onto one paint surface through a brush (area, stroke, blob,
// line, shade), then light() rakes the lamp across it. Anything that does not
// change is painted once into a cached layer. Paint never boils, and the film
// moves on twos, so a held frame costs nothing.

import { pencil } from '../../lib/draw/line.js';
import { tracePoly } from '../../lib/draw/fill.js';
import { GLYPHS, handWidth } from '../../lib/draw/hand.js';
import { rgba } from '../../lib/draw/color.js';
import { clamp, lerp } from '../common.js';
import * as P from './paint.js';

export const SIZE = 1080;
/** The anchor: the canvas rectangle, 4:3, fixed for the whole film. */
export const A = { x: 180, y: 200, w: 720, h: 540 };
export const CX = A.x + A.w / 2, CY = A.y + A.h / 2;
export const PEN = [51, 50, 74];
export const ROOM = {
  wall: [244, 241, 234], wall2: [247, 245, 239], wall3: [241, 238, 231], carpet: [228, 228, 230], cloth: [232, 229, 222],
  pine: [230, 207, 159], pine2: [218, 190, 138], pine3: [238, 219, 176], linen: [226, 214, 190], linen2: [214, 202, 178], linen3: [234, 224, 202],
  steel: [176, 180, 190], iron: [84, 88, 104], gesso: [250, 248, 242], red: [206, 58, 48],
};
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** A local frame at (x, y) pointing along `ang`: at(u, v) is u along, v across. */
export const frameAt = (x, y, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return (u, v = 0) => [x + c * u - s * v, y + s * u + c * v]; };

let main = null;
export const surface = () => (main ??= P.makeSurface(SIZE));

export function brush(S, R, env, id = '') {
  const L = {
    S, R, env,
    /** The same surface with its own held generator, so a moving thing keeps its bristles. */
    k: (key) => brush(S, env.still(`${id}/${key}`), env, id),
    area(poly, color, o = {}) {
      P.plane(S, R, poly, { color, colors: o.colors, angle: o.angle ?? 0, width: o.width ?? 26, thick: o.thick ?? 0.32, base: o.base ?? 0.22, len: o.len ?? [140, 320], jitter: o.jitter ?? 0.04, vary: o.vary ?? 0.05, dry: o.dry ?? 0.2, knife: o.knife });
    },
    stroke(pts, color, w, o = {}) { P.stroke(S, R, pts, { color, width: w, thick: o.thick ?? 0.5, upTo: o.upTo ?? 1, base: o.base ?? 0.26, dry: o.dry ?? 0.2, knife: o.knife, vary: o.vary ?? 0.07 }); },
    blob(x, y, rx, ry, rot, color, o = {}) { P.blob(S, R, x, y, rx, ry, rot, { color, thick: o.thick ?? 0.7, base: o.base ?? 0.26, grow: o.grow ?? 1 }); },
    /** Graphite: colour only, no body. */
    line(pts, o = {}) { pencil(S.col, R, pts, { color: PEN, width: 1.5, alpha: 0.5, amp: 0.8, ...o }); },
    /** A soft cast shadow. */
    shade(poly, a = 0.2, blur = 7) {
      S.col.save(); S.col.filter = `blur(${blur}px)`;
      S.col.fillStyle = rgba([58, 60, 104], Math.min(0.8, a * 1.3)); tracePoly(S.col, poly); S.col.fill(); S.col.restore();
    },
    /** Draw under a transform (applied to colour and height alike). */
    xf(set, fn) { P.both(S, (g) => { g.save(); set(g); }); fn(); P.both(S, (g) => g.restore()); },
    clip(poly, fn) { L.xf((g) => { tracePoly(g, poly); g.clip(); }, fn); },
  };
  return L;
}

// Cached layers, kept for one scene at a time.
const layers = new Map();
let owner = null;
export function layer(env, key, build) {
  if (owner !== env.scene.id) { layers.clear(); owner = env.scene.id; }
  let s = layers.get(key);
  if (!s) { s = P.makeSurface(SIZE); build(brush(s, env.still(`${env.scene.id}/${key}`), env, `${env.scene.id}/${key}`)); layers.set(key, s); }
  return s;
}

/** The shadow a layer casts: its own shape, dark and soft, offset by (dx, dy). o as for put. */
export function cast(S, lay, dx, dy, a = 0.25, blur = 8, o = {}) {
  const [cx, cy] = o.about ?? [CX, CY], g = S.col;
  g.save();
  g.globalAlpha = a; g.filter = `brightness(0.3) blur(${blur}px)`;
  g.translate(cx + dx, cy + dy); g.scale(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1); g.translate(-cx, -cy);
  g.drawImage(lay.col.canvas, 0, 0);
  g.restore();
}

/** Lay a layer onto a surface. o: x, y, rot, s / sx / sy about o.about, alpha, clip (a polygon). */
export function put(S, lay, o = {}) {
  const [cx, cy] = o.about ?? [CX, CY];
  P.both(S, (g) => {
    g.save();
    if (o.clip) { tracePoly(g, o.clip); g.clip(); }
    g.globalAlpha = o.alpha ?? 1;
    g.translate(cx + (o.x ?? 0), cy + (o.y ?? 0)); g.rotate(o.rot ?? 0); g.scale(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1); g.translate(-cx, -cy);
    g.drawImage(g === S.col ? lay.col.canvas : lay.hgt.canvas, 0, 0);
    g.restore();
  });
}

/**
 * One day of light, k = 0 (morning) .. 1 (dusk). The lamp starts low and cool
 * from the left, climbs through the build, and ends warm and low from the right.
 */
export function day(k) {
  const dir = k < 0.75 ? lerp(-2.9, -2.2, k / 0.75) : lerp(-2.2, -0.62, (k - 0.75) / 0.25);
  const stops = [[0, [0.95, 0.98, 1.04]], [0.4, [1, 1, 1]], [0.75, [1.02, 1, 0.97]], [1, [1.03, 0.995, 0.94]]];
  let i = 0;
  while (i < stops.length - 2 && k > stops[i + 1][0]) i++;
  const u = clamp((k - stops[i][0]) / (stops[i + 1][0] - stops[i][0]));
  return { dir, tint: stops[i][1].map((v, c) => lerp(v, stops[i + 1][1][c], u)), warm: [255, lerp(246, 238, k), lerp(232, 206, k)] };
}

/** A scene: on twos, on raw canvas, lit at the end. draw returns the lamp. */
export function scene(id, dur, draw, extra = {}) {
  return {
    id, dur, ...extra,
    draw(ctx, t, _R, env) {
      const tt = Math.max(0, t - (env.frame & 1) / (env.film.fps * dur));
      const S = surface();
      P.ground(S, P.weave(SIZE, env.film.seed));
      const lamp = draw(brush(S, env.still(`${id}/live`), env, id), tt, env) ?? {};
      P.light(S, ctx, lamp);
    },
  };
}

/** Lettering with a fine brush: the hand alphabet, laid in paint. */
export function letter(L, text, x, y, size, o = {}) {
  const { upTo = 1, color = PEN, align = 'left', track = 0.22, slant = 0.12, base = 0.5 } = o;
  if (upTo <= 0) return;
  const total = handWidth(text, size, track);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const strokes = [];
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (const s of g.s) strokes.push(s.map(([gx, gy]) => [cx + gx * size - gy * size * slant, y + gy * size]));
    cx += (g.w + track) * size;
  }
  const shown = upTo * strokes.length;
  strokes.forEach((s, i) => L.stroke(s, color, Math.max(3.2, size * 0.17), { thick: 0.45, base, dry: 0, vary: 0.03, upTo: clamp(shown - i) }));
}
export const caption = (L, text, write, o = {}) => letter(L.k(`cap-${text}`), text, 80, 1046, 30, { upTo: write, ...o });

/**
 * The maker, as a shadow. A hand gripping at (x, y), the forearm running back
 * along `ang` (the direction the arm points, elbow to hand). It has no face,
 * age or size: it is whoever is watching.
 */
export function arm(L, x, y, ang, a = 0.4) {
  const at = frameAt(x + 28, y + 32, ang);
  L.shade([at(-700, -20), at(-90, -34), at(-36, -46), at(12, -50), at(50, -38), at(70, -14), at(62, 12), at(86, 22), at(88, 40), at(36, 52), at(-30, 62), at(-110, 78), at(-700, 150)], a * 0.8, 12);
}

/** An exploded sequence: item i of n lands at its own time. Returns 0 before, then 0..1 as it settles. */
export const stagger = (t, i, n, from, to, each) => clamp((t - lerp(from, to - each, n > 1 ? i / (n - 1) : 0)) / each);
