// Scene 9 · weld — night in the garage. The film's one hot accent.
// Source: IMG_2243 (sparks, frames laid on the floor, the work-light tripod,
// spare wheels, the cord on the driveway). Signs, flags and brands left out.

import { mul32, rd } from '../../lib/draw/rng.js';
import { mix } from '../../lib/draw/color.js';
import {
  C, GY, dark, lite, piece, rect, bar, circle, strip, blob, doll, cached, scene,
  setLight, noLight, darkness, halo, bloom, sparks, look, tremor,
} from './kit.js';
import { span, easeOut, easeInOut, lerp } from '../common.js';

/** The garage floor: X across (±1 at the front edge), Z depth (1 = the slab's edge, the anchor). */
const fl = (X, Z) => [540 + (X * 540) / Z, 330 + 450 / Z];
const RAW = mix(mix(C.steel, C.slate, 0.3), C.cedar, 0.16);

/** A length of steel angle lying on the floor between two floor points. */
function steel(ctx, a, b, o = {}) {
  const w = 0.06, along = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
  const q = along
    ? [fl(a[0], a[1] + w / 2), fl(b[0], b[1] + w / 2), fl(b[0], b[1] - w / 2), fl(a[0], a[1] - w / 2)]
    : [fl(a[0] - w / 2, a[1]), fl(a[0] + w / 2, a[1]), fl(b[0] + w / 2, b[1]), fl(b[0] - w / 2, b[1])];
  piece(ctx, q, { color: RAW, h: 2.2, rough: 0.35, grain: 0.9, seed: Math.round(a[0] * 97 + a[1] * 31 + b[0] * 57 + b[1] * 13) + 400, ...o });
}

// Frame A is finished. Frame B is welded member by member during the scene.
const FRAME_A = [
  [[-1.9, 2.3], [-0.42, 2.3]], [[-1.9, 1.3], [-1.9, 2.3]], [[-1.16, 1.3], [-1.16, 2.3]], [[-0.42, 1.3], [-0.42, 2.3]],
  [[-1.16, 2.3], [-0.42, 1.3]], [[-1.9, 1.3], [-0.42, 1.3]],
];
const FRAME_B = [
  [[0.1, 2.5], [1.5, 2.5]], [[0.1, 1.36], [0.1, 2.5]], [[0.1, 1.36], [1.5, 1.36]], // there at the start
  [[0.8, 1.36], [0.8, 2.5]], [[1.5, 1.36], [1.5, 2.5]], [[0.1, 2.5], [0.8, 1.36]], // the cross-member arrives for the second weld
];
/** Each weld: when it starts, how long it burns, where (floor coords), and which member arrives before it. */
export const WELDS = [
  { at: 0.5, burn: 1.7, p: [0.1, 1.36], adds: -1 },
  { at: 2.9, burn: 1.3, p: [0.8, 1.36], adds: 3 },
  { at: 5.0, burn: 2.4, p: [-0.42, 1.3], adds: 14 }, // the second pair of hands
];

