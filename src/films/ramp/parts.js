// Film 03 · ramp — the cast and the sets: the ramp itself (in inches, from
// Sean's confirmed dimensions), the wheelchair, the horse, the ATV, the
// trailer, the driveway, and the drawing register's plotter and dot-matrix.

import { mul32, rd } from '../../lib/draw/rng.js';
import { mix, rgba } from '../../lib/draw/color.js';
import { C, GY, SIZE, dark, lite, piece, rect, bar, circle, capsule, strip, blob, turn, doll, wheel, look } from './kit.js';

export const RAW = mix(mix(C.steel, C.slate, 0.3), C.cedar, 0.16); // bare steel angle
export const BLACK = dark(C.coal, 0.12); // matte black paint
export const PLY = mix(dark(C.cedar, 0.45), C.coal, 0.2);
export const INKB = [207, 224, 255]; // the plotter's light: cream pulled toward navy

/** Paper landing: a small overshoot (3–5 %), then home. */
export const back = (t) => { const u = Math.min(1, Math.max(0, t)) - 1; return 1 + 2.2 * u * u * u + 1.2 * u * u; };

/** A camera for side elevations: inches -> px. x0 is the screen x of inch 0. */
export function cam(x0, s) {
  const M = (x, y) => [x0 + x * s, GY - y * s];
  M.s = s; M.x0 = x0;
  return M;
}
/** The wide view: the whole 25 ft ramp, its foot on the anchor. */
export const WIDE = cam(150, 2.5333);

// ---- the ramp: a 5 ft platform and two 10 ft slopes, 1:12, on wheels ----

export const SECTIONS = [{ a: 0, b: 120 }, { a: 120, b: 240 }, { a: 240, b: 300 }];
/** Deck height in inches at x inches from the low end. */
export const deckY = (x) => 6 + Math.min(240, Math.max(0, x)) / 12;
const POSTS = [[5, 60, 115], [125, 180, 235], [246, 294]];
const STRIPS = [[14, 42, 70, 98], [134, 162, 190, 218], [252, 278]];

/**
 * One section, as far along as the build has got.
 *   dx      slide, in inches          black   0..1 painted, wiping from the low end
 *   wheels  [drop, drop] in inches, or false   rot   wheel rotation
 *   tongue  0..1 the tow bar          ply / metal   null, or the inches still to fall / slide
 *   posts   per-post tilt in degrees (90 = lying down), or null
 *   rails   0..1 slid home            strips  how many traction strips are on
 */
