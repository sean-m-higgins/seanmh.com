// grain, scenes 1–4: mark, design, store, measure.

import { pencil } from '../../lib/draw/line.js';
import { hatchFill } from '../../lib/draw/fill.js';
import { hand, aword } from '../../lib/draw/hand.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { rgba, mix } from '../../lib/draw/color.js';
import { caption, span, easeInOut, easeOut, easeIn, lerp } from '../common.js';
import { TABLE as T, camera, projectPoly, box, turn, shift, norm, sub, mul, add } from './geom.js';
import { A, PEN, FULL, rgb, trace, begin, background, fill, glaze, line, lines, layer, solid, shadow, compose, vee, vee3, slowBoil } from './kit.js';
import { RAW, STEEL, DARK, BLACK, PLY, tableParts, sortParts } from './table.js';
import { carpenterPencil, glove, SUN } from './props.js';
import { homeCamera } from './home.js';

const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const NAVY = [28, 44, 80];
export const CREAM = [238, 230, 212];

// ---------- 1 · mark ----------

export const mark = {
  id: 'mark', dur: 3,
  draw(ctx, t, R, env) {
    begin();
    const vL = [A[0] - 20, A[1] - 28], vR = [A[0] + 20, A[1] - 28];
    const draw = easeInOut(span(t, 0.32, 0.56));
    let tip, lift = 0;
    if (t < 0.32) { const u = easeOut(span(t, 0, 0.3)); tip = lerp2([1180, 1240], vL, u); tip[0] += 60 * Math.sin(u * Math.PI); lift = 1 - easeIn(span(t, 0.12, 0.31)); }
    else if (t < 0.56) tip = draw < 0.5 ? lerp2(vL, A, draw * 2) : lerp2(A, vR, draw * 2 - 1);
    else { const u = easeIn(span(t, 0.6, 0.86)); tip = lerp2(vR, [1330, 260], u); tip[1] -= 50 * Math.sin(u * Math.PI); lift = Math.min(1, span(t, 0.58, 0.68)); }
    vee(lines(), R, { upTo: draw });
    if (t > 0.4) {
      // Graphite crumbs, left where the lead turned.
      const C = mul32(77), g = lines();
      g.fillStyle = rgba(PEN, 0.6);
      for (let i = 0; i < 11; i++) { const x = A[0] + rd(C, -30, 46), y = A[1] + rd(C, -8, 26), r = rd(C, 0.7, 1.9); if (i / 11 < span(t, 0.4, 0.56)) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); } }
    }
    if (t < 0.88) carpenterPencil(R, tip, 0.74, lift);
    compose(ctx, env.paper);
  },
};

// ---------- 2 · design ----------

const PD = homeCamera();
const DPARTS = (() => {
  const parts = tableParts(), rank = { leg: 0, apron: 1, slat: 2, rail: 3 };
  return sortParts(PD, parts).map((p) => ({ ...p, rank: rank[p.group] }));
})();
const FLAT = { dir: [0, 1, 0], sun: [0, 0, 0], amb: [1, 1, 1] };

function dimLine(g, R, a, b, label, w, o = {}) {
  if (w <= 0) return;
  const pen = { color: CREAM, width: 1.5, alpha: 0.8, amp: 0.5 };
  pencil(g, R, [a, b], { ...pen, upTo: span(w, 0, 0.6) });
  const d = norm([b[0] - a[0], b[1] - a[1], 0]), tk = 9;
  for (const q of [a, b]) pencil(g, R, [[q[0] - (d[0] - d[1]) * tk, q[1] - (d[1] + d[0]) * tk], [q[0] + (d[0] - d[1]) * tk, q[1] + (d[1] + d[0]) * tk]], { ...pen, width: 2, upTo: span(w, 0.1, 0.5) });
  const m = [(a[0] + b[0]) / 2 + (o.dx ?? 0), (a[1] + b[1]) / 2 + (o.dy ?? -12)];
  hand(g, R, label, m[0], m[1], 23, { color: CREAM, align: 'center', width: 2.6, alpha: 0.92, upTo: span(w, 0.5, 1) });
}

