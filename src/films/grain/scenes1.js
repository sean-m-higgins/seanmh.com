// grain, scenes 1–4: mark, design, store, measure.

import { pencil } from '../../lib/draw/line.js';
import { hatchFill, tracePoly } from '../../lib/draw/fill.js';
import { hand } from '../../lib/draw/hand.js';
import { rgba } from '../../lib/draw/color.js';
import { mul32, rd } from '../../lib/draw/rng.js';
import { caption, span, easeInOut, easeOut, easeIn, lerp } from '../common.js';
import { A, homeCamera, buildHome } from './home.js';
import { PEN, SUN, NAVY, CREAM, face, woodGrain, dropShadow, vee, rect, tooth, outline } from './ink.js';

const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/**
 * A flat carpenter's pencil, its tip at `tip`, its body running off at
 * `angle`. lift (0..1) raises it off the paper: the shadow drifts away.
 */
export function carpenterPencil(ctx, R, S, tip, angle, lift = 0) {
  const body = [[46, -15], [520, -15], [520, 15], [46, 15]];
  const wood = [[10, -4], [46, -15], [46, 15], [10, 4]];
  const lead = [[0, -2], [10, -4], [10, 4], [0, 2]];
  ctx.save();
  ctx.translate(tip[0], tip[1]);
  ctx.rotate(angle);
  dropShadow(ctx, [[0, 0], [46, -15], [520, -15], [520, 15], [46, 15]], 10 + lift * 30, 14 + lift * 40, 6 + lift * 14, 0.3 - lift * 0.15);
  face(ctx, R, S, body, 'dark', 0.2, { angle: 0, spacing: 3 });
  hatchFill(ctx, S, [[46, -15], [520, -15], [520, -6], [46, -6]], { color: [200, 196, 206], spacing: 3, angle: 0, alpha: 0.35 });
  face(ctx, R, S, wood, 'raw', 0.1, { angle: 0 });
  face(ctx, R, S, lead, 'dark', 0.6, { angle: 0, lineOpts: { width: 1.2 } });
  ctx.restore();
}

// ---------- 1 · mark ----------

export const mark = {
  id: 'mark', dur: 3,
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('mark');
    const vL = [A[0] - 20, A[1] - 28], vR = [A[0] + 20, A[1] - 28];
    const draw = span(t, 0.3, 0.52);
    let tip, lift = 0;
    if (t < 0.3) tip = lerp2([1240, 1180], vL, easeOut(span(t, 0, 0.27)));
    else if (t < 0.52) tip = draw < 0.5 ? lerp2(vL, A, draw * 2) : lerp2(A, vR, draw * 2 - 1);
    else { const u = easeIn(span(t, 0.56, 0.78)); tip = lerp2(vR, [1320, 300], u); lift = Math.min(1, u * 2); }
    vee(ctx, R, { upTo: draw });
    // A few graphite crumbs, left where the V was drawn.
    if (t > 0.42) {
      const C = mul32(77);
      ctx.fillStyle = rgba(PEN, 0.55);
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(A[0] + rd(C, -40, 50), A[1] + rd(C, -10, 30), rd(C, 0.8, 2), 0, 6.3); ctx.fill(); }
    }
    if (t < 0.8) carpenterPencil(ctx, R, S, tip, 0.72, lift);
    tooth(ctx, env.paper, 0.35);
  },
};

// ---------- 2 · design ----------

const P = homeCamera();
const DESIGN = buildHome(P).filter((p) => ['oak', 'oak-top', 'slat', 'glass'].includes(p.kind));
// Legs first, then the top, the glass, the shelf and its slats: the order you'd draw it.
const order = (p) => (p.kind === 'oak' && p.face !== 'top' ? 0 : p.kind === 'oak-top' ? 1 : p.kind === 'glass' ? 2 : p.kind === 'oak' ? 3 : 4);
DESIGN.sort((a, b) => order(a) - order(b));

function dim(ctx, R, a, b, off, label, write) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = (-dy / l) * off, ny = (dx / l) * off;
  const a2 = [a[0] + nx, a[1] + ny], b2 = [b[0] + nx, b[1] + ny];
  const pen = { color: CREAM, width: 1.6, alpha: 0.75, amp: 0.6, upTo: write };
  pencil(ctx, R, [a2, b2], pen);
  pencil(ctx, R, [[a2[0] - nx * 0.3, a2[1] - ny * 0.3], [a2[0] + nx * 0.3, a2[1] + ny * 0.3]], pen);
  pencil(ctx, R, [[b2[0] - nx * 0.3, b2[1] - ny * 0.3], [b2[0] + nx * 0.3, b2[1] + ny * 0.3]], pen);
  const m = [(a2[0] + b2[0]) / 2 + nx * 0.6, (a2[1] + b2[1]) / 2 + ny * 0.6 + 10];
  hand(ctx, R, label, m[0], m[1], 22, { color: CREAM, align: 'center', width: 2.6, alpha: 0.9, upTo: span(write, 0.5, 1) });
}

