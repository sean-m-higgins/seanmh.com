// Scene 5 · rain — afternoon rain. The Russian blue and the black cat sit side
// by side on a window seat, backs to us, watching the rain run down the glass
// and the street lights blur beyond it. Their tails sway out of step; one ear
// turns. Bars 17–20.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, soft, grade, setLight, bush, vine, leaf, drift, gesture, smooth, span, clamp,
  shadeOf, lightOf, INK, rd, mul32,
} from './kit.js';
import { COATS, back } from './cats.js';

const RAINY = { x: 0.1, y: -1, warm: [214, 226, 240], cool: [50, 52, 80], k: 1 };
const WIN = [110, 60, 970, 640]; // x0, y0, x1, y1 of the glass
const SEAT_Y = 700;

function street(g, R) {
  // a wet street in grey-blue, warm lights blooming
  g.fillStyle = vgrad(g, 0, 700, [[0, hex('#6f7f96')], [0.6, hex('#8d97a6')], [1, hex('#59606f')]]);
  g.fillRect(0, 0, SIZE, 720);
  // buildings across the street
  let x = 60;
  while (x < 1020) {
    const w = rd(R, 120, 220), h = rd(R, 300, 520);
    g.fillStyle = css(mix(hex('#4f5a6c'), hex('#6c6a78'), R()));
    g.fillRect(x, 560 - h, w, h + 160);
    for (let wy = 590 - h; wy < 500; wy += 50) for (let wx = x + 16; wx < x + w - 24; wx += 40) {
      g.fillStyle = R() < 0.35 ? css(hex('#ffc977'), 0.9) : css(hex('#3d4556'));
      g.fillRect(wx, wy, 22, 30);
    }
    x += w + rd(R, 6, 20);
  }
  // a shop front glowing at street level
  g.fillStyle = css(hex('#ffcf8a')); g.fillRect(280, 500, 260, 90);
  g.fillStyle = css(hex('#a65a4a')); g.fill(poly([[260, 490], [560, 490], [540, 520], [280, 520]]));
  // the wet road with reflections
  g.fillStyle = vgrad(g, 580, 720, [[0, hex('#3e4656')], [1, hex('#2d3240')]]);
  g.fillRect(0, 580, SIZE, 140);
  for (let i = 0; i < 10; i++) { g.fillStyle = css(hex('#ffcf8a'), 0.35); g.fillRect(rd(R, 200, 600), 590 + i * 12, rd(R, 30, 120), 4); }
  // street lamps
  for (const lx of [180, 760]) {
    g.strokeStyle = css(hex('#2a2e3a')); g.lineWidth = 8;
    g.beginPath(); g.moveTo(lx, 640); g.lineTo(lx, 260); g.stroke();
    g.fillStyle = css(hex('#fff0c8')); g.fill(ellipse(lx, 250, 18, 14));
  }
  // an umbrella crossing, a dot of red
  g.fillStyle = css(hex('#c45050')); g.fill(ellipse(640, 560, 40, 20));
}

function bokeh(g, R) {
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 40; i++) {
    const x = rd(R, WIN[0], WIN[2]), y = rd(R, 200, 640), r = rd(R, 10, 34);
    const c = R() < 0.7 ? [255, 206, 140] : [170, 200, 255];
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, css(c, 0.5)); gr.addColorStop(0.8, css(c, 0.3)); gr.addColorStop(1, css(c, 0));
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const lx of [180, 760]) {
    const gr = g.createRadialGradient(lx, 250, 0, lx, 250, 120);
    gr.addColorStop(0, 'rgba(255,230,170,0.85)'); gr.addColorStop(1, 'rgba(255,230,170,0)');
    g.fillStyle = gr; g.fillRect(lx - 120, 130, 240, 240);
  }
}

/** Droplets that cling to the glass: tiny lenses, dark rim, bright fleck. */
function droplets(g, R) {
  for (let i = 0; i < 340; i++) {
    const x = rd(R, WIN[0], WIN[2]), y = rd(R, WIN[1], WIN[3]), r = Math.pow(R(), 2.2) * 7 + 1.2;
    g.fillStyle = 'rgba(30,36,50,0.35)'; g.fill(ellipse(x, y + r * 0.2, r, r * 1.1));
    g.fillStyle = 'rgba(220,230,245,0.35)'; g.fill(ellipse(x, y, r * 0.8, r * 0.9));
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill(ellipse(x - r * 0.3, y - r * 0.35, r * 0.25, r * 0.25));
  }
}

