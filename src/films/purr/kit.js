// Film 05 · purr — the illustration kit.
// The look is a warm lofi illustration: an ink line in warm dark brown, flat
// colour with one cel-shade step and one highlight step (cut as crescents from
// each shape against the scene's light), painted light, and depth from a soft
// far layer, a crisp middle and a blurred near layer. Nothing boils: the
// held art is drawn once per scene and cached, and only what lives moves.
// Plan: seanmh.com/plans/film-purr.html.

import { mul32, rd, hashStr, fbm } from '../../lib/draw/rng.js';

export const SIZE = 1080;
export const FPS = 24;
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- colour

export const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const css = (c, a = 1) => (typeof c === 'string' ? c : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
export const mix = (a, b, t) => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t);
/** A colour in the scene's shade: darker, and pulled toward a cool violet. */
export const shadeOf = (c, k = 1, cool = [70, 52, 92]) => mix(c, cool, 0.32 * k).map((v, i) => v * (1 - 0.16 * k));
export const lightOf = (c, k = 1, warm = [255, 236, 190]) => mix(c, warm, 0.38 * k);

/** The ink: a warm near-black brown, never #000. */
export const INK = [52, 34, 30];

// ---------------------------------------------------------------- time

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const span = (x, a, b) => clamp((x - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const lerp = (a, b, t) => a + (b - a) * t;
/** A slow, irregular wave in [-1, 1]: two sines with unrelated periods. */
export const drift = (s, p, ph = 0) => 0.65 * Math.sin(TAU * (s / p + ph)) + 0.35 * Math.sin(TAU * (s / (p * 0.613) + ph * 1.7));
/** 0 → 1 → 0 over [a, b], eased: a held gesture (a blink, a turn). */
export function gesture(s, a, b, rise = 0.25) {
  if (s <= a || s >= b) return 0;
  const r = Math.min(rise, (b - a) / 2);
  return smooth(Math.min(span(s, a, a + r), 1 - span(s, b - r, b)));
}
/** A blink at each time in `at`: the lid shuts and opens in ~0.3 s. */
export function blink(s, at, d = 0.32) {
  let b = 0;
  for (const t of at) b = Math.max(b, gesture(s, t, t + d, d / 2));
  return b;
}

// ---------------------------------------------------------------- paths

const P2 = new Map();
/** A Path2D from SVG path data, cached. */
export function P(d) {
  let p = P2.get(d);
  if (!p) P2.set(d, (p = new Path2D(d)));
  return p;
}
/** A path moved by (x, y), rotated by a (radians) and scaled. */
export function moved(path, x = 0, y = 0, a = 0, sx = 1, sy = sx) {
  const q = new Path2D();
  q.addPath(path, new DOMMatrix().translateSelf(x, y).rotateSelf((a * 180) / Math.PI).scaleSelf(sx, sy));
  return q;
}
export function ellipse(x, y, rx, ry, a = 0) {
  const p = new Path2D();
  p.ellipse(x, y, Math.abs(rx), Math.abs(ry), a, 0, TAU);
  return p;
}
/** A closed smooth path through points (Catmull-Rom → Bézier). */
export function blob(pts, closed = true, tension = 1) {
  const p = new Path2D();
  const n = pts.length;
  const at = (i) => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const k = tension / 6;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
      p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  if (closed) p.closePath();
  return p;
}
export function poly(pts, closed = true) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (closed) p.closePath();
  return p;
}
export function rect(x, y, w, h) {
  const p = new Path2D();
  p.rect(x, y, w, h);
  return p;
}
export function rrect(x, y, w, h, r) {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}

// ---------------------------------------------------------------- the light

/**
 * The scene's key light, as a direction in screen space pointing toward the
 * light, and the colours it lends. Set by each scene before it draws.
 */
export const LIGHT = { x: -0.6, y: -0.8, warm: [255, 226, 170], cool: [70, 52, 92], k: 1 };
export function setLight(o) { Object.assign(LIGHT, o); }

const BIG = (() => { const p = new Path2D(); p.rect(-8000, -8000, 16000, 16000); return p; })();
function outside(path, dx, dy) {
  const q = new Path2D(BIG);
  q.addPath(path, new DOMMatrix().translateSelf(dx, dy));
  return q;
}

/**
 * Fill a shape in flat colour, then cut a cel-shade crescent on the side away
 * from the light and a highlight crescent on the side facing it.
 * o.sd / o.hd are the crescent depths in px (local units); o.fill may be a
 * gradient. Returns nothing; draws in the current transform.
 */
export function cel(ctx, path, base, o = {}) {
  const { sd = 14, hd = 0, shade, hi, lx = LIGHT.x, ly = LIGHT.y, alpha = 1, shadeAlpha = 1 } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = css(base);
  ctx.fill(path);
  if (sd > 0 || hd > 0 || o.inner) {
    ctx.clip(path);
    if (sd > 0) {
      ctx.globalAlpha *= shadeAlpha;
      ctx.fillStyle = css(shade ?? shadeOf(base, LIGHT.k, LIGHT.cool));
      ctx.fill(outside(path, lx * sd, ly * sd), 'evenodd');
      ctx.globalAlpha /= shadeAlpha;
    }
    if (hd > 0) {
      ctx.fillStyle = css(hi ?? lightOf(base, LIGHT.k, LIGHT.warm));
      ctx.fill(outside(path, -lx * hd, -ly * hd), 'evenodd');
    }
    if (o.inner) o.inner(ctx);
  }
  ctx.restore();
}

/** Stroke a path in ink. */
export function ink(ctx, path, w = 2.4, c = INK, a = 1) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = w;
  ctx.strokeStyle = css(c, a);
  ctx.stroke(path);
  ctx.restore();
}

