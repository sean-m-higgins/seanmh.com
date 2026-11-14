// The three candidate looks for grain (gate 3), all drawn from the same
// geometry. A: etched coloured pencil. B: warm pastel. C: A, plus one
// near-photographic pass on the glass.
// Light is window light from the back-left: tops are lit, fronts half-shaded,
// right faces darkest. Shading is held (still); outlines boil (R).

import { pencil, chaikin, resample } from '../../lib/draw/line.js';
import { hatchFill, pastelFill, tracePoly } from '../../lib/draw/fill.js';
import { rgba, mix } from '../../lib/draw/color.js';
import { mul32, rd } from '../../lib/draw/rng.js';

export const PEN = [43, 38, 58];
const C = {
  stainDeep: [44, 22, 15], stain: [82, 42, 26], stainLit: [128, 70, 42], sheen: [255, 232, 196],
  couch: [214, 212, 220], couchShade: [150, 148, 168], wall: [196, 184, 166], floor: [196, 162, 118],
  sun: [242, 181, 68], sky: [150, 184, 214], glass: [160, 198, 190], cork: [196, 150, 98],
  books: [[44, 66, 112], [176, 86, 58], [112, 134, 104]], pages: [236, 228, 208],
};
const SHADE = { top: 0, front: 0.45, right: 0.8 };

const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
/** Grain runs along a face's longer edge. */
const grain = (pts) => (len(pts[0], pts[1]) >= len(pts[1], pts[2]) ? ang(pts[0], pts[1]) : ang(pts[1], pts[2]));
// Soft furniture: resample the edges first so chaikin only rounds the corners (radius ≈ 16 px).
const soften = (part) => (part.kind === 'couch' || part.kind === 'cushion' ? { ...part, pts: chaikin(resample([...part.pts, part.pts[0]], 16).slice(0, -1), true, 2) } : part);
const outline = (ctx, R, pts, o) => pencil(ctx, R, [...pts, pts[0]], { width: 2, amp: 1.1, alpha: 0.8, color: PEN, step: 6, ...o });

// ---------- A: etched coloured pencil ----------

