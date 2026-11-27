// Scene 4 · quilt — early afternoon. The grey-and-white tabby kneads a
// patchwork quilt on the bed, eyes shut, paws pressing in turn; a sheer
// curtain breathes at the window behind; a basket of folded laundry. Bars 13–16.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, leaf, sunPatch, motes, drift, gesture, smooth, span, clamp, lerp,
  shadeOf, lightOf, INK, rd, mul32,
} from './kit.js';
import { COATS, knead } from './cats.js';

const AFTER = { x: 0.7, y: -0.7, warm: [255, 232, 186], cool: [96, 80, 126], k: 1 };
const WALL = hex('#c9d3b8');

const FABRICS = [
  ['#e8b9a0', 'dots'], ['#9fb7c9', 'plain'], ['#f2dfb0', 'stripes'], ['#c98f7a', 'flowers'], ['#b9c7a0', 'plain'],
  ['#f0e8d8', 'dots'], ['#d9a86a', 'plain'], ['#a9b3d6', 'flowers'], ['#e7c7c9', 'stripes'], ['#c4d4c4', 'dots'],
];

// the quilt top, in perspective: rows recede toward the headboard
const QY0 = 470, QY1 = 1080;
const rowY = (v) => QY0 + (QY1 - QY0) * Math.pow(v, 1.35);
const colX = (u, v) => 540 + (u - 0.5) * lerp(900, 1500, v);

