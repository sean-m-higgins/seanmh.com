// Scene 12 · sunset — the rain has gone east. The black cat sits on the roof
// wall, a silhouette against a huge low sun, her tail hanging and swaying.
// Starlings cross; windows come on across the town one by one; smoke leans
// from a chimney. Bars 49–52.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, gesture, smooth, span, drift, blink, clamp, rd, mul32, steam, bush,
} from './kit.js';

const WALL_Y = 838;
const SUN = [700, 590];
const DARK = [34, 22, 46], RIM = [255, 170, 96];

function sky(g, R) {
  g.fillStyle = vgrad(g, 0, 760, [[0, hex('#4c4384')], [0.3, hex('#a2567e')], [0.58, hex('#ee7f5c')], [0.82, hex('#ffb866')], [1, hex('#ffd98a')]]);
  g.fillRect(0, 0, SIZE, SIZE);
  // the last of the rain cloud, breaking up, lit from underneath
  for (let i = 0; i < 16; i++) {
    const x = rd(R, -60, 1140), y = rd(R, 60, 420), w = rd(R, 130, 330), h = rd(R, 16, 34);
    g.fillStyle = css(mix([104, 74, 130], [150, 84, 126], y / 420), 0.85); g.fill(ellipse(x, y, w, h));
    g.fillStyle = css(mix([255, 150, 120], [255, 196, 130], y / 420), 0.9); g.fill(ellipse(x + 10, y + h * 0.55, w * 0.92, h * 0.42));
  }
}

function skyline(g, R, y0, c, hmin, hmax, wmin, wmax, roofs) {
  let x = -30;
  g.fillStyle = css(c);
  while (x < SIZE + 30) {
    const w = rd(R, wmin, wmax), h = rd(R, hmin, hmax);
    if (roofs && R() < 0.6) g.fill(poly([[x, y0 + 300], [x, y0 - h], [x + w / 2, y0 - h - w * 0.32], [x + w, y0 - h], [x + w, y0 + 300]]));
    else g.fillRect(x, y0 - h, w, h + 300);
    if (R() < 0.5) g.fillRect(x + w * rd(R, 0.15, 0.7), y0 - h - rd(R, 20, 50), rd(R, 10, 18), 60);           // a chimney
    if (R() < 0.25) { g.fillRect(x + w * 0.5, y0 - h - 70, 3, 70); g.fillRect(x + w * 0.5 - 14, y0 - h - 62, 30, 3); } // an aerial
    x += w + rd(R, -4, 14);
  }
}

function town(g, R) {
  g.drawImage(soft('sunset:sky', 3, sky), 0, 0);
  // the sun, enormous and low
  const sg = g.createRadialGradient(SUN[0], SUN[1], 0, SUN[0], SUN[1], 168);
  sg.addColorStop(0, 'rgb(255,246,214)'); sg.addColorStop(0.75, 'rgb(255,226,150)'); sg.addColorStop(1, 'rgb(255,200,120)');
  g.fillStyle = sg; g.fill(ellipse(SUN[0], SUN[1], 168, 168));
  // three depths of roofs, each darker and nearer
  g.drawImage(soft('sunset:far', 2, (h, Rr) => skyline(h, Rr, 650, [176, 96, 120], 30, 130, 40, 100, false)), 0, 0);
  g.fillStyle = vgrad(g, 560, 760, [[0, [255, 190, 120], 0], [1, [255, 170, 110], 0.35]]); g.fillRect(0, 560, SIZE, 200);
  skyline(g, mul32(7), 720, [108, 58, 96], 30, 120, 70, 150, true);
  skyline(g, mul32(9), 800, [62, 36, 72], 20, 90, 110, 220, true);
}

/** Windows that come on across the town, each at its own moment. */
const WINDOWS = (() => {
  const R = mul32(515), out = [];
  for (let i = 0; i < 44; i++) out.push({ x: rd(R, 10, 1070), y: rd(R, 640, 820), w: rd(R, 7, 12), h: rd(R, 10, 16), on: i < 8 ? -9 : rd(R, 0.5, 14) });
  return out;
})();

function wall(g, R) {
  // the roof wall we sit on, its coping catching the sun
  g.fillStyle = css(DARK); g.fillRect(0, WALL_Y, SIZE, SIZE - WALL_Y);
  g.fillStyle = css(RIM); g.fillRect(0, WALL_Y - 3, SIZE, 5);
  g.fillStyle = css([52, 34, 62]); g.fillRect(0, WALL_Y + 2, SIZE, 30);
  g.strokeStyle = css([20, 12, 30], 0.8); g.lineWidth = 2;
  for (let x = 40; x < SIZE; x += 150) { g.beginPath(); g.moveTo(x, WALL_Y + 2); g.lineTo(x, WALL_Y + 32); g.stroke(); }
  // bricks, barely seen
  g.strokeStyle = css([64, 42, 72], 0.7); g.lineWidth = 1.6;
  for (let row = 0; row < 6; row++) {
    const y = WALL_Y + 50 + row * 36;
    g.beginPath(); g.moveTo(0, y); g.lineTo(SIZE, y); g.stroke();
    for (let x = (row % 2) * 55; x < SIZE; x += 110) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 36); g.stroke(); }
  }
  // a chimney stack at the right with two pots, and a herb in a pot at the left
  g.fillStyle = css(DARK);
  g.fillRect(860, 560, 150, 290); g.fillRect(846, 548, 178, 20);
  for (const x of [884, 950]) g.fill(P(`M${x} 548 L${x + 6} 494 L${x + 34} 494 L${x + 40} 548 Z`));
  g.fillStyle = css(RIM); g.fillRect(858, 560, 4, 280); g.fillRect(846, 546, 178, 4);
  for (const x of [884, 950]) g.fillRect(x + 4, 494, 4, 54);
  g.fillStyle = css(DARK);
  g.fill(P('M70 838 L84 770 L176 770 L190 838 Z'));
  for (let i = 0; i < 26; i++) { g.save(); g.translate(130 + rd(R, -30, 30), 772); g.rotate(-Math.PI / 2 + rd(R, -0.9, 0.9)); g.fill(ellipse(rd(R, 30, 80), 0, 20, 8)); g.restore(); }
}