export const design = {
  id: 'design', dur: 5, step: 'design',
  draw(ctx, t, R, env) {
    ctx.fillStyle = rgba(NAVY, 1);
    ctx.fillRect(0, 0, 1080, 1080);
    const S = env.still('design');
    // A faint drafting grid, held still.
    hatchFill(ctx, S, [[0, 0], [1080, 0], [1080, 1080], [0, 1080]], { color: CREAM, spacing: 36, angle: 0, alpha: 0.07, straight: true, width: 1 });
    hatchFill(ctx, S, [[0, 0], [1080, 0], [1080, 1080], [0, 1080]], { color: CREAM, spacing: 36, angle: Math.PI / 2, alpha: 0.07, straight: true, width: 1 });
    // The table, line by line.
    const n = DESIGN.length;
    DESIGN.forEach((p, i) => {
      const t0 = 0.04 + (i / n) * 0.58;
      const w = span(t, t0, t0 + 0.1);
      if (w <= 0) return;
      const glass = p.kind === 'glass';
      pencil(ctx, R, [...p.pts, p.pts[0]], { color: CREAM, width: glass ? 1.4 : 2, alpha: glass ? 0.55 : 0.88, amp: 0.8, upTo: w, step: 5 });
    });
    // Dimensions: 36 long, 24 deep, 12 tall; the glass 30 x 14.
    const T = (x, y, z) => P([x, y, z]);
    dim(ctx, R, T(-18, 0, 12), T(18, 0, 12), 40, '36', span(t, 0.62, 0.74));
    dim(ctx, R, T(-18, 12, 12), T(-18, 12, -12), -44, '24', span(t, 0.68, 0.8));
    dim(ctx, R, T(18, 0, 12), T(18, 12, 12), 44, '12', span(t, 0.74, 0.86));
    hand(ctx, R, '30 x 14', ...T(0, 12, 0), 20, { color: CREAM, align: 'center', width: 2.2, alpha: 0.6, upTo: span(t, 0.8, 0.92) });
    vee(ctx, R, { color: [255, 236, 190], width: 4, s: 1.2 }); // carried over from scene 1: the match cut
    caption(ctx, R, 'draw it first', span(t, 0.5, 0.75), 1080, { color: CREAM });
    tooth(ctx, env.paper, 0.4);
  },
};

// ---------- 3 · store ----------

const SHELVES = [250, 440, 666, 900];
// The chosen board is the top of the 666 stack, its face across the anchor.
const CHOSEN_Y = 666 - 4 * 30; // 546: the face spans 546–574, the V at 560
function rackBoard(ctx, R, S, y, h, bow = 0) {
  // A long board seen side-on, slightly bowed; end grain at the left end.
  const pts = [];
  for (let i = 0; i <= 12; i++) { const u = i / 12, x = lerp(30, 1060, u); pts.push([x, y - bow * Math.sin(u * Math.PI)]); }
  for (let i = 12; i >= 0; i--) { const u = i / 12, x = lerp(30, 1060, u); pts.push([x, y + h - bow * Math.sin(u * Math.PI)]); }
  face(ctx, R, S, pts, 'raw', 0.45, { angle: 0, spacing: 2.8 });
  face(ctx, R, S, [[30, y], [44, y - 3], [44, y + h - 3], [30, y + h]], 'raw', 0.8, { angle: Math.PI / 2, lineOpts: { width: 1.2 } });
}

function handAt(ctx, R, S, x, y, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  const SKIN = { base: [[240, 222, 204], [228, 206, 186], [206, 180, 160]], hatch: [196, 160, 132], deep: [150, 116, 96], line: 0.55 };
  // Four fingers curl over the board's top edge; the back of the hand shows below it.
  for (let i = 0; i < 4; i++) {
    const fx = -26 + i * 15, fl = i === 0 || i === 3 ? 20 : 24;
    face(ctx, R, S, [[fx, -fl + 6], [fx + 12, -fl + 6], [fx + 12, 10], [fx, 10]], SKIN, 0.1, { angle: 1.57, lineOpts: { width: 1.3, amp: 1.2 } });
  }
  face(ctx, R, S, [[-30, 8], [32, 6], [36, 40], [-26, 44]], SKIN, 0.35, { angle: 1.2, lineOpts: { width: 1.3, amp: 1.2 } });
  ctx.restore();
}

