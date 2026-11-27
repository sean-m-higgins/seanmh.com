// Scene 3 · balcony — midday. The Russian blue sits among potted herbs on a
// small balcony and follows a white butterfly with its whole head; the tail
// tip curls. The city and a high summer sky beyond. Bars 9–12.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, vine, lavender, leaf, drift, gesture, smooth, span, clamp,
  shadeOf, lightOf, INK, rd, mul32,
} from './kit.js';
import { COATS, sit } from './cats.js';

const NOON = { x: 0.35, y: -0.94, warm: [255, 244, 214], cool: [80, 84, 130], k: 1 };
const RAIL_Y = 520, FLOOR_Y = 600;

function city(g, R) {
  g.fillStyle = vgrad(g, 0, FLOOR_Y, [[0, hex('#6fa6d6')], [0.6, hex('#a9cde6')], [1, hex('#e5eef0')]]);
  g.fillRect(0, 0, SIZE, FLOOR_Y + 40);
  // big summer clouds
  const cloud = (cx, cy, w) => {
    for (let k = 0; k < 9; k++) {
      const x = cx + rd(R, -w, w), y = cy + rd(R, -w * 0.25, w * 0.15), r = rd(R, w * 0.25, w * 0.45);
      g.fillStyle = css([250, 250, 252]); g.fill(ellipse(x, y, r, r * 0.8));
      g.fillStyle = css([206, 214, 232], 0.8); g.fill(ellipse(x + r * 0.15, y + r * 0.35, r * 0.85, r * 0.4));
    }
  };
  cloud(260, 170, 170); cloud(820, 120, 140); cloud(620, 300, 90);
  // the far city: pale towers
  let x = -20;
  while (x < SIZE) {
    const w = rd(R, 50, 110), h = rd(R, 90, 260);
    g.fillStyle = css(mix(hex('#b8c6d6'), hex('#dfe6ea'), R() * 0.5));
    g.fillRect(x, 560 - h, w, h + 60);
    g.fillStyle = css(hex('#e9eef2'), 0.8); g.fillRect(x, 560 - h, w * 0.3, h + 60);
    x += w + rd(R, -10, 4);
  }
  // nearer roofs and trees, warmer
  x = -40;
  while (x < SIZE) {
    const w = rd(R, 110, 200), h = rd(R, 50, 110);
    g.fillStyle = css(hex('#c98a6a'));
    g.fill(poly([[x, 620], [x, 590 - h], [x + w / 2, 560 - h], [x + w, 590 - h], [x + w, 620]]));
    g.fillStyle = css(hex('#e6d6c0')); g.fillRect(x + 8, 600 - h, w - 16, h + 20);
    x += w + rd(R, 20, 50);
  }
  for (let i = 0; i < 18; i++) {
    const tx = rd(R, 0, SIZE), ty = rd(R, 520, 590);
    g.fillStyle = css(mix(hex('#6f9a4c'), hex('#a9c46a'), R())); g.fill(ellipse(tx, ty, rd(R, 30, 60), rd(R, 22, 40)));
  }
}

