// grain, scenes 5–8: cut, legs, sand, dry fit.

import { pencil } from '../../lib/draw/line.js';
import { hatchFill, tracePoly } from '../../lib/draw/fill.js';
import { hand } from '../../lib/draw/hand.js';
import { rgba, mix } from '../../lib/draw/color.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { caption, span, easeInOut, easeOut, easeIn, lerp } from '../common.js';
import { A, buildHome } from './home.js';
import { camera, projectPoly } from './geom.js';
import { PEN, SUN, SHADE, face, woodGrain, dropShadow, vee, rect, tooth } from './ink.js';

const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const circle = (cx, cy, rx, ry = rx, n = 48, rot = 0) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * 6.283;
  const x = rx * Math.cos(a), y = ry * Math.sin(a);
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const full = [[0, 0], [1080, 0], [1080, 1080], [0, 1080]];

// ---------- 5 · cut ----------

// The board lies on the saw's bed, running up to the right; the V is on its top.
const BOARD = { a: [40, 660], b: [1000, 440], w: 46, th: 20 };
const along = (u, k = 0) => { const { a, b, w } = BOARD; const p = lerp2(a, b, u); return [p[0], p[1] + w * k]; };
const U_CUT = (A[0] - BOARD.a[0]) / (BOARD.b[0] - BOARD.a[0]);
const PIVOT = [880, 300], BLADE_DOWN = [548, 470], BLADE_R = 128;
const DUST = (() => { const D = mul32(55); return Array.from({ length: 160 }, () => ({ tb: rd(D, 0.42, 0.62), a: rd(D, -3.05, -1.75), v: rd(D, 260, 980), r: rd(D, 1, 3.2), k: D() })); })();

function boardPiece(ctx, R, S, u0, u1, dx = 0, dy = 0, rot = 0) {
  const top = [along(u0), along(u1), along(u1, 1), along(u0, 1)];
  const front = [along(u0, 1), along(u1, 1), [along(u1, 1)[0], along(u1, 1)[1] + BOARD.th], [along(u0, 1)[0], along(u0, 1)[1] + BOARD.th]];
  ctx.save();
  const c = along((u0 + u1) / 2, 0.5);
  ctx.translate(c[0] + dx, c[1] + dy); ctx.rotate(rot); ctx.translate(-c[0], -c[1]);
  face(ctx, R, S, top, 'raw', 0, { hatchAlpha: 0.45 });
  woodGrain(ctx, S, top, { count: 4, wave: 2, alpha: 0.3, rays: false });
  face(ctx, R, S, front, 'raw', 'front');
  ctx.restore();
}