export const design = {
  id: 'design', dur: 5, step: 'design',
  draw(ctx, t, R, env) {
    const S = env.still('design'), slow = slowBoil('design', env.frame, 6);
    ctx.fillStyle = rgb(NAVY); ctx.fillRect(0, 0, 1080, 1080);
    // Drafting paper: a fine grid with heavier fifths, held still.
    for (const [sp, al] of [[27, 0.06], [135, 0.1]]) for (const an of [0, Math.PI / 2]) hatchFill(ctx, S, FULL, { color: CREAM, spacing: sp, angle: an, alpha: al, straight: true, width: 1 });
    begin();
    const g = lines();
    // Light construction lines first: the box the table has to fit inside.
    const cw = span(t, 0.0, 0.14);
    for (const [a, b] of [[[-18, 0, 12], [18, 0, 12]], [[18, 0, 12], [18, 0, -12]], [[-18, 12, 12], [18, 12, 12]], [[18, 12, 12], [18, 12, -12]], [[-18, 12, -12], [18, 12, -12]], [[-18, 12, 12], [-18, 12, -12]], [[-18, 0, 12], [-18, 12, 12]], [[18, 0, 12], [18, 12, 12]], [[18, 0, -12], [18, 12, -12]]]) {
      const pa = PD(a), pb = PD(b), ex = [(pb[0] - pa[0]) * 0.08, (pb[1] - pa[1]) * 0.08];
      pencil(g, slow, [[pa[0] - ex[0], pa[1] - ex[1]], [pb[0] + ex[0], pb[1] + ex[1]]], { color: CREAM, width: 1, alpha: 0.28, amp: 0.5, upTo: cw });
    }
    // Then the table, piece by piece, in the order you would draw it; nearer pieces hide farther lines.
    const n = DPARTS.length;
    const idx = [...DPARTS.keys()].sort((a, b) => DPARTS[a].rank - DPARTS[b].rank);
    const when = new Map(idx.map((k, i) => [k, 0.1 + (i / n) * 0.5]));
    DPARTS.forEach((p, k) => {
      const w = span(t, when.get(k), when.get(k) + 0.085);
      if (w <= 0) return;
      solid(PD, p.faces, { c: NAVY, line: 0.9 }, FLAT, { R: w < 1 ? R : slow, key: p.id, lineOpts: { color: CREAM, width: p.group === 'slat' ? 1.5 : 1.9, upTo: w, amp: 0.7, step: 5 } });
    });
    // The glass: a thin rectangle and a draughtsman's reflection ticks.
    const gw = span(t, 0.6, 0.68), gx = 15, gz = 7;
    if (gw > 0) {
      const q = [[-gx, 12, -gz], [gx, 12, -gz], [gx, 12, gz], [-gx, 12, gz]].map(PD);
      pencil(g, slow, [...q, q[0]], { color: [190, 226, 222], width: 1.3, alpha: 0.7, amp: 0.6, upTo: gw });
      for (let i = 0; i < 3; i++) pencil(g, slow, [PD([-6 + i * 2.2, 12, -4]), PD([-10 + i * 2.2, 12, 3])], { color: [190, 226, 222], width: 1.2, alpha: 0.55, amp: 0.4, upTo: span(t, 0.66, 0.72) });
    }
    ctx.drawImage(layer('L'), 0, 0);
    // Dimensions: 36 long, 24 deep, 12 tall; the glass 30 x 14.
    const ext = (a, b, w) => pencil(ctx, slow, [PD(a), PD(b)], { color: CREAM, width: 1, alpha: 0.4, amp: 0.4, upTo: span(w, 0, 0.3) });
    const w1 = span(t, 0.64, 0.76), w2 = span(t, 0.7, 0.82), w3 = span(t, 0.76, 0.88);
    ext([-18, 0, 12.5], [-18, 0, 19], w1); ext([18, 0, 12.5], [18, 0, 19], w1);
    dimLine(ctx, slow, PD([-18, 0, 17.5]), PD([18, 0, 17.5]), '36', w1, { dy: 34 });
    ext([18.5, 12, -12], [24, 12, -12], w2); ext([18.5, 12, 12], [24, 12, 12], w2);
    dimLine(ctx, slow, PD([22.6, 12, -12]), PD([22.6, 12, 12]), '24', w2, { dx: 34, dy: 4 });
    ext([-18.5, 0, 12], [-23, 0, 12], w3); ext([-18.5, 12, 12], [-23, 12, 12], w3);
    dimLine(ctx, slow, PD([-22, 0, 12]), PD([-22, 12, 12]), '12', w3, { dx: -34, dy: 8 });
    const lw = span(t, 0.8, 0.92), gl = PD([6, 12, -2]);
    pencil(ctx, slow, [gl, [gl[0] + 60, gl[1] - 150], [gl[0] + 96, gl[1] - 150]], { color: CREAM, width: 1.2, alpha: 0.6, amp: 0.5, upTo: lw });
    hand(ctx, slow, '30 x 14', gl[0] + 106, gl[1] - 142, 21, { color: CREAM, width: 2.3, alpha: 0.85, upTo: span(lw, 0.4, 1) });
    // The cut list, in a hand nobody else needs to read.
    for (let i = 0; i < 6; i++) {
      const w = span(t, 0.3 + i * 0.07, 0.42 + i * 0.07), y = 150 + i * 36;
      if (w <= 0) continue;
      const L = mul32(300 + i);
      hand(ctx, slow, ['4', '2', '2', '9', '4', '1'][i], 84, y, 15, { color: CREAM, width: 2, alpha: 0.75, upTo: span(w, 0, 0.3) });
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 112 + 190 * w, 1080); ctx.clip();
      let x = 118; for (let k = 0; k < 2 + (i % 2); k++) x = aword(ctx, L, x, y, 13, Math.floor(rd(L, 5, 10)), { color: CREAM, alpha: 0.5 }) + 14;
      ctx.restore();
    }
    pencil(ctx, slow, [[78, 108], [300, 108]], { color: CREAM, width: 1.4, alpha: 0.5, upTo: span(t, 0.26, 0.34) });
    vee(ctx, R, { color: [255, 232, 176], width: 4, s: 1.1 }); // carried over from scene 1: the match cut
    caption(ctx, R, 'draw it first', span(t, 0.5, 0.75), 1080, { color: CREAM });
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.45; ctx.drawImage(env.paper, 0, 0); ctx.restore();
  },
};