function backdrop(g) {
  // the driveway, below the anchor
  piece(g, rect(-10, GY - 4, 1100, 320), { color: mix(C.coal, C.slate, 0.4), h: 0, rough: 0, comb: { angle: 0.5, gap: 13, wave: 9, a: 0.16 }, seed: 11 });
  const R = mul32(77);
  for (let i = 0; i < 9; i++) { // cracks, scored
    let x = rd(R, 0, 1080), y = rd(R, 800, 1070); const pts = [[x, y]];
    for (let j = 0; j < 7; j++) { x += rd(R, -50, 50); y += rd(R, -22, 22); pts.push([x, y]); }
    piece(g, strip(pts, 2.2), { color: dark(C.coal, 0.5), h: 0, rough: 0, grain: 0, edge: 0, alpha: 0.55 });
  }
  // back wall
  piece(g, rect(-10, -10, 1100, 456), { color: dark(C.slate, 0.12), h: 0, rough: 0, comb: { angle: Math.PI / 2, gap: 34, a: 0.22 }, seed: 12 });
  // a door
  piece(g, rect(150, 138, 118, 306), { color: mix(C.slate, C.steel, 0.3), h: 3, seed: 13 });
  for (const [y, hh] of [[156, 96], [268, 70], [354, 74]]) piece(g, rect(166, y, 86, hh), { color: mix(C.slate, C.steel, 0.16), h: -0, edge: 1.4, seed: 14 + y });
  piece(g, circle(256, 300, 5, 10), { color: C.steel, h: 1.5, rough: 0 });
  // shelves and what is on them: plain boxes, tins, jars
  const pens = [C.slate, C.steel, dark(C.cedar, 0.25), dark(C.grass, 0.3), mix(C.navy, C.steel, 0.25), dark(C.cream, 0.35)];
  for (const [sy, x0, x1] of [[150, 320, 720], [236, 320, 720], [322, 320, 640]]) {
    let x = x0 + 10;
    while (x < x1 - 30) {
      const w = rd(R, 22, 62), hh = rd(R, 26, 66);
      const c = pens[Math.floor(R() * pens.length)];
      if (R() < 0.82) piece(g, R() < 0.3 ? blob(rect(x, sy - hh, w * 0.7, hh), 1) : rect(x, sy - hh, w, hh), { color: dark(c, 0.1), h: 2.5, seed: Math.round(x * 3 + sy) });
      x += w + rd(R, 3, 16);
    }
    piece(g, rect(x0, sy, x1 - x0, 9), { color: dark(C.cedar, 0.35), h: 4, seed: sy });
  }
  // boards stacked along the wall
  for (let i = 0; i < 5; i++) piece(g, rect(660 + i * 9, 398 - i * 13, 370 - i * 22, 12), { color: dark(C.cedar, 0.2 + 0.05 * i), h: 2.5, seed: 300 + i });
  // the slab
  piece(g, [[-10, 446], [1090, 446], [1090, GY], [-10, GY]], { color: mix(C.steel, C.slate, 0.42), h: 6, rough: 1.3, comb: { angle: 0.05, gap: 9, wave: 5, a: 0.13, len: 20 }, seed: 15 });
  for (let i = 0; i < 5; i++) { // old stains
    const x = rd(R, 80, 1000), z = rd(R, 1.1, 3.6), [, y] = fl(0, z);
    piece(g, blob(circle(x, y, rd(R, 40, 110) / z, 9, rd(R, 16, 40) / z).map(([px, py]) => [px + rd(R, -8, 8), py + rd(R, -4, 4)]), 2), { color: mix(C.slate, C.steel, 0.3), h: 0, rough: 0, edge: 0, alpha: 0.35 });
  }
}

/** The work lights on their tripod, unlit: the arc is the only light. */
function tripod(ctx) {
  const [x, y] = fl(0.66, 1.08);
  const leg = dark(C.steel, 0.15);
  piece(ctx, bar([x, y - 60], [x - 62, y + 22], 7), { color: leg, h: 3, rough: 0 });
  piece(ctx, bar([x, y - 60], [x + 66, y + 26], 7), { color: leg, h: 3, rough: 0 });
  piece(ctx, bar([x, y - 60], [x + 8, y - 6], 7), { color: leg, h: 3, rough: 0 });
  piece(ctx, bar([x, y - 40], [x, 232], 8), { color: leg, h: 4, rough: 0.3 });
  piece(ctx, bar([x - 74, 236], [x + 74, 236], 8), { color: leg, h: 4, rough: 0.3 });
  for (const sx of [-1, 1]) {
    const cx = x + sx * 62;
    piece(ctx, blob(rect(cx - 36, 160, 72, 60), 1), { color: mix(C.slate, C.steel, 0.25), h: 5, seed: 40 + sx });
    piece(ctx, rect(cx - 27, 170, 54, 38), { color: dark(C.galv, 0.45), h: 0, edge: 1.3, seed: 44 + sx });
    piece(ctx, strip([[cx - 22, 160], [cx - 16, 138], [cx + 16, 138], [cx + 22, 160]], 5), { color: leg, h: 2, rough: 0 });
  }
}

const WX = 985;
function wheels(ctx) {
  for (const [y, s] of [[742, 1], [712, 0.97]]) {
    piece(ctx, circle(WX, y, 58 * s, 26, 21 * s), { color: dark(C.coal, 0.1), h: 5, rough: 0, seed: 50, comb: { angle: 1.57, gap: 9, a: 0.3 } });
    piece(ctx, circle(WX, y - 3, 30 * s, 20, 10 * s), { color: C.galv, h: 0, rough: 0, edge: 1.2 });
    piece(ctx, circle(WX, y - 3, 9 * s, 10, 3 * s), { color: C.slate, h: 0, rough: 0, edge: 0 });
  }
}

