// Act I · the ask: rain, ask, eighteen. No photos: these come from Sean's story.

import { mul32, rd } from '../../lib/draw/rng.js';
import { mix, rgba } from '../../lib/draw/color.js';
import { pencil } from '../../lib/draw/line.js';
import { hand } from '../../lib/draw/hand.js';
import { C, GY, SIZE, dark, lite, piece, rect, bar, circle, capsule, blob, strip, cached, scene, tremor, scratch, bloom } from './kit.js';
import { WIDE, cam, human, walker, horse, lump, tree, asphalt, tint, rain as rainFall } from './parts.js';
import { caption, span, easeOut, easeInOut, easeIn, lerp } from '../common.js';

const INK = [42, 43, 49];
const DUSK = [178, 182, 214];

/** A dusk sky in strata. */
export function duskSky(g, seed = 0) {
  const sky = mix(C.navy, C.steel, 0.42);
  piece(g, rect(-10, -10, 1100, GY + 20), { color: dark(sky, 0.25), h: 0, rough: 0, seed: 121 + seed });
  const band = (ys, c, sd) => piece(g, blob([[-80, ys[0]], [180, ys[1]], [460, ys[2]], [760, ys[3]], [1160, ys[4]], [1160, 800], [-80, 800]], 2), { color: c, h: 5, rough: 0, seed: sd, comb: { angle: 0.02, gap: 9, wave: 12, a: 0.14 } });
  band([90, 130, 70, 120, 84], dark(sky, 0.1), 122 + seed);
  band([210, 180, 236, 190, 230], mix(sky, C.steel, 0.25), 123 + seed);
  band([330, 356, 318, 366, 330], mix(sky, C.galv, 0.42), 124 + seed);
}

/** The riding centre's own ramp: fixed, wooden, out in the weather. */
function fixedRamp(g) {
  const wood = mix(mix(C.cedar, C.steel, 0.6), C.cream, 0.25), P = (x, y) => WIDE(x, y);
  for (const x of [70, 120, 170, 225, 262, 298]) { const top = 3 + Math.min(26, ((x - 40) / 190) * 26); piece(g, [P(x - 2, top + 38), P(x + 2, top + 38), P(x + 2, -2), P(x - 2, -2)], { color: dark(wood, 0.2), h: 3, rough: 0.5, seed: 130 + x }); }
  piece(g, [P(40, 1), P(230, 27), P(300, 27), P(300, 23), P(230, 23), P(40, -3)], { color: wood, h: 4, rough: 0.6, seed: 140, comb: { angle: -0.13, gap: 4, a: 0.2 } });
  piece(g, bar(P(68, 43), P(228, 65), 5), { color: dark(wood, 0.3), h: 3, rough: 0.3, seed: 141 });
  piece(g, bar(P(226, 65), P(300, 65), 5), { color: dark(wood, 0.3), h: 3, rough: 0.3, seed: 142 });
}

