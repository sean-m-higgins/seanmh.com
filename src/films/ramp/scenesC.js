// Act III · the steel, by day: cut, numbered.
// Sources: IMG_1862 (ten-foot angle stock), IMG_2105 (the reciprocating saw
// on sawhorses), IMG_2230 (chalked part numbers 6 and 3), IMG_2231 (laying
// out and measuring a frame on the driveway).

import { mul32, rd } from '../../lib/draw/rng.js';
import { mix } from '../../lib/draw/color.js';
import { hand } from '../../lib/draw/hand.js';
import { C, GY, dark, lite, piece, rect, bar, circle, capsule, strip, blob, cached, scene, tremor, onStage } from './kit.js';
import { cam, RAW, walker, human, drivewaySky, drivewayFront, asphalt, tint } from './parts.js';
import { span, easeOut, easeInOut, easeIn, lerp } from '../common.js';

const CUT = cam(60, 4.6);
const TEEN = dark(C.slate, 0.12), ADULT = dark(C.slate, 0.34);

function sawhorse(ctx, x) {
  const c = dark(C.coal, 0.05), P = (a, b) => CUT(x + a, b);
  piece(ctx, bar(P(-2, 28), P(-9, 0), 13), { color: c, h: 3, rough: 0.4, seed: 201 });
  piece(ctx, bar(P(2, 28), P(9, 0), 13), { color: c, h: 3, rough: 0.4, seed: 202 });
  piece(ctx, bar(P(-6, 10), P(6, 10), 9), { color: c, h: 2, rough: 0.3, seed: 203 });
  piece(ctx, rect(...P(-8, 30.5), 16 * CUT.s, 3 * CUT.s), { color: mix(C.cedar, C.cream, 0.2), h: 3, rough: 0.4, seed: 204 });
}