function roomLayer(g, R) {
  setLight(AFTER);
  // the wall
  g.fillStyle = vgrad(g, 0, QY0, [[0, shadeOf(WALL, 0.3)], [1, WALL]]);
  g.fillRect(0, 0, SIZE, QY0 + 10);
  // a window at the back right, bright, with soft trees beyond
  const win = rect(640, 40, 360, 340);
  g.save(); g.clip(win);
  g.drawImage(soft('quilt:out', 6, (h, Rr) => {
    h.fillStyle = vgrad(h, 40, 380, [[0, hex('#cfe3ec')], [1, hex('#f7f0da')]]);
    h.fillRect(600, 0, 480, 420);
    for (let i = 0; i < 60; i++) { h.fillStyle = css(mix(hex('#86ad5a'), hex('#d8e6a0'), Rr())); h.fill(ellipse(rd(Rr, 640, 1000), rd(Rr, 160, 380), rd(Rr, 20, 60), rd(Rr, 16, 40))); }
  }), 0, 0);
  g.restore();
  for (const r of [rect(620, 26, 400, 20), rect(620, 374, 400, 22), rect(620, 26, 22, 370), rect(998, 26, 22, 370), rect(810, 40, 14, 340)]) { cel(g, r, hex('#f2ece0'), { sd: 4, hd: 3 }); ink(g, r, 2.2); }
  // a small framed landscape painting on the wall, left
  const fr = rect(110, 70, 230, 170);
  cel(g, fr, hex('#8a5a3a'), { sd: 6, hd: 4 }); ink(g, fr, 2.4);
  const art = rect(128, 88, 194, 134);
  g.fillStyle = vgrad(g, 88, 222, [[0, hex('#f3c98a')], [0.6, hex('#e7a46a')], [1, hex('#8a9a6a')]]);
  g.fill(art);
  g.fillStyle = css(hex('#6a7f5a')); g.fill(poly([[128, 222], [128, 170], [190, 140], [250, 175], [322, 150], [322, 222]]));
  g.fillStyle = css(hex('#fff1c8')); g.fill(ellipse(270, 128, 16, 16));
  ink(g, art, 1.6);
  // the headboard
  const hb = rrect(40, 250, 560, 240, [60, 60, 0, 0]);
  cel(g, hb, hex('#b07a4e'), { sd: 16, hd: 10 }); ink(g, hb, 2.6);
  g.save(); g.clip(hb);
  g.strokeStyle = css(hex('#7d4f2e'), 0.5); g.lineWidth = 2;
  for (let x = 100; x < 600; x += 70) { g.beginPath(); g.moveTo(x, 260); g.lineTo(x, 500); g.stroke(); }
  g.restore();
  // pillows
  for (const [x, y, c] of [[190, 450, '#f4efe4'], [420, 455, '#e9d7c8']]) {
    const p = blob([[x - 130, y + 20], [x - 120, y - 50], [x, y - 66], [x + 120, y - 52], [x + 130, y + 20], [x, y + 36]]);
    cel(g, p, hex(c), { sd: 22, hd: 10 }); ink(g, p, 2.4);
    const crease = new Path2D(); crease.moveTo(x - 60, y - 20); crease.quadraticCurveTo(x, y - 6, x + 50, y - 26);
    ink(g, crease, 1.6, shadeOf(hex(c), 1.4), 0.7);
  }
  // the quilt: patches in perspective, each with its fabric and a stitched edge
  const rows = 9, cols = 9;
  let fi = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = -1; i <= cols; i++) {
      const v0 = j / rows, v1 = (j + 1) / rows, u0 = i / cols, u1 = (i + 1) / cols;
      const pts = [[colX(u0, v0), rowY(v0)], [colX(u1, v0), rowY(v0)], [colX(u1, v1), rowY(v1)], [colX(u0, v1), rowY(v1)]];
      const [c, kind] = FABRICS[(fi++ * 7 + j * 3) % FABRICS.length];
      const base = hex(c);
      const p = poly(pts);
      g.fillStyle = css(base);
      g.fill(p);
      g.save(); g.clip(p);
      const w = pts[1][0] - pts[0][0], h = pts[3][1] - pts[0][1];
      const cx = (pts[0][0] + pts[2][0]) / 2, cy = (pts[0][1] + pts[2][1]) / 2;
      if (kind === 'dots') { g.fillStyle = css(lightOf(base, 1.4)); for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) g.fill(ellipse(pts[3][0] + (a + 0.5) * w / 5 + b * 4, pts[0][1] + (b + 0.5) * h / 4, w * 0.03, h * 0.04)); }
      if (kind === 'stripes') { g.strokeStyle = css(shadeOf(base, 0.5), 0.7); g.lineWidth = Math.max(2, w * 0.03); for (let a = 0; a < 6; a++) { const x = pts[3][0] + (a + 0.5) * w / 6; g.beginPath(); g.moveTo(x, pts[0][1] - 5); g.lineTo(x + (cx - 540) * 0.05, pts[3][1] + 5); g.stroke(); } }
      if (kind === 'flowers') { for (let a = 0; a < 3; a++) { const fx = cx + rd(R, -w / 3, w / 3), fy = cy + rd(R, -h / 3, h / 3); g.fillStyle = css(lightOf(base, 1.2)); for (let k = 0; k < 5; k++) g.fill(ellipse(fx + Math.cos(k * 1.26) * w * 0.03, fy + Math.sin(k * 1.26) * h * 0.04, w * 0.025, h * 0.03)); g.fillStyle = css(hex('#e9c25a')); g.fill(ellipse(fx, fy, w * 0.015, h * 0.02)); } }
      g.restore();
      // stitches just inside the seam
      g.save();
      g.setLineDash([6, 6]);
      g.strokeStyle = css(shadeOf(base, 1.2), 0.6); g.lineWidth = 1.4;
      const ins = pts.map(([x, y]) => [lerp(x, cx, 0.08), lerp(y, cy, 0.08)]);
      g.stroke(poly(ins));
      g.restore();
      ink(g, p, 1.8, INK, 0.65);
    }
  }
  // the quilt's soft hills: shading that gives the bed its folds
  g.save();
  g.globalCompositeOperation = 'multiply';
  for (const [x, y, rx, ry, a] of [[200, 640, 260, 80, 0.2], [860, 760, 300, 110, -0.25], [540, 1000, 520, 90, 0]]) {
    const gr = g.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, 'rgba(150,120,160,0.35)'); gr.addColorStop(1, 'rgba(150,120,160,0)');
    g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore();
  }
  g.restore();
  // the sun from the window across the quilt
  sunPatch(g, R, [[640, 470], [1080, 470], [1080, 1080], [520, 1080]], { a: 0.5, blur: 18, bars: [[[790, 470], [830, 470], [860, 1080], [800, 1080]]] });

  // the laundry basket at the right, with folded towels
  const bx = 930, by = 760;
  g.fillStyle = css([80, 50, 60], 0.3); g.fill(ellipse(bx, by + 140, 190, 30));
  for (const [y, c] of [[-20, '#f2e9dc'], [-50, '#b9cbe0'], [-80, '#efc9b9']]) {
    const t = rrect(bx - 150, by + y - 10, 300, 40, 14);
    cel(g, t, hex(c), { sd: 10, hd: 6 }); ink(g, t, 2.2);
  }
  const basket = P(`M${bx - 180} ${by} L${bx + 180} ${by} L${bx + 150} ${by + 150} L${bx - 150} ${by + 150} Z`);
  cel(g, basket, hex('#d4b07a'), { sd: 26, hd: 10 });
  g.save(); g.clip(basket);
  g.strokeStyle = css(hex('#9a7440'), 0.6); g.lineWidth = 3;
  for (let y = by + 6; y < by + 150; y += 14) { g.beginPath(); g.moveTo(bx - 200, y); g.lineTo(bx + 200, y); g.stroke(); }
  for (let x = bx - 200; x < bx + 200; x += 18) { g.beginPath(); g.moveTo(x, by); g.lineTo(x + (x - bx) * -0.1, by + 150); g.stroke(); }
  g.restore();
  ink(g, basket, 2.6);
  const rim = rrect(bx - 190, by - 8, 380, 22, 10);
  cel(g, rim, hex('#c49a5e'), { sd: 6, hd: 5 }); ink(g, rim, 2.4);
}

