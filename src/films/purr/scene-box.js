// Scene 6 · box — golden hour. Sunny sits in a cardboard box on the floor,
// chin and front paws on its edge, in the long orange light. The window's
// light lies across the wall with a plant's shadow swaying in it. He gives
// the camera two slow blinks. Bars 21–24.
// The box hides his legs; he is still a tripod (see cats.js).

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, leaf, leafPath, sunPatch, motes, drift, gesture, blink, smooth, span,
  shadeOf, lightOf, INK, rd, mul32,
} from './kit.js';
import { COATS, peek } from './cats.js';

const GOLD = { x: 0.88, y: -0.42, warm: [255, 196, 120], cool: [96, 64, 110], k: 1 };
const WALL = hex('#e8c9a4'), FLOOR_Y = 690;
const BX = 520, EDGE = 640, BW = 520, BH = 300; // the box: centre x, front top edge, width, height

function roomLayer(g, R) {
  setLight(GOLD);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, shadeOf(WALL, 0.55)], [1, WALL]]);
  g.fillRect(0, 0, SIZE, FLOOR_Y);
  // wainscot below a dado rail
  const dado = rect(0, 470, SIZE, 16);
  cel(g, dado, hex('#d9b68e'), { sd: 4, hd: 3 }); ink(g, dado, 2);
  g.fillStyle = css(shadeOf(WALL, 0.25)); g.fillRect(0, 486, SIZE, FLOOR_Y - 486);
  g.strokeStyle = css(shadeOf(WALL, 0.9), 0.5); g.lineWidth = 2;
  for (let x = 30; x < SIZE; x += 110) { g.strokeRect(x, 510, 84, FLOOR_Y - 540); }
  // a print on the wall: just colour fields, no words
  const fr = rect(110, 120, 190, 250);
  cel(g, fr, hex('#3e3a3a'), { sd: 4, hd: 3 }); ink(g, fr, 2.2);
  g.fillStyle = css(hex('#f2e8d6')); g.fillRect(124, 134, 162, 222);
  g.fillStyle = css(hex('#d0704a')); g.fill(ellipse(205, 220, 46, 46));
  g.fillStyle = css(hex('#355a6a')); g.fillRect(140, 290, 130, 50);
  // the floor: warm planks, side on
  g.fillStyle = vgrad(g, FLOOR_Y, SIZE, [[0, hex('#9a5f38')], [1, hex('#7d4a2c')]]);
  g.fillRect(0, FLOOR_Y, SIZE, SIZE - FLOOR_Y);
  const bb = rect(0, FLOOR_Y - 24, SIZE, 26);
  cel(g, bb, hex('#f0dcc0'), { sd: 6, hd: 0 }); ink(g, bb, 2);
  g.strokeStyle = css(hex('#5e351e'), 0.5); g.lineWidth = 2;
  let y = FLOOR_Y + 30, st = 30;
  while (y < SIZE) { g.beginPath(); g.moveTo(0, y); g.lineTo(SIZE, y); g.stroke(); y += st; st *= 1.18; }
  for (let i = 0; i < 30; i++) { const yy = FLOOR_Y + rd(R, 10, 390); g.beginPath(); g.moveTo(rd(R, 0, SIZE), yy); g.lineTo(rd(R, 0, SIZE), yy); g.stroke(); }
  // the long light across the wall: two window panes, slanted
  sunPatch(g, R, [[560, 60], [1080, 20], [1080, 600], [640, 640]], { a: 0.85, c: [255, 170, 90], blur: 6, bars: [[[800, 40], [828, 38], [858, 610], [830, 614]], [[560, 330], [1080, 300], [1080, 322], [580, 352]]] });
  // and across the floor
  sunPatch(g, R, [[600, FLOOR_Y], [1080, FLOOR_Y], [1080, 1080], [400, 1080]], { a: 0.5, c: [255, 170, 90], blur: 10 });
  // a plant in a pot on the floor at the right
  g.fillStyle = css([60, 25, 20], 0.35); g.fill(ellipse(900, 900, 140, 22));
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + rd(R, -1.1, 1.1), L = rd(R, 130, 250);
    const ex = 900 + Math.cos(a) * L, ey = 760 + Math.sin(a) * L;
    const stem = new Path2D(); stem.moveTo(900, 760); stem.quadraticCurveTo(900 + Math.cos(a) * L * 0.3, 760 + Math.sin(a) * L * 0.8, ex, ey);
    ink(g, stem, 3.6, INK, 0.8); ink(g, stem, 2, hex('#5f7f3a'));
    leaf(g, ex, ey, a + rd(R, -0.4, 0.4), rd(R, 90, 130), rd(R, 30, 42), mix(hex('#4a7a3a'), hex('#8ab04a'), R()), { lit: R() < 0.6 ? 0.9 : 0, lw: 2 });
  }
  const pot = P('M820 760 L980 760 L960 900 L840 900 Z');
  cel(g, pot, hex('#2f5a5a'), { sd: 24, hd: 10, hi: hex('#5a8a80') }); ink(g, pot, 2.6);
  // a ball of yarn on the floor at the left, its loose end trailing
  const yx = 170, yy = 900;
  g.fillStyle = css([60, 25, 20], 0.35); g.fill(ellipse(yx + 30, yy + 52, 90, 16));
  const ball = ellipse(yx, yy, 62, 58);
  cel(g, ball, hex('#d2584a'), { sd: 18, hd: 10 });
  g.save(); g.clip(ball);
  g.strokeStyle = css(hex('#9a3a32'), 0.7); g.lineWidth = 3;
  for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(yx, yy, 62, 20 + k * 5, 0.5 + k * 0.32, 0, TAU); g.stroke(); }
  g.restore();
  ink(g, ball, 2.4);
  const end = new Path2D(); end.moveTo(yx + 50, yy + 30); end.bezierCurveTo(yx + 120, yy + 80, yx + 180, yy + 40, yx + 260, yy + 90);
  ink(g, end, 5, INK, 0.8); ink(g, end, 3, hex('#d2584a'));

  // the box: its far walls and inside, behind the cat
  const L = BX - BW / 2, Rr = BX + BW / 2, back = EDGE - 90;
  g.fillStyle = css([60, 30, 20], 0.4); g.fill(ellipse(BX + 60, EDGE + BH, BW * 0.62, 30));
  const inside = poly([[L + 50, back], [Rr - 30, back], [Rr, EDGE], [L, EDGE]]);
  g.fillStyle = css(hex('#7a5232')); g.fill(inside); ink(g, inside, 2.4);
  const backWall = poly([[L + 50, back], [Rr - 30, back], [Rr - 30, back - 30], [L + 50, back - 30]]);
  cel(g, backWall, hex('#b98a56'), { sd: 0, hd: 0 }); ink(g, backWall, 2.4);
  // the back flaps, folded open
  for (const f of [[[L + 50, back - 30], [Rr - 30, back - 30], [Rr - 60, back - 120], [L + 80, back - 110]]]) {
    const p = poly(f); cel(g, p, hex('#c99a62'), { sd: 10, hd: 6 }); ink(g, p, 2.4);
  }
}

