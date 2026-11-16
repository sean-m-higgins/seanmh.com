// Film 03 · ramp — the cut-paper kit.
// Every shape in this film is a piece of paper: cut by hand (a roughened
// edge), laid at a height (a cast shadow), with tooth (a grain pattern) and a
// lit and a dark edge. Light is the second medium: when a light is set,
// shadows fall away from it and the edges that face it catch its colour.
// Nothing boils. Like stop-motion, the film moves on twos instead.

import { mul32, rd, h2 } from '../../lib/draw/rng.js';
import { rgba, hex, mix } from '../../lib/draw/color.js';
import { pastelFill } from '../../lib/draw/fill.js';

/** The eight pens, and the one accent. */
export const C = {
  cream: hex('#efe7d6'), coal: hex('#2a2b31'), slate: hex('#4a4d57'), steel: hex('#8d9096'),
  galv: hex('#c9cdd2'), cedar: hex('#b98a5a'), grass: hex('#6f8f4e'), navy: hex('#1f2f52'),
  spark: hex('#ff7a1a'),
};
export const NIGHT = [13, 15, 26];
export const SIZE = 1080;
/** The anchor: the ground line holds this height in every scene. */
export const GY = 780;

export const dark = (c, t) => mix(c, NIGHT, t);
export const lite = (c, t) => mix(c, C.cream, t);

// ---- look and light (module state, set by each scene before it draws) ----

let LOOK = 'c';
export const setLook = (l) => { LOOK = l; };
export const look = () => LOOK;

const SUN = { on: false, dx: 0.5, dy: 0.86 };
let LIGHT = SUN;
/** A point light: shadows fall away from it, facing edges catch `color`. */
export function setLight(x, y, o = {}) {
  LIGHT = { on: true, x, y, color: o.color ?? C.spark, reach: o.reach ?? 760, power: o.power ?? 1 };
}
export const noLight = () => { LIGHT = SUN; };

// ---- small geometry ----

export const circle = (x, y, r, n = 28, ry = r) => {
  const out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; out.push([x + r * Math.cos(a), y + ry * Math.sin(a)]); }
  return out;
};
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** A strip of width w from a to b (optionally tapering to w2), with rounded ends. */
export function capsule(a, b, w, w2 = w, n = 5) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const out = [];
  for (let i = 0; i <= n; i++) { const t = ang + Math.PI / 2 + (i / n) * Math.PI; out.push([a[0] + (w / 2) * Math.cos(t), a[1] + (w / 2) * Math.sin(t)]); }
  for (let i = 0; i <= n; i++) { const t = ang - Math.PI / 2 + (i / n) * Math.PI; out.push([b[0] + (w2 / 2) * Math.cos(t), b[1] + (w2 / 2) * Math.sin(t)]); }
  return out;
}
/** A straight bar of width w from a to b, square ends. */
export function bar(a, b, w) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (-(b[1] - a[1]) / L) * (w / 2), ny = ((b[0] - a[0]) / L) * (w / 2);
  return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
}
/** A ribbon of width w along a path (a cable, a cord, a rail). */
export function strip(pts, w) {
  const L = [], Rr = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = (-(b[1] - a[1]) / l) * (w / 2), ny = ((b[0] - a[0]) / l) * (w / 2);
    L.push([pts[i][0] + nx, pts[i][1] + ny]); Rr.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  return [...L, ...Rr.reverse()];
}
export const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
export function turn(pts, cx, cy, deg) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
}
/** Chaikin-smoothed closed outline from a few control points. */
export function blob(pts, it = 2) {
  let p = pts;
  for (let k = 0; k < it; k++) {
    const q = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = q;
  }
  return p;
}