export function section(ctx, M, i, o = {}) {
  const { a, b } = SECTIONS[i];
  const { dx = 0, dy = 0, black = 1, wheels = [0, 0], rot = 0, tongue = 0, ply = 0, metal = 0, posts = [0, 0, 0], rails = 1, strips = 9, glint = -1, layer = null } = o;
  const P = (x, y) => M(x + dx, y + dy);
  const sd = 500 + i * 100;
  const q = (pts, opt) => piece(ctx, pts.map(([x, y]) => P(x, y)), opt);

  const frame = (color) => {
    const m = (pts, k) => q(pts, { color, h: 2.5, rough: 0.3, seed: sd + k });
    const xa = Math.max(a, 42), legs = [xa + 1.5, (xa + b) / 2, b - 1.5];
    for (let k = 0; k < 2; k++) m([[legs[k], 4.5], [legs[k] + 2.2, 4.5], [legs[k + 1], deckY(legs[k + 1]) - 3], [legs[k + 1] - 2.2, deckY(legs[k + 1]) - 3]], 10 + k); // braces
    legs.forEach((x, k) => m([[x - 1.3, deckY(x) - 2], [x + 1.3, deckY(x) - 2], [x + 1.3, 3], [x - 1.3, 3]], 20 + k));
    m([[xa, 5.6], [b, 5.6], [b, 3], [xa, 3]], 30);
    m([[a, deckY(a)], [b, deckY(b)], [b, deckY(b) - 3], [a, deckY(a) - 3]], 31);
  };
  if (layer !== 'posts') {
  if (black < 1) frame(RAW);
  if (black > 0) {
    ctx.save();
    if (black < 1) { ctx.beginPath(); ctx.rect(0, 0, P(a + (b - a) * black, 0)[0], SIZE); ctx.clip(); }
    frame(BLACK);
    ctx.restore();
  }
  if (tongue > 0) {
    const e = b + 40 * tongue;
    q([[b - 2, 9.5], [e, 9.5], [e, 7], [b - 2, 7]], { color: black > 0.5 ? BLACK : RAW, h: 2, rough: 0.3, seed: sd + 40 });
    if (tongue >= 1) piece(ctx, circle(...P(e + 1.5, 8.2), 2.6 * M.s, 10), { color: C.steel, h: 1.5, rough: 0 });
  }
  if (ply !== null) q([[a, deckY(a) + ply], [b, deckY(b) + ply], [b, deckY(b) + ply + 1.7], [a, deckY(a) + ply + 1.7]], { color: PLY, h: 2 + ply * 0.5, rough: 0.3, seed: sd + 50, comb: { angle: 0, gap: 3, a: 0.2 } });
  if (metal !== null) {
    const s = metal / 12 * (i < 2 ? 1 : 0), y0 = 1.7, t = 1.3;
    q([[a + metal, deckY(a) + y0 + s], [b + metal, deckY(b) + y0 + s], [b + metal, deckY(b) + y0 + t + s], [a + metal, deckY(a) + y0 + t + s]], { color: C.galv, h: 1.6, rough: 0.2, seed: sd + 51 });
    if (glint >= 0 && glint <= 1) { // a sheen running up the sheet
      const g0 = a + (b - a - 16) * glint;
      q([[g0, deckY(g0) + y0], [g0 + 16, deckY(g0 + 16) + y0], [g0 + 16, deckY(g0 + 16) + y0 + t], [g0, deckY(g0) + y0 + t]], { color: lite(C.cream, 0.5), h: 0, rough: 0, grain: 0, edge: 0, alpha: 0.85 });
    }
    STRIPS[i].forEach((x, k) => { if (k < strips) q([[x, deckY(x) + 3], [x + 12, deckY(x + 12) + 3], [x + 12, deckY(x + 12) + 3.9], [x, deckY(x) + 3.9]], { color: BLACK, h: 1, rough: 0, seed: sd + 60 + k }); });
  }
  if (wheels) {
    const xs = i < 2 ? [a + 14, b - 14] : [a + 12, b - 12];
    xs.forEach((x, k) => { const [wx, wy] = P(x, 5.5 + wheels[k]); wheel(ctx, wx, wy, 5.5 * M.s, rot); });
  }
  }
  if (layer === 'base') return;
  if (posts) POSTS[i].forEach((x, k) => {
    const tilt = posts[k] ?? 0;
    if (tilt >= 90) return;
    const base = P(x, deckY(x) - 4.5);
    const up = (pts) => turn(pts.map(([px, py]) => P(px, py)), base[0], base[1], -tilt);
    piece(ctx, up([[x - 1.75, deckY(x) - 4.5], [x + 1.75, deckY(x) - 4.5], [x + 1.75, deckY(x) + 42], [x - 1.75, deckY(x) + 42]]), { color: C.cedar, h: 3, rough: 0.35, seed: sd + 70 + k, comb: { angle: Math.PI / 2 - (tilt * Math.PI) / 180, gap: 4, a: 0.18 } });
    piece(ctx, up([[x - 2.5, deckY(x) + 42], [x + 2.5, deckY(x) + 42], [x + 2.5, deckY(x) + 43.6], [x - 2.5, deckY(x) + 43.6]]), { color: lite(C.cedar, 0.2), h: 2, rough: 0.2, seed: sd + 80 + k });
  });
  if (rails > 0 && posts) {
    const p = POSTS[i], x0 = p[0] - 3, x1 = p[p.length - 1] + 3, off = -(1 - rails) * (x1 - x0 + 10);
    piece(ctx, bar(P(x0 + off, deckY(x0) + 37), P(x1 + off, deckY(x1) + 37), 2.3 * M.s), { color: BLACK, h: 3.5, rough: 0.2, seed: sd + 90, alpha: Math.min(1, rails * 4) });
  }
}