/** The sheer curtain at the window: two panels that breathe in the air. */
function curtain(ctx, s) {
  for (const [x0, w, ph] of [[640, 120, 0], [880, 130, 0.4]]) {
    const sw = 14 * Math.sin(TAU * (s / 5 + ph)) + 6 * drift(s, 7, ph);
    const p = new Path2D();
    p.moveTo(x0, 30);
    p.lineTo(x0 + w, 30);
    p.bezierCurveTo(x0 + w + sw * 0.4, 160, x0 + w + sw, 280, x0 + w + sw * 1.4, 420);
    for (let k = 4; k >= 0; k--) { const xx = x0 + (k / 4) * w + sw * 1.4; p.quadraticCurveTo(xx + w / 8, 432, xx, 420); }
    p.bezierCurveTo(x0 + sw, 280, x0 + sw * 0.4, 160, x0, 30);
    ctx.save();
    ctx.fillStyle = css([255, 252, 244], 0.55);
    ctx.fill(p);
    ctx.clip(p);
    ctx.strokeStyle = css([226, 220, 214], 0.6); ctx.lineWidth = 6;
    for (let k = 1; k < 5; k++) { const xx = x0 + (k / 5) * w; ctx.beginPath(); ctx.moveTo(xx, 30); ctx.quadraticCurveTo(xx + sw * 0.6, 220, xx + sw * 1.4, 430); ctx.stroke(); }
    ctx.restore();
    ink(ctx, p, 1.6, INK, 0.5);
  }
  const rod = rect(620, 22, 400, 8);
  ctx.fillStyle = css(hex('#8a6a4a')); ctx.fill(rod);
}

export const quilt = {
  id: 'quilt',
  draw(ctx, s) {
    setLight(AFTER);
    ctx.drawImage(held('quilt:room', roomLayer), 0, 0);
    curtain(ctx, s);
    // kneading: one push per beat (64 BPM), the paws in turn
    const k = s * (64 / 60) / 2;
    const cx = 470, cy = 860, sc = 1.12;
    // dimples in the quilt where the paws press
    for (const [x, ph] of [[-46, 0], [46, 0.5]]) {
      const press = 1 - Math.max(0, Math.sin(TAU * (k + ph)));
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = css([150, 110, 130], 0.35 * press);
      ctx.fill(ellipse(cx + x * sc, cy + 6, 48 * sc, 14 * sc));
      ctx.restore();
    }
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = css([150, 110, 130], 0.45);
    ctx.fill(ellipse(cx - 40, cy + 4, 190 * sc, 34));
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    knead(ctx, COATS.grey, {
      k, breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75),
      yaw: 0.08 * drift(s, 6.5), tilt: 0.06 * Math.sin(TAU * s / 7.5),
      earL: 0.18 * gesture(s, 7.4, 8, 0.15), earR: -0.15 * gesture(s, 3.1, 3.6, 0.12),
    });
    ctx.restore();
    motes(ctx, 44, 40, [560, 60, 520, 700], s, { a: 0.7 });
    grade(ctx, 'quilt', { x: 900, y: 160, r: 1050, warm: [255, 214, 150], wa: 0.45 });
  },
};
