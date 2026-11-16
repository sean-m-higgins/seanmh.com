// grain, scenes 5–8: cut, legs, sand, dry fit.

import { pencil } from '../../lib/draw/line.js';
import { hand } from '../../lib/draw/hand.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { rgba, mix } from '../../lib/draw/color.js';
import { caption, span, easeInOut, easeOut, easeIn, lerp, clamp } from '../common.js';
import { TABLE as T, camera, projectPoly, box, cyl, turn, shift, clipY, norm, add } from './geom.js';
import { A, PEN, rgb, trace, begin, background, fill, glaze, line, lines, solid, shadow, compose, vee3 } from './kit.js';
import { RAW, STEEL, DARK, GREY, BLACK, tableParts, sortParts } from './table.js';
import { particles, motes, SUN } from './props.js';
import { driveway, dapple } from './scenesA.js';

const SUNMAT = { c: [246, 190, 84], line: 0.7 };
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const ell = (P, c, u, v, n = 40) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.283; return P(add(c, add(u.map((x) => x * Math.cos(a)), v.map((x) => x * Math.sin(a))))); });

// ---------- 5 · cut ----------

const BT = 37.5; // the board's top, on the saw's table
const PIN5 = [-0.3, BT, 0.5];
const P5 = camera({ eye: [-38, 62, 48], target: [2, 38, 0], f: 1480, pin: PIN5, at: A });
const L5 = { dir: norm([-0.45, 0.78, -0.42]), sun: [0.56, 0.52, 0.42], amb: [0.6, 0.6, 0.68], fill: { dir: norm([0.2, 0.4, 0.9]), k: 0.12 } };
const PV = [0, 40.4, -9.5], HUB = [0, 40.1, 0.4], BR = 5.1;
const SAWBASE = [box(-12, 12, 34, 36.5, -8, 8.5), box(-1.8, 1.8, 36.5, 42, -11.5, -7.8)];
const FENCE = [box(-12.5, -0.5, 36.5, 39.4, -3.3, -2.6), box(0.7, 12.5, 36.5, 39.4, -3.3, -2.6)];
const boardPart = (x0, x1) => box(x0, x1, 36.5, BT, -2.6, 1.6);
const DUST5 = (() => { const G = mul32(55); return Array.from({ length: 260 }, () => ({ tb: rd(G, 0.33, 0.5), v: [rd(G, -9, 5), rd(G, 8, 30), rd(G, -46, -6)], r: rd(G, 0.9, 2.8), k: G() })); })();

function sawHead(phi, spin, spinning, R) {
  const tr = (f) => turn(f, 'x', phi, PV);
  const blade = tr(cyl([HUB[0] - 0.02, HUB[1], HUB[2]], [1, 0, 0], BR, 0.14, 40)).map((f) => ({ ...f, pts: clipY(f.pts, 36.52) })).filter((f) => f.pts.length >= 3);
  const guard = tr(cyl([-0.55, HUB[1], HUB[2]], [1, 0, 0], BR + 0.55, 1.2, 36).map((f) => ({ ...f, pts: clipY(f.pts, HUB[1] - 0.4) })).filter((f) => f.pts.length >= 3));
  const motor = tr(cyl([0.6, HUB[1] + 0.6, HUB[2]], [1, 0, 0], 2.4, 5.2, 22));
  const arm = tr(box(-1, 1, 41.2, 43.4, -9.8, -3.4));
  const riser = tr(box(-0.6, 0.6, 45, 48.6, 1.2, 2.6)), grip = tr(box(-0.7, 0.7, 47.4, 48.9, 1.2, 7.4));
  return { blade, guard, motor, arm, riser, grip, hub: tr([{ n: [0, 0, 0], pts: [HUB] }])[0].pts[0], tr };
}