// ---------- 3 · store ----------

const LEVELS = [13, 38, 63];
const STACKS = (() => {
  const G = mul32(3131), out = [];
  LEVELS.forEach((y0, li) => [[-9.2, -3.7], [-3.1, 2.4]].forEach(([z0, z1], ci) => {
    const nb = [5, 4, 4][li] + (ci === 0 ? 1 : 0);
    for (let k = 0; k < nb; k++) {
      const tone = rd(G, 0, 1);
      out.push({ li, ci, k, top: k === nb - 1, x0: -70 + rd(G, -3, 3), x1: (li === 0 ? 30 : 46) + rd(G, -2.5, 3), y0: y0 + k * 1.02, z0: z0 + rd(G, -0.3, 0.3), z1: z1 + rd(G, -0.3, 0.3),
        mat: { ...RAW, c: mix(mix([240, 222, 190], [232, 204, 172], tone), [244, 214, 196], rd(G, 0, 0.5)) } });
    }
  }));
  return out;
})();
const CHOSEN = STACKS.find((b) => b.li === 1 && b.ci === 1 && b.top);
const BOWED = STACKS.find((b) => b.li === 2 && b.ci === 1 && b.top);
CHOSEN.x1 = 48; CHOSEN.mat = RAW;
const PIN3 = [CHOSEN.x1 - 15, CHOSEN.y0 + 1, (CHOSEN.z0 + CHOSEN.z1) / 2 + 0.6];
const P3 = camera({ eye: [84, 47, 84], target: [0, 37, -2], f: 1180, pin: PIN3, at: A });
const L3 = { dir: norm([0.12, 1, 0.3]), sun: [0.34, 0.35, 0.38], amb: [0.7, 0.71, 0.76], fill: { dir: norm([0.8, 0.1, 0.6]), k: 0.2 } };
const boardBox = (b) => box(b.x0, b.x1, b.y0, b.y0 + 1, b.z0, b.z1);

