// grain, scenes 9–11: glass, stain, glue-up.

import { pencil } from '../../lib/draw/line.js';
import { hatchFill, tracePoly } from '../../lib/draw/fill.js';
import { rgba, mix } from '../../lib/draw/color.js';
import { mul32, rd, fbm } from '../../lib/draw/rng.js';
import { caption, span, easeInOut, easeOut, lerp } from '../common.js';
import { A } from './home.js';
import { photoGlass } from './looks.js';
import { PEN, face, woodGrain, dropShadow, vee, rect, tooth } from './ink.js';

const circle = (cx, cy, rx, ry = rx, n = 40) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 6.283), cy + ry * Math.sin((i / n) * 6.283)]);
const full = [[0, 0], [1080, 0], [1080, 1080], [0, 1080]];

// ---------- 9 · glass ----------

// Top-down on the top frame at 25 px per inch: 36 x 24, the V on the front rail.
const IN = 25, CX = A[0] + 3 * 25, CY = A[1] - 9.6 * 25;
const X = (x) => CX + x * IN, Y = (z) => CY + z * IN;
const OUTER = [[X(-18), Y(-12)], [X(18), Y(-12)], [X(18), Y(12)], [X(-18), Y(12)]];
const GLASS = [[X(-15), Y(-7)], [X(15), Y(-7)], [X(15), Y(7)], [X(-15), Y(7)]];
const LEDGE = 0.45; // inches of rabbet lip the glass rests on
const HOLE = [[X(-15 + LEDGE), Y(-7 + LEDGE)], [X(15 - LEDGE), Y(-7 + LEDGE)], [X(15 - LEDGE), Y(7 - LEDGE)], [X(-15 + LEDGE), Y(7 - LEDGE)]];

/** A point u (0..1) of the way round a closed polygon. */
function around(poly, u) {
  const segs = poly.map((p, i) => [p, poly[(i + 1) % poly.length]]);
  const lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  let d = (((u % 1) + 1) % 1) * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= lens[i]) { const [a, b] = segs[i], k = d / lens[i]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
    d -= lens[i];
  }
  return poly[0];
}
const pathTo = (poly, u, n = 80) => Array.from({ length: Math.max(2, Math.ceil(n * u)) }, (_, i) => around(poly, (i / Math.max(1, Math.ceil(n * u) - 1)) * u));

