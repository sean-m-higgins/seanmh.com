// Scene 15 · stove — night coming on. Sunny and the grey tabby lie either side
// of the wood stove on the rug, lit by the fire. Sunny looks across and blinks
// slowly; she blinks slowly back. The kettle on top breathes steam. Bars 61–64.
// Sunny is a tripod with a bob tail: the loaf tucks his legs and shows the bob.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, grade, setLight, gesture, smooth, span, drift, blink, clamp, shadeOf, lightOf, INK, rd, mul32,
  shadow, lit, planks, steam, books, stars,
} from './kit.js';
import { COATS, loaf } from './cats.js';

const FIRE_L = { x: 0.8, y: -0.3, warm: [255, 186, 110], cool: [50, 36, 78], k: 1.15 };  // lit from the right
const FIRE_R = { x: -0.8, y: -0.3, warm: [255, 186, 110], cool: [50, 36, 78], k: 1.15 }; // lit from the left
const WALL = hex('#5a4a52'), IRON = hex('#2e2a30');
const FLOOR_Y = 800;

function room(g, R) {
  setLight(FIRE_L);
  const wg = g.createRadialGradient(540, 620, 60, 540, 620, 760);
  wg.addColorStop(0, css(lightOf(WALL, 1.2, [255, 170, 110]))); wg.addColorStop(0.5, css(WALL)); wg.addColorStop(1, css(shadeOf(WALL, 1.6)));
  g.fillStyle = wg; g.fillRect(0, 0, SIZE, FLOOR_Y);
  // a window at the left: night, a few stars
  const win = rect(70, 90, 240, 330);
  g.fillStyle = vgrad(g, 90, 420, [[0, hex('#182048')], [1, hex('#34426e')]]); g.fill(win);
  stars(g, R, 70, 90, 240, 300, 22);
  for (const r of [rect(56, 76, 268, 16), rect(56, 418, 268, 20), rect(56, 76, 16, 360), rect(308, 76, 16, 360), rect(184, 90, 12, 330), rect(70, 246, 240, 10)]) { cel(g, r, hex('#4a4048'), { sd: 3, hd: 2 }); ink(g, r, 2, [18, 12, 18]); }
  // shelves at the right: books, a jar, a small plant
  for (const y of [210, 380]) { const sh = rect(760, y, 300, 14); cel(g, sh, hex('#6a4a3a'), { sd: 4, hd: 3 }); ink(g, sh, 2, [18, 12, 18]); }
  setLight(FIRE_R);
  books(g, R, 772, 1000, 210, { h: 110 });
  books(g, R, 850, 1056, 380, { h: 118 });
  const jar = rrect(778, 318, 50, 62, 8); cel(g, jar, hex('#8fa09a'), { sd: 8, hd: 4 }); ink(g, jar, 2, [18, 12, 18]);
  const jl = rrect(774, 310, 58, 12, 4); cel(g, jl, hex('#c9a45a'), { sd: 3, hd: 2 }); ink(g, jl, 1.8, [18, 12, 18]);
  setLight(FIRE_L);

  // the floor, the stone hearth, the rug
  planks(g, R, FLOOR_Y, SIZE, { vy: 240, n: 10, base: [104, 70, 60] });
  const bb = rect(0, FLOOR_Y - 26, SIZE, 28);
  cel(g, bb, hex('#6f5a5e'), { sd: 5, hd: 0 }); ink(g, bb, 2, [18, 12, 18]);
  const hearth = poly([[300, FLOOR_Y - 8], [780, FLOOR_Y - 8], [830, FLOOR_Y + 76], [250, FLOOR_Y + 76]]);
  cel(g, hearth, hex('#8a8088'), { sd: 0, hd: 0 });
  g.save(); g.clip(hearth); g.strokeStyle = css([40, 30, 40], 0.5); g.lineWidth = 2;
  for (const x of [380, 470, 560, 650, 730]) { g.beginPath(); g.moveTo(x, FLOOR_Y - 8); g.lineTo(540 + (x - 540) * 1.2, FLOOR_Y + 76); g.stroke(); }
  g.beginPath(); g.moveTo(250, FLOOR_Y + 30); g.lineTo(830, FLOOR_Y + 30); g.stroke();
  g.restore(); ink(g, hearth, 2.4, [18, 12, 18]);
  const rug = ellipse(540, 960, 600, 120);
  cel(g, rug, hex('#9a4a44'), { sd: 0, hd: 0 });
  g.save(); g.clip(rug);
  for (const [k, c] of [[0.9, '#d9b07a'], [0.84, '#9a4a44'], [0.62, '#c9844a'], [0.56, '#9a4a44']]) { g.fillStyle = css(hex(c)); g.fill(ellipse(540, 960, 600 * k, 120 * k)); }
  g.restore(); ink(g, rug, 2.4, [18, 12, 18]);

  // a basket of logs behind, at the right
  for (const [x, y, c] of [[960, 716, '#a9744a'], [1010, 724, '#8f5e3a'], [984, 688, '#b98a5a']]) {
    const lg = ellipse(x, y, 34, 30); cel(g, lg, hex(c), { sd: 8, hd: 4 }); ink(g, lg, 2, [18, 12, 18]);
    g.strokeStyle = css([60, 30, 20], 0.6); g.lineWidth = 1.4; for (const r of [10, 20]) { g.beginPath(); g.ellipse(x, y, r, r * 0.88, 0, 0, TAU); g.stroke(); }
  }
  const bk = P('M900 730 L1070 730 L1050 830 L920 830 Z');
  cel(g, bk, hex('#b08a5a'), { sd: 16, hd: 6 });
  g.save(); g.clip(bk); g.strokeStyle = css(hex('#6a4a2a'), 0.6); g.lineWidth = 2.4;
  for (let y = 738; y < 830; y += 12) { g.beginPath(); g.moveTo(890, y); g.lineTo(1080, y); g.stroke(); }
  for (let x = 900; x < 1080; x += 16) { g.beginPath(); g.moveTo(x, 730); g.lineTo(x - (x - 985) * 0.12, 830); g.stroke(); }
  g.restore(); ink(g, bk, 2.4, [18, 12, 18]);

  // --- the stove: pipe, top plate, body, legs, the door's frame (the fire is drawn live)
  const pipe = rect(506, -10, 68, 430);
  cel(g, pipe, IRON, { sd: 14, hd: 8, hi: hex('#6a5a58'), lx: 1, ly: 0 }); ink(g, pipe, 2.4, [12, 8, 12]);
  const collar = rect(498, 300, 84, 16); cel(g, collar, hex('#3a343a'), { sd: 4, hd: 3, hi: hex('#6a5a58') }); ink(g, collar, 2, [12, 8, 12]);
  for (const x of [432, 618]) { const leg = P(`M${x} 790 L${x + 30} 790 L${x + 36} 836 L${x - 6} 836 Z`); cel(g, leg, IRON, { sd: 4, hd: 0 }); ink(g, leg, 2.2, [12, 8, 12]); }
  shadow(g, ellipse(540, 838, 190, 14), [30, 16, 30], 0.6, 3);
  const body = rrect(416, 430, 248, 366, 14);
  cel(g, body, IRON, { sd: 20, hd: 8, hi: hex('#5a4a48') }); ink(g, body, 2.6, [12, 8, 12]);
  const plate = rrect(398, 412, 284, 26, 6);
  cel(g, plate, hex('#3a343a'), { sd: 5, hd: 4, hi: hex('#6a5a58') }); ink(g, plate, 2.4, [12, 8, 12]);
  // the ash door below, with a little vent wheel
  const ash = rrect(446, 716, 188, 54, 6); ink(g, ash, 2, [12, 8, 12]);
  const vent = ellipse(540, 743, 16, 16); cel(g, vent, hex('#3f383e'), { sd: 3, hd: 2, hi: hex('#6a5a58') }); ink(g, vent, 1.8, [12, 8, 12]);
  for (let k = 0; k < 6; k++) { const a = k * TAU / 6; g.fillStyle = css([255, 150, 70], 0.8); g.fill(ellipse(540 + Math.cos(a) * 9, 743 + Math.sin(a) * 9, 2.4, 2.4)); }
  // the kettle on the plate
  const kb = P('M452 412 C440 380 452 350 484 346 L516 346 C548 350 560 380 548 412 Z');
  cel(g, kb, hex('#b0563c'), { sd: 12, hd: 6 }); ink(g, kb, 2.4, [18, 12, 18]);
  const sp = new Path2D(); sp.moveTo(456, 392); sp.quadraticCurveTo(428, 384, 422, 356);
  ink(g, sp, 13, [18, 12, 18]); ink(g, sp, 8, hex('#b0563c'));
  const hdl = new Path2D(); hdl.moveTo(470, 348); hdl.bezierCurveTo(472, 306, 528, 306, 530, 348);
  ink(g, hdl, 9, [18, 12, 18]); ink(g, hdl, 5, hex('#3a3034'));
  const kl = ellipse(500, 346, 16, 6); cel(g, kl, hex('#3a3034'), { sd: 0, hd: 0 }); ink(g, kl, 1.8, [18, 12, 18]);
}