function etched(ctx, part, R, S) {
  const { kind, pts, face = 'top' } = part;
  const sh = SHADE[face] ?? 0;
  const h = (o) => hatchFill(ctx, S, pts, { width: 1.1, amp: 0.7, ...o });
  switch (kind) {
    case 'wall':
      h({ color: C.wall, spacing: 7, angle: 1.35, alpha: 0.2 });
      return;
    case 'floor':
      h({ color: C.floor, spacing: 3.5, angle: grain(pts) + 0.02, alpha: 0.3 });
      h({ color: [150, 112, 74], spacing: 9, angle: grain(pts) + 0.04, alpha: 0.18 });
      return;
    case 'boards':
      part.lines.forEach((l, i) => { if (i % 2 === 0) pencil(ctx, S, l, { color: [120, 88, 60], width: 1, alpha: 0.14, amp: 0.8, taper: false, step: 12, smooth: 1 }); });
      return;
    case 'baseboard':
      outline(ctx, R, pts, { alpha: 0.35, width: 1.4 });
      return;
    case 'contact':
      ctx.save(); ctx.filter = 'blur(10px)'; ctx.fillStyle = 'rgba(60,40,36,0.28)'; tracePoly(ctx, pts); ctx.fill(); ctx.restore();
      return;
    case 'window':
      h({ color: C.sky, spacing: 3.5, angle: 1.0, alpha: 0.45 });
      outline(ctx, R, pts, { alpha: 0.45, width: 2.4 });
      return;
    case 'sun':
      ctx.save(); ctx.filter = 'blur(6px)'; ctx.fillStyle = 'rgba(250,206,120,0.35)'; tracePoly(ctx, pts); ctx.fill(); ctx.restore();
      h({ color: C.sun, spacing: 3.2, angle: 0.62, alpha: 0.55 });
      h({ color: [255, 214, 130], spacing: 6, angle: -0.5, alpha: 0.3 });
      return;
    case 'shadow':
      ctx.save(); tracePoly(ctx, part.clip); ctx.clip();
      ctx.fillStyle = 'rgba(90,60,52,0.22)'; tracePoly(ctx, pts); ctx.fill();
      h({ color: PEN, spacing: 3.5, angle: 0.62, alpha: 0.38 });
      h({ color: C.stainDeep, spacing: 5, angle: -0.6, alpha: 0.22 });
      ctx.restore();
      return;
    case 'couch': case 'cushion':
      h({ color: [190, 186, 200], spacing: 7, angle: 1.05, alpha: 0.12 });
      if (sh > 0) h({ color: C.couchShade, spacing: 4.5 - sh * 1.5, angle: 1.1, alpha: 0.14 + sh * 0.2 });
      outline(ctx, R, pts, { alpha: 0.42, width: 1.6, amp: 1.4 });
      return;
    case 'oak': case 'oak-top': case 'slat': {
      const g = grain(pts);
      const lit = kind === 'oak-top' && face === 'top';
      // Coloured pencil over a light wash: the dark comes from the marks, so they show.
      h({ color: lit ? C.stainLit : C.stain, spacing: 2.2, angle: g, alpha: 0.8, width: 1.5, amp: 0.5 });
      h({ color: C.stainDeep, spacing: 2.8 - sh * 0.8, angle: g + 0.06, alpha: 0.5 + sh * 0.35, width: 1.3, amp: 0.6 });
      h({ color: [30, 14, 10], spacing: 9, angle: g + 0.02, alpha: 0.35, width: 1.8, amp: 1.6 });
      if (sh > 0.5) h({ color: PEN, spacing: 3.2, angle: g + 1.0, alpha: 0.35 });
      if (lit) for (let i = 0; i < 3; i++) h({ color: C.sheen, spacing: 22, angle: g + 0.012 * i, alpha: 0.3, width: 1.6 });
      outline(ctx, R, pts, { alpha: 0.85, width: 1.8 });
      return;
    }
    case 'book': {
      const base = C.books[part.tone];
      if (face === 'right') h({ color: [170, 156, 130], spacing: 2.2, angle: grain(pts), alpha: 0.7 });
      else h({ color: mix(base, PEN, 0.35 + sh * 0.3), spacing: 2.4, angle: grain(pts) + 0.3, alpha: 0.6 });
      outline(ctx, R, pts, { alpha: 0.7, width: 1.4 });
      return;
    }
    case 'glass':
      h({ color: C.glass, spacing: 4, angle: 0.9, alpha: 0.28 });
      for (let i = 0; i < 4; i++) {
        const [a, b, c, d] = pts, u = 0.15 + i * 0.07;
        pencil(ctx, S, [[a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], [d[0] + (c[0] - d[0]) * (u - 0.12), d[1] + (c[1] - d[1]) * (u - 0.12)]], { color: [255, 252, 240], width: 3, alpha: 0.55, taper: true });
      }
      outline(ctx, R, pts, { alpha: 0.6, width: 1.6, color: [70, 110, 104] });
      return;
    case 'coaster':
      h({ color: [150, 104, 62], spacing: 2.4, angle: 0.4, alpha: 0.6 });
      outline(ctx, R, pts, { alpha: 0.7, width: 1.4, amp: 0.4 });
      return;
  }
}

// ---------- B: warm pastel ----------