function balconyLayer(g, R) {
  setLight(NOON);
  g.drawImage(soft('balcony:city', 4, city), 0, 0);
  // the floor: warm terracotta tiles in perspective
  const fl = poly([[0, FLOOR_Y], [SIZE, FLOOR_Y], [SIZE, SIZE], [0, SIZE]]);
  g.fillStyle = vgrad(g, FLOOR_Y, SIZE, [[0, hex('#c97c55')], [1, hex('#b2643f')]]);
  g.fill(fl);
  g.save(); g.clip(fl);
  g.strokeStyle = css(hex('#e9c9a6'), 0.8); g.lineWidth = 3;
  let y = FLOOR_Y, step = 40;
  while (y < SIZE) { g.beginPath(); g.moveTo(0, y); g.lineTo(SIZE, y); g.stroke(); y += step; step *= 1.22; }
  for (let i = -12; i <= 12; i++) {
    g.beginPath(); g.moveTo(540 + i * 70, FLOOR_Y); g.lineTo(540 + i * 70 * 3.2, SIZE); g.stroke();
  }
  // a few tiles a shade different
  for (let k = 0; k < 14; k++) {
    g.fillStyle = css(R() < 0.5 ? hex('#d98a60') : hex('#a85a38'), 0.35);
    g.fill(ellipse(rd(R, 0, SIZE), rd(R, FLOOR_Y + 40, SIZE), rd(R, 30, 60), rd(R, 10, 25)));
  }
  g.restore();
  // the wall the balcony hangs from, behind on the left edge? No: the railing.
  // a low wall below the railing, then iron railing on top
  const wall = rect(0, RAIL_Y + 20, SIZE, FLOOR_Y - RAIL_Y - 20);
  cel(g, wall, hex('#efe4d2'), { sd: 0, hd: 0 });
  g.fillStyle = vgrad(g, RAIL_Y + 20, FLOOR_Y, [[0, [255, 255, 255], 0], [1, [120, 90, 100], 0.25]]);
  g.fill(wall);
  ink(g, wall, 2.4);
  const iron = hex('#3e4a4a');
  g.lineCap = 'round';
  const top = rect(0, 248, SIZE, 14);
  cel(g, top, iron, { sd: 4, hd: 4, hi: hex('#7a8a86') }); ink(g, top, 2);
  for (let x = 20; x < SIZE; x += 54) {
    const bar = rect(x, 262, 9, RAIL_Y + 20 - 262);
    g.fillStyle = css(iron); g.fill(bar);
    g.fillStyle = css(hex('#7a8a86')); g.fillRect(x + 6, 262, 2, RAIL_Y + 20 - 262);
    // a curl at the top of each bar
    const c = new Path2D(); c.arc(x + 4.5, 286, 12, Math.PI * 0.2, Math.PI * 1.9);
    ink(g, c, 4, iron);
  }
  // window boxes hung on the rail: herbs spilling over
  for (const [bx, w] of [[30, 300], [720, 330]]) {
    bush(g, mul32(bx), bx + w / 2, 196, w * 0.55, 80, { n: 70, L: 34, W: 13, lit: 0.6 });
    const box = rrect(bx, 230, w, 58, 6);
    cel(g, box, hex('#5d7f6a'), { sd: 10, hd: 6 }); ink(g, box, 2.4);
    vine(g, mul32(bx + 1), [[bx + 30, 270], [bx + 40, 330], [bx + 30, 400], [bx + 44, 470]], { every: 24, L: 28, W: 12 });
  }
  // pots on the floor: lavender left, a basil bush, a big leafy plant right
  const pot = (x, y, w, h, c) => {
    g.fillStyle = css([90, 40, 30], 0.35); g.fill(ellipse(x + 20, y + 4, w * 0.7, 14));
    const p = P(`M${x - w / 2} ${y - h} L${x + w / 2} ${y - h} L${x + w * 0.38} ${y} L${x - w * 0.38} ${y} Z`);
    cel(g, p, c, { sd: 18, hd: 10 }); ink(g, p, 2.4);
    const r = rrect(x - w / 2 - 8, y - h - 20, w + 16, 24, 5);
    cel(g, r, lightOf(c, 0.2), { sd: 6, hd: 5 }); ink(g, r, 2.4);
  };
  for (let i = 0; i < 14; i++) lavender(g, R, 140 + rd(R, -40, 40), 780, rd(R, 180, 270), rd(R, -0.4, 0.4));
  pot(140, 880, 170, 110, hex('#c56e3e'));
  bush(g, mul32(31), 360, 720, 120, 90, { n: 70, L: 40, W: 18, lit: 0.6, cols: [hex('#4f8a3a'), hex('#6fa648'), hex('#3f7a34'), hex('#8cc05a')] });
  pot(360, 830, 150, 100, hex('#d7895a'));
  // the big leafy plant at the far right, partly out of frame
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + rd(R, -1.3, 0.9);
    const L = rd(R, 160, 300);
    const sx = 1000, sy = 760;
    const ex = sx + Math.cos(a) * L, ey = sy + Math.sin(a) * L;
    const stem = new Path2D(); stem.moveTo(sx, sy); stem.quadraticCurveTo(sx + Math.cos(a) * L * 0.3, sy + Math.sin(a) * L * 0.8, ex, ey);
    ink(g, stem, 4, INK, 0.8); ink(g, stem, 2.2, hex('#5f8a3a'));
    leaf(g, ex, ey, a + rd(R, -0.5, 0.5), rd(R, 110, 160), rd(R, 42, 58), mix(hex('#3f7a3a'), hex('#7fae4a'), R()), { lit: R() < 0.5 ? 0.8 : 0, lw: 2.2 });
  }
  pot(1000, 900, 200, 140, hex('#b9653a'));
  // a small wooden stool with a watering can
  const st = rrect(560, 760, 170, 22, 4);
  for (const lx of [574, 700]) { const l = rect(lx, 782, 16, 110); cel(g, l, hex('#a5754a'), { sd: 5, hd: 3 }); ink(g, l, 2.2); }
  cel(g, st, hex('#c08a5a'), { sd: 6, hd: 5 }); ink(g, st, 2.4);
  const can = P('M590 760 L600 680 L690 680 L700 760 Z');
  cel(g, can, hex('#e6c35a'), { sd: 14, hd: 8 }); ink(g, can, 2.4);
  const spout = new Path2D(); spout.moveTo(695, 740); spout.lineTo(760, 690);
  ink(g, spout, 12, INK); ink(g, spout, 7, hex('#e6c35a'));
  const handle = new Path2D(); handle.moveTo(610, 684); handle.bezierCurveTo(615, 630, 675, 630, 680, 684);
  ink(g, handle, 10, INK); ink(g, handle, 6, hex('#e6c35a'));
}