export const cut = scene('cut', 6, (bg, s, { k }) => {
  // weeks: the sun and the moon keep crossing while the saw keeps going
  const th = (s / 6) * 3 * 6.2832, sun = [540 - 500 * Math.cos(th), 700 - 520 * Math.sin(th)], moon = [540 + 500 * Math.cos(th), 700 + 520 * Math.sin(th)];
  const night = Math.min(1, Math.max(0, 0.5 - Math.sin(th) * 2.2));
  bg.drawImage(cached('cut-sky', (g) => drivewaySky(g, { sun: false })), 0, 0);
  piece(bg, circle(sun[0], sun[1], 58, 32), { color: lite(C.cream, 0.6), h: 4, rough: 0, seed: 210 });
  piece(bg, circle(moon[0], moon[1], 40, 28), { color: C.galv, h: 4, rough: 0, seed: 211 });
  piece(bg, circle(moon[0] + 15, moon[1] - 8, 34, 24), { color: mix(C.galv, C.navy, 0.3), h: 0, rough: 0, edge: 0, seed: 212 });
  tint(bg, [120, 126, 172], night * 0.85);
  bg.drawImage(cached('cut-front', (g) => { drivewayFront(g, { garage: false }); asphalt(g); }), 0, 0);
  tint(bg, [150, 156, 200], night * 0.55);

  const T = 1.6, c = Math.min(2, Math.floor(Math.max(0, s - 0.3) / T)), u = Math.max(0, s - 0.3) - c * T; // which cut, and seconds into it
  const sawing = s > 0.3 && u < 1.0 && s < 0.3 + 3 * T;
  const fed = c * 10 + 10 * easeInOut(span(u, 1.1, 1.5)); // the stock is fed along after each cut
  const stroke = sawing ? Math.sin(k * 2.4) * 2.6 : 0;
  onStage(bg, (ctx) => {
    walker(ctx, CUT, 40 + fed * 0.5, 0, { k: 0.93, color: TEEN, torso: 8, armF: [44, 34], armB: [34, 30] });
    sawhorse(ctx, 62); sawhorse(ctx, 148);
    // ten feet of steel angle, and the end that is about to come off
    const y = 33.6, x1 = 162, x0 = x1 - 132 + fed;
    piece(ctx, [CUT(x0, y + 2.2), CUT(x1, y + 2.2), CUT(x1, y), CUT(x0, y)], { color: RAW, h: 3, rough: 0.3, seed: 220 });
    const drop = u >= 1.0 ? span(u, 1.0, 1.32) : 0;
    const off = (i, d) => { // an offcut: falling, or lying where it fell
      const yy = Math.max(1.2 + i * 2.3, y - easeIn(d) * (y - 1.2 - i * 2.3) + (d >= 1 ? 0 : 0));
      piece(ctx, turnAbout([CUT(x1 + 0.6, yy + 2.2), CUT(x1 + 10.6, yy + 2.2), CUT(x1 + 10.6, yy), CUT(x1 + 0.6, yy)], d < 1 ? d * 0.5 : 0.06 * (i % 2 ? 1 : -1)), { color: RAW, h: 2.5, rough: 0.3, seed: 230 + i });
    };
    for (let i = 0; i < c; i++) off(i, 1);
    if (u < 1.32 && s < 0.3 + 3 * T) off(c, drop); else if (s >= 0.3 + 3 * T || u >= 1.32) off(c, 1);
    // the reciprocating saw: shoe against the steel, blade through the cut line
    const C0 = CUT(x1 + 0.3, y + 1.1), d = [-0.819, 0.574], n = [0.574, 0.819], q = 1.25;
    const R2 = mul32(k * 71 + 3), shake = sawing ? (R2() - 0.5) * 2.4 : 0;
    const at = (along, side = 0, st = 0) => [C0[0] + d[0] * (along * q + st) + n[0] * side * q + shake * 0.4, C0[1] + d[1] * (along * q + st) + n[1] * side * q + shake];
    const sc = human(CUT), px = 203, torso = 20;
    const [fx0, fy0] = CUT(px, 0), sh = [fx0 - Math.sin((torso * Math.PI) / 180) * 64 * sc, fy0 - 98 * sc - Math.cos((torso * Math.PI) / 180) * 64 * sc];
    const who = (part) => walker(ctx, CUT, px, 0, { k: 1, dir: -1, color: ADULT, torso, head: 12, armF: reach(sh, at(-168, 0), sc, -1), armB: reach(sh, at(-84, -18), sc, -1), doll: { part } });
    who('back');
    const tool = dark(C.coal, 0.05), shell = lite(C.steel, 0.25);
    const c0 = at(-176), c1 = [c0[0] + 70, c0[1] + 60], c2 = [c0[0] + 60, GY - 10], cord = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, u = 1 - t; cord.push([u * u * c0[0] + 2 * u * t * c1[0] + t * t * c2[0], u * u * c0[1] + 2 * u * t * c1[1] + t * t * c2[1]]); }
    cord.push([c2[0] + 60, GY - 5], [1100, GY - 5]);
    piece(ctx, strip(cord, 5), { color: tool, h: 1.5, rough: 0, seed: 241 }); // its cord
    piece(ctx, bar(at(-30, 0, stroke * 3), at(34, 0, stroke * 3), 7), { color: lite(C.galv, 0.4), h: 1.5, rough: 0 }); // blade
    piece(ctx, bar(at(-25, -15), at(-25, 15), 6), { color: C.galv, h: 2, rough: 0 }); // shoe
    piece(ctx, capsule(at(-28), at(-54), 18, 24), { color: C.galv, h: 2.5, rough: 0, seed: 242 }); // nose
    piece(ctx, capsule(at(-52), at(-118), 38, 46), { color: shell, h: 3.5, rough: 0, seed: 243 }); // motor housing
    for (const v of [-86, -96, -106]) piece(ctx, bar(at(v, -12), at(v, 12), 3.5), { color: dark(C.steel, 0.35), h: 0, rough: 0, grain: 0, edge: 0 }); // vents
    piece(ctx, bar(at(-68, -20), at(-68, 20), 7), { color: tool, h: 1, rough: 0 });
    piece(ctx, strip([at(-114, -19), at(-162, -21), at(-174, 0), at(-164, 19), at(-116, 21)], 14), { color: tool, h: 3, rough: 0, seed: 244 }); // D handle
    who('front');
    piece(ctx, circle(...at(-84, -18), 10, 10), { color: dark(ADULT, 0.3), h: 2, rough: 0 }); // the far hand, on the housing
    if (sawing) { // filings
      const R = mul32(k * 53 + 7), [fx, fy] = CUT(x1, y);
      for (let i = 0; i < 9; i++) piece(ctx, circle(fx + rd(R, -16, 22), fy + rd(R, 4, 90), rd(R, 1.4, 3), 6), { color: lite(C.steel, 0.4), h: 1, rough: 0, grain: 0 });
    }
  });
  // spent blades, thrown down in front; the pile is the calendar
  const R = mul32(31);
  const spent = 5 + c * 3 + Math.floor(span(u, 1.0, 1.5) * 3);
  for (let i = 0; i < 14; i++) {
    const x = rd(R, 800, 990), yb = rd(R, 850, 940), a = rd(R, -0.7, 0.7);
    if (i >= spent) continue;
    piece(bg, bar([x - 30 * Math.cos(a), yb - 30 * Math.sin(a)], [x + 30 * Math.cos(a), yb + 30 * Math.sin(a)], 7), { color: i % 3 ? C.steel : C.galv, h: 2.5, rough: 0.3, seed: 250 + i, comb: { angle: a + 1.57, gap: 4, a: 0.3 } });
  }
  tint(bg, [255, 240, 222], 1 - night);
});