/** Out on the driveway, close to us: a sawhorse and the uncut stock, as a dark foreground layer. */
function foreground(ctx) {
  const c = dark(C.coal, 0.3);
  piece(ctx, bar([-40, 838], [330, 872], 20), { color: mix(C.steel, C.slate, 0.55), h: 9, rough: 0.6, seed: 81 });
  piece(ctx, bar([-30, 866], [300, 890], 34), { color: c, h: 12, rough: 0.8, seed: 82 });
  piece(ctx, bar([70, 880], [18, 1100], 30), { color: c, h: 12, rough: 0.8, seed: 83 });
  piece(ctx, bar([226, 892], [300, 1100], 30), { color: c, h: 12, rough: 0.8, seed: 84 });
  piece(ctx, bar([40, 990], [280, 1010], 22), { color: c, h: 10, rough: 0.8, seed: 85 });
}

function frameOfDoor(ctx) {
  const c = dark(C.coal, 0.25);
  piece(ctx, rect(-10, -10, 1100, 62), { color: c, h: 12, seed: 61 });
  piece(ctx, rect(-10, -10, 52, GY + 14), { color: c, h: 12, seed: 62 });
  piece(ctx, rect(1038, -10, 52, GY + 14), { color: c, h: 12, seed: 63 });
}

/** A welding mask: a shield over the front of the head, with a slit that holds the arc's colour. */
const mask = (ctx, lit) => (hd, s, dir) => {
  const m = [[-4, -19], [15, -15], [19, 4], [9, 19], [-6, 16]].map(([x, y]) => [hd[0] + dir * x * s, hd[1] + y * s]);
  piece(ctx, m, { color: dark(C.slate, 0.2), h: 2, rough: 0 });
  piece(ctx, rect(hd[0] + dir * 7 * s - (dir < 0 ? 9 * s : 0), hd[1] - 5 * s, 9 * s, 4.5 * s), { color: mix(C.coal, C.spark, lit), h: 0, rough: 0, grain: 0, edge: 0 });
};

