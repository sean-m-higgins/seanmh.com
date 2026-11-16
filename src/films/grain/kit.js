// The coloured-pencil engine for grain.
//
// A frame is made the way a pencil drawing is: first decide the tones (P, a
// plain painting of the scene: lit faces, cast shadows, gradients), then lay
// them down as strokes. M is a stroke mask: every filled shape stamps a patch
// of pencil hatching that runs along its own form, so wood is hatched along
// its grain and a wall down its height. The painting only reaches the paper
// through those strokes, so the paper shows between them, and a second, single
// diagonal pass unifies the sheet the way a hand's habitual stroke does.
// L holds the outlines, knocked out by anything drawn in front of them.

import { mul32, rd, h2, hashStr } from '../../lib/draw/rng.js';
import { pencil, chaikin, resample } from '../../lib/draw/line.js';
import { rgba } from '../../lib/draw/color.js';
import { projectPoly, centroid, sub, add, mul, dot, cross } from './geom.js';

export const A = [540, 560];
export const PEN = [43, 38, 58];
const N = 1080;

const mk = (w = N, h = N) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export function trace(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

/** A tileable patch of pencil hatching, strokes running along x, with paper tooth bitten out. */
function strokeTexture(seed, size = 1024) {
  const c = mk(size, size), g = c.getContext('2d'), S = mul32(seed);
  g.lineCap = 'round';
  for (let i = 0; i < 15000; i++) {
    const x = rd(S, 0, size), y = rd(S, 0, size), l = rd(S, 30, 190), a = rd(S, -0.07, 0.07), b = rd(S, -0.05, 0.05) * l;
    const dx = Math.cos(a) * l, dy = Math.sin(a) * l;
    g.lineWidth = rd(S, 0.7, 1.9);
    g.strokeStyle = `rgba(0,0,0,${rd(S, 0.25, 0.85)})`;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      if (x + ox + l < -40 || x + ox - l > size + 40 || y + oy < -60 || y + oy > size + 60) continue;
      g.beginPath();
      g.moveTo(x + ox - dx / 2, y + oy - dy / 2);
      g.quadraticCurveTo(x + ox, y + oy + b, x + ox + dx / 2, y + oy + dy / 2);
      g.stroke();
    }
  }
  const img = g.getImageData(0, 0, size, size), d = img.data;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, t = h2(x, y, seed), t2 = h2(x >> 1, y >> 1, seed + 3);
    d[i + 3] = Math.max(0, Math.min(255, d[i + 3] * (0.62 + 0.55 * t) * (0.85 + 0.25 * t2) - 14 * t2));
  }
  g.putImageData(img, 0, 0);
  return c;
}

let C = null;
function cv() {
  if (C) return C;
  C = {};
  for (const k of ['P', 'M', 'L', 'T', 'S']) { C[k] = mk(); C[k.toLowerCase()] = C[k].getContext('2d'); }
  const tex = strokeTexture(1977);
  C.pat = C.m.createPattern(tex, 'repeat');
  // The unifying diagonal pass, and a second one for light pencil over dark.
  C.G = mk(); C.H = mk();
  for (const [cn, ang] of [[C.G, -52], [C.H, 38]]) {
    const g = cn.getContext('2d'), p = g.createPattern(tex, 'repeat');
    p.setTransform(new DOMMatrix().rotateSelf(ang).translateSelf(137, 61));
    g.fillStyle = p; g.fillRect(0, 0, N, N);
  }
  C.cache = { key: null };
  return C;
}

/** Start a frame: blank painting, no strokes, no lines. */
export function begin() {
  const { p, m, l } = cv();
  for (const g of [p, m, l]) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; }
  p.fillStyle = '#fff'; p.fillRect(0, 0, N, N);
  m.clearRect(0, 0, N, N);
  l.clearRect(0, 0, N, N);
}

/**
 * Start a frame from a held background. `build` draws it once (from still
 * generators only); afterwards the three layers are copied back in. Only the
 * current scene's background is kept.
 */
export function background(key, build) {
  const c = cv();
  if (c.cache.key !== key) {
    begin();
    build();
    const keep = {};
    for (const k of ['P', 'M', 'L']) { keep[k] = mk(); keep[k].getContext('2d').drawImage(c[k], 0, 0); }
    c.cache = { key, ...keep };
  }
  // Always start from the kept copy, so the first frame of a scene and every later one match exactly.
  begin();
  c.m.clearRect(0, 0, N, N);
  c.p.drawImage(c.cache.P, 0, 0); c.m.drawImage(c.cache.M, 0, 0); c.l.drawImage(c.cache.L, 0, 0);
}