/** The hinged toe plate. fold: 0 = down on the ground, 1 = folded back up onto the deck. */
export function toePlate(ctx, M, fold = 0) {
  const hinge = M(0, 7.6), tip = M(-23, 0.4), ang = fold * 168;
  const pl = turn(bar(hinge, tip, 1.6 * M.s), hinge[0], hinge[1], ang);
  piece(ctx, pl, { color: PLY, h: 2.5, rough: 0.3, seed: 601 });
  const lipA = [hinge[0] + (tip[0] - hinge[0]) * 0.66, hinge[1] + (tip[1] - hinge[1]) * 0.66];
  piece(ctx, turn(bar(lipA, [tip[0] - 2, tip[1]], 1.8 * M.s), hinge[0], hinge[1], ang), { color: C.galv, h: 1.5, rough: 0.2, seed: 602 });
}

/** A pin through a joint at x inches, `up` inches above its seat. */
export function pin(ctx, M, x, up = 0) {
  const p = M(x, deckY(x) + 1 + up);
  piece(ctx, rect(p[0] - 2.4, p[1] - 11, 4.8, 15), { color: C.steel, h: 2, rough: 0 });
  piece(ctx, circle(p[0], p[1] - 12, 4.4, 10), { color: C.cream, h: 1.5, rough: 0 });
}

/** The whole finished ramp. */
export function fullRamp(ctx, M, o = {}) {
  for (let i = 2; i >= 0; i--) section(ctx, M, i, { ply: 0, metal: 0, ...o });
  if (o.layer === 'posts') return;
  toePlate(ctx, M, 0);
  pin(ctx, M, 120); pin(ctx, M, 240);
}
/** The walking surface, in inches, at x (the toe plate below 0). */
export const surf = (x) => (x < 0 ? Math.max(0, 7.6 * (1 + x / 23)) + 1 : deckY(x) + 3);

// ---- figures ----

/** Doll scale for a 5 ft 8 figure under camera M. */
export const human = (M, k = 1) => 0.345 * M.s * k;

/** A standing or walking figure with its feet at inch x on height y. phase drives the walk. */
export function walker(ctx, M, x, y, o = {}) {
  const { k = 1, dir = 1, phase = null, color = dark(C.slate, 0.2), armF, armB, torso = 5, head = 0 } = o;
  const s = human(M, k), sw = phase === null ? 0 : Math.sin(phase);
  const [hx, hy] = M(x, y);
  const hip = [hx, hy - (92 - 4 * Math.abs(sw)) * s - 6 * s];
  return doll(ctx, {
    hip, s, dir, torso, head,
    legF: [phase === null ? 4 : 24 * sw, phase === null ? -3 : -8 - 14 * Math.max(0, -Math.cos(phase))],
    legB: [phase === null ? -6 : -24 * sw, phase === null ? -3 : -8 - 14 * Math.max(0, Math.cos(phase))],
    armF: armF ?? [-18 * sw + 4, 14], armB: armB ?? [18 * sw - 4, 14],
  }, { color, ...o.doll });
}