function pastel(ctx, part, R, S) {
  const { kind, pts, face = 'top' } = part;
  const sh = SHADE[face] ?? 0;
  const p = (colors, o) => pastelFill(ctx, S, pts, { colors, ...o });
  const soft = (o) => outline(ctx, R, pts, { width: 3.2, alpha: 0.32, amp: 1.4, color: [60, 36, 30], ...o });
  switch (kind) {
    case 'wall': p([[240, 232, 218], [234, 226, 214], [246, 240, 228], [232, 224, 220]], { angle: 1.25, jitter: 0.6, density: 0.01, alpha: [0.2, 0.42], width: [8, 16], len: [30, 70], bend: 0.4 }); return;
    case 'floor': p([[214, 186, 146], [202, 172, 132], [224, 202, 166], [232, 214, 184]], { angle: grain(pts), jitter: 0.06, density: 0.008, len: [40, 90], width: [5, 10], alpha: [0.22, 0.45] }); return;
    case 'boards': part.lines.forEach((l, i) => { if (i % 2 === 0) pencil(ctx, S, l, { color: [130, 92, 60], width: 2, alpha: 0.14, amp: 1, taper: false, step: 12, smooth: 1 }); }); return;
    case 'baseboard': p([[248, 244, 236], [236, 230, 222]], { angle: 0, density: 0.02, width: [3, 6] }); soft({ alpha: 0.3 }); return;
    case 'contact': ctx.save(); ctx.filter = 'blur(12px)'; ctx.fillStyle = 'rgba(70,46,40,0.32)'; tracePoly(ctx, pts); ctx.fill(); ctx.restore(); return;
    case 'window': p([C.sky, [196, 214, 230], [255, 246, 222]], { angle: 1.1, density: 0.02 }); soft({ alpha: 0.5 }); return;
    case 'sun': p([C.sun, [250, 210, 120], [255, 232, 170]], { angle: 0.62, jitter: 0.12, density: 0.03, alpha: [0.3, 0.6], len: [24, 60], width: [4, 9] }); return;
    case 'shadow':
      ctx.save(); tracePoly(ctx, part.clip); ctx.clip();
      p([[120, 82, 70], [96, 70, 80], [140, 96, 70]], { angle: 0.62, density: 0.03, alpha: [0.3, 0.55], width: [4, 8] });
      ctx.restore();
      return;
    case 'couch': case 'cushion':
      p(sh > 0 ? [[226, 222, 218], [212, 208, 206], [236, 230, 222], [200, 198, 204]] : [[250, 246, 238], [244, 238, 228], [255, 252, 244], [250, 240, 220]], { angle: 1.0, jitter: 0.5, density: 0.03, alpha: [0.22, 0.48], width: [6, 13], len: [20, 46], bend: 0.4 });
      soft({ alpha: 0.25 });
      return;
    case 'oak': case 'oak-top': case 'slat': {
      const g = grain(pts);
      const lit = kind === 'oak-top' && face === 'top';
      const tones = lit ? [C.stainLit, C.stain, [176, 112, 64]] : sh > 0.5 ? [C.stainDeep, [40, 22, 18], C.stain] : [C.stain, C.stainDeep, [120, 68, 38]];
      p(tones, { angle: g, jitter: 0.08, density: 0.05, alpha: [0.45, 0.85], len: [10, 26], width: [2, 5] });
      if (lit) p([[255, 226, 170]], { angle: g, jitter: 0.04, density: 0.004, alpha: [0.2, 0.45], len: [30, 60], width: [1.5, 3] });
      soft({ alpha: 0.45, width: 2.4 });
      return;
    }
    case 'book': {
      const base = C.books[part.tone];
      p(face === 'right' ? [C.pages, [220, 210, 186]] : [base, mix(base, PEN, 0.3), mix(base, [255, 255, 255], 0.15)], { angle: grain(pts), density: 0.05, width: [2, 4], len: [8, 18] });
      soft({ alpha: 0.4 });
      return;
    }
    case 'glass':
      p([[200, 226, 220], [255, 252, 240], [170, 206, 198]], { angle: 0.9, jitter: 0.1, density: 0.006, alpha: [0.15, 0.4], len: [30, 70], width: [2, 6] });
      soft({ alpha: 0.4, color: [70, 110, 104] });
      return;
    case 'coaster': p([C.cork, [170, 124, 80]], { density: 0.06, width: [2, 4], len: [6, 12] }); soft({ alpha: 0.5 }); return;
  }
}

