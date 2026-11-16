// Act V · delivery: road, tow, stable.
// Sources: IMG_2733 (a section on a flatbed, rails on). The ATV is per Sean.
// The stable is the film's one imagined scene, approved 2026-11-13.

import { mul32, rd } from '../../lib/draw/rng.js';
import { mix, rgba } from '../../lib/draw/color.js';
import { C, GY, SIZE, dark, lite, piece, rect, bar, strip, cached, scene, tremor, doll, setLight, noLight, darkness, halo, bloom } from './kit.js';
import { cam, WIDE, section, fullRamp, surf, walker, wheelchair, horse, atv, trailer, tree, asphalt, tint, rain, human } from './parts.js';
import { duskSky } from './scenesA.js';
import { signature, span, easeOut, easeInOut, lerp } from '../common.js';

const TR = cam(150, 3.5);
const TEEN = dark(C.slate, 0.12), ADULT = dark(C.slate, 0.34);

export const road = scene('road', 3.5, (ctx, _s, { k }) => {
  ctx.drawImage(cached('road-sky', (g) => duskSky(g, 7)), 0, 0);
  // the world going by, drawn as its own trail (the `stars` references)
  const streak = (n, seed, y0, y1, len, speed, w, col, a) => {
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const R = mul32(seed * 977 + i * 7919), l = rd(R, len[0], len[1]), span_ = SIZE + l + 200;
      const x = SIZE + 100 - ((R() * span_ + k * rd(R, speed[0], speed[1])) % span_), y = rd(R, y0, y1);
      ctx.strokeStyle = rgba(col[i % col.length], a * rd(R, 0.4, 1)); ctx.lineWidth = rd(R, w[0], w[1]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + rd(R, -1, 1)); ctx.stroke();
    }
    ctx.restore();
  };
  streak(70, 1, 230, 520, [120, 520], [5, 9], [1, 2.4], [lite(C.steel, 0.5), C.cream, mix(C.navy, C.galv, 0.5)], 0.3);
  streak(230, 2, 500, 660, [160, 620], [16, 22], [2, 7], [mix(C.coal, C.grass, 0.3), dark(C.slate, 0.3), mix(C.coal, C.grass, 0.45), dark(C.navy, 0.4)], 0.85);
  streak(150, 3, 640, 778, [260, 760], [34, 44], [2, 8], [mix(C.grass, C.coal, 0.5), dark(C.slate, 0.45), mix(C.grass, C.slate, 0.5)], 0.9);
  ctx.drawImage(cached('road-ground', (g) => asphalt(g, mix(C.coal, C.slate, 0.3))), 0, 0);
  streak(40, 4, GY + 14, 1070, [160, 560], [60, 90], [1.5, 4], [C.cream, lite(C.steel, 0.4)], 0.2);
  const [, jy] = tremor(k, 41, 0.9);
  ctx.save(); ctx.translate(0, jy);
  trailer(ctx, TR, 18, 172, k * 0.9);
  section(ctx, TR, 0, { dx: 42, dy: 24.6, ply: 0, metal: 0 });
  // straps over the deck
  for (const x of [70, 130]) piece(ctx, strip([TR(x - 14, 24), TR(x, 24.6 + 12 + x / 14), TR(x + 14, 24)], 4), { color: mix(C.cedar, C.cream, 0.3), h: 1.5, rough: 0, seed: 300 + x });
  ctx.restore();
  tint(ctx, [176, 172, 208]);
});

function barn(g) {
  duskSky(g, 3);
  const tones = [mix(C.coal, C.grass, 0.2), dark(C.slate, 0.3), mix(C.coal, C.grass, 0.32)];
  tree(g, 150, 430, 170, 311, tones); tree(g, 420, 500, 130, 312, tones);
  piece(g, rect(600, 330, 500, 460), { color: dark(C.coal, 0.05), h: 8, seed: 313, comb: { angle: Math.PI / 2, gap: 24, a: 0.25 } });
  piece(g, [[560, 350], [850, 190], [1130, 340], [1130, 372], [850, 224], [570, 380]], { color: dark(C.coal, 0.32), h: 9, seed: 314 });
  // the big door, open, lit from inside
  piece(g, rect(740, 470, 270, 320), { color: mix(C.cedar, C.cream, 0.45), h: -0, edge: 1.5, seed: 315 });
  for (let i = 0; i < 4; i++) piece(g, rect(748, 640 + i * 34, 254, 20), { color: mix(C.cedar, C.coal, 0.3), h: 2, rough: 0.5, seed: 316 + i, alpha: 0.75 });
  piece(g, strip([[732, 790], [732, 462], [1018, 462], [1018, 790]], 14), { color: dark(C.coal, 0.3), h: 4, rough: 0.4, seed: 321 });
  asphalt(g, mix(C.coal, C.grass, 0.28));
}

export const tow = scene('tow', 3, (ctx, s, { k }) => {
  ctx.drawImage(cached('tow-back', barn), 0, 0);
  const u = span(s, 0, 3), x = 70 + 150 * (0.55 * u + 0.45 * easeOut(u));
  const [, jy] = tremor(k, 51, 0.7);
  ctx.save(); ctx.translate(0, jy);
  section(ctx, WIDE, 2, { dx: x - 377, ply: 0, metal: 0, tongue: 1, rot: x / 5.5 });
  atv(ctx, WIDE, x, { rot: x / 11 });
  ctx.restore();
  tint(ctx, [150, 156, 196]);
  bloom(ctx, 875, 640, 330, [255, 214, 160], 0.3);
  rain(ctx, k, { n: 190, y1: GY + 230, a: 0.5, len: 46, seed: 9 });
});