/** A board with a bow in it: short lengths, each tipped along an arc. */
function bowedBoard(b, bow) {
  const n = 9, out = [], len = (b.x1 - b.x0) / n;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, xa = b.x0 + i * len;
    const y = bow * Math.sin(u * Math.PI), slope = Math.atan((bow * Math.PI * Math.cos(u * Math.PI)) / (b.x1 - b.x0));
    out.push(turn(box(xa - 0.05, xa + len + 0.05, b.y0, b.y0 + 1, b.z0, b.z1, 0), 'z', slope, [xa + len / 2, b.y0 + 0.5, 0], [0, y, 0]));
  }
  return out;
}

function gripAt(R, P, end, sc = 0.8) {
  const a = P(end), b = P(add(end, [-12, 0, 0]));
  glove(R, a[0] + 6, a[1] - 2, Math.atan2(b[1] - a[1], b[0] - a[0]), sc, 0.75);
}

export const store = {
  id: 'store', dur: 4.5, step: 'buy',
  draw(ctx, t, R, env) {
    const S = env.still('store');
    const up1 = easeInOut(span(t, 0.06, 0.22)) - easeInOut(span(t, 0.4, 0.54));
    const up2 = easeInOut(span(t, 0.6, 0.82));
    background('store', () => {
      // The aisle: a back panel, a sealed concrete floor, a steel cantilever rack.
      fill(projectPoly(P3, [[-400, 260, -15], [300, 260, -15], [300, 0, -15], [-400, 0, -15]]), 'rgb(176,178,196)', 1.5, { press: 0.9 });
      const floor = projectPoly(P3, [[-400, 0, -15], [300, 0, -15], [300, 0, 78], [-400, 0, 78]], 3);
      fill(floor, 'rgb(214,212,216)', 0.2, { press: 0.8 });
      const all = STACKS.map(boardBox);
      shadow(P3, all, 0, L3, floor, { alpha: 0.8, blur: 9, color: [150, 150, 176] });
      glaze((p) => { // the lights, mirrored in the floor's seal
        trace(p, floor); p.clip(); p.filter = 'blur(10px)'; p.fillStyle = 'rgba(255,255,255,0.6)';
        for (const x of [-60, 10]) { trace(p, projectPoly(P3, [[x, 0, 20], [x + 40, 0, 20], [x + 40, 0, 26], [x, 0, 26]])); p.fill(); }
      });
      for (const ux of [-46, 22]) {
        solid(P3, box(ux, ux + 3.5, 0, 96, -13.5, -10), STEEL, L3, { R: S, key: `up${ux}` });
        solid(P3, box(ux - 3, ux + 6.5, 0, 1.2, -14, 6), STEEL, L3, { R: S, key: `foot${ux}` });
      }
      LEVELS.forEach((y, li) => {
        for (const ux of [-46, 22]) solid(P3, box(ux, ux + 3.5, y - 2.6, y, -10, 3.6), STEEL, L3, { R: S, key: `arm${ux}${li}` });
        // The dark between the stacks, then the boards.
        glaze((p) => { p.filter = 'blur(6px)'; p.fillStyle = 'rgba(70,70,100,0.5)'; trace(p, projectPoly(P3, [[-74, y + 9, -14.5], [50, y + 9, -14.5], [50, y - 1, -14.5], [-74, y - 1, -14.5]])); p.fill(); });
        for (const b of STACKS.filter((x) => x.li === li)) {
          if (b === CHOSEN || b === BOWED) continue;
          solid(P3, boardBox(b), b.mat, L3, { R: S, key: `b${b.li}${b.ci}${b.k}`, lineOpts: { alpha: 0.42, width: 1.1 } });
        }
        // A shelf tag on each arm: scribble, never a name.
        const tg = [[25.6, y - 0.4, 3.7], [25.6, y - 2.4, 3.7]].map(P3), a = P3([22.2, y - 0.4, 3.7]);
        fill([a, tg[0], tg[1], P3([22.2, y - 2.4, 3.7])], 'rgb(250,248,240)', 0, { press: 0.3 });
        aword(lines(), S, a[0] + 5, (a[1] + tg[1][1]) / 2 + 4, 6, 6, { color: PEN, alpha: 0.6 });
      });
    });
    // The bowed board comes off the top stack by its end, is sighted, and goes back.
    {
      const b = { ...BOWED, x0: BOWED.x0 + 16 * up1, x1: BOWED.x1 + 16 * up1, y0: BOWED.y0 + 4 * up1 };
      if (up1 > 0.02) {
        glaze((p) => { p.filter = 'blur(8px)'; p.fillStyle = `rgba(60,56,90,${0.35 * up1})`; trace(p, projectPoly(P3, [[BOWED.x0 + 16 * up1, BOWED.y0, BOWED.z0], [BOWED.x1, BOWED.y0, BOWED.z0], [BOWED.x1, BOWED.y0, BOWED.z1], [BOWED.x0 + 16 * up1, BOWED.y0, BOWED.z1]])); p.fill(); });
        bowedBoard(b, 2.6 * up1).forEach((seg, i) => solid(P3, seg, BOWED.mat, L3, { key: `bow${i}` }));
        const edge = []; for (let i = 0; i <= 18; i++) { const u = i / 18; edge.push(P3([lerp(b.x0, b.x1, u), b.y0 + 1 + 2.6 * up1 * Math.sin(u * Math.PI), b.z1])); }
        line(R, edge, { alpha: 0.75 });
        line(R, edge.map((q, i) => { const u = i / 18; return P3([lerp(b.x0, b.x1, u), b.y0 + 2.6 * up1 * Math.sin(u * Math.PI), b.z1]); }), { alpha: 0.75 });
        gripAt(R, P3, [b.x1, b.y0 + 0.5, (b.z0 + b.z1) / 2]);
      } else solid(P3, boardBox(BOWED), BOWED.mat, L3, { R, key: 'bowed' });
    }
    // The good one: straight, already marked. It rises toward us along the line of sight, so the V holds.
    {
      const ray = norm(sub(P3.eye, PIN3)), d = mul(ray, 9 * up2);
      if (up2 > 0.02) glaze((p) => { p.filter = 'blur(10px)'; p.fillStyle = `rgba(60,56,90,${0.45 * up2})`; trace(p, projectPoly(P3, [[CHOSEN.x0, CHOSEN.y0, CHOSEN.z0], [CHOSEN.x1, CHOSEN.y0, CHOSEN.z0], [CHOSEN.x1, CHOSEN.y0, CHOSEN.z1], [CHOSEN.x0, CHOSEN.y0, CHOSEN.z1]])); p.fill(); });
      solid(P3, shift(boardBox(CHOSEN), d), RAW, L3, { R, key: 'chosen' });
      vee3(lines(), R, P3, add(PIN3, d), { back: [-1, 0, 0], side: [0, 0, 1], s: 1.5 });
      if (t > 0.54) gripAt(R, P3, add([CHOSEN.x1, CHOSEN.y0 + 0.5, (CHOSEN.z0 + CHOSEN.z1) / 2], d), 0.8 + 0.06 * up2);
    }
    compose(ctx, env.paper);
    caption(ctx, R, 'pick good boards', span(t, 0.3, 0.6), 1080);
  },
};

