// Scene 7 · dusk — violet evening. The grey-and-white tabby lies in a loaf on
// the kitchen counter by the window. A kettle steams; the string lights over
// the window come on one by one and the cat turns to watch them. Bars 25–28.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, vine, leaf, steam, drift, gesture, blink, smooth, span, clamp,
  shadeOf, lightOf, INK, rd, mul32,
} from './kit.js';
import { COATS, loaf } from './cats.js';

const EVE = { x: 0.55, y: -0.83, warm: [255, 196, 130], cool: [80, 62, 120], k: 1 };
const TOP = 700; // the counter top's front edge
const WIN = [90, 80, 560, 560];

function sky(g, R) {
  g.fillStyle = vgrad(g, WIN[1], WIN[3], [[0, hex('#4b4a86')], [0.45, hex('#9a6f9e')], [0.8, hex('#f0a37e')], [1, hex('#f7c58e')]]);
  g.fillRect(0, 0, 700, 700);
  // first stars
  for (let i = 0; i < 26; i++) { g.fillStyle = css([255, 248, 230], rd(R, 0.4, 0.9)); g.fill(ellipse(rd(R, WIN[0], WIN[2]), rd(R, WIN[1], 300), 1.6, 1.6)); }
  // a crescent moon
  g.fillStyle = css(hex('#fff1cf')); g.fill(ellipse(430, 170, 22, 22));
  g.fillStyle = css(hex('#5a5290')); g.fill(ellipse(442, 162, 20, 20));
  // rooftops and a tree in silhouette, a few windows lit
  let x = 60;
  while (x < 600) {
    const w = rd(R, 80, 150), h = rd(R, 80, 200);
    g.fillStyle = css(hex('#3a3260'));
    g.fill(poly([[x, 600], [x, 560 - h], [x + w / 2, 530 - h], [x + w, 560 - h], [x + w, 600]]));
    for (let k = 0; k < 3; k++) if (R() < 0.6) { g.fillStyle = css(hex('#ffcf7a')); g.fillRect(x + rd(R, 10, w - 24), 570 - h + rd(R, 20, h - 30), 14, 18); }
    x += w + rd(R, 0, 20);
  }
}