export const rain = scene('rain', 5, (ctx, s, { k }) => {
  ctx.drawImage(cached('rain-back', (g) => {
    duskSky(g);
    lump(g, 300, 700, 420, 150, dark(C.slate, 0.2), 150, { h: 5 }); lump(g, 860, 720, 380, 120, dark(C.slate, 0.32), 151, { h: 5 });
    const tones = [mix(C.coal, C.grass, 0.2), dark(C.slate, 0.3), mix(C.coal, C.grass, 0.32)];
    tree(g, 560, 470, 140, 152, tones); tree(g, 1010, 430, 170, 153, tones);
    // the stable, left
    piece(g, rect(-10, 400, 290, 390), { color: dark(C.coal, 0.05), h: 7, seed: 154, comb: { angle: Math.PI / 2, gap: 22, a: 0.25 } });
    piece(g, [[-20, 412], [130, 300], [310, 404], [310, 428], [130, 330], [-20, 440]], { color: dark(C.coal, 0.3), h: 8, seed: 155 });
    piece(g, rect(96, 560, 120, 230), { color: mix(C.slate, C.cream, 0.25), h: -0, edge: 1.4, seed: 156 });
    piece(g, rect(96, 560, 120, 230), { color: dark(C.coal, 0.2), h: 0, alpha: 0.45, seed: 157 });
    fixedRamp(g);
    asphalt(g, mix(C.coal, C.navy, 0.3));
  }), 0, 0);
  // wet ground: the sky lying in it
  ctx.save();
  for (let i = 0; i < 26; i++) {
    const R = mul32(i * 53 + 9), x = rd(R, 0, SIZE), y = rd(R, GY + 8, GY + 190), w = rd(R, 40, 220);
    const a = 0.05 + 0.07 * (0.5 + 0.5 * Math.sin(k * 0.5 + i));
    ctx.fillStyle = rgba(lite(C.steel, 0.5), a); ctx.fillRect(x, y, w, 2.2);
  }
  ctx.restore();
  const shift = easeInOut(span(s, 2.2, 3.4));
  horse(ctx, WIDE, 292, { nod: 26 + 5 * Math.sin(s * 1.3), legs: [0, 0, 6 * shift, 0], flick: 2.5 * Math.sin(s * 4.2) * (s > 1 && s < 2.4 ? 1 : 0.2) });
  tint(ctx, DUSK);
  rainFall(ctx, k, { n: 210, y1: GY + 230, a: 0.55, len: 46 });
  // where it lands on the line
  ctx.save(); ctx.strokeStyle = rgba(lite(C.steel, 0.6), 0.5); ctx.lineWidth = 1.6;
  for (let i = 0; i < 16; i++) {
    const R = mul32((k + i * 7) * 31 + i), x = rd(R, 0, SIZE), y = GY + rd(R, 2, 200), r = 3 + ((k + i) % 4) * 3.5;
    ctx.globalAlpha = 0.6 - ((k + i) % 4) * 0.14;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.3, 0, 0, 6.283); ctx.stroke();
  }
  ctx.restore();
});

const DOOR = cam(0, 3.4);
const BOY = dark(C.slate, 0.12), GROWN = dark(C.slate, 0.34);

// Scene 2 · arrive — a boy walks up to the riding centre and goes in.
// The sign's wording is Sean's (2026-11-15).
export const arrive = scene('arrive', 5, (ctx, s, { k, env }) => {
  ctx.drawImage(cached('arrive-back', (g) => {
    duskSky(g, 11);
    const tones = [mix(C.coal, C.grass, 0.2), dark(C.slate, 0.3), mix(C.coal, C.grass, 0.32)];
    tree(g, 130, 470, 170, 401, tones);
    // the front of the building
    piece(g, rect(330, 170, 780, 620), { color: dark(C.coal, 0.02), h: 8, seed: 402, comb: { angle: Math.PI / 2, gap: 26, a: 0.25 } });
    piece(g, [[290, 196], [1120, 120], [1120, 160], [300, 232]], { color: dark(C.coal, 0.32), h: 9, seed: 403 });
    // the door, open, light inside
    piece(g, rect(650, 452, 196, 338), { color: mix(C.cedar, C.cream, 0.5), h: -0, edge: 1.5, seed: 404 });
    piece(g, rect(650, 700, 196, 90), { color: mix(C.cedar, C.coal, 0.25), h: 0, rough: 0, alpha: 0.5, seed: 405 });
    piece(g, strip([[642, 790], [642, 444], [854, 444], [854, 790]], 14), { color: dark(C.coal, 0.3), h: 4, rough: 0.4, seed: 406 });
    piece(g, rect(880, 520, 120, 110), { color: mix(C.cedar, C.cream, 0.35), h: -0, edge: 1.4, seed: 407 }); // a lit window
    for (const [a, b] of [[[940, 520], [940, 630]], [[880, 575], [1000, 575]]]) piece(g, bar(a, b, 8), { color: dark(C.coal, 0.3), h: 2, rough: 0.3 });
    // the sign over the door
    piece(g, rect(446, 252, 608, 150), { color: lite(C.cream, 0.1), h: 7, rough: 1.1, seed: 408 });
    piece(g, strip([[458, 264], [1042, 264], [1042, 390], [458, 390], [458, 264]], 3), { color: dark(C.cedar, 0.3), h: 0, rough: 0, edge: 0, alpha: 0.7 });
    for (const x of [470, 1030]) piece(g, circle(x, 276, 4, 8), { color: C.steel, h: 1, rough: 0 });
    asphalt(g, mix(C.coal, C.navy, 0.3));
  }), 0, 0);
  const R = env.still('arrive-sign');
  const pen = { align: 'center', color: INK, alpha: 0.92, width: 4.2, amp: 0.8 };
  hand(ctx, R, 'center for equestrian', 750, 320, 24, pen);
  hand(ctx, R, 'assisted services', 750, 372, 24, pen);
  // the boy, up the path and through the door
  const u = easeInOut(span(s, 0.2, 4.3)), x = lerp(-14, 222, u), inside = span(s, 3.7, 4.5);
  const g = scratch('stage');
  walker(g, DOOR, x, 0, { k: 0.8, color: BOY, phase: u > 0 && u < 1 ? (x / 21) * 6.283 : null, torso: 7 });
  ctx.save(); ctx.globalAlpha = 1 - inside; ctx.drawImage(g.canvas, 0, 0); ctx.restore();
  tint(ctx, DUSK);
  bloom(ctx, 748, 640, 300, [255, 214, 160], 0.3);
  bloom(ctx, 940, 575, 130, [255, 214, 160], 0.2);
  rainFall(ctx, k, { n: 170, y1: GY + 230, a: 0.5, len: 44, seed: 17 });
});

