// grain, scenes 9–11: glass, stain, glue-up.

import { chaikin } from '../../lib/draw/line.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { rgba } from '../../lib/draw/color.js';
import { caption, span, easeInOut, easeOut, easeIn, lerp, clamp } from '../common.js';
import { TABLE as T, camera, projectPoly, box, cyl, turn, shift, norm, add } from './geom.js';
import { A, rgb, trace, background, fill, glaze, line, lines, solid, shadow, compose, vee3 } from './kit.js';
import { RAW, STAIN, STEEL, DARK, GREY, BLACK, tableParts } from './table.js';
import { glove, motes, SUN } from './props.js';
import { garage } from './scenesB.js';

const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const KRAFT = { c: [214, 190, 150], line: 0.5 };

// ---------- 9 · glass ----------

const GX = T.glass.L / 2, GZ = T.glass.D / 2, FT = T.top; // the frame lies on the floor: its top is at y = FT
const PIN9 = [-3, FT, T.D / 2 - 2.4];
const P9 = camera({ eye: [7, 56, 36], target: [0, 0, 1], f: 1320, pin: PIN9, at: A });
const L9 = { dir: norm([-0.6, 0.7, 0.15]), sun: [0.56, 0.53, 0.44], amb: [0.62, 0.62, 0.68], fill: { dir: norm([0.5, 0.3, 0.8]), k: 0.12 } };
const RAILS9 = tableParts().filter((p) => p.group === 'rail').map((p) => ({ ...p, faces: shift(p.faces, [0, -(T.H - T.top), 0]) }));
const DOOR9 = [[-90, 0, -40], [-90, 0, 60], [70, 0, 30], [70, 0, -70]];
const LIP = 0.45, STEP = 0.28;
// The router's lap of the opening: front, right, back, left.
const LAP = [[[-GX, GZ], [GX, GZ]], [[GX, GZ], [GX, -GZ]], [[GX, -GZ], [-GX, -GZ]], [[-GX, -GZ], [-GX, GZ]]];
const LAPLEN = LAP.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1])), LAPSUM = LAPLEN.reduce((a, b) => a + b, 0);
function lapAt(u) {
  let d = clamp(u) * LAPSUM;
  for (let i = 0; i < 4; i++) { if (d <= LAPLEN[i] || i === 3) { const [a, b] = LAP[i], k = Math.min(1, d / LAPLEN[i]); return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], side: i, k }; } d -= LAPLEN[i]; }
}
/** One side's lip, from fraction k0 to k1 along it, at height y. */
function lipQuad(i, k0, k1, y) {
  const [a, b] = LAP[i], inx = -Math.sign(a[0] + b[0]) * LIP, inz = -Math.sign(a[1] + b[1]) * LIP;
  const p = (k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const q0 = p(k0), q1 = p(k1);
  return [[q0[0], y, q0[1]], [q1[0], y, q1[1]], [q1[0] + inx, y, q1[1] + inz], [q0[0] + inx, y, q0[1] + inz]].map(P9);
}
const CHIPS = (() => { const G = mul32(909); return Array.from({ length: 90 }, () => ({ tb: G(), v: [rd(G, -14, 14), rd(G, 6, 20), rd(G, -14, 14)], r: rd(G, 0.8, 2.2) })); })();

function glassPass(g, q, tilt, settle) {
  const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  g.save();
  trace(g, q); g.clip();
  g.globalAlpha = 0.4; g.drawImage(g.canvas, 3 + tilt * 30, 6 + tilt * 50); g.globalAlpha = 1;
  const lg = g.createLinearGradient(...q[3], ...q[1]);
  lg.addColorStop(0, 'rgba(140,190,178,0.10)'); lg.addColorStop(1, 'rgba(110,168,160,0.3)');
  g.fillStyle = lg; g.fillRect(0, 0, 1080, 1080);
  // The open door, reflected: it slides across the pane as the pane comes level.
  const u = 0.22 + tilt * 1.5;
  g.filter = 'blur(12px)';
  g.fillStyle = `rgba(250,252,250,${0.5 + 0.3 * tilt})`;
  trace(g, [mid(q[0], q[1], u), mid(q[0], q[1], u + 0.3), mid(q[3], q[2], u + 0.16), mid(q[3], q[2], u - 0.14)]); g.fill();
  g.filter = 'blur(1.5px)'; g.strokeStyle = 'rgba(255,255,250,0.85)'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(...mid(q[0], q[1], u + 0.36)); g.lineTo(...mid(q[3], q[2], u + 0.22)); g.stroke();
  if (settle > 0 && settle < 1) { g.filter = 'blur(20px)'; g.fillStyle = `rgba(255,255,250,${0.5 * Math.sin(settle * Math.PI)})`; g.fillRect(0, 0, 1080, 1080); }
  g.restore();
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(80,140,126,0.9)'; g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[3]); g.lineTo(...q[2]); g.lineTo(...q[1]); g.stroke();
  g.strokeStyle = 'rgba(255,255,248,0.85)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(q[3][0] + 2, q[3][1] - 2.4); g.lineTo(q[2][0] - 2, q[2][1] - 2.4); g.stroke();
}

export const glass = {
  id: 'glass', dur: 5, step: 'glass',
  draw(ctx, t, R, env) {
    const S = env.still('glass');
    background('glass', () => {
      garage(P9, S, DOOR9, { wz: -60 });
      const card = [[-27, 0.06, -19], [28, 0.06, -17], [27, 0.06, 20], [-28, 0.06, 18]];
      glaze((p) => { p.filter = 'blur(5px)'; p.fillStyle = 'rgba(60,50,70,0.4)'; trace(p, projectPoly(P9, card.map(([x, y, z]) => [x + 0.8, y, z + 0.5]))); p.fill(); });
      fill(projectPoly(P9, card), rgb(KRAFT.c), 0.1);
      line(S, [...projectPoly(P9, card), P9(card[0])], { alpha: 0.5 });
      shadow(P9, RAILS9.map((x) => x.faces), 0.06, L9, null, { alpha: 0.85, blur: 2, color: [176, 160, 170] });
    });
    const cutU = easeInOut(span(t, 0.05, 0.42)), at = lapAt(cutU);
    for (const r of RAILS9) solid(P9, r.faces, RAW, L9, { R, key: r.id });
    // The rabbet: a lip the glass will sit on, appearing behind the router.
    for (let i = 0; i < 4; i++) {
      const k = at.side > i ? 1 : at.side === i ? at.k : 0;
      if (k <= 0) continue;
      const q = lipQuad(i, 0, k, FT - STEP), ang = Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]);
      fill(q, i % 2 ? 'rgb(214,190,154)' : 'rgb(226,204,168)', ang, { keep: true });
      glaze((p) => { p.strokeStyle = 'rgba(90,60,44,0.7)'; p.lineWidth = 2; p.beginPath(); p.moveTo(...q[0]); p.lineTo(...q[1]); p.stroke(); });
      line(R, [q[3], q[2]], { alpha: 0.55, width: 1.2 });
    }
    vee3(lines(), R, P9, PIN9, { s: 1.4 });
    // Clear bumper pads on the lip, then the pane.
    const pads = span(t, 0.47, 0.52);
    if (pads > 0) glaze((p) => { p.fillStyle = `rgba(255,255,255,${0.9 * pads})`; p.strokeStyle = 'rgba(90,110,120,0.6)'; p.lineWidth = 1; for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const d of [[1.6, 0.22], [0.22, 1.4]]) { const c = P9([sx * (GX - d[0]), FT - STEP + 0.02, sz * (GZ - d[1])]); p.beginPath(); p.ellipse(c[0], c[1], 4.6, 3.2, 0, 0, 6.3); p.fill(); p.stroke(); } });
    // The router: base plate, motor, two knobs. It leans into the cut and lifts away when the lap is done.
    if (t < 0.5) {
      const off = easeIn(span(t, 0.42, 0.5)), jig = Math.sin(env.frame * 2.6) * 0.04 * (off > 0 ? 0 : 1);
      const c = [at.p[0] + jig + off * 16, FT + off * 22, at.p[1] - jig - off * 8];
      const parts = [cyl(c, [0, 1, 0], 3.1, 0.35, 28), cyl(add(c, [0, 0.35, 0]), [0, 1, 0], 1.9, 5.6, 24), cyl(add(c, [0, 5.95, 0]), [0, 1, 0], 1.5, 0.9, 20)];
      const knobs = [-1, 1].map((k) => cyl(add(c, [k * 3.2, 1.2, 0]), [0, 1, 0], 0.85, 2, 14));
      shadow(P9, [...parts, ...knobs], FT, L9, projectPoly(P9, [[-18, FT, -12], [18, FT, -12], [18, FT, 12], [-18, FT, 12]]), { alpha: 0.85, blur: 2.5 });
      shadow(P9, [...parts, ...knobs], 0.06, L9, null, { alpha: 0.3, blur: 4 });
      solid(P9, parts[0], STEEL, L9, { R, key: 'rbase' });
      solid(P9, knobs[0], BLACK, L9, { R, key: 'rk0' });
      solid(P9, parts[1], GREY, L9, { R, key: 'rmotor' });
      solid(P9, parts[2], DARK, L9, { R, key: 'rcap' });
      solid(P9, knobs[1], BLACK, L9, { R, key: 'rk1' });
    }
    const down = easeOut(span(t, 0.54, 0.8)), tilt = 0.5 * (1 - down);
    let pane = null;
    if (t > 0.54) {
      pane = turn(box(-GX + 0.06, GX - 0.06, FT - STEP + 0.04, FT, -GZ + 0.06, GZ - 0.06), 'x', -tilt, [0, FT - STEP, -GZ], [0, (1 - down) * 5, 0]);
      shadow(P9, [pane], 0.06, L9, null, { alpha: 0.22, blur: 5 });
      const q = projectPoly(P9, pane[0].pts);
      line(R, [...q, q[0]], { alpha: 0.5, width: 1.3, color: [60, 110, 100] });
    }
    compose(ctx, env.paper);
    if (pane) { ctx.save(); ctx.globalAlpha = Math.min(1, span(t, 0.54, 0.6)); glassPass(ctx, projectPoly(P9, pane[0].pts), tilt, span(t, 0.78, 0.9)); ctx.restore(); }
    // Chips off the bit.
    if (t < 0.44) for (const c of CHIPS) {
      const age = ((t * 5 + c.tb * 0.5) % 0.5);
      if (cutU <= 0.01 || cutU >= 0.99) break;
      const q = P9([at.p[0] + c.v[0] * age, FT + c.v[1] * age - 60 * age * age, at.p[1] + c.v[2] * age]);
      ctx.fillStyle = rgba([226, 196, 146], 0.9 - age * 1.4);
      ctx.beginPath(); ctx.arc(q[0], q[1], c.r, 0, 6.3); ctx.fill();
    }
    motes(ctx, env.sec, 9, [60, 80, 700, 620], 40, 0.5);
  },
};