export const cut = {
  id: 'cut', dur: 4, step: 'cut',
  draw(ctx, t, R, env) {
    const S = env.still('cut');
    background('cut', () => {
      const { top } = driveway(P5, L5, S, [-70, 90]);
      shadow(P5, [...SAWBASE, ...FENCE, boardPart(-44, 34)], 34, L5, top, { alpha: 0.85, blur: 2 });
      solid(P5, SAWBASE[0], DARK, L5, { R: S, key: 'sawbase' });
      solid(P5, cyl([0, 36.5, 1], [0, 1, 0], 7, 0.08, 40), STEEL, L5, { R: S, key: 'turntable' });
      glaze((p) => { p.strokeStyle = 'rgba(40,36,54,0.55)'; p.lineWidth = 2; const a = P5([0.06, 36.6, -6]), b = P5([0.06, 36.6, 8]); p.beginPath(); p.moveTo(...a); p.lineTo(...b); p.stroke(); });
      solid(P5, SAWBASE[1], DARK, L5, { R: S, key: 'post' });
      for (const f of FENCE) solid(P5, f, STEEL, L5, { R: S, key: 'fence' });
    });
    // The arm rests up, lifts a touch (anticipation), chops down through the line, holds, rises.
    const phi = -(t < 0.15 ? 0.6 : t < 0.25 ? lerp(0.6, 0.68, easeOut(span(t, 0.15, 0.25)))
      : t < 0.45 ? lerp(0.68, 0, easeIn(span(t, 0.25, 0.45))) : t < 0.6 ? 0 : lerp(0, 0.6, easeInOut(span(t, 0.6, 0.82))));
    const spinning = t > 0.17 && t < 0.8, spin = env.frame * 0.9;
    const H = sawHead(phi, spin, spinning, R);
    const cutDone = t > 0.45, drop = easeOut(span(t, 0.47, 0.6));
    const left = boardPart(-44, 0), right = turn(boardPart(0.16, 34), 'y', 0.012 * drop, [17, 37, 0], [0.5 * drop, 0, 0.2 * drop]);
    const top = projectPoly(P5, SAWBASE[0][0].pts);
    shadow(P5, [H.blade, H.guard, H.motor, H.arm, H.grip], 36.5, L5, top, { alpha: 0.8, blur: 3 });
    solid(P5, H.motor, DARK, L5, { R, key: 'motor' });
    solid(P5, right, RAW, L5, { R, key: 'cutR' });
    solid(P5, H.blade, { c: [206, 208, 218], line: 0.7 }, L5, { R, key: 'blade' });
    glaze((p) => { // the blade's face: still teeth, or the blur of them
      const u = H.tr([{ n: [0, 0, 0], g: null, pts: [[0, BR, 0], [0, 0, BR]] }])[0].pts.map((q) => [q[0], q[1] - PV[1] * 0 , q[2]]);
      const c = H.hub, U = [0, u[0][1] - (H.tr([{ n: [0, 0, 0], pts: [[0, 0, 0]] }])[0].pts[0][1]), u[0][2] - (H.tr([{ n: [0, 0, 0], pts: [[0, 0, 0]] }])[0].pts[0][2])];
      const V = [0, u[1][1] - (H.tr([{ n: [0, 0, 0], pts: [[0, 0, 0]] }])[0].pts[0][1]), u[1][2] - (H.tr([{ n: [0, 0, 0], pts: [[0, 0, 0]] }])[0].pts[0][2])];
      const at = (a, r) => P5([c[0] - 0.04, c[1] + (U[1] * Math.cos(a) + V[1] * Math.sin(a)) * r, c[2] + (U[2] * Math.cos(a) + V[2] * Math.sin(a)) * r]);
      const slot = projectPoly(P5, [[-0.2, 36.52, -30], [-0.2, 36.52, 30], [-0.2, 80, 30], [-0.2, 80, -30]]);
      trace(p, slot); p.clip();
      p.lineCap = 'round';
      if (spinning) {
        for (let k = 0; k < 4; k++) { const r = 0.34 + k * 0.17, a0 = spin * (1 - k * 0.13) + k * 1.9; p.strokeStyle = k % 2 ? 'rgba(255,255,255,0.75)' : 'rgba(70,70,96,0.4)'; p.lineWidth = 2.2; p.beginPath(); for (let i = 0; i <= 14; i++) { const q = at(a0 + i * 0.13, r); i ? p.lineTo(...q) : p.moveTo(...q); } p.stroke(); }
      } else {
        p.strokeStyle = 'rgba(50,46,66,0.7)'; p.lineWidth = 1.3;
        for (let i = 0; i < 36; i++) { const a = (i / 36) * 6.283; p.beginPath(); p.moveTo(...at(a, 0.9)); p.lineTo(...at(a + 0.07, 1)); p.stroke(); }
      }
      p.fillStyle = 'rgba(60,58,76,0.9)'; trace(p, Array.from({ length: 16 }, (_, i) => at((i / 16) * 6.283, 0.16))); p.fill();
    });
    solid(P5, left, RAW, L5, { R, key: 'cutL' });
    vee3(lines(), R, P5, PIN5, { s: 1.2 });
    solid(P5, H.arm, DARK, L5, { R, key: 'arm' });
    solid(P5, H.guard, { c: [120, 122, 140], line: 0.8, dense: true }, L5, { R, key: 'guard' });
    solid(P5, H.riser, BLACK, L5, { R, key: 'riser' });
    solid(P5, H.grip, BLACK, L5, { R, key: 'grip' });
    dapple(env.sec, 0.45);
    compose(ctx, env.paper);
    // Sawdust: thrown back out of the cut into the sun, falling, settling on the saw and the bench.
    const sec = t * 4;
    for (const d of DUST5) {
      const age = sec - d.tb * 4;
      if (age <= 0) continue;
      const g = 150, floor = Math.abs(d.v[0] * 0.3) < 12 && -2.6 + d.v[2] * 0.3 > -8 ? 36.6 : 34.05;
      let y = BT + 0.2 + d.v[1] * age - 0.5 * g * age * age, k = age;
      if (y < floor) { k = (d.v[1] + Math.sqrt(d.v[1] * d.v[1] + 2 * g * (BT + 0.2 - floor))) / g; y = floor; }
      const q = P5([0.1 + d.v[0] * k * 0.5, y, -1 + d.v[2] * k * 0.5]);
      const lit = y > floor ? 1 : 0.55;
      ctx.fillStyle = rgba(mix3(SUN, [226, 196, 146], d.k), (y > floor ? 0.95 : 0.7) * lit);
      ctx.beginPath(); ctx.arc(q[0], q[1], d.r * (y > floor ? 1 : 0.8), 0, 6.3); ctx.fill();
    }
    caption(ctx, R, 'cut once', span(t, 0.52, 0.7), 1080);
  },
};

