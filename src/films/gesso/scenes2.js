// gesso, act II: the build. Cut, sand, frame, fabric, staple, trim, flip, prime.
// Tight and square: straight strokes, things that stop dead.

import { rd } from '../../lib/draw/rng.js';
import { clamp, span, easeInOut, easeOut, easeIn, lerp } from '../common.js';
import { A, CX, CY, ROOM, rect, frameAt, scene, layer, put, cast, day, caption, arm, stagger } from './kit.js';
import { carpet, city, posts, floor, wood, BARS, JOINTS, bracket, frame, linen, FABRIC, staple, face, saw, sandBlock, drill, stapler, scissors, brushTool, tub } from './parts.js';
import { lay } from './scenes1.js';

const carpetLayer = (env) => layer(env, 'carpet', (B) => carpet(B, rect(0, 0, 1080, 1080)));
const frameLayer = (env) => layer(env, 'frame', (B) => frame(B));

// ---------- 5 · cut ----------

const CUT = 770;
export const cut = scene('cut', 4.5, (L, t, env) => {
  put(L.S, layer(env, 'bg', (B) => {
    city(B.k('city'), true); posts(B.k('posts'), true); floor(B.k('floor'));
    B.shade(rect(404, 856, 290, 150), 0.24);
    B.area(rect(390, 838, 280, 150), [238, 234, 224], { colors: [[238, 234, 224], [232, 227, 216]], angle: 0, width: 16, thick: 0.2, base: 0.44, len: [100, 260], dry: 0.1 });
    B.line([...rect(390, 838, 280, 150), [390, 838]], { alpha: 0.42 }); B.line([[530, 838], [530, 988]], { alpha: 0.25 });
    wood(B.k('stick'), rect(70, 812, CUT - 70, 26), 0, 6);
  }));
  const prog = span(t, 0.06, 0.74), fall = easeIn(span(t, 0.76, 0.9));
  L.xf((g) => { g.translate(CUT, 825 + fall * 150); g.rotate(fall * 0.22); g.translate(-CUT, -825); }, () => wood(L.k('off'), rect(CUT + 2, 812, 228, 26), 0, 6 - fall * 3));
  if (prog > 0 && fall === 0) L.k('kerf').stroke([[CUT, 811], [CUT, 811 + 28 * prog]], [70, 60, 60], 2.6, { thick: 0, base: 0.2, dry: 0, vary: 0 });
  const D = env.still('cut/dust'), n = Math.floor(70 * prog);
  for (let i = 0; i < n; i++) L.blob(CUT + rd(D, -34, 34), rd(D, 944, 1000), rd(D, 1.5, 2.8), rd(D, 1.2, 2.2), 0, ROOM.pine2, { thick: 0.4, base: 0.3 });
  if (t < 0.8) {
    const ph = (t * 4.5 * 2.4) % 1, pos = ph < 0.68 ? easeInOut(ph / 0.68) : 1 - easeInOut((ph - 0.68) / 0.32); // slow push, quick return
    const lift = easeInOut(span(t, 0.74, 0.8)), y0 = 726 + 54 * pos - lift * 60, x = CUT + lift * 30;
    arm(L, x + 6, y0 + 176, -2.0, 0.36);
    saw(L.k('saw'), x, y0, Math.PI / 2);
  }
  caption(L, 'cut by hand', span(t, 0.22, 0.5));
  return day(0.24);
}, { step: 'cut' });

// ---------- 6 · sand ----------

