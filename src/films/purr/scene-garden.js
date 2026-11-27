// Scene 6 · garden — midday, outside. The black cat sits in the long grass
// among daisies and poppies and follows a bumblebee from flower to flower.
// When it comes close she lifts a paw at it, and thinks better of it. Washing
// stirs on the line; dandelion seeds drift across. Bars 21–24.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, gesture, smooth, span, drift, blink, clamp, lerp, shadeOf, lightOf, INK, rd, mul32,
  shadow, leaf, lavender, motes,
} from './kit.js';
import { COATS, sit } from './cats.js';

const NOON = { x: 0.5, y: -0.86, warm: [255, 246, 206], cool: [52, 84, 96], k: 1 };
const GRASS_Y = 560;
const G1 = hex('#7fb04a'), G2 = hex('#5c9440'), G3 = hex('#3f7a3a');

function far(g, R) {
  g.fillStyle = vgrad(g, 0, 600, [[0, hex('#5ea2dc')], [0.7, hex('#b5dbee')], [1, hex('#e6f1e2')]]);
  g.fillRect(0, 0, SIZE, 620);
  for (const [cx, cy, w] of [[220, 150, 150], [760, 210, 120]]) {
    for (let k = 0; k < 8; k++) { const x = cx + rd(R, -w, w), y = cy + rd(R, -w * 0.22, w * 0.12), r = rd(R, w * 0.25, w * 0.42); g.fillStyle = css([252, 252, 250]); g.fill(ellipse(x, y, r, r * 0.75)); }
  }
  // the trees and hedges beyond the fence
  for (let i = 0; i < 90; i++) {
    const x = rd(R, -40, 1120), y = rd(R, 300, 600), r = rd(R, 40, 110);
    g.fillStyle = css(mix(hex('#4f8a4a'), hex('#a6cc6a'), R() * (1 - (y - 300) / 400)));
    g.fill(ellipse(x, y, r, r * 0.8));
  }
  // a shed roof among them
  g.fillStyle = css(hex('#c98a6a')); g.fill(poly([[700, 430], [800, 370], [900, 430]]));
  g.fillStyle = css(hex('#e9dcc4')); g.fillRect(716, 430, 168, 140);
}

function flower(g, R, x, y, k, kind) {
  // stem
  const stem = new Path2D(); stem.moveTo(x, y); stem.quadraticCurveTo(x + rd(R, -10, 10) * k, y - 40 * k, x + rd(R, -6, 6) * k, y - 86 * k);
  const top = [x, y - 86 * k];
  ink(g, stem, 3.2 * k + 1, INK, 0.8); ink(g, stem, 1.8 * k + 0.6, G3);
  leaf(g, x, y - 26 * k, -Math.PI / 2 + rd(R, 0.6, 1), 30 * k, 9 * k, G2, { lw: 1.3 });
  g.save(); g.translate(top[0], top[1]); g.scale(k, k);
  if (kind === 'daisy') {
    for (let i = 0; i < 11; i++) {
      g.save(); g.rotate(i * TAU / 11);
      const p = ellipse(17, 0, 13, 5.4);
      g.fillStyle = css(i % 2 ? [255, 252, 244] : [238, 236, 240]); g.fill(p); ink(g, p, 1.2, INK, 0.7);
      g.restore();
    }
    const c = ellipse(0, 0, 8.5, 8.5); cel(g, c, hex('#f2c230'), { sd: 3, hd: 0 }); ink(g, c, 1.4);
  } else if (kind === 'poppy') {
    for (let i = 0; i < 4; i++) {
      g.save(); g.rotate(i * TAU / 4 + 0.3);
      const p = blob([[0, 0], [16, -15], [32, -8], [34, 8], [16, 15]]);
      cel(g, p, i % 2 ? hex('#e2533c') : hex('#d6432f'), { sd: 5, hd: 3 }); ink(g, p, 1.5);
      g.restore();
    }
    g.fillStyle = css([40, 26, 30]); g.fill(ellipse(0, 0, 7, 7));
  } else {
    // a bluebell: three small bells down a bent top
    for (let i = 0; i < 3; i++) {
      const b = blob([[i * 7, i * 15], [i * 7 + 13, i * 15 + 3], [i * 7 + 15, i * 15 + 18], [i * 7 + 3, i * 15 + 16]]);
      cel(g, b, hex('#7f86d8'), { sd: 4, hd: 2 }); ink(g, b, 1.3);
    }
  }
  g.restore();
}