// ---------- 6 · legs ----------

const PIN6 = [8, 35, 3.7], HOLE6 = [10.6, 35, 2.5];
const P6 = camera({ eye: [26, 58, 34], target: [3, 36, -1], f: 1320, pin: PIN6, at: A });
const L6 = { dir: norm([-0.5, 0.75, -0.2]), sun: [0.56, 0.52, 0.42], amb: [0.6, 0.6, 0.68], fill: { dir: norm([0.6, 0.3, 0.7]), k: 0.14 } };
const BLANKS = [['B1', -8.1, 36.27], ['B2', -5.8, 36.27], ['B3', -8.1, 34], ['B4', -5.8, 34]].map(([label, x, y]) => ({ label, x, y, b: box(x, x + 2.25, y, y + 2.25, -10, 1, 2) }));
const RAIL6 = box(-1, 18, 34, 35, 0.6, 5.2);

/** Draw on a face as if it were the sheet: origin o, then the directions to ex and ey. */
function onFace(g, P, o, ex, ey, fn) {
  const a = P(o), b = P(ex), c = P(ey);
  const ux = [b[0] - a[0], b[1] - a[1]], uy = [c[0] - a[0], c[1] - a[1]];
  const lx = Math.hypot(...ux), ly = Math.hypot(...uy);
  g.save(); g.transform(ux[0] / lx, ux[1] / lx, uy[0] / ly, uy[1] / ly, a[0], a[1]); fn(lx, ly); g.restore();
}
const holeAt = (P, c, r = 0.19) => ell(P, c, [r, 0, 0], [0, 0, r], 20);

function drill(P, Lt, R, tip, spin) {
  const parts = [
    [cyl(tip, [0, 1, 0], 0.17, 3.2, 10), STEEL],
    [cyl(add(tip, [0, 3.1, 0]), [0, 1, 0], 0.4, 1.3, 20, 0.9), STEEL],
    [cyl(add(tip, [0, 4.4, 0]), [0, 1, 0], 1.0, 0.9, 24), SUNMAT],
    [cyl(add(tip, [0, 5.3, 0]), [0, 1, 0], 1.45, 5.4, 26), GREY],
    [box(tip[0] + 0.9, tip[0] + 7, tip[1] + 8.8, tip[1] + 10.6, tip[2] - 0.85, tip[2] + 0.85), GREY],
    [box(tip[0] + 5.4, tip[0] + 8.4, tip[1] + 6.2, tip[1] + 8.8, tip[2] - 1.25, tip[2] + 1.25), DARK],
  ];
  parts.forEach(([f, m], i) => solid(P, f, m, Lt, { R, key: `drill${i}` }));
  // The bit's flutes, turning.
  glaze((p) => { p.strokeStyle = 'rgba(40,36,54,0.7)'; p.lineWidth = 1.2; for (let k = 0; k < 5; k++) { const y = tip[1] + 0.3 + ((k * 0.6 + spin * 0.21) % 3); const a = P([tip[0] - 0.17, y, tip[2]]), b = P([tip[0] + 0.17, y + 0.3, tip[2]]); p.beginPath(); p.moveTo(...a); p.lineTo(...b); p.stroke(); } });
  return parts.map((x) => x[0]);
}