export const sand = scene('sand', 2.5, (L, t, env) => {
  put(L.S, layer(env, 'bg', (B) => { carpet(B.k('carpet'), rect(0, 0, 1080, 1080)); wood(B.k('stick'), rect(-30, 590, 690, 150), 0, 12); }));
  const u = span(t, 0.06, 0.88), prog = easeInOut(u);
  // the sawn end: rough at first, eased by the third pass
  const M = env.still('sand/marks');
  for (let i = 0; i < 12; i++) { const x = 640 + rd(M, 0, 19), a = 0.5 * (1 - prog); if (a > 0.03) L.k(`m${i}`).line([[x, 592 + rd(M, 0, 30)], [x + rd(M, -3, 3), 738 - rd(M, 0, 30)]], { alpha: a, width: 1.4 }); else M(); }
  for (const y of [590, 740]) L.k(`c${y}`).blob(662, y, 4 + 13 * prog, 4 + 13 * prog, 0, ROOM.carpet, { thick: 0.24, base: 0.2 });
  const D = env.still('sand/dust'), n = Math.floor(110 * prog);
  for (let i = 0; i < n; i++) L.blob(rd(D, 664, 800), rd(D, 580, 830), rd(D, 1.5, 3), rd(D, 1.2, 2.4), 0, ROOM.pine3, { thick: 0.4, base: 0.3 });
  const bx = 628 + 64 * Math.sin(u * Math.PI * 6), by = 664 + 26 * Math.cos(u * Math.PI * 3);
  arm(L, bx + 60, by + 30, -2.5, 0.36);
  sandBlock(L.k('block'), bx, by);
  return day(0.28);
});

// ---------- 7 · frame ----------

const FROM = { top: [0, -170], bottom: [0, 170], left: [-190, 0], right: [190, 0] };
export const frameUp = scene('frame', 4.5, (L, t, env) => {
  put(L.S, carpetLayer(env));
  ['upright', 'cross'].forEach((k, i) => {
    const u = clamp((t - 0.33 - i * 0.08) / 0.1);
    if (u > 0) { const s = lerp(1.08, 1, easeOut(u)); L.xf((g) => { g.translate(CX, CY); g.scale(s, s); g.translate(-CX, -CY); }, () => wood(L.k(k), ...BARS[k], 3 + 8 * (1 - u))); }
  });
  ['top', 'bottom', 'left', 'right'].forEach((k, i) => {
    const e = easeOut(stagger(t, i, 4, 0, 0.3, 0.2)); // slide, and stop dead
    L.xf((g) => g.translate(FROM[k][0] * (1 - e), FROM[k][1] * (1 - e)), () => wood(L.k(k), ...BARS[k]));
  });
  const q = (t - 0.62) / 0.09, at = Math.floor(q), fr = q - at;
  JOINTS.forEach(([x, y], i) => {
    const u = stagger(t, i, 8, 0.48, 0.62, 0.06);
    if (u <= 0) return;
    const s = lerp(1.25, 1, easeOut(u)), spin = i < 4 ? 26 * easeOut(clamp(q - i)) : 0;
    L.xf((g) => { g.translate(x, y); g.scale(s, s); g.translate(-x, -y); }, () => bracket(L.k(`br${i}`), x, y, spin));
  });
  if (q > -0.6 && at < 4) {
    const a = JOINTS[clamp(at, 0, 3)], b = JOINTS[clamp(at + 1, 0, 3)], m = at < 0 ? 0 : easeInOut(clamp((fr - 0.62) / 0.38));
    const enter = at < 0 ? easeOut(clamp(q + 0.6) / 0.6) : 1, leave = at === 3 ? easeIn(clamp((fr - 0.7) / 0.3)) : 0;
    const x = lerp(a[0], b[0], m) + 7 + (1 - enter) * 260 + leave * 300, y = lerp(a[1], b[1], m) - 7 + (1 - enter) * 300 + leave * 340;
    const D = frameAt(x, y, 0.85);
    arm(L, ...D(132, 40), -2.3, 0.36);
    drill(L.k('drill'), x, y, 0.85);
  }
  return day(0.34);
}, { step: 'frame' });

// ---------- 8 · fabric ----------

const linenLayer = (env) => layer(env, 'linen', (B) => { B.shade(FABRIC.map(([x, y]) => [x + 5, y + 6]), 0.16, 5); linen(B, FABRIC); B.line([...FABRIC, FABRIC[0]], { alpha: 0.3 }); });