export const cut = {
  id: 'cut', dur: 4, step: 'cut',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('cut');
    // The driveway behind; the bench top; the saw's base and turntable; the fence.
    hatchFill(ctx, S, full, { color: [96, 94, 104], spacing: 3.4, angle: 0.3, alpha: 0.14 });
    face(ctx, R, S, [[-20, 520], [1100, 300], [1100, 1100], [-20, 1100]], 'bench', 0.8, { hatchAlpha: 0.3, angle: -0.2 });
    face(ctx, R, S, [[150, 760], [880, 590], [1010, 690], [280, 880]], 'metal', 0.45, { angle: -0.23 });
    face(ctx, R, S, circle(575, 640, 250, 92, 60, -0.23), 'metal', 0.1, { angle: -0.23, hatchAlpha: 0.3 });
    face(ctx, R, S, [[330, 520], [900, 392], [900, 432], [330, 560]], 'metal', 'front', { angle: -0.22 });
    // The board: whole until the cut, then two pieces; the offcut drops a touch and settles.
    const cutDone = t > 0.46;
    const drop = easeOut(span(t, 0.5, 0.62));
    if (!cutDone) boardPiece(ctx, R, S, 0, 1);
    else {
      boardPiece(ctx, R, S, 0, U_CUT);
      boardPiece(ctx, R, S, U_CUT + 0.004, 1, 4 * drop, 7 * drop, 0.02 * drop);
      pencil(ctx, R, [along(U_CUT), along(U_CUT, 1)], { color: [70, 50, 40], width: 2.4, alpha: 0.8 });
    }
    vee(ctx, R, { s: 0.7, alpha: 0.85 });
    // The arm: rests up, lifts a touch (anticipation), chops down through the V, rises.
    // Positive phi lifts the arm (rotating the blade up and back about the pivot).
    const phi = t < 0.15 ? 0.5 : t < 0.25 ? lerp(0.5, 0.58, easeOut(span(t, 0.15, 0.25)))
      : t < 0.45 ? lerp(0.58, 0, easeIn(span(t, 0.25, 0.45))) : t < 0.6 ? 0 : lerp(0, 0.5, easeInOut(span(t, 0.6, 0.8)));
    const spinning = t > 0.18 && t < 0.78;
    ctx.save();
    ctx.translate(PIVOT[0], PIVOT[1]); ctx.rotate(phi); ctx.translate(-PIVOT[0], -PIVOT[1]);
    const [bx, by] = BLADE_DOWN;
    // While cutting, the blade's lower edge is hidden in the board's kerf.
    ctx.save();
    // The blade is always clipped out of the board, so it sinks into the kerf smoothly (no pop).
    ctx.beginPath(); ctx.rect(-2000, -2000, 5000, 5000);
    const bp = [along(0), along(1), [along(1, 1)[0], along(1, 1)[1] + BOARD.th], [along(0, 1)[0], along(0, 1)[1] + BOARD.th]];
    ctx.moveTo(...bp[0]); bp.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.closePath();
    ctx.clip('evenodd');
    face(ctx, R, S, circle(bx, by, BLADE_R, BLADE_R * 0.92, 60), 'metal', 0.1, { angle: 0.6, hatchAlpha: 0.3 });
    const spin = spinning ? env.frame * 0.9 : 0;
    ctx.strokeStyle = rgba(PEN, spinning ? 0.25 : 0.7);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 6.283 + spin, a2 = a + 0.08;
      ctx.beginPath();
      ctx.moveTo(bx + BLADE_R * Math.cos(a), by + BLADE_R * 0.92 * Math.sin(a));
      ctx.lineTo(bx + (BLADE_R + 7) * Math.cos(a2), by + (BLADE_R + 7) * 0.92 * Math.sin(a2));
      ctx.stroke();
    }
    if (spinning) {
      // Motion arcs that rotate steadily with the blade, rather than re-randomising every frame.
      ctx.strokeStyle = 'rgba(255,255,250,0.45)'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        const r = BLADE_R * (0.45 + k * 0.17), a0 = spin * (1 - k * 0.15) + k * 2.1;
        ctx.beginPath(); ctx.ellipse(bx, by, r, r * 0.92, 0, a0, a0 + 2.2); ctx.stroke();
      }
    }
    face(ctx, R, S, circle(bx, by, 22, 20, 24), 'dark', 0.4, { angle: 0 });
    ctx.restore();
    // One connected arm: beam from the pivot to the hub, motor at the hub, the
    // guard over the blade's upper half, and the handle rising from the guard.
    const beam = [[PIVOT[0] - 8, PIVOT[1] - 30], [bx + 30, by - 46], [bx + 30, by + 4], [PIVOT[0] + 8, PIVOT[1] + 30]];
    face(ctx, R, S, beam, 'metal', 0.3, { angle: Math.atan2(by - PIVOT[1], bx - PIVOT[0]) });
    const guard = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; guard.push([bx + (BLADE_R + 16) * Math.cos(a), by + (BLADE_R + 16) * 0.92 * Math.sin(a)]); }
    face(ctx, R, S, guard, 'metal', 'front', { angle: 0.3 });
    face(ctx, R, S, circle(bx + 70, by - 40, 58, 52, 36), 'dark', 0.45, { angle: 0.9 });
    face(ctx, R, S, [[bx - 70, by - 110], [bx - 120, by - 200], [bx - 92, by - 214], [bx - 40, by - 122]], 'dark', 0.2, { angle: -1.05 });
    face(ctx, R, S, [[bx - 120, by - 200], [bx - 20, by - 236], [bx - 10, by - 210], [bx - 92, by - 182]], 'dark', 0.2, { angle: -0.35 });
    ctx.restore();
    face(ctx, R, S, circle(PIVOT[0], PIVOT[1], 30, 30, 24), 'dark', 0.6, { angle: 0 });
    // Sawdust: a burst out of the cut, in the sunlight (this scene's accent), falling.
    const g = 1100;
    for (const p of DUST) {
      const age = (t - p.tb) * 4;
      if (age <= 0 || age > 1.6) continue;
      const x = A[0] + Math.cos(p.a) * p.v * age, y = A[1] + Math.sin(p.a) * p.v * age + 0.5 * g * age * age;
      ctx.fillStyle = rgba(mix(SUN, [214, 186, 140], p.k), Math.max(0, 0.9 - age * 0.55));
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.3); ctx.fill();
    }
    caption(ctx, R, 'cut once', span(t, 0.5, 0.66), 1080);
    tooth(ctx, env.paper, 0.4);
  },
};