/** Two-link reach: the arm angles that put a doll's hand on a target. */
function reach(sh, to, sc, dir) {
  const l1 = 36 * sc, l2 = 34 * sc, ux = dir * (to[0] - sh[0]), uy = to[1] - sh[1];
  const D = Math.min(l1 + l2 - 0.5, Math.max(4, Math.hypot(ux, uy))), phi = Math.atan2(ux, uy);
  const al = Math.acos((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D)), be = Math.acos((l2 * l2 + D * D - l1 * l1) / (2 * l2 * D));
  return [((phi - al) * 180) / Math.PI, ((al + be) * 180) / Math.PI];
}

/** The plank wall inside the centre; the note scene is held up against the same boards. */
function boards(g) {
  piece(g, rect(-10, -10, 1100, 1100), { color: dark(C.cedar, 0.62), h: 0, rough: 0, seed: 160 });
  for (let i = 0; i < 7; i++) piece(g, rect(-6 + i * 157, -10, 151, 1100), { color: dark(C.cedar, 0.5 + 0.04 * ((i * 7) % 3)), h: 3, rough: 0.8, seed: 161 + i, comb: { angle: Math.PI / 2 + 0.01, gap: 9, wave: 5, a: 0.2 } });
  piece(g, rect(-10, 60, 1100, 70), { color: dark(C.cedar, 0.66), h: 6, seed: 170, comb: { angle: 0, gap: 8, a: 0.2 } });
}

const TALK = cam(0, 5.2);
// Scene 3 · shake — the boy and someone from the centre agree on it.
export const shake = scene('shake', 4.5, (ctx, s, { k, env }) => {
  ctx.drawImage(cached('shake-back', (g) => {
    boards(g);
    // a window with the rain in it, and a horseshoe
    piece(g, rect(96, 230, 236, 250), { color: dark(C.coal, 0.2), h: 5, seed: 411 });
    piece(g, rect(112, 246, 204, 218), { color: mix(C.navy, C.steel, 0.4), h: -0, edge: 1.4, seed: 412 });
    for (const [a, b] of [[[214, 246], [214, 464]], [[112, 355], [316, 355]]]) piece(g, bar(a, b, 9), { color: dark(C.coal, 0.2), h: 2, rough: 0.3 });
    piece(g, strip(circle(880, 300, 34, 16).slice(1, 13), 11), { color: C.steel, h: 3, rough: 0.3, seed: 413 });
    asphalt(g, mix(dark(C.cedar, 0.5), C.coal, 0.4));
  }), 0, 0);
  ctx.save(); ctx.beginPath(); ctx.rect(112, 246, 204, 218); ctx.clip();
  rainFall(ctx, k, { n: 40, x0: 100, x1: 380, y0: 236, y1: 474, a: 0.6, len: 24, seed: 19 });
  ctx.restore();
  // they step in, reach, and shake on it
  const step = easeOut(span(s, 0.1, 1.1)), out = easeInOut(span(s, 1.0, 1.6));
  const pump = s > 1.6 && s < 2.9 ? Math.sin((s - 1.6) * 9.67) * 11 : 0;
  const meet = [540, GY - 41 * TALK.s + pump];
  const fig = (xin, dir, kk, color, torso) => {
    const sc = human(TALK, kk), [fx, fy] = TALK(xin, 0), t = (torso * Math.PI) / 180;
    const sh = [fx + dir * Math.sin(t) * 64 * sc, fy - 98 * sc - Math.cos(t) * 64 * sc];
    const [a1, a2] = reach(sh, [meet[0] - dir * 5, meet[1]], sc, dir);
    walker(ctx, TALK, xin, 0, { k: kk, dir, color, torso, head: dir > 0 ? -8 : 6, phase: step < 1 ? step * 9 : null, armF: [lerp(6, a1, out), lerp(14, a2, out)], armB: [-6, 12] });
  };
  fig(lerp(56, 84.5, step), 1, 0.8, BOY, 6);
  fig(lerp(152, 124.5, step), -1, 1, GROWN, 5);
  tint(ctx, [255, 240, 222]);
  caption(ctx, env.still('shake-cap'), 'an eagle scout project', easeInOut(span(s, 2.3, 3.6)), SIZE, { color: C.cream, y: 950, x: 96, scale: 0.03 });
});