/** Fill then outline: the default way a shape is put down. */
export function shape(ctx, path, base, o = {}) {
  cel(ctx, path, base, o);
  if (o.line !== false) ink(ctx, path, o.lw ?? 2.4, o.lc ?? INK, o.la ?? 1);
}

/** A thick stroke with an ink outline: tails, legs, stems, cords. */
export function tube(ctx, path, w, base, o = {}) {
  const { lw = 2.4, lc = INK, shade } = o;
  ctx.save();
  ctx.lineCap = o.cap ?? 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = css(lc);
  ctx.lineWidth = w + lw * 2;
  ctx.stroke(path);
  ctx.strokeStyle = css(base);
  ctx.lineWidth = w;
  ctx.stroke(path);
  if (shade) {
    // A shade along one edge: the same stroke, thinner, pushed away from the light.
    ctx.translate(LIGHT.x * w * 0.3, LIGHT.y * w * 0.3);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = css(shade);
    ctx.lineWidth = w * 0.45;
    ctx.translate(-LIGHT.x * w * 0.62, -LIGHT.y * w * 0.62);
    ctx.stroke(path);
  }
  ctx.restore();
}

/** A soft glow (lamp, sun bloom), added with 'screen'. */
export function glow(ctx, x, y, r, c, a = 0.5, op = 'screen') {
  ctx.save();
  ctx.globalCompositeOperation = op;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, css(c, a));
  g.addColorStop(0.35, css(c, a * 0.45));
  g.addColorStop(1, css(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

export function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([t, c, a = 1]) => g.addColorStop(t, css(c, a)));
  return g;
}
export function lgrad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([t, c, a = 1]) => g.addColorStop(t, css(c, a)));
  return g;
}

// ---------------------------------------------------------------- held layers

const LAYERS = new Map();
/**
 * A canvas drawn once and kept: the held art of a scene. The builder must be
 * a pure function of the key, so the first frame and every later one agree.
 * It runs with the light as the scene set it, and leaves the light alone.
 */
export function held(key, build, w = SIZE, h = SIZE) {
  let c = LAYERS.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const saved = { ...LIGHT };
    build(c.getContext('2d'), mul32(hashStr(key)));
    Object.assign(LIGHT, saved);
    LAYERS.set(key, c);
  }
  return c;
}
/** A spare full-frame canvas for compositing (dissolves, blur passes). */
export function scratch(key) {
  let c = LAYERS.get(`~${key}`);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = SIZE;
    LAYERS.set(`~${key}`, c);
  }
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.clearRect(0, 0, SIZE, SIZE);
  return c;
}

