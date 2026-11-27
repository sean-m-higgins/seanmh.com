// Scene 8 · piano — afternoon. The Russian blue is asleep on top of the
// upright piano, its tail hanging down the front and swaying in time with the
// metronome beside it, which ticks at the film's own 64 beats a minute. Sun
// through the blinds lies in bars across the wall. Bars 29–32.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, grade, setLight, gesture, smooth, span, drift, shadeOf, lightOf, INK, rd, mul32,
  shadow, lit, motes, planks, woodGrain, books, leaf,
} from './kit.js';
import { COATS, loaf, tail } from './cats.js';

const AFT = { x: 0.62, y: -0.7, warm: [255, 226, 170], cool: [84, 62, 104], k: 1 };
const WALL = hex('#e6d2bf'), WOOD = hex('#8a543a'), WOOD_L = hex('#a96a48');
const TOP = 372, KEYS = 624, FLOOR_Y = 930;
const X0 = 150, X1 = 930;

function room(g, R) {
  setLight(AFT);
  g.fillStyle = vgrad(g, 0, FLOOR_Y, [[0, shadeOf(WALL, 0.25)], [1, WALL]]);
  g.fillRect(0, 0, SIZE, FLOOR_Y);
  // a picture rail and a wainscot line
  g.fillStyle = css(shadeOf(WALL, 0.5), 0.8); g.fillRect(0, 96, SIZE, 6);
  // framed things on the wall: a pressed leaf, and a small round mirror
  const fr = rect(196, 150, 150, 180);
  cel(g, fr, hex('#5a4038'), { sd: 5, hd: 4 }); ink(g, fr, 2.2);
  g.fillStyle = css(hex('#f1e9da')); g.fillRect(210, 164, 122, 152);
  leaf(g, 240, 296, -1.0, 110, 36, hex('#7f9a5a'), { lw: 1.6 });
  const mir = ellipse(800, 220, 66, 66);
  cel(g, mir, hex('#c9a45a'), { sd: 6, hd: 4 }); ink(g, mir, 2.4);
  const glass = ellipse(800, 220, 54, 54);
  g.fillStyle = lgrad(g, 750, 170, 850, 270, [[0, hex('#dfe9ea')], [0.5, hex('#b9cdd2')], [1, hex('#e9efe6')]]); g.fill(glass); ink(g, glass, 1.8);

  // the floor
  planks(g, R, FLOOR_Y, SIZE, { vy: 300, n: 10, base: [150, 100, 70] });
  const bb = rect(0, FLOOR_Y - 30, SIZE, 32);
  cel(g, bb, hex('#f3e9dc'), { sd: 6, hd: 0 }); ink(g, bb, 2.2);

  // --- the piano
  shadow(g, poly([[X0 - 60, FLOOR_Y + 10], [X1 - 20, FLOOR_Y + 10], [X1 - 60, FLOOR_Y + 50], [X0 - 120, FLOOR_Y + 50]]), [110, 80, 100], 0.45, 6);
  shadow(g, rect(X0 - 46, TOP + 20, 50, FLOOR_Y - TOP - 20), [130, 100, 120], 0.35, 8);
  const grainIn = (p, x, y, w, h, dir = 'h') => woodGrain(g, R, p, x, y, w, h, { c: [70, 36, 26], a: 0.28, gap: 7, dir });
  // lower case and its panel
  const lower = rect(X0 + 10, KEYS + 60, X1 - X0 - 20, FLOOR_Y - KEYS - 60);
  cel(g, lower, WOOD, { sd: 16, hd: 0 }); grainIn(lower, X0, KEYS + 60, X1 - X0, 260); ink(g, lower, 2.6);
  const lp = rect(X0 + 70, KEYS + 96, X1 - X0 - 140, 150);
  cel(g, lp, shadeOf(WOOD, 0.35), { sd: 8, hd: 0 }); ink(g, lp, 2);
  // legs and the pedals
  for (const x of [X0 + 6, X1 - 46]) {
    const leg = P(`M${x} ${KEYS + 60} L${x + 40} ${KEYS + 60} L${x + 34} ${FLOOR_Y} L${x + 6} ${FLOOR_Y} Z`);
    cel(g, leg, WOOD_L, { sd: 8, hd: 4 }); ink(g, leg, 2.4);
  }
  const plinth = rect(X0 + 4, FLOOR_Y - 34, X1 - X0 - 8, 36);
  cel(g, plinth, shadeOf(WOOD, 0.3), { sd: 8, hd: 0 }); ink(g, plinth, 2.4);
  for (const x of [500, 540, 580]) { const pd = rrect(x - 12, FLOOR_Y - 14, 24, 30, 8); cel(g, pd, hex('#d2ab62'), { sd: 4, hd: 3 }); ink(g, pd, 2); }
  // upper case, its panel and the music desk
  const upper = rect(X0 + 10, TOP + 22, X1 - X0 - 20, KEYS - TOP - 30);
  cel(g, upper, WOOD, { sd: 14, hd: 0 }); grainIn(upper, X0, TOP + 22, X1 - X0, 240); ink(g, upper, 2.6);
  const up = rect(X0 + 60, TOP + 48, X1 - X0 - 120, 150);
  cel(g, up, shadeOf(WOOD, 0.3), { sd: 8, hd: 0 }); ink(g, up, 2);
  const desk = poly([[390, KEYS - 34], [690, KEYS - 34], [676, TOP + 66], [404, TOP + 66]]);
  cel(g, desk, WOOD_L, { sd: 6, hd: 4 }); ink(g, desk, 2.2);
  // the lid
  const lid = rrect(X0 - 12, TOP, X1 - X0 + 24, 26, 6);
  cel(g, lid, WOOD_L, { sd: 7, hd: 5 }); grainIn(lid, X0 - 12, TOP, X1 - X0 + 24, 26); ink(g, lid, 2.6);
  // the key bed: cheeks, the key slip, the keys
  const bed = rect(X0 - 14, KEYS - 12, X1 - X0 + 28, 76);
  cel(g, bed, WOOD_L, { sd: 10, hd: 5 }); ink(g, bed, 2.6);
  const kx0 = X0 + 40, kx1 = X1 - 40, n = 35, kw = (kx1 - kx0) / n;
  const whites = rect(kx0, KEYS, kx1 - kx0, 50);
  g.fillStyle = vgrad(g, KEYS, KEYS + 50, [[0, hex('#e7dcc8')], [0.2, hex('#fbf5e8')], [1, hex('#f1e7d4')]]); g.fill(whites);
  g.strokeStyle = css(INK, 0.55); g.lineWidth = 1.3;
  for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(kx0 + i * kw, KEYS); g.lineTo(kx0 + i * kw, KEYS + 50); g.stroke(); }
  for (let i = 0; i < n - 1; i++) {
    if ([2, 6].includes(i % 7)) continue;
    const bk = rect(kx0 + (i + 1) * kw - 6.5, KEYS, 13, 31);
    cel(g, bk, hex('#2e2428'), { sd: 3, hd: 0, shade: hex('#1a1418') });
    g.fillStyle = css([120, 100, 110], 0.6); g.fillRect(kx0 + (i + 1) * kw - 4.5, KEYS + 2, 3, 24);
  }
  ink(g, whites, 2.2);
  g.fillStyle = css(hex('#9a3a3a')); g.fillRect(kx0, KEYS - 5, kx1 - kx0, 5); // the felt strip behind the keys

  // sheet music on the desk: staves and notes, no words
  for (const x of [416, 546]) {
    const pg = rect(x, TOP + 76, 118, 134);
    g.fillStyle = css(hex('#f6f0e2')); g.fill(pg);
    g.strokeStyle = css(INK, 0.5); g.lineWidth = 1;
    for (let st = 0; st < 4; st++) for (let l = 0; l < 5; l++) { const y = TOP + 90 + st * 30 + l * 3.6; g.beginPath(); g.moveTo(x + 8, y); g.lineTo(x + 110, y); g.stroke(); }
    g.fillStyle = css(INK, 0.85); g.strokeStyle = css(INK, 0.85); g.lineWidth = 1.2;
    for (let st = 0; st < 4; st++) for (let k = 0; k < 7; k++) {
      const nx = x + 16 + k * 13 + rd(R, -2, 2), ny = TOP + 90 + st * 30 + rd(R, 0, 14);
      g.fill(ellipse(nx, ny, 3, 2.2, -0.4));
      g.beginPath(); g.moveTo(nx + 2.6, ny); g.lineTo(nx + 2.6, ny - 11); g.stroke();
    }
    ink(g, pg, 1.6);
  }

  // on the lid: a stack of music, a vase of dried grasses and a small lamp
  for (const [dy, w, c, dx] of [[0, 150, '#d9c9a6', 0], [-14, 140, '#7a8f9a', 6], [-28, 146, '#c9584a', -2]]) {
    const b = rect(176 + dx, TOP - 14 + dy, w, 14); cel(g, b, hex(c), { sd: 4, hd: 0 }); ink(g, b, 1.8);
  }
  g.strokeStyle = css(hex('#b89a5a')); g.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a = rd(R, -0.5, 0.5), L = rd(R, 150, 230);
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(858, TOP - 80); g.quadraticCurveTo(858 + Math.sin(a) * L * 0.4, TOP - 80 - L * 0.6, 858 + Math.sin(a) * L, TOP - 80 - Math.cos(a) * L); g.stroke();
    const hx = 858 + Math.sin(a) * L, hy = TOP - 80 - Math.cos(a) * L;
    const hd = ellipse(hx, hy, 7, 22, a);
    cel(g, hd, hex('#e2c98a'), { sd: 3, hd: 0 }); ink(g, hd, 1.4);
  }
  const vase = P(`M826 ${TOP} C812 ${TOP - 40} 818 ${TOP - 80} 842 ${TOP - 96} L874 ${TOP - 96} C898 ${TOP - 80} 904 ${TOP - 40} 890 ${TOP} Z`);
  cel(g, vase, hex('#6f8f9a'), { sd: 14, hd: 7 }); ink(g, vase, 2.4);

  // a round stool at the front right
  shadow(g, ellipse(900, 1056, 150, 22), [110, 80, 100], 0.4, 4);
  for (const x of [820, 960]) { const l = P(`M${x - 9} 990 L${x + 9} 990 L${x + 14} 1080 L${x - 14} 1080 Z`); cel(g, l, shadeOf(WOOD, 0.4), { sd: 4, hd: 0 }); ink(g, l, 2.2); }
  const seat = rrect(770, 950, 250, 46, 20);
  cel(g, seat, hex('#8f4a44'), { sd: 12, hd: 6 }); ink(g, seat, 2.6);
  for (const x of [830, 895, 960]) { g.fillStyle = css(hex('#6a302e')); g.fill(ellipse(x, 972, 4, 4)); }

  // sun through the blinds: warm bars across the wall and the piano, slanting down to the left
  for (let i = 0; i < 9; i++) {
    const y = 40 + i * 62;
    lit(g, poly([[1080, y], [1080, y + 34], [-40, y + 34 + 330], [-40, y + 330]]), [255, 214, 150], 0.5, 3);
  }
}

