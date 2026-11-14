// The hand-drawn line. wob offsets every point along its own normal by three
// summed sines (not jitter), chaikin smooths the wobble into a pen stroke, and
// pencil lays it down as graphite: tapered, grainy, in overlapping passes.
// .inspiration principle 17: "Wobble along the normal, then Chaikin it."

import { mul32, rd } from './rng.js';
import { rgba } from './color.js';

const INK = [43, 42, 76];

/** Points spaced evenly, about `step` px apart, along a polyline. */
export function resample(pts, step) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    let d = step - carry;
    while (d <= len) {
      const t = d / len;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      d += step;
    }
    carry = len - (d - step);
  }
  const last = pts[pts.length - 1], tail = out[out.length - 1];
  if (tail[0] !== last[0] || tail[1] !== last[1]) out.push(last);
  return out;
}

/** Offset each point along its normal by three summed sines plus a sliver of noise. */
export function wob(R, pts, amp) {
  const F1 = rd(R, 0.6, 1.4), F2 = rd(R, 1.5, 3);
  const P1 = rd(R, 0, 6.283), P2 = rd(R, 0, 6.283), P3 = rd(R, 0, 6.283);
  const q = [];
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    if (i > 0) s += Math.hypot(p[0] - a[0], p[1] - a[1]);
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const t = s / 100; // wobble wavelength stays constant in pixels
    const off = amp * (0.62 * Math.sin(t * F1 * 2 + P1) + 0.28 * Math.sin(t * F2 + P2) + 0.1 * Math.sin(t * 17 + P3));
    q.push([p[0] + nx * off + rd(R, -0.3, 0.3), p[1] + ny * off + rd(R, -0.3, 0.3)]);
  }
  return q;
}

/** Chaikin corner cutting at 0.25 / 0.75. */
export function chaikin(pts, closed = false, iterations = 1) {
  let p = pts;
  for (let k = 0; k < iterations; k++) {
    const q = closed ? [] : [p[0]];
    const n = p.length;
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const a = p[i], b = p[(i + 1) % n];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      q.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) q.push(p[n - 1]);
    p = q;
  }
  return p;
}

/**
 * Draw a graphite stroke along `pts`.
 * upTo (0..1) draws only the first part of the stroke, for lines being drawn.
 * R is consumed by a fixed amount whatever upTo is, so a stroke growing does
 * not reshuffle the strokes drawn after it.
 */
export function pencil(ctx, R, pts, o = {}) {
  const {
    color = INK, width = 1.6, alpha = 0.85, amp = 1.2, passes = 2,
    upTo = 1, taper = true, grain = 0.35, step = 5, smooth = 2,
  } = o;
  const S = mul32((R() * 4294967296) >>> 0);
  if (upTo <= 0 || pts.length < 2) return;
  let path = chaikin(wob(R, resample(pts, step), amp), false, smooth);
  if (upTo < 1) path = path.slice(0, Math.max(2, Math.ceil(path.length * upTo)));
  const n = path.length;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let p = 0; p < passes; p++) {
    const ox = rd(S, -0.5, 0.5) * width * 0.4, oy = rd(S, -0.5, 0.5) * width * 0.4;
    ctx.lineWidth = width * rd(S, 0.75, 1);
    for (let i = 0; i < n - 1; i += 3) {
      const u = i / (n - 1);
      const press = taper ? Math.max(0.25, Math.min(1, u / 0.06, (1 - u) / 0.08)) : 1;
      ctx.strokeStyle = rgba(color, alpha * press * (1 - grain * S()));
      ctx.beginPath();
      ctx.moveTo(path[i][0] + ox, path[i][1] + oy);
      for (let j = i + 1; j <= Math.min(i + 3, n - 1); j++) ctx.lineTo(path[j][0] + ox, path[j][1] + oy);
      ctx.stroke();
    }
  }
}

/** A straight line as points. */
export const seg = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];

/** Points around an ellipse from angle a0 to a1 (degrees; 0 = right, 90 = down). */
export function arc(cx, cy, rx, ry, a0 = 0, a1 = 360, n = 48) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

/** A hand-drawn box: four strokes that overshoot their corners a little. */
export function box(ctx, R, x, y, w, h, o = {}) {
  const k = o.overshoot ?? 6;
  const e = () => rd(R, -k, k);
  pencil(ctx, R, seg(x + e(), y, x + w + e(), y), o);
  pencil(ctx, R, seg(x + w, y + e(), x + w, y + h + e()), o);
  pencil(ctx, R, seg(x + w + e(), y + h, x + e(), y + h), o);
  pencil(ctx, R, seg(x, y + h + e(), x, y + e()), o);
}