/** Draw `fn` into a held layer through a blur: the far, out-of-focus plane. */
export function soft(key, px, build) {
  return held(key, (g, R) => {
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = SIZE;
    build(tmp.getContext('2d'), R);
    // The sharp copy goes under the blurred one: a blur fades to nothing at
    // the canvas edge, which would leave a pale fringe round the frame.
    g.drawImage(tmp, 0, 0);
    g.filter = `blur(${px}px)`;
    g.drawImage(tmp, 0, 0);
    g.filter = 'none';
  });
}

/** The paper grain laid over every frame, held. */
export function grain() {
  return held('purr:grain', (g) => {
    const img = g.createImageData(SIZE, SIZE);
    const R = mul32(77);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const x = i % SIZE, y = (i / SIZE) | 0;
      const v = 128 + (R() - 0.5) * 46 + (fbm(x / 90, y / 90, 3, 3) - 0.5) * 40;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
export function finish(ctx, o = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = o.grain ?? 0.1;
  ctx.drawImage(grain(), 0, 0);
  ctx.restore();
  // A faint vignette that holds the eye in the frame.
  ctx.save();
  const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.42, SIZE / 2, SIZE / 2, SIZE * 0.78);
  g.addColorStop(0, 'rgba(30,20,30,0)');
  g.addColorStop(1, css(o.vig ?? [40, 24, 34], o.va ?? 0.28));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.restore();
}

// ---------------------------------------------------------------- foliage

/** A leaf along +x from the origin: length L, half-width W. */
export function leafPath(L, W, tip = 0) {
  const k = `${L},${W},${tip}`; // exact: a truncated key would let the first leaf drawn decide the shape of the rest
  let p = P2.get(`leaf:${k}`);
  if (!p) {
    p = new Path2D(`M0 0 C${L * 0.28} ${-W * 1.15} ${L * 0.72} ${-W * 0.95} ${L} ${tip} C${L * 0.72} ${W * 0.95} ${L * 0.28} ${W * 1.15} 0 0 Z`);
    P2.set(`leaf:${k}`, p);
  }
  return p;
}

/**
 * One leaf: two-tone along the midrib (the half away from the light is the
 * shade), an ink edge, and an optional sun fleck.
 */
export function leaf(ctx, x, y, a, L, W, col, o = {}) {
  const p = leafPath(L, W, o.tip ?? 0);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = css(col);
  ctx.fill(p);
  ctx.save();
  ctx.clip(p);
  // Which half faces the light depends on the leaf's angle.
  const up = Math.sin(a) * LIGHT.x - Math.cos(a) * LIGHT.y; // light's component along the leaf's -y
  ctx.fillStyle = css(o.shade ?? shadeOf(col, 0.9, LIGHT.cool));
  ctx.fillRect(0, up > 0 ? 0 : -W * 2, L, W * 2);
  if (o.lit) {
    ctx.fillStyle = css(o.litc ?? lightOf(col, 1.2, LIGHT.warm), o.lit);
    ctx.fill(moved(p, L * 0.08, (up > 0 ? -1 : 1) * W * 0.35, 0, 0.8, 0.55));
  }
  ctx.restore();
  ctx.lineCap = 'round';
  ctx.strokeStyle = css(o.vein ?? shadeOf(col, 1.3, LIGHT.cool), 0.7);
  ctx.lineWidth = Math.max(0.8, W * 0.08);
  ctx.beginPath();
  ctx.moveTo(L * 0.06, 0);
  ctx.quadraticCurveTo(L * 0.5, (up > 0 ? 1 : -1) * W * 0.05, L * 0.9, 0);
  ctx.stroke();
  if (o.line !== false) ink(ctx, p, o.lw ?? 1.6, o.lc ?? INK, o.la ?? 0.9);
  ctx.restore();
}

/**
 * A potted bush: leaves on short stems around a dome. Returns nothing.
 * s (seconds) and sway (radians) move the leaves; pass sway 0 for held art.
 */
export function bush(ctx, R, cx, cy, rx, ry, o = {}) {
  const { n = 60, L = 46, W = 17, cols, s = 0, sway = 0, lit = 0, lw = 1.5 } = o;
  const greens = cols ?? [hex('#6f9a3e'), hex('#86ad48'), hex('#5c8a3a'), hex('#9cbc52')];
  const deep = shadeOf(greens[2], 1.6, LIGHT.cool);
  // the shaded core: depth behind the leaves
  ctx.fillStyle = css(deep);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.1 + 0.8 * (i / 8));
    ctx.fill(ellipse(cx + Math.cos(a) * rx * 0.4, cy + Math.sin(a) * ry * 0.4 + ry * 0.3, rx * 0.36, ry * 0.32));
  }
  const bx = cx, by = cy + ry * 0.85; // where the stems come from
  const leaves = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (0.02 + 0.96 * R());
    const r = Math.pow(R(), 0.45);
    const x = cx + Math.cos(a) * rx * r, y = cy + ry * 0.35 + Math.sin(a) * ry * r * 1.1;
    const out = Math.atan2(y - by, x - bx) + rd(R, -0.45, 0.45);
    const depth = 1 - r; // inner leaves sit further back
    const c = mix(greens[(R() * greens.length) | 0], deep, depth * 0.45);
    leaves.push({ x, y, a: out, L: L * rd(R, 0.75, 1.15), W: W * rd(R, 0.85, 1.15), c, ph: R(), r, lit: R() < lit * (0.4 + r) && (x - cx) * LIGHT.x + (y - cy) * LIGHT.y > -rx * 0.1 });
  }
  leaves.sort((p, q) => p.r - q.r || p.y - q.y);
  for (const lf of leaves) {
    const sw = sway * Math.sin(TAU * (s / 3.75 + lf.ph)) * lf.r;
    leaf(ctx, lf.x, lf.y, lf.a + sw, lf.L, lf.W, lf.c, { lit: lf.lit ? 0.85 : 0, lw });
  }
}