function metronome(ctx, x, s) {
  const beat = s * (64 / 60);
  const a = 0.42 * Math.cos(Math.PI * beat); // at one end on every beat
  // the open case
  const body = P(`M${x - 44} ${TOP} L${x - 16} ${TOP - 130} L${x + 16} ${TOP - 130} L${x + 44} ${TOP} Z`);
  cel(ctx, body, hex('#a8693f'), { sd: 12, hd: 5 }); ink(ctx, body, 2.4);
  const face = P(`M${x - 30} ${TOP - 20} L${x - 12} ${TOP - 118} L${x + 12} ${TOP - 118} L${x + 30} ${TOP - 20} Z`);
  cel(ctx, face, hex('#3a2a28'), { sd: 0, hd: 0 }); ink(ctx, face, 1.6);
  // the scale: small ticks up the face
  ctx.strokeStyle = css(hex('#d2ab62'), 0.8); ctx.lineWidth = 1.4;
  for (let k = 0; k < 8; k++) { const y = TOP - 30 - k * 11; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke(); }
  // the pendulum, pivoting low, its weight high
  ctx.save();
  ctx.translate(x, TOP - 26);
  ctx.rotate(a);
  ink(ctx, P('M0 6 L0 -122'), 3, hex('#d9d2c2'));
  const w = poly([[-9, -92], [9, -92], [6, -72], [-6, -72]]);
  cel(ctx, w, hex('#d2ab62'), { sd: 3, hd: 2 }); ink(ctx, w, 1.6);
  ctx.restore();
  const base = rrect(x - 50, TOP - 12, 100, 14, 3);
  cel(ctx, base, hex('#8a5232'), { sd: 4, hd: 3 }); ink(ctx, base, 2.2);
}