export const fabric = scene('fabric', 3.5, (L, t, env) => {
  put(L.S, carpetLayer(env));
  const e = easeInOut(span(t, 0.08, 0.7)), xr = lerp(FABRIC[0][0], FABRIC[1][0], e);
  put(L.S, linenLayer(env), { clip: rect(0, 0, xr, 1080) });
  if (e < 1) { // the roll, getting thinner as it travels
    const r = lerp(36, 9, e), y0 = FABRIC[0][1] - 6, y1 = FABRIC[2][1] + 6;
    L.shade(rect(xr + 4, y0 + 8, r * 1.6, y1 - y0), 0.3);
    for (const [dv, b, w] of [[-r * 0.6, 0.55, r * 0.9], [r * 0.6, 0.5, r * 0.9], [0, 0.74, r * 1.1]]) L.k(`roll${dv > 0}${dv < 0}`).stroke([[xr + dv, y0], [xr + dv, y1]], dv ? ROOM.linen2 : ROOM.linen3, w, { thick: 0.5, base: b, dry: 0, vary: 0.03 });
  }
  const up = easeInOut(span(t, 0, 0.16)) * (1 - easeInOut(span(t, 0.74, 0.92)));
  if (up > 0.01) cast(L.S, frameLayer(env), 30 * up, 36 * up, 0.3, 4 + 12 * up, { s: 1 + 0.07 * up });
  put(L.S, frameLayer(env), { s: 1 + 0.07 * up });
  return day(0.4);
}, { step: 'stretch' });

// ---------- the back of the canvas ----------

// Edges in the order they are stapled as the room turns: bottom, left, top, right.
const EDGE = [
  { ang: 0, at: (s, d) => [A.x + A.w * s, A.y + A.h - d], strip: (w, a = 0, b = 1) => rect(A.x + A.w * a, A.y + A.h - w, A.w * (b - a), w) },
  { ang: Math.PI / 2, at: (s, d) => [A.x + d, A.y + A.h * s], strip: (w, a = 0, b = 1) => rect(A.x, A.y + A.h * a, w, A.h * (b - a)) },
  { ang: 0, at: (s, d) => [A.x + A.w * (1 - s), A.y + d], strip: (w, a = 0, b = 1) => rect(A.x + A.w * (1 - b), A.y, A.w * (b - a), w) },
  { ang: Math.PI / 2, at: (s, d) => [A.x + A.w - d, A.y + A.h * (1 - s)], strip: (w, a = 0, b = 1) => rect(A.x + A.w - w, A.y + A.h * (1 - b), w, A.h * (b - a)) },
];
const WIDE = 46, TRIM = 30, STAPLES = [0.14, 0.38, 0.62, 0.86];

/**
 * The stretched canvas from behind. fold[e] (0..1): how far edge e's margin has
 * come over. cutTo[e] (0..1): how much of its excess is trimmed. shots[e]:
 * how many staples are in.
 */
function back(L, env, fold, cutTo, shots, corners = 0) {
  const F = FABRIC;
  put(L.S, linenLayer(env), { clip: [[lerp(F[0][0], A.x, fold[1]) - 12 * (fold[1] < 1), lerp(F[0][1], A.y, fold[2]) - 12 * (fold[2] < 1)], [lerp(F[1][0], A.x + A.w, fold[3]) + 12 * (fold[3] < 1), lerp(F[0][1], A.y, fold[2]) - 12 * (fold[2] < 1)], [lerp(F[1][0], A.x + A.w, fold[3]) + 12 * (fold[3] < 1), lerp(F[2][1], A.y + A.h, fold[0]) + 12 * (fold[0] < 1)], [lerp(F[0][0], A.x, fold[1]) - 12 * (fold[1] < 1), lerp(F[2][1], A.y + A.h, fold[0]) + 12 * (fold[0] < 1)]] });
  put(L.S, frameLayer(env));
  EDGE.forEach((E, e) => {
    if (fold[e] <= 0) return;
    const part = (w, a, b, key) => { if (b - a < 0.002) return; const r = E.strip(w * fold[e], a, b), B = L.k(key); linen(B, r, { angle: E.ang, base: 0.66 }); B.line([...r, r[0]], { alpha: 0.3, width: 1.1 }); };
    part(TRIM, 0, cutTo[e], `st${e}`);
    part(WIDE, cutTo[e], 1, `sw${e}`);
    for (let j = 0; j < shots[e]; j++) staple(L.k(`sp${e}${j}`), ...E.at(STAPLES[j], 13), E.ang);
  });
  if (corners > 0) [[A.x, A.y, 1, 1], [A.x + A.w, A.y, -1, 1], [A.x + A.w, A.y + A.h, -1, -1], [A.x, A.y + A.h, 1, -1]].forEach(([x, y, sx, sy], i) => {
    if (corners * 4 <= i) return;
    L.k(`cf${i}`).line([[x + sx * 2, y + sy * 2], [x + sx * TRIM, y + sy * TRIM]], { alpha: 0.55, width: 1.6 });
  });
}