export const legs = {
  id: 'legs', dur: 3.5,
  draw(ctx, t, R, env) {
    const S = env.still('legs');
    let top;
    background('legs', () => {
      top = driveway(P6, L6, S).top; legs.top = top;
      shadow(P6, [...BLANKS.map((x) => x.b), RAIL6], 34, L6, top, { alpha: 0.85, blur: 2 });
      // A handful of dowel pins, waiting.
      const G = mul32(61);
      for (let i = 0; i < 5; i++) solid(P6, turn(cyl([0, 34.19, 0], [1, 0, 0], 0.19, 1.5, 10), 'y', rd(G, -1, 1), [0, 34, 0], [13 + rd(G, -2, 3), 0, 8 + rd(G, -1.2, 2)]), RAW, L6, { R: S, key: `dowel${i}`, lineOpts: { width: 1.1 } });
      [BLANKS[2], BLANKS[3], BLANKS[0], BLANKS[1]].forEach((x) => solid(P6, x.b, { ...RAW, grain: { ...RAW.grain, a: 0.5 } }, L6, { R: S, key: x.label }));
    });
    // B1 to B4, in marker, on the end grain.
    BLANKS.forEach((x, i) => {
      const w = span(t, 0.03 + i * 0.06, 0.15 + i * 0.06);
      if (w > 0) onFace(lines(), P6, [x.x, x.y + 2.25, 1], [x.x + 2.25, x.y + 2.25, 1], [x.x, x.y, 1], (lx) => hand(lines(), R, x.label, lx * 0.12, lx * 0.46, lx * 0.2, { color: [26, 24, 34], width: 3.4, alpha: 0.9, upTo: w, slant: 0.05 }));
    });
    solid(P6, RAIL6, RAW, L6, { R, key: 'rail6' });
    const tp = projectPoly(P6, RAIL6[0].pts);
    for (const x of [2.6, 15]) fill(holeAt(P6, [x, 35.01, 2.5]), 'rgb(70,52,44)', 0.4, { dense: true, keep: true });
    vee3(lines(), R, P6, PIN6, { s: 1.15 });
    // The drill comes down beside the mark, bores, and lifts away; the hole and its curls stay.
    const inn = easeOut(span(t, 0.3, 0.46)), bore = easeInOut(span(t, 0.46, 0.7)), out = easeIn(span(t, 0.74, 0.94));
    const depth = bore * (1 - span(t, 0.7, 0.78));
    if (t > 0.5) fill(holeAt(P6, [HOLE6[0], 35.01, HOLE6[2]]), 'rgb(70,52,44)', 0.4, { dense: true, keep: true });
    const C = mul32(31), g = lines();
    for (let k = 0; k < 4; k++) {
      const c = P6([HOLE6[0] + rd(C, -0.9, 0.9), 35.02, HOLE6[2] + rd(C, 0.3, 1.2)]), pts = [], n = Math.floor(26 * bore);
      for (let j = 0; j < n; j++) { const a = j * 0.5 + k, r = 2 + j * 0.42; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a) * 0.55]); }
      if (n > 2) pencil(g, R, pts, { color: [178, 134, 88], width: 2.4, alpha: 0.9, amp: 0.3, step: 3 });
    }
    if (inn > 0 && out < 1) {
      const lift = (1 - inn) * 26 + out * 30, jig = t > 0.46 && t < 0.72 ? Math.sin(env.frame * 2.4) * 0.03 : 0;
      const tip = [HOLE6[0] + jig, 35.05 + 3 * (1 - inn) + lift - 0.75 * depth + (out > 0 ? 0 : 0), HOLE6[2]];
      const parts = [cyl(tip, [0, 1, 0], 0.17, 3.2, 8), cyl(add(tip, [0, 5.3, 0]), [0, 1, 0], 1.55, 5.6, 16), box(tip[0] + 0.9, tip[0] + 8.8, tip[1] + 5.4, tip[1] + 10.7, tip[2] - 1.4, tip[2] + 1.4)];
      shadow(P6, parts, 35, L6, tp, { alpha: 0.8, blur: 2.5 });
      shadow(P6, parts, 34, L6, null, { alpha: 0.35, blur: 4 });
      drill(P6, L6, R, tip, env.frame);
    }
    dapple(env.sec + 3, 0.4);
    compose(ctx, env.paper);
  },
};