export const glass = {
  id: 'glass', dur: 5, step: 'glass',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('glass');
    // The garage floor; through the opening, far below, the slatted shelf.
    face(ctx, R, S, full, 'paper', 0.6, { angle: 0.2, hatchAlpha: 0.3, line: false });
    dropShadow(ctx, OUTER, 14, 20, 16, 0.35);
    ctx.save(); tracePoly(ctx, HOLE); ctx.clip();
    face(ctx, R, S, full, 'paper', 0.8, { angle: 0.2, hatchAlpha: 0.35, line: false });
    for (let i = 0; i < 7; i++) {
      const x = X(-14 + i * 4.6);
      face(ctx, R, S, [[x, Y(-11)], [x + 62, Y(-11)], [x + 62, Y(11)], [x, Y(11)]], 'raw', 0.45, { angle: Math.PI / 2 });
    }
    ctx.fillStyle = 'rgba(40,30,40,0.22)'; ctx.fillRect(0, 0, 1080, 1080);
    ctx.restore();
    // The four rails of the frame, raw oak, butted at the corners.
    const rails = [
      [[X(-18), Y(-12)], [X(18), Y(-12)], [X(18), Y(-7)], [X(-18), Y(-7)]],
      [[X(-18), Y(7)], [X(18), Y(7)], [X(18), Y(12)], [X(-18), Y(12)]],
      [[X(-18), Y(-7)], [X(-15), Y(-7)], [X(-15), Y(7)], [X(-18), Y(7)]],
      [[X(15), Y(-7)], [X(18), Y(-7)], [X(18), Y(7)], [X(15), Y(7)]],
    ];
    for (const r of rails) { face(ctx, R, S, r, 'raw', 0, { hatchAlpha: 0.4 }); woodGrain(ctx, S, r, { count: 4, wave: 3, alpha: 0.3, rays: false }); }
    // The router runs once round the opening, cutting the lip the glass will sit on.
    const cutU = easeInOut(span(t, 0.05, 0.42));
    if (cutU > 0) {
      const ledgePath = pathTo(GLASS, cutU);
      pencil(ctx, R, ledgePath, { color: [120, 90, 60], width: 2.2, alpha: 0.8, amp: 0.5, taper: false });
      ctx.save(); ctx.beginPath(); tracePoly(ctx, GLASS); ctx.moveTo(...HOLE[0]); HOLE.slice().reverse().forEach((p) => ctx.lineTo(...p)); ctx.closePath(); ctx.clip('evenodd');
      hatchFill(ctx, S, GLASS, { color: [150, 116, 78], spacing: 2.4, angle: 0.5, alpha: 0.5 * Math.min(1, cutU * 3) });
      ctx.restore();
    }
    vee(ctx, R, { s: 0.8 });
    if (t > 0.03 && t < 0.48) {
      const out = span(t, 0.42, 0.48);
      const [rx, ry] = around(GLASS, cutU);
      ctx.save();
      ctx.translate(rx + out * 260, ry - out * 260);
      dropShadow(ctx, circle(0, 0, 74), 14, 18, 12, 0.35);
      face(ctx, R, S, circle(0, 0, 74), 'metal', 0.2, { angle: 0.6, hatchAlpha: 0.25, baseAlpha: 0.85 });
      face(ctx, R, S, circle(0, 0, 46), 'dark', 0.45, { angle: 0.6 });
      for (const k of [-1, 1]) face(ctx, R, S, circle(k * 76, 0, 18, 22), 'dark', 0.3, { angle: 0 });
      ctx.restore();
    }
    // Clear bumper pads at the corners, then the pane lowers in and sits flush.
    if (t > 0.44) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const [x, y] of GLASS) { ctx.beginPath(); ctx.arc(x + (x < CX ? 10 : -10), y + (y < CY ? 10 : -10), 6, 0, 6.3); ctx.fill(); }
    }
    const down = easeOut(span(t, 0.5, 0.72));
    if (down > 0) {
      const sc = lerp(1.14, 1, down), gx = (GLASS[0][0] + GLASS[1][0]) / 2, gy = (GLASS[0][1] + GLASS[2][1]) / 2;
      const pts = GLASS.map(([x, y]) => [gx + (x - gx) * sc, gy + (y - gy) * sc]);
      dropShadow(ctx, pts, lerp(30, 3, down), lerp(36, 4, down), lerp(18, 3, down), 0.22 * down);
      ctx.save(); ctx.globalAlpha = Math.min(1, down * 2); photoGlass(ctx, { pts }); ctx.restore();
    }
    tooth(ctx, env.paper, 0.4);
  },
};

// ---------- 10 · stain ----------

const PIECES = [[150, 250, 880, 64], [120, 340, 930, 64], [130, 508, 900, 100], [170, 640, 860, 64], [140, 728, 900, 64]];