// ---------- 9 · staple, rotate ----------

const turnLayer = (env) => layer(env, 'turning', (B) => {
  carpet(B.k('c'), rect(0, 0, 1080, 1080), 0.72);
  // window light across the floor, so the turn can be read
  for (const y of [300, 700]) B.area([[0, y], [1080, y - 160], [1080, y - 60], [0, y + 100]], [244, 243, 240], { colors: [[244, 243, 240], [238, 238, 238]], angle: -0.15, width: 22, thick: 0.06, base: 0.21, len: [100, 260], dry: 0.9, vary: 0.01 });
});

export const stapleTurn = scene('staple', 6, (L, t, env) => {
  const q = Math.min(3.9999, t * 4), b = Math.floor(q), u = q - b;
  const ang = (b + easeInOut(span(u, 0.68, 1))) * Math.PI / 2;
  put(L.S, turnLayer(env), { rot: ang, s: 1.45 });
  const loop = !!env.loop;
  const fold = [0, 1, 2, 3].map((e) => (loop || e < b ? 1 : e === b ? easeInOut(span(u, 0, 0.2)) : 0));
  const shots = [0, 1, 2, 3].map((e) => (loop || e < b ? 4 : e === b ? STAPLES.filter((_, j) => u >= 0.27 + j * 0.095).length : 0));
  back(L, env, fold, [0, 0, 0, 0], shots);
  // the stapler works the near edge; it and the arm belong to the room, and turn with it
  const half = (k) => (k % 2 ? A.w / 2 : A.h / 2) - 13, len = (k) => (k % 2 ? A.h : A.w);
  const j = clamp(Math.floor((u - 0.27) / 0.095), -1, 3), ju = (u - 0.27) / 0.095 - j;
  const sAt = (k) => (STAPLES[clamp(k, 0, 3)] - 0.5);
  const along = j < 0 ? lerp(-0.62, sAt(0), easeOut(span(u, 0.08, 0.27))) : lerp(sAt(j), j < 3 ? sAt(j + 1) : 0.1, easeInOut(clamp((ju - 0.35) / 0.65)));
  const hit = j >= 0 && ju < 0.3 ? 1 - ju / 0.3 : 0, turnU = easeInOut(span(u, 0.68, 1));
  const dist = lerp(half(b), half(b + 1), turnU) + (u > 0.66 ? 30 * Math.sin(Math.PI * turnU) : 0) + (j < 0 ? 40 * (1 - easeOut(span(u, 0.08, 0.27))) : 0);
  const sx = CX + along * lerp(len(b), len(b + 1), turnU), sy = CY + dist;
  L.xf((g) => { g.translate(CX, CY); g.rotate(ang); g.translate(-CX, -CY); }, () => {
    const body = Math.PI / 2 - 0.4, H = frameAt(sx, sy, body);
    arm(L, ...H(96, 6), body + Math.PI, 0.36);
    stapler(L.k('gun'), sx, sy, body, hit);
  });
  caption(L, 'staple, rotate', span(t, 0.1, 0.24));
  const lamp = day(0.46);
  return { ...lamp, dir: lamp.dir + ang };
}, { step: 'staple' });

// ---------- 10 · trim ----------

export const trim = scene('trim', 3, (L, t, env) => {
  put(L.S, carpetLayer(env));
  const p = easeInOut(span(t, 0.06, 0.8)) * 4, e = Math.min(3, Math.floor(p)), u = p - e;
  back(L, env, [1, 1, 1, 1], [0, 1, 2, 3].map((k) => clamp(p - k)), [4, 4, 4, 4], span(t, 0.82, 0.96));
  if (p < 4) {
    // bottom runs left to right, left runs bottom to top, and so on round: the room is still, the scissors walk
    const s = e === 0 || e === 1 ? u : u, [x, y] = EDGE[e].at(e === 1 ? 1 - s : e === 3 ? 1 - s : s, TRIM + 1);
    const dir = [0, -Math.PI / 2, Math.PI, Math.PI / 2][e];
    const H = frameAt(x, y, dir + Math.PI + 0.25);
    arm(L, ...H(150, 10), dir + 0.25, 0.34);
    scissors(L.k('sc'), x, y, dir + Math.PI + 0.25, 0.5 + 0.5 * Math.sin(t * 3 * 2 * Math.PI * 3.2));
  }
  return day(0.52);
}, { step: 'trim' });