function roomLayer(g, R) {
  setLight(RAINY);
  g.drawImage(soft('rain:street', 7, street), 0, 0);
  g.drawImage(soft('rain:bokeh', 3, bokeh), 0, 0);
  // the glass carries a cool sheen
  g.fillStyle = css([150, 170, 200], 0.18);
  g.fillRect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]);
  droplets(g, R);
  // the room around the window: a dim, warm wall
  const wall = new Path2D();
  wall.rect(0, 0, SIZE, SIZE);
  wall.rect(WIN[0] - 10, WIN[1] - 10, WIN[2] - WIN[0] + 20, SEAT_Y - WIN[1] + 10);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, hex('#7a6158')], [0.5, hex('#5b4b4e')], [1, hex('#463c46')]]);
  g.fill(wall, 'evenodd');
  // the frame and mullions
  const wood = hex('#5a3d2e');
  for (const r of [rect(WIN[0] - 24, WIN[1] - 24, WIN[2] - WIN[0] + 48, 26), rect(WIN[0] - 24, WIN[1] - 24, 26, SEAT_Y - WIN[1] + 24), rect(WIN[2] - 2, WIN[1] - 24, 26, SEAT_Y - WIN[1] + 24), rect(530, WIN[1], 20, WIN[3] - WIN[1] + 10), rect(WIN[0], 330, WIN[2] - WIN[0], 16)]) {
    cel(g, r, wood, { sd: 5, hd: 4, hi: hex('#8a6a5a') }); ink(g, r, 2.2, [24, 16, 18]);
  }
  // the inner sill and the window seat cushion
  const sill = rect(WIN[0] - 24, WIN[3], WIN[2] - WIN[0] + 48, SEAT_Y - WIN[3]);
  cel(g, sill, hex('#6d4c3a'), { sd: 6, hd: 0 }); ink(g, sill, 2.2, [24, 16, 18]);
  const cushion = rrect(40, SEAT_Y - 10, 1000, 120, 26);
  cel(g, cushion, hex('#8a6f88'), { sd: 34, hd: 14, hi: hex('#b49ab0') });
  g.save(); g.clip(cushion);
  g.strokeStyle = css(hex('#6f566e'), 0.6); g.lineWidth = 2; g.setLineDash([7, 7]);
  g.strokeRect(58, SEAT_Y + 6, 964, 88);
  g.setLineDash([]);
  for (const bx of [300, 540, 780]) { g.fillStyle = css(hex('#5f4a60')); g.fill(ellipse(bx, SEAT_Y + 50, 6, 5)); }
  g.restore();
  ink(g, cushion, 2.4, [30, 20, 24]);
  // the seat's front and the room floor
  g.fillStyle = vgrad(g, SEAT_Y + 110, SIZE, [[0, hex('#3e3038')], [1, hex('#2c2228')]]);
  g.fillRect(0, SEAT_Y + 110, SIZE, SIZE);
  for (let x = 60; x < SIZE; x += 120) { g.strokeStyle = 'rgba(20,12,16,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, SEAT_Y + 120); g.lineTo(x, SIZE); g.stroke(); }
  // a small plant and a stack of books on the seat at the left
  for (const [y, w, c] of [[SEAT_Y + 8, 130, '#6a7f9a'], [SEAT_Y - 18, 120, '#b0745a'], [SEAT_Y - 40, 110, '#d8c49a']]) {
    const b = rect(80, y - 4, w, 24); cel(g, b, hex(c), { sd: 6, hd: 4 }); ink(g, b, 1.8, [30, 20, 24]);
  }
  bush(g, mul32(88), 940, SEAT_Y - 90, 70, 60, { n: 40, L: 28, W: 11, cols: [hex('#5a7a5a'), hex('#6f8a5a'), hex('#4a6a4e'), hex('#7d9a64')] });
  const pot = P(`M890 ${SEAT_Y - 60} L990 ${SEAT_Y - 60} L976 ${SEAT_Y + 10} L904 ${SEAT_Y + 10} Z`);
  cel(g, pot, hex('#b77a5a'), { sd: 12, hd: 6 }); ink(g, pot, 2.2, [30, 20, 24]);
}