// ---------- 6 · legs ----------

const BLOCKS = [['B1', 230, 250], ['B2', 470, 250], ['B3', 230, 490], ['B4', 470, 490]];
const HOLE = [A[0], A[1] + 36];

export const legs = {
  id: 'legs', dur: 3,
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('legs');
    face(ctx, R, S, full, 'bench', 0.8, { angle: 0.1, hatchAlpha: 0.3, line: false });
    BLOCKS.forEach(([label, x, y], i) => {
      const sq = rect(x, y, 220, 220);
      dropShadow(ctx, sq, 10, 14, 10, 0.35);
      face(ctx, R, S, sq, 'raw', 0, { angle: 0.8, hatchAlpha: 0.3 });
      // Growth rings, centred off the block (the pith is outside it), drawn in.
      const G = mul32(900 + i), cx = x + rd(G, -160, 380), cy = y + rd(G, 260, 420);
      ctx.save(); tracePoly(ctx, sq); ctx.clip();
      for (let k = 0; k < 16; k++) {
        const r = 80 + k * 26 + rd(G, -6, 6);
        pencil(ctx, G, circle(cx, cy, r, r, 90).slice(48, 90), { color: [150, 112, 72], width: 1.3, alpha: 0.45, amp: 1, upTo: span(t, 0.02 + k * 0.012, 0.2 + k * 0.012), taper: false });
      }
      ctx.restore();
      hand(ctx, R, label, x + 18, y + 48, 26, { color: [24, 22, 30], width: 5, alpha: 0.9, upTo: span(t, 0.05 + i * 0.04, 0.2 + i * 0.04) });
    });
    vee(ctx, R, { s: 0.8 });
    // The drill comes down at the V, bores, and lifts away; the hole and a curl of shavings stay.
    const bored = t > 0.62;
    if (bored) {
      face(ctx, R, S, circle(HOLE[0], HOLE[1], 17), 'dark', 0.8, { angle: 0.5 });
      const C = mul32(31);
      for (let k = 0; k < 3; k++) {
        const cx = HOLE[0] + rd(C, 30, 60), cy = HOLE[1] + rd(C, -10, 40), pts = [];
        for (let j = 0; j < 30; j++) { const a = j * 0.45, r = 3 + j * 0.9; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a) * 0.6]); }
        pencil(ctx, R, pts, { color: [176, 136, 92], width: 2.6, alpha: 0.85, amp: 0.4 });
      }
    }
    const inn = easeOut(span(t, 0.36, 0.5)), out = easeIn(span(t, 0.76, 0.92));
    if (inn > 0 && out < 1) {
      const sc = lerp(1.6, 1, inn) * lerp(1, 1.6, out);
      const off = lerp2([320, -320], [0, 0], inn), off2 = lerp2([0, 0], [320, -320], out);
      ctx.save();
      ctx.translate(HOLE[0] + off[0] + off2[0], HOLE[1] + off[1] + off2[1]); ctx.scale(sc, sc);
      // A pistol-grip drill: body running up and back from the chuck, the trigger
      // handle dropping from it, the battery at the handle's foot. Drawn in profile
      // so it reads as a drill; the bit is seen end-on at the hole.
      ctx.rotate(-0.72);
      const bodyP = [[40, -46], [330, -58], [352, -36], [352, 36], [330, 58], [40, 46]];
      const handleP = [[210, 50], [262, 50], [300, 250], [246, 258]];
      const batteryP = [[196, 250], [340, 236], [348, 300], [204, 314]];
      dropShadow(ctx, [...bodyP, ...handleP, ...batteryP], 22, 26, 14, 0.3);
      face(ctx, R, S, batteryP, 'dark', 0.6, { angle: -0.1 });
      face(ctx, R, S, handleP, 'dark', 0.45, { angle: 1.4 });
      face(ctx, R, S, [[214, 66], [232, 66], [240, 104], [222, 108]], 'metal', 0.3, { angle: 1.4 });
      face(ctx, R, S, bodyP, 'dark', 0.2, { angle: 0 });
      for (let k = 0; k < 4; k++) pencil(ctx, R, [[270 + k * 14, -40], [270 + k * 14, 40]], { color: [150, 146, 160], width: 2, alpha: 0.6, amp: 0.3 });
      face(ctx, R, S, [[0, -26], [44, -40], [44, 40], [0, 26]], 'metal', 0.3, { angle: 0 });
      ctx.rotate(0.72);
      face(ctx, R, S, circle(0, 0, 30), 'metal', 0.2, { angle: 0.6 });
      face(ctx, R, S, circle(0, 0, 18), 'metal', 0.5, { angle: 0.6 });
      const spin = t > 0.5 && t < 0.76 ? env.frame * 1.1 : 0;
      for (let k = 0; k < 2; k++) {
        const pts = []; for (let j = 0; j < 20; j++) { const a = spin + k * Math.PI + j * 0.28, r = 3 + j * 0.9; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
        pencil(ctx, R, pts, { color: PEN, width: 2, alpha: 0.8, amp: 0.2, taper: false });
      }
      ctx.restore();
    }
    tooth(ctx, env.paper, 0.4);
  },
};

