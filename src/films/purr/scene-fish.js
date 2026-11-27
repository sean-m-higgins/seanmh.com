// Scene 9 · fish — the afternoon clouds over. Sunny lies in a loaf on a pouf
// beside the fish tank, lit teal by it, and his whole head follows the big
// goldfish back and forth. Bubbles rise; the weed sways. Bars 33–36.
// Sunny is a tripod with a bob tail: the loaf tucks his legs and shows the bob.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, grade, setLight, gesture, smooth, span, drift, blink, clamp, shadeOf, lightOf, INK, rd, mul32,
  shadow, lit, planks, woodGrain, books,
} from './kit.js';
import { COATS, loaf } from './cats.js';

const TANK = { x: 0.72, y: -0.5, warm: [196, 244, 232], cool: [44, 46, 86], k: 1.05 };
const WALL = hex('#6f7890'), WOOD = hex('#7a5444');
const G = [440, 250, 1000, 630]; // the glass
const FLOOR_Y = 900;

function room(g, R) {
  setLight(TANK);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, shadeOf(WALL, 0.8)], [0.6, WALL], [1, lightOf(WALL, 0.3, [180, 230, 230])]]);
  g.fillRect(0, 0, SIZE, FLOOR_Y);
  // a shelf of books above the tank, and a window at the left going grey
  const sh = rect(470, 150, 520, 16);
  cel(g, sh, WOOD, { sd: 5, hd: 0 }); ink(g, sh, 2.2);
  books(g, R, 486, 860, 150, { h: 104 });
  const globe = ellipse(930, 104, 44, 44);
  cel(g, globe, hex('#5f8f9a'), { sd: 12, hd: 6 }); ink(g, globe, 2.2);
  g.save(); g.clip(globe); g.fillStyle = css(hex('#a9b97a'));
  g.fill(blob([[900, 80], [924, 70], [940, 96], [922, 118], [904, 104]])); g.fill(blob([[944, 112], [966, 100], [972, 126], [954, 138]]));
  g.restore();
  const win = rect(60, 80, 250, 360);
  g.fillStyle = vgrad(g, 80, 440, [[0, hex('#8a94a8')], [1, hex('#c2c6cc')]]); g.fill(win);
  g.save(); g.clip(win);
  for (let i = 0; i < 14; i++) { g.fillStyle = css(i % 2 ? [150, 156, 172] : [186, 190, 200], 0.8); g.fill(ellipse(rd(R, 40, 330), rd(R, 100, 330), rd(R, 60, 110), rd(R, 24, 44))); }
  g.restore();
  for (const r of [rect(46, 66, 278, 16), rect(46, 438, 278, 18), rect(46, 66, 16, 390), rect(308, 66, 16, 390), rect(178, 80, 12, 360)]) { cel(g, r, hex('#d6d4d8'), { sd: 4, hd: 0 }); ink(g, r, 2.2); }

  // the floor
  planks(g, R, FLOOR_Y, SIZE, { vy: 260, n: 10, base: [112, 86, 92] });
  const bb = rect(0, FLOOR_Y - 26, SIZE, 28);
  cel(g, bb, hex('#aab0c0'), { sd: 5, hd: 0 }); ink(g, bb, 2.2);

  // the sideboard
  shadow(g, ellipse(730, FLOOR_Y + 14, 380, 20), [60, 60, 100], 0.5, 4);
  for (const x of [404, 1030]) { const leg = P(`M${x} 860 L${x + 26} 860 L${x + 20} ${FLOOR_Y + 8} L${x + 6} ${FLOOR_Y + 8} Z`); cel(g, leg, shadeOf(WOOD, 0.5), { sd: 4, hd: 0 }); ink(g, leg, 2.2); }
  const sb = rect(384, 660, 692, 204);
  cel(g, sb, WOOD, { sd: 14, hd: 0 }); woodGrain(g, R, sb, 384, 660, 692, 204, { c: [50, 30, 36], a: 0.26, gap: 8 }); ink(g, sb, 2.6);
  for (const x of [404, 628, 852]) {
    const d = rect(x, 684, 206, 160); ink(g, d, 1.8, shadeOf(WOOD, 2.2), 0.85);
    const kn = ellipse(x + 180, 764, 7, 7); cel(g, kn, hex('#d2ab62'), { sd: 2, hd: 2 }); ink(g, kn, 1.6);
  }
  const top = rrect(370, 640, 720, 24, 4);
  cel(g, top, lightOf(WOOD, 0.25, [200, 240, 230]), { sd: 5, hd: 4 }); ink(g, top, 2.6);

  // the water: teal, deeper toward the bottom; gravel; rocks and an arch
  const glass = rect(G[0], G[1], G[2] - G[0], G[3] - G[1]);
  g.fillStyle = vgrad(g, G[1], G[3], [[0, hex('#7fd0c4')], [0.5, hex('#3f9aa2')], [1, hex('#266a7c')]]);
  g.fill(glass);
  g.save(); g.clip(glass);
  // light falling in from the hood
  for (let i = 0; i < 7; i++) {
    const x = G[0] + 40 + i * 82;
    g.fillStyle = lgrad(g, x, G[1], x - 60, G[3], [[0, [220, 255, 240], 0.3], [1, [220, 255, 240], 0]]);
    g.fill(poly([[x, G[1]], [x + 36, G[1]], [x - 30, G[3]], [x - 110, G[3]]]));
  }
  const gravel = blob([[G[0] - 20, G[3] + 20], [G[0] - 20, 596], [560, 584], [720, 600], [880, 582], [G[2] + 20, 594], [G[2] + 20, G[3] + 20]]);
  g.fillStyle = css(hex('#c9b28a')); g.fill(gravel);
  g.save(); g.clip(gravel);
  for (let i = 0; i < 260; i++) { g.fillStyle = css(mix(hex('#8a7a66'), hex('#efe0c0'), R())); g.fill(ellipse(rd(R, G[0], G[2]), rd(R, 584, G[3]), rd(R, 3, 6), rd(R, 2, 4))); }
  g.restore();
  const arch = P('M800 600 L800 520 C800 470 900 470 900 520 L900 600 L874 600 L874 530 C874 506 826 506 826 530 L826 600 Z');
  cel(g, arch, hex('#8f8a96'), { sd: 8, hd: 4 }); ink(g, arch, 2.2);
  for (const [x, y, rx, ry] of [[520, 594, 46, 26], [574, 600, 30, 18], [950, 598, 36, 22]]) { const rk = ellipse(x, y, rx, ry); cel(g, rk, hex('#6f7480'), { sd: 8, hd: 4 }); ink(g, rk, 2.2); }
  g.restore();
}