// ---------- 10 · stain ----------

const PIN10 = [-3, 1.75, 4.6];
const P10 = camera({ eye: [0, 62, 38], target: [0, 0, 1], f: 1560, pin: PIN10, at: A });
const L10 = { dir: norm([-0.45, 0.8, -0.25]), sun: [0.5, 0.48, 0.42], amb: [0.62, 0.62, 0.7], fill: { dir: norm([0.4, 0.3, 0.8]), k: 0.12 } };
const LINER = { c: [104, 110, 136], line: 0.6, dense: true };
// Slats and two rails, laid across the ribs of a truck-bed liner: [x0, x1, z0, z1, thickness].
const PIECES = [[-11, 11.5, -16.6, -14, 0.75], [-12, 10.5, -12.8, -10.2, 0.75], [-10.5, 12, -9, -6.4, 0.75], [-11.5, 11, -5.2, -2.6, 0.75], [-18, 18, 0.4, 5.4, 1.25], [-17, 19, 7.2, 12.2, 1.25]];
const RAGBLOB = (() => { const G = mul32(40); return Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * 6.283, r = 46 + 13 * Math.sin(a * 3 + 1) + rd(G, -7, 7); return [r * Math.cos(a), r * 0.78 * Math.sin(a)]; }); })();

export const stain = {
  id: 'stain', dur: 4.5, step: 'stain',
  draw(ctx, t, R, env) {
    const S = env.still('stain');
    background('stain', () => {
      fill(projectPoly(P10, [[-200, 0, -200], [200, 0, -200], [200, 0, 80], [-200, 0, 80]], 3), 'rgb(92,98,124)', 1.4, { dense: true });
      for (let x = -66; x < 66; x += 6.4) solid(P10, box(x, x + 3.4, 0, 0.5, -90, 60, 2), LINER, L10, { R: S, key: 'rib', lineOpts: { alpha: 0.35, width: 1.1 } });
      shadow(P10, PIECES.map(([x0, x1, z0, z1, h]) => box(x0, x1, 0.5, 0.5 + h, z0, z1)), 0.5, L10, null, { alpha: 0.7, blur: 2.5, color: [120, 118, 150] });
      // The can, lid off, and its lid.
      const can = cyl([15.5, 0.5, 17], [0, 1, 0], 2.3, 4.6, 30);
      shadow(P10, [can], 0.5, L10, null, { alpha: 0.7, blur: 2.5, color: [120, 118, 150] });
      solid(P10, can, STEEL, L10, { R: S, key: 'can' });
      const ring = (r, y = 5.12) => Array.from({ length: 30 }, (_, i) => P10([15.5 + r * Math.cos(i * 0.2094), y, 17 + r * Math.sin(i * 0.2094)]));
      fill(ring(2.0), 'rgb(58,30,20)', 0.3, { dense: true, keep: true });
      glaze((p) => { p.filter = 'blur(3px)'; p.fillStyle = 'rgba(255,226,190,0.5)'; const c = P10([14.8, 5.13, 16.2]); p.beginPath(); p.ellipse(c[0], c[1], 16, 6, -0.3, 0, 6.3); p.fill(); });
      solid(P10, cyl([9.5, 0.5, 18.2], [0, 1, 0], 2.35, 0.25, 26), STEEL, L10, { R: S, key: 'lid' });
    });
    // The rag pushes the stain across each piece in turn. Colour enters here.
    let glovePos = null;
    // Back and forth, one piece after another, the way a hand actually works down a row.
    PIECES.forEach(([x0, x1, z0, z1, h], i) => {
      const u = easeInOut(span(t, 0.03 + i * 0.15, 0.18 + i * 0.15)), rev = i % 2 === 1;
      const xb = rev ? lerp(x1, x0, u) : lerp(x0, x1, u), y1 = 0.5 + h;
      const [sa, sb] = rev ? [xb, x1] : [x0, xb], [ra, rb] = rev ? [x0, xb] : [xb, x1];
      if (u > 0) solid(P10, box(sa, sb, 0.5, y1, z0, z1, 0), STAIN, L10, { R: u < 1 ? undefined : R, key: `piece${i}` });
      if (u < 1) solid(P10, box(ra, rb, 0.5, y1, z0, z1, 0), RAW, L10, { R: u > 0 ? undefined : R, key: `piece${i}` });
      if (u > 0 && u < 1) {
        const o = projectPoly(P10, box(x0, x1, 0.5, y1, z0, z1)[0].pts);
        line(R, [...o, o[0]], { alpha: 0.7 });
        // Wet, just behind the rag.
        glaze((p) => {
          trace(p, projectPoly(P10, [[sa, y1, z0], [sb, y1, z0], [sb, y1, z1], [sa, y1, z1]])); p.clip();
          const a = P10([xb + (rev ? 9 : -9), y1, z0]), b = P10([xb, y1, z0]);
          const lg = p.createLinearGradient(...a, ...b);
          lg.addColorStop(0, 'rgba(255,230,196,0)'); lg.addColorStop(1, 'rgba(255,230,196,0.5)');
          p.globalCompositeOperation = 'screen'; p.fillStyle = lg; p.fillRect(0, 0, 1080, 1080);
        });
      }
      const active = span(t, 0.03 + i * 0.15, 0.18 + i * 0.15);
      if ((active > 0 && active < 1) || (i === 0 && active <= 0) || (i === PIECES.length - 1 && active >= 1)) glovePos = P10([xb + (rev ? -0.6 : 0.6), y1, (z0 + z1) / 2]);
      if (i === 4) vee3(lines(), R, P10, PIN10, { s: 1.4, alpha: lerp(0.9, 0.55, span(u, 0.3, 0.6)), color: u > 0.45 ? [30, 14, 10] : undefined });
    });
    if (glovePos) {
      // The hand comes in at the start and leaves when the last piece is done.
      const inn = 1 - easeOut(span(t, 0, 0.05)), out = easeIn(span(t, 0.93, 1));
      const c = [glovePos[0] + (inn + out) * 420, glovePos[1] + (inn + out) * 520], ang = -2.2;
      const rag = chaikin(RAGBLOB.map(([x, y]) => [c[0] + x * Math.cos(ang) - y * Math.sin(ang), c[1] + x * Math.sin(ang) + y * Math.cos(ang)]), true, 2);
      glaze((p) => { p.filter = 'blur(7px)'; p.fillStyle = 'rgba(40,30,50,0.45)'; trace(p, rag.map(([x, y]) => [x + 6, y + 9])); p.fill(); });
      fill(rag, 'rgb(240,234,222)', ang + 0.7, { press: 0.7 });
      fill(rag.map(([x, y]) => [c[0] + (x - c[0]) * 0.6 - 8, c[1] + (y - c[1]) * 0.6 - 8]), 'rgb(120,66,42)', ang + 0.7, { dense: true });
      line(R, [...rag, rag[0]], { alpha: 0.6, amp: 1.6 });
      glove(R, c[0] + 34, c[1] + 40, ang, 0.66, 0.35);
    }
    compose(ctx, env.paper);
  },
};

