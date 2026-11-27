// Scene 17 · house — the whole house from the garden, under the stars. Smoke
// from the stove goes straight up; fireflies drift over the grass; one cat is
// a small shape in an upstairs window. A star falls. Bars 69–72.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, gesture, smooth, span, drift, clamp, rd, mul32, steam, stars, twinkle, shadow,
} from './kit.js';
import { CAT } from './scene-sunset.js';

const MOON = [836, 196];
const GROUND = 770;
const NIGHT = [22, 28, 60];

function sky(g, R) {
  g.fillStyle = vgrad(g, 0, GROUND, [[0, hex('#0c1234')], [0.55, hex('#1c2a5c')], [1, hex('#3d5080')]]);
  g.fillRect(0, 0, SIZE, SIZE);
  stars(g, R, 0, 0, SIZE, 700, 260);
  // the Milky Way: a faint band of dust
  g.save(); g.translate(540, 300); g.rotate(-0.5);
  const mw = g.createLinearGradient(0, -130, 0, 130);
  mw.addColorStop(0, 'rgba(150,170,230,0)'); mw.addColorStop(0.5, 'rgba(150,170,230,0.16)'); mw.addColorStop(1, 'rgba(150,170,230,0)');
  g.fillStyle = mw; g.fillRect(-900, -130, 1800, 260);
  g.restore();
  for (const [x, y, w] of [[240, 420, 240], [700, 500, 300], [960, 380, 160]]) { g.fillStyle = css([60, 76, 126], 0.6); g.fill(ellipse(x, y, w, 14)); }
}

function land(g, R) {
  g.drawImage(soft('house:sky', 1.2, sky), 0, 0);
  // the moon and its halo
  const halo = g.createRadialGradient(MOON[0], MOON[1], 0, MOON[0], MOON[1], 260);
  halo.addColorStop(0, 'rgba(200,214,255,0.4)'); halo.addColorStop(1, 'rgba(200,214,255,0)');
  g.fillStyle = halo; g.fillRect(MOON[0] - 260, MOON[1] - 260, 520, 520);
  g.fillStyle = css(hex('#f3efda')); g.fill(ellipse(MOON[0], MOON[1], 58, 58));
  g.fillStyle = css([214, 210, 196], 0.7);
  for (const [dx, dy, r] of [[-18, -14, 13], [16, 10, 9], [-6, 24, 7], [22, -22, 6]]) g.fill(ellipse(MOON[0] + dx, MOON[1] + dy, r, r));
  // far hills, the town's lights along the valley
  g.fillStyle = css(hex('#22305c')); g.fill(blob([[-20, 800], [-20, 640], [160, 600], [360, 640], [600, 610], [820, 650], [1100, 620], [1100, 800]]));
  for (let i = 0; i < 46; i++) { g.fillStyle = css([255, 214, 140], rd(R, 0.5, 0.95)); g.fillRect(rd(R, 0, SIZE), rd(R, 652, 700), 3, 3); }
  g.fillStyle = css(hex('#18244a')); g.fill(blob([[-20, 800], [-20, 700], [240, 680], [540, 716], [800, 690], [1100, 720], [1100, 800]]));
  // the ground: a lawn sloping to us, moonlit
  g.fillStyle = vgrad(g, GROUND - 30, SIZE, [[0, hex('#24405a')], [0.5, hex('#1c3448')], [1, hex('#14263a')]]);
  g.fill(blob([[-20, SIZE + 20], [-20, GROUND - 6], [300, GROUND - 24], [700, GROUND - 16], [1100, GROUND + 6], [1100, SIZE + 20]]));

  // a big tree at the right, its crown catching the moon
  const trunk = P('M930 800 C936 700 920 620 944 540 L978 540 C990 620 984 700 996 800 Z');
  g.fillStyle = css([18, 20, 44]); g.fill(trunk);
  for (let i = 0; i < 70; i++) {
    const a = rd(R, 0, TAU), r = Math.sqrt(R());
    const x = 960 + Math.cos(a) * 200 * r, y = 440 + Math.sin(a) * 150 * r;
    g.fillStyle = css(mix([20, 34, 58], [70, 100, 140], Math.max(0, -Math.sin(a) * r * 0.6 + (x < 960 ? -0.2 : 0.1)))); g.fill(ellipse(x, y, rd(R, 34, 60), rd(R, 26, 44)));
  }

  // --- the house
  const wallC = hex('#3a4268'), wallD = hex('#2a3152');
  // the side wall, in shade, then the front
  g.fillStyle = css(wallD); g.fill(poly([[250, GROUND], [250, 500], [330, 440], [330, GROUND - 6]]));
  const fr = rect(330, 460, 360, GROUND - 466);
  g.fillStyle = css(wallC); g.fill(fr);
  // clapboards
  g.strokeStyle = css([20, 24, 50], 0.35); g.lineWidth = 1.4;
  for (let y = 474; y < GROUND; y += 16) { g.beginPath(); g.moveTo(330, y); g.lineTo(690, y); g.stroke(); }
  ink(g, fr, 2.2, [14, 16, 36]);
  // the roof and the chimney
  const roof = poly([[300, 470], [510, 318], [720, 470]]);
  g.fillStyle = css(hex('#2a2f4e')); g.fill(roof);
  g.fillStyle = css(hex('#5a6690')); g.fill(poly([[510, 318], [720, 470], [700, 470], [510, 334]]));
  ink(g, roof, 2.2, [14, 16, 36]);
  g.fillStyle = css(hex('#222744')); g.fill(poly([[250, 500], [300, 470], [510, 318], [460, 352]]));
  const chim = rect(600, 330, 44, 96);
  g.fillStyle = css(hex('#4a3f58')); g.fill(chim); g.fillStyle = css(hex('#7a6a84')); g.fillRect(636, 330, 8, 96); ink(g, chim, 2, [14, 16, 36]);
  g.fillStyle = css(hex('#3a3048')); g.fillRect(594, 322, 56, 12);
  // the door and a step
  const door = rrect(480, 640, 70, 124, [8, 8, 0, 0]);
  g.fillStyle = css(hex('#7a4a44')); g.fill(door); ink(g, door, 2, [14, 16, 36]);
  g.fillStyle = css([255, 214, 140]); g.fill(ellipse(536, 706, 3.4, 3.4));
  g.fillStyle = css(hex('#5a6080')); g.fillRect(466, 762, 98, 10);
}

