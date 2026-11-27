// Scene 1 · sill — morning. The black cat sits on a wide wooden sill in the
// first sun, beside a glass of tea and a pot plant. A bird crosses the sky and
// the cat's head follows it; a slow blink; the tea steams. Bars 1–4.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, shape, tube, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, vine, lavender, leaf, sunPatch, steam, motes, drift, gesture, blink, span, smooth,
  shadeOf, lightOf, INK, rd, mul32, shadow, lit,
} from './kit.js';
import { COATS, sit } from './cats.js';

const MORNING = { x: -0.62, y: -0.78, warm: [255, 228, 172], cool: [86, 70, 112], k: 1 };
const WOOD = hex('#c98a4e'), WOOD_D = hex('#8f5530'), WALL = hex('#efe1c6');
const SILL_Y = 742, SILL_F = 846; // the back and the front edge of the sill top

// ------------------------------------------------------------ outside (soft)

function outside(g, R) {
  g.fillStyle = vgrad(g, 40, 700, [[0, hex('#9fc0d8')], [0.55, hex('#d9e2d6')], [1, hex('#f6dcaa')]]);
  g.fillRect(0, 0, SIZE, SIZE);
  // a few morning clouds
  for (let i = 0; i < 7; i++) {
    const x = rd(R, 120, 1000), y = rd(R, 90, 300), w = rd(R, 90, 200);
    g.fillStyle = css([255, 246, 230], 0.75);
    for (let k = 0; k < 5; k++) g.fill(ellipse(x + (k - 2) * w * 0.22, y + Math.abs(k - 2) * 5, w * 0.24, w * 0.12));
  }
  // far rooftops, cool and pale
  const far = [];
  let x = 100;
  while (x < 1020) { const w = rd(R, 60, 130), h = rd(R, 120, 260); far.push([x, w, h]); x += w + rd(R, -10, 6); }
  for (const [bx, w, h] of far) {
    const top = 700 - h;
    g.fillStyle = css(mix(hex('#aab6c8'), hex('#e8d4b4'), 0.25));
    g.fillRect(bx, top, w, h);
    g.fillStyle = css(hex('#c8cbd2'));
    g.fillRect(bx, top, w * 0.35, h);
    if (R() < 0.6) { g.fillStyle = css(hex('#9aa3b6')); g.fillRect(bx + w * 0.6, top - 30, 16, 32); }
    for (let wy = top + 20; wy < 690; wy += 34) for (let wx = bx + 12; wx < bx + w - 16; wx += 26) {
      g.fillStyle = css(R() < 0.2 ? hex('#ffe3a6') : hex('#8f9ab0'), 0.9);
      g.fillRect(wx, wy, 12, 18);
    }
  }
  // nearer roofs, warmer, lit from the left
  let nx = 80;
  while (nx < 1040) {
    const w = rd(R, 150, 240), h = rd(R, 60, 120), top = 700 - h;
    g.fillStyle = css(hex('#b07a5e'));
    g.fill(poly([[nx, 700], [nx, top], [nx + w * 0.5, top - 60], [nx + w, top], [nx + w, 700]]));
    g.fillStyle = css(hex('#d79b76'));
    g.fill(poly([[nx, top], [nx + w * 0.5, top - 60], [nx + w * 0.5, 700], [nx, 700]]));
    nx += w + rd(R, 10, 40);
  }
  // a tree outside, top right, in the light
  for (let i = 0; i < 140; i++) {
    const a = rd(R, 0, TAU), r = Math.sqrt(R());
    const lx = 900 + Math.cos(a) * 220 * r, ly = 130 + Math.sin(a) * 150 * r;
    g.fillStyle = css(mix(hex('#6d9a4c'), hex('#c9d98a'), R() * 0.7), 0.95);
    g.save(); g.translate(lx, ly); g.rotate(rd(R, 0, TAU)); g.fill(ellipse(0, 0, 22, 11)); g.restore();
  }
  // morning haze
  g.fillStyle = vgrad(g, 300, 700, [[0, [255, 236, 200], 0], [1, [255, 232, 190], 0.45]]);
  g.fillRect(0, 300, SIZE, 400);
}

// ------------------------------------------------------------ the room (held)

