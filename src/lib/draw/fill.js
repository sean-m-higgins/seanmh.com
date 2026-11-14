// hatchFill: clip to a polygon, then stroke parallel lines at an angle, each
// jittered in spacing, alpha and width and run through the pencil. `straight`
// switches to mechanical hatching for the drawing register.

import { mul32, rd } from './rng.js';
import { rgba } from './color.js';
import { pencil } from './line.js';

export function tracePoly(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

/**
 * Soft pastel / chalk: many short directional strokes, clipped to a polygon,
 * each broken by a dash pattern so the paper tooth shows through. `colors` is
 * a list of triples, picked at random per stroke. Strokes per px² = density.
 */
export function pastelFill(ctx, R, poly, o = {}) {
  const {
    colors = [[43, 42, 76]], angle = 0.4, jitter = 0.35, len = [12, 30], width = [3, 7],
    density = 0.01, alpha = [0.25, 0.6], bend = 0.25,
  } = o;
  const S = mul32((R() * 4294967296) >>> 0);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  // Only fill what can be seen: clamp to the canvas (plus a margin).
  const W = ctx.canvas?.width ?? Infinity, Hh = ctx.canvas?.height ?? Infinity;
  x0 = Math.max(x0, -20); y0 = Math.max(y0, -20); x1 = Math.min(x1, W + 20); y1 = Math.min(y1, Hh + 20);
  if (x1 <= x0 || y1 <= y0) return;
  const n = Math.min(60000, Math.round((x1 - x0) * (y1 - y0) * density));
  ctx.save();
  tracePoly(ctx, poly);
  ctx.clip();
  ctx.lineCap = 'butt';
  for (let i = 0; i < n; i++) {
    const x = rd(S, x0 - 10, x1 + 10), y = rd(S, y0 - 10, y1 + 10);
    const a = angle + rd(S, -jitter, jitter), l = rd(S, len[0], len[1]);
    const dx = Math.cos(a) * l, dy = Math.sin(a) * l, b = rd(S, -bend, bend) * l;
    const c = colors[Math.floor(S() * colors.length)];
    ctx.setLineDash([rd(S, 3, 9), rd(S, 0.5, 2.5)]);
    ctx.lineWidth = rd(S, width[0], width[1]);
    ctx.strokeStyle = rgba(c, rd(S, alpha[0], alpha[1]));
    ctx.beginPath();
    ctx.moveTo(x - dx / 2, y - dy / 2);
    ctx.quadraticCurveTo(x - (dy / l) * b, y + (dx / l) * b, x + dx / 2, y + dy / 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * o.upTo (0..1) sweeps the hatching in, line by line, along the normal.
 * R is consumed by a fixed amount whatever upTo is.
 */
export function hatchFill(ctx, R, poly, o = {}) {
  const {
    spacing = 6, angle = 0.8, color = [43, 42, 76], alpha = 0.5,
    width = 1, amp = 0.8, straight = false, upTo = 1,
  } = o;
  const S = mul32((R() * 4294967296) >>> 0);
  if (upTo <= 0) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  // Only fill what can be seen: clamp to the canvas (plus a margin).
  const W = ctx.canvas?.width ?? Infinity, Hh = ctx.canvas?.height ?? Infinity;
  x0 = Math.max(x0, -20); y0 = Math.max(y0, -20); x1 = Math.min(x1, W + 20); y1 = Math.min(y1, Hh + 20);
  if (x1 <= x0 || y1 <= y0) return;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const D = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const nx = -dy, ny = dx;
  const lines = [];
  for (let d = -D; d <= D; d += spacing * rd(S, 0.8, 1.2)) lines.push(d);
  const count = Math.ceil(lines.length * upTo);
  ctx.save();
  tracePoly(ctx, poly);
  ctx.clip();
  for (let i = 0; i < count; i++) {
    const d = lines[i];
    const ax = cx + nx * d - dx * D, ay = cy + ny * d - dy * D;
    const bx = cx + nx * d + dx * D, by = cy + ny * d + dy * D;
    const a = alpha * rd(S, 0.6, 1);
    const w = width * rd(S, 0.7, 1.2);
    if (straight) {
      ctx.lineWidth = w;
      ctx.strokeStyle = rgba(color, a);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    } else {
      pencil(ctx, S, [[ax, ay], [bx, by]], {
        color, width: w, alpha: a, amp, passes: 1, taper: false, step: 10, smooth: 1,
      });
    }
  }
  ctx.restore();
}