// ---------- 11 · flip ----------

const frontLayer = (env, kind) => layer(env, `front-${kind}`, (B) => face(B, kind));

export const flip = scene('flip', 3, (L, t, env) => {
  put(L.S, carpetLayer(env));
  const e = easeInOut(span(t, 0.06, 0.56)), c = Math.cos(Math.PI * e), up = Math.sin(Math.PI * e);
  L.shade(rect(A.x + 8 + 40 * up, CY - (A.h / 2) * Math.abs(c) + 10 + 46 * up, A.w, A.h * Math.abs(c)), 0.12 + 0.12 * up, 5 + 16 * up);
  if (c > 0) {
    const B = layer(env, 'back', (K) => back(K, env, [1, 1, 1, 1], [1, 1, 1, 1], [4, 4, 4, 4], 1));
    put(L.S, B, { sx: 1 + 0.08 * up, sy: Math.max(0.012, c) * (1 + 0.08 * up) });
  } else put(L.S, frontLayer(env, 'linen'), { sx: 1 + 0.08 * up, sy: Math.max(0.012, -c) * (1 + 0.08 * up) });
  // a tap: drum-tight
  const k = span(t, 0.66, 1);
  if (k > 0 && k < 1) {
    const g = L.S.hgt;
    g.save(); g.beginPath(); g.rect(A.x, A.y, A.w, A.h); g.clip();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,255,${0.2 * (1 - k) * (1 - k)})`; g.lineWidth = 16;
    g.beginPath(); g.arc(CX + 40, CY + 20, 20 + easeOut(k) * 460, 0, 6.283); g.stroke(); g.restore();
  }
  const reach = Math.sin(Math.PI * span(t, 0.56, 0.84));
  if (reach > 0) arm(L, CX + 50 + (1 - reach) * 320, CY + 40 + (1 - reach) * 360, -2.3, 0.34 * Math.min(1, reach * 2));
  return day(0.56);
});

// ---------- 12 · prime ----------

const PASSES = [0, 1, 2, 3, 4].map((i) => {
  const y = A.y + 54 + i * 108, pts = [[A.x - 30, y + 3], [A.x + A.w * 0.33, y - 4], [A.x + A.w * 0.66, y + 4], [A.x + A.w + 30, y - 2]];
  return { pts: i % 2 ? pts.reverse() : pts, c: ROOM.gesso, w: 118 };
});

export const prime = scene('prime', 4.5, (L, t, env) => {
  put(L.S, layer(env, 'bg', (B) => { carpet(B.k('carpet'), rect(0, 0, 1080, 1080)); B.shade(rect(A.x + 10, A.y + 12, A.w + 6, A.h), 0.2); tub(B.k('tub'), 978, 880, 58); }));
  put(L.S, frontLayer(env, 'linen'));
  const q = span(t, 0.05, 0.84) * 5, p = (Math.floor(q) + easeInOut(q - Math.floor(q))) / 5;
  let tip = null;
  L.clip(rect(A.x, A.y, A.w, A.h), () => { tip = lay(L.S, env, 'prime/g', PASSES, Math.min(1, p), { thick: 0.3, base: 0.56, dry: 0.06, vary: 0.012 }); });
  if (tip) {
    const back_ = tip[2] + Math.PI + (Math.cos(tip[2]) > 0 ? -0.5 : 0.5), H = frameAt(tip[0], tip[1], back_);
    arm(L, ...H(180, 0), back_ + Math.PI, 0.36);
    brushTool(L.k('wide'), tip[0], tip[1], back_, ROOM.gesso, 112);
  }
  caption(L, 'prime first', span(t, 0.2, 0.44));
  return { ...day(0.62), wet: 0.9 * (1 - span(t, 0.84, 1)) * span(t, 0.05, 0.2) };
}, { step: 'prime' });