export default scene('weld', 8, (ctx, s, { k, env }) => {
  // which weld is burning, and how hard
  // As a loop the scene stays at the first joint, so its last frame meets its first.
  const LIST = env.loop ? WELDS.map((w) => ({ ...w, p: WELDS[0].p, adds: -1, burn: Math.min(w.burn, 1.5) })) : WELDS;
  let W = LIST[0], burn = 0;
  for (const w of LIST) if (s >= w.at - 0.7) W = w;
  const into = s - W.at;
  if (into >= 0 && into <= W.burn) burn = Math.min(1, into / 0.12) * Math.min(1, (W.burn - into) / 0.2 + 0.25);
  const F = mul32(k * 7919 + 3);
  const flick = burn * (0.72 + 0.28 * F());
  const on = (kb) => { // was the arc lit at pair kb? (sparks ask about their birth)
    const sb = s - ((k - kb) * 2) / 24;
    return LIST.some((w) => sb >= w.at && sb <= w.at + w.burn) ? 1 : 0;
  };
  const arc = fl(W.p[0], W.p[1]);
  const glow = Math.max(flick, 0.3); // embers and a little ambient between welds

  setLight(arc[0], arc[1] - 6, { power: 0.25 + 0.75 * glow, reach: 820 });
  ctx.drawImage(cached('weld-back', backdrop), 0, 0);

  // steel on the floor
  [...FRAME_B, ...Array(4), ...FRAME_A].forEach((m, i) => { // FRAME_A's members are numbered from 10
    if (!m) return;
    const [a, b] = m;
    const w = LIST.find((x) => x.adds === i);
    if (!w) return steel(ctx, a, b);
    const t = span(s, w.at - 0.95, w.at - 0.45);
    if (t <= 0) return;
    const drop = (1 - easeOut(t)) * 0.16; // slid into place by hand, a beat before the arc
    steel(ctx, [a[0] + drop, a[1] - drop * 0.4], [b[0] + drop, b[1] - drop * 0.4]);
  });

  // the welder's lead, off to the machine out of frame
  piece(ctx, strip(blob([[arc[0] - 90, arc[1] + 40], [arc[0] - 170, arc[1] + 78], [360, 752], [330, 800], [420, 880], [380, 980], [300, 1100], [280, 1100], [360, 980], [400, 880], [310, 800], [340, 748]], 3).slice(0, 46), 7), { color: dark(C.coal, 0.2), h: 2, rough: 0, seed: 70 });
  // the cord, coiled on the driveway
  ctx.drawImage(cached('weld-cord', (g) => {
    setLight(626, 560, { power: 0.5, reach: 900 });
    const pts = [];
    for (let i = 0; i <= 150; i++) { const u = i / 150; pts.push([560 + 420 * u + 86 * Math.sin(u * 30) * (0.5 + 0.5 * u), 915 + 62 * Math.cos(u * 30) * (0.5 + 0.5 * u) + 46 * Math.sin(u * 4.1)]); }
    piece(g, strip(pts, 6.5), { color: mix(C.cream, C.cedar, 0.3), h: 3, rough: 0, seed: 71 });
  }), 0, 0);
  setLight(arc[0], arc[1] - 6, { power: 0.25 + 0.75 * glow, reach: 820 });

  // the welder, kneeling at the joint; in the last weld a second, smaller figure takes the torch
  const [jx, jy] = tremor(k, 9, burn > 0 ? 0.7 : 0.25);
  const teach = env.loop ? 0 : span(s, 4.0, 4.9);
  const lean = burn > 0 ? 2 * Math.sin(s * 5) : 0;
  const body = dark(C.slate, 0.3);
  const kneel = (hip, sc, o = {}) => doll(ctx, {
    hip, s: sc, dir: 1, torso: 34 + lean + (o.torso ?? 0), head: 22,
    armF: o.armF ?? [28, 22], armB: o.armB ?? [44, 30], legF: [84, -86], legB: [14, -100],
  }, { color: o.color ?? body, hat: mask(ctx, 0.25 + 0.75 * flick) });
  let hand;
  if (teach <= 0) {
    hand = kneel([arc[0] - 112 + jx, arc[1] - 58 + jy], 1.45).haF;
  } else {
    // the neighbour stands back; the smaller figure kneels in and holds the torch
    const e = easeInOut(teach);
    doll(ctx, { hip: [arc[0] - 215 - 40 * e, arc[1] - 140 - 8 * e], s: 1.45, dir: 1, torso: lerp(30, 10, e), head: 16, armF: [lerp(30, 40, e), 30], armB: [8, 12], legF: [10, -6], legB: [-8, -6] }, { color: dark(body, 0.12), hat: mask(ctx, 0.2 + 0.5 * flick) });
    hand = kneel([arc[0] - 100 + jx, arc[1] - 50 + jy + (1 - e) * 30], 1.25, { color: lite(body, 0.14) }).haF;
  }
  piece(ctx, bar(hand, [arc[0] - 3, arc[1] - 5], 6), { color: C.coal, h: 1.5, rough: 0 });

  tripod(ctx);
  wheels(ctx);
  frameOfDoor(ctx);
  foreground(ctx);
  noLight();

  // night, then the light itself
  darkness(ctx, arc[0], arc[1], 520 + 560 * glow, { warm: mix([70, 66, 88], [255, 226, 190], Math.min(1, glow * 1.15)), far: [46, 48, 76] });
  if (flick > 0) {
    halo(ctx, arc[0], arc[1] - 4, 250 + 150 * flick, 0.85 * flick);
    bloom(ctx, arc[0], arc[1] - 4, 210 * (0.7 + 0.3 * flick), [255, 150, 60], 0.5 * flick);
    bloom(ctx, arc[0], arc[1] - 4, 46, [255, 240, 215], 0.95 * flick);
  }
  sparks(ctx, arc[0], arc[1] - 4, k, { on, floor: 70, n: 190, reach: 1.25, seed: 3 + LIST.indexOf(W) });
  if (flick > 0 && look() === 'c') { // the arc's flare: four thin rays
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = F() * 6.283, l = (26 + F() * 60) * flick;
      ctx.strokeStyle = `rgba(255,236,200,${0.5 * flick})`; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(arc[0], arc[1] - 4); ctx.lineTo(arc[0] + Math.cos(a) * l, arc[1] - 4 + Math.sin(a) * l * 0.7); ctx.stroke();
    }
    ctx.restore();
  }
});