const LAMP = [640, 214];
export const stable = scene('stable', 8, (ctx, s, { k, env }) => {
  const flick = 0.86 + 0.06 * Math.sin(k * 0.9) + 0.03 * Math.sin(k * 2.3);
  const lit = () => setLight(LAMP[0], LAMP[1], { power: 0.8, reach: 1250 });
  ctx.drawImage(cached('stable-back', (g) => {
    lit();
    piece(g, rect(-10, -10, 1100, 1100), { color: dark(C.cedar, 0.55), h: 0, rough: 0, seed: 330 });
    for (let i = 0; i < 9; i++) piece(g, rect(-8 + i * 122, -10, 117, GY + 14), { color: dark(C.cedar, 0.42 + 0.05 * ((i * 5) % 3)), h: 3, rough: 0.8, seed: 331 + i, comb: { angle: Math.PI / 2 + 0.01, gap: 9, wave: 4, a: 0.2 } });
    piece(g, rect(-10, 86, 1100, 46), { color: dark(C.cedar, 0.62), h: 7, seed: 341, comb: { angle: 0, gap: 7, a: 0.2 } });
    // the window: rain outside
    piece(g, rect(96, 250, 250, 236), { color: dark(C.coal, 0.2), h: 5, seed: 342 });
    piece(g, rect(112, 266, 218, 204), { color: mix(C.navy, C.steel, 0.3), h: -0, edge: 1.4, seed: 343 });
    asphalt(g, mix(dark(C.cedar, 0.5), C.coal, 0.35));
    fullRamp(g, WIDE, { layer: 'base' });
    noLight();
  }), 0, 0);
  // rain on the glass
  ctx.save(); ctx.beginPath(); ctx.rect(112, 266, 218, 204); ctx.clip();
  rain(ctx, k, { n: 46, x0: 100, x1: 400, y0: 250, y1: 480, a: 0.7, len: 26, seed: 13 });
  ctx.restore();
  ctx.drawImage(cached('stable-window', (g) => { lit(); for (const [a, b] of [[[221, 266], [221, 470]], [[112, 368], [330, 368]]]) piece(g, bar(a, b, 9), { color: dark(C.coal, 0.2), h: 2, rough: 0.3 }); noLight(); }), 0, 0);
  lit();
  // up the last of the slope to the platform
  const u = easeInOut(span(s, 0.2, 3.0)), x = lerp(150, 256, u);
  const off = easeInOut(span(s, 4.6, 5.6)); // the helper steps back down the slope
  const lift = easeInOut(span(s, 3.3, 4.7)), help = Math.sin(Math.PI * span(s, 3.2, 5.0));
  const hx = x - 25 - 34 * off;
  walker(ctx, WIDE, hx, surf(hx), { color: ADULT, dir: 1, phase: (u > 0 && u < 1) || (off > 0 && off < 1) ? (hx / 24) * 6.283 : null, torso: lerp(9, 3, off), armF: [(58 + 46 * help) * (1 - off) + 6 * off, 14], armB: [(52 + 40 * help) * (1 - off), 16] });
  wheelchair(ctx, WIDE, x, surf(x), { rot: x / 12, color: TEEN, rider: lift <= 0 });
  ctx.drawImage(cached('stable-posts', (g) => { lit(); fullRamp(g, WIDE, { layer: 'posts' }); noLight(); }), 0, 0);
  lit(); // building a cache switches the light off; put it back
  // the horse stands in against the platform
  const up = easeInOut(span(s, 4.8, 5.8));
  const h = horse(ctx, WIDE, 292, { nod: lerp(22, -4, up) + 1.5 * Math.sin(s * 1.1), flick: 2.5 * Math.sin(s * 3.1) * (s > 5.6 && s < 6.6 ? 1 : 0.15), legs: [0, 0, 5 * (1 - up), 0] });
  if (lift > 0) { // from the chair onto the horse
    const from = WIDE(x + 2, surf(x) + 21.5), to = [h.back[0] + 8, h.back[1] - 4];
    const hip = [lerp(from[0], to[0], lift), lerp(from[1], to[1], lift) - 46 * Math.sin(Math.PI * lift)];
    doll(ctx, { hip, s: human(WIDE, 0.9), dir: 1, torso: lerp(-3, 3, lift), head: 4, legF: [lerp(86, 26, lift), lerp(-80, -22, lift)], legB: [lerp(84, 22, lift), lerp(-80, -22, lift)], armF: [lerp(18, 44, lift), lerp(58, 34, lift)], armB: [lerp(14, 40, lift), 40] }, { color: TEEN });
  }
  // the lamp
  piece(ctx, bar([LAMP[0], -10], [LAMP[0], LAMP[1] - 40], 4), { color: C.coal, h: 2, rough: 0 });
  piece(ctx, [[LAMP[0] - 20, LAMP[1] - 42], [LAMP[0] + 20, LAMP[1] - 42], [LAMP[0] + 50, LAMP[1] - 6], [LAMP[0] - 50, LAMP[1] - 6]], { color: dark(C.coal, 0.1), h: 5, rough: 0.4, seed: 350 });
  noLight();
  darkness(ctx, LAMP[0], LAMP[1] + 150, 1040 * flick, { warm: [255, 232, 200], far: [112, 98, 100], squash: 1 });
  halo(ctx, LAMP[0], LAMP[1] + 6, 330, 0.62 * flick);
  bloom(ctx, LAMP[0], LAMP[1] + 4, 250, [255, 150, 60], 0.36 * flick);
  bloom(ctx, LAMP[0], LAMP[1] + 4, 34, [255, 240, 215], 0.95);
  signature(ctx, env.still('sign'), env.film, easeInOut(span(s, 5.6, 7.2)), { color: C.cream, y: 962, scale: 0.021, alpha: 0.9 });
});
