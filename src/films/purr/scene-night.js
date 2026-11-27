// Scene 8 · night — all four cats asleep together on the sofa: the ginger and
// Sunny curled on the seat, the Russian blue curled at the far end, the black
// cat in a loaf on the sofa's back. A lamp glows; moonlight comes in blue. Four
// breaths at four rhythms. The credit line writes itself small at the very end
// and goes with the dissolve into morning. Bars 29–32.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, leaf, sunPatch, motes, drift, gesture, smooth, span,
  shadeOf, lightOf, INK, rd, mul32,
} from './kit.js';
import { COATS, curl, loaf } from './cats.js';
import { signature } from '../common.js';

const LAMP = { x: -0.8, y: -0.6, warm: [255, 190, 120], cool: [44, 44, 96], k: 1.1 };
const SEAT = 700, SOFA = hex('#3f6a72');
const CREDIT = { size: SIZE, title: 'purr', model: 'claude opus 5.5', year: 2026 };

function nightSky(g, R) {
  g.fillStyle = vgrad(g, 60, 420, [[0, hex('#1b2350')], [1, hex('#3a4a7e')]]);
  g.fillRect(560, 40, 460, 420);
  for (let i = 0; i < 40; i++) { g.fillStyle = css([240, 240, 255], rd(R, 0.3, 0.9)); g.fill(ellipse(rd(R, 580, 1000), rd(R, 60, 330), 1.5, 1.5)); }
  g.fillStyle = css(hex('#f4f0dc')); g.fill(ellipse(880, 140, 34, 34));
  const halo = g.createRadialGradient(880, 140, 0, 880, 140, 140);
  halo.addColorStop(0, 'rgba(220,230,255,0.4)'); halo.addColorStop(1, 'rgba(220,230,255,0)');
  g.fillStyle = halo; g.fillRect(740, 0, 280, 280);
  let x = 560;
  while (x < 1040) { const w = rd(R, 70, 140), h = rd(R, 60, 160); g.fillStyle = css(hex('#141a36')); g.fillRect(x, 470 - h, w, h + 20); if (R() < 0.7) { g.fillStyle = css(hex('#ffcf7a'), 0.8); g.fillRect(x + w * 0.4, 470 - h + 20, 12, 16); } x += w + 6; }
}

function roomLayer(g, R) {
  setLight(LAMP);
  // a dim wall, warm by the lamp, blue toward the window
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, hex('#6a4c44')], [0.45, hex('#3e3444')], [1, hex('#262a44')]]);
  g.fillRect(0, 0, SIZE, SIZE);
  // the window, with its moon
  g.drawImage(soft('night:sky', 2, nightSky), 0, 0);
  for (const r of [rect(546, 26, 488, 18), rect(546, 452, 488, 22), rect(546, 26, 18, 446), rect(1016, 26, 18, 446), rect(782, 40, 12, 420)]) { cel(g, r, hex('#4a4250'), { sd: 3, hd: 2 }); ink(g, r, 2, [16, 12, 20]); }
  // curtains, drawn to either side
  for (const [x0, x1] of [[500, 600], [990, 1080]]) {
    const c = P(`M${x0} 10 L${x1} 10 C${x1 - 10} 200 ${x1 + 10} 400 ${x1} 600 L${x0} 600 C${x0 + 10} 400 ${x0 - 10} 200 ${x0} 10 Z`);
    cel(g, c, hex('#6a4a6a'), { sd: 30, hd: 10 });
    g.save(); g.clip(c); g.strokeStyle = 'rgba(30,20,40,0.5)'; g.lineWidth = 4;
    for (let x = x0 + 20; x < x1; x += 24) { g.beginPath(); g.moveTo(x, 10); g.quadraticCurveTo(x + 6, 300, x, 600); g.stroke(); }
    g.restore(); ink(g, c, 2.2, [20, 14, 24]);
  }
  // a plant in silhouette on the sill
  bush(g, mul32(81), 680, 420, 90, 70, { n: 44, L: 32, W: 12, cols: [hex('#2f4a46'), hex('#3a5a50'), hex('#24403e'), hex('#46665a')] });
  // the floor lamp at the left: a warm drum shade
  const pole = new Path2D(); pole.moveTo(150, 260); pole.lineTo(150, 1000);
  ink(g, pole, 10, [30, 20, 20]); ink(g, pole, 5, hex('#8a6a3a'));
  const shade = P('M70 260 L230 260 L200 120 L100 120 Z');
  cel(g, shade, hex('#f3d9a6'), { sd: 14, hd: 0, shade: hex('#e0b878') }); ink(g, shade, 2.4, [40, 26, 20]);
  // the sofa: back, arms, seat cushions, in deep teal velvet
  const back = rrect(130, 440, 900, 210, 60);
  cel(g, back, SOFA, { sd: 40, hd: 16 }); ink(g, back, 2.6, [16, 14, 20]);
  for (const x of [250, 520, 790]) {
    const c = rrect(x - 110, 470, 250, 190, 40);
    cel(g, c, mix(SOFA, [90, 140, 140], 0.15), { sd: 30, hd: 12 }); ink(g, c, 2, [16, 14, 20], 0.8);
  }
  const seat = rrect(120, SEAT - 40, 920, 120, 30);
  cel(g, seat, mix(SOFA, [90, 140, 140], 0.2), { sd: 20, hd: 16 }); ink(g, seat, 2.6, [16, 14, 20]);
  g.strokeStyle = 'rgba(16,14,20,0.6)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(420, SEAT - 36); g.lineTo(420, SEAT + 76); g.moveTo(730, SEAT - 36); g.lineTo(730, SEAT + 76); g.stroke();
  const front = rect(120, SEAT + 80, 920, 120);
  cel(g, front, shadeOf(SOFA, 0.8), { sd: 0, hd: 0 }); ink(g, front, 2.6, [16, 14, 20]);
  for (const [x, w] of [[40, 130], [1010, 130]]) {
    const arm = rrect(x, 520, w, 300, 50);
    cel(g, arm, SOFA, { sd: 30, hd: 16 }); ink(g, arm, 2.6, [16, 14, 20]);
  }
  // legs and the floor with a rug
  g.fillStyle = vgrad(g, 900, SIZE, [[0, hex('#3a2a2c')], [1, hex('#2a1e22')]]);
  g.fillRect(0, 900, SIZE, 200);
  const rug = P('M-20 960 L1100 960 L1100 1100 L-20 1100 Z');
  g.fillStyle = css(hex('#8a5a4a')); g.fill(rug);
  g.strokeStyle = css(hex('#c99a6a'), 0.6); g.lineWidth = 6; g.beginPath(); g.moveTo(-20, 990); g.lineTo(1100, 990); g.stroke();
  for (const x of [150, 980]) { const l = rect(x, 900, 22, 50); cel(g, l, hex('#4a3020'), { sd: 4, hd: 3 }); ink(g, l, 2); }
  // a knitted throw over the left arm
  const throwP = P('M20 520 C80 500 160 510 190 540 L200 760 C150 780 70 770 30 760 Z');
  cel(g, throwP, hex('#d9c3a0'), { sd: 24, hd: 10 });
  g.save(); g.clip(throwP); g.strokeStyle = css(hex('#b49a74'), 0.8); g.lineWidth = 5;
  for (let x = 20; x < 210; x += 22) { g.beginPath(); for (let y = 500; y < 780; y += 20) { g.moveTo(x, y); g.lineTo(x + 8, y + 10); g.lineTo(x + 16, y); } g.stroke(); }
  g.restore(); ink(g, throwP, 2.2);
  // moonlight across the seat, blue
  sunPatch(g, R, [[600, 470], [1000, 470], [1060, 900], [700, 900]], { a: 0.4, c: [150, 170, 255], blur: 14, bars: [[[780, 470], [800, 470], [890, 900], [866, 900]]] });
}