// ---------- 7 · sand ----------

const PIN7 = [2, 35, 2.4];
const P7 = camera({ eye: [-30, 50, 34], target: [4, 35.5, 0], f: 1500, pin: PIN7, at: A });
const PANEL = box(-40, 44, 34, 35, -5.2, 5.2);
const PILE = [box(16, 40, 34, 34.75, -11, -7.6), box(17, 41, 34.75, 35.5, -10.8, -7.4), box(15.5, 39, 35.5, 36.25, -11.2, -7.8)];
/** The sander's path: a closed figure, two laps in the scene, so it loops. */
const sanderAt = (t) => [5 + 15 * Math.sin(t * 2 * 6.283), 0.2 + 2.4 * Math.sin(t * 4 * 6.283 + 0.6)];

export const sand = {
  id: 'sand', dur: 5, step: 'sand',
  draw(ctx, t, R, env) {
    const S = env.still('sand');
    // The afternoon goes: the sun swings round behind the bench and drops, gold, then dusk.
    const e = env.loop ? 0.35 : easeInOut(t);
    const el = lerp(0.95, 0.3, e), az = lerp(2.3, 0.75, e);
    const gold = clamp(1 - Math.abs(e - 0.72) / 0.3), dusk = span(e, 0.82, 1);
    const Lt = {
      dir: [Math.cos(el) * Math.cos(az), Math.sin(el), -Math.cos(el) * Math.sin(az)],
      sun: mix3(mix3([0.56, 0.52, 0.42], [1.25, 0.86, 0.46], gold), [0.5, 0.5, 0.62], dusk),
      amb: mix3(mix3([0.6, 0.6, 0.68], [0.62, 0.54, 0.56], gold), [0.52, 0.54, 0.68], dusk),
      fill: { dir: norm([0.2, 0.5, 0.8]), k: 0.1 },
    };
    const shade = mix3(mix3([120, 116, 150], [150, 104, 110], gold), [84, 88, 130], dusk);
    begin();
    const { top } = driveway(P7, Lt, S, [-84, 84], rgb(mix3(mix3([226, 232, 238], [250, 206, 150], gold), [150, 158, 204], dusk)));
    const [sx, sz] = sanderAt(t), jig = Math.sin(env.frame * 2.3) * 0.035, c = [sx + jig, 35, sz - jig];
    const sander = [cyl(c, [0, 1, 0], 2.5, 0.45, 26), cyl(add(c, [0, 0.45, 0]), [0, 1, 0], 2.1, 2.3, 26), cyl(add(c, [0, 2.75, 0]), [0, 1, 0], 2.6, 1.5, 26, 2.1), box(c[0] + 1.6, c[0] + 5.4, c[1] + 0.9, c[1] + 2.5, c[2] - 0.9, c[2] + 0.9)];
    shadow(P7, [PANEL, ...PILE, ...sander], 34, Lt, top, { alpha: 0.88, blur: 2, color: shade });
    PILE.forEach((b, i) => solid(P7, b, RAW, Lt, { R: S, key: `pile${i}` }));
    solid(P7, PANEL, { ...RAW, grain: { ...RAW.grain, n: 2.2, wave: 2.2, a: 0.5 } }, Lt, { R, key: 'panel' });
    const ptop = projectPoly(P7, PANEL[0].pts);
    // Where the pad has been, the surface is paler and the pencil mark is fainter, but it survives.
    vee3(lines(), R, P7, PIN7, { s: 1.5, alpha: env.loop ? 0.6 : lerp(0.9, 0.4, easeInOut(t)) });
    shadow(P7, sander, 35, Lt, ptop, { alpha: 0.88, blur: 2, color: shade });
    // The cord, trailing back off the bench.
    const cord = []; for (let i = 0; i <= 16; i++) { const u = i / 16; cord.push(P7([c[0] + 5.4 + u * 30, 35 + 1.6 * (1 - u) * (1 - u) - (u > 0.5 ? (u - 0.5) * 3 : 0), c[2] + 6 * Math.sin(u * 2.4) * (0.6 + 0.4 * Math.sin(t * 12.6)) + u * 14])); }
    line(R, cord, { width: 2.6, alpha: 0.75, amp: 0.6 });
    solid(P7, sander[3], BLACK, Lt, { R, key: 'port' });
    solid(P7, sander[0], BLACK, Lt, { R, key: 'pad' });
    solid(P7, sander[1], { c: [150, 152, 168], line: 0.75 }, Lt, { R, key: 'sbody' });
    solid(P7, sander[2], DARK, Lt, { R, key: 'sgrip' });
    compose(ctx, env.paper);
    // Dust, hanging where the pad has just been, lit from behind.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(20px)';
    for (let k = 1; k <= 7; k++) {
      const [px, pz] = sanderAt(t - k * 0.012), q = P7([px, 36.2 + k * 0.25, pz]);
      ctx.fillStyle = rgba(mix3(mix3([250, 238, 214], [255, 190, 110], gold), [150, 160, 210], dusk), 0.11 - k * 0.012);
      ctx.beginPath(); ctx.arc(q[0], q[1] - k * 3, 60 + k * 10, 0, 6.3); ctx.fill();
    }
    ctx.restore();
    const [ax, ay] = P7([sx, 37.5, sz]);
    motes(ctx, env.loop ? 0 : env.sec, 71, [ax - 240, ay - 200, ax + 240, ay + 60], 46, 0.75 * (1 - dusk));
    if (dusk > 0) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba([150, 156, 208], 0.42 * dusk); ctx.fillRect(0, 0, 1080, 1080); ctx.restore(); }
    caption(ctx, R, 'sanding to smooth', env.loop ? 1 : span(t, 0.2, 0.5), 1080);
  },
};