/** The lit windows, their frames, and the light they spill. Held. */
function windows(g) {
  const win = (x, y, w, h, c = [255, 210, 130]) => {
    const r = rect(x, y, w, h);
    g.fillStyle = vgrad(g, y, y + h, [[0, mix(c, [255, 240, 200], 0.4)], [1, c]]); g.fill(r);
    return r;
  };
  const frame = (x, y, w, h) => {
    g.strokeStyle = css([20, 22, 46]); g.lineWidth = 5; g.strokeRect(x, y, w, h);
    g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
    g.fillStyle = css(hex('#c9cce0')); g.fillRect(x - 6, y + h, w + 12, 6);
  };
  win(370, 500, 90, 100); win(560, 500, 90, 100); win(366, 640, 84, 90, [255, 190, 110]); win(580, 640, 84, 90);
  // curtains in the downstairs windows
  g.fillStyle = css([200, 120, 90], 0.6);
  for (const x of [580, 644]) g.fillRect(x, 640, 20, 90);
  frame(370, 500, 90, 100); frame(560, 500, 90, 100); frame(366, 640, 84, 90); frame(580, 640, 84, 90);
  // light on the grass under the windows, and the porch lamp
  for (const [x, w] of [[408, 150], [622, 150]]) {
    const gr = g.createRadialGradient(x, GROUND + 30, 0, x, GROUND + 30, w);
    gr.addColorStop(0, 'rgba(255,200,120,0.3)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.save(); g.translate(x, GROUND + 30); g.scale(1, 0.4); g.translate(-x, -(GROUND + 30)); g.fillStyle = gr; g.fillRect(x - w, GROUND + 30 - w, w * 2, w * 2); g.restore();
  }
}

function front(g, R) {
  // stepping stones to the door
  for (const [x, y, rx] of [[520, 800, 30], [540, 846, 40], [520, 902, 52], [548, 968, 66], [520, 1050, 84]]) { g.fillStyle = css(hex('#4a5a78')); g.fill(ellipse(x, y, rx, rx * 0.36)); g.fillStyle = css(hex('#6a7c9c'), 0.6); g.fill(ellipse(x + 3, y - 2, rx * 0.8, rx * 0.22)); }
  // flowers asleep in the grass
  for (let i = 0; i < 60; i++) {
    const x = rd(R, 0, SIZE), y = rd(R, 800, 1000), k = 0.6 + (y - 800) / 300;
    if (Math.abs(x - 530) < 90) continue;
    g.strokeStyle = css([30, 60, 70]); g.lineWidth = 2 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rd(R, -4, 4), y - 22 * k); g.stroke();
    g.fillStyle = css(R() < 0.5 ? [170, 186, 230] : [200, 150, 170], 0.8); g.fill(ellipse(x, y - 24 * k, 5 * k, 5 * k));
  }
  // the garden fence along the bottom, pale in the moonlight, its gate open
  const pale = hex('#8a98bc');
  g.fillStyle = css(shadeMoon(pale, 0.3)); g.fillRect(0, 970, 400, 14); g.fillRect(680, 970, 400, 14); g.fillRect(0, 1040, 400, 14); g.fillRect(680, 1040, 400, 14);
  for (let x = -6; x < SIZE; x += 56) {
    if (x > 380 && x < 680) continue;
    const p = poly([[x, 1090], [x, 940], [x + 20, 918], [x + 40, 940], [x + 40, 1090]]);
    g.fillStyle = css(mix(pale, NIGHT, rd(R, 0.1, 0.3))); g.fill(p);
    g.fillStyle = css([190, 204, 240], 0.5); g.fill(poly([[x + 30, 932], [x + 40, 940], [x + 40, 1090], [x + 30, 1090]]));
    ink(g, p, 2, [14, 16, 36]);
  }
}
const shadeMoon = (c, t) => mix(c, NIGHT, t);