/** A board lifted toward us: scaled about (cx, cy), with a deepening shadow and hands. */
function liftedBoard(ctx, R, S, y, u, bow, cx, cy, hands, after) {
  const s = 1 + 0.14 * u;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
  dropShadow(ctx, [[30, y], [1060, y], [1060, y + 28], [30, y + 28]], 0, 40 * u, 18, 0.38 * u);
  rackBoard(ctx, R, S, y, 28, bow * u);
  if (hands) { handAt(ctx, R, S, 300, y + 4, 1); handAt(ctx, R, S, 780, y + 4, -1); }
  if (after) after();
  ctx.restore();
}

export const store = {
  id: 'store', dur: 4, step: 'buy',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('store');
    // Store: a cool, even overhead light; long tubes up top.
    hatchFill(ctx, S, [[0, 0], [1080, 0], [1080, 1080], [0, 1080]], { color: [150, 156, 176], spacing: 7, angle: 1.45, alpha: 0.12 });
    for (const x of [140, 600]) {
      ctx.save(); ctx.filter = 'blur(16px)'; ctx.fillStyle = 'rgba(255,253,244,0.8)'; ctx.fillRect(x, 40, 360, 26); ctx.restore();
      outline(ctx, R, rect(x, 46, 360, 14), { alpha: 0.35, width: 1.4 });
    }
    for (const x of [96, 980]) face(ctx, R, S, rect(x - 14, 120, 28, 960), 'metal', 0.45, { angle: Math.PI / 2 });
    for (const y of SHELVES) for (const x of [96, 980]) face(ctx, R, S, [[x - 40, y], [x + 40, y], [x + 40, y + 16], [x - 40, y + 16]], 'metal', 0.2, { angle: 0 });
    // Board 1 (bowed) comes off the top of the 440 stack, is sighted, and goes back.
    // Board 2 (straight, already marked) is the top of the 666 stack; it is lifted toward us.
    const up1 = easeInOut(span(t, 0.08, 0.22)) - easeInOut(span(t, 0.4, 0.5));
    const up2 = easeInOut(span(t, 0.56, 0.76));
    for (const y of SHELVES) {
      for (let k = 1; k <= 4; k++) {
        if (y === 440 && k === 4 && up1 > 0) continue;
        if (y === 666 && k === 4) continue; // the chosen board, drawn below
        rackBoard(ctx, R, S, y - k * 30, 28);
      }
    }
    const y1 = 440 - 4 * 30;
    if (up1 > 0) liftedBoard(ctx, R, S, lerp(y1, y1 - 30, up1), up1, 22, 540, y1 + 14, up1 > 0.6, null);
    else rackBoard(ctx, R, S, y1, 28);
    // Scaling about the anchor keeps the V exactly where it is: a match cut in, and out.
    liftedBoard(ctx, R, S, CHOSEN_Y, up2, 0, A[0], A[1], up2 > 0.6, () => vee(ctx, R, { s: 0.7 }));
    caption(ctx, R, 'pick good boards', span(t, 0.28, 0.58), 1080);
    tooth(ctx, env.paper, 0.4);
  },
};

// ---------- 4 · measure ----------

const BOARDS = [[420, 468], [478, 526], [536, 586], [596, 642]];
const blobs = (seed, n) => { const B = mul32(seed); return Array.from({ length: n }, () => [rd(B, -100, 1180), rd(B, -60, 1140), rd(B, 50, 150), rd(B, 30, 90), rd(B, 0, 3)]); };
const SUNLIT = blobs(9, 9), LEAVES = blobs(19, 14);