function roomLayer(g, R) {
  setLight(EVE);
  g.drawImage(soft('dusk:sky', 1.5, sky), 0, 0);
  // the wall: tile above the counter, plaster above that
  const wall = new Path2D();
  wall.rect(0, 0, SIZE, TOP);
  wall.rect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, hex('#8f7c8e')], [0.6, hex('#c7a99a')], [1, hex('#d9b49a')]]);
  g.fill(wall, 'evenodd');
  // subway tile below the window line
  g.save();
  const tile = new Path2D(); tile.rect(0, 590, SIZE, TOP - 590);
  g.clip(tile);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, hex('#a7a3b4')], [1, hex('#efe3d2')]]); g.fillRect(0, 590, SIZE, 120);
  g.strokeStyle = 'rgba(120,100,120,0.5)'; g.lineWidth = 2;
  for (let row = 0; row < 4; row++) { const y = 590 + row * 28; g.beginPath(); g.moveTo(0, y); g.lineTo(SIZE, y); g.stroke(); for (let x = (row % 2) * 40; x < SIZE; x += 80) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 28); g.stroke(); } }
  g.restore();
  // the window frame
  for (const r of [rect(WIN[0] - 20, WIN[1] - 20, WIN[2] - WIN[0] + 40, 22), rect(WIN[0] - 20, WIN[3] - 4, WIN[2] - WIN[0] + 40, 30), rect(WIN[0] - 20, WIN[1] - 20, 22, WIN[3] - WIN[1] + 30), rect(WIN[2] - 2, WIN[1] - 20, 22, WIN[3] - WIN[1] + 30), rect(318, WIN[1], 14, WIN[3] - WIN[1])]) {
    cel(g, r, hex('#efe6da'), { sd: 4, hd: 3 }); ink(g, r, 2.2);
  }
  // a small herb pot and a jar on the window ledge
  bush(g, mul32(71), 170, 520, 60, 50, { n: 36, L: 24, W: 10 });
  const hp = P('M130 560 L210 560 L200 586 L140 586 Z'); cel(g, hp, hex('#c46e3e'), { sd: 8, hd: 5 }); ink(g, hp, 2);
  // open shelves on the right with jars, bowls and a trailing plant
  for (const y of [180, 360]) {
    const sh = rect(640, y, 440, 18);
    cel(g, sh, hex('#b07a4a'), { sd: 5, hd: 4 }); ink(g, sh, 2.2);
  }
  const jars = [[670, 180, 60, 90, '#e8d6a8'], [740, 180, 50, 70, '#c98a5a'], [800, 180, 64, 100, '#a9c0a0'], [880, 180, 40, 60, '#e0b07a'], [940, 180, 70, 80, '#d6d0c0']];
  for (const [x, y, w, h, c] of jars) {
    const j = rrect(x, y - h, w, h, 8); cel(g, j, hex(c), { sd: 10, hd: 6 }); ink(g, j, 2);
    const lid = rect(x - 3, y - h - 10, w + 6, 12); cel(g, lid, hex('#8a6a4a'), { sd: 3, hd: 2 }); ink(g, lid, 1.8);
  }
  for (const [x, w, c] of [[680, 120, '#7e9fb8'], [820, 100, '#e7d2b8'], [940, 110, '#c97b6a']]) {
    const b = P(`M${x} 330 Q${x + w / 2} 380 ${x + w} 330 Z`); cel(g, b, hex(c), { sd: 8, hd: 5 }); ink(g, b, 2);
    g.fillStyle = css(shadeOf(hex(c), 0.6)); g.fill(ellipse(x + w / 2, 330, w / 2, 8)); ink(g, ellipse(x + w / 2, 330, w / 2, 8), 1.8);
  }
  bush(g, mul32(72), 1000, 140, 70, 50, { n: 30, L: 30, W: 12 });
  vine(g, mul32(73), [[1000, 170], [1010, 230], [990, 300], [1000, 360]], { every: 24, L: 28, W: 12 });
  // the counter: butcher block top, cabinets below
  const top = poly([[0, 640], [SIZE, 640], [SIZE, TOP], [0, TOP]]);
  g.fillStyle = vgrad(g, 640, TOP, [[0, hex('#d9a46a')], [1, hex('#c08850')]]); g.fill(top);
  g.save(); g.clip(top); g.strokeStyle = 'rgba(120,70,30,0.35)'; g.lineWidth = 1.4;
  for (let x = 0; x < SIZE; x += 46) { g.beginPath(); g.moveTo(x, 640); g.lineTo(x - 10, TOP); g.stroke(); }
  g.restore(); ink(g, top, 2.4);
  const edge = rect(0, TOP, SIZE, 26); cel(g, edge, hex('#a8703e'), { sd: 4, hd: 0 }); ink(g, edge, 2.2);
  g.fillStyle = vgrad(g, TOP + 26, SIZE, [[0, hex('#4e5a6e')], [1, hex('#3b4456')]]); g.fillRect(0, TOP + 26, SIZE, SIZE);
  for (let x = 20; x < SIZE; x += 270) {
    const d = rrect(x, TOP + 50, 250, 400, 6); g.strokeStyle = 'rgba(20,20,30,0.6)'; g.lineWidth = 2.4; g.stroke(d);
    g.strokeStyle = 'rgba(120,130,150,0.5)'; g.strokeRect(x + 16, TOP + 66, 218, 370);
    const k = rrect(x + 200, TOP + 90, 10, 50, 5); g.fillStyle = css(hex('#c9a36a')); g.fill(k);
  }
  // the kettle on the right of the counter, and a cup waiting
  g.fillStyle = css([40, 20, 30], 0.35); g.fill(ellipse(880, 680, 110, 16));
  const body = P('M800 678 C790 600 820 560 880 560 C940 560 970 600 960 678 Z');
  cel(g, body, hex('#c9534a'), { sd: 24, hd: 12 }); ink(g, body, 2.6);
  const spout = new Path2D(); spout.moveTo(800, 620); spout.quadraticCurveTo(770, 610, 752, 576);
  ink(g, spout, 16, INK); ink(g, spout, 10, hex('#b84a42'));
  const lid = ellipse(880, 562, 40, 9); cel(g, lid, hex('#d9665a'), { sd: 3, hd: 3 }); ink(g, lid, 2.2);
  const knob = ellipse(880, 550, 10, 8); cel(g, knob, hex('#2e2a30'), { sd: 2, hd: 3 }); ink(g, knob, 2);
  const hnd = new Path2D(); hnd.moveTo(830, 566); hnd.bezierCurveTo(840, 500, 920, 500, 930, 566);
  ink(g, hnd, 12, INK); ink(g, hnd, 7, hex('#2e2a30'));
  const cup = rrect(700, 630, 54, 50, 8); cel(g, cup, hex('#e9e2d2'), { sd: 10, hd: 6 }); ink(g, cup, 2.2);
}

// the string of lights: a catenary across the window head, bulbs at fixed points
const BULBS = Array.from({ length: 11 }, (_, i) => {
  const u = i / 10;
  return { x: 60 + u * 560, y: 70 + Math.sin(u * Math.PI) * 60 + (i % 2) * 6, on: 2.0 + ((i * 7) % 11) * 0.62, c: i % 3 === 0 ? [255, 190, 120] : i % 3 === 1 ? [255, 222, 160] : [255, 170, 140] };
});

function lights(ctx, s) {
  const wire = new Path2D();
  wire.moveTo(40, 66);
  for (let i = 0; i <= 20; i++) { const u = i / 20; wire.lineTo(40 + u * 600, 66 + Math.sin(u * Math.PI) * 62); }
  ink(ctx, wire, 2, [50, 40, 50], 0.9);
  for (const b of BULBS) {
    const on = smooth(span(s, b.on, b.on + 0.5));
    const flick = 1 - 0.06 * Math.max(0, Math.sin(s * 7 + b.x));
    if (on > 0) glow(ctx, b.x, b.y + 12, 70, b.c, 0.55 * on * flick);
    const bulb = ellipse(b.x, b.y + 12, 7, 10);
    ctx.fillStyle = css(mix([150, 140, 130], [255, 244, 210], on));
    ctx.fill(bulb);
    ink(ctx, bulb, 1.4, [50, 40, 50], 0.8);
    ctx.fillStyle = css([60, 50, 60]); ctx.fillRect(b.x - 4, b.y, 8, 5);
  }
}

