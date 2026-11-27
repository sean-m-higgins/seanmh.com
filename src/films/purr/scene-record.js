// Scene 14 · record — evening, lamps on. A record turns on the player and the
// Russian blue sits beside it, its head going round with the label. It puts
// out a paw to stop it, and doesn't. The amplifier's needle nods on the beat.
// Bars 57–60.

import {
  SIZE, TAU, hex, css, mix, P, poly, rect, rrect, ellipse, blob, cel, ink, glow, vgrad, lgrad,
  held, grade, setLight, gesture, smooth, span, drift, blink, clamp, shadeOf, lightOf, INK, rd, mul32,
  shadow, lit, motes, woodGrain, vine, pot, bush,
} from './kit.js';
import { COATS, sit } from './cats.js';

const EVE = { x: 0.74, y: -0.56, warm: [255, 204, 136], cool: [62, 40, 84], k: 1.05 };
const WALL = hex('#a8644e'), TEAK = hex('#a9683e');
const TOP0 = 590, TOP1 = 668; // the back and front edge of the console's top
const REC = [606, 566, 148, 47]; // the record: centre, radii

function room(g, R) {
  setLight(EVE);
  g.fillStyle = lgrad(g, 0, 0, SIZE, 0, [[0, shadeOf(WALL, 1.1)], [0.6, WALL], [1, lightOf(WALL, 0.5)]]);
  g.fillRect(0, 0, SIZE, SIZE);
  // a wall shelf with a trailing plant, top left
  const sh = rect(40, 190, 300, 14);
  cel(g, sh, TEAK, { sd: 4, hd: 0 }); ink(g, sh, 2.2);
  pot(g, 130, 190, 86, 70, [214, 196, 170]);
  bush(g, mul32(3), 130, 110, 70, 50, { n: 36, L: 34, W: 14, lit: 0.3 });
  vine(g, mul32(4), [[150, 150], [190, 220], [200, 300], [184, 380], [200, 450]], { every: 26, L: 34, W: 15, lit: 0.2 });
  vine(g, mul32(5), [[104, 150], [70, 230], [60, 320]], { every: 26, L: 32, W: 14, lit: 0.1 });
  // record sleeves leaning on the wall along the shelf: plain shapes, no words
  const sleeve = (x, y, sz, a, c, art) => {
    g.save(); g.translate(x, y); g.rotate(a);
    const p = rect(0, -sz, sz, sz); cel(g, p, hex(c), { sd: 6, hd: 0 }); 
    g.save(); g.clip(p); art(g, sz); g.restore(); ink(g, p, 2.2);
    g.restore();
  };
  sleeve(214, 190, 116, -0.06, '#e8d8b8', (h, z) => { h.fillStyle = css(hex('#c9584a')); h.fill(ellipse(z / 2, -z / 2, z * 0.3, z * 0.3)); h.fillStyle = css(hex('#2f4858')); h.fillRect(0, -z * 0.22, z, z * 0.08); });
  // the floor: a dark rug
  g.fillStyle = vgrad(g, 940, SIZE, [[0, hex('#4a3038')], [1, hex('#38242c')]]); g.fillRect(0, 940, SIZE, 140);
  g.fillStyle = css(hex('#7a4a44')); g.fillRect(0, 990, SIZE, 90);
  g.strokeStyle = css(hex('#c99a6a'), 0.5); g.lineWidth = 5; g.beginPath(); g.moveTo(0, 1012); g.lineTo(SIZE, 1012); g.stroke();

  // --- the console: legs, the case, an open bay of records, two doors
  shadow(g, ellipse(540, 952, 520, 22), [60, 30, 50], 0.5, 4);
  for (const x of [80, 960]) { const leg = P(`M${x} 900 L${x + 34} 900 L${x + 24} 962 L${x + 10} 962 Z`); cel(g, leg, shadeOf(TEAK, 0.5), { sd: 5, hd: 0 }); ink(g, leg, 2.2); }
  const front = rect(40, TOP1 + 18, 1000, 890 - TOP1);
  cel(g, front, TEAK, { sd: 16, hd: 0 }); woodGrain(g, R, front, 40, TOP1 + 18, 1000, 240, { c: [80, 40, 24], a: 0.3, gap: 7 }); ink(g, front, 2.6);
  const bay = rect(390, TOP1 + 42, 300, 196);
  g.fillStyle = css(hex('#3a2420')); g.fill(bay);
  g.save(); g.clip(bay);
  const spines = ['#c9584a', '#e8d8b8', '#3f6d7a', '#d9a441', '#6b4a6e', '#7a8f5a', '#e8dcc0', '#2f4858', '#b5533c', '#d8c49a'];
  let x = 398;
  while (x < 686) { const w = rd(R, 5, 10); g.fillStyle = css(mix(hex(spines[(R() * spines.length) | 0]), [40, 24, 30], 0.2)); g.fillRect(x, TOP1 + 56 + rd(R, 0, 8), w, 190); x += w + 1.5; }
  g.fillStyle = vgrad(g, TOP1 + 42, TOP1 + 100, [[0, [20, 10, 14], 0.6], [1, [20, 10, 14], 0]]); g.fillRect(390, TOP1 + 42, 300, 60);
  g.restore(); ink(g, bay, 2.2);
  for (const dx of [60, 710]) {
    const d = rect(dx, TOP1 + 42, 310, 196); ink(g, d, 1.8, shadeOf(TEAK, 2.2), 0.85);
    const pull = rrect(dx + (dx < 400 ? 270 : 16), TOP1 + 120, 12, 44, 6); cel(g, pull, hex('#3a2420'), { sd: 0, hd: 0 }); ink(g, pull, 1.6);
  }
  // the top, seen a little from above
  const top = poly([[60, TOP0], [1020, TOP0], [1056, TOP1], [24, TOP1]]);
  cel(g, top, lightOf(TEAK, 0.22), { sd: 0, hd: 0 }); woodGrain(g, R, top, 24, TOP0, 1040, 80, { c: [80, 40, 24], a: 0.26, gap: 6 }); ink(g, top, 2.6);
  const edge = rect(24, TOP1, 1032, 20);
  cel(g, edge, shadeOf(TEAK, 0.3), { sd: 5, hd: 0 }); ink(g, edge, 2.4);

  // the amplifier at the right: a dial, a meter (its needle is drawn live), two valves
  shadow(g, poly([[826, 652], [1010, 652], [990, 664], [806, 664]]), [70, 30, 40], 0.4, 3);
  const amp = rrect(836, 566, 178, 86, 8);
  cel(g, amp, hex('#3a3438'), { sd: 10, hd: 4, hi: hex('#6a6068') }); ink(g, amp, 2.4, [20, 14, 18]);
  const meter = rrect(852, 584, 78, 50, 5);
  g.fillStyle = css(hex('#f3dfa8')); g.fill(meter); ink(g, meter, 1.8, [20, 14, 18]);
  g.strokeStyle = css(INK, 0.6); g.lineWidth = 1.2;
  for (let k = 0; k <= 8; k++) { const a = -Math.PI * 0.78 + k * Math.PI * 0.07; g.beginPath(); g.moveTo(891 + Math.cos(a) * 32, 634 + Math.sin(a) * 32); g.lineTo(891 + Math.cos(a) * 38, 634 + Math.sin(a) * 38); g.stroke(); }
  g.fillStyle = css(hex('#b5483c')); g.fillRect(912, 598, 12, 3);
  const knob = ellipse(972, 610, 20, 20);
  cel(g, knob, hex('#d9d2c8'), { sd: 6, hd: 3 }); ink(g, knob, 2, [20, 14, 18]); ink(g, P('M972 610 L984 598'), 2.6, [20, 14, 18]);
  for (const vx of [868, 912, 956]) {
    const v = P(`M${vx - 11} 566 L${vx - 11} 530 C${vx - 11} 514 ${vx + 11} 514 ${vx + 11} 530 L${vx + 11} 566 Z`);
    g.fillStyle = css([255, 214, 150], 0.35); g.fill(v); ink(g, v, 1.8, [40, 24, 24]);
  }

  // the record player's plinth and platter (the record itself turns, so it is drawn live)
  shadow(g, poly([[390, 650], [836, 650], [820, 662], [380, 662]]), [70, 30, 40], 0.4, 3);
  const pf = rect(404, 618, 420, 34);
  cel(g, pf, hex('#7a4a30'), { sd: 6, hd: 0 }); ink(g, pf, 2.4);
  const pt = poly([[432, 506], [796, 506], [824, 618], [404, 618]]);
  cel(g, pt, hex('#8f5a3a'), { sd: 0, hd: 0 }); woodGrain(g, R, pt, 404, 506, 420, 112, { c: [60, 30, 20], a: 0.3, gap: 6 }); ink(g, pt, 2.4);
  const plat = ellipse(REC[0], REC[1] + 5, REC[2] + 8, REC[3] + 4);
  cel(g, plat, hex('#b9b4b0'), { sd: 4, hd: 0 }); ink(g, plat, 2.2);
}