export const piano = {
  id: 'piano',
  draw(ctx, s) {
    setLight(AFT);
    ctx.drawImage(held('piano:room', room), 0, 0);
    metronome(ctx, 392, s);
    // the cat: a loaf on the lid, fast asleep, the tail hanging down the front
    const beat = s * (64 / 60);
    const sway = Math.sin(Math.PI * beat / 2) * (0.75 + 0.25 * drift(s, 9));
    const twitch = gesture(s, 9.0, 9.9, 0.2) * Math.sin(TAU * (s - 9) * 3) * 0.5;
    const cx = 620, k = 0.66;
    shadow(ctx, ellipse(cx + 10, TOP + 4, 150, 10), [110, 80, 100], 0.5, 2);
    ctx.save();
    ctx.translate(cx, TOP + 2);
    ctx.scale(k, k);
    const sw = sway + twitch;
    tail(ctx, COATS.blue, [[160, -60], [200, -36], [210, 30], [206 + sw * 12, 110], [202 + sw * 30, 190], [206 + sw * 46, 262], [222 + sw * 54, 310]], 32, 13);
    loaf(ctx, COATS.blue, {
      tail: false, breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75), mode: 'sleep', yaw: -0.2, tilt: 0.1 + 0.015 * Math.sin(TAU * s / 3.75),
      earL: gesture(s, 4.0, 4.5, 0.12) * -0.3, earR: gesture(s, 11.6, 12.1, 0.12) * 0.3,
    });
    ctx.restore();
    motes(ctx, 29, 60, [0, 40, 1080, 860], s, { a: 0.75 });
    glow(ctx, 1080, 160, 760, [255, 226, 170], 0.26);
    grade(ctx, 'piano', { x: 980, y: 200, r: 1100, warm: [255, 206, 140], wa: 0.45, cool: [100, 80, 130], ca: 0.28 });
  },
};