export const ask = scene('ask', 4, (ctx, s, { k, env }) => {
  ctx.drawImage(cached('ask-back', (g) => {
    boards(g);
    piece(g, strip([[990, 480], [990, 610]], 16), { color: dark(C.coal, 0.1), h: 5, rough: 0.3, seed: 171 }); // a latch
  }), 0, 0);
  const [jx, jy] = tremor(k, 21, 0.5);
  ctx.save(); ctx.translate(jx, jy);
  piece(ctx, rect(236, 300, 608, 560), { color: lite(C.cream, 0.25), h: 9, rough: 1.4, seed: 172 });
  ctx.save(); ctx.strokeStyle = rgba(C.navy, 0.13); ctx.lineWidth = 1.5;
  for (let y = 420; y < 840; y += 60) { if (y === 780) continue; ctx.beginPath(); ctx.moveTo(262, y); ctx.lineTo(818, y); ctx.stroke(); }
  ctx.restore();
  const R = env.still('ask-note');
  // a quick pencil idea of the thing: a slope, and a wheel on it
  const o = { color: INK, width: 4.5, alpha: 0.7, amp: 2.2, taper: false };
  pencil(ctx, R, [[330, 560], [540, 562], [750, 560]], { ...o, upTo: easeInOut(span(s, 0.3, 0.7)) });
  pencil(ctx, R, [[330, 558], [540, 508], [750, 462]], { ...o, upTo: easeInOut(span(s, 0.7, 1.15)) });
  pencil(ctx, R, [[750, 460], [751, 560]], { ...o, upTo: easeInOut(span(s, 1.15, 1.35)) });
  pencil(ctx, R, circle(560, 474, 27, 26).concat([[587, 474]]), { ...o, amp: 1.2, upTo: easeInOut(span(s, 1.4, 1.85)) });
  hand(ctx, R, 'a ramp', 330, 716, 62, { color: INK, upTo: easeInOut(span(s, 2.0, 2.9)), alpha: 0.92, width: 6.5 });
  // the underline lies on the anchor
  pencil(ctx, R, [[318, GY], [540, GY - 1], [762, GY]], { color: INK, width: 6.5, alpha: 0.92, amp: 1.6, upTo: easeInOut(span(s, 3.0, 3.5)), taper: false });
  ctx.restore();
  // two hands hold it up
  const skin = dark(C.slate, 0.22);
  for (const d of [-1, 1]) {
    const cx = 540 + d * 300 + jx, wr = [cx + d * 6, 872 + jy];
    piece(ctx, capsule([cx + d * 70, 1130], [wr[0] + d * 8, wr[1] + 30], 104, 84), { color: skin, h: 7, rough: 0, seed: 180 + d });
    piece(ctx, blob([[wr[0] - 50, wr[1] + 50], [wr[0] - 54, wr[1] - 30], [wr[0] - 20, wr[1] - 56], [wr[0] + 30, wr[1] - 50], [wr[0] + 54, wr[1] - 10], [wr[0] + 50, wr[1] + 50]], 2), { color: skin, h: 7, rough: 0, seed: 182 + d });
    piece(ctx, capsule([wr[0] - d * 30, wr[1] + 6], [wr[0] - d * 84, wr[1] - 34], 34, 28), { color: skin, h: 5, rough: 0, seed: 184 + d }); // thumb over the note
  }
});

