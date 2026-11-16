// Paint with body. A surface is two canvases: colour, and height. Every
// stroke lays both: pigment in one, and in the other the ridges its bristles
// leave. light() then rakes a lamp across the height map, so thick paint
// catches light on one side and holds shadow on the other, the way impasto
// does on a wall. White on white is still legible, because relief draws it.
//
// Everything is seeded; a frame is a pure function of its strokes.

import { mul32, rd, fbm } from '../../lib/draw/rng.js';
import { rgba } from '../../lib/draw/color.js';
import { chaikin, resample } from '../../lib/draw/line.js';

const mk = (n) => {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  return c.getContext('2d', { willReadFrequently: true });
};
const grey = (h, a = 1) => { const v = Math.max(0, Math.min(255, h * 255)) | 0; return `rgba(${v},${v},${v},${a})`; };

export function makeSurface(size) {
  return { size, col: mk(size), hgt: mk(size) };
}

/** Run fn against both layers under the same transform / clip. */
export function both(S, fn) { fn(S.col); fn(S.hgt); }

let weaveCache = null;
/** Raw canvas: a plain weave in the height map, linen in the colour. Built once. */
export function weave(size, seed, color = [233, 224, 204]) {
  if (weaveCache?.size === size && weaveCache.seed === seed) return weaveCache;
  const col = mk(size), hgt = mk(size);
  const ci = col.createImageData(size, size), hi = hgt.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const slub = fbm(x / 90, y / 7, seed, 2) * 0.5 + fbm(x / 7, y / 90, seed + 9, 2) * 0.5;
      // over-under: warp threads show on even cells, weft on odd
      const cell = ((x >> 2) + (y >> 2)) & 1;
      const u = cell ? Math.sin(((x % 4) + 0.5) * 0.785) : Math.sin(((y % 4) + 0.5) * 0.785);
      const h = 0.1 + 0.07 * u + 0.05 * slub;
      const k = 0.93 + 0.05 * u + 0.06 * slub;
      ci.data[i] = color[0] * k; ci.data[i + 1] = color[1] * k; ci.data[i + 2] = color[2] * k; ci.data[i + 3] = 255;
      hi.data[i] = hi.data[i + 1] = hi.data[i + 2] = h * 255; hi.data[i + 3] = 255;
    }
  }
  col.putImageData(ci, 0, 0); hgt.putImageData(hi, 0, 0);
  weaveCache = { size, seed, col: col.canvas, hgt: hgt.canvas };
  return weaveCache;
}

/** Start a frame on raw canvas. */
export function ground(S, w) {
  S.col.setTransform(1, 0, 0, 1, 0, 0); S.hgt.setTransform(1, 0, 0, 1, 0, 0);
  S.col.drawImage(w.col, 0, 0); S.hgt.drawImage(w.hgt, 0, 0);
}

function offset(path, d) {
  const n = path.length, out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1;
    out[i] = [path[i][0] + (nx / l) * d, path[i][1] + (ny / l) * d];
  }
  return out;
}

function run(g, p, a, b) {
  g.beginPath();
  g.moveTo(p[a][0], p[a][1]);
  for (let i = a + 1; i <= b; i++) g.lineTo(p[i][0], p[i][1]);
  g.stroke();
}

/**
 * A brush stroke along pts: one line per bristle. Each bristle carries a
 * slightly different mix and a different load, so the stroke has furrows.
 * o.upTo (0..1) lays only the first part. o.dry breaks the bristles up toward
 * the end of the stroke; o.base is the height the paint sits on.
 */