// ---------- 4 · measure ----------

const PIN4 = [14, 35, 1.0];
const P4 = camera({ eye: [-50, 80, 46], target: [10, 34, -3], f: 1080, pin: PIN4, at: A });
const L4 = { dir: norm([-0.42, 0.8, -0.36]), sun: [0.56, 0.52, 0.42], amb: [0.6, 0.6, 0.68], fill: { dir: norm([0.3, 0.4, 0.8]), k: 0.12 } };
const BOARDS4 = [[-10, -6.3, -74, 66], [-5.6, -2.0, -70, 70], [-1.4, 4.2, -66, 78], [4.9, 9.8, -72, 60]].map(([z0, z1, x0, x1]) => box(x0, x1, 34, 35, z0, z1));
const LEAF = (() => { const G = mul32(19); return Array.from({ length: 44 }, () => [rd(G, -80, 1160), rd(G, -80, 1160), rd(G, 40, 130), rd(G, 26, 80), rd(G, 0, 3.1), rd(G, 0, 6.28)]); })();

/** Tree shade over the whole sheet: cool blots, swaying; the sun is what they leave. */
export function dapple(sec, alpha = 0.7) {
  glaze((p) => {
    p.globalCompositeOperation = 'multiply';
    p.filter = 'blur(16px)';
    p.fillStyle = `rgba(204,200,226,${alpha})`;
    for (const [x, y, rx, ry, a, ph] of LEAF) { p.beginPath(); p.ellipse(x + 16 * Math.sin(sec * 0.8 + ph), y + 9 * Math.cos(sec * 0.6 + ph * 2), rx, ry, a + 0.05 * Math.sin(sec + ph), 0, 6.3); p.fill(); }
  });
}