/**
 * Fill a shape with a tone, hatched at `ang` (radians). `col` is a CSS colour
 * or gradient. o.press (0..1) is the pencil pressure; o.dense lays a second
 * coat for darks; o.keep leaves the lines beneath (for things lying on a surface).
 */
export function fill(pts, col, ang = 0.6, o = {}) {
  const { p, m, l, pat } = cv();
  const { press = 1, dense = false, keep = false, off = 0 } = o;
  trace(p, pts); p.fillStyle = col; p.fill();
  if (typeof col === 'string') { p.strokeStyle = col; p.lineWidth = 0.7; p.stroke(); }
  trace(m, pts);
  m.globalCompositeOperation = 'destination-out'; m.fillStyle = '#000'; m.fill();
  m.globalCompositeOperation = 'source-over';
  m.fillStyle = pat;
  m.globalAlpha = press;
  pat.setTransform(new DOMMatrix().rotateSelf((ang * 180) / Math.PI).translateSelf(off, off * 0.37));
  m.fill();
  if (dense) { pat.setTransform(new DOMMatrix().rotateSelf((ang * 180) / Math.PI + 7).translateSelf(311 + off, 97)); m.fill(); }
  m.globalAlpha = 1;
  if (!keep) { trace(l, pts); l.globalCompositeOperation = 'destination-out'; l.fillStyle = '#000'; l.fill(); l.globalCompositeOperation = 'source-over'; }
}

/** Draw on the painting only: shadows, light, stains. The strokes beneath carry it. */
export function glaze(fn) {
  const { p } = cv();
  p.save();
  fn(p);
  p.restore();
}

/** A pencil line on the line layer. */
export function line(R, pts, o = {}) {
  pencil(cv().l, R, pts, { color: PEN, width: 1.7, amp: 1, alpha: 0.78, step: 6, ...o });
}
/** Direct access to the line layer, for lettering. */
export const lines = () => cv().l;

/** A light: `dir` points toward it. sun and amb scale the surface colour; fill is a weak second light. */
export const shadeOf = (c, n, Lt) => {
  const k = Math.max(0, dot(n, Lt.dir)), k2 = Lt.fill ? Math.max(0, dot(n, Lt.fill.dir)) * Lt.fill.k : 0;
  return c.map((v, i) => Math.min(255, v * (Lt.amb[i] + Lt.sun[i] * k + k2)));
};

function grainLines(P3, f, mat, seed) {
  const { p } = cv();
  const gr = mat.grain, c = centroid(f.pts), g = f.g, w = cross(f.n, g);
  let s0 = 1e9, s1 = -1e9, w0 = 1e9, w1 = -1e9;
  for (const q of f.pts) { const d = sub(q, c), s = dot(d, g), ww = dot(d, w); s0 = Math.min(s0, s); s1 = Math.max(s1, s); w0 = Math.min(w0, ww); w1 = Math.max(w1, ww); }
  const G = mul32(seed), count = Math.max(2, Math.round((w1 - w0) * (gr.n ?? 1.5))), sc = dot(c, g);
  const segs = Math.max(6, Math.min(40, Math.round((s1 - s0) / 2.5)));
  p.save();
  p.lineCap = 'round';
  for (let k = 0; k < count; k++) {
    const wk = w0 + ((k + rd(G, 0.15, 0.85)) / count) * (w1 - w0);
    const amp = rd(G, 0.03, 0.16) * (gr.wave ?? 1), fr = rd(G, 0.12, 0.4), ph = rd(G, 0, 6.28);
    p.strokeStyle = rgba(gr.c, (gr.a ?? 0.35) * rd(G, 0.4, 1));
    p.lineWidth = rd(G, 0.7, 1.9);
    p.beginPath();
    let pen = false;
    for (let i = 0; i <= segs; i++) {
      const s = s0 + ((s1 - s0) * i) / segs;
      const sa = s + sc; // absolute along the grain, so a board cut or split in two keeps its figure
      const ww = Math.max(w0, Math.min(w1, wk + amp * Math.sin(sa * fr + ph) + amp * 0.5 * Math.sin(sa * fr * 2.7 + ph * 1.7)));
      const q = add(c, add(mul(g, s), mul(w, ww)));
      if (P3.depth(q) < 1) { pen = false; continue; }
      const [x, y] = P3(q);
      if (pen) p.lineTo(x, y); else { p.moveTo(x, y); pen = true; }
    }
    p.stroke();
  }
  p.restore();
}

