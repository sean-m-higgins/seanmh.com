// Scene 2 · sunpatch — late morning. Sunny asleep, curled on a round woven rug
// in the window-shaped patch of sun on the floor. Dust turns in the beam; he
// breathes once a bar; an ear flicks; the bob twitches. Bars 5–8.
// Sunny is a tripod with a bob tail: curled, his legs are tucked and the bob
// shows at the back.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, leaf, sunPatch, motes, drift, gesture, smooth, span,
  shadeOf, lightOf, INK, rd, mul32,
} from './kit.js';
import { COATS, curl } from './cats.js';

const LATE = { x: -0.72, y: -0.68, warm: [255, 222, 160], cool: [92, 72, 118], k: 1 };
const FLOOR = hex('#b9824f'), FLOOR_D = hex('#7f4f2c'), WALL = hex('#e9dcc4');
const BASE_Y = 250; // where the wall meets the floor

function room(g, R) {
  setLight(LATE);
  // the wall, with a bookshelf's lower shelves at the right
  g.fillStyle = vgrad(g, 0, BASE_Y, [[0, shadeOf(WALL, 0.25)], [1, WALL]]);
  g.fillRect(0, 0, SIZE, BASE_Y);
  const shelf = (x, y, w, h) => {
    const p = rect(x, y, w, h);
    cel(g, p, hex('#9a6a44'), { sd: 6, hd: 4 });
    ink(g, p, 2.2);
  };
  // shelf carcass
  g.fillStyle = css(hex('#5d3d2a'));
  g.fillRect(700, -10, 380, BASE_Y + 14);
  shelf(690, -10, 22, BASE_Y + 16);
  shelf(700, 110, 380, 18);
  shelf(700, BASE_Y - 4, 380, 18);
  // books on the shelves: spines in muted colours, a few leaning
  const spines = ['#7d4a3a', '#c9a35a', '#4f6a7a', '#a35b4a', '#6b7a4a', '#d8c7a0', '#8a5f7a', '#3f5268', '#b8774a'];
  for (const [y0, y1] of [[-10, 110], [128, BASE_Y - 4]]) {
    let x = 716;
    while (x < 1080) {
      const w = rd(R, 18, 34), h = (y1 - y0) * rd(R, 0.7, 0.94);
      if (R() < 0.12 && x > 760) { x += rd(R, 20, 40); continue; } // a gap
      const lean = R() < 0.1 ? rd(R, -0.18, -0.08) : 0;
      const c = hex(spines[(R() * spines.length) | 0]);
      g.save(); g.translate(x, y1); g.rotate(lean);
      const b = rect(0, -h, w, h);
      cel(g, b, c, { sd: 5, hd: 3 }); ink(g, b, 1.8);
      g.fillStyle = css(lightOf(c, 0.8), 0.8);
      g.fillRect(3, -h * 0.8, w - 6, 3); g.fillRect(3, -h * 0.25, w - 6, 3);
      g.restore();
      x += w + 2;
    }
  }
  // the baseboard
  const bb = rect(0, BASE_Y - 26, 690, 28);
  cel(g, bb, hex('#f3ead8'), { sd: 6, hd: 0 }); ink(g, bb, 2.2);

  // the floor: planks running toward us, in gentle perspective
  const fl = poly([[0, BASE_Y], [SIZE, BASE_Y], [SIZE, SIZE], [0, SIZE]]);
  g.fillStyle = vgrad(g, BASE_Y, SIZE, [[0, shadeOf(FLOOR, 0.5)], [1, FLOOR]]);
  g.fill(fl);
  const vx = 540, vy = -900; // vanishing point above the frame
  g.save(); g.clip(fl);
  for (let i = -14; i <= 14; i++) {
    const xb = 540 + i * 92;
    const t = (BASE_Y - vy) / (SIZE - vy);
    const xt = vx + (xb - vx) * t;
    g.strokeStyle = css(FLOOR_D, 0.55); g.lineWidth = 2;
    g.beginPath(); g.moveTo(xt, BASE_Y); g.lineTo(xb, SIZE); g.stroke();
    // grain and plank ends
    g.strokeStyle = css(FLOOR_D, 0.22); g.lineWidth = 1.1;
    for (let k = 1; k < 6; k++) {
      const u = k / 6;
      g.beginPath();
      const ax = xt + ((540 + (i + u) * 92 - vx) * t + vx - xt) * 0;
      g.moveTo(xt + (xb - xt) * 0 + 92 * u * t, BASE_Y);
      g.lineTo(xb + 92 * u, SIZE);
      g.stroke();
    }
    const yEnd = BASE_Y + 60 + ((i * 137) % 5 + 5) % 5 * 150;
    const tt = (yEnd - vy) / (SIZE - vy);
    g.strokeStyle = css(FLOOR_D, 0.5); g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(vx + (xb - vx) * tt, yEnd); g.lineTo(vx + (xb + 92 - vx) * tt, yEnd); g.stroke();
  }
  g.restore();
  // shade under the shelf
  g.fillStyle = vgrad(g, BASE_Y, BASE_Y + 60, [[0, [40, 20, 20], 0.35], [1, [40, 20, 20], 0]]);
  g.fillRect(0, BASE_Y, SIZE, 60);

  // the rug: a round braided rug, coils of soft colour
  const rx = 560, ry = 650;
  g.fillStyle = css([60, 30, 30], 0.3);
  g.fill(ellipse(rx + 14, ry + 16, 400, 200));
  const coils = [hex('#d9c3a0'), hex('#c49a72'), hex('#e2cfae'), hex('#b88a68'), hex('#d3b68e'), hex('#c9a07a')];
  for (let k = 0; k < 15; k++) {
    const t = 1 - k / 15;
    const e = ellipse(rx, ry, 396 * t, 196 * t);
    g.fillStyle = css(coils[k % coils.length]);
    g.fill(e);
    // braid texture: little slanted ticks round each coil
    g.strokeStyle = css(shadeOf(coils[k % coils.length], 1), 0.5); g.lineWidth = 1.3;
    g.beginPath();
    const n = Math.max(12, (90 * t) | 0);
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU;
      const x = rx + Math.cos(a) * 396 * t * 0.985, y = ry + Math.sin(a) * 196 * t * 0.985;
      g.moveTo(x - 5, y - 2); g.lineTo(x + 4, y + 3);
    }
    g.stroke();
  }
  ink(g, ellipse(rx, ry, 396, 196), 2.4);
  // the rug's own soft shading
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = lgrad(g, rx - 400, ry - 200, rx + 400, ry + 200, [[0, [255, 255, 255], 0], [1, [150, 120, 150], 0.4]]);
  g.fill(ellipse(rx, ry, 398, 198));
  g.restore();

  // a floor plant in a woven basket at the left
  const px = 130, py = 470;
  g.fillStyle = css([50, 25, 25], 0.3); g.fill(ellipse(px + 30, py + 8, 120, 22));
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + rd(R, -1.2, 1.2);
    const L = rd(R, 140, 230);
    const stem = new Path2D(); stem.moveTo(px, py - 110); stem.quadraticCurveTo(px + Math.cos(a) * L * 0.4, py - 110 + Math.sin(a) * L * 0.6, px + Math.cos(a) * L, py - 110 + Math.sin(a) * L);
    ink(g, stem, 3, INK, 0.8); ink(g, stem, 1.6, hex('#5f7f3a'));
    leaf(g, px + Math.cos(a) * L, py - 110 + Math.sin(a) * L, a + rd(R, -0.4, 0.4), rd(R, 80, 120), rd(R, 30, 40), mix(hex('#4f7f3a'), hex('#8fb04a'), R()), { lit: R() < 0.4 ? 0.8 : 0, lw: 2 });
  }
  const basket = P(`M${px - 90} ${py - 120} L${px + 90} ${py - 120} L${px + 70} ${py} L${px - 70} ${py} Z`);
  cel(g, basket, hex('#c9a46a'), { sd: 22, hd: 8 });
  g.save(); g.clip(basket);
  g.strokeStyle = css(hex('#8a6a3a'), 0.6); g.lineWidth = 2;
  for (let y = py - 116; y < py; y += 10) { g.beginPath(); g.moveTo(px - 100, y); g.lineTo(px + 100, y); g.stroke(); }
  for (let x = px - 100; x < px + 100; x += 14) { g.beginPath(); g.moveTo(x, py - 120); g.lineTo(x + 3, py); g.stroke(); }
  g.restore();
  ink(g, basket, 2.4);

  // a toy mouse left on the boards, its string tail trailing
  g.fillStyle = css([50, 25, 25], 0.3); g.fill(ellipse(232, 884, 46, 9));
  const tailS = new Path2D(); tailS.moveTo(256, 872); tailS.bezierCurveTo(300, 850, 320, 900, 368, 880);
  ink(g, tailS, 3, hex('#c9584a'));
  const mouse = P('M176 878 C176 852 214 842 244 856 C262 864 264 880 252 884 L182 886 Z');
  cel(g, mouse, hex('#9aa0b0'), { sd: 8, hd: 4 }); ink(g, mouse, 2.2);
  const mEar = ellipse(222, 850, 12, 10); cel(g, mEar, hex('#e8a9a0'), { sd: 3, hd: 0 }); ink(g, mEar, 1.8);
  g.fillStyle = css(INK); g.fill(ellipse(192, 868, 2.6, 2.6));

  // the sun on the floor: the window's shape, slanting from the upper left
  const sun = [[230, 330], [760, 330], [930, 900], [300, 900]];
  sunPatch(g, R, sun, { a: 0.75, blur: 4, bars: [[[470, 330], [500, 330], [640, 900], [600, 900]], [[230, 560], [830, 560], [845, 595], [245, 595]]], leaves: 6 });
}