function room(g, R) {
  setLight(MORNING);
  g.drawImage(soft('sill:outside', 3, outside), 0, 0);
  // the wall around the window
  const wallP = new Path2D();
  wallP.rect(0, 0, SIZE, SIZE);
  wallP.rect(150, 70, 820, 680);
  g.fillStyle = vgrad(g, 0, SIZE, [[0, WALL], [1, shadeOf(WALL, 0.3)]]);
  g.fill(wallP, 'evenodd');
  // the window reveal: the depth of the wall, lit on the right, shaded on top
  g.fillStyle = css(lightOf(WALL, 0.6));
  g.fill(poly([[970, 70], [1000, 40], [1000, SILL_Y], [970, SILL_Y]]));
  g.fillStyle = css(shadeOf(WALL, 0.5));
  g.fill(poly([[150, 70], [120, 40], [120, SILL_Y], [150, SILL_Y]]));
  g.fillStyle = css(shadeOf(WALL, 0.7));
  g.fill(poly([[120, 40], [1000, 40], [970, 70], [150, 70]]));
  // frames: outer frame, a centre mullion and a transom
  const F = WOOD;
  const frame = (x, y, w, h) => {
    const p = rect(x, y, w, h);
    cel(g, p, F, { sd: 6, hd: 4 });
    ink(g, p, 2.2);
    // wood grain
    g.save(); g.clip(p);
    g.strokeStyle = css(WOOD_D, 0.35); g.lineWidth = 1.2;
    for (let k = 0; k < (w > h ? h : w) / 6; k++) {
      g.beginPath();
      if (w > h) { const yy = y + 3 + k * 6 + rd(R, -1, 1); g.moveTo(x, yy); g.bezierCurveTo(x + w * 0.3, yy + rd(R, -3, 3), x + w * 0.7, yy + rd(R, -3, 3), x + w, yy); }
      else { const xx = x + 3 + k * 6 + rd(R, -1, 1); g.moveTo(xx, y); g.bezierCurveTo(xx + rd(R, -3, 3), y + h * 0.3, xx + rd(R, -3, 3), y + h * 0.7, xx, y + h); }
      g.stroke();
    }
    g.restore();
  };
  frame(150, 70, 820, 30);
  frame(150, 70, 30, 680);
  frame(940, 70, 30, 680);
  frame(546, 70, 28, 680);
  frame(150, 330, 820, 24);
  // glass: a faint reflection band across each pane
  g.save();
  g.globalCompositeOperation = 'screen';
  for (const [x0, y0, x1, y1] of [[180, 100, 546, 330], [574, 100, 940, 330], [180, 354, 546, 742], [574, 354, 940, 742]]) {
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.fillStyle = lgrad(g, x0, y0, x1, y1, [[0, [255, 255, 255], 0], [0.42, [255, 255, 255], 0], [0.5, [255, 250, 235], 0.22], [0.62, [255, 255, 255], 0]]);
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.restore();
  }
  g.restore();
  // the sill: a deep plank, its top in perspective, its front edge in shade
  const top = poly([[100, SILL_Y], [1000, SILL_Y], [1080, SILL_F], [0, SILL_F]]);
  g.fillStyle = lgrad(g, 0, SILL_Y, 0, SILL_F, [[0, mix(WOOD, [255, 236, 200], 0.35)], [1, mix(WOOD, [255, 220, 170], 0.15)]]);
  g.fill(top);
  g.save(); g.clip(top);
  g.strokeStyle = css(WOOD_D, 0.3); g.lineWidth = 1.3;
  for (let k = 0; k < 18; k++) {
    const yy = SILL_Y + 4 + k * 5.5;
    g.beginPath(); g.moveTo(0, yy);
    for (let xx = 0; xx <= SIZE; xx += 60) g.lineTo(xx, yy + Math.sin(xx * 0.01 + k) * 1.6 + rd(R, -0.6, 0.6));
    g.stroke();
  }
  // a knot
  g.strokeStyle = css(WOOD_D, 0.45);
  for (let r = 4; r < 22; r += 5) { g.beginPath(); g.ellipse(250, 800, r * 2.2, r * 0.6, 0, 0, TAU); g.stroke(); }
  g.restore();
  ink(g, top, 2.4);
  const front = poly([[0, SILL_F], [SIZE, SILL_F], [SIZE, SILL_F + 44], [0, SILL_F + 44]]);
  g.fillStyle = css(mix(WOOD, WOOD_D, 0.3));
  g.fill(front);
  g.fillStyle = css(WOOD_D, 0.5);
  g.fillRect(0, SILL_F + 40, SIZE, 5);
  ink(g, front, 2.4);
  // under the sill: the wall in the sill's shadow, then a little lighter
  g.fillStyle = vgrad(g, SILL_F + 45, SIZE, [[0, shadeOf(WALL, 0.75)], [0.35, mix(shadeOf(WALL, 0.3), [240, 190, 140], 0.2)], [1, shadeOf(WALL, 0.25)]]);
  g.fillRect(0, SILL_F + 45, SIZE, SIZE);
  // wainscot boards below
  g.strokeStyle = css(shadeOf(WALL, 1.1), 0.5); g.lineWidth = 2;
  for (let x = 40; x < SIZE; x += 96) { g.beginPath(); g.moveTo(x, SILL_F + 60); g.lineTo(x, SIZE); g.stroke(); }

  // the sun on the sill, cut by the window's frame
  sunPatch(g, R, [[190, SILL_Y], [700, SILL_Y], [640, SILL_F], [40, SILL_F]], { a: 0.55, blur: 3, bars: [[[520, SILL_Y], [560, SILL_Y], [500, SILL_F], [455, SILL_F]]], leaves: 10 });

  // the terracotta pot and its plant
  const potX = 860, potY = 820;
  g.fillStyle = css([60, 30, 30], 0.28);
  g.fill(ellipse(potX + 40, potY + 6, 120, 18));
  const pot = P(`M${potX - 92} ${potY - 150} L${potX + 92} ${potY - 150} L${potX + 70} ${potY} L${potX - 70} ${potY} Z`);
  cel(g, pot, hex('#c56e3e'), { sd: 26, hd: 12 });
  ink(g, pot, 2.6);
  const rim = rrect(potX - 104, potY - 172, 208, 34, 6);
  cel(g, rim, hex('#d27b48'), { sd: 8, hd: 6 });
  ink(g, rim, 2.6);
  bush(g, mul32(5), potX, potY - 210, 175, 140, { n: 120, L: 50, W: 19, lit: 0.45 });
  vine(g, mul32(6), [[potX - 70, potY - 160], [potX - 120, potY - 60], [potX - 150, SILL_F + 10], [potX - 170, SILL_F + 90], [potX - 160, SILL_F + 170]], { every: 28, L: 38, W: 16, lit: 0.2 });
  vine(g, mul32(7), [[potX + 60, potY - 150], [potX + 110, potY - 40], [potX + 120, SILL_F + 40], [potX + 100, SILL_F + 120], [potX + 120, SILL_F + 210]], { every: 30, L: 40, W: 17, lit: 0.2 });

  // the glass of tea
  const mx = 650, my = 808;
  g.fillStyle = css([90, 50, 20], 0.25);
  g.fill(ellipse(mx + 30, my + 4, 64, 10));
  glow(g, mx + 30, my + 2, 70, [255, 170, 60], 0.35, 'soft-light');
  const cup = rrect(mx - 42, my - 108, 84, 110, 12);
  g.save(); g.clip(cup);
  g.fillStyle = css([248, 246, 238], 0.25); g.fillRect(mx - 50, my - 120, 100, 130);
  g.fillStyle = vgrad(g, my - 84, my, [[0, hex('#f2a83c')], [1, hex('#b8561c')]]);
  g.fillRect(mx - 50, my - 84, 100, 90);
  g.fillStyle = css(hex('#ffd27a'), 0.9); g.fill(ellipse(mx, my - 84, 42, 6));
  // a leaf of mint steeping
  leaf(g, mx - 10, my - 40, -0.6, 44, 14, hex('#6b9a3e'), { lw: 1.2 });
  g.fillStyle = css([255, 255, 255], 0.55); g.fillRect(mx - 30, my - 100, 9, 90);
  g.restore();
  ink(g, cup, 2.2);
  const handle = new Path2D();
  handle.moveTo(mx + 42, my - 84); handle.bezierCurveTo(mx + 78, my - 84, mx + 78, my - 30, mx + 42, my - 30);
  ink(g, handle, 9, INK, 0.9); ink(g, handle, 5, [236, 232, 224]);

  // hard shadows across the sill, thrown right by the low sun
  shadow(g, poly([[potX + 70, potY], [1080, potY - 16], [1080, potY - 118], [potX + 91, potY - 146]]), [150, 104, 110], 0.42);
  shadow(g, poly([[mx + 40, my + 2], [mx + 150, my - 22], [mx + 150, my - 44], [mx + 44, my - 30]]), [170, 110, 90], 0.3);
  // tea light: the sun through the glass throws an amber smear on the wood
  lit(g, ellipse(mx + 86, my - 14, 54, 12, -0.2), [255, 170, 60], 0.75, 3);

  // a sheer curtain at the right, pulled back, the sun in its folds
  const cur = P('M1080 20 L930 20 C936 200 914 380 932 560 C944 660 968 720 1010 762 L1080 780 Z');
  g.save();
  g.globalAlpha = 0.9;
  cel(g, cur, hex('#f6efe2'), { sd: 0, hd: 0 });
  g.restore();
  g.save(); g.clip(cur);
  for (let i = 0; i < 7; i++) {
    const x = 940 + i * 22;
    g.fillStyle = css(i % 2 ? [226, 208, 196] : [255, 248, 232], 0.5);
    g.fill(poly([[x, 20], [x + 12, 20], [x + 16 + i * 5, 780], [x + 2 + i * 5, 780]]));
  }
  g.restore();
  ink(g, cur, 2.2, INK, 0.75);

  // window light falling on the wall at the right
  g.save();
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = css([255, 210, 140], 0.5);
  g.fill(poly([[1000, 40], [1080, 0], [1080, 760], [1000, SILL_Y]]));
  g.restore();
}