function tufts(g, R, n, y0, y1, o = {}) {
  const { x0 = 0, x1 = SIZE, h = 44 } = o;
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = y0 + (y1 - y0) * Math.sqrt(R()), x = rd(R, x0, x1), k = 0.5 + ((y - GRASS_Y) / (SIZE - GRASS_Y)) * 1.1;
    const c = mix(mix(G1, G2, R()), G3, R() * 0.5);
    for (let b = 0; b < 3; b++) {
      const lean = rd(R, -0.5, 0.5), L = h * k * rd(R, 0.6, 1.2);
      g.strokeStyle = css(b === 1 ? lightOf(c, 0.5, [240, 250, 170]) : c);
      g.lineWidth = 3.2 * k;
      g.beginPath(); g.moveTo(x + (b - 1) * 5 * k, y); g.quadraticCurveTo(x + (b - 1) * 5 * k + lean * L * 0.3, y - L * 0.6, x + (b - 1) * 7 * k + lean * L, y - L); g.stroke();
    }
  }
}

function yard(g, R) {
  setLight(NOON);
  g.drawImage(soft('garden:far', 5, far), 0, 0);
  // the fence: weathered white pickets with pointed tops
  const rail = (y) => { const r = rect(0, y, SIZE, 20); cel(g, r, hex('#e3ddd0'), { sd: 5, hd: 0 }); ink(g, r, 2); };
  rail(410); rail(520);
  for (let x = -10; x < SIZE; x += 64) {
    const h = rd(R, -6, 6);
    const p = poly([[x, 590], [x, 364 + h], [x + 24, 338 + h], [x + 48, 364 + h], [x + 48, 590]]);
    cel(g, p, mix(hex('#f4efe4'), hex('#d9d2c6'), R() * 0.6), { sd: 7, hd: 0 }); ink(g, p, 2.2);
    g.strokeStyle = css([150, 140, 130], 0.4); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x + rd(R, 14, 34), 380); g.lineTo(x + rd(R, 14, 34), 580); g.stroke();
  }
  // the lawn, going darker toward us, and its long grass
  g.fillStyle = vgrad(g, GRASS_Y, SIZE, [[0, hex('#9cc65a')], [0.4, G1], [1, G2]]);
  g.fillRect(0, GRASS_Y, SIZE, SIZE - GRASS_Y);
  shadow(g, rect(0, GRASS_Y, SIZE, 26), [90, 130, 110], 0.5, 6);
  tufts(g, R, 420, GRASS_Y + 6, 840);
  // lavender along the fence at the left, a row of flowers through the grass
  for (let i = 0; i < 16; i++) lavender(g, R, rd(R, 20, 250), 640, rd(R, 120, 200), rd(R, -0.35, 0.35));
  const kinds = ['daisy', 'daisy', 'poppy', 'daisy', 'bell'];
  for (let i = 0; i < 34; i++) {
    const y = rd(R, 640, 800), x = rd(R, 0, SIZE);
    if (x > 300 && x < 640 && y > 700) continue; // where the cat sits
    flower(g, R, x, y, 0.55 + (y - 600) / 500, kinds[(R() * kinds.length) | 0]);
  }
  // the washing line's far pole
  const pole = rect(74, 60, 16, 560);
  cel(g, pole, hex('#b9a48a'), { sd: 5, hd: 0 }); ink(g, pole, 2.2);
}