export const stain = {
  id: 'stain', dur: 4, step: 'stain',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('stain');
    // The ribbed truck-bed liner: dark, ribs running across.
    face(ctx, R, S, full, 'dark', 0.6, { angle: 0, line: false });
    for (let y = -20; y < 1100; y += 92) {
      face(ctx, R, S, rect(-20, y, 1120, 46), 'dark', 0.2, { angle: 0, line: false });
      pencil(ctx, S, [[-20, y], [1100, y]], { color: [150, 146, 160], width: 1.4, alpha: 0.35, taper: false });
    }
    // The pieces, raw; then the rag pushes stain across each in turn. Colour enters here.
    PIECES.forEach(([x, y, w, h], i) => {
      const b = rect(x, y, w, h);
      dropShadow(ctx, b, 6, 10, 8, 0.4);
      face(ctx, R, S, b, 'raw', 0, { angle: 0, hatchAlpha: 0.4 });
      woodGrain(ctx, S, b, { count: h > 80 ? 6 : 4, wave: 3, alpha: 0.3, rays: false });
      const u = easeInOut(span(t, 0.04 + i * 0.15, 0.3 + i * 0.15));
      if (u <= 0) return;
      const edge = lerp(x - 40, x + w + 50, u);
      const wet = [];
      for (let yy = y - 4; yy <= y + h + 4; yy += 6) wet.push([edge + 22 * (fbm(yy / 40, i, 7, 2) - 0.5) + 10 * Math.sin(yy * 0.2 + i), yy]);
      const region = [[x - 4, y - 4], ...wet, [x - 4, y + h + 4]];
      ctx.save(); tracePoly(ctx, b); ctx.clip();
      face(ctx, R, S, region, 'stain', 0, { angle: 0, line: false });
      woodGrain(ctx, S, b, { count: h > 80 ? 6 : 4, wave: 3, alpha: 0.4, color: [40, 20, 12], rays: false });
      // Wet sheen, brightest just behind the leading edge.
      const sheen = ctx.createLinearGradient(edge - 260, 0, edge, 0);
      sheen.addColorStop(0, 'rgba(255,236,200,0)'); sheen.addColorStop(1, `rgba(255,236,200,${0.35 * (1 - span(t, 0.9, 1))})`);
      ctx.fillStyle = sheen; tracePoly(ctx, region); ctx.fill();
      ctx.restore();
      if (u < 1) {
        // The rag: a bunched cloth at the leading edge, darkened where it's soaked.
        const G = mul32(40 + i), blob = [];
        for (let k = 0; k < 22; k++) { const a = (k / 22) * 6.283, r = 54 + 14 * Math.sin(a * 3 + i) + rd(G, -6, 6); blob.push([edge + 20 + r * Math.cos(a), y + h / 2 + r * 0.8 * Math.sin(a)]); }
        dropShadow(ctx, blob, 8, 12, 10, 0.4);
        face(ctx, R, S, blob, 'paper', 0.2, { angle: 0.8 });
        face(ctx, R, S, blob.map(([bx, by]) => [lerp(edge + 20, bx, 0.6) - 18, lerp(y + h / 2, by, 0.6)]), 'stain', 0.3, { angle: 0.8, line: false, baseAlpha: 0.7 });
      }
    });
    // The V, faint now under the stain once the third piece is done.
    vee(ctx, R, { s: 0.8, alpha: t > 0.5 ? 0.42 : 0.9 });
    // The stain can at the edge of frame, lid off.
    dropShadow(ctx, circle(980, 930, 112), 10, 14, 10, 0.4);
    face(ctx, R, S, circle(980, 930, 112), 'metal', 0.2, { angle: 0.5 });
    face(ctx, R, S, circle(980, 930, 96), { base: [[60, 30, 18], [44, 22, 14], [30, 16, 10]], hatch: [30, 14, 8], deep: [20, 10, 6], line: 0.6 }, 0, { angle: 0.5 });
    ctx.save(); ctx.filter = 'blur(6px)'; ctx.fillStyle = 'rgba(255,230,190,0.35)'; ctx.beginPath(); ctx.ellipse(950, 900, 40, 14, -0.5, 0, 6.3); ctx.fill(); ctx.restore();
    tooth(ctx, env.paper, 0.4);
  },
};

// ---------- 11 · glue-up ----------

const LEGS = [[380, 360, 64, 540], [640, 360, 64, 540]];
const RAIL = [444, 528, 196, 64]; // the V sits on this rail's face
const LOW = [444, 800, 196, 44];

