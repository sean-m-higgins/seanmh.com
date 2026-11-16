// Look C's materials, shared by every scene. A face gets an opaque base wash,
// held hatching along its grain (S, never boils), shading by which way it
// faces the light, and a boiling pencil outline (R).
// Colour is withheld until the stain (scene 10): before that, oak is raw and
// pale, and the only colour is the sunlight accent, one element per scene.

import { pencil } from '../../lib/draw/line.js';
import { hatchFill, tracePoly } from '../../lib/draw/fill.js';
import { rgba, mix } from '../../lib/draw/color.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { A } from './home.js';

export const PEN = [43, 38, 58];
export const SUN = [242, 181, 68];
export const NAVY = [31, 47, 82];
export const CREAM = [236, 228, 210];

/** Face shading: 0 = facing the light (tops), 0.45 = half shade, 0.8 = away. */
export const SHADE = { top: 0, front: 0.45, right: 0.8, left: 0.6 };

export const MAT = {
  raw: { base: [[236, 220, 190], [222, 202, 168], [198, 176, 140]], hatch: [186, 150, 104], deep: [134, 102, 68], line: 0.75 },
  stain: { base: [[116, 66, 40], [92, 52, 32], [66, 36, 24]], hatch: [70, 36, 22], deep: [40, 20, 13], line: 0.85 },
  metal: { base: [[214, 214, 218], [184, 184, 192], [148, 148, 158]], hatch: [96, 96, 110], deep: [60, 60, 74], line: 0.8 },
  dark: { base: [[104, 102, 110], [80, 78, 88], [58, 56, 66]], hatch: [40, 38, 48], deep: [24, 22, 30], line: 0.9 },
  bench: { base: [[214, 196, 168], [192, 172, 144], [164, 146, 120]], hatch: [150, 120, 88], deep: [104, 84, 62], line: 0.7 },
  paper: { base: [[246, 240, 228], [232, 226, 214], [210, 204, 196]], hatch: [170, 164, 176], deep: [130, 126, 140], line: 0.6 },
};

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
/** Grain runs along a face's longer edge. */
export const grainOf = (pts) => (len(pts[0], pts[1]) >= len(pts[1], pts[2]) ? ang(pts[0], pts[1]) : ang(pts[1], pts[2]));

export function outline(ctx, R, pts, o = {}) {
  pencil(ctx, R, [...pts, pts[0]], { width: 1.8, amp: 1, alpha: 0.8, color: PEN, step: 6, ...o });
}

/**
 * One face of a solid, in a material. shade: 0..1 (or a SHADE key).
 * o.angle overrides the grain direction; o.line: false skips the outline.
 */
export function face(ctx, R, S, pts, mat, shade = 0, o = {}) {
  const m = MAT[mat] ?? mat;
  const sh = typeof shade === 'string' ? SHADE[shade] ?? 0 : shade;
  const g = o.angle ?? grainOf(pts);
  // Blend the three base tones: lit (0) -> half shade (0.45) -> away (0.8).
  const base = sh <= 0.45 ? mix(m.base[0], m.base[1], sh / 0.45) : mix(m.base[1], m.base[2], Math.min(1, (sh - 0.45) / 0.35));
  ctx.fillStyle = rgba(base, o.baseAlpha ?? 1);
  tracePoly(ctx, pts);
  ctx.fill();
  hatchFill(ctx, S, pts, { color: m.hatch, spacing: o.spacing ?? 2.6, angle: g, alpha: o.hatchAlpha ?? 0.55, width: 1.3, amp: 0.5 });
  hatchFill(ctx, S, pts, { color: m.deep, spacing: 3.4 - sh * 1.2, angle: g + 0.06, alpha: 0.18 + sh * 0.4, width: 1.2, amp: 0.6 });
  if (sh > 0.5) hatchFill(ctx, S, pts, { color: PEN, spacing: 3.4, angle: g + 1.0, alpha: 0.28, width: 1, amp: 0.6 });
  if (o.line !== false) outline(ctx, R, pts, { alpha: m.line, ...(o.lineOpts ?? {}) });
}

/** Long wavy grain lines, for close-ups of oak: clipped to the face. */
export function woodGrain(ctx, S, pts, o = {}) {
  const { color = [150, 112, 72], alpha = 0.32, count = 22, angle = grainOf(pts), wave = 4, rays = true } = o;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, D = Math.hypot(x1 - x0, y1 - y0) / 2;
  const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
  const G = mul32((S() * 4294967296) >>> 0);
  ctx.save();
  tracePoly(ctx, pts);
  ctx.clip();
  for (let k = 0; k < count; k++) {
    const off = -D + ((k + rd(G, 0, 0.8)) / count) * 2 * D;
    const f = rd(G, 0.004, 0.012), ph = rd(G, 0, 6.28), amp = wave * rd(G, 0.5, 1.5);
    const line = [];
    for (let s = -D; s <= D; s += 14) {
      const w = amp * Math.sin(s * f + ph) + amp * 0.4 * Math.sin(s * f * 3.1 + ph * 2);
      line.push([cx + dx * s + nx * (off + w), cy + dy * s + ny * (off + w)]);
    }
    pencil(ctx, G, line, { color, alpha: alpha * rd(G, 0.5, 1), width: rd(G, 0.8, 1.6), amp: 0.5, taper: false, step: 14, smooth: 1 });
  }
  if (rays) {
    ctx.fillStyle = rgba(mix(color, [255, 255, 255], 0.5), alpha * 0.8);
    for (let i = 0; i < count * 6; i++) {
      const s = rd(G, -D, D), o2 = rd(G, -D, D), l = rd(G, 4, 12);
      const x = cx + dx * s + nx * o2, y = cy + dy * s + ny * o2;
      ctx.beginPath(); ctx.ellipse(x, y, l, 1.2, angle, 0, 6.283); ctx.fill();
    }
  }
  ctx.restore();
}

/** A soft drop shadow under a shape, so it sits on what's beneath it. */
export function dropShadow(ctx, pts, dx = 8, dy = 10, blur = 10, alpha = 0.28) {
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.fillStyle = `rgba(50,36,40,${alpha})`;
  ctx.translate(dx, dy);
  tracePoly(ctx, pts);
  ctx.fill();
  ctx.restore();
}

/**
 * The anchor: a carpenter's V with its point at A. s scales it; upTo (0..1)
 * draws it stroke by stroke: down the left arm, then up the right.
 */
export function vee(ctx, R, o = {}) {
  const { s = 1, upTo = 1, alpha = 0.9, color = PEN, width = 3.2 } = o;
  const L = [[A[0] - 20 * s, A[1] - 28 * s], [A[0], A[1]]], Rt = [[A[0], A[1]], [A[0] + 20 * s, A[1] - 28 * s]];
  const pen = { color, width, amp: 0.4, alpha, step: 2, taper: true };
  pencil(ctx, R, L, { ...pen, upTo: Math.min(1, upTo * 2) });
  pencil(ctx, R, Rt, { ...pen, upTo: Math.max(0, upTo * 2 - 1) });
}

/** Rectangle corners, optionally rotated by rot about its own centre. */
export function rect(x, y, w, h, rot = 0) {
  const cx = x + w / 2, cy = y + h / 2, c = Math.cos(rot), s = Math.sin(rot);
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([px, py]) => [cx + (px - cx) * c - (py - cy) * s, cy + (px - cx) * s + (py - cy) * c]);
}

/** Paper tooth back over flat bases: multiply the film's paper on top. */
export function tooth(ctx, paper, alpha = 0.55) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = alpha;
  ctx.drawImage(paper, 0, 0);
  ctx.restore();
}