/** A trailing vine: a curve with leaves alternating along it. */
export function vine(ctx, R, pts, o = {}) {
  const { L = 34, W = 15, col = hex('#77a345'), s = 0, sway = 0, every = 26, lit = 0.3, heart = false } = o;
  const path = blob(pts, false);
  ink(ctx, path, 3.4, INK, 0.9);
  ink(ctx, path, 1.8, shadeOf(col, 1.2));
  // walk the polyline
  let acc = 0, side = 1;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    for (let t = (every - acc) / d; t < 1; t += every / d) {
      const x = lerp(x0, x1, t), y = lerp(y0, y1, t);
      const sw = sway * Math.sin(TAU * (s / 3.75) + x * 0.02 + y * 0.013);
      leaf(ctx, x, y, a + side * (0.9 + rd(R, -0.3, 0.3)) + sw, L * rd(R, 0.75, 1.1), W * rd(R, 0.85, 1.1), mix(col, hex('#a3c45a'), R() * 0.5), { lit: R() < lit ? 0.8 : 0, tip: heart ? 0 : 0 });
      side = -side;
    }
    acc = (acc + d) % every;
  }
}

/** A lavender spike: a stem with tiny purple buds toward the top. */
export function lavender(ctx, R, x, y, h, a, o = {}) {
  const { col = hex('#8d8fd6'), s = 0, sway = 0 } = o;
  const sw = sway * Math.sin(TAU * s / 3.75 + x * 0.05);
  const tx = x + Math.sin(a + sw) * h, ty = y - Math.cos(a + sw) * h;
  const mx = x + Math.sin(a + sw * 0.4) * h * 0.5, my = y - Math.cos(a) * h * 0.5;
  const stem = new Path2D();
  stem.moveTo(x, y);
  stem.quadraticCurveTo(mx, my, tx, ty);
  ink(ctx, stem, 2.6, INK, 0.8);
  ink(ctx, stem, 1.3, hex('#6c8a4a'));
  for (let i = 0; i < 16; i++) {
    const t = 0.55 + 0.45 * (i / 15);
    const bx = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * tx;
    const by = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * my + t * t * ty;
    const side = i % 2 ? 1 : -1;
    const r = 4.4 * (1.15 - 0.5 * (i / 15));
    const c = mix(col, i % 3 ? hex('#c7c3ef') : hex('#5b5aa8'), 0.35);
    const b = ellipse(bx + side * r * 0.8, by, r, r * 1.3);
    ctx.fillStyle = css(c);
    ctx.fill(b);
    ink(ctx, b, 1.1, INK, 0.75);
  }
}

// ---------------------------------------------------------------- light on things

/**
 * A patch of sun: a polygon of light, with leaf shadows cut through it, laid
 * on with 'soft-light' then 'screen' so it warms what is under it. Held.
 */