function boxFront(g, R) {
  setLight(GOLD);
  const L = BX - BW / 2, Rr = BX + BW / 2;
  // side flaps
  const lf = poly([[L, EDGE], [L + 50, EDGE - 90], [L - 40, EDGE - 150], [L - 90, EDGE - 40]]);
  cel(g, lf, hex('#c4935c'), { sd: 12, hd: 4 }); ink(g, lf, 2.4);
  const front = rect(L, EDGE, BW, BH);
  cel(g, front, hex('#c69256'), { sd: 0, hd: 0 });
  // the light catches the right of the box
  g.save(); g.clip(front);
  g.fillStyle = lgrad(g, L, 0, Rr, 0, [[0, [90, 50, 40], 0.25], [0.6, [255, 200, 120], 0], [1, [255, 200, 120], 0.45]]);
  g.fillRect(L, EDGE, BW, BH);
  // corrugation lines and a strip of tape
  g.strokeStyle = css(hex('#9a6a3a'), 0.35); g.lineWidth = 1.5;
  for (let x = L + 12; x < Rr; x += 16) { g.beginPath(); g.moveTo(x, EDGE); g.lineTo(x, EDGE + BH); g.stroke(); }
  g.fillStyle = css(hex('#d9b98a'), 0.85); g.fillRect(BX - 40, EDGE, 80, 70);
  g.restore();
  ink(g, front, 2.6);
  const rf = poly([[Rr, EDGE], [Rr + 110, EDGE - 40], [Rr + 90, EDGE + 40], [Rr, EDGE + 60]]);
  cel(g, rf, hex('#d6a466'), { sd: 6, hd: 8 }); ink(g, rf, 2.4);
}