/** The scissor line: keep every corner, let the edges between them wander. */
function roughen(pts, amp, seed) {
  const R = mul32(seed);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(L / 18));
    const nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
    const ph = R() * 6.283, f = rd(R, 0.6, 1.4);
    out.push(a);
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const off = amp * (Math.sin((u * L) / 26 * f + ph) * Math.sqrt(Math.sin(Math.PI * u)) + (R() - 0.5) * 0.5);
      out.push([a[0] + (b[0] - a[0]) * u + nx * off, a[1] + (b[1] - a[1]) * u + ny * off]);
    }
  }
  return out;
}

function trace(ctx, p, dx = 0, dy = 0) {
  ctx.beginPath();
  ctx.moveTo(p[0][0] + dx, p[0][1] + dy);
  for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0] + dx, p[i][1] + dy);
  ctx.closePath();
}

// ---- paper tooth: two repeating tiles, one of dark flecks, one of light ----

const tiles = {};
const patterns = new WeakMap();
function tile(light) {
  const key = light ? 'l' : 'd';
  if (tiles[key]) return tiles[key];
  const n = 512, c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d'), im = g.createImageData(n, n), d = im.data;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = h2(x, y, light ? 3 : 7), w = h2(x >> 1, y >> 1, light ? 13 : 17);
    const i = (y * n + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = light ? 255 : 0;
    d[i + 3] = Math.max(0, v * 0.55 + w * 0.6 - 0.62) * (light ? 190 : 260);
  }
  g.putImageData(im, 0, 0);
  const R = mul32(light ? 91 : 57);
  g.lineCap = 'round';
  for (let k = 0; k < 420; k++) { // fibres, kept off the tile's edges so it repeats cleanly
    const x = rd(R, 14, n - 14), y = rd(R, 14, n - 14), a = rd(R, 0, 6.283), l = rd(R, 3, 12);
    g.strokeStyle = light ? `rgba(255,255,255,${rd(R, 0.05, 0.16)})` : `rgba(0,0,0,${rd(R, 0.06, 0.2)})`;
    g.lineWidth = rd(R, 0.5, 1);
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + 0.7) * l * 0.5, y + Math.sin(a + 0.7) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  return (tiles[key] = c);
}
function tooth(ctx) {
  let p = patterns.get(ctx);
  if (!p) patterns.set(ctx, (p = { d: ctx.createPattern(tile(false), 'repeat'), l: ctx.createPattern(tile(true), 'repeat') }));
  return p;
}

const centroid = (p) => { let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return [x / p.length, y / p.length]; };

/**
 * Lay down one piece of cut paper.
 *   color  RGB triple          h     height above the layer below, in px of shadow
 *   rough  scissor wander, px  seed  holds the cut edge still (defaults from the shape)
 *   comb   { angle, gap, wave? } scored ridges, as in the relief references
 *   glow   0..1 self-lit: ignores the darkness that follows (drawn by the caller)
 */