/** Weed: long ribbons from the gravel that lean with a slow current. */
function weed(ctx, s) {
  const R = mul32(303);
  ctx.save();
  ctx.beginPath(); ctx.rect(G[0], G[1], G[2] - G[0], G[3] - G[1]); ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const cl = i < 8 ? 480 : 700, x = cl + rd(R, -44, 44) + (i >= 12 ? 260 : 0), h = rd(R, 120, 260), ph = R();
    const sw = 22 * Math.sin(TAU * (s / 7.5 + ph)) + 10 * Math.sin(TAU * (s / 3.75 + ph * 2));
    const c = mix(hex('#3f8a4a'), hex('#8fc46a'), R());
    const p = new Path2D(); p.moveTo(x, 606); p.bezierCurveTo(x - 10, 606 - h * 0.4, x + sw * 0.5, 606 - h * 0.7, x + sw, 606 - h);
    ctx.strokeStyle = css([26, 60, 60]); ctx.lineWidth = 12; ctx.stroke(p);
    ctx.strokeStyle = css(c); ctx.lineWidth = 8.5; ctx.stroke(p);
  }
  ctx.restore();
}

function fishShape(ctx, x, y, k, turn, wag, c, c2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k * turn, k);
  const tailF = blob([[-34, 0], [-66, -24 + wag * 10], [-58, 0], [-66, 24 + wag * 10]], true, 0.8);
  cel(ctx, tailF, c2, { sd: 4, hd: 0 }); ink(ctx, tailF, 1.8);
  const fin = blob([[-6, -18], [10, -38], [22, -20]], true, 0.8);
  cel(ctx, fin, c2, { sd: 3, hd: 0 }); ink(ctx, fin, 1.6);
  const body = blob([[44, 0], [20, -22], [-16, -20], [-40, 0], [-16, 20], [20, 22]]);
  cel(ctx, body, c, { sd: 9, hd: 5 }); ink(ctx, body, 2);
  ctx.fillStyle = 'rgb(250,250,244)'; ctx.fill(ellipse(26, -5, 6, 6));
  ctx.fillStyle = 'rgb(30,20,26)'; ctx.fill(ellipse(27.5, -5, 3.2, 3.2));
  ink(ctx, P('M10 -14 Q4 0 10 14'), 1.4, shadeOf(c, 1.6), 0.8);
  ctx.restore();
}