// ---------- 8 · dry fit ----------

const PIN8 = [-3, 2.45, 11.63];
const P8 = camera({ eye: [26, 20, 44], target: [0, 5, -2], f: 900, pin: PIN8, at: A });
const L8 = { dir: norm([-0.75, 0.5, 0.2]), sun: [0.56, 0.53, 0.44], amb: [0.62, 0.62, 0.68], fill: { dir: norm([0.5, 0.3, 0.8]), k: 0.14 } };
const PARTS8 = sortParts(P8, tableParts());
const DOOR8 = [[-70, -34], [-70, 44], [56, 44 - 33.6], [56, -34 - 33.6]].map(([x, z]) => [x, 0, z]);
const quad8 = (x0, x1, z0, z1, y = 0) => projectPoly(P8, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], 2);

/** The garage: pegboard, a shelf of bins, a concrete floor, daylight in through the open door. */
export function garage(P, S, door, o = {}) {
  const wz = o.wz ?? -52;
  fill(projectPoly(P, [[-300, 140, wz], [300, 140, wz], [300, 0, wz], [-300, 0, wz]], 2), 'rgb(224,214,196)', 1.5, { press: 0.7 });
  glaze((p) => { p.fillStyle = 'rgba(96,88,104,0.5)'; for (let x = -150; x < 150; x += 3.4) for (let y = 30; y < 96; y += 3.4) { const [px, py] = P([x, y, wz + 0.2]); if (px > -10 && px < 1090 && py > -10 && py < 1090) { p.beginPath(); p.arc(px, py, 1.5, 0, 6.3); p.fill(); } } });
  const Lr = { dir: norm([-0.3, 0.8, 0.5]), sun: [0.3, 0.3, 0.3], amb: [0.66, 0.66, 0.72] };
  // A shelf with bins, and the things that hang on a garage wall.
  solid(P, box(-80, 30, 26, 27.5, wz, wz + 9), { c: [206, 186, 150], line: 0.5 }, Lr, { R: S, key: 'gshelf' });
  const G = mul32(808);
  for (let x = -76; x < 24; ) { const w = rd(G, 7, 13), h = rd(G, 5, 10); solid(P, box(x, x + w, 27.5, 27.5 + h, wz + 1, wz + 8), { c: mix3([186, 186, 200], [214, 200, 176], G()), line: 0.5 }, Lr, { R: S, key: `bin${x | 0}` }); x += w + rd(G, 0.6, 2.4); }
  const hang = (pts, o2 = {}) => line(S, pts.map(([x, y]) => P([x, y, wz + 0.4])), { alpha: 0.5, width: 1.6, ...o2 });
  hang([[-52, 78], [-30, 82], [-29, 74], [-52, 68], [-58, 68], [-60, 78], [-52, 78]]); // handsaw
  hang([[-14, 84], [-14, 62], [2, 62]], { width: 2.4 }); // a square
  for (let k = 0; k < 4; k++) hang(Array.from({ length: 30 }, (_, i) => [22 + (7 - k * 0.6) * Math.cos(i * 0.22), 70 + (9 - k * 0.6) * Math.sin(i * 0.22)]), { alpha: 0.4 }); // a coiled cord
  const floor = projectPoly(P, [[-300, 0, wz], [300, 0, wz], [300, 0, 90], [-300, 0, 90]], 2);
  fill(floor, 'rgb(232,226,214)', 0.15, { press: 0.85 });
  glaze((p) => {
    trace(p, floor); p.clip();
    const B = mul32(515);
    p.filter = 'blur(14px)';
    for (let i = 0; i < 12; i++) { const q = P([rd(B, -60, 60), 0, rd(B, -40, 40)]); p.fillStyle = `rgba(150,140,140,${rd(B, 0.08, 0.2)})`; p.beginPath(); p.ellipse(q[0], q[1], rd(B, 40, 140), rd(B, 14, 40), 0, 0, 6.3); p.fill(); }
  });
  line(S, projectPoly(P, [[-300, 0, wz], [300, 0, wz]], 2), { alpha: 0.5, width: 1.6 });
  // Everything the door's light misses falls into shade.
  if (door) glaze((p) => {
    p.beginPath(); p.rect(-20, -20, 1120, 1120);
    const q = projectPoly(P, door, 2); p.moveTo(...q[0]); for (const v of q.slice(1)) p.lineTo(...v); p.closePath();
    p.clip('evenodd');
    trace(p, floor); p.clip();
    p.filter = 'blur(3px)';
    p.globalCompositeOperation = 'multiply'; p.fillStyle = rgb(o.shade ?? [196, 190, 208]); p.fillRect(-20, -20, 1120, 1120);
  });
  return floor;
}