// ---------- 7 · sand ----------

const SBOARD = [[-40, 330], [1120, 330], [1120, 790], [-40, 790]];
/** The sander's path: a closed figure, two laps in the scene, so it loops. */
const sanderAt = (t) => [560 + 200 * Math.sin(t * 2 * 6.283), 556 + 80 * Math.sin(t * 4 * 6.283 + 0.6)];

export const sand = {
  id: 'sand', dur: 5, step: 'sand',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('sand');
    face(ctx, R, S, full, 'bench', 0.8, { angle: 0, hatchAlpha: 0.3, line: false });
    dropShadow(ctx, SBOARD, 0, 16, 12, 0.35);
    face(ctx, R, S, SBOARD, 'raw', 0, { angle: 0, hatchAlpha: 0.32 });
    woodGrain(ctx, S, SBOARD, { count: 26, wave: 12, alpha: 0.34 });
    // The V fades as the sander passes over it, but it survives.
    vee(ctx, R, { alpha: env.loop ? 0.6 : lerp(0.9, 0.42, easeInOut(t)) });
    // The light swings from the left to the right over the scene (time passing).
    const light = env.loop ? 0.3 : t;
    const th = lerp(0.6, 2.5, light);
    const [cx, cy] = sanderAt(t);
    const jig = [Math.sin(env.frame * 2.3) * 1.5, Math.cos(env.frame * 3.1) * 1.5];
    // Dust haze trailing the pad.
    ctx.save(); ctx.filter = 'blur(18px)';
    for (let k = 1; k <= 6; k++) { const [px, py] = sanderAt(t - k * 0.02); ctx.fillStyle = `rgba(244,232,206,${0.22 - k * 0.03})`; ctx.beginPath(); ctx.arc(px, py, 130, 0, 6.3); ctx.fill(); }
    ctx.restore();
    ctx.save();
    ctx.translate(cx + jig[0], cy + jig[1]);
    dropShadow(ctx, circle(0, 0, 128), Math.cos(th) * 26, Math.sin(th) * 22 + 10, 14, 0.38);
    face(ctx, R, S, circle(0, 0, 128), 'dark', 0.6, { angle: 0.4 });
    face(ctx, R, S, circle(-4, -6, 108, 102), 'metal', 0.2, { angle: 0.4, hatchAlpha: 0.35 });
    face(ctx, R, S, circle(-8, -12, 62, 56), 'dark', 0.3, { angle: 0.4 });
    face(ctx, R, S, rect(90, -30, 110, 60, 0.2), 'dark', 0.5, { angle: 0.2 });
    ctx.restore();
    // Late afternoon to dusk: the whole sheet cools.
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = rgba(mix([255, 232, 196], [196, 200, 236], light), 0.55);
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.restore();
    caption(ctx, R, 'sanding to smooth', env.loop ? 1 : span(t, 0.2, 0.5), 1080);
    tooth(ctx, env.paper, 0.4);
  },
};