export function stroke(S, R, pts, o = {}) {
  const { color = [240, 238, 230], width = 22, thick = 0.5, upTo = 1, dry = 0.2, vary = 0.07, base = 0.22, alpha = 1, knife = false } = o;
  const B = mul32((R() * 4294967296) >>> 0);
  if (upTo <= 0 || pts.length < 2) return;
  let path = chaikin(resample(pts, Math.max(4, width * 0.35)), false, 1);
  if (upTo < 1) path = path.slice(0, Math.max(2, Math.ceil(path.length * upTo)));
  const last = path.length - 1;
  const gap = knife ? 1.2 : 1.6;
  const n = Math.max(2, Math.round(width / gap));
  const { col, hgt } = S;
  col.lineCap = hgt.lineCap = 'round'; col.lineJoin = hgt.lineJoin = 'round';
  const rag = Math.max(1, Math.round((width * 0.5) / Math.max(4, width * 0.35))); // ragged ends, in path steps
  for (let b = 0; b < n; b++) {
    const u = n === 1 ? 0.5 : b / (n - 1);
    const p = offset(path, (u - 0.5) * width + rd(B, -0.6, 0.6));
    const tone = 1 + rd(B, -vary, vary), hue = rd(B, -vary, vary) * 0.5;
    // paint piles toward the edges of a brush; a knife leaves one raised lip
    const prof = knife ? 0.6 + 0.4 * Math.pow(u, 6) : 0.7 + 0.3 * Math.pow(Math.abs(2 * u - 1), 2.4);
    const h = base + thick * 0.55 * prof * rd(B, knife ? 0.95 : 0.8, 1);
    const tail = B() < dry * 1.5 ? rd(B, 0, dry) * last * (upTo < 1 ? 0.3 : 1) : 0; // a few bristles run dry early
    const i0 = Math.round(rd(B, 0, rag)), i1 = last - Math.round(rd(B, 0, rag) + tail);
    if (i1 - i0 < 1) continue;
    const lw = gap * rd(B, 1.6, 2.6);
    col.lineWidth = hgt.lineWidth = lw;
    col.strokeStyle = rgba([color[0] * (tone + hue), color[1] * tone, color[2] * (tone - hue)].map((v) => Math.min(255, v)), alpha);
    hgt.strokeStyle = grey(h, alpha);
    run(col, p, i0, i1); run(hgt, p, i0, i1);
  }
}

/** A dab: one loaded touch of the brush, pulled along `rot`, with a lip where it lifts off. */
export function blob(S, R, x, y, rx, ry, rot, o = {}) {
  const { color = [240, 238, 230], thick = 0.7, base = 0.25, grow = 1 } = o;
  if (grow <= 0) return;
  const { col, hgt } = S;
  rx *= grow; ry *= grow;
  if (Math.min(rx, ry) < 4.6) {
    // a touch with the tip of the brush: one bead of paint
    const tone = 1 + rd(R, -0.07, 0.07), px = rd(R, -0.35, 0.35), py = rd(R, -0.35, 0.35), top = base + thick * 0.5;
    for (const g of [col, hgt]) {
      g.save(); g.translate(x, y); g.rotate(rot); g.scale(rx, ry);
      if (g === col) g.fillStyle = rgba(color.map((q) => Math.min(255, q * tone)));
      else { const gr = g.createRadialGradient(px, py, 0, 0, 0, 1); gr.addColorStop(0, grey(top)); gr.addColorStop(0.7, grey(top * 0.9)); gr.addColorStop(1, grey(base + thick * 0.15)); g.fillStyle = gr; }
      g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill(); g.restore();
    }
    return;
  }
  const c = Math.cos(rot), s = Math.sin(rot);
  const gap = 1.5, n = Math.max(2, Math.round((ry * 2) / gap));
  col.lineCap = hgt.lineCap = 'round';
  for (let b = 0; b < n; b++) {
    const v = (b / (n - 1)) * 2 - 1, k = Math.sqrt(Math.max(0, 1 - v * v));
    const a0 = -rx * k * rd(R, 0.82, 1.05), a1 = rx * k * rd(R, 0.82, 1.05), off = v * ry;
    const tone = 1 + rd(R, -0.07, 0.07);
    const lw = gap * rd(R, 1.7, 2.6);
    const X = (t) => x + c * t - s * off, Y = (t) => y + s * t + c * off;
    col.lineWidth = hgt.lineWidth = Math.min(lw, Math.max(1.2, ry * 1.2));
    col.strokeStyle = rgba(color.map((q) => Math.min(255, q * tone)));
    col.beginPath(); col.moveTo(X(a0), Y(a0)); col.lineTo(X(a1), Y(a1)); col.stroke();
    // the body, then the lip at the far end where the brush lifts
    const h = base + thick * 0.5 * (0.72 + 0.28 * k) * rd(R, 0.85, 1);
    hgt.strokeStyle = grey(h);
    hgt.beginPath(); hgt.moveTo(X(a0), Y(a0)); hgt.lineTo(X(a1), Y(a1)); hgt.stroke();
    hgt.strokeStyle = grey(h + thick * 0.12);
    hgt.beginPath(); hgt.moveTo(X(a1 - (a1 - a0) * 0.22), Y(a1 - (a1 - a0) * 0.22)); hgt.lineTo(X(a1), Y(a1)); hgt.stroke();
  }
}

