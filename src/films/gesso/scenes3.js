// gesso, acts III and IV: the release, and the wall. One stroke of green, then
// the brushwork lets go. The painting is hung where it was first sketched, and
// then it comes alive: wind in the flowers, the butterflies leaving the canvas.

import { clamp, span, easeInOut, easeOut, easeIn, lerp } from '../common.js';
import { A, rect, frameAt, scene, layer, put, day, caption, letter, arm, brush } from './kit.js';
import { city, posts, floor, face, leanShadow, paintKit, brushTool, knifeTool, pencilTool, drill, screw, wallSet } from './parts.js';
import { OIL, FLIES, fly, H } from './field.js';
import { FIELD, ALL, painted, drawMark, markRng } from './painting.js';
import { wallLayer, pencilRect } from './scenes1.js';

const REST = [842, 930, 2.8, OIL.red, 11];
function studio(L, env, n, resting = [REST]) {
  put(L.S, layer(env, 'bg', (B) => { city(B.k('city')); posts(B.k('posts')); floor(B.k('floor'), true); }));
  put(L.S, layer(env, 'canvas', (B) => { leanShadow(B); face(B.k('face'), 'gesso', true); }));
  put(L.S, painted(env, n));
  return () => put(L.S, layer(env, 'kit', (B) => paintKit(B, resting)));
}
/** The working brush (or knife) at a point on the canvas, and the shadow of the arm behind it. */
function work(L, x, y, tip, knife = false, ang = 0.92) {
  const Hd = frameAt(x, y, ang);
  arm(L, ...Hd(170, 6), ang + Math.PI, 0.34);
  (knife ? knifeTool : brushTool)(L.k(knife ? 'knife' : 'round'), x, y, ang, tip);
}

// ---------- 13 · begin ----------

const FIRST = FIELD[0].pts.map(([x, y]) => [A.x + x, A.y + y]);
export const begin = scene('begin', 4, (L, t, env) => {
  const kit = studio(L, env, 0);
  const go = easeOut(span(t, 0.6, 0.7));
  if (go > 0) drawMark(brush(L.S, markRng(env, 0), env), FIELD[0], go);
  kit();
  // the brush hangs there, and nothing happens. then it does.
  const bob = [5 * Math.sin(t * 4 * 3.6), 4 * Math.cos(t * 4 * 2.2)], k = go * (FIRST.length - 1), j = Math.min(FIRST.length - 2, Math.floor(k));
  const on = [lerp(FIRST[j][0], FIRST[j + 1][0], k - j), lerp(FIRST[j][1], FIRST[j + 1][1], k - j)];
  const near = easeInOut(span(t, 0.5, 0.6)), away = easeInOut(span(t, 0.72, 0.9));
  const x = lerp(FIRST[0][0] + 46 + bob[0], on[0], near) + away * 60, y = lerp(FIRST[0][1] + 30 + bob[1], on[1], near) + away * 50;
  work(L, x, y, OIL.green);
  caption(L, 'just begin', span(t, 0.74, 0.94));
  return { ...day(0.7), wet: 0.3 };
}, { step: 'paint' });

// ---------- 14 · release ----------

// When each mark is laid. Phases follow Sean's order; inside the flowers the pace picks up.
const firstOf = (part, from = 0) => FIELD.findIndex((m, i) => i >= from && m.part === part);
const iDot = firstOf('dot'), iStem = firstOf('stem'), iSky = firstOf('sky'), iFlower = firstOf('flower', iSky), iCloud = firstOf('cloud'), iFly = firstOf('fly');
const PHASES = [[1, iDot, 0.0, 0.13, 0.012, 1], [iDot, iStem, 0.13, 0.26, 0.004, 1], [iStem, iSky, 0.26, 0.37, 0.008, 1], [iSky, iFlower, 0.37, 0.5, 0.02, 1],
  [iFlower, iCloud, 0.5, 0.87, 0.008, 0.72], [iCloud, iFly, 0.87, 0.935, 0.012, 1], [iFly, ALL, 0.935, 0.985, 0.012, 1]];
const START = new Float32Array(ALL), LEN = new Float32Array(ALL), DONE = new Float32Array(ALL);
for (const [a, b, t0, t1, d, pw] of PHASES) for (let i = a; i < b; i++) { START[i] = lerp(t0, t1 - d, Math.pow((i - a) / Math.max(1, b - a - 1), pw)); LEN[i] = d; }
for (let i = 1; i < ALL; i++) DONE[i] = Math.max(DONE[i - 1], START[i] + LEN[i]);
const where = (m) => (m.k === 'blob' ? [A.x + m.x, A.y + m.y] : [A.x + clamp(m.pts[m.pts.length - 1][0], 0, A.w), A.y + clamp(m.pts[m.pts.length - 1][1], 0, A.h)]);
function indexAt(t) { let lo = 0, hi = ALL - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (START[mid] <= t) lo = mid; else hi = mid - 1; } return lo; }

