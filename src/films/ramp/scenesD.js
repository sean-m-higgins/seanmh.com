// Acts III–IV · the build, side-on: roll, black, deck, join, holds.
// Sources: IMG_2310, 2334 (frame on wheels, tongue), 2586 (black paint, deck),
// 2619, 2657 (sheet metal), 2686–2691 (posts, rails), 2692–2696 and
// h-gaudi-ramp (the whole ramp), 2700, 2729 (the driveway test).

import { mul32, rd } from '../../lib/draw/rng.js';
import { mix } from '../../lib/draw/color.js';
import { C, GY, dark, piece, rect, bar, circle, cached, scene, tremor, onStage, groundShadow } from './kit.js';
import { cam, section, toePlate, pin, fullRamp, surf, deckY, walker, wheelchair, driveway, asphalt, tint, back } from './parts.js';
import { caption, span, easeOut, easeInOut, lerp } from '../common.js';

const CLOSE = cam(-360, 5);
const BIG = cam(160.2, 2.964); // the whole ramp, pushed in about its foot // one 10 ft section fills the frame
const WARM = [255, 240, 222];

/** The driveway seen close: the far set pushed in, the asphalt at full size. */
function closeSet(ctx) {
  ctx.drawImage(cached('drive-close', (g) => {
    const far = cached('drive-far-nogarage', (f) => driveway(f, { garage: false }));
    g.save(); g.translate(470, GY); g.scale(1.55, 1.55); g.translate(-470, -GY); g.drawImage(far, 0, 0); g.restore();
    g.fillStyle = 'rgba(232,225,208,0.42)'; g.fillRect(0, 0, 1080, GY); // air between us and the trees
    asphalt(g);
  }), 0, 0);
}
function wideSet(ctx) {
  ctx.drawImage(cached('drive-wide', (g) => { driveway(g); asphalt(g); }), 0, 0);
}
const TEEN = dark(C.slate, 0.12), ADULT = dark(C.slate, 0.34);

export const roll = scene('roll', 4, (bg, s, { k }) => {
  closeSet(bg);
  onStage(bg, (ctx) => {
  const push = easeInOut(span(s, 2.0, 3.4));
  const dx = lerp(-34, 0, push);
  const rot = (dx * CLOSE.s) / (5.5 * CLOSE.s);
  // blocks the bare frame rests on until it has wheels
  const blocks = 1 - span(s, 1.15, 1.5);
  if (blocks > 0) for (const x of [150, 216]) piece(ctx, rect(...CLOSE(x + dx - 4, 3 - (1 - blocks) * 6), 8 * CLOSE.s, 3 * CLOSE.s), { color: dark(C.cedar, 0.2), h: 3, seed: x, alpha: blocks });
  const w = (t0) => (s < t0 ? 99 : 34 * (1 - back(span(s, t0, t0 + 0.5))));
  const w0 = w(0.3), w1 = w(0.65);
  section(ctx, CLOSE, 1, { dx, black: 0, rot, ply: null, metal: null, posts: null, tongue: easeOut(span(s, 1.2, 1.8)), wheels: w0 > 90 && w1 > 90 ? false : [Math.min(w0, 60), Math.min(w1, 60)] });
  // the push
  const reach = easeInOut(span(s, 1.3, 1.9));
  const [jx] = tremor(k, 2, 0.4);
  walker(ctx, CLOSE, 100 + dx + jx / 5, 0, { k: 0.93, phase: push > 0 && push < 1 ? ((dx + 34) / 26) * 6.283 : null, color: TEEN, torso: lerp(4, 16, reach), armF: [lerp(8, 62, reach), lerp(14, 8, reach)], armB: [lerp(-6, 54, reach), 12] });
  });
  tint(bg, WARM);
});

export const black = scene('black', 4, (bg, s, { k }) => {
  closeSet(bg);
  onStage(bg, (ctx) => {
  const p1 = easeInOut(span(s, 0.3, 1.5)), p2 = easeInOut(span(s, 1.9, 3.5));
  const painting = s >= 1.7;
  const bx = painting ? lerp(121, 239, p2) : lerp(124, 236, p1);
  const stand = easeInOut(span(s, 3.5, 3.9));
  // the figure works from behind the section
  const [jx, jy] = tremor(k, 4, 0.5);
  const j = walker(ctx, CLOSE, bx - 20, 0, { k: 1, phase: (bx / 22) * 6.283, color: ADULT, torso: lerp(20, 6, stand), armF: [lerp(40, 14, stand), 22], armB: [lerp(30, 4, stand), 26] });
  section(ctx, CLOSE, 1, { black: painting ? (p2 * 118 + 1) / 120 : 0, ply: null, metal: null, posts: null, tongue: 1 });
  if (stand < 1) {
    const tip = CLOSE(bx, deckY(bx) + 1.2);
    const head = [tip[0] + jx, tip[1] + jy - 4];
    piece(ctx, bar(j.haF, head, 5), { color: dark(C.cedar, 0.25), h: 2, rough: 0 });
    piece(ctx, rect(head[0] - 15, head[1] - 7, 30, 13), { color: painting ? dark(C.coal, 0.3) : C.steel, h: 2.5, rough: 0.4, seed: 3 });
    if (!painting && p1 > 0 && p1 < 1) { // rust coming off
      const R = mul32(k * 31 + 5);
      for (let i = 0; i < 7; i++) piece(ctx, circle(head[0] + rd(R, -44, 20), head[1] + rd(R, -30, 26), rd(R, 1.5, 3.2), 6), { color: mix(C.cedar, C.spark, 0.12), h: 1, rough: 0, grain: 0 });
    }
  }
  });
  tint(bg, WARM);
});