/** The flowers and grass in front of the cat: she sits in it, not on it. */
function front(g, R) {
  setLight(NOON);
  tufts(g, R, 260, 850, 1060, { h: 56 });
  const kinds = ['daisy', 'poppy', 'daisy', 'bell', 'daisy'];
  for (let i = 0; i < 16; i++) {
    const x = rd(R, 0, SIZE), y = rd(R, 900, 1060);
    flower(g, R, x, y, 0.95 + (y - 880) / 420, kinds[i % kinds.length]);
  }
}

/** By the lens and out of focus: a poppy and a few blades, bottom left; leaves, top right. */
function near(g, R) {
  setLight(NOON);
  for (let i = 0; i < 9; i++) leaf(g, 1110, -20, Math.PI * (0.55 + i * 0.07), rd(R, 240, 360), rd(R, 60, 80), mix(hex('#3f7a3a'), hex('#7fae4a'), R()), { lw: 3 });
  for (let i = 0; i < 4; i++) {
    g.save(); g.translate(120, 940); g.rotate(i * TAU / 4 + 0.4);
    const p = blob([[0, 0], [70, -64], [140, -34], [146, 36], [70, 64]]);
    cel(g, p, i % 2 ? hex('#e2533c') : hex('#d6432f'), { sd: 20, hd: 10 }); g.restore();
  }
  g.fillStyle = css([40, 26, 30]); g.fill(ellipse(120, 940, 30, 30));
  g.strokeStyle = css(G3); g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(120, 980); g.quadraticCurveTo(90, 1040, 110, 1100); g.stroke();
}

/** The washing: a sheet, a tea towel and two socks, stirring on the line. */
function washing(ctx, s) {
  const lineY = (x) => 96 + 34 * Math.sin(Math.PI * (x - 82) / 1100) + 0;
  const cord = new Path2D(); cord.moveTo(82, 96);
  for (let x = 82; x <= 1100; x += 60) cord.lineTo(x, lineY(x));
  ink(ctx, cord, 2, [90, 80, 80], 0.9);
  const hang = (x0, w, h, c, ph, stripes) => {
    const sw = (u) => (8 * Math.sin(TAU * (s / 5 + ph) + u * 2.2) + 4 * drift(s, 7.5, ph)) * u;
    const p = new Path2D();
    p.moveTo(x0, lineY(x0)); p.lineTo(x0 + w, lineY(x0 + w));
    p.bezierCurveTo(x0 + w + sw(0.4), lineY(x0 + w) + h * 0.4, x0 + w + sw(0.8), lineY(x0 + w) + h * 0.7, x0 + w + sw(1), lineY(x0 + w) + h);
    p.quadraticCurveTo(x0 + w / 2 + sw(1), lineY(x0) + h + 10 + 4 * Math.sin(TAU * s / 5 + ph), x0 + sw(1), lineY(x0) + h);
    p.bezierCurveTo(x0 + sw(0.8), lineY(x0) + h * 0.7, x0 + sw(0.4), lineY(x0) + h * 0.4, x0, lineY(x0));
    cel(ctx, p, c, { sd: 16, hd: 0 });
    if (stripes) {
      ctx.save(); ctx.clip(p); ctx.fillStyle = css(stripes);
      for (let y = 40; y < h; y += 38) ctx.fillRect(x0 - 30, lineY(x0) + y, w + 60, 11);
      ctx.restore();
    }
    ink(ctx, p, 2.2);
    for (const px of [x0 + 8, x0 + w - 8]) { const peg = rect(px - 4, lineY(px) - 9, 8, 22); ctx.fillStyle = css(hex('#c9a06a')); ctx.fill(peg); ink(ctx, peg, 1.5); }
  };
  hang(150, 300, 250, hex('#f6f2ea'), 0);
  hang(500, 120, 150, hex('#f1e2c2'), 0.3, hex('#7fa0b8'));
  for (const [x, ph, c] of [[670, 0.55, '#d98a6a'], [730, 0.7, '#d98a6a']]) {
    const a = 0.1 * Math.sin(TAU * (s / 4 + ph));
    ctx.save(); ctx.translate(x, lineY(x)); ctx.rotate(a);
    const sock = P('M-13 0 L13 0 L13 62 C13 84 40 78 42 92 C42 104 4 106 -13 96 Z');
    cel(ctx, sock, hex(c), { sd: 7, hd: 0 }); ink(ctx, sock, 2);
    ctx.fillStyle = css(hex('#f1e2c2')); ctx.fillRect(-13, 0, 26, 14); ink(ctx, rect(-13, 0, 26, 14), 1.5);
    ctx.restore();
  }
}