/** A wheelchair with someone in it, rear axle at inch x, on a surface y inches up. */
export function wheelchair(ctx, M, x, y, o = {}) {
  const { rot = 0, rider = true, color = dark(C.slate, 0.05) } = o;
  const P = (px, py) => M(x + px, y + py), s = M.s;
  const fr = dark(C.steel, 0.25);
  const seated = () => doll(ctx, { hip: P(2, 21.5), s: human(M, 0.9), dir: 1, torso: -3, head: 4, legF: [86, -80], legB: [84, -80], armF: [18, 58], armB: [14, 56] }, { color });
  piece(ctx, bar(P(-3, 19), P(-6, 38), 1.5 * s), { color: fr, h: 2, rough: 0 }); // back
  piece(ctx, bar(P(-6, 37.4), P(-12, 37.4), 1.5 * s), { color: fr, h: 2, rough: 0 }); // push handle
  if (rider) seated();
  piece(ctx, bar(P(-3, 19.5), P(17, 19.5), 1.6 * s), { color: fr, h: 2, rough: 0 });
  piece(ctx, strip([P(17, 19.5), P(20, 8), P(26, 6)], 1.4 * s), { color: fr, h: 2, rough: 0 });
  const [wx, wy] = P(0, 12);
  piece(ctx, circle(wx, wy, 12 * s, 28), { color: C.coal, h: 3, rough: 0 });
  piece(ctx, circle(wx, wy, 10.2 * s, 24), { color: mix(C.steel, C.slate, 0.5), h: 0, rough: 0, edge: 0.6 });
  for (let i = 0; i < 6; i++) { const an = rot + (i * Math.PI) / 3; piece(ctx, bar([wx, wy], [wx + Math.cos(an) * 10 * s, wy + Math.sin(an) * 10 * s], 1.6), { color: C.galv, h: 0, rough: 0, grain: 0, edge: 0 }); }
  piece(ctx, circle(wx, wy, 2.2 * s, 10), { color: C.galv, h: 1, rough: 0 });
  const [cx, cy] = P(20, 3.5);
  piece(ctx, circle(cx, cy, 3.5 * s, 12), { color: C.coal, h: 2, rough: 0 });
}

/**
 * A horse, facing right, hooves on the ground at inch x. nod lowers the head
 * (degrees); legs are four small swings; flick moves the tail.
 */
export function horse(ctx, M, x, o = {}) {
  const { nod = 0, legs = [0, 0, 0, 0], flick = 0, y = 0, color = mix(C.coal, C.cedar, 0.42) } = o;
  const P = (px, py) => M(x + px, y + py), s = M.s;
  const far = dark(color, 0.3), hair = dark(C.coal, 0.1);
  const pc = (pts, c, h = 3, seed = 0) => piece(ctx, pts, { color: c, h, rough: 0, grain: 0.8, seed: 700 + seed });
  const leg = (hx, hy, a, front, c) => {
    const r = (d) => (d * Math.PI) / 180, v = (d, l) => [Math.sin(r(d)) * l * s, Math.cos(r(d)) * l * s];
    const top = P(hx, hy), k = [top[0] + v(a, 20)[0], top[1] + v(a, 20)[1]];
    const bend = front ? -a * 0.6 : a * 0.5 + 8;
    const f = [k[0] + v(bend, 17)[0], k[1] + v(bend, 17)[1]];
    pc(capsule(top, k, (front ? 8.5 : 12) * s, 5.5 * s), c, 2.5);
    pc(capsule(k, f, 5 * s, 4 * s), c, 2.5);
    pc(capsule(f, [f[0] + 1.6 * s, f[1] + 3 * s], 5.5 * s, 6 * s), hair, 2);
  };
  // tail
  pc(blob([P(-39, 55), P(-45 - flick, 46), P(-47 - flick * 2, 26), P(-43 - flick * 2, 18), P(-41 - flick, 30), P(-37, 50)], 2), hair, 2, 1);
  leg(23, 41, legs[1], true, far); leg(-27, 43, legs[3], false, far);
  pc(blob([P(18, 63), P(0, 60), P(-20, 61.5), P(-34, 60), P(-41, 52), P(-40, 41), P(-32, 35), P(-12, 32.5), P(10, 32), P(26, 34), P(35, 41), P(36, 52), P(30, 61)], 2), color, 4, 2);
  leg(29, 41, legs[0], true, color); leg(-33, 43, legs[2], false, color);
  // neck and head turn about the shoulder
  const piv = P(27, 54);
  const nk = (pts) => turn(pts.map(([px, py]) => P(px, py)), piv[0], piv[1], nod);
  pc(blob(nk([[12, 62], [29, 76], [39, 86], [43, 92], [46, 86], [53, 80], [65, 68], [67, 63], [62, 60], [53, 66], [47, 70], [40, 58], [35, 42], [22, 44]]), 2), color, 3.5, 3);
  pc(blob(nk([[13, 63], [28, 78], [38, 88], [41, 86], [33, 74], [20, 60]]), 2), hair, 1.5, 4); // mane
  return { back: P(0, 61), piv };
}