export const night = {
  id: 'night',
  draw(ctx, s) {
    setLight(LAMP);
    ctx.drawImage(held('night:room', roomLayer), 0, 0);
    const br = (p, ph = 0) => 0.5 + 0.5 * Math.sin(TAU * (s / p + ph));
    // shadows under the sleepers
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(40,40,70,0.45)';
    for (const [x, w] of [[300, 130], [540, 150], [830, 140]]) ctx.fill(ellipse(x, SEAT + 30, w, 22));
    ctx.fill(ellipse(870, 452, 140, 16));
    ctx.restore();
    // the black cat in a loaf along the sofa's back, asleep
    ctx.save(); ctx.translate(870, 452); ctx.scale(0.58, 0.58);
    loaf(ctx, COATS.black, { flip: true, breath: br(4.6, 0.2), mode: 'sleep', yaw: -0.2, tilt: 0.12, tail: 0.15 * Math.sin(TAU * s / 15) });
    ctx.restore();
    // the ginger curled at the left
    ctx.save(); ctx.translate(300, SEAT - 10); ctx.scale(0.62, 0.62);
    curl(ctx, COATS.ginger, { breath: br(4.1, 0.5), earL: gesture(s, 7.2, 7.7, 0.12) * -0.3 });
    ctx.restore();
    // Sunny in the middle, his bob toward the ginger
    ctx.save(); ctx.translate(560, SEAT); ctx.scale(0.66, 0.66);
    curl(ctx, COATS.sunny, { flip: true, breath: br(3.75), earR: gesture(s, 3.4, 3.9, 0.12) * 0.3 });
    ctx.restore();
    // the Russian blue at the far end
    ctx.save(); ctx.translate(830, SEAT - 6); ctx.scale(0.62, 0.62);
    curl(ctx, COATS.blue, { flip: true, breath: br(3.4, 0.3), tail: gesture(s, 9.5, 10.6, 0.25) * Math.sin(TAU * (s - 9.5) * 2) });
    ctx.restore();
    // the lamp's light, and a few motes in it
    glow(ctx, 150, 220, 560, [255, 190, 120], 0.55);
    glow(ctx, 150, 200, 160, [255, 236, 190], 0.6);
    motes(ctx, 88, 24, [40, 100, 360, 500], s, { a: 0.6, c: [255, 220, 170] });
    grade(ctx, 'night', { x: 150, y: 220, r: 1000, warm: [255, 176, 110], wa: 0.5, cool: [30, 30, 80], ca: 0.45, screen: 0.08 });
    // the credit: small, hand-lettered, written out near the end
    const write = smooth(span(s, 10.2, 12.8));
    if (write > 0) signature(ctx, mul32(5), CREDIT, write, { y: 1036, scale: 0.016, color: [246, 226, 196], alpha: 0.78 });
  },
};