export const CAT = P('M-92 0 C-134 -60 -112 -172 -40 -230 C-30 -258 -22 -280 -12 -290 L-6 -338 L24 -302 L34 -304 L54 -342 L64 -296 C82 -284 98 -262 102 -246 L108 -238 C106 -226 92 -218 76 -214 L60 -204 C72 -160 76 -90 62 -22 L86 -10 C94 0 60 0 40 0 Z');

export const sunset = {
  id: 'sunset',
  draw(ctx, s) {
    ctx.drawImage(held('sunset:town', town), 0, 0);
    // windows coming on
    for (const w of WINDOWS) {
      const a = smooth(span(s, w.on, w.on + 0.4));
      if (a > 0) { ctx.fillStyle = css([255, 214, 130], 0.95 * a); ctx.fillRect(w.x, w.y, w.w, w.h); }
    }
    // starlings: a loose flock crossing right to left, wings beating
    const R = mul32(41);
    ctx.strokeStyle = css([52, 30, 60], 0.9); ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (let i = 0; i < 17; i++) {
      const ox = rd(R, 0, 420), oy = rd(R, -70, 70), ph = R(), k = rd(R, 0.7, 1.2);
      const x = 1240 + ox - s * 86, y = 250 + oy + 26 * Math.sin(s * 0.5 + ph * 6) - (1240 + ox - s * 86 - 540) * 0.06;
      const f = Math.sin(s * 11 + ph * TAU);
      ctx.beginPath(); ctx.moveTo(x - 11 * k, y - f * 7 * k); ctx.quadraticCurveTo(x - 4 * k, y - 2 * k, x, y); ctx.quadraticCurveTo(x + 4 * k, y - 2 * k, x + 11 * k, y - f * 7 * k); ctx.stroke();
    }
    // smoke from a far chimney, leaning on the evening air
    steam(ctx, 420, 640, s, { h: 150, w: 26, a: 0.3, c: [255, 220, 200] });
    ctx.drawImage(held('sunset:wall', wall), 0, 0);

    // the cat on the wall, in profile, looking into the sun
    const cx = 420, k = 1.04;
    const sway = Math.sin(TAU * s / 3.75) * (0.7 + 0.3 * drift(s, 7));
    ctx.save();
    ctx.translate(cx, WALL_Y - 2);
    ctx.scale(k, k * (1 + 0.006 * Math.sin(TAU * s / 3.75)));
    // the tail hangs down the wall behind her
    const tl = new Path2D();
    tl.moveTo(-84, -24); tl.bezierCurveTo(-128, 0, -120 + sway * 10, 70, -112 + sway * 26, 130);
    tl.bezierCurveTo(-108 + sway * 34, 160, -92 + sway * 40, 176, -78 + sway * 40, 168);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = css(RIM); ctx.lineWidth = 27; ctx.stroke(tl);
    ctx.save(); ctx.translate(-3.5, 0); ctx.strokeStyle = css(DARK); ctx.lineWidth = 25; ctx.stroke(tl); ctx.restore();
    // a rim of sun down the side that faces it
    ctx.fillStyle = css(RIM); ctx.fill(CAT);
    ctx.translate(-4.5, 1.5);
    ctx.fillStyle = css(DARK); ctx.fill(CAT);
    // one amber eye, which closes slowly now and then
    const bl = Math.max(blink(s, [3.6, 12.2], 0.34), gesture(s, 7.4, 9.4, 0.5) * 0.7);
    ctx.fillStyle = css([255, 196, 70]);
    ctx.fill(ellipse(70, -266, 9, 8 * (1 - bl) + 0.6, -0.2));
    ctx.fillStyle = css(DARK); ctx.fill(ellipse(73, -266, 3, 6.5 * (1 - bl), -0.1));
    // whiskers catching the light
    ctx.strokeStyle = css(RIM, 0.8); ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(98, -236 + i * 4); ctx.quadraticCurveTo(130, -244 + i * 10, 158, -240 + i * 16); }
    ctx.stroke();
    ctx.restore();

    glow(ctx, SUN[0], SUN[1], 640, [255, 196, 120], 0.5);
    glow(ctx, SUN[0], SUN[1], 240, [255, 240, 200], 0.4);
    grade(ctx, 'sunset', { x: SUN[0], y: SUN[1], r: 1000, warm: [255, 170, 100], wa: 0.4, cool: [70, 40, 100], ca: 0.35, screen: 0.08 });
  },
};