/** Running drops: each slides down in fits, leaving a thin wet trail. */
function runners(ctx, s) {
  const R = mul32(505);
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const x = rd(R, WIN[0] + 20, WIN[2] - 20), period = rd(R, 4, 9), ph = R(), r = rd(R, 3, 6);
    const u = ((s / period + ph) % 1 + 1) % 1;
    // a stick-slip descent: it waits, then runs
    const fall = u + 0.06 * Math.sin(TAU * u * 3);
    const y = WIN[1] + fall * (WIN[3] - WIN[1] + 40) - 20;
    const wig = 4 * Math.sin(u * 13 + i);
    const fade = Math.min(1, u * 8, (1 - u) * 8);
    ctx.strokeStyle = `rgba(210,225,245,${0.28 * fade})`;
    ctx.lineWidth = r * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, Math.max(WIN[1], y - 160));
    ctx.quadraticCurveTo(x + wig * 0.5, y - 80, x + wig, y);
    ctx.stroke();
    ctx.fillStyle = `rgba(30,36,50,${0.4 * fade})`; ctx.fill(ellipse(x + wig, y + 1, r, r * 1.3));
    ctx.fillStyle = `rgba(230,238,250,${0.5 * fade})`; ctx.fill(ellipse(x + wig, y, r * 0.8, r * 1.1));
    ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`; ctx.fill(ellipse(x + wig - r * 0.3, y - r * 0.4, r * 0.3, r * 0.3));
  }
  ctx.restore();
}

/** Rain falling beyond the glass: fine slanting streaks. */
function fallingRain(ctx, s) {
  const R = mul32(606);
  ctx.save();
  ctx.beginPath(); ctx.rect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]); ctx.clip();
  ctx.strokeStyle = 'rgba(220,230,245,0.22)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 120; i++) {
    const x0 = rd(R, WIN[0] - 60, WIN[2]), sp = rd(R, 900, 1300), ph = R();
    const y = ((s * sp / 700 + ph) % 1 + 1) % 1 * (WIN[3] - WIN[1] + 60) + WIN[1] - 30;
    const x = x0 + (y - WIN[1]) * 0.12;
    ctx.moveTo(x, y); ctx.lineTo(x + 3, y + 24);
  }
  ctx.stroke();
  ctx.restore();
}

/** Near and out of focus: a knitted blanket over the seat and a mug of cocoa. */
function near(g, R) {
  setLight({ x: -0.8, y: -0.6, warm: [255, 200, 140], cool: [60, 44, 70], k: 1 });
  const bl = blob([[-40, 860], [200, 820], [520, 880], [760, 840], [1120, 880], [1120, 1120], [-40, 1120]]);
  cel(g, bl, hex('#b5664e'), { sd: 40, hd: 16, hi: hex('#e0946a') });
  g.save(); g.clip(bl);
  g.strokeStyle = css(hex('#8a4a3a'), 0.8); g.lineWidth = 7;
  for (let x = -40; x < 1120; x += 34) { g.beginPath(); for (let y = 820; y < 1120; y += 26) { g.moveTo(x, y); g.lineTo(x + 12, y + 14); g.lineTo(x + 24, y); } g.stroke(); }
  g.restore();
  // the mug, left, catching the lamp
  const m = rrect(90, 860, 120, 140, 18);
  cel(g, m, hex('#e9dfcc'), { sd: 30, hd: 14 }); ink(g, m, 3, [40, 26, 30]);
  g.fillStyle = css(hex('#6a3f2a')); g.fill(ellipse(150, 866, 56, 12));
  const h = new Path2D(); h.moveTo(210, 890); h.bezierCurveTo(260, 890, 260, 960, 210, 960);
  ink(g, h, 16, [40, 26, 30]); ink(g, h, 10, hex('#e9dfcc'));
}

export const rain = {
  id: 'rain',
  draw(ctx, s) {
    setLight(RAINY);
    ctx.drawImage(held('rain:room', roomLayer), 0, 0);
    fallingRain(ctx, s);
    runners(ctx, s);
    // the cats, on the seat, backs to us
    const seat = SEAT_Y + 40;
    for (const [coat, x, k, ph, flip] of [[COATS.blue, 400, 0.82, 0, true], [COATS.black, 680, 0.78, 0.37, false]]) {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = css([90, 70, 100], 0.5);
      ctx.fill(ellipse(x, seat + 4, 120 * k, 18));
      ctx.restore();
      ctx.save();
      ctx.translate(x, seat);
      ctx.scale(k, k);
      back(ctx, coat, {
        flip, breath: 0.5 + 0.5 * Math.sin(TAU * (s / 3.75 + ph)),
        tail: Math.sin(TAU * (s / 6 + ph)) * 0.8,
        tilt: (coat === COATS.blue ? gesture(s, 5.5, 10, 0.8) * -0.14 : gesture(s, 1.5, 4.5, 0.6) * 0.1) + 0.02 * drift(s, 8, ph),
        earL: coat === COATS.black ? gesture(s, 8.2, 9.6, 0.25) * -0.4 : 0,
        earR: coat === COATS.blue ? gesture(s, 11.5, 12.4, 0.2) * 0.3 : 0,
      });
      ctx.restore();
    }
    ctx.drawImage(soft('rain:near', 6, near), 0, 0);
    // the warm lamp from off the left edge rims the room
    glow(ctx, -80, 820, 700, [255, 180, 110], 0.4);
    grade(ctx, 'rain', { x: 540, y: 300, r: 900, warm: [200, 214, 236], wa: 0.35, cool: [60, 50, 80], ca: 0.35, screen: 0.06 });
  },
};