export const eighteen = scene('eighteen', 4, (ctx, s, { env }) => {
  ctx.drawImage(cached('eighteen-back', (g) => {
    piece(g, rect(-10, -10, 1100, 1100), { color: dark(C.slate, 0.18), h: 0, rough: 0, seed: 190, comb: { angle: Math.PI / 2, gap: 46, a: 0.2 } });
    piece(g, rect(-10, GY + 14, 1100, 320), { color: dark(C.slate, 0.34), h: 0, rough: 0, seed: 191, comb: { angle: Math.PI / 2, gap: 46, a: 0.2 } });
    for (const x of [250, 800]) piece(g, [[x, GY + 14], [x + 22, GY + 14], [x + 22, GY + 40], [x, GY + 96]], { color: dark(C.cedar, 0.5), h: 4, seed: 192 + x });
    piece(g, rect(150, GY, 780, 17), { color: dark(C.cedar, 0.2), h: 8, rough: 0.8, seed: 193, comb: { angle: 0, gap: 4, a: 0.2 } });
    // what else is on the shelf: pencils in a tin, a few books lying flat
    piece(g, rect(232, GY - 74, 56, 74), { color: C.steel, h: 4, seed: 197 });
    for (const [x, a, c] of [[244, -0.16, C.cedar], [262, 0.05, dark(C.cream, 0.2)], [276, 0.2, mix(C.cedar, C.coal, 0.4)]]) piece(g, bar([x, GY - 70], [x + a * 60, GY - 132], 7), { color: c, h: 2, rough: 0.2, seed: 198 + x });
    [[760, 92, C.navy], [770, 80, dark(C.grass, 0.3)], [764, 86, dark(C.cedar, 0.35)]].forEach(([x, w, c], i) => piece(g, rect(x, GY - 22 * (i + 1), w, 21), { color: mix(c, C.slate, 0.35), h: 3, seed: 199 + i }));
    // the pad's backing and binding
    piece(g, rect(376, 366, 328, 414), { color: dark(C.coal, 0.1), h: 6, seed: 194 });
  }), 0, 0);
  const R = env.still('eighteen');
  const page = (num, tone = 0) => {
    piece(ctx, rect(390, 426, 300, 354), { color: lite(C.cream, 0.3 - tone), h: 3, rough: 0.9, seed: 195 });
    hand(ctx, R, num, 540, 700, 92, { align: 'center', color: INK, width: 12, alpha: 0.95, amp: 2, slant: 0.06 });
  };
  const tears = [['16', 0.45], ['17', 1.65]];
  // what is left on the pad
  const top = s < tears[0][1] ? 0 : s < tears[1][1] ? 1 : 2;
  page(['16', '17', '18'][Math.min(2, top + (top < 2 ? 1 : 0))], 0.06);
  if (top < 2 && s < tears[top][1]) page(tears[top][0]);
  piece(ctx, rect(376, 366, 328, 66), { color: C.steel, h: 5, rough: 0.5, seed: 196 });
  for (const x of [470, 610]) piece(ctx, circle(x, 399, 13, 16), { color: dark(C.coal, 0.2), h: -0, rough: 0, edge: 1.3 });
  // pages torn off, falling past the shelf, lying where they land
  tears.forEach(([num, t0], i) => {
    const u = span(s, t0, t0 + 0.85);
    if (u <= 0) return;
    const fall = easeIn(u), rot = (i ? -1 : 1) * (10 + 62 * easeOut(u)) * (Math.PI / 180);
    const x = lerp(0, i ? -170 : 210, easeOut(u)), y = lerp(0, 900, fall) - 40 * Math.sin(Math.PI * Math.min(1, u * 2.2));
    ctx.save();
    if (u >= 1) return;
    ctx.translate(540 + x, 603 + y); ctx.rotate(rot); ctx.translate(-540, -603);
    page(num);
    ctx.restore();
  });
  caption(ctx, env.still('eighteen-cap'), 'before eighteen', easeInOut(span(s, 2.4, 3.4)), SIZE, { color: C.cream, y: 950, x: 96, scale: 0.03 });
});