export const dryFit = {
  id: 'dry-fit', dur: 5, step: 'dry fit',
  draw(ctx, t, R, env) {
    const S = env.still('dry-fit');
    background('dry-fit', () => { garage(P8, S, DOOR8); });
    // Legs and aprons stand already. The slats drop in one after another; then the four rails of the top.
    const order = { back: 0, left: 1, right: 2, front: 3 };
    const state = (part) => {
      if (part.group === 'slat') { const u = span(t, 0.05 + part.i * 0.05, 0.17 + part.i * 0.05); return u <= 0 ? null : { dy: (1 - easeOut(u)) * 11, tilt: (1 - easeOut(u)) * 0.22 }; }
      if (part.group === 'rail') { const k = order[part.rail], u = span(t, 0.6 + k * 0.065, 0.76 + k * 0.065); return u <= 0 ? null : { dy: (1 - easeOut(u)) * 9, tilt: 0 }; }
      return { dy: 0, tilt: 0 };
    };
    const placed = PARTS8.map((part) => { const s = state(part); if (!s) return null; const c = part.faces[0].pts[0]; return { part, faces: s.dy ? turn(part.faces, 'z', s.tilt, [c[0], c[1], 0], [0, s.dy, 0]) : part.faces }; }).filter(Boolean);
    shadow(P8, placed.map((x) => x.faces), 0, L8, projectPoly(P8, DOOR8, 2), { alpha: 1, blur: 2.5, color: [196, 190, 208] });
    glaze((p) => { p.filter = 'blur(6px)'; p.fillStyle = 'rgba(50,40,60,0.4)'; for (const x of placed) if (x.part.group === 'leg') { trace(p, projectPoly(P8, x.faces[1].pts.map(([a, , b]) => [a + 0.6, 0, b + 0.6]))); p.fill(); } });
    for (const x of placed) {
      solid(P8, x.faces, RAW, L8, { R, key: x.part.id });
      if (x.part.id === 'apron-z1') vee3(lines(), R, P8, PIN8, { back: [0, 1, 0], side: [1, 0, 0], s: 0.62, width: 2.4 });
    }
    compose(ctx, env.paper);
    motes(ctx, env.sec, 8, [80, 160, 760, 760], 50, 0.6);
  },
};