// ---------- 8 · dry fit ----------

const PIN8 = [-3, 2.45, 11.63]; // the front lower apron's face
const P8 = camera({ eye: [26, 20, 44], target: [0, 5, -2], f: 900, pin: PIN8, at: A });
const TABLE8 = buildHome(P8).filter((p) => ['oak', 'oak-top', 'slat'].includes(p.kind));

export const dryFit = {
  id: 'dry-fit', dur: 5, step: 'dry fit',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('dry-fit');
    // The garage: pegboard wall, concrete floor, a coiled cord, all held still and soft.
    const wall = projectPoly(P8, [[-120, 90, -50], [120, 90, -50], [120, 0, -50], [-120, 0, -50]]);
    const floor = projectPoly(P8, [[-120, 0, -50], [120, 0, -50], [120, 0, 60], [-120, 0, 60]]);
    face(ctx, R, S, wall, 'paper', 0.45, { angle: 1.5, hatchAlpha: 0.25, line: false });
    ctx.fillStyle = rgba([110, 104, 120], 0.35);
    for (let x = -110; x < 110; x += 4) for (let y = 30; y < 88; y += 4) { const [px, py] = P8([x, y, -49.5]); if (px > -10 && px < 1090 && py > -10) { ctx.beginPath(); ctx.arc(px, py, 1.6, 0, 6.3); ctx.fill(); } }
    face(ctx, R, S, floor, 'paper', 0.6, { angle: 0.15, hatchAlpha: 0.3, line: false });
    const coil = []; for (let j = 0; j < 160; j++) { const a = j * 0.21, r = 14 + (j % 40) * 0.12; coil.push(P8([-46 + r * Math.cos(a), 0.5, -34 + r * Math.sin(a) * 0.9])); }
    pencil(ctx, S, coil, { color: [60, 56, 70], width: 3, alpha: 0.4, amp: 1, taper: false });
    // A soft contact shadow under the frame.
    ctx.save(); ctx.filter = 'blur(16px)'; ctx.fillStyle = 'rgba(50,40,44,0.3)'; tracePoly(ctx, projectPoly(P8, [[-20, 0, -14], [20, 0, -14], [20, 0, 14], [-20, 0, 14]])); ctx.fill(); ctx.restore();
    // Legs and aprons stand already. Slats drop in one after another; then the top rails.
    for (const p of TABLE8) {
      let d = 0;
      if (p.kind === 'slat') {
        const i = p.i, u = easeOut(span(t, 0.08 + i * 0.06, 0.2 + i * 0.06));
        if (u <= 0) continue;
        d = (1 - u) * -160;
      } else if (p.kind === 'oak-top') {
        const order = { back: 0, left: 1, right: 2, front: 3, end: 2 }[p.rail] ?? 0;
        const u = easeOut(span(t, 0.62 + order * 0.06, 0.76 + order * 0.06));
        if (u <= 0) continue;
        d = (1 - u) * -200;
      }
      const pts = d ? p.pts.map(([x, y]) => [x, y + d]) : p.pts;
      face(ctx, R, S, pts, 'raw', SHADE[p.face] ?? 0);
    }
    vee(ctx, R, { s: 0.8 });
    tooth(ctx, env.paper, 0.4);
  },
};
