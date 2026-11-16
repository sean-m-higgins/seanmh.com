// gesso, act I and the haul: a white wall, a guess, a list, the materials.

import { aword } from '../../lib/draw/hand.js';
import { hand } from '../../lib/draw/hand.js';
import { clamp, span, easeInOut, easeOut, lerp } from '../common.js';
import { A, CX, CY, ROOM, PEN, rect, scene, layer, put, day, caption, arm, brush, stagger } from './kit.js';
import { wallSet, carpet, wood, BARS, bracket, tube, tub, bolt, stapleBox, brushTool, pencilTool } from './parts.js';
import { OIL } from './field.js';
import { painted, ALL } from './painting.js';

export const wallLayer = (env) => layer(env, 'wall', (L) => wallSet(L));

const CORNERS = [[A.x, A.y], [A.x + A.w, A.y], [A.x + A.w, A.y + A.h], [A.x, A.y + A.h]];
/** The anchor, in pencil on the wall, drawn up to p. Returns the pencil point while it is moving. */
export function pencilRect(L, p, o = {}) {
  const lens = [A.w, A.h, A.w, A.h], total = 2 * (A.w + A.h);
  let run = 0, tip = null;
  for (let i = 0; i < 4; i++) {
    const a = CORNERS[i], b = CORNERS[(i + 1) % 4], u = clamp((p * total - run) / lens[i]);
    run += lens[i];
    const dx = (b[0] - a[0]) / lens[i], dy = (b[1] - a[1]) / lens[i];
    if (u > 0) L.k(`side${i}`).line([[a[0] - dx * 8, a[1] - dy * 8], [b[0] + dx * 7, b[1] + dy * 7]], { upTo: u, alpha: 0.72, width: 2, amp: 1.3, ...o });
    if (u > 0 && u < 1) tip = [lerp(a[0] - dx * 8, b[0] + dx * 7, u), lerp(a[1] - dy * 8, b[1] + dy * 7, u)];
  }
  return tip;
}

export const wall = scene('wall', 3.5, (L, t, env) => {
  put(L.S, wallLayer(env));
  const tip = pencilRect(L, easeInOut(span(t, 0.16, 0.88)));
  if (tip) { arm(L, tip[0] + 96, tip[1] + 104, -2.35, 0.3); pencilTool(L.k('pencil'), tip[0], tip[1], 0.82); }
  return day(0);
}, { step: 'plan' });

export const picture = scene('picture', 4, (L, t, env) => {
  put(L.S, wallLayer(env));
  // a guess at the piece: thin colour that comes, and mostly goes
  const breath = Math.sin(Math.PI * span(t, 0.04, 0.8)) * 0.24 + 0.07 * span(t, 0.5, 0.9);
  L.S.col.save(); L.S.col.globalAlpha = breath; L.S.col.drawImage(painted(env, ALL).col.canvas, 0, 0); L.S.col.restore();
  pencilRect(L, 1);
  const d = easeInOut(span(t, 0.3, 0.62)), g = L.S.col, pen = { color: PEN, alpha: 0.7, width: 1.6 };
  if (d > 0) {
    L.k('dimw').line([[A.x, A.y - 34], [A.x + A.w, A.y - 34]], { upTo: d, alpha: 0.6 });
    L.k('dimh').line([[A.x - 34, A.y], [A.x - 34, A.y + A.h]], { upTo: d, alpha: 0.6 });
    for (const [i, a, b] of [[0, [A.x, A.y - 44], [A.x, A.y - 24]], [1, [A.x + A.w, A.y - 44], [A.x + A.w, A.y - 24]], [2, [A.x - 44, A.y], [A.x - 24, A.y]], [3, [A.x - 44, A.y + A.h], [A.x - 24, A.y + A.h]]]) L.k(`tick${i}`).line([a, b], { alpha: 0.6 * d });
    hand(g, env.still('picture/4'), "4'", CX, A.y - 50, 22, { align: 'center', upTo: span(t, 0.5, 0.64), ...pen });
    hand(g, env.still('picture/3'), "3'", A.x - 52, CY + 10, 22, { align: 'right', upTo: span(t, 0.58, 0.72), ...pen });
  }
  caption(L, 'picture it', span(t, 0.34, 0.6));
  return day(0.04);
});

// The drawing register: the wall flooded ultramarine, the plan scratched through it.
const ULTRA = [[38, 60, 148], [46, 72, 164], [32, 50, 132]];
const FLOOD = [];
for (let y = 22, r = 0; y < 950; y += 40, r++) {
  const cuts = [-30, 300 + ((r * 137) % 160), 640 + ((r * 89) % 140), 1110];
  for (let i = 0; i < 3; i++) {
    const a = cuts[i] - 20, b = cuts[i + 1] + 20, dir = r % 2;
    const pts = [[a, y + ((r * 7 + i * 3) % 9) - 4], [(a + b) / 2, y + ((r * 5 + i) % 11) - 5], [b, y + ((r * 3 + i * 5) % 9) - 4]];
    FLOOD.push({ pts: dir ? pts.reverse() : pts, c: ULTRA[(r + i) % 3], w: 46 });
  }
  if (r % 2) FLOOD.splice(-3, 3, ...FLOOD.slice(-3).reverse());
}
/** Lay the first p (0..1) of a list of strokes; each keeps its own bristles. Returns the brush point. */
export function lay(S, env, key, specs, p, o = {}) {
  const n = p * specs.length;
  let tip = null;
  for (let i = 0; i < specs.length && i < n; i++) {
    const s = specs[i], u = clamp(n - i);
    brush(S, env.still(`${key}${i}`), env).stroke(s.pts, s.c, s.w, { thick: 0.34, base: 0.36, dry: 0.12, ...o, upTo: u });
    if (u < 1) { const k = u * (s.pts.length - 1), j = Math.min(s.pts.length - 2, Math.floor(k)); tip = [lerp(s.pts[j][0], s.pts[j + 1][0], k - j), lerp(s.pts[j][1], s.pts[j + 1][1], k - j), Math.atan2(s.pts[j + 1][1] - s.pts[j][1], s.pts[j + 1][0] - s.pts[j][0]), s.c]; }
  }
  return tip;
}
const SCRATCH = [...[0, 1, 2, 3].map((i) => [CORNERS[i], CORNERS[(i + 1) % 4]]), [[CX, A.y], [CX, A.y + A.h]], [[A.x, CY], [A.x + A.w, CY]]];