function endGrain(P3, f, pts, mat, seed) {
  const { p } = cv();
  const gr = mat.grain, c = centroid(f.pts), u = sub(f.pts[1], f.pts[0]), v = sub(f.pts[3] ?? f.pts[2], f.pts[0]);
  const G = mul32(seed), cc = add(c, add(mul(u, rd(G, -1.6, 1.6)), mul(v, rd(G, 0.9, 1.8))));
  const ul = Math.hypot(...u), un = mul(u, 1 / ul), vl = Math.hypot(...v), vn = mul(v, 1 / vl);
  p.save();
  trace(p, pts); p.clip();
  for (let k = 0; k < 26; k++) {
    const r = (0.35 + k * 0.24 + rd(G, -0.04, 0.04)) * Math.max(ul, vl) * 0.5;
    p.strokeStyle = rgba(gr.c, (gr.a ?? 0.35) * rd(G, 0.5, 1.1));
    p.lineWidth = rd(G, 0.8, 1.8);
    p.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * 6.283, q = add(cc, add(mul(un, Math.cos(t) * r), mul(vn, Math.sin(t) * r * 0.86)));
      if (P3.depth(q) < 1) continue;
      const [x, y] = P3(q);
      i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
    }
    p.stroke();
  }
  p.restore();
}

/**
 * Draw a convex solid (a list of faces) in a material under a light.
 * mat: { c, grain?: { c, a, n, wave }, line?, press?, dense? }
 * o: { R: line generator (omit for no lines), key: seed string, round: soften corners, lineOpts }
 */
export function solid(P3, faces, mat, Lt, o = {}) {
  const seed0 = hashStr(o.key ?? 'solid');
  const vis = faces.map((f) => dot(f.n, sub(P3.eye, centroid(f.pts))) > 0);
  faces.forEach((f, i) => {
    if (!vis[i]) return;
    let pts = projectPoly(P3, f.pts);
    if (pts.length < 3) return;
    if (o.round) pts = chaikin(resample([...pts, pts[0]], o.round).slice(0, -1), true, 2);
    const c = centroid(f.pts);
    let ang = mat.ang ?? 0.9;
    if (f.g && mat.ang == null) { const a = P3(c), b = P3(add(c, f.g)); ang = Math.atan2(b[1] - a[1], b[0] - a[0]); }
    fill(pts, rgb(shadeOf(mat.c, f.n, Lt)), ang, { press: mat.press ?? 1, dense: mat.dense, off: (seed0 + i * 53) % 400 });
    if (mat.grain) { if (f.g) grainLines(P3, f, mat, seed0 + i * 7919); else if (!f.smooth) endGrain(P3, f, pts, mat, seed0 + i * 7919); }
    if (o.R && !f.smooth) line(o.R, [...pts, pts[0]], { alpha: mat.line ?? 0.7, ...(o.lineOpts ?? {}) });
  });
  if (o.R) faces.forEach((f, i) => {
    if (!f.smooth) return;
    const j = faces[i + 1]?.smooth ? i + 1 : faces.findIndex((x) => x.smooth);
    if (vis[i] !== vis[j]) { const e = projectPoly(P3, [f.pts[1], f.pts[2]]); if (e.length === 2) line(o.R, e, { alpha: mat.line ?? 0.7, ...(o.lineOpts ?? {}) }); }
  });
}

/**
 * Cast the shadows of `solids` along the light onto the plane y = y0, clipped
 * to the screen polygon `clip` (the surface that receives them).
 */
export function shadow(P3, solids, y0, Lt, clip, o = {}) {
  const { s, S, p } = cv();
  const { color = [86, 74, 112], alpha = 0.55, blur = 2.5 } = o;
  const d = Lt.dir;
  s.clearRect(0, 0, N, N);
  s.fillStyle = rgb(color);
  for (const faces of solids) for (const f of faces) {
    if (dot(f.n, d) <= 0) continue;
    const pr = f.pts.map((q) => (q[1] <= y0 ? [q[0], y0, q[2]] : sub(q, mul(d, (q[1] - y0) / d[1]))));
    const pts = projectPoly(P3, pr);
    if (pts.length < 3) continue;
    trace(s, pts); s.fill();
  }
  p.save();
  if (clip) { trace(p, clip); p.clip(); }
  p.globalCompositeOperation = 'multiply';
  p.globalAlpha = alpha;
  p.filter = `blur(${blur}px)`;
  p.drawImage(S, 0, 0);
  p.restore();
}