const goldAt = (s) => {
  const u = TAU * s / 15;
  return [722 + 215 * Math.sin(u), 428 + 44 * Math.sin(2 * u + 1), clamp(Math.cos(u) * 7, -1, 1)];
};

function fishes(ctx, s) {
  ctx.save();
  ctx.beginPath(); ctx.rect(G[0], G[1], G[2] - G[0], G[3] - G[1]); ctx.clip();
  // a school of small blue fish, high up
  for (let i = 0; i < 6; i++) {
    const u = TAU * (s / 15) + 3 + i * 0.22;
    fishShape(ctx, 720 + 190 * Math.sin(u) + (i % 2) * 14, 330 + i * 9 + 10 * Math.sin(2 * u + i), 0.36, clamp(Math.cos(u) * 7, -1, 1) || 1, Math.sin(s * 14 + i), hex('#5f8fe0'), hex('#9fc0f0'));
  }
  // a second goldfish, lower and slower to turn
  const v = TAU * (s / 7.5) + 2;
  fishShape(ctx, 690 + 170 * Math.sin(v), 540 + 16 * Math.sin(v * 2), 0.62, clamp(Math.cos(v) * 7, -1, 1) || 1, Math.sin(s * 9), hex('#f1e2c0'), hex('#f6a04a'));
  const [gx, gy, gt] = goldAt(s);
  fishShape(ctx, gx, gy, 0.95, gt || 1, Math.sin(s * 8), hex('#f08a3a'), hex('#f6b45a'));
  // bubbles from the air stone
  const R = mul32(77);
  for (let i = 0; i < 16; i++) {
    const ph = R(), sp = rd(R, 0.16, 0.26), x0 = 600 + rd(R, -12, 12), r = rd(R, 2.5, 6);
    const u = ((s * sp + ph) % 1 + 1) % 1;
    const y = 596 - u * (596 - G[1] - 40), x = x0 + Math.sin(u * 14 + i) * 8;
    ctx.strokeStyle = css([230, 255, 250], 0.75 * Math.min(1, (1 - u) * 6)); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r * (0.7 + u * 0.5), 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

/** The tank's frame, hood and the glass's reflections, over the water. Held. */
function tankFrame(g) {
  setLight(TANK);
  g.save(); g.globalCompositeOperation = 'screen';
  g.fillStyle = lgrad(g, G[0], G[1], G[2], G[3], [[0, [255, 255, 255], 0], [0.3, [255, 255, 255], 0], [0.36, [230, 255, 250], 0.16], [0.44, [255, 255, 255], 0], [0.7, [255, 255, 255], 0], [0.73, [230, 255, 250], 0.1], [0.78, [255, 255, 255], 0]]);
  g.fillRect(G[0], G[1], G[2] - G[0], G[3] - G[1]);
  g.fillStyle = css([230, 255, 250], 0.55); g.fillRect(G[0], G[1] + 34, G[2] - G[0], 3); // the water line
  g.restore();
  const dark = hex('#2e3040');
  for (const r of [rect(G[0] - 10, G[1], 12, G[3] - G[1] + 10), rect(G[2] - 2, G[1], 12, G[3] - G[1] + 10), rect(G[0] - 10, G[3], G[2] - G[0] + 20, 12)]) { cel(g, r, dark, { sd: 3, hd: 2, hi: hex('#5a6078') }); ink(g, r, 2, [16, 14, 24]); }
  const hood = rrect(G[0] - 18, G[1] - 34, G[2] - G[0] + 36, 42, 8);
  cel(g, hood, dark, { sd: 8, hd: 4, hi: hex('#5a6078') }); ink(g, hood, 2.4, [16, 14, 24]);
  // a tin of fish food beside it
  const tin = rrect(1018, 584, 46, 58, 5);
  cel(g, tin, hex('#d9a441'), { sd: 8, hd: 4 }); ink(g, tin, 2.2);
  const lidT = rrect(1014, 576, 54, 14, 4); cel(g, lidT, hex('#b5483c'), { sd: 3, hd: 2 }); ink(g, lidT, 2);
}

function pouf(g, R) {
  setLight(TANK);
  shadow(g, ellipse(250, 1010, 230, 26), [50, 50, 90], 0.5, 4);
  const body = P('M40 800 C30 880 50 980 110 1010 L390 1010 C450 980 470 880 460 800 Z');
  const c = hex('#c9954a');
  cel(g, body, c, { sd: 34, hd: 12 });
  g.save(); g.clip(body);
  g.strokeStyle = css(shadeOf(c, 1.5), 0.7); g.lineWidth = 5;
  for (let x = 30; x < 480; x += 26) { g.beginPath(); for (let y = 800; y < 1020; y += 22) { g.moveTo(x, y); g.lineTo(x + 10, y + 11); g.lineTo(x + 20, y); } g.stroke(); }
  g.restore(); ink(g, body, 2.6);
  const topE = ellipse(250, 800, 212, 44);
  cel(g, topE, lightOf(c, 0.3, [200, 240, 220]), { sd: 12, hd: 8 }); ink(g, topE, 2.6);
}

export const fish = {
  id: 'fish',
  draw(ctx, s) {
    setLight(TANK);
    ctx.drawImage(held('fish:room', room), 0, 0);
    weed(ctx, s);
    fishes(ctx, s);
    ctx.drawImage(held('fish:frame', tankFrame), 0, 0);
    // the tank lights the room
    glow(ctx, 720, 440, 620, [120, 230, 220], 0.3);
    ctx.drawImage(held('fish:pouf', pouf), 0, 0);
    // Sunny, facing the tank; his head goes where the goldfish goes
    const [gx, gy] = goldAt(s);
    const hx = 250 + 92 * 0.86, hy = 800 - 212 * 0.86;
    const dx = gx - hx, dy = gy - hy;
    ctx.save();
    ctx.translate(250, 800);
    ctx.scale(0.86, 0.86);
    loaf(ctx, COATS.sunny, {
      flip: true, breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75), tail: 0.6 * Math.sin(TAU * s / 2.2),
      yaw: -0.5 + clamp((dx - 480) / 900, -0.35, 0.2), tilt: clamp(dy / 900, -0.12, 0.16) + 0.02 * drift(s, 8),
      look: [clamp(-4 - dx / 90, -9, 2), clamp(dy / 40, -6, 7)], pupil: 0.62, blink: blink(s, [5.2, 12.4], 0.28),
      earL: gesture(s, 3.2, 3.8, 0.14) * -0.25, earR: gesture(s, 9.1, 9.7, 0.14) * 0.3,
    });
    ctx.restore();
    grade(ctx, 'fish', { x: 720, y: 440, r: 1000, warm: [120, 220, 214], wa: 0.42, cool: [40, 40, 90], ca: 0.45, screen: 0.07 });
  },
};