/** The plant's shadow on the wall, inside the light, swaying a little. */
function plantShadow(g, R) {
  g.fillStyle = 'rgba(120,60,60,1)';
  for (let i = 0; i < 26; i++) {
    const a = -Math.PI / 2 + rd(R, -1.2, 1.2), L = rd(R, 120, 280);
    g.save(); g.translate(760 + Math.cos(a) * L * 1.2, 520 + Math.sin(a) * L * 1.1); g.rotate(a + rd(R, -0.5, 0.5));
    g.fill(leafPath(rd(R, 90, 140), rd(R, 30, 46)));
    g.restore();
    g.strokeStyle = 'rgba(120,60,60,1)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(760, 640); g.lineTo(760 + Math.cos(a) * L * 1.2, 520 + Math.sin(a) * L * 1.1); g.stroke();
  }
}

export const box = {
  id: 'box',
  draw(ctx, s) {
    setLight(GOLD);
    ctx.drawImage(held('box:room', roomLayer), 0, 0);
    // the shadow sways (a breeze at the window), clipped to the lit wall
    const sh = soft('box:shadow', 5, plantShadow);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, SIZE, FLOOR_Y - 24); ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.22;
    ctx.translate(760, 640);
    ctx.rotate(0.025 * Math.sin(TAU * s / 5) + 0.01 * drift(s, 7));
    ctx.translate(-760, -640);
    ctx.drawImage(sh, 0, 0);
    ctx.restore();

    const k = 0.98;
    ctx.save();
    ctx.translate(BX - 10, EDGE - 92 * k);
    ctx.scale(k, k);
    const bl = Math.max(gesture(s, 3.0, 4.6, 0.5), gesture(s, 9.0, 10.8, 0.6)); // two slow blinks
    peek(ctx, COATS.sunny, {
      yaw: 0.12 + 0.1 * drift(s, 8.5) - gesture(s, 5.6, 8.2, 0.7) * 0.25,
      tilt: gesture(s, 5.8, 8.4, 0.7) * 0.16,
      blink: Math.min(1, bl * 0.97 + blink(s, [12.9], 0.3)),
      look: [-2 + gesture(s, 5.6, 8.2, 0.7) * -5, 1], pupil: 0.8,
      earL: gesture(s, 1.2, 1.8, 0.15) * 0.3, earR: gesture(s, 11.2, 11.9, 0.15) * -0.3,
      pawR: gesture(s, 12.0, 12.6, 0.15), pawL: gesture(s, 12.5, 13.1, 0.15),
      mid: (c) => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(held('box:front', boxFront), 0, 0); c.restore(); },
    });
    ctx.restore();
    motes(ctx, 66, 50, [500, 0, 580, 700], s, { a: 0.7, c: [255, 220, 170] });
    glow(ctx, 1080, 260, 600, [255, 170, 90], 0.35);
    grade(ctx, 'box', { x: 1080, y: 250, r: 1200, warm: [255, 168, 90], wa: 0.55, cool: [100, 60, 110], ca: 0.3 });
  },
};