/** Two-link reach: the arm angles that put a doll's hand on a target. */
function reach(sh, to, sc, dir) {
  const l1 = 36 * sc, l2 = 34 * sc, ux = dir * (to[0] - sh[0]), uy = to[1] - sh[1];
  const D = Math.min(l1 + l2 - 0.5, Math.max(4, Math.hypot(ux, uy))), phi = Math.atan2(ux, uy);
  const al = Math.acos((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D)), be = Math.acos((l2 * l2 + D * D - l1 * l1) / (2 * l2 * D));
  return [((phi - al) * 180) / Math.PI, ((al + be) * 180) / Math.PI];
}

function turnAbout(pts, a) {
  const cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
}

/** A length of angle seen from above: the flat leg, and the upright leg as a pale edge. */
function angleTop(ctx, a, b, seed) {
  piece(ctx, bar(a, b, 28), { color: RAW, h: 5, rough: 0.5, seed, comb: { angle: Math.atan2(b[1] - a[1], b[0] - a[0]), gap: 5, a: 0.12 } });
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = (-(b[1] - a[1]) / L) * 10, ny = ((b[0] - a[0]) / L) * 10;
  piece(ctx, bar([a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], 6), { color: lite(RAW, 0.3), h: 2, rough: 0.2, seed: seed + 1 });
}

export const numbered = scene('numbered', 4, (ctx, s, { k, env }) => {
  ctx.drawImage(cached('numbered-back', (g) => {
    piece(g, rect(-10, -10, 1100, 1100), { color: mix(C.coal, C.slate, 0.5), h: 0, rough: 0, seed: 260, comb: { angle: 0.6, gap: 12, wave: 10, a: 0.14 } });
    const R = mul32(261);
    for (let i = 0; i < 30; i++) { // crazed asphalt, as in IMG_2230
      let x = rd(R, 0, 1080), y = rd(R, 0, 1080); const pts = [[x, y]]; let a = rd(R, 0, 6.28);
      for (let j = 0; j < 9; j++) { a += rd(R, -0.9, 0.9); x += Math.cos(a) * rd(R, 20, 60); y += Math.sin(a) * rd(R, 20, 60); pts.push([x, y]); }
      piece(g, strip(pts, rd(R, 2, 4.5)), { color: dark(C.coal, 0.45), h: 0, rough: 0, grain: 0, edge: 0.5, alpha: 0.7 });
    }
  }), 0, 0);
  // the piece on the anchor is already down; the rest are slid in, one at a time
  const parts = [
    [[150, GY], [930, GY], [0, 0]],
    [[250, 322], [250, GY - 15], [-230, 0]],
    [[236, 322], [844, 322], [0, -250]],
    [[830, 336], [830, GY - 15], [240, 0]],
    [[540, 336], [540, GY - 15], [0, -240]],
    [[264, GY - 22], [526, 344], [-200, 160]],
  ];
  parts.forEach(([a, b, from], i) => {
    const u = i === 0 ? 1 : span(s, 0.15 + 0.42 * (i - 1), 0.6 + 0.42 * (i - 1));
    if (u <= 0) return;
    const e = 1 - easeOut(u);
    angleTop(ctx, [a[0] + from[0] * e, a[1] + from[1] * e], [b[0] + from[0] * e, b[1] + from[1] * e], 270 + i * 3);
  });
  const R = env.still('numbered');
  const chalk = { color: C.cream, alpha: 0.9, width: 5, amp: 1.4 };
  hand(ctx, R, '6', 292, 590, 30, { ...chalk, upTo: easeInOut(span(s, 0.75, 1.1)) });
  hand(ctx, R, '3', 640, 290, 30, { ...chalk, upTo: easeInOut(span(s, 1.2, 1.55)) });
  // measure twice: a tape runs out along the anchor piece
  const t = easeInOut(span(s, 2.5, 3.5)), end = lerp(170, 790, t), [jx, jy] = tremor(k, 31, 0.4);
  if (s > 2.2) {
    const inn = easeOut(span(s, 2.2, 2.6)), ox = -200 * (1 - inn);
    if (t > 0) piece(ctx, rect(160, GY + 26, end - 160, 15), { color: mix(C.cream, C.cedar, 0.18), h: 2, rough: 0.2, seed: 290, comb: { angle: Math.PI / 2, gap: 15.5, a: 0.5 } });
    if (t > 0) piece(ctx, rect(end - 3, GY + 20, 7, 26), { color: C.steel, h: 2, rough: 0 });
    piece(ctx, capsule([40 + ox + jx, 1110], [128 + ox + jx, 866 + jy], 70, 54), { color: dark(C.slate, 0.34), h: 7, rough: 0, seed: 291 });
    piece(ctx, blob(rect(104 + ox, GY + 4, 66, 62), 1), { color: dark(C.coal, 0.05), h: 5, rough: 0, seed: 292 });
    piece(ctx, circle(137 + ox, GY + 35, 17, 16), { color: C.steel, h: 1.5, rough: 0 });
    piece(ctx, capsule([112 + ox + jx, 850 + jy], [150 + ox + jx, 838 + jy], 26, 22), { color: dark(C.slate, 0.34), h: 5, rough: 0, seed: 293 });
  }
});