function disc(ctx, s) {
  const [cx, cy, rx, ry] = REC;
  const lp = ellipse(cx, cy, rx, ry);
  ctx.fillStyle = 'rgb(34,26,32)'; ctx.fill(lp);
  ctx.save(); ctx.clip(lp);
  // grooves, and the lamp's reflection: a bright wedge that stays put while the record turns
  ctx.strokeStyle = 'rgba(120,104,116,0.5)'; ctx.lineWidth = 1;
  for (let k = 0.42; k < 0.98; k += 0.07) { ctx.beginPath(); ctx.ellipse(cx, cy, rx * k, ry * k, 0, 0, TAU); ctx.stroke(); }
  for (const [a0, w, al] of [[-0.5, 0.34, 0.34], [2.64, 0.3, 0.2]]) {
    const g = ctx.createConicGradient(a0 - w, cx, cy);
    g.addColorStop(0, 'rgba(255,220,170,0)'); g.addColorStop(w / TAU, `rgba(255,220,170,${al})`); g.addColorStop((2 * w) / TAU, 'rgba(255,220,170,0)'); g.addColorStop(1, 'rgba(255,220,170,0)');
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.translate(-cx, -cy); ctx.fillStyle = g; ctx.fillRect(cx - rx, cy - rx, rx * 2, rx * 2); ctx.restore();
  }
  ctx.restore();
  ink(ctx, lp, 2, [16, 10, 14]);
  // the label turns at 33 and a third
  const a = TAU * s * (100 / 3 / 60);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.rotate(a);
  const lab = ellipse(0, 0, rx * 0.34, rx * 0.34);
  ctx.fillStyle = css(hex('#d9744a')); ctx.fill(lab);
  ctx.save(); ctx.clip(lab);
  ctx.fillStyle = css(hex('#f1dfb6')); ctx.fillRect(-60, -6, 120, 12);
  ctx.fillStyle = css(hex('#2f4858')); ctx.fill(ellipse(26, -22, 9, 9));
  ctx.restore();
  ink(ctx, lab, 1.6, [30, 18, 20]);
  ctx.fillStyle = css([220, 214, 206]); ctx.fill(ellipse(0, 0, 5, 5));
  ctx.restore();
  // the tone arm rides the record, rising and falling a hair on a warp
  const lift = Math.sin(a) * 1.3;
  const arm = new Path2D(); arm.moveTo(770, 528); arm.lineTo(700, 548 + lift); arm.lineTo(676, 566 + lift);
  ink(ctx, arm, 9, [30, 20, 22]); ink(ctx, arm, 5, hex('#d9d2c8'));
  const headS = rrect(660, 560 + lift, 26, 14, 3);
  cel(ctx, headS, hex('#3a3438'), { sd: 0, hd: 0 }); ink(ctx, headS, 1.6, [20, 14, 18]);
  const pivot = ellipse(770, 528, 17, 13);
  cel(ctx, pivot, hex('#c9c2b8'), { sd: 4, hd: 2 }); ink(ctx, pivot, 2, [20, 14, 18]);
}