export const release = scene('release', 10, (L, t, env) => {
  let n = 1;
  while (n < ALL && DONE[n] <= t) n++;
  const kit = studio(L, env, n);
  for (let i = n; i < ALL && START[i] <= t; i++) {
    const u = clamp((t - START[i]) / LEN[i]), m = FIELD[i];
    drawMark(brush(L.S, markRng(env, i), env), m, m.k === 'blob' ? (u < 1 ? easeOut(u) * 1.07 : 1) : u);
  }
  kit();
  if (t < 0.99) {
    // the brush follows the work, a little behind it, so it sweeps instead of jumping
    let x = 0, y = 0;
    for (let k = 0; k < 6; k++) { const p = where(FIELD[indexAt(Math.max(0, t - k * 0.0035))]); x += p[0] / 6; y += p[1] / 6; }
    const cur = FIELD[indexAt(t)], out = easeIn(span(t, 0.975, 0.99));
    work(L, x + out * 120, y + out * 140, cur.c, cur.part === 'cloud', 0.92 + 0.1 * Math.sin(t * 10 * 5.1));
  }
  return { ...day(lerp(0.71, 0.75, t)), wet: 0.5 };
});

// ---------- 15 · dry ----------

export const dry = scene('dry', 3, (L, t, env) => {
  studio(L, env, ALL, [REST, [770, 884, 2.66, OIL.orange, 14]])();
  return { ...day(lerp(0.75, 0.96, easeInOut(span(t, 0.04, 0.92)))), wet: 0.5 * (1 - span(t, 0, 0.8)), gain: 1.12 };
});

// ---------- 16 · hang ----------

const faceLayer = (env) => layer(env, 'face', (B) => face(B, 'gesso'));
/** Colour from the painting, spilling onto the white wall around it. */
function spill(S, env, a, dy = 0) {
  S.col.save(); S.col.globalAlpha = a; S.col.filter = 'blur(44px)';
  S.col.drawImage(painted(env, ALL).col.canvas, 0, dy); S.col.restore();
}
const SCREWS = [[A.x + 170, A.y + 12], [A.x + A.w - 170, A.y + 12]];

export const hang = scene('hang', 4.5, (L, t, env) => {
  put(L.S, wallLayer(env));
  pencilRect(L, 1, { alpha: 0.5 });
  SCREWS.forEach(([x, y], i) => {
    const u = clamp((t - 0.05 - i * 0.16) / 0.13);
    if (u <= 0) return;
    screw(L.k(`sc${i}`), x, y, 30 * easeOut(u), 5.5);
    if (u < 1) { const inn = easeOut(clamp(u * 5)), out = easeIn(clamp(u * 5 - 4)), dx = (1 - inn + out) * 260; const D = frameAt(x + dx, y + dx * 1.1, 0.9); arm(L, ...D(132, 40), -2.3, 0.3); drill(L.k('drill'), x + dx, y + dx * 1.1, 0.9); }
  });
  const e = easeOut(span(t, 0.42, 0.76)), yo = lerp(920, -12, e) + 12 * easeIn(span(t, 0.78, 0.83));
  if (e > 0) {
    spill(L.S, env, 0.3 * span(t, 0.6, 0.95), yo);
    L.shade(rect(A.x + 12, A.y + 16 + yo, A.w, A.h), 0.3, 12);
    put(L.S, faceLayer(env), { y: yo });
    put(L.S, painted(env, ALL), { y: yo });
  }
  return day(0.97);
}, { step: 'hang' });

// ---------- 17 · yours ----------

const O = [-120, 470], FAR = 0.7; // the pull-back: about a point left of frame, so the painting makes room
const SWAY = FIELD.map((m, i) => [m, i]).filter(([m]) => m.part === 'stem' || m.part === 'flower');
const WEDGE = [[[650, 566], [1010, 566]], [[1010, 566], [1010, 380]], [[1010, 380], [650, 566]], [[770, 504], [770, 380]], [[890, 442], [890, 380]]];
// where each butterfly goes, in the painting's own space; the third settles inside the empty shape
const GOAL = [[-420, -260], [1500, -260], [1180, 318], [1560, 240]];