/** The driveway and the sawhorse bench every outdoor scene stands on. */
export function driveway(P, Lt, S, benchLen = [-84, 84], sky = 'rgb(226,232,238)') {
  fill(FULL, sky, 0.1, { press: 0.6 });
  const ground = projectPoly(P, [[-3000, 0, -3000], [3000, 0, -3000], [3000, 0, 120], [-3000, 0, 120]], 4);
  fill(ground, 'rgb(184,184,196)', 0.35);
  glaze((p) => {
    const G = mul32(88);
    trace(p, ground); p.clip();
    for (let i = 0; i < 1500; i++) { p.fillStyle = G() < 0.5 ? `rgba(60,60,84,${rd(G, 0.15, 0.4)})` : `rgba(250,250,255,${rd(G, 0.2, 0.5)})`; p.beginPath(); p.arc(rd(G, 0, 1080), rd(G, 0, 1080), rd(G, 0.6, 2.2), 0, 6.3); p.fill(); }
  });
  for (const pts of [[[-120, 0, 30], [-70, 0, 44], [-40, 0, 40], [0, 0, 62]], [[40, 0, -60], [70, 0, -30], [120, 0, -34]], [[-30, 0, -80], [-10, 0, -40], [-24, 0, -12]]]) line(S, projectPoly(P, pts, 4), { alpha: 0.4, width: 1.3, amp: 2 });
  const top = box(benchLen[0], benchLen[1], 32.4, 34, -12, 12);
  const horses = [];
  for (const x of [benchLen[0] + 22, benchLen[1] - 22]) {
    horses.push(box(x - 1.6, x + 1.6, 28.5, 32.4, -14, 14));
    for (const z of [-11, 11]) horses.push(turn(box(x - 1.4, x + 1.4, 0, 29, z - 1.4, z + 1.4), 'x', z > 0 ? 0.16 : -0.16, [x, 29, z]));
  }
  shadow(P, [top, ...horses], 0, Lt, ground, { alpha: 0.9, blur: 3, color: [120, 116, 150] });
  for (const h of horses) solid(P, h, BLACK, Lt, { R: S, key: 'horse' });
  solid(P, top, PLY, Lt, { R: S, key: 'bench' });
  return { top: projectPoly(P, top[0].pts) };
}