/** Lay the frame down on the paper: wash, strokes along the form, the diagonal pass, then lines. */
export function compose(ctx, paper, o = {}) {
  const { P, M, L, T, t, G } = cv();
  const { wash = 0.3, cross: cr = 0.75 } = o;
  ctx.drawImage(paper, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = wash;
  ctx.drawImage(P, 0, 0);
  t.globalCompositeOperation = 'copy'; t.drawImage(P, 0, 0);
  t.globalCompositeOperation = 'destination-in'; t.drawImage(M, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(T, 0, 0);
  // The diagonal pass: only the darks come through strongly.
  t.globalCompositeOperation = 'copy'; t.drawImage(P, 0, 0);
  t.globalCompositeOperation = 'screen'; t.fillStyle = 'rgb(84,84,84)'; t.fillRect(0, 0, N, N);
  t.globalCompositeOperation = 'destination-in'; t.drawImage(G, 0, 0);
  t.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = cr;
  ctx.drawImage(T, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(L, 0, 0);
  ctx.restore();
}

/** Light pencil over dark: draw with fn on a scratch layer, then lay it through the hatching. */
export function lightPencil(ctx, fn, alpha = 1) {
  const { T, t, H } = cv();
  t.globalCompositeOperation = 'source-over';
  t.clearRect(0, 0, N, N);
  t.save(); fn(t); t.restore();
  t.globalCompositeOperation = 'destination-in'; t.drawImage(H, 0, 0);
  t.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(T, 0, 0); ctx.restore();
}

// ---------- 2D helpers ----------

export const circle = (cx, cy, rx, ry = rx, n = 40, rot = 0) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * 6.283, x = rx * Math.cos(a), y = ry * Math.sin(a);
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** Local points -> screen: scale, rotate, then move to (x, y). */
export const place = (pts, x, y, rot = 0, sc = 1) => { const c = Math.cos(rot), s = Math.sin(rot); return pts.map(([px, py]) => [x + (px * c - py * s) * sc, y + (px * s + py * c) * sc]); };
export const FULL = [[0, 0], [N, 0], [N, N], [0, N]];

/** The anchor, flat on the sheet: a carpenter's V with its point at A. */
export function vee(g, R, o = {}) {
  const { s = 1, upTo = 1, alpha = 0.9, color = PEN, width = 3.2 } = o;
  const pen = { color, width, amp: 0.4, alpha, step: 2, taper: true };
  pencil(g, R, [[A[0] - 20 * s, A[1] - 28 * s], A], { ...pen, upTo: Math.min(1, upTo * 2) });
  pencil(g, R, [A, [A[0] + 20 * s, A[1] - 28 * s]], { ...pen, upTo: Math.max(0, upTo * 2 - 1) });
}

/** The anchor lying on a surface: its point at world `pin`, arms along -back, spread along `side`. */
export function vee3(g, R, P3, pin, o = {}) {
  const { back = [0, 0, -1], side = [1, 0, 0], s = 1, upTo = 1, alpha = 0.85, color = PEN, width = 2.8 } = o;
  const a = P3(add(pin, add(mul(side, -0.75 * s), mul(back, 1.15 * s)))), b = P3(pin), c = P3(add(pin, add(mul(side, 0.75 * s), mul(back, 1.15 * s))));
  const pen = { color, width, amp: 0.35, alpha, step: 2, taper: true };
  pencil(g, R, [a, b], { ...pen, upTo: Math.min(1, upTo * 2) });
  pencil(g, R, [b, c], { ...pen, upTo: Math.max(0, upTo * 2 - 1) });
}

/** A layer's canvas ('P' | 'M' | 'L'), for scenes that compose by hand. */
export const layer = (k) => cv()[k];
/** A generator that boils slowly: reseeded every `every` frames. */
export const slowBoil = (key, frame, every = 6) => mul32((hashStr(key) ^ Math.imul(Math.floor(frame / every) + 1, 0x9e3779b1)) >>> 0);