// ---------- 11 · glue-up ----------

const PIN11 = [-3, 2.45, 0.75];
const P11 = camera({ eye: [14, 21, 36], target: [1, 5.2, 0], f: 1120, pin: PIN11, at: A });
const LEGX = T.D / 2 - T.leg / 2, G2 = T.leg / 2, LEGH = T.H - T.top;
const legAt = (x) => box(x - G2, x + G2, 0, LEGH, -G2, G2, 1);
const APRON11 = box(-LEGX + G2, LEGX - G2, 1.7, 3.2, -0.75, 0.75);
const POOL = [[-34, 0, -22], [30, 0, -26], [34, 0, 24], [-30, 0, 28]];

export const glueUp = {
  id: 'glue-up', dur: 5.5, step: 'glue-up',
  draw(ctx, t, R, env) {
    const S = env.still('glue-up');
    const night = easeInOut(span(t, 0.1, 0.85));
    const Lt = { dir: norm([-0.5, 0.72, 0.48]), sun: [0.86, 0.7, 0.46], amb: mix3([0.46, 0.47, 0.6], [0.34, 0.36, 0.52], night), fill: { dir: norm([0.6, 0.3, 0.6]), k: 0.08 } };
    background('glue-up', () => {
      garage(P11, S, null, { wz: -44 });
      // Glue, a paper towel, and the dowel pins still to go in.
      const bottle = [cyl([-15, 0, 6], [0, 1, 0], 1.0, 3.6, 18), cyl([-15, 3.6, 6], [0, 1, 0], 0.9, 0.5, 14, 0.5), cyl([-15, 4.1, 6], [0, 1, 0], 0.32, 1.3, 10, 0.16)];
      const G = mul32(71), pins = [];
      for (let i = 0; i < 5; i++) pins.push(turn(cyl([0, 0.19, 0], [1, 0, 0], 0.19, 1.5, 10), 'y', rd(G, -1.2, 1.2), [0, 0, 0], [13.5 + rd(G, -1.5, 2), 0, 5 + rd(G, -2, 2.5)]));
      shadow(P11, [...bottle, ...pins], 0, Lt, null, { alpha: 0.7, blur: 3, color: [100, 96, 140] });
      solid(P11, bottle[0], { c: [246, 240, 226], line: 0.6 }, Lt, { R: S, key: 'bottle' });
      solid(P11, bottle[1], { c: [246, 190, 84], line: 0.6 }, Lt, { R: S, key: 'cap' });
      solid(P11, bottle[2], { c: [246, 190, 84], line: 0.6 }, Lt, { R: S, key: 'tip' });
      pins.forEach((p, i) => solid(P11, p, RAW, Lt, { R: S, key: `pin${i}`, lineOpts: { width: 1.1 } }));
      const tw = chaikin(Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * 6.283, r = 1.9 + 0.7 * Math.sin(a * 4 + 2) + rd(G, -0.3, 0.3); return P11([-9 + r * 1.3 * Math.cos(a), 0.05, 9.5 + r * Math.sin(a)]); }), true, 1);
      fill(tw, 'rgb(250,248,242)', 0.5, { press: 0.4 });
      line(S, [...tw, tw[0]], { alpha: 0.5, amp: 1.6 });
      line(S, [tw[2], tw[7]], { alpha: 0.3, amp: 2 }); line(S, [tw[4], tw[10]], { alpha: 0.3, amp: 2 });
    });
    // The right leg closes onto its dowels; glue beads out of both joints.
    const close = easeInOut(span(t, 0.03, 0.2)), gap = (1 - close) * 3.4;
    const legL = legAt(-LEGX), legR = legAt(LEGX + gap);
    const fall = easeIn(span(t, 0.36, 0.56)), py = LEGH + (1 - fall) * 20;
    const caul = box(-14, 14, py, py + 0.75, -1.9, 1.9), plate = cyl([0, py + 0.75, 0], [0, 1, 0], 5.6, 1.15, 34), hubc = cyl([0, py + 1.9, 0], [0, 1, 0], 1.6, 0.25, 18);
    const dowels = [2.1, 2.8].map((y) => cyl([LEGX - G2 - 0.02, y, 0], [1, 0, 0], 0.19, 0.95, 10));
    const all = [legL, legR, APRON11, ...(t > 0.34 ? [caul, plate] : [])];
    shadow(P11, all, 0, Lt, null, { alpha: 0.85, blur: 3.5, color: mix3([110, 104, 146], [70, 70, 116], night) });
    solid(P11, legL, STAIN, Lt, { R, key: 'g-legL' });
    solid(P11, APRON11, STAIN, Lt, { R, key: 'g-apron' });
    vee3(lines(), R, P11, PIN11, { back: [0, 1, 0], side: [1, 0, 0], s: 0.62, width: 2.4, alpha: 0.6, color: [26, 12, 8] });
    if (gap > 0.05) dowels.forEach((d, i) => solid(P11, d, RAW, Lt, { R, key: `g-dowel${i}`, lineOpts: { width: 1.1 } }));
    solid(P11, legR, STAIN, Lt, { R, key: 'g-legR' });
    // Small screws at the lower corners.
    const drive = span(t, 0.22, 0.34);
    for (const x of [-LEGX, LEGX + gap]) {
      const c = P11([x, 2.45, G2 + 0.01]);
      fill(Array.from({ length: 14 }, (_, i) => [c[0] + 6.5 * Math.cos(i * 0.449), c[1] + 6.5 * Math.sin(i * 0.449)]), 'rgb(186,188,200)', 0.3, { keep: true });
      const a = drive * 9;
      line(R, [[c[0] - 5 * Math.cos(a), c[1] - 5 * Math.sin(a)], [c[0] + 5 * Math.cos(a), c[1] + 5 * Math.sin(a)]], { width: 1.6, amp: 0.1, alpha: 0.9 });
    }
    const squeeze = span(t, 0.17, 0.3);
    if (squeeze > 0) glaze((p) => {
      p.fillStyle = 'rgba(252,246,226,0.95)';
      for (const x of [-LEGX + G2, LEGX - G2]) for (const y of [1.75, 3.15]) { const c = P11([x, y, 0.76]); p.beginPath(); p.ellipse(c[0], c[1], 2 + 3.5 * squeeze, 1.6 + 2.6 * squeeze, 0, 0, 6.3); p.fill(); }
    });
    // Anything heavy will do for a clamp: a board across the legs, and a weight plate on it.
    if (t > 0.34) {
      const set = Math.sin(span(t, 0.56, 0.64) * Math.PI) * 0.0;
      solid(P11, shift(caul, [0, set, 0]), RAW, Lt, { R, key: 'caul' });
      solid(P11, plate, { c: [96, 92, 104], line: 0.85, dense: true }, Lt, { R, key: 'plate' });
      solid(P11, hubc, { c: [70, 68, 82], line: 0.8, dense: true }, Lt, { R, key: 'hub' });
    }
    // The wait: two slow gleams along the wood (two coats of polyurethane).
    for (const [a, b] of [[0.64, 0.8], [0.82, 0.98]]) {
      const g = span(t, a, b);
      if (g <= 0 || g >= 1) continue;
      glaze((p) => {
        p.beginPath();
        for (const f of [legL[2], legR[2], APRON11[2]]) { const q = projectPoly(P11, f.pts); p.moveTo(...q[0]); for (const v of q.slice(1)) p.lineTo(...v); p.closePath(); }
        p.clip();
        const gx = lerp(250, 860, easeInOut(g));
        const lg = p.createLinearGradient(gx - 80, 0, gx + 80, 60);
        lg.addColorStop(0, 'rgba(255,232,196,0)'); lg.addColorStop(0.5, 'rgba(255,232,196,0.6)'); lg.addColorStop(1, 'rgba(255,232,196,0)');
        p.globalCompositeOperation = 'screen'; p.fillStyle = lg; p.fillRect(0, 0, 1080, 1080);
      });
    }
    // The work light's pool: outside it the garage falls toward night.
    glaze((p) => {
      const c = P11([0, 3, 0]);
      const pool = p.createRadialGradient(c[0], c[1], 150, c[0], c[1], 780);
      pool.addColorStop(0, 'rgb(255,244,222)');
      pool.addColorStop(1, rgb(mix3([200, 196, 214], [72, 78, 130], night)));
      p.globalCompositeOperation = 'multiply'; p.fillStyle = pool; p.fillRect(0, 0, 1080, 1080);
    });
    compose(ctx, env.paper);
    if (t > 0.555 && t < 0.7) { // the plate lands: a breath of dust off the floor
      const k = span(t, 0.555, 0.7);
      ctx.save(); ctx.filter = 'blur(12px)'; ctx.fillStyle = `rgba(236,226,206,${0.3 * (1 - k)})`;
      for (const x of [-LEGX, LEGX]) { const c = P11([x, 0.3, 1]); ctx.beginPath(); ctx.ellipse(c[0], c[1] - 6 * k, 30 + 50 * k, 10 + 14 * k, 0, 0, 6.3); ctx.fill(); }
      ctx.restore();
    }
    caption(ctx, R, 'clamp and wait', span(t, 0.6, 0.82), 1080, { color: [246, 236, 214] });
  },
};