/** A thin layer of paper tooth over everything, so the pastel sits in the grain. */
function tooth(ctx, size, seed) {
  const S = mul32(seed);
  ctx.fillStyle = 'rgba(248,242,228,0.22)';
  for (let i = 0; i < 16000; i++) ctx.fillRect(rd(S, 0, size), rd(S, 0, size), rd(S, 0.6, 1.6), rd(S, 0.6, 1.6));
}

// ---------- C: the glass, rendered close to a photograph ----------

function photoGlass(ctx, part, windowPts) {
  const g = part.pts;
  ctx.save();
  tracePoly(ctx, g);
  ctx.clip();
  // Refraction: what's under the pane, seen a few px displaced and doubled.
  ctx.globalAlpha = 0.45;
  ctx.drawImage(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, 3, 7, ctx.canvas.width, ctx.canvas.height);
  ctx.globalAlpha = 1;
  // Body tint, deeper toward the far edge (Fresnel).
  const lg = ctx.createLinearGradient(g[3][0], g[3][1], g[0][0], g[0][1]);
  lg.addColorStop(0, 'rgba(150,196,186,0.10)');
  lg.addColorStop(1, 'rgba(120,170,164,0.32)');
  ctx.fillStyle = lg;
  ctx.fill();
  // The window, reflected: a soft bright quad.
  const mid = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const q = [mid(g[0], g[1], 0.08), mid(g[0], g[1], 0.42), mid(g[3], g[2], 0.3), mid(g[3], g[2], -0.04)];
  ctx.filter = 'blur(14px)';
  ctx.fillStyle = 'rgba(255,250,236,0.55)';
  tracePoly(ctx, q); ctx.fill();
  ctx.filter = 'blur(2px)';
  ctx.strokeStyle = 'rgba(255,255,250,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(...mid(q[0], q[1], 0.5)); ctx.lineTo(...mid(q[3], q[2], 0.5)); ctx.stroke();
  ctx.filter = 'none';
  ctx.restore();
  // The near edge of the pane: a thin green line where you see its thickness.
  ctx.strokeStyle = 'rgba(96,150,136,0.85)';
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(...g[3]); ctx.lineTo(...g[2]); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,248,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(g[3][0], g[3][1] - 2); ctx.lineTo(g[2][0], g[2][1] - 2); ctx.stroke();
}

// Solid things get an opaque base before their marks, so what is behind them
// stays hidden. Oak takes a stain wash, matched to the photos (IMG_1038).
const OAK_BASE = { top: [150, 98, 64], front: [118, 74, 48], right: [86, 52, 36] };
function base(part, paperFill) {
  const { kind, face = 'top' } = part;
  if (kind === 'couch' || kind === 'cushion' || kind === 'baseboard') return paperFill;
  if (kind === 'floor') return rgba([226, 208, 180], 1);
  if (kind === 'oak' || kind === 'slat') return rgba(OAK_BASE[face], 1);
  if (kind === 'oak-top') return rgba(face === 'top' ? [160, 104, 66] : OAK_BASE[face], 1);
  if (kind === 'book') return rgba(face === 'right' ? C.pages : mix(C.books[part.tone], PEN, (SHADE[face] ?? 0) * 0.35), 1);
  if (kind === 'coaster') return rgba(C.cork, 1);
  return null;
}

/** Draw every part in order in the chosen look ('a' | 'b' | 'c'). */
export function renderHome(ctx, parts, look, R, still, paper) {
  const S = still('home-shading');
  const draw = look === 'b' ? pastel : etched;
  const paperFill = ctx.createPattern(paper, 'no-repeat');
  for (const raw of parts) {
    const part = soften(raw);
    const b = base(part, paperFill);
    if (b) { ctx.fillStyle = b; tracePoly(ctx, part.pts); ctx.fill(); }
    if (look === 'c' && part.kind === 'glass') { photoGlass(ctx, part); continue; }
    draw(ctx, part, R, S);
  }
  // Put the paper's tooth back into the flat bases.
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(paper, 0, 0);
  ctx.restore();
  if (look === 'b') tooth(ctx, ctx.canvas.width, 4242);
}