/** A generic ATV facing right, rear hitch at inch x - 37. */
export function atv(ctx, M, x, o = {}) {
  const { rot = 0, color = dark(C.slate, 0.1) } = o;
  const P = (px, py) => M(x + px, py), s = M.s;
  piece(ctx, bar(P(-37, 14), P(-28, 16), 1.6 * s), { color: C.steel, h: 2, rough: 0 });
  doll(ctx, { hip: P(-4, 35), s: human(M, 0.92), dir: 1, torso: 16, head: -6, legF: [62, -70], legB: [60, -70], armF: [56, 26], armB: [52, 28] }, { color: dark(C.slate, 0.3) });
  piece(ctx, blob([P(-36, 17), P(-32, 27), P(-14, 30), P(-10, 34), P(8, 34), P(13, 39), P(23, 40), P(29, 30), P(37, 27), P(39, 17), P(22, 13), P(-22, 13)], 2), { color, h: 4, rough: 0, seed: 801 });
  piece(ctx, bar(P(21, 39), P(15, 49), 1.5 * s), { color: C.coal, h: 2, rough: 0 });
  piece(ctx, bar(P(-34, 30), P(-16, 32), 1.3 * s), { color: C.steel, h: 2, rough: 0 });
  for (const wx of [-22, 23]) { const [px, py] = P(wx, 11); wheel(ctx, px, py, 11 * s, rot, { hub: C.steel }); }
}

/** A flatbed trailer, deck from inch x to x + len, tongue leaving to the right. */
export function trailer(ctx, M, x, len, rot = 0) {
  const P = (px, py) => M(x + px, py), s = M.s, c = dark(C.coal, 0.05);
  piece(ctx, bar(P(len, 19), P(len + 150, 19), 2.6 * s), { color: c, h: 3, rough: 0.3, seed: 811 });
  piece(ctx, [P(-4, 23.5), P(len + 2, 23.5), P(len + 2, 17), P(-4, 17)], { color: c, h: 4, rough: 0.4, seed: 812 });
  piece(ctx, [P(-4, 24.6), P(len + 2, 24.6), P(len + 2, 23), P(-4, 23)], { color: dark(C.cedar, 0.4), h: 1.5, rough: 0.3, seed: 813, comb: { angle: 0, gap: 3, a: 0.2 } });
  for (const wx of [len * 0.42 - 15, len * 0.42 + 15]) { const [px, py] = P(wx, 12.5); wheel(ctx, px, py, 12.5 * s, rot, { hub: C.steel }); }
  piece(ctx, blob([P(len * 0.42 - 34, 22), P(len * 0.42 - 28, 29), P(len * 0.42 + 28, 29), P(len * 0.42 + 34, 22), P(len * 0.42 + 30, 22), P(len * 0.42 + 24, 26), P(len * 0.42 - 24, 26), P(len * 0.42 - 30, 22)], 1), { color: c, h: 3, rough: 0, seed: 814 });
}

// ---- sets ----