const DOOR = P('M462 690 L462 540 C462 486 618 486 618 540 L618 690 Z');

function fire(ctx, s) {
  ctx.save();
  ctx.clip(DOOR);
  ctx.fillStyle = vgrad(ctx, 500, 690, [[0, hex('#5a1e12')], [0.6, hex('#b8441c')], [1, hex('#f08a2a')]]);
  ctx.fillRect(450, 480, 180, 220);
  // logs, glowing along their tops
  for (const [x, y, w, a] of [[540, 672, 150, 0.05], [530, 650, 120, -0.12]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = css(hex('#3a1c14')); ctx.fill(rrect(-w / 2, -13, w, 26, 12));
    ctx.fillStyle = css([255, 170, 70], 0.8); ctx.fillRect(-w / 2 + 8, -13, w - 16, 4);
    ctx.restore();
  }
  // flames: tongues that lean and stretch, each on its own slow clock
  for (const [i, x, w, h, c] of [[0, 512, 44, 120, '#f7922e'], [1, 560, 52, 150, '#f7922e'], [2, 590, 36, 96, '#f7922e'], [3, 536, 30, 100, '#ffd24a'], [4, 566, 28, 86, '#ffd24a'], [5, 548, 14, 50, '#fff3c0']]) {
    const t = s * (1.5 + i * 0.23) + i * 1.7;
    const hh = h * (0.78 + 0.22 * Math.sin(t * 2.1) + 0.1 * Math.sin(t * 5.3));
    const lean = 10 * Math.sin(t * 1.3) + 5 * Math.sin(t * 3.7);
    const f = new Path2D();
    f.moveTo(x - w / 2, 664);
    f.bezierCurveTo(x - w * 0.62, 664 - hh * 0.45, x - w * 0.1 + lean * 0.5, 664 - hh * 0.7, x + lean, 664 - hh);
    f.bezierCurveTo(x + w * 0.2 + lean * 0.4, 664 - hh * 0.62, x + w * 0.66, 664 - hh * 0.4, x + w / 2, 664);
    f.closePath();
    ctx.fillStyle = css(hex(c), 0.95); ctx.fill(f);
  }
  // sparks going up
  const R = mul32(19);
  for (let i = 0; i < 9; i++) {
    const ph = R(), sp = rd(R, 0.4, 0.8), x0 = rd(R, 490, 590);
    const u = ((s * sp + ph) % 1 + 1) % 1;
    ctx.fillStyle = css([255, 226, 150], 1 - u);
    ctx.fill(ellipse(x0 + Math.sin(u * 9 + i) * 10, 640 - u * 130, 2, 2));
  }
  ctx.restore();
  // the door's bars and frame over the fire
  ink(ctx, DOOR, 9, [12, 8, 12]); ink(ctx, DOOR, 4.5, hex('#4a4046'));
  ink(ctx, P('M540 500 L540 690 M462 600 L618 600'), 5, [18, 12, 16]);
  const latch = rrect(622, 596, 22, 12, 4); cel(ctx, latch, hex('#c9a45a'), { sd: 0, hd: 0 }); ink(ctx, latch, 1.6, [12, 8, 12]);
}

export const stove = {
  id: 'stove',
  draw(ctx, s) {
    setLight(FIRE_L);
    ctx.drawImage(held('stove:room', room), 0, 0);
    fire(ctx, s);
    steam(ctx, 420, 352, s, { h: 130, w: 16, a: 0.4, c: [255, 232, 214] });
    // the fire's light on the hearth and the rug
    glow(ctx, 540, 700, 430, [255, 150, 70], 0.4);
    // the two of them: Sunny at the left, the grey tabby at the right, both turned to the fire
    const lookS = gesture(s, 2.6, 8.2, 0.9);           // Sunny looks across at her
    const slowS = gesture(s, 4.2, 6.6, 0.9);           // and blinks slowly
    const lookG = gesture(s, 5.6, 11.6, 0.9);          // she looks back
    const slowG = gesture(s, 7.4, 9.9, 0.9);           // and answers
    const doze = smooth(span(s, 11.2, 13.4));          // then both let their eyes close
    for (const x of [236, 846]) shadow(ctx, ellipse(x, 906, 200, 28), [50, 20, 40], 0.5, 3);
    ctx.save();
    ctx.translate(236, 900); ctx.scale(0.84, 0.84);
    loaf(ctx, COATS.sunny, {
      flip: true, breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75), tail: 0.3 * Math.sin(TAU * s / 5),
      yaw: -0.42 + lookS * 0.1, tilt: 0.03 * drift(s, 8), look: [-5 - lookS * 3, 2 - lookS * 2], pupil: 0.55,
      blink: Math.min(1, slowS + doze * 0.82 + blink(s, [1.4], 0.3)), earR: gesture(s, 9.6, 10.1, 0.12) * 0.3,
    });
    ctx.restore();
    setLight(FIRE_R);
    ctx.save();
    ctx.translate(846, 900); ctx.scale(0.84, 0.84);
    loaf(ctx, COATS.grey, {
      breath: 0.5 + 0.5 * Math.sin(TAU * (s / 3.75 + 0.45)), tail: 0.5 * Math.sin(TAU * s / 4.2),
      yaw: -0.42 + lookG * 0.1, tilt: -0.03 * drift(s, 7, 0.3), look: [-5 - lookG * 3, 2 - lookG * 2], pupil: 0.55,
      blink: Math.min(1, slowG + doze * 0.82 + blink(s, [2.9], 0.3)), earL: gesture(s, 3.6, 4.1, 0.12) * -0.3,
    });
    ctx.restore();
    setLight(FIRE_L);
    glow(ctx, 540, 600, 700, [255, 160, 80], 0.32);
    grade(ctx, 'stove', { x: 540, y: 620, r: 900, warm: [255, 156, 80], wa: 0.55, cool: [36, 26, 70], ca: 0.5, screen: 0.08 });
  },
};