export const glueUp = {
  id: 'glue-up', dur: 5, step: 'glue-up',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('glue-up');
    // Night in the garage: the open door goes from dusk to dark behind.
    const sky = mix([128, 146, 196], [30, 36, 62], easeInOut(span(t, 0.1, 0.8)));
    face(ctx, R, S, full, 'paper', 0.8, { angle: 1.4, hatchAlpha: 0.3, line: false });
    face(ctx, R, S, rect(40, 60, 330, 560), { base: [sky, mix(sky, [0, 0, 0], 0.15), mix(sky, [0, 0, 0], 0.3)], hatch: mix(sky, [0, 0, 0], 0.3), deep: mix(sky, [0, 0, 0], 0.5), line: 0.6 }, 0, { angle: 1.5 });
    face(ctx, R, S, [[0, 900], [1080, 900], [1080, 1080], [0, 1080]], 'paper', 0.6, { angle: 0, hatchAlpha: 0.35 });
    // The weight plate's descent squeezes a bead of glue from each joint.
    const plate = easeInOut(span(t, 0.34, 0.56));
    const squeeze = span(t, 0.5, 0.6);
    for (const r of [...LEGS, RAIL, LOW]) dropShadow(ctx, rect(...r), 8, 10, 10, 0.4);
    for (const r of LEGS) face(ctx, R, S, rect(...r), 'stain', 'front', { angle: Math.PI / 2 });
    face(ctx, R, S, rect(...RAIL), 'stain', 'front', { angle: 0 });
    face(ctx, R, S, rect(...LOW), 'stain', 'front', { angle: 0 });
    // Dowels tap in at the rail ends, raw and pale against the stain.
    const dowel = easeOut(span(t, 0.03, 0.18));
    for (const [x, y] of [[444, 548], [444, 576], [640, 548], [640, 576]]) {
      const dx = x === 444 ? -1 : 1;
      face(ctx, R, S, rect(x + dx * lerp(30, 0, dowel) - 8, y - 5, 16, 10), 'raw', 0, { angle: 0, lineOpts: { width: 1.1 } });
    }
    // Small screws drive at the lower corners.
    const drive = span(t, 0.18, 0.32);
    for (const [x, y] of [[412, 822], [672, 822]]) {
      const a = drive * 9;
      face(ctx, R, S, circle(x, y, 8), 'metal', 0.2, { angle: 0 });
      pencil(ctx, R, [[x - 6 * Math.cos(a), y - 6 * Math.sin(a)], [x + 6 * Math.cos(a), y + 6 * Math.sin(a)]], { color: PEN, width: 1.6, amp: 0.1, taper: false });
    }
    if (squeeze > 0) {
      ctx.fillStyle = `rgba(250,244,226,${0.85 * squeeze})`;
      for (const [x, y] of [[444, 528], [444, 592], [640, 528], [640, 592]]) { ctx.beginPath(); ctx.ellipse(x, y, 4 + 4 * squeeze, 3 + 3 * squeeze, 0, 0, 6.3); ctx.fill(); }
    }
    // The weight plate, edge-on: heavy, slow, no overshoot. It rests across both legs.
    const py = lerp(-140, 304, plate);
    const plateP = [[330, py], [754, py], [770, py + 28], [754, py + 56], [330, py + 56], [314, py + 28]];
    dropShadow(ctx, plateP, 8, 10, 10, 0.4 * plate);
    face(ctx, R, S, plateP, 'dark', 0.45, { angle: 0 });
    face(ctx, R, S, rect(470, py - 6, 144, 8), 'dark', 0.2, { angle: 0 });
    // The wait: two slow gleams along the wood (two coats of polyurethane).
    for (const [a, b] of [[0.62, 0.78], [0.8, 0.96]]) {
      const g = span(t, a, b);
      if (g <= 0 || g >= 1) continue;
      const gx = lerp(250, 830, easeInOut(g));
      ctx.save();
      for (const r of [...LEGS, RAIL, LOW]) { ctx.beginPath(); ctx.rect(...r); }
      ctx.clip();
      const lg = ctx.createLinearGradient(gx - 70, 0, gx + 70, 0);
      lg.addColorStop(0, 'rgba(255,236,200,0)'); lg.addColorStop(0.5, 'rgba(255,236,200,0.5)'); lg.addColorStop(1, 'rgba(255,236,200,0)');
      ctx.fillStyle = lg; ctx.fillRect(gx - 70, 0, 140, 1080);
      ctx.restore();
    }
    vee(ctx, R, { s: 0.8, alpha: 0.45, color: [30, 16, 10] });
    // The work light's pool: everything outside it falls toward night.
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const pool = ctx.createRadialGradient(560, 560, 120, 560, 560, 760);
    pool.addColorStop(0, 'rgba(255,240,214,1)');
    pool.addColorStop(1, rgba(mix([255, 240, 214], [40, 44, 74], 0.4 + 0.35 * easeInOut(span(t, 0.1, 0.8))), 1));
    ctx.fillStyle = pool; ctx.fillRect(0, 0, 1080, 1080);
    ctx.restore();
    caption(ctx, R, 'clamp and wait', span(t, 0.56, 0.8), 1080, { color: [244, 232, 208] });
    tooth(ctx, env.paper, 0.35);
  },
};