/** A tea towel on a cabinet handle, crisp. */
function towel(g) {
  setLight(EVE);
  const t = P('M478 800 L560 800 C566 880 562 960 568 1010 L470 1010 C476 960 472 880 478 800 Z');
  cel(g, t, hex('#efe4d0'), { sd: 16, hd: 6 });
  g.save(); g.clip(t);
  g.fillStyle = css(hex('#c9534a'), 0.85);
  for (const y of [840, 870, 960]) g.fillRect(460, y, 120, 10);
  g.restore();
  ink(g, t, 2.2);
  const fold = rrect(470, 786, 100, 26, 8); cel(g, fold, hex('#e4d6bf'), { sd: 6, hd: 4 }); ink(g, fold, 2.2);
}

/** A bowl of lemons on the counter at the left, crisp, catching the last light. */
function near(g, R) {
  setLight(EVE);
  const bx = 96, by = 694;
  g.fillStyle = css([70, 40, 50], 0.3); g.fill(ellipse(bx + 14, by + 2, 104, 12));
  for (const [x, y, a] of [[bx - 44, by - 58, 0.3], [bx + 40, by - 60, -0.4], [bx - 2, by - 78, 0.1], [bx + 4, by - 50, 0.5]]) {
    const l = blob([[x - 34, y], [x - 16, y - 20], [x + 18, y - 20], [x + 36, y - 2], [x + 16, y + 20], [x - 18, y + 20]]);
    g.save(); g.translate(x, y); g.rotate(a); g.translate(-x, -y);
    cel(g, l, hex('#efc64a'), { sd: 10, hd: 6 }); ink(g, l, 2.2);
    g.restore();
  }
  const bowl = P(`M${bx - 92} ${by - 56} Q${bx} ${by + 50} ${bx + 92} ${by - 56} Z`);
  cel(g, bowl, hex('#4f7a8a'), { sd: 16, hd: 8 }); ink(g, bowl, 2.4);
  const foot = rect(bx - 28, by - 10, 56, 10);
  cel(g, foot, hex('#44697a'), { sd: 3, hd: 0 }); ink(g, foot, 2.2);
  g.save(); g.clip(bowl); g.strokeStyle = css([236, 244, 240], 0.6); g.lineWidth = 3;
  g.beginPath(); g.moveTo(bx - 100, by - 40); g.quadraticCurveTo(bx, by + 44, bx + 100, by - 40); g.stroke();
  g.restore();
}

export const dusk = {
  id: 'dusk',
  draw(ctx, s) {
    setLight(EVE);
    ctx.drawImage(held('dusk:room', roomLayer), 0, 0);
    // the lights warm the room as they come on
    const lit = smooth(span(s, 2, 9));
    lights(ctx, s);
    if (lit > 0) glow(ctx, 340, 120, 520, [255, 190, 120], 0.22 * lit);
    steam(ctx, 752, 566, s, { h: 140, w: 16, a: 0.5 });
    // the cat on the counter, facing left, watching the lights
    const cx = 430, cy = 690, k = 0.86;
    // which bulb is newest: the cat's gaze steps toward it
    let target = BULBS[0];
    for (const b of BULBS) if (s >= b.on - 0.1 && b.on >= target.on) target = s >= target.on ? b : target;
    const watching = smooth(span(s, 1.6, 2.6)) * (1 - smooth(span(s, 11.5, 13)));
    const hx = cx - 92 * k, hy = cy - 212 * k;
    const yaw = watching * clamp((target.x - hx) / 500, -0.4, 0.4) - 0.15 * (1 - watching);
    const tilt = watching * clamp((target.y - hy) / 1600, -0.22, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = css([150, 100, 120], 0.45);
    ctx.fill(ellipse(cx + 40, cy + 2, 210 * k, 18));
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    loaf(ctx, COATS.grey, {
      breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75),
      yaw, tilt, look: [clamp((target.x - hx) / 70, -6, 6) * watching, -4 * watching], pupil: 0.65,
      tail: 0.5 * Math.sin(TAU * s / 4.2) + 0.5 * gesture(s, 6, 7.2, 0.3),
      blink: blink(s, [4.4, 13.6], 0.34) + gesture(s, 13.2, 14.6, 0.4) * 0.4,
      earL: gesture(s, 2.2, 2.8, 0.15) * 0.3, earR: gesture(s, 8.1, 8.7, 0.15) * -0.25,
    });
    ctx.restore();
    ctx.drawImage(held('dusk:towel', towel), 0, 0);
    ctx.drawImage(held('dusk:near', near), 0, 0);
    grade(ctx, 'dusk', { x: 900, y: 0, r: 1200, warm: [255, 180, 110], wa: 0.4, cool: [70, 50, 110], ca: 0.35 });
  },
};