export function sunPatch(ctx, R, pts, o = {}) {
  const { c = [255, 214, 140], a = 0.55, leaves = 0, blur = 2.5, bars = [] } = o;
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = SIZE;
  const g = tmp.getContext('2d');
  g.fillStyle = css(c);
  g.fill(poly(pts));
  g.globalCompositeOperation = 'destination-out';
  for (const b of bars) g.fill(poly(b));
  for (let i = 0; i < leaves; i++) {
    const [x, y] = pts[(R() * pts.length) | 0];
    const cx = lerp(x, pts.reduce((m, p) => m + p[0], 0) / pts.length, R());
    const cy = lerp(y, pts.reduce((m, p) => m + p[1], 0) / pts.length, R());
    g.save();
    g.translate(cx, cy);
    g.rotate(R() * TAU);
    g.fill(leafPath(30 + R() * 40, 10 + R() * 10));
    g.restore();
  }
  ctx.save();
  ctx.filter = `blur(${blur}px)`;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = a;
  ctx.drawImage(tmp, 0, 0);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = a * 0.6;
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

/** Short fur strokes along a curve, for texture inside a shape. */
export function furMarks(ctx, R, cx, cy, rx, ry, n, c, o = {}) {
  const { len = 10, w = 1.4, a = 0.55, dir = 1.2 } = o;
  ctx.save();
  ctx.strokeStyle = css(c, a);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = R() * TAU, r = Math.sqrt(R());
    const x = cx + Math.cos(ang) * rx * r, y = cy + Math.sin(ang) * ry * r;
    const d = dir + rd(R, -0.3, 0.3), l = len * rd(R, 0.6, 1.2);
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(d) * l * 0.5 + 2, y + Math.sin(d) * l * 0.5, x + Math.cos(d) * l, y + Math.sin(d) * l);
  }
  ctx.stroke();
  ctx.restore();
}

/** Steam from a cup: three soft ribbons rising and fading, from time s. */
export function steam(ctx, x, y, s, o = {}) {
  const { h = 120, w = 18, a = 0.5, c = [255, 250, 240] } = o;
  ctx.save();
  ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const ph = s / 2.5 + k / 3;
    const life = ph - Math.floor(ph); // 0..1 through one rise
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const yy = y - u * h * (0.55 + life * 0.6) - life * 20;
      const xx = x + (k - 1) * 7 + Math.sin(u * 5 + s * 1.9 + k * 2.1) * w * u + Math.sin(s * 0.7 + k) * 4;
      pts.push([xx, yy]);
    }
    const fade = Math.sin(Math.PI * life);
    const g = ctx.createLinearGradient(0, y, 0, y - h * 1.2);
    g.addColorStop(0, css(c, 0));
    g.addColorStop(0.25, css(c, a * fade));
    g.addColorStop(1, css(c, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = 5 - k;
    ctx.stroke(blob(pts, false));
  }
  ctx.restore();
}