export const measure = {
  id: 'measure', dur: 4, step: 'measure',
  draw(ctx, t, R, env) {
    ctx.drawImage(env.paper, 0, 0);
    const S = env.still('measure');
    // The driveway, then the bench top, then four boards on it.
    hatchFill(ctx, S, [[0, 0], [1080, 0], [1080, 1080], [0, 1080]], { color: [96, 94, 104], spacing: 3.2, angle: 0.3, alpha: 0.16 });
    hatchFill(ctx, S, [[0, 0], [1080, 0], [1080, 1080], [0, 1080]], { color: [96, 94, 104], spacing: 5, angle: -0.9, alpha: 0.1 });
    for (const c of [[[0, 180], [260, 230], [420, 160]], [[700, 980], [880, 900], [1080, 940]]]) pencil(ctx, S, c, { color: PEN, width: 1.2, alpha: 0.3 });
    dropShadow(ctx, rect(-20, 380, 1120, 300), 10, 18, 14, 0.3);
    face(ctx, R, S, rect(-20, 380, 1120, 300), 'bench', 0.8, { angle: 0, hatchAlpha: 0.35 });
    for (const [y0, y1] of BOARDS) {
      const b = [[-30, y0], [1110, y0], [1110, y1], [-30, y1]];
      dropShadow(ctx, b, 4, 6, 4, 0.22);
      face(ctx, R, S, b, 'raw', 0, { angle: 0, hatchAlpha: 0.4 });
      woodGrain(ctx, S, b, { count: 5, wave: 3, alpha: 0.28 });
    }
    // Dappled light through the tree: sunlit patches (the accent) and leaf shadow, drifting.
    const drift = 14 * t;
    ctx.save(); ctx.filter = 'blur(26px)';
    for (const [x, y, rx, ry, a] of SUNLIT) { ctx.fillStyle = rgba(SUN, 0.22); ctx.beginPath(); ctx.ellipse(x + drift, y, rx, ry, a, 0, 6.3); ctx.fill(); }
    for (const [x, y, rx, ry, a] of LEAVES) { ctx.fillStyle = 'rgba(40,40,60,0.1)'; ctx.beginPath(); ctx.ellipse(x + drift * 1.3, y, rx * 0.7, ry * 0.6, a, 0, 6.3); ctx.fill(); }
    ctx.restore();
    // Measure -> mark -> measure again. The tape runs out to the anchor; the
    // pencil draws the V there; the tape comes back and runs out again to check.
    const reach = (u) => lerp(190, 800, u);
    const out = easeOut(span(t, 0.03, 0.26)) - 0.75 * easeIn(span(t, 0.56, 0.64)) + 0.75 * easeOut(span(t, 0.67, 0.8));
    const tipX = reach(out);
    const blade = [[170, 562], [tipX, 562], [tipX, 586], [170, 586]];
    face(ctx, R, S, blade, { base: [[238, 224, 172], [226, 210, 160], [200, 186, 140]], hatch: [196, 176, 110], deep: [150, 130, 80], line: 0.8 }, 0, { angle: 0, hatchAlpha: 0.3 });
    ctx.save(); tracePoly(ctx, blade); ctx.clip();
    for (let x = 180, i = 0; x < tipX; x += 9, i++) pencil(ctx, S, [[x, 562], [x, 562 + (i % 8 === 0 ? 14 : i % 4 === 0 ? 10 : 6)]], { color: PEN, width: 1.1, alpha: 0.75, amp: 0.2, step: 3, taper: false });
    ctx.restore();
    face(ctx, R, S, rect(tipX - 4, 556, 8, 34), 'metal', 0.4, { angle: Math.PI / 2 });
    // The tape measure, top-down: a rounded case, the spool inside, a belt clip.
    const round = (cx, cy, r, n = 40) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 6.283), cy + r * Math.sin((i / n) * 6.283)]);
    const caseP = [[70, 520], [160, 520], [176, 536], [176, 614], [160, 630], [70, 630], [54, 614], [54, 536]];
    dropShadow(ctx, caseP, 8, 12, 8, 0.3);
    face(ctx, R, S, caseP, 'dark', 0.2, { angle: 0.3 });
    face(ctx, R, S, round(112, 575, 34), 'metal', 0, { angle: 0.3, hatchAlpha: 0.3 });
    face(ctx, R, S, round(112, 575, 10, 20), 'dark', 0.5, { angle: 0.3, lineOpts: { width: 1.2 } });
    face(ctx, R, S, rect(80, 500, 64, 18), 'metal', 0.45, { angle: 0 });
    // The mark goes down between the two measures.
    const mk = span(t, 0.34, 0.5);
    vee(ctx, R, { upTo: mk, alpha: 0.9 });
    if (t > 0.27 && t < 0.62) {
      const vL = [A[0] - 20, A[1] - 28], vR = [A[0] + 20, A[1] - 28];
      const tip = t < 0.34 ? lerp2([1300, 1100], vL, easeOut(span(t, 0.27, 0.34)))
        : t < 0.5 ? (mk < 0.5 ? lerp2(vL, A, mk * 2) : lerp2(A, vR, mk * 2 - 1))
          : lerp2(vR, [1300, 300], easeIn(span(t, 0.5, 0.62)));
      carpenterPencil(ctx, R, S, tip, 0.72, t > 0.5 ? span(t, 0.5, 0.58) : 0);
    }
    caption(ctx, R, 'measure twice', span(t, 0.62, 0.86), 1080);
    tooth(ctx, env.paper, 0.4);
  },
};