/** The out-of-focus near layer: the leaves of a plant by the lens, bottom right. */
function near(g, R) {
  setLight(LATE);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.02 + 0.5 * (i / 8)) + rd(R, -0.08, 0.08);
    const L = rd(R, 230, 330);
    const x = 1110 + Math.cos(a) * 40, y = 1120 + Math.sin(a) * 40;
    leaf(g, x, y, a, L, rd(R, 62, 84), mix(hex('#2f5a34'), hex('#5f8a3e'), R()), { lw: 3, lit: i % 3 === 0 ? 0.7 : 0 });
  }
}

export const sunpatch = {
  id: 'sunpatch',
  draw(ctx, s) {
    setLight(LATE);
    ctx.drawImage(held('sunpatch:room', room), 0, 0);
    // Sunny's shadow, soft, on the rug
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = css([150, 110, 120], 0.5);
    ctx.fill(ellipse(600, 700, 230, 90));
    ctx.restore();
    const breath = 0.5 + 0.5 * Math.sin(TAU * s / 3.75);
    ctx.save();
    ctx.translate(560, 620);
    ctx.scale(1.05, 1.05);
    curl(ctx, COATS.sunny, {
      breath,
      earR: gesture(s, 6.0, 6.5, 0.12) * 0.32 + gesture(s, 6.7, 7.1, 0.1) * 0.2,
      earL: gesture(s, 12.2, 12.7, 0.12) * -0.25,
      tail: gesture(s, 9.2, 10.4, 0.25) * Math.sin(TAU * (s - 9.2) * 2.4),
    });
    ctx.restore();
    // dust in the beam
    motes(ctx, 21, 70, [180, 0, 800, 900], s, { a: 0.85, r: 2, inside: (x, y) => y > 120 && x > 160 + (y - 300) * 0.2 && x < 780 + (y - 330) * 0.3 });
    ctx.drawImage(soft('sunpatch:near', 6, near), 0, 0);
    grade(ctx, 'sunpatch', { x: 330, y: 300, r: 950, warm: [255, 200, 120], wa: 0.5 });
  },
};