export function piece(ctx, pts, o = {}) {
  const { color = C.coal, h = 4, rough = 0.9, comb = null, alpha = 1, grain = 1, edge = 1 } = o;
  const [cx, cy] = centroid(pts);
  const seed = o.seed ?? (pts.length * 7919 + Math.round(Math.hypot(pts[0][0] - cx, pts[0][1] - cy) * 13));
  const p = rough > 0 ? roughen(pts, rough, seed) : pts;

  if (LOOK === 'b') return chalk(ctx, p, color, seed, o);

  let dx = SUN.dx, dy = SUN.dy, fall = 1, len = 1.15, rim = C.cream, rimA = 0.22;
  if (LIGHT.on) {
    const vx = cx - LIGHT.x, vy = cy - LIGHT.y, dist = Math.hypot(vx, vy) || 1;
    dx = vx / dist; dy = vy / dist;
    fall = Math.max(0, 1 - dist / LIGHT.reach);
    len = 1.5 + 2.2 * Math.min(1, dist / 420);
    rim = mix(LIGHT.color, C.cream, 0.35); rimA = 0.95 * fall * fall * LIGHT.power;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  if (h > 0) {
    ctx.shadowColor = rgba([5, 6, 12], LIGHT.on ? 0.62 : 0.5);
    ctx.shadowBlur = h * 1.7 + 1.5;
    ctx.shadowOffsetX = dx * h * len; ctx.shadowOffsetY = dy * h * len;
  }
  ctx.fillStyle = rgba(color);
  trace(ctx, p); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.clip();
  if (grain > 0) {
    const t = tooth(ctx), lum = (color[0] + color[1] + color[2]) / 765; // pale paper shows less fleck
    ctx.globalAlpha = alpha * grain * (0.75 - 0.5 * lum); ctx.fillStyle = t.d; ctx.fill();
    ctx.globalAlpha = alpha * grain * (0.5 - 0.2 * lum); ctx.fillStyle = t.l; ctx.fill();
  }
  if (comb) ridges(ctx, p, comb, seed, alpha);
  if (edge > 0) {
    ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * Math.min(1, rimA * edge);
    ctx.strokeStyle = rgba(rim); ctx.lineWidth = LIGHT.on ? 2.8 : 2.4;
    trace(ctx, p, dx * 1.5, dy * 1.5); ctx.stroke();
    ctx.globalAlpha = alpha * 0.4 * edge;
    ctx.strokeStyle = rgba([6, 7, 12]); ctx.lineWidth = 2.4;
    trace(ctx, p, -dx * 1.5, -dy * 1.5); ctx.stroke();
  }
  ctx.restore();
}

/** Scored ridges across a piece: a dark line with a light one beside it. */
function ridges(ctx, p, comb, seed, alpha) {
  const { angle = 0, gap = 7, wave = 0, a = 0.2, len = 26 } = comb;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  x0 = Math.max(x0, -20); y0 = Math.max(y0, -20); x1 = Math.min(x1, SIZE + 20); y1 = Math.min(y1, SIZE + 20);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, D = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  const ux = Math.cos(angle), uy = Math.sin(angle), nx = -uy, ny = ux;
  const R = mul32(seed ^ 0xc0b);
  ctx.lineCap = 'round';
  for (let d = -D; d <= D; d += gap * rd(R, 0.75, 1.25)) {
    const ph = R() * 6.283, w = wave * rd(R, 0.5, 1);
    for (const [off, col, al] of [[0, '8,9,14', a], [1.3, '255,250,235', a * 0.55]]) {
      ctx.strokeStyle = `rgba(${col},${al * rd(R, 0.5, 1)})`;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = rd(R, 0.8, 1.4);
      ctx.beginPath();
      for (let s = -D; s <= D; s += len) {
        const e = d + off + w * Math.sin(s / 70 + ph);
        const x = cx + ux * s + nx * e, y = cy + uy * s + ny * e;
        s === -D ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

/** Look B: the same shape in soft pastel instead of paper. */
function chalk(ctx, p, color, seed, o) {
  const R = mul32(seed ^ 0xca1c);
  const [cx, cy] = centroid(p);
  let dx = 0.5, dy = 0.86, fall = 0;
  if (LIGHT.on) { const vx = cx - LIGHT.x, vy = cy - LIGHT.y, d = Math.hypot(vx, vy) || 1; dx = vx / d; dy = vy / d; fall = Math.max(0, 1 - d / LIGHT.reach); }
  const h = o.h ?? 4;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  if (h > 0) { ctx.shadowColor = 'rgba(8,10,26,0.5)'; ctx.shadowBlur = h * 2.5 + 2; ctx.shadowOffsetX = dx * h * 2; ctx.shadowOffsetY = dy * h * 2; }
  ctx.fillStyle = rgba(color);
  trace(ctx, p); ctx.fill();
  ctx.restore();
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const small = Math.min(x1 - x0, y1 - y0) < 40;
  const warm = mix(color, LIGHT.on ? LIGHT.color : C.cream, 0.45 * fall * fall);
  pastelFill(ctx, R, p, {
    colors: [lite(color, 0.16), dark(color, 0.28), color, mix(color, C.navy, 0.35), warm, warm],
    angle: 0.62, jitter: 0.3, len: small ? [5, 12] : [10, 28], width: small ? [1.5, 3] : [2.5, 6],
    density: small ? 0.05 : 0.02, alpha: [0.3, 0.75],
  });
}

// ---- light ----

/** Night falls everywhere the light does not reach. Call after the scene's pieces. */
export function darkness(ctx, x, y, r, o = {}) {
  const { warm = [255, 226, 190], far = [30, 32, 52], squash = 0.8 } = o;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.translate(x, y); ctx.scale(1, squash); ctx.translate(-x, -y);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(warm)); g.addColorStop(0.16, rgba(mix(warm, far, 0.22)));
  g.addColorStop(0.42, rgba(mix(warm, far, 0.7))); g.addColorStop(1, rgba(far));
  ctx.fillStyle = g;
  ctx.fillRect(-SIZE, -SIZE, SIZE * 3, SIZE * 4);
  ctx.restore();
}

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
/** A halo of light as an ordered-dither mosaic, the way the `pixels` references hold a glow. */
export function halo(ctx, x, y, r, strength, color = C.spark, pitch = 6) {
  if (LOOK !== 'c') return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const x0 = Math.floor((x - r) / pitch), x1 = Math.ceil((x + r) / pitch);
  const y0 = Math.floor((y - r * 0.8) / pitch), y1 = Math.ceil((y + r * 0.8) / pitch);
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    const px = gx * pitch, py = gy * pitch;
    const d = Math.hypot(px - x, (py - y) / 0.8) / r;
    if (d >= 1) continue;
    const v = strength * (1 - d) * (1 - d);
    const th = (BAYER[gy & 3][gx & 3] + 0.5) / 16;
    if (v <= th * 0.9) continue;
    const k = Math.min(1, (v - th * 0.9) * 3);
    ctx.fillStyle = rgba(mix(color, [255, 236, 190], Math.min(1, v * 0.9)), 0.1 + 0.3 * k);
    const s = 1.6 + 1.6 * k;
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
  }
  ctx.restore();
}

/** A soft additive bloom. */
export function bloom(ctx, x, y, r, color, a) {
  if (LOOK === 'a') return;
  ctx.save();
  ctx.globalCompositeOperation = LOOK === 'b' ? 'source-over' : 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(0.35, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

/**
 * Welding sparks as streaks (the `stars` references: motion drawn as its own
 * trail). Each of n slots throws a spark, lets it fall and bounce, and throws
 * again. Everything is a function of k, the frame-pair index.
 *   on(k) -> 0..1  how hard the arc is burning when a spark is born
 */
export function sparks(ctx, x, y, k, o = {}) {
  const { n = 150, on = () => 1, floor = 60, aim = -0.35, spread = 1.5, seed = 1, reach = 1 } = o;
  ctx.save();
  if (LOOK === 'c') ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const S0 = mul32(seed * 977 + i * 7919);
    const period = 7 + Math.floor(S0() * 16), phase = Math.floor(S0() * period);
    const cyc = Math.floor((k + phase) / period), age = (k + phase) % period;
    const S = mul32(seed * 31 + i * 104729 + cyc * 15485863);
    const life = 3 + Math.floor(S() * (period - 3));
    const power = on(k - age);
    if (age > life || S() > power) continue;
    const ang = aim + (S() - 0.5) * spread * (S() < 0.2 ? 2.4 : 1), sp = (9 + S() * 30) * reach * (0.6 + 0.4 * power);
    const vx = Math.cos(ang) * sp * (S() < 0.5 ? 1 : -0.75), vy = Math.sin(ang) * sp - 4;
    const g = 2.3, fy = floor * (0.25 + S() * 1.3);
    const pos = (a) => {
      let px = vx * a, py = vy * a + (g * a * a) / 2;
      if (py > fy && a > 0) { // one bounce off the floor
        const th = (-vy + Math.sqrt(vy * vy + 2 * g * fy)) / g, vh = vy + g * th, b = a - th;
        px = vx * th + vx * 0.5 * b; py = fy - vh * 0.34 * b + (g * b * b) / 2;
        if (py > fy) py = fy;
      }
      return [x + px, y + py];
    };
    const u = age / life, tail = 1.15;
    const pts = [0, 1, 2, 3].map((j) => pos(Math.max(0, age - tail + (tail * j) / 3)));
    const heat = mix(mix([255, 244, 214], C.spark, Math.min(1, u * 1.7)), [150, 30, 12], Math.max(0, u - 0.55) * 1.6);
    const a = (1 - u * u) * 0.95;
    if (LOOK === 'a') { // a sliver of orange paper
      piece(ctx, bar(pts[1], pts[3], 3.2), { color: mix(C.spark, C.cream, 0.3 * (1 - u)), h: 2, rough: 0, grain: 0.4, alpha: 0.4 + 0.6 * a });
      continue;
    }
    const line = (w, col, al, from = 0) => {
      ctx.strokeStyle = rgba(col, al); ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(pts[from][0], pts[from][1]);
      for (let j = from + 1; j < 4; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.stroke();
    };
    line(LOOK === 'b' ? 4 : 5.5, heat, a * 0.16);
    line(2.1, heat, a * 0.85);
    line(1.1, [255, 248, 228], a * 0.9, 2);
  }
  ctx.restore();
}

// ---- cached backdrops ----

const cache = new Map();
/** Draw something static once and reuse it. fn(g) draws into a film-sized canvas. */
export function cached(key, fn) {
  const id = `${key}|${LOOK}`;
  let c = cache.get(id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = SIZE;
    fn(c.getContext('2d'));
    cache.set(id, c);
  }
  return c;
}

const scratches = {};
/** A reusable transparent film-sized canvas, cleared on each call. */
export function scratch(name) {
  let c = scratches[name];
  if (!c) { c = scratches[name] = document.createElement('canvas'); c.width = c.height = SIZE; }
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, SIZE, SIZE);
  return g;
}
/**
 * Daylight: throw the long shadow of a layer (a canvas of things standing on
 * the anchor) forward onto the ground in front of it.
 */
export function groundShadow(ctx, layer, o = {}) {
  const { kx = 0.5, ky = 0.42, a = 0.34, blur = 2.5 } = o;
  const g = scratch('shadow');
  g.drawImage(layer, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = 'rgb(8,9,16)'; g.fillRect(0, 0, SIZE, SIZE);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, GY + 1, SIZE, SIZE - GY); ctx.clip();
  ctx.globalAlpha = a;
  if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.setTransform(1, 0, -kx, -ky, kx * GY, GY * (1 + ky));
  ctx.drawImage(g.canvas, 0, 0);
  ctx.restore();
}
/** Draw the action on its own layer, shadow it onto the ground, then lay it down. */
export function onStage(ctx, draw, o) {
  const g = scratch('stage');
  draw(g);
  groundShadow(ctx, g.canvas, o);
  ctx.drawImage(g.canvas, 0, 0);
}

// ---- the puppet: a jointed paper figure, no face ----

const rad = (d) => (d * Math.PI) / 180;
/**
 * Angles are degrees from straight down, positive toward `dir` (1 = facing
 * right). A leg is [thigh, knee bend]; an arm is [upper, elbow bend].
 * Returns the joints, so props can be put in hands.
 */
export function doll(ctx, P, o = {}) {
  const { hip, s = 1, dir = 1, torso = 4, head = 0, armF = [10, 12], armB = [-12, 10], legF = [6, -4], legB = [-8, -4] } = P;
  const { color = C.coal, h = 2.5, hat = null, part = null } = o;
  const back = dark(color, 0.3);
  const v = (deg, len) => [dir * Math.sin(rad(deg)) * len * s, Math.cos(rad(deg)) * len * s];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sh = add(hip, [dir * Math.sin(rad(torso)) * 64 * s, -Math.cos(rad(torso)) * 64 * s]);
  const hd = add(sh, [dir * Math.sin(rad(torso + head)) * 24 * s, -Math.cos(rad(torso + head)) * 24 * s]);
  const limb = (from, [a1, a2], l1, l2) => { const mid = add(from, v(a1, l1)); return [mid, add(mid, v(a1 + a2, l2))]; };
  const [elF, haF] = limb(sh, armF, 36, 34), [elB, haB] = limb(sh, armB, 36, 34);
  const [knF, ftF] = limb(hip, legF, 46, 46), [knB, ftB] = limb(hip, legB, 46, 46);
  const pc = (pts, c, hh = h) => piece(ctx, pts, { color: c, h: hh, rough: 0, grain: 0.7, edge: 0.9 });
  const leg = (kn, ft, a, c) => {
    pc(capsule(hip, kn, 19 * s, 15 * s), c); pc(capsule(kn, ft, 14 * s, 11 * s), c);
    pc(capsule(ft, add(ft, v(a + 82, 17)), 9 * s, 7 * s), c);
  };
  const arm = (el, ha, c) => { pc(capsule(sh, el, 13 * s, 11 * s), c); pc(capsule(el, ha, 10.5 * s, 9 * s), c); pc(circle(ha[0], ha[1], 6 * s, 10), c); };
  if (part !== 'front') {
    arm(elB, haB, back);
    leg(knB, ftB, legB[0] + legB[1], back);
    pc(capsule(hip, sh, 27 * s, 31 * s), color, h + 0.5);
    pc(circle(hd[0], hd[1], 15 * s, 18, 17 * s), color, h + 0.5);
    if (hat) hat(hd, s, dir);
    leg(knF, ftF, legF[0] + legF[1], color);
  }
  if (part !== 'back') arm(elF, haF, color);
  return { hip, sh, hd, elF, haF, elB, haB, knF, ftF, knB, ftB };
}

/** A wheel: tyre, pale hub, lugs that turn. */
export function wheel(ctx, x, y, r, rot = 0, o = {}) {
  const { tyre = C.coal, hub = C.galv, h = 3 } = o;
  piece(ctx, circle(x, y, r, 26), { color: tyre, h, rough: 0, seed: 5 });
  piece(ctx, circle(x, y, r * 0.52, 18), { color: hub, h: 1.2, rough: 0, grain: 0.6 });
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2;
    piece(ctx, circle(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, Math.max(1.6, r * 0.075), 6), { color: C.slate, h: 0, rough: 0, grain: 0, edge: 0 });
  }
}

// ---- time ----

/**
 * A scene that moves on twos. draw(ctx, s, x): s is seconds into the scene,
 * held for two frames; x = { k (pair index, film-wide), R, env, dur }.
 */
export function scene(id, dur, draw, extra = {}) {
  return {
    id, dur, ...extra,
    draw(ctx, _t, R, env) {
      const fps = env.film.fps, f0 = Math.round(env.scene.start * fps);
      const k = Math.floor(env.frame / 2);
      const s = Math.max(0, k * 2 - f0) / fps;
      setLook(env.look ?? 'c');
      noLight();
      draw(ctx, s, { k, kk: Math.floor(Math.max(0, k * 2 - f0) / 2), R, env, dur });
    },
  };
}

/** Stop-motion tremor: a tiny offset that changes on twos. */
export function tremor(k, seed, amp = 0.6) {
  const R = mul32((k + 1) * 2654435761 + seed * 40503);
  return [(R() - 0.5) * 2 * amp, (R() - 0.5) * 2 * amp];
}