/** A cloud or a canopy: a lumpy blob with scored ridges. */
export function lump(g, x, y, w, h, color, seed, o = {}) {
  const R = mul32(seed), n = 11, pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283, k = rd(R, 0.78, 1.12); pts.push([x + Math.cos(a) * w * k, y + Math.sin(a) * h * k * (Math.sin(a) > 0 ? 0.55 : 1)]); }
  piece(g, blob(pts, 2), { color, h: o.h ?? 4, rough: 0, seed, comb: { angle: rd(R, -0.5, 0.5), gap: o.gap ?? 8, wave: 7, a: o.a ?? 0.16 } });
}
/** A tree as the relief references build one: a trunk and a heap of scalloped layers. */
export function tree(g, x, y, r, seed, tones) {
  const R = mul32(seed);
  piece(g, [[x - r * 0.09, y + r * 0.2], [x + r * 0.09, y + r * 0.2], [x + r * 0.15, GY], [x - r * 0.15, GY]], { color: dark(C.coal, 0.1), h: 3, rough: 0.6, seed });
  const lobes = [];
  for (let i = 0; i < 11; i++) { const a = rd(R, 0, 6.283), d = rd(R, 0, 0.7) * r; lobes.push([x + Math.cos(a) * d * 1.15, y + Math.sin(a) * d * 0.62, rd(R, 0.4, 0.62) * r]); }
  lobes.sort((p, q) => p[1] - q[1]);
  lobes.forEach(([lx, ly, lr], i) => lump(g, lx, ly, lr, lr * 0.8, tones[i % tones.length], seed * 13 + i, { h: 4, gap: 6, a: 0.2 }));
}

/** The ground in front of the anchor: asphalt in scored strata, cracked. */
export function asphalt(g, color = mix(C.coal, C.slate, 0.45)) {
  piece(g, rect(-10, GY, 1100, 320), { color, h: 3, rough: 1.2, comb: { angle: 0.03, gap: 10, wave: 6, a: 0.15 }, seed: 11 });
  const R = mul32(77);
  for (let i = 0; i < 8; i++) {
    let x = rd(R, 0, 1080), y = rd(R, 810, 980); const pts = [[x, y]];
    for (let j = 0; j < 7; j++) { x += rd(R, -50, 50); y += rd(R, -18, 18); pts.push([x, y]); }
    piece(g, strip(pts, 2.2), { color: dark(C.coal, 0.5), h: 0, rough: 0, grain: 0, edge: 0, alpha: 0.5 });
  }
  // nearer strata, each a layer up
  piece(g, blob([[-60, 1010], [150, 990], [420, 1018], [700, 996], [960, 1012], [1140, 992], [1140, 1140], [-60, 1140]], 2), { color: dark(color, 0.28), h: 6, rough: 0, seed: 12, comb: { angle: -0.03, gap: 8, wave: 8, a: 0.2 } });
  piece(g, blob([[-60, 1058], [260, 1046], [560, 1066], [860, 1050], [1140, 1062], [1140, 1140], [-60, 1140]], 2), { color: dark(color, 0.5), h: 7, rough: 0, seed: 13, comb: { angle: 0.02, gap: 7, wave: 6, a: 0.22 } });
}