// ------------------------------------------------------------ near (held)

function near(g, R) {
  setLight(MORNING);
  // a jar of lavender at the front left, crisp
  const jx = 150, jy = 900;
  g.fillStyle = css([40, 20, 30], 0.3); g.fill(ellipse(jx + 30, SILL_F - 4, 70, 10));
  for (let i = 0; i < 9; i++) lavender(g, R, jx + rd(R, -16, 16), SILL_F - 70, rd(R, 200, 300), rd(R, -0.35, 0.35));
  const jar = rrect(jx - 46, SILL_F - 110, 92, 112, 18);
  g.fillStyle = css([210, 230, 235], 0.35); g.fill(jar);
  g.save(); g.clip(jar);
  g.fillStyle = css([255, 255, 255], 0.6); g.fillRect(jx - 32, SILL_F - 100, 8, 90);
  g.restore();
  ink(g, jar, 2.2);
  const lip = rrect(jx - 50, SILL_F - 118, 100, 14, 6);
  g.fillStyle = css([226, 236, 238]); g.fill(lip); ink(g, lip, 2);
}

// ------------------------------------------------------------ the scene

export const sill = {
  id: 'sill',
  draw(ctx, s) {
    setLight(MORNING);
    ctx.drawImage(held('sill:room', room), 0, 0);

    // a bird crosses the sky, right to left, from 2.5 s to 6.5 s
    const bt = span(s, 2.4, 6.8);
    if (bt > 0 && bt < 1) {
      const bx = 900 - bt * 760, by = 210 - Math.sin(bt * Math.PI) * 70 + Math.sin(s * 9) * 4;
      const flap = Math.sin(s * 20);
      ctx.save();
      ctx.translate(bx, by);
      ctx.fillStyle = css([70, 64, 80], 0.8);
      ctx.beginPath();
      ctx.moveTo(-14, -flap * 9); ctx.quadraticCurveTo(-6, -2, 0, 2); ctx.quadraticCurveTo(6, -2, 14, -flap * 9);
      ctx.quadraticCurveTo(6, 3, 0, 6); ctx.quadraticCurveTo(-6, 3, -14, -flap * 9);
      ctx.fill();
      ctx.restore();
    }

    // the cat: watching the bird, then back to the room
    const follow = gesture(s, 2.2, 8.2, 1.4);
    const look = smooth(span(s, 2.2, 7)) * follow;
    const yaw = 0.28 - follow * 0.62 + 0.06 * drift(s, 9.3);
    const tilt = -0.05 - follow * 0.05 + gesture(s, 10, 13.5, 0.9) * 0.1;
    const b = 0.5 + 0.5 * Math.sin(TAU * s / 3.75);
    const bl = blink(s, [1.1, 9.3, 12.8], 0.36) + gesture(s, 12.6, 13.9, 0.35) * 0.55; // the last is a slow, half-lidded blink
    // the cat's cast shadow, falling right from the morning sun
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = css([150, 110, 120], 0.55);
    ctx.fill(ellipse(480, 796, 150, 22));
    ctx.restore();
    ctx.save();
    ctx.translate(390, 804);
    ctx.scale(0.66, 0.66);
    sit(ctx, COATS.black, {
      breath: b, yaw, tilt, blink: Math.min(1, bl), look: [-follow * 8 + look * -2, -follow * 6], pupil: 0.18,
      earL: gesture(s, 6.6, 7.4, 0.15) * 0.35, earR: gesture(s, 4.2, 4.8, 0.15) * -0.2, tail: drift(s, 7.5),
    });
    ctx.restore();

    // steam off the tea
    steam(ctx, 650, 694, s, { h: 150, w: 16, a: 0.55 });

    ctx.drawImage(held('sill:near', near), 0, 0);

    // a trailing vine at the top left, swaying a little
    vine(ctx, mul32(12), [[-20, -10], [60, 60], [100, 150], [110, 240], [96, 330], [70, 400]], { s, sway: 0.07, every: 30, L: 40, W: 17 });

    // light: a soft beam from the left, the morning haze
    motes(ctx, 4, 40, [180, 360, 560, 400], s, { a: 0.7 });
    glow(ctx, 260, 360, 520, [255, 230, 180], 0.22);
    grade(ctx, 'sill', { x: 200, y: 260, r: 1000, warm: [255, 196, 120], wa: 0.5 });
  },
};