export const list = scene('list', 4, (L, t, env) => {
  const S = L.S, p = easeInOut(span(t, 0.03, 0.46));
  put(S, wallLayer(env));
  let tip = null;
  if (p < 1) L.clip(rect(0, 0, 1080, 938), () => { tip = lay(S, env, 'list/f', FLOOD, p); });
  else put(S, layer(env, 'blue', (B) => B.clip(rect(0, 0, 1080, 938), () => lay(B.S, env, 'list/f', FLOOD, 1))));
  // the plan, scratched through to the white: outer frame, one brace each way, four panes
  const white = [238, 238, 242];
  SCRATCH.forEach(([a, b], i) => {
    const u = easeInOut(stagger(t, i, SCRATCH.length, 0.48, 0.8, 0.09));
    if (u > 0) L.k(`sc${i}`).stroke([a, b], white, i < 4 ? 6 : 5, { thick: 0, base: 0.1, dry: 0, vary: 0.01, upTo: u });
  });
  // the list: six things to bring home, ticked
  for (let i = 0; i < 6; i++) {
    const x = 200 + (i % 2) * 370, y = 806 + Math.floor(i / 2) * 46, u = stagger(t, i, 6, 0.6, 0.94, 0.1);
    if (u <= 0) continue;
    aword(S.col, env.still(`list/w${i}`), x + 40, y, 19, 10 + ((i * 5) % 7), { color: white, alpha: 0.92, width: 2.6, upTo: clamp(u * 1.6) });
    L.k(`tk${i}`).stroke([[x, y - 8], [x + 7, y], [x + 22, y - 20]], white, 4, { thick: 0, base: 0.1, dry: 0, upTo: clamp(u * 2 - 1) });
  }
  if (tip) { arm(L, tip[0] - Math.cos(tip[2]) * 10 + 150, tip[1] + 210, -2.2, 0.34); brushTool(L.k('flat'), tip[0], tip[1], 0.95, ULTRA[0], 50); }
  return { ...day(0.08), wet: 1 - span(t, 0.4, 0.8) };
});

// Everything on the list, laid out square on the carpet.
const ITEMS = [
  ...['top', 'bottom', 'left', 'right'].map((k) => ({ c: [CX, CY], draw: (L) => wood(L, ...BARS[k]) })),
  { c: [554, 262], draw: (L) => wood(L, rect(220, 249, 668, 26), 0) },
  { c: [464, 300], draw: (L) => wood(L, rect(220, 287, 488, 26), 0) },
  { c: [430, 392], draw: (L) => bolt(L, 236, 630, 392) },
  { c: [770, 392], draw: (L) => { for (let i = 0; i < 4; i++) bracket(L, 716 + (i % 2) * 44, 372 + Math.floor(i / 2) * 44, i); for (let i = 0; i < 8; i++) L.blob(806 + (i % 4) * 13, 374 + Math.floor(i / 4) * 14, 3.4, 3.4, 0, ROOM.iron, { thick: 0.5, base: 0.6 }); } },
  { c: [760, 500], draw: (L) => stapleBox(L, 716, 470) },
  { c: [320, 540], draw: (L) => [OIL.green, OIL.yellow, OIL.red, OIL.blue].forEach((c, i) => tube(L, 250 + i * 44, 580, -Math.PI / 2, c)) },
  { c: [540, 580], draw: (L) => [[470, 14, ROOM.gesso], [520, 12, [70, 60, 60]], [570, 46, ROOM.gesso]].forEach(([x, w, c], i) => brushTool(L.k(`b${i}`), x, 490, Math.PI / 2, c, w, 0.6)) },
  { c: [780, 620], draw: (L) => tub(L, 780, 622, 56) },
];

export const haul = scene('haul', 3.5, (L, t, env) => {
  put(L.S, layer(env, 'carpet', (B) => carpet(B, rect(0, 0, 1080, 1080))));
  ITEMS.forEach((it, i) => {
    const u = stagger(t, i, ITEMS.length, 0.04, 0.9, 0.16);
    if (u <= 0) return;
    const e = easeOut(u), s = lerp(1.1, 1, e), turn = (i % 2 ? 1 : -1) * 0.035 * (1 - easeInOut(clamp(u * 1.6 - 0.5)));
    L.xf((g) => { g.translate(it.c[0], it.c[1]); g.rotate(turn); g.scale(s, s); g.translate(-it.c[0], -it.c[1]); }, () => it.draw(L.k(`it${i}`)));
  });
  return day(0.16);
}, { step: 'gather' });