const SKY = mix(C.galv, C.cream, 0.35);
/** An overcast sky in strata, with a pale paper sun (unless the scene moves its own). */
export function drivewaySky(g, o = {}) {
  const { sky = SKY, sun = true } = o;
  piece(g, rect(-10, -10, 1100, GY + 20), { color: dark(sky, 0.08), h: 0, rough: 0, seed: 21 });
  const band = (ys, c, seed) => piece(g, blob([[-80, ys[0]], [180, ys[1]], [460, ys[2]], [760, ys[3]], [1160, ys[4]], [1160, 800], [-80, 800]], 2), { color: c, h: 5, rough: 0, seed, comb: { angle: 0.02, gap: 9, wave: 12, a: 0.1 } });
  band([110, 70, 130, 80, 120], mix(sky, C.cream, 0.3), 22);
  if (sun) piece(g, circle(330, 205, 62, 36), { color: lite(C.cream, 0.6), h: 4, rough: 0, seed: 20, comb: { angle: 0.6, gap: 6, wave: 4, a: 0.07 } });
  band([230, 250, 200, 262, 214], mix(sky, C.cream, 0.6), 23);
  band([356, 330, 372, 340, 364], lite(C.cream, 0.15), 24);
}
/** Sean's driveway, side-on: trees, the house, the garage with its door open. */
export function drivewayFront(g, o = {}) {
  const { garage = true } = o;
  const tones = [mix(C.coal, C.grass, 0.3), mix(C.slate, C.grass, 0.35), mix(C.coal, C.grass, 0.45), mix(C.slate, C.grass, 0.22)];
  tree(g, 150, 470, 190, 28, tones); tree(g, 960, 450, 210, 29, tones); tree(g, 700, 520, 170, 27, tones);
  tree(g, 330, 560, 170, 25, tones); tree(g, 540, 590, 150, 26, tones);
  piece(g, rect(-10, 700, 1100, 90), { color: mix(C.grass, C.slate, 0.45), h: 4, rough: 1.5, seed: 30, comb: { angle: 1.45, gap: 5, a: 0.14 } });
  // the house, left: clapboard, one window
  piece(g, rect(-10, 420, 236, 370), { color: dark(C.cream, 0.12), h: 6, seed: 31, comb: { angle: 0, gap: 15, a: 0.22 } });
  piece(g, [[-20, 430], [-20, 330], [250, 418], [250, 438]], { color: dark(C.slate, 0.1), h: 7, seed: 32, comb: { angle: 0.3, gap: 7, a: 0.22 } });
  piece(g, rect(70, 500, 84, 130), { color: dark(C.slate, 0.3), h: -0, edge: 1.4, seed: 33 });
  for (const x of [52, 156]) piece(g, rect(x, 496, 17, 138), { color: dark(C.cedar, 0.5), h: 2, seed: 34 + x });
  if (garage) {
    piece(g, rect(748, 470, 350, 320), { color: dark(C.cream, 0.08), h: 6, seed: 36, comb: { angle: 0, gap: 15, a: 0.22 } });
    piece(g, [[720, 482], [925, 372], [1120, 470], [1120, 496], [925, 400], [730, 500]], { color: dark(C.slate, 0.1), h: 8, seed: 37 });
    piece(g, rect(800, 540, 262, 250), { color: dark(C.coal, 0.35), h: -0, edge: 1.5, seed: 38 });
    piece(g, strip([[792, 790], [792, 532], [1070, 532], [1070, 790]], 12), { color: mix(C.slate, C.cedar, 0.3), h: 3, rough: 0.4, seed: 39 });
  }
}

export function driveway(g, o = {}) { drivewaySky(g, o); drivewayFront(g, o); }

/** Multiply a time of day over what has been drawn. */
export function tint(ctx, color, a = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = a;
  ctx.fillStyle = rgba(color); ctx.fillRect(0, 0, SIZE, SIZE); ctx.restore();
}

/** Rain as streaks. k is the frame-pair index. */
export function rain(ctx, k, o = {}) {
  const { n = 150, y1 = GY, slant = -0.22, color = lite(C.steel, 0.5), a = 0.5, x0 = -60, x1 = SIZE + 60, y0 = -40, seed = 5, len = 40 } = o;
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const R = mul32(seed * 131 + i * 7919);
    const sp = rd(R, 46, 80), span = y1 - y0 + 120, off = R() * span, l = len * rd(R, 0.5, 1.2);
    const y = y0 + ((off + k * sp) % span) - 60, x = rd(R, x0, x1) + (y - y0) * slant;
    if (y > y1) continue;
    ctx.strokeStyle = rgba(color, a * rd(R, 0.3, 1)); ctx.lineWidth = rd(R, 1, 2.2);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - slant * l, Math.max(y0, y - l)); ctx.stroke();
  }
  ctx.restore();
}