/** The butterfly's flight: a slow figure-of-eight over the plants, continuous in s. */
function flight(s) {
  const u = TAU * s / 15;
  return [520 + 300 * Math.sin(u) + 40 * Math.sin(3.1 * u), 300 + 110 * Math.sin(2 * u + 0.6) + 18 * Math.sin(7 * u)];
}

function butterfly(ctx, x, y, s) {
  const flap = Math.abs(Math.sin(s * 14));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.2 * Math.sin(s * 3));
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side * (0.25 + 0.75 * flap), 1);
    const up = blob([[0, -2], [14, -22], [30, -18], [26, -2]]);
    const lo = blob([[0, 2], [20, 6], [18, 20], [6, 16]]);
    for (const w of [up, lo]) { ctx.fillStyle = css([252, 250, 236]); ctx.fill(w); ink(ctx, w, 1.4); }
    ctx.fillStyle = css([240, 200, 90], 0.9); ctx.fill(ellipse(22, -14, 4, 3));
    ctx.restore();
  }
  ink(ctx, P('M0 -10 L0 12'), 3);
  ink(ctx, P('M0 -10 Q-4 -20 -8 -24 M0 -10 Q4 -20 8 -24'), 1);
  ctx.restore();
}

export const balcony = {
  id: 'balcony',
  draw(ctx, s) {
    setLight(NOON);
    ctx.drawImage(held('balcony:layer', balconyLayer), 0, 0);
    const [bx, by] = flight(s);
    // the cat sits at the right of centre, facing left (flipped), head up
    const cx = 760, cy = 900, k = 0.72;
    const hx = cx - 4 * k, hy = cy - 330 * k;
    const dx = bx - hx, dy = by - hy;
    const yaw = clamp(dx / 520, -0.55, 0.55);       // screen right = positive
    const tilt = clamp(dy / 1400, -0.25, 0.1);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = css([170, 110, 110], 0.5);
    ctx.fill(ellipse(cx - 10, cy + 6, 160, 24));
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    sit(ctx, COATS.blue, {
      flip: true, breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75),
      yaw: -yaw, tilt: tilt + 0.04 * drift(s, 6), look: [clamp(-dx / 60, -7, 7), clamp(dy / 80, -8, 4)], pupil: 0.3,
      tail: 0.6 * Math.sin(TAU * s / 5) + 0.4 * drift(s, 7.5), blink: gesture(s, 11.4, 11.8, 0.18),
      earL: 0.15 * gesture(s, 4, 4.6, 0.15), earR: 0.2 * gesture(s, 8.5, 9.1, 0.15),
    });
    ctx.restore();
    // the near basil, and the butterfly above it all
    butterfly(ctx, bx, by, s);
    grade(ctx, 'balcony', { x: 900, y: 0, r: 1100, warm: [255, 240, 200], wa: 0.35, cool: [110, 110, 160], ca: 0.2 });
  },
};