export const measure = {
  id: 'measure', dur: 4, step: 'measure',
  draw(ctx, t, R, env) {
    const S = env.still('measure');
    let benchTop;
    background('measure', () => {
      benchTop = driveway(P4, L4, S).top;
      shadow(P4, BOARDS4, 34, L4, benchTop, { alpha: 0.85, blur: 1.5 });
      BOARDS4.forEach((b, i) => solid(P4, b, RAW, L4, { R: S, key: `mb${i}` }));
      measure.top = benchTop;
    });
    // Measure, mark, measure again: the blade runs out past the anchor, the
    // pencil marks the V at the reading, the blade comes back and runs out to check.
    const out = easeOut(span(t, 0.03, 0.26)) - 0.72 * easeIn(span(t, 0.56, 0.64)) + 0.72 * easeOut(span(t, 0.68, 0.82));
    const tipX = lerp(-50, PIN4[0] + 9, out);
    const blade = box(-54.6, tipX, 35, 35.07, 2.2, 3.7);
    const caseB = box(-59.4, -54.6, 35, 39.6, 1.6, 4.4), hook = box(tipX, tipX + 0.2, 34.4, 35.6, 2.1, 3.8);
    shadow(P4, [caseB, blade], 35, L4, projectPoly(P4, BOARDS4[2][0].pts), { alpha: 0.85, blur: 1.5 });
    solid(P4, blade, { c: [250, 212, 104], line: 0.6 }, L4, { R, key: 'blade', lineOpts: { width: 1.2 } });
    glaze((p) => {
      p.strokeStyle = 'rgba(40,36,54,0.8)'; p.lineWidth = 1;
      for (let x = -54, i = 0; x < tipX; x += 0.5, i++) { const a = P4([x, 35.08, 2.2]), b = P4([x, 35.08, 2.2 + (i % 8 === 0 ? 0.9 : i % 2 === 0 ? 0.55 : 0.3)]); p.beginPath(); p.moveTo(...a); p.lineTo(...b); p.stroke(); }
    });
    solid(P4, hook, STEEL, L4, { R, key: 'hook', lineOpts: { width: 1.1 } });
    solid(P4, caseB, DARK, L4, { R, key: 'case' });
    glaze((p) => { p.fillStyle = 'rgba(214,216,226,0.9)'; const c = P4([-57, 37.3, 4.41]); p.beginPath(); p.ellipse(c[0], c[1], 15, 18, 0, 0, 6.3); p.fill(); });
    const mk = easeInOut(span(t, 0.35, 0.5));
    vee3(lines(), R, P4, PIN4, { upTo: mk, s: 1.5 });
    dapple(env.sec);
    if (t > 0.26 && t < 0.64) {
      const [a, b, c] = [[-0.75 * 1.5, 0, -1.15 * 1.5], [0, 0, 0], [0.75 * 1.5, 0, -1.15 * 1.5]].map((d) => P4(add(PIN4, d)));
      const tip = t < 0.35 ? lerp2([1280, 1160], a, easeOut(span(t, 0.26, 0.35)))
        : t < 0.5 ? (mk < 0.5 ? lerp2(a, b, mk * 2) : lerp2(b, c, mk * 2 - 1))
          : lerp2(c, [1300, 420], easeIn(span(t, 0.5, 0.64)));
      carpenterPencil(R, tip, 0.74, t > 0.5 ? span(t, 0.5, 0.58) : 1 - span(t, 0.28, 0.35), 0.66);
    }
    compose(ctx, env.paper);
    caption(ctx, R, 'measure twice', span(t, 0.62, 0.86), 1080);
  },
};