/** Fill a polygon with ordered strokes at `angle` (radians): a painted plane. */
export function plane(S, R, poly, o = {}) {
  const { angle = 0, width = 26, len = [140, 320], jitter = 0.04, colors, color = [240, 238, 230], ...rest } = o;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, D = Math.hypot(x1 - x0, y1 - y0) / 2 + width;
  const dx = Math.cos(angle), dy = Math.sin(angle);
  both(S, (g) => { g.save(); g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip(); });
  for (let d = -D; d <= D; d += width * 0.72) {
    let s = -D - rd(R, 0, len[0]);
    while (s < D) {
      const l = rd(R, len[0], len[1]), a = rd(R, -jitter, jitter), e = s + l;
      const p = (t, w) => [cx - dy * (d + w) + dx * t, cy + dx * (d + w) + dy * t];
      stroke(S, R, [p(s, 0), p((s + e) / 2, a * l * 0.25), p(e, a * l * 0.5 + rd(R, -3, 3))], { color: colors ? colors[Math.floor(R() * colors.length)] : color, width, ...rest });
      s = e - rd(R, 8, 30);
    }
  }
  both(S, (g) => g.restore());
}

/**
 * Rake the light across the height map and write the lit picture to `out`.
 * dir: where the light comes from, radians (0 = from the right, -π/2 = from
 * above). warm tints what faces the light; cool what turns away. tint grades
 * the whole frame (time of day). wet (0..1) adds the shine of fresh paint.
 */
export function light(S, out, o = {}) {
  const { dir = -2.2, gain = 1, warm = [255, 244, 222], cool = [100, 103, 132], spec = 0.18, wet = 0, soft = 0.9, tint = [1, 1, 1] } = o;
  const n = S.size, lx = Math.cos(dir), ly = Math.sin(dir);
  const img = S.col.getImageData(0, 0, n, n), d = img.data;
  S.tmp ??= mk(n);
  S.tmp.filter = 'none'; S.tmp.drawImage(S.hgt.canvas, 0, 0); // a clean base, so the blurred edge has nothing stale under it
  S.tmp.filter = `blur(${soft}px)`; S.tmp.drawImage(S.hgt.canvas, 0, 0);
  const H = S.tmp.getImageData(0, 0, n, n).data;
  const row = n * 4, k = gain / 46, sp = spec * (1 + wet * 3), [tr, tg, tb] = tint;
  for (let y = 1; y < n - 1; y++) {
    let i = (y * n + 1) * 4;
    for (let x = 1; x < n - 1; x++, i += 4) {
      const gx = H[i + 4] - H[i - 4], gy = H[i + row] - H[i - row];
      let l = -(gx * lx + gy * ly) * k; // height falling toward the light = facing it
      let r = d[i], g = d[i + 1], b = d[i + 2];
      if (l > 0) {
        if (l > 0.7) l = 0.7;
        const s = l * 0.5 + sp * l * l;
        r += (warm[0] - r) * s; g += (warm[1] - g) * s; b += (warm[2] - b) * s;
      } else if (l < 0) {
        if (l < -0.75) l = -0.75;
        const s = -l * 0.55;
        r += (r * cool[0] / 255 - r) * s; g += (g * cool[1] / 255 - g) * s; b += (b * cool[2] / 255 - b) * s;
      }
      d[i] = r * tr; d[i + 1] = g * tg; d[i + 2] = b * tb;
    }
  }
  out.putImageData(img, 0, 0);
}