export const yours = scene('yours', 6, (L, t, env) => {
  const S = L.S, s = lerp(1, FAR, easeInOut(span(t, 0, 0.36)));
  const W = (g) => { g.translate(O[0], O[1]); g.scale(s, s); g.translate(-O[0], -O[1]); };
  put(S, layer(env, 'wide', (B) => { wallSet(B, 799, FAR); brushTool(B.k('left'), 846, 872, 1.42, OIL.green, 15, 0.5); }), { about: O, s: s / FAR });
  L.xf(W, () => { spill(S, env, 0.3); L.shade(rect(A.x + 12, A.y + 16, A.w, A.h), 0.3, 12); });
  put(S, layer(env, 'still', (B) => { face(B.k('face'), 'gesso'); FIELD.forEach((m, i) => { if (m.part !== 'stem' && m.part !== 'flower' && m.part !== 'fly') drawMark(brush(B.S, markRng(env, i), env), m); }); }), { about: O, s });
  // wind: a slow wave across the field, stronger the taller the flower
  const sec = t * 6, amp = 10 * easeInOut(span(t, 0.08, 0.4));
  const dx = (x, y) => amp * Math.pow(clamp((H - y) / H), 1.1) * (0.75 * Math.sin(sec * 2.6 - x * 0.011) + 0.25 * Math.sin(sec * 6.1 - x * 0.023 + 1.3));
  L.xf(W, () => {
    for (const [m, i] of SWAY) {
      const B = brush(S, markRng(env, i), env), o = { base: 0.62, thick: m.thick };
      if (m.k === 'blob') B.blob(A.x + m.x + dx(m.x, m.y), A.y + m.y, m.rx, m.ry, m.rot, m.c, o);
      else B.stroke(m.pts.map(([px, py]) => [A.x + px + dx(px, py), A.y + Math.min(py, A.h)]), m.c, m.w, o);
    }
    // the butterflies lift off the canvas and leave it
    FLIES.forEach(([fx, fy, fa], i) => {
      const u = clamp((t - 0.2 - i * 0.085) / 0.46), e = easeInOut(u), stay = i === 2;
      const flap = u <= 0 ? 1 : Math.abs(Math.sin(env.frame * 0.5 * (stay && u >= 1 ? 0.35 : 1.5) + i));
      const x = lerp(fx, GOAL[i][0], e) + 46 * Math.sin(u * Math.PI * 3 + i) * Math.sin(u * Math.PI), y = lerp(fy, GOAL[i][1], e) - 70 * Math.sin(u * Math.PI) + 30 * Math.sin(u * Math.PI * 4 + i * 2) * Math.sin(u * Math.PI);
      const lift = Math.min(1, u * 5), k = 1 + 0.35 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + (stay ? 0.1 * e : 0), B = L.k(`fly${i}`);
      if (lift > 0) B.shade([[-12, -9], [12, -9], [12, 9], [-12, 9]].map(([px, py]) => [A.x + x + px * k + 16 * lift, A.y + y + py * k + 20 * lift]), 0.22 * lift, 5);
      for (const m of fly(x, y, fa + 0.5 * Math.sin(u * Math.PI * 3 + i) * Math.sin(u * Math.PI), 0.15 + 0.85 * flap, k)) {
        if (m.k === 'blob') B.blob(A.x + m.x, A.y + m.y, m.rx, m.ry, m.rot, m.c, { base: 0.8, thick: m.thick });
        else B.stroke(m.pts.map(([px, py]) => [A.x + px, A.y + py]), m.c, m.w, { base: 0.8, thick: m.thick, dry: 0 });
      }
    });
  });
  // beside it, a new shape, left empty
  let tip = null;
  WEDGE.forEach(([a, b], i) => {
    const u = easeInOut(clamp((t - 0.42 - i * 0.045) / 0.05));
    if (u > 0) L.k(`w${i}`).line([a, b], { upTo: u, alpha: i < 3 ? 0.72 : 0.5, width: i < 3 ? 2 : 1.6, amp: 1.2 });
    if (u > 0 && u < 1) tip = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  });
  if (tip) { arm(L, tip[0] + 96, tip[1] + 104, -2.35, 0.3); pencilTool(L.k('pencil'), tip[0], tip[1], 0.82); }
  letter(L.k('yours'), 'yours', 830, 646, 32, { align: 'center', upTo: span(t, 0.67, 0.78) });
  letter(L.k('sig'), `${env.film.title} · ${env.film.model} · ${env.film.year}`, 540, 1042, 19, { align: 'center', upTo: easeInOut(span(t, 0.78, 0.96)) });
  return day(1);
});