/** Fireflies: each wanders its own slow loop and glows in pulses. */
function fireflies(ctx, s) {
  const R = mul32(909);
  for (let i = 0; i < 20; i++) {
    const x0 = rd(R, 40, 1040), y0 = rd(R, 790, 960), p1 = rd(R, 5, 9), p2 = rd(R, 3, 6), ph = R();
    const x = x0 + 46 * Math.sin(TAU * (s / p1 + ph)) + 16 * Math.sin(TAU * (s / p2 + ph * 3));
    const y = y0 + 24 * Math.sin(TAU * (s / p2 + ph * 2)) - 40 * (0.5 + 0.5 * Math.sin(TAU * (s / 7.5 + ph)));
    const on = Math.pow(Math.max(0, Math.sin(TAU * (s / (2 + ph * 1.5) + ph * 5))), 2);
    if (on < 0.03) continue;
    glow(ctx, x, y, 34, [214, 255, 130], 0.9 * on);
    ctx.fillStyle = css([240, 255, 190], on); ctx.fill(ellipse(x, y, 2.4, 2.4));
  }
}

export const house = {
  id: 'house',
  draw(ctx, s) {
    ctx.drawImage(held('house:land', land), 0, 0);
    // stars that turn, and one that falls
    const R = mul32(31);
    for (let i = 0; i < 16; i++) {
      const x = rd(R, 20, 1060), y = rd(R, 20, 420);
      ctx.fillStyle = css([255, 248, 230], 0.9 * twinkle(s, i, 2.2)); ctx.fill(ellipse(x, y, 2.4, 2.4));
    }
    const fall = span(s, 6.1, 6.9);
    if (fall > 0 && fall < 1) {
      const x = 180 + fall * 260, y = 90 + fall * 130;
      ctx.strokeStyle = lgrad(ctx, x - 110, y - 55, x, y, [[0, [255, 250, 236], 0], [1, [255, 250, 236], 0.95 * Math.sin(Math.PI * fall)]]);
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 110, y - 55); ctx.lineTo(x, y); ctx.stroke();
    }
    // smoke from the stove's chimney
    steam(ctx, 622, 326, s * 0.7, { h: 190, w: 22, a: 0.34, c: [190, 200, 236] });
    ctx.drawImage(held('house:windows', windows), 0, 0);
    // a cat in the upstairs window, small and dark against the light; her tail tip moves
    ctx.save();
    ctx.translate(590, 599);
    ctx.scale(0.2, 0.2);
    const tw = Math.sin(TAU * s / 3.75);
    const tl = new Path2D(); tl.moveTo(-84, -24); tl.bezierCurveTo(-170, -30, -200, -60 - tw * 20, -190 - tw * 10, -110 - tw * 30);
    ctx.strokeStyle = css([34, 26, 44]); ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.stroke(tl);
    ctx.fillStyle = css([34, 26, 44]); ctx.fill(CAT);
    ctx.restore();
    // window glow
    for (const [x, y] of [[415, 550], [605, 550], [408, 685], [622, 685]]) glow(ctx, x, y, 120, [255, 200, 120], 0.3);
    glow(ctx, 515, 630, 60, [255, 220, 150], 0.5);
    ctx.fillStyle = css([255, 236, 190]); ctx.fill(ellipse(515, 630, 5, 6));
    ctx.drawImage(held('house:front', front), 0, 0);
    fireflies(ctx, s);
    glow(ctx, MOON[0], MOON[1], 620, [150, 170, 255], 0.2);
    grade(ctx, 'house', { x: MOON[0], y: MOON[1], r: 1100, warm: [160, 180, 255], wa: 0.3, cool: [16, 18, 50], ca: 0.4, screen: 0.05 });
  },
};