export const record = {
  id: 'record',
  draw(ctx, s) {
    setLight(EVE);
    ctx.drawImage(held('record:room', room), 0, 0);
    disc(ctx, s);
    const beat = s * (64 / 60);
    // the meter's needle kicks on each beat and falls back
    const fb = beat - Math.floor(beat);
    const kick = Math.exp(-fb * 3.2) * (Math.floor(beat) % 2 ? 0.7 : 1) + 0.08 * Math.sin(s * 9);
    const na = -Math.PI * 0.76 + kick * Math.PI * 0.42;
    ink(ctx, new Path2D(`M891 634 L${891 + Math.cos(na) * 36} ${634 + Math.sin(na) * 36}`), 1.8, [30, 18, 20]);
    // the valves glow and breathe
    for (const [i, vx] of [[0, 868], [1, 912], [2, 956]]) glow(ctx, vx, 546, 26, [255, 150, 70], 0.55 + 0.12 * Math.sin(s * 2.1 + i * 2));

    // the cat, at the left of the player; its head goes round with the label
    const rot = TAU * s * (100 / 3 / 60);
    const reach = gesture(s, 8.4, 11.4, 0.6);
    const cx = 250, cy = TOP1 - 8, k = 0.7;
    shadow(ctx, poly([[cx - 110, cy + 2], [cx + 110, cy + 2], [cx - 40, cy + 22], [cx - 250, cy + 22]]), [80, 36, 50], 0.4, 3);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    sit(ctx, COATS.blue, {
      flip: true, breath: 0.5 + 0.5 * Math.sin(TAU * s / 3.75),
      yaw: -0.36 - 0.07 * Math.cos(rot), tilt: 0.09 + 0.05 * Math.sin(rot),
      look: [-6 - 3 * Math.cos(rot), 7 + 2.5 * Math.sin(rot)], pupil: 0.5 + reach * 0.3,
      blink: blink(s, [4.6, 13.1], 0.3), paw: reach * (0.62 + 0.1 * Math.sin(TAU * s * 1.1)),
      tail: 0.8 * Math.sin(TAU * s / 3.75), earL: 0.16 * gesture(s, 2.4, 3.0, 0.15), earR: -0.2 * gesture(s, 12.2, 12.8, 0.15),
    });
    ctx.restore();

    // the pendant lamp at the top right, and its pool of light
    const shade = P('M830 150 C836 80 964 80 970 150 Z');
    ink(ctx, P('M900 -10 L900 90'), 4, [30, 20, 22]);
    cel(ctx, shade, hex('#e2a35a'), { sd: 12, hd: 0, shade: hex('#c27a3c') }); ink(ctx, shade, 2.4, [40, 24, 20]);
    ctx.fillStyle = css([255, 244, 210]); ctx.fill(ellipse(900, 150, 62, 9));
    glow(ctx, 900, 170, 620, [255, 196, 120], 0.5);
    glow(ctx, 900, 160, 150, [255, 240, 200], 0.55);
    motes(ctx, 52, 26, [640, 160, 440, 400], s, { a: 0.6, c: [255, 226, 180] });
    grade(ctx, 'record', { x: 900, y: 180, r: 1050, warm: [255, 176, 100], wa: 0.5, cool: [50, 30, 70], ca: 0.42, screen: 0.08 });
  },
};