/** The bee's round: it visits three flowers and swings wide between them. */
function beeAt(s) {
  const u = TAU * s / 15;
  return [690 + 190 * Math.sin(u + 0.4) + 50 * Math.sin(3 * u), 640 + 110 * Math.sin(2 * u + 1.2) + 26 * Math.sin(5 * u)];
}
function bee(ctx, x, y, s, dir) {
  ctx.save();
  ctx.translate(x, y + Math.sin(s * 11) * 3);
  ctx.scale(dir * 1.5, 1.5);
  ctx.fillStyle = css([255, 255, 255], 0.55);
  ctx.fill(ellipse(-3, -11, 9, 5 + 3 * Math.abs(Math.sin(s * 60)), -0.5));
  ctx.fill(ellipse(5, -11, 8, 5 + 3 * Math.abs(Math.cos(s * 60)), 0.4));
  const body = ellipse(0, 0, 12, 8.5);
  ctx.fillStyle = css(hex('#f2c230')); ctx.fill(body);
  ctx.save(); ctx.clip(body); ctx.fillStyle = css([40, 28, 26]);
  ctx.fillRect(-5, -10, 5, 20); ctx.fillRect(4, -10, 5, 20); ctx.fillRect(10, -10, 4, 20);
  ctx.restore();
  ink(ctx, body, 1.5);
  ctx.restore();
}

export const garden = {
  id: 'garden',
  draw(ctx, s) {
    setLight(NOON);
    ctx.drawImage(held('garden:yard', yard), 0, 0);
    washing(ctx, s);
    const [bx, by] = beeAt(s);
    const [bx2] = beeAt(s + 0.1);
    // the cat, facing the flowers at her right; her head follows the bee
    const cx = 470, cy = 880, k = 0.82;
    const hx = cx - 4 * k, hy = cy - 330 * k;
    const dx = bx - hx, dy = by - hy;
    const near = clamp(1 - Math.hypot(dx, dy) / 200); // the bee is in reach
    const lift = gesture(s, 6.3, 8.6, 0.4);
    shadow(ctx, ellipse(cx + 20, cy - 4, 170, 26), [70, 110, 90], 0.5, 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    sit(ctx, COATS.black, {
      flip: true, breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75),
      yaw: -clamp(dx / 420, -0.55, 0.55), tilt: clamp(dy / 1500, -0.2, 0.1) + 0.03 * drift(s, 7),
      look: [clamp(-dx / 50, -8, 8), clamp(dy / 60, -8, 5)], pupil: 0.25 + near * 0.5,
      blink: blink(s, [3.1, 11.8], 0.3), paw: lift * (0.8 + 0.2 * Math.sin(TAU * s * 1.6)),
      tail: 0.7 * Math.sin(TAU * s / 3.2) + 0.3 * drift(s, 5),
      earL: 0.2 * gesture(s, 9.6, 10.2, 0.15), earR: -0.18 * gesture(s, 2.0, 2.6, 0.15),
    });
    ctx.restore();
    ctx.drawImage(held('garden:front', front), 0, 0);
    bee(ctx, bx, by, s, bx2 > bx ? 1 : -1);
    // dandelion seeds on the air
    motes(ctx, 61, 26, [0, 120, 1080, 760], s * 1.6, { c: [255, 255, 250], a: 0.9, r: 2.6 });
    ctx.drawImage(soft('garden:near', 9, near_), 0, 0);
    glow(ctx, 1000, 0, 700, [255, 250, 210], 0.3);
    grade(ctx, 'garden', { x: 900, y: 80, r: 1150, warm: [255, 238, 170], wa: 0.4, cool: [70, 110, 130], ca: 0.22 });
  },
};
const near_ = near;