// ---- the drawing register: a navy sheet, a plotter of light, dot-matrix figures ----

export function sheet(g) {
  piece(g, rect(-10, -10, 1100, 1100), { color: dark(C.navy, 0.18), h: 0, rough: 0, seed: 41 });
  piece(g, rect(34, 34, 1012, 1012), { color: C.navy, h: 5, rough: 1.4, seed: 42 });
  g.fillStyle = rgba(INKB, 0.1);
  for (let y = 80; y < 1020; y += 40) for (let x = 80; x < 1020; x += 40) g.fillRect(x - 1, y - 1, 2, 2);
}

/**
 * Plot a polyline as points of light, the way the iris grows in pixel-art.mov.
 * u (0..1) is how much is drawn; with `scatter`, each dot flies in to its place.
 */
export function plot(ctx, pts, u = 1, o = {}) {
  const { gap = 7, size = 2.6, color = INKB, scatter = 0, seed = 1, a = 0.95, head = true } = o;
  if (u <= 0) return;
  const dots = [];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / gap));
    for (let j = i === 1 ? 0 : 1; j <= n; j++) dots.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
  }
  const N = dots.length, R = mul32(seed * 7919 + N);
  ctx.save();
  if (look() === 'c') ctx.globalCompositeOperation = 'lighter';
  let last = null;
  for (let j = 0; j < N; j++) {
    const rx = R() - 0.5, ry = R() - 0.5, tw = R();
    const p = Math.min(1, Math.max(0, (u * (N + N * 0.3) - j) / (N * 0.3)));
    if (p <= 0) continue;
    const e = 1 - (1 - p) * (1 - p) * (1 - p), x = dots[j][0] + rx * scatter * (1 - e), y = dots[j][1] + ry * scatter * (1 - e);
    ctx.fillStyle = rgba(color, 0.07 * p * a); ctx.fillRect(x - size * 1.6, y - size * 1.6, size * 3.2, size * 3.2);
    ctx.fillStyle = rgba(color, a * p * (0.65 + 0.35 * tw)); ctx.fillRect(x - size / 2, y - size / 2, size, size);
    if (p < 1) last = [x, y];
  }
  if (head && last && u < 1) { ctx.fillStyle = rgba([255, 255, 255], 0.9); ctx.fillRect(last[0] - 2.5, last[1] - 2.5, 5, 5); }
  ctx.restore();
}

const DM = {
  0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111',
  3: '11110000010000101110000010000111110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110',
  6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110',
  9: '01110100011000101111000010001001100', ':': '00000001000010000000001000010000000', '′': '00100001000100000000000000000000000',
  '×': '00000100010101000100010101000100000', '.': '00000000000000000000000000110001100', '°': '01100100101001001100000000000000000',
  '∠': '00001000100010001000100001111100000', '#': '01010010101111101010111110101001010', ' ': '00000000000000000000000000000000000',
};
/** Dot-matrix figures: measurements as ornament. u types them out. Returns the width. */
export function dm(ctx, text, x, y, px = 4, o = {}) {
  const { color = INKB, u = 1, a = 0.9 } = o;
  const chars = [...text], shown = Math.ceil(chars.length * Math.min(1, Math.max(0, u)));
  ctx.save();
  if (look() === 'c') ctx.globalCompositeOperation = 'lighter';
  chars.slice(0, shown).forEach((ch, i) => {
    const g = DM[ch] ?? DM[' '];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r * 5 + c] === '1') {
      const cx = x + (i * 6 + c) * px, cy = y + r * px;
      ctx.fillStyle = rgba(color, 0.08 * a); ctx.fillRect(cx - px * 0.5, cy - px * 0.5, px * 1.8, px * 1.8);
      ctx.fillStyle = rgba(color, a); ctx.fillRect(cx, cy, px * 0.78, px * 0.78);
    }
  });
  ctx.restore();
  return chars.length * 6 * px;
}