/** Motes drifting in a beam: tiny bright specks on a slow loop of their own. */
export function motes(ctx, R0, n, area, s, o = {}) {
  const { c = [255, 240, 200], a = 0.8, r = 1.8 } = o;
  const R = mul32(R0);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const x0 = R(), y0 = R(), sp = 0.4 + R() * 0.6, ph = R();
    const u = (x0 + 0.012 * s * sp + 0.03 * Math.sin(TAU * (s / 7 + ph))) % 1;
    const v = (y0 + 0.008 * s * sp + 0.02 * Math.sin(TAU * (s / 5 + ph))) % 1;
    const x = area[0] + u * area[2], y = area[1] + v * area[3];
    if (o.inside && !o.inside(x, y)) continue;
    const tw = 0.5 + 0.5 * Math.sin(TAU * (s / 2.1 + ph));
    ctx.fillStyle = css(c, a * tw);
    ctx.beginPath();
    ctx.arc(x, y, r * (0.6 + R() * 0.8), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export { mul32, rd, hashStr, fbm };

/**
 * The scene's grade: a warm wash spreading from the light (soft-light) and a
 * cool, slightly darker fall-off away from it (multiply). Held per key.
 */
export function grade(ctx, key, o) {
  const { x, y, r = 900, warm = [255, 200, 130], wa = 0.45, cool = [120, 100, 150], ca = 0.25 } = o;
  const wash = held(`grade:${key}`, (g) => {
    const w = g.createRadialGradient(x, y, 0, x, y, r);
    w.addColorStop(0, css(warm, wa));
    w.addColorStop(1, css(warm, 0));
    g.fillStyle = w;
    g.fillRect(0, 0, SIZE, SIZE);
  });
  const al = o.alpha ?? 1; // a grade can be faded (a lamp going out)
  if (al <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = al;
  ctx.drawImage(wash, 0, 0);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = (o.screen ?? 0.12) * al;
  ctx.drawImage(wash, 0, 0);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = al;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(held(`grade:${key}:c`, (g) => {
    const c = g.createRadialGradient(x, y, r * 0.5, x, y, r * 1.5);
    c.addColorStop(0, css([255, 255, 255], 0));
    c.addColorStop(1, css(cool, ca));
    g.fillStyle = c;
    g.fillRect(0, 0, SIZE, SIZE);
  }), 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------- set pieces

/** A shadow laid on with 'multiply': hard-edged by default, soft with o.blur. */
export function shadow(ctx, path, c = [120, 92, 120], a = 0.5, blur = 0) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.fillStyle = css(c, a);
  ctx.fill(path);
  ctx.restore();
}

/** Light laid on with 'soft-light' then a little 'screen': a lit shape. */
export function lit(ctx, path, c = [255, 214, 140], a = 0.5, blur = 0) {
  ctx.save();
  if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = css(c, a);
  ctx.fill(path);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = css(c, a * 0.35);
  ctx.fill(path);
  ctx.restore();
}

/** Wood grain inside a path: long wavering lines along `dir` ('h' | 'v'). */
export function woodGrain(g, R, path, x, y, w, h, o = {}) {
  const { c = [120, 70, 40], a = 0.3, gap = 6, dir = 'h', lw = 1.2 } = o;
  g.save();
  g.clip(path);
  g.strokeStyle = css(c, a);
  g.lineWidth = lw;
  const n = Math.ceil((dir === 'h' ? h : w) / gap);
  for (let k = 0; k < n; k++) {
    g.beginPath();
    if (dir === 'h') {
      const yy = y + 3 + k * gap + rd(R, -1, 1);
      g.moveTo(x, yy);
      g.bezierCurveTo(x + w * 0.3, yy + rd(R, -3, 3), x + w * 0.7, yy + rd(R, -3, 3), x + w, yy + rd(R, -1, 1));
    } else {
      const xx = x + 3 + k * gap + rd(R, -1, 1);
      g.moveTo(xx, y);
      g.bezierCurveTo(xx + rd(R, -3, 3), y + h * 0.3, xx + rd(R, -3, 3), y + h * 0.7, xx + rd(R, -1, 1), y + h);
    }
    g.stroke();
  }
  g.restore();
}

/**
 * A plank floor seen from above and in front: boards run toward a vanishing
 * point (vx, vy) above the floor's far edge at y0; the near edge is y1.
 */
export function planks(g, R, y0, y1, o = {}) {
  const { vx = SIZE / 2, vy = y0 - 500, n = 12, base = [176, 118, 70], x0 = 0, x1 = SIZE, joints = 0.5, la = 0.4 } = o;
  g.save();
  g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const at = (u, y) => vx + ((x0 + u * (x1 - x0) - vx) * (y - vy)) / (y1 - vy);
  for (let i = -n; i < n * 2; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    const c = mix(base, R() < 0.5 ? [255, 226, 180] : [90, 50, 40], R() * 0.12);
    g.fillStyle = css(c);
    g.fill(poly([[at(u0, y0), y0], [at(u1, y0), y0], [at(u1, y1), y1], [at(u0, y1), y1]]));
    // end joints: a board is several lengths end to end
    g.strokeStyle = css(shadeOf(base, 1.6), la);
    g.lineWidth = 1.6;
    let y = y0 + R() * (y1 - y0) * 0.5;
    while (y < y1 && joints > 0) {
      g.beginPath(); g.moveTo(at(u0, y), y); g.lineTo(at(u1, y), y); g.stroke();
      y += (y1 - y0) * rd(R, 0.3, 0.8) / joints;
    }
    // grain: two or three faint lines down each board
    g.strokeStyle = css(shadeOf(base, 1.2), la * 0.45);
    g.lineWidth = 1;
    for (let k = 0; k < 2; k++) {
      const u = u0 + (u1 - u0) * rd(R, 0.2, 0.8);
      g.beginPath(); g.moveTo(at(u, y0), y0); g.lineTo(at(u + rd(R, -0.004, 0.004), y1), y1); g.stroke();
    }
    g.strokeStyle = css(shadeOf(base, 2), la);
    g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(at(u0, y0), y0); g.lineTo(at(u0, y1), y1); g.stroke();
  }
  g.restore();
}

/** A row of books standing on a shelf whose top surface is at y. */
export function books(g, R, x0, x1, y, o = {}) {
  const { h = 120, cols, lean = 0.12, gap = 0.1 } = o;
  const C = cols ?? ['#b5533c', '#3f6d7a', '#d9a441', '#6b4a6e', '#e8dcc0', '#7a8f5a', '#c97b63', '#2f4858', '#a6603f'].map(hex);
  let x = x0;
  while (x < x1 - 14) {
    if (R() < gap) { x += rd(R, 14, 40); continue; }
    const w = Math.min(x1 - x, rd(R, 16, 38)), hh = h * rd(R, 0.68, 1);
    const c = C[(R() * C.length) | 0];
    const tilt = R() < lean ? rd(R, 0.08, 0.2) * (R() < 0.5 ? -1 : 1) : 0;
    g.save();
    g.translate(x + (tilt > 0 ? 0 : w), y);
    g.rotate(tilt);
    const bx = tilt > 0 ? 0 : -w;
    const p = rect(bx, -hh, w, hh);
    cel(g, p, c, { sd: 4, hd: 2 });
    // bands on the spine
    g.fillStyle = css(lightOf(c, 0.9), 0.75);
    if (R() < 0.7) g.fillRect(bx + 2, -hh * rd(R, 0.72, 0.86), w - 4, 3);
    if (R() < 0.5) g.fillRect(bx + 2, -hh * rd(R, 0.14, 0.24), w - 4, 5);
    ink(g, p, 1.8);
    g.restore();
    x += w + (tilt ? 8 : 0);
  }
}

/** A terracotta pot (or any colour): a tapered body and a rim. Base centre at (x, y). */
export function pot(g, x, y, w, h, c = [197, 110, 62], o = {}) {
  const t = o.taper ?? 0.76;
  g.fillStyle = css(o.shadow ?? [60, 30, 40], 0.26);
  g.fill(ellipse(x + w * 0.18 * -Math.sign(LIGHT.x || 1), y + 3, w * 0.62, h * 0.09 + 5));
  const body = poly([[x - w / 2, y - h], [x + w / 2, y - h], [x + (w / 2) * t, y], [x - (w / 2) * t, y]]);
  cel(g, body, c, { sd: w * 0.16, hd: w * 0.07 });
  ink(g, body, 2.4);
  const rim = rrect(x - w * 0.56, y - h - h * 0.14, w * 1.12, h * 0.2, 5);
  cel(g, rim, lightOf(c, 0.25), { sd: 6, hd: 5 });
  ink(g, rim, 2.4);
}

/** Stars: small soft points, a few of them larger with a cross of light. Held. */
export function stars(g, R, x0, y0, w, h, n, o = {}) {
  const { c = [255, 244, 220], a = 0.9 } = o;
  for (let i = 0; i < n; i++) {
    const x = x0 + R() * w, y = y0 + R() * R() * h, r = 0.6 + R() * R() * 2;
    g.fillStyle = css(c, a * (0.35 + R() * 0.65));
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (r > 2) {
      g.strokeStyle = css(c, 0.35); g.lineWidth = 1;
      g.beginPath(); g.moveTo(x - r * 3.4, y); g.lineTo(x + r * 3.4, y); g.moveTo(x, y - r * 3.4); g.lineTo(x, y + r * 3.4); g.stroke();
    }
  }
}

/** A twinkle in [0, 1] for star or light number i at time s. */
export const twinkle = (s, i, p = 2.5) => 0.5 + 0.5 * Math.sin(TAU * (s / (p * (0.7 + ((i * 0.618) % 1) * 0.6)) + i * 0.37));