export const deck = scene('deck', 6, (bg, s) => {
  closeSet(bg);
  onStage(bg, (ctx) => {
  const lift = (a, b) => { const u = span(s, a, b); return Math.sin(Math.PI * u); };
  const busy = Math.max(lift(0.1, 0.9), lift(1.0, 1.7), lift(1.9, 3.2), lift(3.3, 4.2), lift(4.4, 5.3));
  // two pairs of hands, either end
  walker(ctx, CLOSE, 104, 0, { k: 0.93, color: TEEN, torso: 6 + 8 * busy, armF: [20 + 60 * busy, 16], armB: [6 + 50 * busy, 14] });
  walker(ctx, CLOSE, 258, 0, { k: 1, dir: -1, color: ADULT, torso: 5 + 7 * busy, armF: [16 + 56 * busy, 18], armB: [4 + 44 * busy, 14] });
  const ply = s < 0.2 ? null : 26 * (1 - back(span(s, 0.2, 0.75)));
  const metal = s < 1.0 ? null : 80 * (1 - easeOut(span(s, 1.0, 1.65)));
  const posts = [0, 1, 2].map((i) => (s < 1.9 + 0.42 * i ? 90 : 89 * (1 - back(span(s, 1.9 + 0.42 * i, 2.4 + 0.42 * i)))));
  section(ctx, CLOSE, 1, {
    tongue: 1, ply, metal, posts, rails: easeInOut(span(s, 3.4, 4.2)),
    strips: s < 4.4 ? 0 : Math.floor((s - 4.4) / 0.21) + 1, glint: span(s, 1.75, 2.4) < 1 ? span(s, 1.75, 2.4) : -1,
  });
  });
  tint(bg, WARM);
});

export const join = scene('join', 5, (bg, s) => {
  wideSet(bg);
  onStage(bg, (ctx) => {
  const push = easeInOut(span(s, 0.4, 2.3));
  const d3 = lerp(62, 0, push), d2 = Math.min(28, d3);
  const jolt = 0.5 * Math.sin(Math.PI * span(s, 2.2, 2.45));
  const rot = (d) => d / 5.5;
  const done = { ply: 0, metal: 0 };
  const g = span(s, 4.0, 4.9);
  section(ctx, BIG, 2, { ...done, dx: d3, rot: rot(d3) });
  section(ctx, BIG, 1, { ...done, dx: d2, rot: rot(d2), glint: g > 0.5 && g < 1 ? (g - 0.5) * 2 : -1 });
  section(ctx, BIG, 0, { ...done, dx: -jolt, glint: g > 0 && g <= 0.5 ? g * 2 : -1 });
  toePlate(ctx, BIG, s < 3.2 ? 1 : Math.max(0, 1 - back(span(s, 3.2, 3.85))));
  if (s >= 2.6) pin(ctx, BIG, 120, 20 * (1 - back(span(s, 2.6, 2.95))));
  if (s >= 2.82) pin(ctx, BIG, 240, 20 * (1 - back(span(s, 2.82, 3.17))));
  // one person moves it all
  const away = easeInOut(span(s, 2.5, 3.3));
  walker(ctx, BIG, 276 + d3 + away * 22, 0, { dir: -1, color: TEEN, k: 0.95, phase: push > 0 && push < 1 ? (d3 / 26) * 6.283 : null, torso: lerp(14, 4, away), armF: [lerp(58, 6, away), 12], armB: [lerp(50, -4, away), 12] });
  });
  tint(bg, WARM, 0.6);
});

export const holds = scene('holds', 5, (ctx, s, { env }) => {
  const base = cached('holds-base', (g) => { g.clearRect(0, 0, 1080, 1080); fullRamp(g, BIG, { layer: 'base' }); });
  const posts = cached('holds-posts', (g) => fullRamp(g, BIG, { layer: 'posts' }));
  ctx.drawImage(cached('holds-back', (g) => { driveway(g); asphalt(g); groundShadow(g, base); groundShadow(g, posts); g.drawImage(base, 0, 0); }), 0, 0);
  const u = easeInOut(span(s, 0.1, 4.7));
  const x = lerp(-20, 262, u);
  const moving = u > 0 && u < 1;
  onStage(ctx, (g) => {
    walker(g, BIG, x - 25, surf(x - 25), { color: ADULT, phase: moving ? (x / 24) * 6.283 : null, torso: 9, armF: [58, 14], armB: [52, 16] });
    wheelchair(g, BIG, x, surf(x), { rot: x / 12, color: TEEN });
  });
  ctx.drawImage(posts, 0, 0);
  // a few leaves let go of the trees
  for (let i = 0; i < 5; i++) {
    const R = mul32(i * 97 + 11), x0 = rd(R, 200, 900), sp = rd(R, 26, 44), ph = R() * 9;
    const t = (s * 0.5 + ph) % 4.2, lx = x0 + 30 * Math.sin(t * 2.2 + i) - t * 20, ly = 380 + t * sp * 2.2;
    if (ly < GY - 4) piece(ctx, circle(lx, ly, 4.5, 6, 2.4), { color: mix(C.grass, C.cedar, 0.4), h: 1.5, rough: 0, grain: 0.3 });
  }
  tint(ctx, WARM, 0.6);
  caption(ctx, env.still('holds-cap'), 'it holds', easeInOut(span(s, 2.3, 3.1)), 1080, { color: C.cream, y: 950, x: 96, scale: 0.03 });
});
